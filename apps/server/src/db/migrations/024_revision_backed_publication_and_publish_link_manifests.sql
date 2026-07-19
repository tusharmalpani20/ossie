-- 024_revision_backed_publication_and_publish_link_manifests.sql
-- Created On: 2026-07-20

-- UP:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM publish_schema.published_artifact LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.publish_link LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.public_publish_viewer_session LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.published_artifact_capture_asset LIMIT 1)
  THEN
    RAISE EXCEPTION 'Refusing Revision-backed Publication migration while legacy publication data exists; reset and reseed through migration 024'
      USING ERRCODE='55000';
  END IF;
END;
$$;

DROP TRIGGER capture_asset_purge_request_guard ON capture_schema.capture_asset_purge_operation;
DROP FUNCTION capture_schema.enforce_capture_asset_purge_request();

DROP TABLE publish_schema.public_publish_viewer_session;
DROP TABLE publish_schema.published_artifact_capture_asset;
DROP TABLE publish_schema.publish_link;
DROP TABLE publish_schema.published_artifact;

CREATE TABLE publish_schema.published_artifact (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  artifact_type VARCHAR(50) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  publication_sequence INTEGER NOT NULL,
  guide_id VARCHAR(26) DEFAULT NULL,
  guide_edition_id VARCHAR(26) DEFAULT NULL,
  guide_revision_id VARCHAR(26) DEFAULT NULL,
  interactive_demo_id VARCHAR(26) DEFAULT NULL,
  interactive_demo_edition_id VARCHAR(26) DEFAULT NULL,
  interactive_demo_revision_id VARCHAR(26) DEFAULT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_published_artifact_id_scope UNIQUE (id, project_id, organization_id),
  CONSTRAINT uq_published_artifact_guide_scope UNIQUE (id, guide_id, guide_edition_id, project_version_id, project_id, organization_id),
  CONSTRAINT uq_published_artifact_demo_scope UNIQUE (id, interactive_demo_id, interactive_demo_edition_id, project_version_id, project_id, organization_id),
  CONSTRAINT fk_published_artifact_guide_revision FOREIGN KEY
    (guide_revision_id, guide_edition_id, guide_id, project_version_id, project_id, organization_id)
    REFERENCES guide_schema.guide_revision
    (id, guide_edition_id, guide_id, project_version_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_published_artifact_demo_revision FOREIGN KEY
    (interactive_demo_revision_id, interactive_demo_edition_id, interactive_demo_id, project_version_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo_revision
    (id, interactive_demo_edition_id, interactive_demo_id, project_version_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_published_artifact_actor FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_published_artifact_type CHECK (artifact_type IN ('guide','interactive_demo')),
  CONSTRAINT chk_published_artifact_sequence CHECK (publication_sequence > 0),
  CONSTRAINT chk_published_artifact_family CHECK (
    (artifact_type='guide' AND guide_id IS NOT NULL AND guide_edition_id IS NOT NULL AND guide_revision_id IS NOT NULL
      AND interactive_demo_id IS NULL AND interactive_demo_edition_id IS NULL AND interactive_demo_revision_id IS NULL)
    OR
    (artifact_type='interactive_demo' AND interactive_demo_id IS NOT NULL AND interactive_demo_edition_id IS NOT NULL AND interactive_demo_revision_id IS NOT NULL
      AND guide_id IS NULL AND guide_edition_id IS NULL AND guide_revision_id IS NULL)
  )
);

CREATE UNIQUE INDEX uq_published_artifact_guide_sequence
  ON publish_schema.published_artifact(guide_edition_id, publication_sequence)
  WHERE artifact_type='guide';
CREATE UNIQUE INDEX uq_published_artifact_demo_sequence
  ON publish_schema.published_artifact(interactive_demo_edition_id, publication_sequence)
  WHERE artifact_type='interactive_demo';
CREATE INDEX idx_published_artifact_guide_history
  ON publish_schema.published_artifact(guide_edition_id, publication_sequence DESC)
  WHERE artifact_type='guide';
CREATE INDEX idx_published_artifact_demo_history
  ON publish_schema.published_artifact(interactive_demo_edition_id, publication_sequence DESC)
  WHERE artifact_type='interactive_demo';

COMMENT ON TABLE publish_schema.published_artifact IS
  'Immutable non-deletable Publication of one exact type-specific Artifact Revision.';
COMMENT ON COLUMN publish_schema.published_artifact.publication_sequence IS
  'User-visible immutable Publication Sequence scoped to one Artifact Edition.';

CREATE TABLE publish_schema.publish_link (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  artifact_type VARCHAR(50) NOT NULL,
  guide_id VARCHAR(26) DEFAULT NULL,
  interactive_demo_id VARCHAR(26) DEFAULT NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  visibility VARCHAR(50) NOT NULL DEFAULT 'public',
  expires_at TIMESTAMPTZ DEFAULT NULL,
  password_hash TEXT DEFAULT NULL,
  password_salt TEXT DEFAULT NULL,
  password_set_at TIMESTAMPTZ DEFAULT NULL,
  password_updated_at TIMESTAMPTZ DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  revoked_by_id VARCHAR(26) DEFAULT NULL,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_publish_link_slug UNIQUE (slug),
  CONSTRAINT uq_publish_link_id_scope UNIQUE (id, project_id, organization_id),
  CONSTRAINT uq_publish_link_guide_scope UNIQUE (id, guide_id, project_id, organization_id),
  CONSTRAINT uq_publish_link_demo_scope UNIQUE (id, interactive_demo_id, project_id, organization_id),
  CONSTRAINT fk_publish_link_guide FOREIGN KEY (guide_id, project_id, organization_id)
    REFERENCES guide_schema.guide(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_publish_link_demo FOREIGN KEY (interactive_demo_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_publish_link_creator FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_publish_link_revoker FOREIGN KEY (revoked_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_publish_link_type CHECK (artifact_type IN ('guide','interactive_demo')),
  CONSTRAINT chk_publish_link_family CHECK (
    (artifact_type='guide' AND guide_id IS NOT NULL AND interactive_demo_id IS NULL)
    OR (artifact_type='interactive_demo' AND interactive_demo_id IS NOT NULL AND guide_id IS NULL)
  ),
  CONSTRAINT chk_publish_link_name CHECK (length(trim(name)) BETWEEN 1 AND 120),
  CONSTRAINT chk_publish_link_slug CHECK (length(trim(slug)) BETWEEN 1 AND 80),
  CONSTRAINT chk_publish_link_visibility CHECK (visibility IN ('public','restricted')),
  CONSTRAINT chk_publish_link_status CHECK (status IN ('active','revoked')),
  CONSTRAINT chk_publish_link_version CHECK (version > 0),
  CONSTRAINT chk_publish_link_password_fields CHECK (
    (password_hash IS NULL AND password_salt IS NULL AND password_set_at IS NULL AND password_updated_at IS NULL)
    OR (password_hash IS NOT NULL AND password_salt IS NOT NULL AND password_set_at IS NOT NULL AND password_updated_at IS NOT NULL)
  ),
  CONSTRAINT chk_publish_link_revocation CHECK (
    (status='active' AND revoked_by_id IS NULL AND revoked_at IS NULL)
    OR (status='revoked' AND revoked_by_id IS NOT NULL AND revoked_at IS NOT NULL)
  )
);

CREATE INDEX idx_publish_link_guide_created
  ON publish_schema.publish_link(guide_id, created_at DESC, id DESC)
  WHERE artifact_type='guide';
CREATE INDEX idx_publish_link_demo_created
  ON publish_schema.publish_link(interactive_demo_id, created_at DESC, id DESC)
  WHERE artifact_type='interactive_demo';
CREATE INDEX idx_publish_link_public_access
  ON publish_schema.publish_link(slug, expires_at)
  WHERE status='active' AND visibility='public';

COMMENT ON TABLE publish_schema.publish_link IS
  'Stable independently configured multi-version access manifest for one Artifact.';

CREATE TABLE publish_schema.publish_link_entry (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  publish_link_id VARCHAR(26) NOT NULL,
  published_artifact_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  guide_id VARCHAR(26) DEFAULT NULL,
  guide_edition_id VARCHAR(26) DEFAULT NULL,
  interactive_demo_id VARCHAR(26) DEFAULT NULL,
  interactive_demo_edition_id VARCHAR(26) DEFAULT NULL,
  position INTEGER NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_publish_link_entry_version UNIQUE (publish_link_id, project_version_id),
  CONSTRAINT uq_publish_link_entry_position UNIQUE (publish_link_id, position) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT uq_publish_link_entry_id_scope UNIQUE (id, publish_link_id, project_id, organization_id),
  CONSTRAINT fk_publish_link_entry_version FOREIGN KEY (project_version_id, project_id, organization_id)
    REFERENCES project_schema.project_version(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_publish_link_entry_guide_link FOREIGN KEY (publish_link_id, guide_id, project_id, organization_id)
    REFERENCES publish_schema.publish_link(id, guide_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_publish_link_entry_demo_link FOREIGN KEY (publish_link_id, interactive_demo_id, project_id, organization_id)
    REFERENCES publish_schema.publish_link(id, interactive_demo_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_publish_link_entry_guide_publication FOREIGN KEY
    (published_artifact_id, guide_id, guide_edition_id, project_version_id, project_id, organization_id)
    REFERENCES publish_schema.published_artifact
    (id, guide_id, guide_edition_id, project_version_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_publish_link_entry_demo_publication FOREIGN KEY
    (published_artifact_id, interactive_demo_id, interactive_demo_edition_id, project_version_id, project_id, organization_id)
    REFERENCES publish_schema.published_artifact
    (id, interactive_demo_id, interactive_demo_edition_id, project_version_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_publish_link_entry_creator FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_publish_link_entry_updater FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_publish_link_entry_family CHECK (
    (guide_id IS NOT NULL AND guide_edition_id IS NOT NULL AND interactive_demo_id IS NULL AND interactive_demo_edition_id IS NULL)
    OR (interactive_demo_id IS NOT NULL AND interactive_demo_edition_id IS NOT NULL AND guide_id IS NULL AND guide_edition_id IS NULL)
  ),
  CONSTRAINT chk_publish_link_entry_position CHECK (position > 0 AND position <= 50),
  CONSTRAINT chk_publish_link_entry_version CHECK (version > 0)
);

CREATE UNIQUE INDEX uq_publish_link_entry_default
  ON publish_schema.publish_link_entry(publish_link_id) WHERE is_default;
CREATE INDEX idx_publish_link_entry_manifest
  ON publish_schema.publish_link_entry(publish_link_id, position);

CREATE TABLE publish_schema.public_publish_viewer_session (
  id VARCHAR(26) PRIMARY KEY,
  publish_link_id VARCHAR(26) NOT NULL REFERENCES publish_schema.publish_link(id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT uq_public_publish_viewer_session_token_hash UNIQUE (token_hash),
  CONSTRAINT chk_public_publish_viewer_session_expiry CHECK (expires_at > created_at)
);
CREATE INDEX idx_public_publish_viewer_session_link_active
  ON publish_schema.public_publish_viewer_session(publish_link_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE FUNCTION publish_schema.prevent_published_artifact_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN COALESCE(NEW,OLD); END IF;
  RAISE EXCEPTION 'Published Artifacts are immutable and non-deletable'
    USING ERRCODE='23514',CONSTRAINT='published_artifact_immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER published_artifact_immutable_guard BEFORE UPDATE OR DELETE ON publish_schema.published_artifact
  FOR EACH ROW EXECUTE FUNCTION publish_schema.prevent_published_artifact_mutation();
CREATE TRIGGER published_artifact_truncate_guard BEFORE TRUNCATE ON publish_schema.published_artifact
  FOR EACH STATEMENT EXECUTE FUNCTION publish_schema.prevent_published_artifact_mutation();

CREATE FUNCTION publish_schema.enforce_publish_link_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF OLD.organization_id IS DISTINCT FROM NEW.organization_id
    OR OLD.project_id IS DISTINCT FROM NEW.project_id
    OR OLD.artifact_type IS DISTINCT FROM NEW.artifact_type
    OR OLD.guide_id IS DISTINCT FROM NEW.guide_id
    OR OLD.interactive_demo_id IS DISTINCT FROM NEW.interactive_demo_id
    OR OLD.slug IS DISTINCT FROM NEW.slug
  THEN RAISE EXCEPTION 'Publish Link ownership and slug are immutable'
    USING ERRCODE='23514',CONSTRAINT='publish_link_identity_immutable'; END IF;
  IF OLD.status='revoked' OR (OLD.status='active' AND NEW.status NOT IN ('active','revoked'))
  THEN RAISE EXCEPTION 'Invalid Publish Link lifecycle transition'
    USING ERRCODE='23514',CONSTRAINT='publish_link_lifecycle_guard'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER publish_link_mutation_guard BEFORE UPDATE ON publish_schema.publish_link
  FOR EACH ROW EXECUTE FUNCTION publish_schema.enforce_publish_link_mutation();

CREATE FUNCTION publish_schema.enforce_publish_link_entry_write()
RETURNS TRIGGER AS $$
DECLARE link_id TEXT:=COALESCE(NEW.publish_link_id,OLD.publish_link_id); link_status TEXT;
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN COALESCE(NEW,OLD); END IF;
  SELECT status INTO link_status FROM publish_schema.publish_link WHERE id=link_id FOR UPDATE;
  IF link_status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Revoked Publish Link entries are immutable'
    USING ERRCODE='23514',CONSTRAINT='publish_link_entry_revoked_guard'; END IF;
  RETURN COALESCE(NEW,OLD);
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER publish_link_entry_write_guard BEFORE INSERT OR UPDATE OR DELETE ON publish_schema.publish_link_entry
  FOR EACH ROW EXECUTE FUNCTION publish_schema.enforce_publish_link_entry_write();

CREATE FUNCTION publish_schema.verify_publish_link_manifest()
RETURNS TRIGGER AS $$
DECLARE link_id TEXT; invalid BOOLEAN;
BEGIN
  IF TG_TABLE_NAME='publish_link' THEN link_id:=COALESCE(NEW.id,OLD.id);
  ELSE link_id:=COALESCE(NEW.publish_link_id,OLD.publish_link_id); END IF;
  SELECT status='active' AND (
    (SELECT count(*) FROM publish_schema.publish_link_entry entry WHERE entry.publish_link_id=link_id) NOT BETWEEN 1 AND 50
    OR (SELECT count(*) FROM publish_schema.publish_link_entry entry WHERE entry.publish_link_id=link_id AND entry.is_default) <> 1
    OR NOT EXISTS (SELECT 1 FROM publish_schema.publish_link_entry entry WHERE entry.publish_link_id=link_id AND entry.is_default AND entry.position=1)
    OR (SELECT COALESCE(min(position),0)<>1 OR COALESCE(max(position),0)<>count(*) FROM publish_schema.publish_link_entry entry WHERE entry.publish_link_id=link_id)
  ) INTO invalid FROM publish_schema.publish_link WHERE id=link_id;
  IF COALESCE(invalid,FALSE) THEN RAISE EXCEPTION 'Publish Link manifest must be dense, bounded, and have one default at position one'
    USING ERRCODE='23514',CONSTRAINT='publish_link_manifest_guard'; END IF;
  RETURN COALESCE(NEW,OLD);
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER publish_link_manifest_guard AFTER INSERT OR UPDATE ON publish_schema.publish_link
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION publish_schema.verify_publish_link_manifest();
CREATE CONSTRAINT TRIGGER publish_link_entry_manifest_guard AFTER INSERT OR UPDATE OR DELETE ON publish_schema.publish_link_entry
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION publish_schema.verify_publish_link_manifest();

CREATE FUNCTION capture_schema.enforce_capture_asset_purge_request()
RETURNS TRIGGER AS $$
DECLARE asset_file_id TEXT; version_status TEXT;
BEGIN
  IF NEW.status<>'pending' THEN RETURN NEW; END IF;
  SELECT asset.file_id,version.status INTO asset_file_id,version_status
    FROM capture_schema.capture_asset asset
    JOIN capture_schema.capture_session session ON session.id=asset.capture_session_id
    JOIN project_schema.project_version version ON version.id=session.project_version_id
    WHERE asset.id=NEW.capture_asset_id AND asset.project_id=NEW.project_id
      AND asset.organization_id=NEW.organization_id AND asset.status='archived' AND asset.is_deleted=FALSE
    FOR UPDATE OF asset;
  IF asset_file_id IS NULL THEN RAISE EXCEPTION 'Capture Asset cannot be purged'
    USING ERRCODE='23514',CONSTRAINT='capture_asset_purge_protection_guard'; END IF;
  IF version_status<>'active' THEN RAISE EXCEPTION 'Archived Project Versions are read-only'
    USING ERRCODE='23514',CONSTRAINT='capture_asset_purge_version_guard'; END IF;
  IF EXISTS(SELECT 1 FROM capture_schema.capture_asset other WHERE other.file_id=asset_file_id AND other.id<>NEW.capture_asset_id AND other.is_deleted=FALSE)
    OR EXISTS(SELECT 1 FROM guide_schema.guide_step WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND is_deleted=FALSE AND NEW.capture_asset_id IN(source_capture_asset_id,selected_capture_asset_id))
    OR EXISTS(SELECT 1 FROM interactive_demo_schema.demo_scene WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND is_deleted=FALSE AND NEW.capture_asset_id IN(source_capture_asset_id,background_capture_asset_id))
    OR EXISTS(SELECT 1 FROM guide_schema.guide_revision_step WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND NEW.capture_asset_id IN(source_capture_asset_id,selected_capture_asset_id))
    OR EXISTS(SELECT 1 FROM interactive_demo_schema.demo_revision_scene WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND NEW.capture_asset_id IN(source_capture_asset_id,background_capture_asset_id))
    OR EXISTS(SELECT 1 FROM publish_schema.published_artifact publication JOIN guide_schema.guide_revision_step step ON step.guide_revision_id=publication.guide_revision_id WHERE publication.project_id=NEW.project_id AND publication.organization_id=NEW.organization_id AND NEW.capture_asset_id IN(step.source_capture_asset_id,step.selected_capture_asset_id))
    OR EXISTS(SELECT 1 FROM publish_schema.published_artifact publication JOIN interactive_demo_schema.demo_revision_scene scene ON scene.interactive_demo_revision_id=publication.interactive_demo_revision_id WHERE publication.project_id=NEW.project_id AND publication.organization_id=NEW.organization_id AND NEW.capture_asset_id IN(scene.source_capture_asset_id,scene.background_capture_asset_id))
  THEN RAISE EXCEPTION 'Capture Asset is protected' USING ERRCODE='23514',CONSTRAINT='capture_asset_purge_protection_guard'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER capture_asset_purge_request_guard BEFORE INSERT OR UPDATE ON capture_schema.capture_asset_purge_operation
  FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_capture_asset_purge_request();

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT,TEXT,TEXT,TEXT)
  RENAME TO mutation_command_policy_is_valid_v023;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(selected_command TEXT,selected_action TEXT,selected_actor_type TEXT,selected_source_type TEXT)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v023(selected_command,selected_action,selected_actor_type,selected_source_type)
    OR ((selected_command,selected_action) IN (
      ('publish.guide_link.create','guide.publish_link.created'),
      ('publish.interactive_demo_link.create','interactive_demo.publish_link.created'),
      ('publish.guide_link.settings_update','guide.publish_link.settings_updated'),
      ('publish.interactive_demo_link.settings_update','interactive_demo.publish_link.settings_updated'),
      ('publish.guide_link.manifest_update','guide.publish_link.manifest_updated'),
      ('publish.interactive_demo_link.manifest_update','interactive_demo.publish_link.manifest_updated'),
      ('publish.guide_link.entry_rollback','guide.publish_link.entry_rolled_back'),
      ('publish.interactive_demo_link.entry_rollback','interactive_demo.publish_link.entry_rolled_back')
    ) AND selected_actor_type='org_user' AND selected_source_type IN ('web','api','extension'));
$$ LANGUAGE SQL IMMUTABLE;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT,TEXT,TEXT,TEXT) TO __OSSIE_RUNTIME_DB_ROLE__;

CREATE FUNCTION audit_schema.require_delete_mutation_context()
RETURNS TRIGGER AS $$
DECLARE allowed_commands TEXT[]:=string_to_array(TG_ARGV[1],',');
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN OLD; END IF;
  IF COALESCE(current_setting('ossie.audit_event_id',TRUE),'')=''
    OR current_setting('ossie.audit_organization_id',TRUE) IS DISTINCT FROM OLD.organization_id
    OR NOT (current_setting('ossie.audit_command',TRUE)=ANY(allowed_commands))
    OR NOT audit_schema.mutation_command_policy_is_valid(current_setting('ossie.audit_command',TRUE),current_setting('ossie.audit_action',TRUE),current_setting('ossie.audit_actor_type',TRUE),current_setting('ossie.audit_source_type',TRUE))
  THEN RAISE EXCEPTION 'Mutation requires matching Audit context' USING ERRCODE='23514',CONSTRAINT='ossie_audit_guard_context'; END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION audit_schema.verify_delete_mutation_evidence()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN OLD; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM audit_schema.audit_event event
    JOIN audit_schema.audit_change_item item ON item.audit_event_id=event.id AND item.organization_id=event.organization_id
    WHERE event.id=current_setting('ossie.audit_event_id',TRUE)
      AND event.organization_id=OLD.organization_id
      AND event.action=current_setting('ossie.audit_action',TRUE)
      AND item.entity_type=TG_ARGV[0] AND item.entity_id=OLD.id AND item.operation='delete'
  ) THEN RAISE EXCEPTION 'Mutation requires matching committed Audit Evidence' USING ERRCODE='23514',CONSTRAINT='ossie_audit_guard_evidence'; END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE registration RECORD; operation_short TEXT;
BEGIN
  FOR registration IN SELECT * FROM (VALUES
    ('published_artifact','INSERT','published_artifact','publish.guide,publish.interactive_demo'),
    ('publish_link','INSERT','publish_link','publish.guide,publish.interactive_demo,publish.guide_link.create,publish.interactive_demo_link.create'),
    ('publish_link','UPDATE','publish_link','publish.guide,publish.interactive_demo,publish.guide_link.settings_update,publish.interactive_demo_link.settings_update,publish.guide_link.manifest_update,publish.interactive_demo_link.manifest_update,publish.guide_link.entry_rollback,publish.interactive_demo_link.entry_rollback,publish.guide_link.revoke,publish.interactive_demo_link.revoke'),
    ('publish_link_entry','INSERT','publish_link_entry','publish.guide,publish.interactive_demo,publish.guide_link.create,publish.interactive_demo_link.create,publish.guide_link.manifest_update,publish.interactive_demo_link.manifest_update'),
    ('publish_link_entry','UPDATE','publish_link_entry','publish.guide,publish.interactive_demo,publish.guide_link.entry_rollback,publish.interactive_demo_link.entry_rollback'),
    ('public_publish_viewer_session','INSERT','public_publish_viewer_session','publish.viewer_session.create'),
    ('public_publish_viewer_session','UPDATE','public_publish_viewer_session','publish.guide_link.settings_update,publish.interactive_demo_link.settings_update,publish.guide_link.revoke,publish.interactive_demo_link.revoke,publish.viewer_session.touch')
  ) AS entries(table_name,sql_operation,entity_type,commands)
  LOOP
    operation_short:=CASE registration.sql_operation WHEN 'INSERT' THEN 'i' ELSE 'u' END;
    EXECUTE format('CREATE TRIGGER %I BEFORE %s ON publish_schema.%I FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(%L,%L,%L)',registration.table_name||'_'||operation_short||'_audit_ctx',registration.sql_operation,registration.table_name,registration.entity_type,CASE WHEN registration.table_name='public_publish_viewer_session' THEN 'viewer' ELSE 'direct' END,registration.commands);
    EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER %s ON publish_schema.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_mutation_evidence(%L,%L,%L)',registration.table_name||'_'||operation_short||'_audit_evd',registration.sql_operation,registration.table_name,registration.entity_type,CASE WHEN registration.table_name='public_publish_viewer_session' THEN 'viewer' ELSE 'direct' END,registration.commands);
  END LOOP;
END;
$$;

CREATE TRIGGER publish_link_entry_d_audit_ctx BEFORE DELETE ON publish_schema.publish_link_entry
  FOR EACH ROW EXECUTE FUNCTION audit_schema.require_delete_mutation_context('publish_link_entry','publish.guide_link.manifest_update,publish.interactive_demo_link.manifest_update');
CREATE CONSTRAINT TRIGGER publish_link_entry_d_audit_evd AFTER DELETE ON publish_schema.publish_link_entry
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_delete_mutation_evidence('publish_link_entry');

DO $$
DECLARE registration RECORD; operation_short TEXT;
BEGIN
  FOR registration IN SELECT * FROM (VALUES
    ('guide_schema','guide_revision','guide_revision','guide.revision.checkpoint,artifact.carry_forward,publish.guide'),
    ('guide_schema','guide_revision_block','guide_revision_block','guide.revision.checkpoint,artifact.carry_forward,publish.guide'),
    ('guide_schema','guide_revision_step','guide_revision_step','guide.revision.checkpoint,artifact.carry_forward,publish.guide'),
    ('guide_schema','guide_revision_annotation','guide_revision_annotation','guide.revision.checkpoint,artifact.carry_forward,publish.guide'),
    ('interactive_demo_schema','interactive_demo_revision','interactive_demo_revision','interactive_demo.revision.checkpoint,artifact.carry_forward,publish.interactive_demo'),
    ('interactive_demo_schema','demo_revision_scene','demo_revision_scene','interactive_demo.revision.checkpoint,artifact.carry_forward,publish.interactive_demo'),
    ('interactive_demo_schema','demo_revision_hotspot','demo_revision_hotspot','interactive_demo.revision.checkpoint,artifact.carry_forward,publish.interactive_demo'),
    ('interactive_demo_schema','demo_revision_transition','demo_revision_transition','interactive_demo.revision.checkpoint,artifact.carry_forward,publish.interactive_demo')
  ) AS entries(schema_name,table_name,entity_type,commands)
  LOOP
    EXECUTE format('DROP TRIGGER %I ON %I.%I',registration.table_name||'_i_audit_ctx',registration.schema_name,registration.table_name);
    EXECUTE format('DROP TRIGGER %I ON %I.%I',registration.table_name||'_i_audit_evd',registration.schema_name,registration.table_name);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT ON %I.%I FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(%L,%L,%L)',registration.table_name||'_i_audit_ctx',registration.schema_name,registration.table_name,registration.entity_type,'direct',registration.commands);
    EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER INSERT ON %I.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_mutation_evidence(%L,%L,%L)',registration.table_name||'_i_audit_evd',registration.schema_name,registration.table_name,registration.entity_type,'direct',registration.commands);
  END LOOP;
END;
$$;

GRANT SELECT,INSERT ON publish_schema.published_artifact TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT,UPDATE ON publish_schema.publish_link,publish_schema.public_publish_viewer_session TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT,UPDATE,DELETE ON publish_schema.publish_link_entry TO __OSSIE_RUNTIME_DB_ROLE__;
REVOKE ALL ON FUNCTION audit_schema.require_delete_mutation_context() FROM PUBLIC;
REVOKE ALL ON FUNCTION audit_schema.verify_delete_mutation_evidence() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_schema.require_delete_mutation_context(),audit_schema.verify_delete_mutation_evidence() TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT EXECUTE ON FUNCTION publish_schema.prevent_published_artifact_mutation(),publish_schema.enforce_publish_link_mutation(),publish_schema.enforce_publish_link_entry_write(),publish_schema.verify_publish_link_manifest(),capture_schema.enforce_capture_asset_purge_request() TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM publish_schema.published_artifact LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.publish_link LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.publish_link_entry LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.public_publish_viewer_session LIMIT 1)
  THEN RAISE EXCEPTION 'Refusing to roll back populated Revision-backed Publication schema' USING ERRCODE='55000'; END IF;
END;
$$;

DROP TRIGGER capture_asset_purge_request_guard ON capture_schema.capture_asset_purge_operation;
DROP FUNCTION capture_schema.enforce_capture_asset_purge_request();
DROP FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT,TEXT,TEXT,TEXT);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v023(TEXT,TEXT,TEXT,TEXT)
  RENAME TO mutation_command_policy_is_valid;
DROP FUNCTION audit_schema.verify_delete_mutation_evidence();
DROP FUNCTION audit_schema.require_delete_mutation_context();
DROP TABLE publish_schema.public_publish_viewer_session;
DROP TABLE publish_schema.publish_link_entry;
DROP TABLE publish_schema.publish_link;
DROP TABLE publish_schema.published_artifact;
DROP FUNCTION publish_schema.verify_publish_link_manifest();
DROP FUNCTION publish_schema.enforce_publish_link_entry_write();
DROP FUNCTION publish_schema.enforce_publish_link_mutation();
DROP FUNCTION publish_schema.prevent_published_artifact_mutation();

CREATE TABLE publish_schema.published_artifact (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  artifact_type VARCHAR(50) NOT NULL,
  artifact_id VARCHAR(26) NOT NULL,
  version_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  snapshot_json JSONB NOT NULL,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_published_artifact_type CHECK (artifact_type IN ('guide','interactive_demo')),
  CONSTRAINT chk_published_artifact_version_positive CHECK (version_number>=1),
  CONSTRAINT chk_published_artifact_title_not_empty CHECK (length(trim(title))>0),
  CONSTRAINT uq_published_artifact_source_version UNIQUE (organization_id,artifact_type,artifact_id,version_number),
  CONSTRAINT uq_published_artifact_scope UNIQUE (id,project_id,organization_id)
);
CREATE INDEX idx_published_artifact_source_created ON publish_schema.published_artifact(organization_id,artifact_type,artifact_id,published_at DESC);

CREATE TABLE publish_schema.publish_link (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  artifact_type VARCHAR(50) NOT NULL,
  artifact_id VARCHAR(26) NOT NULL,
  published_artifact_id VARCHAR(26) NOT NULL REFERENCES publish_schema.published_artifact(id) ON DELETE RESTRICT,
  slug VARCHAR(80) NOT NULL UNIQUE,
  visibility VARCHAR(50) NOT NULL DEFAULT 'public',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  revoked_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  password_hash TEXT DEFAULT NULL,password_salt TEXT DEFAULT NULL,password_set_at TIMESTAMPTZ DEFAULT NULL,password_updated_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT chk_publish_link_artifact_type CHECK (artifact_type IN ('guide','interactive_demo')),
  CONSTRAINT chk_publish_link_visibility CHECK (visibility IN ('public','restricted')),
  CONSTRAINT chk_publish_link_status CHECK (status IN ('active','revoked')),
  CONSTRAINT chk_publish_link_slug_not_empty CHECK (length(trim(slug))>0),
  CONSTRAINT chk_publish_link_password_fields CHECK ((password_hash IS NULL AND password_salt IS NULL AND password_set_at IS NULL AND password_updated_at IS NULL) OR (password_hash IS NOT NULL AND password_salt IS NOT NULL AND password_set_at IS NOT NULL AND password_updated_at IS NOT NULL))
);
CREATE UNIQUE INDEX uq_publish_link_active_source ON publish_schema.publish_link(organization_id,artifact_type,artifact_id) WHERE status='active';
CREATE INDEX idx_publish_link_slug_active ON publish_schema.publish_link(slug) WHERE status='active';
CREATE INDEX idx_publish_link_project_created ON publish_schema.publish_link(project_id,created_at DESC);
CREATE INDEX idx_publish_link_public_access ON publish_schema.publish_link(slug,expires_at) WHERE status='active' AND visibility='public';

CREATE TABLE publish_schema.public_publish_viewer_session (
  id VARCHAR(26) PRIMARY KEY,
  publish_link_id VARCHAR(26) NOT NULL REFERENCES publish_schema.publish_link(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT chk_public_publish_viewer_session_expiry CHECK (expires_at>created_at)
);
CREATE INDEX idx_public_publish_viewer_session_link_active ON publish_schema.public_publish_viewer_session(publish_link_id,expires_at) WHERE revoked_at IS NULL;

CREATE TABLE publish_schema.published_artifact_capture_asset (
  id VARCHAR(26) PRIMARY KEY,
  published_artifact_id VARCHAR(26) NOT NULL,
  capture_asset_id VARCHAR(26) NOT NULL,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  CONSTRAINT uq_published_artifact_capture_asset UNIQUE(published_artifact_id,capture_asset_id),
  CONSTRAINT fk_published_asset_projection_publication FOREIGN KEY(published_artifact_id,project_id,organization_id) REFERENCES publish_schema.published_artifact(id,project_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_published_asset_projection_asset FOREIGN KEY(capture_asset_id,project_id,organization_id) REFERENCES capture_schema.capture_asset(id,project_id,organization_id) ON DELETE RESTRICT
);

CREATE FUNCTION capture_schema.enforce_capture_asset_purge_request()
RETURNS TRIGGER AS $$
DECLARE asset_file_id TEXT; version_status TEXT;
BEGIN
  IF NEW.status<>'pending' THEN RETURN NEW; END IF;
  SELECT asset.file_id,version.status INTO asset_file_id,version_status FROM capture_schema.capture_asset asset JOIN capture_schema.capture_session session ON session.id=asset.capture_session_id JOIN project_schema.project_version version ON version.id=session.project_version_id WHERE asset.id=NEW.capture_asset_id AND asset.project_id=NEW.project_id AND asset.organization_id=NEW.organization_id AND asset.status='archived' AND asset.is_deleted=FALSE FOR UPDATE OF asset;
  IF asset_file_id IS NULL THEN RAISE EXCEPTION 'Capture Asset cannot be purged' USING ERRCODE='23514',CONSTRAINT='capture_asset_purge_protection_guard'; END IF;
  IF version_status<>'active' THEN RAISE EXCEPTION 'Archived Project Versions are read-only' USING ERRCODE='23514',CONSTRAINT='capture_asset_purge_version_guard'; END IF;
  IF EXISTS(SELECT 1 FROM capture_schema.capture_asset other WHERE other.file_id=asset_file_id AND other.id<>NEW.capture_asset_id AND other.is_deleted=FALSE)
    OR EXISTS(SELECT 1 FROM guide_schema.guide_step WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND is_deleted=FALSE AND NEW.capture_asset_id IN(source_capture_asset_id,selected_capture_asset_id))
    OR EXISTS(SELECT 1 FROM interactive_demo_schema.demo_scene WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND is_deleted=FALSE AND NEW.capture_asset_id IN(source_capture_asset_id,background_capture_asset_id))
    OR EXISTS(SELECT 1 FROM guide_schema.guide_revision_step WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND NEW.capture_asset_id IN(source_capture_asset_id,selected_capture_asset_id))
    OR EXISTS(SELECT 1 FROM interactive_demo_schema.demo_revision_scene WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND NEW.capture_asset_id IN(source_capture_asset_id,background_capture_asset_id))
    OR EXISTS(SELECT 1 FROM publish_schema.published_artifact_capture_asset WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND capture_asset_id=NEW.capture_asset_id)
  THEN RAISE EXCEPTION 'Capture Asset is protected' USING ERRCODE='23514',CONSTRAINT='capture_asset_purge_protection_guard'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER capture_asset_purge_request_guard BEFORE INSERT OR UPDATE ON capture_schema.capture_asset_purge_operation FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_capture_asset_purge_request();

DO $$
DECLARE registration RECORD; operation_short TEXT;
BEGIN
  FOR registration IN SELECT * FROM (VALUES
    ('published_artifact','INSERT','published_artifact','publish.guide,publish.interactive_demo'),
    ('published_artifact_capture_asset','INSERT','published_artifact_capture_asset','publish.guide,publish.interactive_demo'),
    ('publish_link','INSERT','publish_link','publish.guide,publish.interactive_demo'),
    ('publish_link','UPDATE','publish_link','publish.guide,publish.interactive_demo,publish.guide_link.revoke,publish.interactive_demo_link.revoke,publish.guide_link.access_update,publish.interactive_demo_link.access_update,publish.guide_link.password_update,publish.interactive_demo_link.password_update'),
    ('public_publish_viewer_session','INSERT','public_publish_viewer_session','publish.viewer_session.create'),
    ('public_publish_viewer_session','UPDATE','public_publish_viewer_session','publish.guide_link.revoke,publish.interactive_demo_link.revoke,publish.guide_link.password_update,publish.interactive_demo_link.password_update,publish.viewer_session.touch')
  ) AS entries(table_name,sql_operation,entity_type,commands)
  LOOP
    operation_short:=CASE registration.sql_operation WHEN 'INSERT' THEN 'i' ELSE 'u' END;
    EXECUTE format('CREATE TRIGGER %I BEFORE %s ON publish_schema.%I FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(%L,%L,%L)',registration.table_name||'_'||operation_short||'_audit_ctx',registration.sql_operation,registration.table_name,registration.entity_type,CASE WHEN registration.table_name='public_publish_viewer_session' THEN 'viewer' ELSE 'direct' END,registration.commands);
    EXECUTE format('CREATE CONSTRAINT TRIGGER %I AFTER %s ON publish_schema.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_mutation_evidence(%L,%L,%L)',registration.table_name||'_'||operation_short||'_audit_evd',registration.sql_operation,registration.table_name,registration.entity_type,CASE WHEN registration.table_name='public_publish_viewer_session' THEN 'viewer' ELSE 'direct' END,registration.commands);
  END LOOP;
END;
$$;

GRANT SELECT,INSERT,UPDATE ON publish_schema.published_artifact,publish_schema.publish_link,publish_schema.public_publish_viewer_session TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT ON publish_schema.published_artifact_capture_asset TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT EXECUTE ON FUNCTION capture_schema.enforce_capture_asset_purge_request() TO __OSSIE_RUNTIME_DB_ROLE__;
