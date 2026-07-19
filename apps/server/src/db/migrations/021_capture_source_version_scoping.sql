-- 021_capture_source_version_scoping.sql
-- Created On: 2026-07-19

-- UP:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM capture_schema.capture_session LIMIT 1) THEN
    RAISE EXCEPTION 'Refusing Capture Project Version migration while Capture Sessions exist; reset and reseed through migration 021' USING ERRCODE = '55000';
  END IF;
END;
$$;

ALTER TABLE capture_schema.capture_session
  ADD COLUMN project_version_id VARCHAR(26) NOT NULL;

ALTER TABLE capture_schema.capture_session
  ADD CONSTRAINT fk_capture_session_project_version_scope
  FOREIGN KEY (project_version_id, project_id, organization_id)
  REFERENCES project_schema.project_version(id, project_id, organization_id)
  ON DELETE RESTRICT,
  ADD CONSTRAINT uq_capture_session_id_project_organization
  UNIQUE (id, project_id, organization_id);

ALTER TABLE capture_schema.capture_asset
  DROP CONSTRAINT capture_asset_capture_session_id_fkey,
  ADD CONSTRAINT fk_capture_asset_session_scope
  FOREIGN KEY (capture_session_id, project_id, organization_id)
  REFERENCES capture_schema.capture_session(id, project_id, organization_id)
  ON DELETE CASCADE,
  ADD CONSTRAINT uq_capture_asset_id_session_project_organization
  UNIQUE (id, capture_session_id, project_id, organization_id);

ALTER TABLE capture_schema.capture_event
  DROP CONSTRAINT capture_event_capture_session_id_fkey,
  DROP CONSTRAINT capture_event_capture_asset_id_fkey,
  ADD CONSTRAINT fk_capture_event_session_scope
  FOREIGN KEY (capture_session_id, project_id, organization_id)
  REFERENCES capture_schema.capture_session(id, project_id, organization_id)
  ON DELETE CASCADE,
  ADD CONSTRAINT fk_capture_event_asset_scope
  FOREIGN KEY (capture_asset_id, capture_session_id, project_id, organization_id)
  REFERENCES capture_schema.capture_asset(id, capture_session_id, project_id, organization_id);

CREATE INDEX idx_capture_session_version_status_created
  ON capture_schema.capture_session
  (organization_id, project_id, project_version_id, status, created_at DESC, id DESC)
  WHERE is_deleted = FALSE;

COMMENT ON COLUMN capture_schema.capture_session.project_version_id IS
  'Immutable Project Version provenance after capture starts or the first Capture Event/Asset is created.';

CREATE OR REPLACE FUNCTION project_schema.enforce_project_default_mutation_command()
RETURNS TRIGGER AS $$
DECLARE
  selected_command TEXT := current_setting('ossie.audit_command', true);
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF NEW.default_project_version_id IS NOT DISTINCT FROM OLD.default_project_version_id THEN RETURN NEW; END IF;
  IF selected_command <> 'project_version.set_default'
    OR NEW.version <> OLD.version + 1
    OR (to_jsonb(NEW) - ARRAY['default_project_version_id', 'updated_by_id', 'updated_at', 'version'])
      IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['default_project_version_id', 'updated_by_id', 'updated_at', 'version'])
  THEN
    RAISE EXCEPTION 'Project Default change does not match command' USING ERRCODE = '23514', CONSTRAINT = 'project_default_mutation_command_guard';
  END IF;
  PERFORM project_schema.lock_project_version_scope(NEW.id);
  IF NOT EXISTS (
    SELECT 1 FROM project_schema.project_version version_record
    WHERE version_record.id = NEW.default_project_version_id
      AND version_record.project_id = NEW.id
      AND version_record.organization_id = NEW.organization_id
      AND version_record.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Project Default must be an active Version in the same Project' USING ERRCODE = '23514', CONSTRAINT = 'project_default_version_active_guard';
  END IF;
  IF EXISTS (SELECT 1 FROM guide_schema.guide WHERE project_id = NEW.id)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.interactive_demo WHERE project_id = NEW.id)
  THEN
    RAISE EXCEPTION 'Current unscoped content prevents changing the Default Project Version' USING ERRCODE = '23514', CONSTRAINT = 'project_version_legacy_content_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER capture_session_project_version_legacy_content_guard
  ON capture_schema.capture_session;

CREATE FUNCTION capture_schema.enforce_capture_project_version_scope()
RETURNS TRIGGER AS $$
DECLARE
  selected_command TEXT := current_setting('ossie.audit_command', true);
  selected_project_id TEXT;
  selected_organization_id TEXT;
  selected_session_id TEXT;
  selected_version_id TEXT;
  selected_version_status TEXT;
  session_record capture_schema.capture_session%ROWTYPE;
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  selected_project_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.project_id ELSE NEW.project_id END;
  selected_organization_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.organization_id ELSE NEW.organization_id END;
  PERFORM project_schema.lock_project_version_scope(selected_project_id);

  IF TG_TABLE_NAME = 'capture_session' THEN
    IF TG_OP = 'INSERT' THEN
      IF NOT ((NEW.status = 'draft' AND NEW.started_at IS NULL)
        OR (NEW.status = 'capturing' AND NEW.started_at IS NOT NULL)) THEN
        RAISE EXCEPTION 'Capture Session create lifecycle is invalid' USING ERRCODE = '23514', CONSTRAINT = 'capture_session_project_version_guard';
      END IF;
      selected_version_id := NEW.project_version_id;
    ELSIF TG_OP = 'UPDATE' THEN
      SELECT * INTO session_record
      FROM capture_schema.capture_session
      WHERE id = OLD.id AND project_id = OLD.project_id
        AND organization_id = OLD.organization_id
      FOR UPDATE;
      selected_version_id := OLD.project_version_id;

      IF NEW.project_id IS DISTINCT FROM OLD.project_id
        OR NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
        RAISE EXCEPTION 'Capture Session scope is immutable' USING ERRCODE = '23514', CONSTRAINT = 'capture_session_project_version_guard';
      END IF;

      IF NEW.project_version_id IS DISTINCT FROM OLD.project_version_id THEN
        IF selected_command <> 'capture_session.reassign_project_version' THEN
          RAISE EXCEPTION 'Capture Session Project Version requires reassignment command' USING ERRCODE = '23514', CONSTRAINT = 'capture_session_project_version_guard';
        END IF;
        IF OLD.status <> 'draft' OR OLD.started_at IS NOT NULL
          OR EXISTS (SELECT 1 FROM capture_schema.capture_event WHERE capture_session_id = OLD.id)
          OR EXISTS (SELECT 1 FROM capture_schema.capture_asset WHERE capture_session_id = OLD.id)
          OR (to_jsonb(NEW) - ARRAY['project_version_id', 'updated_by_id', 'updated_at', 'version'])
            IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['project_version_id', 'updated_by_id', 'updated_at', 'version'])
        THEN
          RAISE EXCEPTION 'Capture Session Project Version is locked' USING ERRCODE = '23514', CONSTRAINT = 'capture_session_project_version_locked';
        END IF;
        selected_version_id := NEW.project_version_id;
      ELSIF selected_command = 'capture_session.reassign_project_version' THEN
        RAISE EXCEPTION 'Capture Session Project Version is unchanged' USING ERRCODE = '23514', CONSTRAINT = 'capture_session_project_version_unchanged';
      END IF;
    ELSE
      selected_version_id := OLD.project_version_id;
    END IF;
  ELSE
    selected_session_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.capture_session_id ELSE NEW.capture_session_id END;
    SELECT * INTO session_record
    FROM capture_schema.capture_session
    WHERE id = selected_session_id AND project_id = selected_project_id
      AND organization_id = selected_organization_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Capture Session scope is invalid' USING ERRCODE = '23503', CONSTRAINT = 'capture_child_session_scope_guard';
    END IF;
    selected_version_id := session_record.project_version_id;
  END IF;

  SELECT status INTO selected_version_status
  FROM project_schema.project_version
  WHERE id = selected_version_id AND project_id = selected_project_id
    AND organization_id = selected_organization_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project Version scope is invalid' USING ERRCODE = '23503', CONSTRAINT = 'capture_project_version_scope_guard';
  END IF;
  IF selected_version_status <> 'active' THEN
    RAISE EXCEPTION 'Archived Project Versions are read-only' USING ERRCODE = '23514', CONSTRAINT = 'capture_project_version_active_guard';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER capture_session_project_version_guard
  BEFORE INSERT OR UPDATE OR DELETE ON capture_schema.capture_session
  FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_capture_project_version_scope();
CREATE TRIGGER capture_asset_project_version_guard
  BEFORE INSERT OR UPDATE OR DELETE ON capture_schema.capture_asset
  FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_capture_project_version_scope();
CREATE TRIGGER capture_event_project_version_guard
  BEFORE INSERT OR UPDATE OR DELETE ON capture_schema.capture_event
  FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_capture_project_version_scope();

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid_v020;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT, selected_action TEXT,
  selected_actor_type TEXT, selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v020(
    selected_command, selected_action, selected_actor_type, selected_source_type
  ) OR (
    (selected_command, selected_action) IN (
      ('capture_session.reassign_project_version', 'capture_session.project_version_reassigned')
    )
    AND selected_actor_type = 'org_user'
    AND selected_source_type IN ('web', 'api', 'extension', 'import')
  );
$$ LANGUAGE SQL IMMUTABLE;

DROP TRIGGER capture_session_u_audit_ctx ON capture_schema.capture_session;
DROP TRIGGER capture_session_u_audit_evd ON capture_schema.capture_session;
CREATE TRIGGER capture_session_u_audit_ctx
  BEFORE UPDATE ON capture_schema.capture_session FOR EACH ROW
  EXECUTE FUNCTION audit_schema.require_mutation_context(
    'capture_session', 'direct',
    'capture_session.update,capture_session.complete,capture_session.delete,capture_session.reassign_project_version'
  );
CREATE CONSTRAINT TRIGGER capture_session_u_audit_evd
  AFTER UPDATE ON capture_schema.capture_session DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
    'capture_session', 'direct',
    'capture_session.update,capture_session.complete,capture_session.delete,capture_session.reassign_project_version'
  );

REVOKE ALL ON FUNCTION capture_schema.enforce_capture_project_version_scope() FROM PUBLIC;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION capture_schema.enforce_capture_project_version_scope(),
  audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT)
  TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM capture_schema.capture_session LIMIT 1) THEN
    RAISE EXCEPTION 'Refusing Capture Project Version rollback while Capture Sessions exist' USING ERRCODE = '55000';
  END IF;
END;
$$;

DROP TRIGGER capture_event_project_version_guard ON capture_schema.capture_event;
DROP TRIGGER capture_asset_project_version_guard ON capture_schema.capture_asset;
DROP TRIGGER capture_session_project_version_guard ON capture_schema.capture_session;
DROP FUNCTION capture_schema.enforce_capture_project_version_scope();
DROP TRIGGER capture_session_u_audit_evd ON capture_schema.capture_session;
DROP TRIGGER capture_session_u_audit_ctx ON capture_schema.capture_session;
DROP FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v020(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid;

CREATE TRIGGER capture_session_u_audit_ctx
  BEFORE UPDATE ON capture_schema.capture_session FOR EACH ROW
  EXECUTE FUNCTION audit_schema.require_mutation_context(
    'capture_session', 'direct',
    'capture_session.update,capture_session.complete,capture_session.delete'
  );
CREATE CONSTRAINT TRIGGER capture_session_u_audit_evd
  AFTER UPDATE ON capture_schema.capture_session DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
    'capture_session', 'direct',
    'capture_session.update,capture_session.complete,capture_session.delete'
  );

ALTER TABLE capture_schema.capture_event
  DROP CONSTRAINT fk_capture_event_asset_scope,
  DROP CONSTRAINT fk_capture_event_session_scope,
  ADD CONSTRAINT capture_event_capture_session_id_fkey
    FOREIGN KEY (capture_session_id) REFERENCES capture_schema.capture_session(id) ON DELETE CASCADE,
  ADD CONSTRAINT capture_event_capture_asset_id_fkey
    FOREIGN KEY (capture_asset_id) REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL;
ALTER TABLE capture_schema.capture_asset
  DROP CONSTRAINT fk_capture_asset_session_scope,
  DROP CONSTRAINT uq_capture_asset_id_session_project_organization,
  ADD CONSTRAINT capture_asset_capture_session_id_fkey
    FOREIGN KEY (capture_session_id) REFERENCES capture_schema.capture_session(id) ON DELETE CASCADE;
DROP INDEX capture_schema.idx_capture_session_version_status_created;
ALTER TABLE capture_schema.capture_session
  DROP CONSTRAINT fk_capture_session_project_version_scope,
  DROP CONSTRAINT uq_capture_session_id_project_organization,
  DROP COLUMN project_version_id;

CREATE OR REPLACE FUNCTION project_schema.enforce_project_default_mutation_command()
RETURNS TRIGGER AS $$
DECLARE
  selected_command TEXT := current_setting('ossie.audit_command', true);
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF NEW.default_project_version_id IS NOT DISTINCT FROM OLD.default_project_version_id THEN RETURN NEW; END IF;
  IF selected_command <> 'project_version.set_default'
    OR NEW.version <> OLD.version + 1
    OR (to_jsonb(NEW) - ARRAY['default_project_version_id', 'updated_by_id', 'updated_at', 'version'])
      IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['default_project_version_id', 'updated_by_id', 'updated_at', 'version'])
  THEN
    RAISE EXCEPTION 'Project Default change does not match command' USING ERRCODE = '23514', CONSTRAINT = 'project_default_mutation_command_guard';
  END IF;
  PERFORM project_schema.lock_project_version_scope(NEW.id);
  IF NOT EXISTS (
    SELECT 1 FROM project_schema.project_version version_record
    WHERE version_record.id = NEW.default_project_version_id
      AND version_record.project_id = NEW.id
      AND version_record.organization_id = NEW.organization_id
      AND version_record.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Project Default must be an active Version in the same Project' USING ERRCODE = '23514', CONSTRAINT = 'project_default_version_active_guard';
  END IF;
  IF EXISTS (SELECT 1 FROM capture_schema.capture_session WHERE project_id = NEW.id)
    OR EXISTS (SELECT 1 FROM guide_schema.guide WHERE project_id = NEW.id)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.interactive_demo WHERE project_id = NEW.id)
  THEN
    RAISE EXCEPTION 'Current unscoped content prevents changing the Default Project Version' USING ERRCODE = '23514', CONSTRAINT = 'project_version_legacy_content_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER capture_session_project_version_legacy_content_guard
  BEFORE INSERT ON capture_schema.capture_session FOR EACH ROW
  EXECUTE FUNCTION project_schema.lock_project_version_legacy_root_insert();
