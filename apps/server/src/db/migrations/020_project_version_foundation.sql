-- 020_project_version_foundation.sql
-- Created On: 2026-07-19

-- UP:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM project_schema.project LIMIT 1) THEN
    RAISE EXCEPTION 'Refusing Project Version migration while Projects exist; reset and reseed through migration 020' USING ERRCODE = '55000';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS project_schema.project_version (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  slug VARCHAR(100) NOT NULL,
  release_date DATE DEFAULT NULL,
  position INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_project_version_id_project_organization UNIQUE (id, project_id, organization_id),
  CONSTRAINT uq_project_version_project_position UNIQUE (project_id, position) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT fk_project_version_project_organization FOREIGN KEY (project_id, organization_id)
    REFERENCES project_schema.project(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_version_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_version_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_project_version_status CHECK (status IN ('active', 'archived')),
  CONSTRAINT chk_project_version_version CHECK (version > 0),
  CONSTRAINT chk_project_version_position CHECK (position > 0),
  CONSTRAINT chk_project_version_identifiers CHECK (
    length(trim(id)) > 0 AND length(trim(organization_id)) > 0 AND length(trim(project_id)) > 0
  ),
  CONSTRAINT chk_project_version_name CHECK (length(trim(name)) BETWEEN 1 AND 255),
  CONSTRAINT chk_project_version_slug CHECK (
    length(slug) BETWEEN 1 AND 100 AND slug = lower(slug)
    AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

CREATE INDEX idx_project_version_scope_status_position
  ON project_schema.project_version (organization_id, project_id, status, position, id);
CREATE UNIQUE INDEX uq_project_version_project_slug_ci
  ON project_schema.project_version (project_id, lower(slug));

CREATE TABLE IF NOT EXISTS project_schema.project_version_alias (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_project_version_alias_version_scope FOREIGN KEY (project_version_id, project_id, organization_id)
    REFERENCES project_schema.project_version(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_version_alias_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_project_version_alias_identifiers CHECK (
    length(trim(id)) > 0 AND length(trim(organization_id)) > 0
    AND length(trim(project_id)) > 0 AND length(trim(project_version_id)) > 0
  ),
  CONSTRAINT chk_project_version_alias_slug CHECK (
    length(slug) BETWEEN 1 AND 100 AND slug = lower(slug)
    AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

CREATE UNIQUE INDEX uq_project_version_alias_project_slug_ci
  ON project_schema.project_version_alias (project_id, lower(slug));
CREATE INDEX idx_project_version_alias_version_created
  ON project_schema.project_version_alias (organization_id, project_id, project_version_id, created_at, id);

ALTER TABLE project_schema.project
  ADD COLUMN default_project_version_id VARCHAR(26) NOT NULL;
ALTER TABLE project_schema.project
  ADD CONSTRAINT fk_project_default_version_scope
  FOREIGN KEY (default_project_version_id, id, organization_id)
  REFERENCES project_schema.project_version(id, project_id, organization_id)
  ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;

CREATE FUNCTION project_schema.lock_project_version_scope(selected_project_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(selected_project_id, 0));
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION project_schema.enforce_project_version_slug_namespace()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  PERFORM project_schema.lock_project_version_scope(NEW.project_id);
  IF TG_TABLE_NAME = 'project_version' THEN
    IF EXISTS (
      SELECT 1 FROM project_schema.project_version version_record
      WHERE version_record.project_id = NEW.project_id
        AND lower(version_record.slug) = lower(NEW.slug)
        AND version_record.id <> NEW.id
    ) OR EXISTS (
      SELECT 1 FROM project_schema.project_version_alias alias_record
      WHERE alias_record.project_id = NEW.project_id
        AND lower(alias_record.slug) = lower(NEW.slug)
    ) THEN
      RAISE EXCEPTION 'Project Version slug is already reserved' USING ERRCODE = '23505', CONSTRAINT = 'project_version_slug_namespace_guard';
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1 FROM project_schema.project_version version_record
      WHERE version_record.project_id = NEW.project_id
        AND lower(version_record.slug) = lower(NEW.slug)
    ) OR EXISTS (
      SELECT 1 FROM project_schema.project_version_alias alias_record
      WHERE alias_record.project_id = NEW.project_id
        AND lower(alias_record.slug) = lower(NEW.slug)
        AND alias_record.id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Project Version slug is already reserved' USING ERRCODE = '23505', CONSTRAINT = 'project_version_slug_namespace_guard';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_version_slug_namespace_guard
  BEFORE INSERT OR UPDATE OF slug ON project_schema.project_version
  FOR EACH ROW EXECUTE FUNCTION project_schema.enforce_project_version_slug_namespace();
CREATE TRIGGER project_version_alias_slug_namespace_guard
  BEFORE INSERT ON project_schema.project_version_alias
  FOR EACH ROW EXECUTE FUNCTION project_schema.enforce_project_version_slug_namespace();

CREATE FUNCTION project_schema.enforce_project_version_mutation_command()
RETURNS TRIGGER AS $$
DECLARE
  selected_command TEXT := current_setting('ossie.audit_command', true);
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF selected_command NOT IN ('project.create', 'project_version.create')
      OR NEW.status <> 'active' OR NEW.version <> 1
      OR NEW.created_by_id IS DISTINCT FROM NEW.updated_by_id
    THEN
      RAISE EXCEPTION 'Project Version insert does not match command' USING ERRCODE = '23514', CONSTRAINT = 'project_version_mutation_command_guard';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.project_id IS DISTINCT FROM OLD.project_id
    OR NEW.created_by_id IS DISTINCT FROM OLD.created_by_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.version <> OLD.version + 1
  THEN
    RAISE EXCEPTION 'Project Version immutable fields or Row Version changed incorrectly' USING ERRCODE = '23514', CONSTRAINT = 'project_version_mutation_command_guard';
  END IF;

  IF selected_command = 'project_version.update' THEN
    IF NEW.position IS DISTINCT FROM OLD.position OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Project Version update changed lifecycle or order' USING ERRCODE = '23514', CONSTRAINT = 'project_version_mutation_command_guard';
    END IF;
  ELSIF selected_command = 'project_version.reorder' THEN
    IF OLD.status <> 'active' OR NEW.status <> 'active'
      OR NEW.name IS DISTINCT FROM OLD.name OR NEW.description IS DISTINCT FROM OLD.description
      OR NEW.slug IS DISTINCT FROM OLD.slug OR NEW.release_date IS DISTINCT FROM OLD.release_date
    THEN
      RAISE EXCEPTION 'Project Version reorder changed non-order fields' USING ERRCODE = '23514', CONSTRAINT = 'project_version_mutation_command_guard';
    END IF;
  ELSIF selected_command IN ('project_version.archive', 'project_version.restore') THEN
    IF (selected_command = 'project_version.archive' AND NOT (OLD.status = 'active' AND NEW.status = 'archived'))
      OR (selected_command = 'project_version.restore' AND NOT (OLD.status = 'archived' AND NEW.status = 'active'))
      OR NEW.position IS DISTINCT FROM OLD.position OR NEW.name IS DISTINCT FROM OLD.name
      OR NEW.description IS DISTINCT FROM OLD.description OR NEW.slug IS DISTINCT FROM OLD.slug
      OR NEW.release_date IS DISTINCT FROM OLD.release_date
    THEN
      RAISE EXCEPTION 'Project Version lifecycle transition does not match command' USING ERRCODE = '23514', CONSTRAINT = 'project_version_mutation_command_guard';
    END IF;
  ELSE
    RAISE EXCEPTION 'Project Version update command is invalid' USING ERRCODE = '23514', CONSTRAINT = 'project_version_mutation_command_guard';
  END IF;

  IF NEW.status = 'archived' AND EXISTS (
    SELECT 1 FROM project_schema.project project_record
    WHERE project_record.id = NEW.project_id
      AND project_record.organization_id = NEW.organization_id
      AND project_record.default_project_version_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Default Project Version cannot be archived' USING ERRCODE = '23514', CONSTRAINT = 'project_default_version_active_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_version_mutation_command_guard
  BEFORE INSERT OR UPDATE ON project_schema.project_version
  FOR EACH ROW EXECUTE FUNCTION project_schema.enforce_project_version_mutation_command();

CREATE FUNCTION project_schema.enforce_project_version_alias_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF current_setting('ossie.audit_command', true) <> 'project_version.update' THEN
    RAISE EXCEPTION 'Project Version alias requires a slug update command' USING ERRCODE = '23514', CONSTRAINT = 'project_version_alias_provenance_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_version_alias_provenance_guard
  BEFORE INSERT ON project_schema.project_version_alias
  FOR EACH ROW EXECUTE FUNCTION project_schema.enforce_project_version_alias_insert();

CREATE FUNCTION project_schema.verify_project_version_alias_provenance()
RETURNS TRIGGER AS $$
DECLARE
  expected_event_id TEXT := current_setting('ossie.audit_event_id', true);
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM audit_schema.audit_event event
    JOIN audit_schema.audit_change_item item
      ON item.audit_event_id = event.id AND item.organization_id = event.organization_id
    JOIN project_schema.project_version version_record
      ON version_record.id = NEW.project_version_id
      AND version_record.project_id = NEW.project_id
      AND version_record.organization_id = NEW.organization_id
    WHERE event.id = expected_event_id AND event.organization_id = NEW.organization_id
      AND event.actor_org_user_id = NEW.created_by_id
      AND event.action = 'project_version.updated'
      AND item.entity_type = 'project_version' AND item.entity_id = NEW.project_version_id
      AND item.operation = 'update' AND item.field_name = 'slug' AND item.value_type = 'text'
      AND item.before_text_value = NEW.slug AND item.after_text_value = version_record.slug
  ) THEN
    RAISE EXCEPTION 'Project Version alias is not the former canonical slug' USING ERRCODE = '23514', CONSTRAINT = 'project_version_alias_provenance_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER project_version_alias_provenance_evidence_guard
  AFTER INSERT ON project_schema.project_version_alias DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION project_schema.verify_project_version_alias_provenance();

CREATE FUNCTION project_schema.verify_project_version_slug_alias()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) OR NEW.slug IS NOT DISTINCT FROM OLD.slug THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM project_schema.project_version_alias alias_record
    WHERE alias_record.organization_id = NEW.organization_id
      AND alias_record.project_id = NEW.project_id
      AND alias_record.project_version_id = NEW.id
      AND lower(alias_record.slug) = lower(OLD.slug)
  ) THEN
    RAISE EXCEPTION 'Project Version rename must retain the former slug' USING ERRCODE = '23514', CONSTRAINT = 'project_version_alias_provenance_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER project_version_slug_alias_guard
  AFTER UPDATE OF slug ON project_schema.project_version DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION project_schema.verify_project_version_slug_alias();

CREATE FUNCTION project_schema.enforce_project_default_mutation_command()
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

CREATE TRIGGER project_default_mutation_command_guard
  BEFORE UPDATE ON project_schema.project
  FOR EACH ROW EXECUTE FUNCTION project_schema.enforce_project_default_mutation_command();

CREATE FUNCTION project_schema.lock_project_version_legacy_root_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  PERFORM project_schema.lock_project_version_scope(NEW.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER capture_session_project_version_legacy_content_guard
  BEFORE INSERT ON capture_schema.capture_session FOR EACH ROW
  EXECUTE FUNCTION project_schema.lock_project_version_legacy_root_insert();
CREATE TRIGGER guide_project_version_legacy_content_guard
  BEFORE INSERT ON guide_schema.guide FOR EACH ROW
  EXECUTE FUNCTION project_schema.lock_project_version_legacy_root_insert();
CREATE TRIGGER interactive_demo_project_version_legacy_content_guard
  BEFORE INSERT ON interactive_demo_schema.interactive_demo FOR EACH ROW
  EXECUTE FUNCTION project_schema.lock_project_version_legacy_root_insert();

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid_v019;

CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT,
  selected_action TEXT,
  selected_actor_type TEXT,
  selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v019(
    selected_command, selected_action, selected_actor_type, selected_source_type
  ) OR (
    (selected_command, selected_action) IN (
      ('project_version.create', 'project_version.created'),
      ('project_version.update', 'project_version.updated'),
      ('project_version.reorder', 'project_version.reordered'),
      ('project_version.archive', 'project_version.archived'),
      ('project_version.restore', 'project_version.restored'),
      ('project_version.set_default', 'project_version.default_set')
    )
    AND selected_actor_type = 'org_user'
    AND selected_source_type IN ('web', 'api')
  );
$$ LANGUAGE SQL IMMUTABLE;

DROP TRIGGER project_u_audit_evd ON project_schema.project;
DROP TRIGGER project_u_audit_ctx ON project_schema.project;
CREATE TRIGGER project_u_audit_ctx
  BEFORE UPDATE ON project_schema.project FOR EACH ROW
  EXECUTE FUNCTION audit_schema.require_mutation_context('project', 'direct', 'project_version.set_default,project.update,project.delete');
CREATE CONSTRAINT TRIGGER project_u_audit_evd
  AFTER UPDATE ON project_schema.project DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION audit_schema.verify_mutation_evidence('project', 'direct', 'project_version.set_default,project.update,project.delete');

CREATE TRIGGER project_version_i_audit_ctx
  BEFORE INSERT ON project_schema.project_version FOR EACH ROW
  EXECUTE FUNCTION audit_schema.require_mutation_context('project_version', 'direct', 'project.create,project_version.create');
CREATE CONSTRAINT TRIGGER project_version_i_audit_evd
  AFTER INSERT ON project_schema.project_version DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION audit_schema.verify_mutation_evidence('project_version', 'direct', 'project.create,project_version.create');
CREATE TRIGGER project_version_u_audit_ctx
  BEFORE UPDATE ON project_schema.project_version FOR EACH ROW
  EXECUTE FUNCTION audit_schema.require_mutation_context('project_version', 'direct', 'project_version.update,project_version.reorder,project_version.archive,project_version.restore');
CREATE CONSTRAINT TRIGGER project_version_u_audit_evd
  AFTER UPDATE ON project_schema.project_version DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION audit_schema.verify_mutation_evidence('project_version', 'direct', 'project_version.update,project_version.reorder,project_version.archive,project_version.restore');
CREATE TRIGGER project_version_alias_i_audit_ctx
  BEFORE INSERT ON project_schema.project_version_alias FOR EACH ROW
  EXECUTE FUNCTION audit_schema.require_mutation_context('project_version_alias', 'direct', 'project_version.update');
CREATE CONSTRAINT TRIGGER project_version_alias_i_audit_evd
  AFTER INSERT ON project_schema.project_version_alias DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION audit_schema.verify_mutation_evidence('project_version_alias', 'direct', 'project_version.update');

REVOKE ALL ON FUNCTION project_schema.lock_project_version_scope(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION project_schema.enforce_project_version_slug_namespace() FROM PUBLIC;
REVOKE ALL ON FUNCTION project_schema.enforce_project_version_mutation_command() FROM PUBLIC;
REVOKE ALL ON FUNCTION project_schema.enforce_project_version_alias_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION project_schema.verify_project_version_alias_provenance() FROM PUBLIC;
REVOKE ALL ON FUNCTION project_schema.verify_project_version_slug_alias() FROM PUBLIC;
REVOKE ALL ON FUNCTION project_schema.enforce_project_default_mutation_command() FROM PUBLIC;
REVOKE ALL ON FUNCTION project_schema.lock_project_version_legacy_root_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid_v019(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION project_schema.lock_project_version_scope(TEXT),
  audit_schema.mutation_command_policy_is_valid_v019(TEXT, TEXT, TEXT, TEXT),
  audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT)
  TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT, INSERT, UPDATE ON project_schema.project_version TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT, INSERT ON project_schema.project_version_alias TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM project_schema.project LIMIT 1)
    OR EXISTS (SELECT 1 FROM project_schema.project_version LIMIT 1)
    OR EXISTS (SELECT 1 FROM project_schema.project_version_alias LIMIT 1)
    OR EXISTS (SELECT 1 FROM audit_schema.audit_event WHERE action LIKE 'project_version.%' LIMIT 1)
    OR EXISTS (SELECT 1 FROM audit_schema.audit_change_item WHERE entity_type IN ('project_version', 'project_version_alias') LIMIT 1)
    OR EXISTS (SELECT 1 FROM audit_schema.access_event WHERE root_resource_type = 'project_version' LIMIT 1)
  THEN
    RAISE EXCEPTION 'Refusing to remove populated Project Version foundation' USING ERRCODE = '55000';
  END IF;
END;
$$;

DROP TRIGGER project_version_alias_i_audit_evd ON project_schema.project_version_alias;
DROP TRIGGER project_version_alias_i_audit_ctx ON project_schema.project_version_alias;
DROP TRIGGER project_version_u_audit_evd ON project_schema.project_version;
DROP TRIGGER project_version_u_audit_ctx ON project_schema.project_version;
DROP TRIGGER project_version_i_audit_evd ON project_schema.project_version;
DROP TRIGGER project_version_i_audit_ctx ON project_schema.project_version;
DROP TRIGGER project_u_audit_evd ON project_schema.project;
DROP TRIGGER project_u_audit_ctx ON project_schema.project;
CREATE TRIGGER project_u_audit_ctx
  BEFORE UPDATE ON project_schema.project FOR EACH ROW
  EXECUTE FUNCTION audit_schema.require_mutation_context('project', 'direct', 'project.update,project.delete');
CREATE CONSTRAINT TRIGGER project_u_audit_evd
  AFTER UPDATE ON project_schema.project DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION audit_schema.verify_mutation_evidence('project', 'direct', 'project.update,project.delete');
DROP FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v019(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid;

DROP TRIGGER interactive_demo_project_version_legacy_content_guard ON interactive_demo_schema.interactive_demo;
DROP TRIGGER guide_project_version_legacy_content_guard ON guide_schema.guide;
DROP TRIGGER capture_session_project_version_legacy_content_guard ON capture_schema.capture_session;
DROP FUNCTION project_schema.lock_project_version_legacy_root_insert();
DROP TRIGGER project_default_mutation_command_guard ON project_schema.project;
DROP FUNCTION project_schema.enforce_project_default_mutation_command();
DROP TRIGGER project_version_slug_alias_guard ON project_schema.project_version;
DROP FUNCTION project_schema.verify_project_version_slug_alias();
DROP TRIGGER project_version_alias_provenance_evidence_guard ON project_schema.project_version_alias;
DROP FUNCTION project_schema.verify_project_version_alias_provenance();
DROP TRIGGER project_version_alias_provenance_guard ON project_schema.project_version_alias;
DROP FUNCTION project_schema.enforce_project_version_alias_insert();
DROP TRIGGER project_version_mutation_command_guard ON project_schema.project_version;
DROP FUNCTION project_schema.enforce_project_version_mutation_command();
DROP TRIGGER project_version_alias_slug_namespace_guard ON project_schema.project_version_alias;
DROP TRIGGER project_version_slug_namespace_guard ON project_schema.project_version;
DROP FUNCTION project_schema.enforce_project_version_slug_namespace();
ALTER TABLE project_schema.project DROP CONSTRAINT fk_project_default_version_scope;
ALTER TABLE project_schema.project DROP COLUMN default_project_version_id;
DROP TABLE project_schema.project_version_alias;
DROP TABLE project_schema.project_version;
DROP FUNCTION project_schema.lock_project_version_scope(TEXT);
