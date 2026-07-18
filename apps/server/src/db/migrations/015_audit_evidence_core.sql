-- 015_audit_evidence_core.sql
-- Created On: 2026-07-19

-- UP:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM user_schema.user LIMIT 1)
    OR EXISTS (SELECT 1 FROM organization_schema.organization LIMIT 1)
  THEN
    RAISE EXCEPTION 'Audit foundation requires the accepted empty pre-live schema transition'
      USING ERRCODE = '55000';
  END IF;
END;
$$;

ALTER TABLE project_schema.project
  ADD CONSTRAINT uq_project_id_organization UNIQUE (id, organization_id);

ALTER TABLE organization_schema.org_user
  ADD CONSTRAINT uq_org_user_id_organization UNIQUE (id, organization_id);

CREATE SCHEMA IF NOT EXISTS audit_schema AUTHORIZATION __OSSIE_MAINTENANCE_DB_ROLE__;

CREATE TABLE IF NOT EXISTS audit_schema.audit_event (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) DEFAULT NULL,
  root_resource_type VARCHAR(80) NOT NULL,
  root_resource_id VARCHAR(26) NOT NULL,
  action VARCHAR(120) NOT NULL,
  source_type VARCHAR(32) NOT NULL,
  actor_type VARCHAR(32) NOT NULL,
  actor_org_user_id VARCHAR(26) DEFAULT NULL,
  actor_label VARCHAR(200) NOT NULL,
  request_id VARCHAR(255) DEFAULT NULL,
  correlation_id VARCHAR(255) DEFAULT NULL,
  idempotency_key_hash CHAR(64) DEFAULT NULL,
  before_row_version INTEGER DEFAULT NULL,
  after_row_version INTEGER DEFAULT NULL,
  outcome VARCHAR(24) NOT NULL DEFAULT 'committed',
  reason VARCHAR(500) DEFAULT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_audit_event_id_organization UNIQUE (id, organization_id),
  CONSTRAINT fk_audit_event_organization FOREIGN KEY (organization_id)
    REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  CONSTRAINT fk_audit_event_project_organization FOREIGN KEY (project_id, organization_id)
    REFERENCES project_schema.project(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_audit_event_actor_organization FOREIGN KEY (actor_org_user_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_audit_event_source CHECK (source_type IN ('web', 'extension', 'api', 'system', 'import', 'migration')),
  CONSTRAINT chk_audit_event_actor CHECK (
    (actor_type = 'org_user' AND actor_org_user_id IS NOT NULL)
    OR (actor_type = 'system' AND actor_org_user_id IS NULL)
  ),
  CONSTRAINT chk_audit_event_outcome CHECK (outcome = 'committed'),
  CONSTRAINT chk_audit_event_row_versions CHECK (
    (before_row_version IS NULL OR before_row_version >= 0)
    AND (after_row_version IS NULL OR after_row_version >= 0)
    AND (before_row_version IS NULL OR after_row_version IS NULL OR after_row_version >= before_row_version)
  ),
  CONSTRAINT chk_audit_event_digest CHECK (idempotency_key_hash IS NULL OR idempotency_key_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_audit_event_strings CHECK (
    length(trim(root_resource_type)) > 0
    AND length(trim(root_resource_id)) > 0
    AND length(trim(action)) > 0
    AND length(trim(actor_label)) > 0
  )
);

CREATE TABLE IF NOT EXISTS audit_schema.audit_change_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  audit_event_id VARCHAR(26) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(26) DEFAULT NULL,
  parent_entity_type VARCHAR(80) DEFAULT NULL,
  parent_entity_id VARCHAR(26) DEFAULT NULL,
  logical_key VARCHAR(255) DEFAULT NULL,
  operation VARCHAR(24) NOT NULL,
  field_name VARCHAR(160) DEFAULT NULL,
  value_type VARCHAR(24) DEFAULT NULL,
  before_state VARCHAR(16) NOT NULL,
  after_state VARCHAR(16) NOT NULL,
  before_text_value VARCHAR(4000) DEFAULT NULL,
  after_text_value VARCHAR(4000) DEFAULT NULL,
  before_identifier_value VARCHAR(255) DEFAULT NULL,
  after_identifier_value VARCHAR(255) DEFAULT NULL,
  before_integer_value BIGINT DEFAULT NULL,
  after_integer_value BIGINT DEFAULT NULL,
  before_decimal_value NUMERIC DEFAULT NULL,
  after_decimal_value NUMERIC DEFAULT NULL,
  before_boolean_value BOOLEAN DEFAULT NULL,
  after_boolean_value BOOLEAN DEFAULT NULL,
  before_date_value DATE DEFAULT NULL,
  after_date_value DATE DEFAULT NULL,
  before_timestamp_value TIMESTAMPTZ DEFAULT NULL,
  after_timestamp_value TIMESTAMPTZ DEFAULT NULL,
  before_enum_value VARCHAR(160) DEFAULT NULL,
  after_enum_value VARCHAR(160) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_change_item_event_organization FOREIGN KEY (audit_event_id, organization_id)
    REFERENCES audit_schema.audit_event(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_audit_change_item_operation CHECK (operation IN ('create', 'update', 'delete')),
  CONSTRAINT chk_audit_change_item_value_type CHECK (
    value_type IS NULL OR value_type IN ('text', 'identifier', 'integer', 'decimal', 'boolean', 'date', 'timestamp', 'enum')
  ),
  CONSTRAINT chk_audit_change_item_states CHECK (
    before_state IN ('absent', 'null', 'value', 'redacted', 'present')
    AND after_state IN ('absent', 'null', 'value', 'redacted', 'present')
  ),
  CONSTRAINT chk_audit_change_item_parent_pair CHECK (
    (parent_entity_type IS NULL) = (parent_entity_id IS NULL)
  ),
  CONSTRAINT chk_audit_change_item_shape CHECK (
    (
      field_name IS NULL AND value_type IS NULL
      AND operation IN ('create', 'delete')
      AND (
        (operation = 'create' AND before_state = 'absent' AND after_state = 'present')
        OR (operation = 'delete' AND before_state = 'present' AND after_state = 'absent')
      )
    )
    OR (
      field_name IS NOT NULL AND value_type IS NOT NULL
      AND before_state <> 'present' AND after_state <> 'present'
      AND (
        (operation = 'create' AND before_state = 'absent' AND after_state IN ('null', 'value', 'redacted'))
        OR (operation = 'update' AND before_state IN ('absent', 'null', 'value', 'redacted')
          AND after_state IN ('absent', 'null', 'value', 'redacted'))
        OR (operation = 'delete' AND before_state IN ('null', 'value', 'redacted') AND after_state = 'absent')
      )
    )
  ),
  CONSTRAINT chk_audit_change_item_before_count CHECK (
    (before_state = 'value' AND num_nonnulls(
      before_text_value, before_identifier_value, before_integer_value, before_decimal_value,
      before_boolean_value, before_date_value, before_timestamp_value, before_enum_value
    ) = 1)
    OR (before_state <> 'value' AND num_nonnulls(
      before_text_value, before_identifier_value, before_integer_value, before_decimal_value,
      before_boolean_value, before_date_value, before_timestamp_value, before_enum_value
    ) = 0)
  ),
  CONSTRAINT chk_audit_change_item_after_count CHECK (
    (after_state = 'value' AND num_nonnulls(
      after_text_value, after_identifier_value, after_integer_value, after_decimal_value,
      after_boolean_value, after_date_value, after_timestamp_value, after_enum_value
    ) = 1)
    OR (after_state <> 'value' AND num_nonnulls(
      after_text_value, after_identifier_value, after_integer_value, after_decimal_value,
      after_boolean_value, after_date_value, after_timestamp_value, after_enum_value
    ) = 0)
  ),
  CONSTRAINT chk_audit_change_item_before_type CHECK (
    before_state <> 'value'
    OR (value_type = 'text' AND before_text_value IS NOT NULL)
    OR (value_type = 'identifier' AND before_identifier_value IS NOT NULL)
    OR (value_type = 'integer' AND before_integer_value IS NOT NULL)
    OR (value_type = 'decimal' AND before_decimal_value IS NOT NULL)
    OR (value_type = 'boolean' AND before_boolean_value IS NOT NULL)
    OR (value_type = 'date' AND before_date_value IS NOT NULL)
    OR (value_type = 'timestamp' AND before_timestamp_value IS NOT NULL)
    OR (value_type = 'enum' AND before_enum_value IS NOT NULL)
  ),
  CONSTRAINT chk_audit_change_item_after_type CHECK (
    after_state <> 'value'
    OR (value_type = 'text' AND after_text_value IS NOT NULL)
    OR (value_type = 'identifier' AND after_identifier_value IS NOT NULL)
    OR (value_type = 'integer' AND after_integer_value IS NOT NULL)
    OR (value_type = 'decimal' AND after_decimal_value IS NOT NULL)
    OR (value_type = 'boolean' AND after_boolean_value IS NOT NULL)
    OR (value_type = 'date' AND after_date_value IS NOT NULL)
    OR (value_type = 'timestamp' AND after_timestamp_value IS NOT NULL)
    OR (value_type = 'enum' AND after_enum_value IS NOT NULL)
  )
);

CREATE INDEX idx_audit_event_organization_cursor
  ON audit_schema.audit_event (organization_id, occurred_at DESC, id DESC);
CREATE INDEX idx_audit_event_project_cursor
  ON audit_schema.audit_event (project_id, occurred_at DESC, id DESC) WHERE project_id IS NOT NULL;
CREATE INDEX idx_audit_event_root_cursor
  ON audit_schema.audit_event (root_resource_type, root_resource_id, occurred_at DESC, id DESC);
CREATE INDEX idx_audit_event_actor_cursor
  ON audit_schema.audit_event (actor_org_user_id, occurred_at DESC, id DESC) WHERE actor_org_user_id IS NOT NULL;
CREATE INDEX idx_audit_event_request
  ON audit_schema.audit_event (organization_id, request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_audit_event_idempotency
  ON audit_schema.audit_event (organization_id, idempotency_key_hash) WHERE idempotency_key_hash IS NOT NULL;
CREATE INDEX idx_audit_change_item_event_order
  ON audit_schema.audit_change_item (audit_event_id, created_at, id);
CREATE INDEX idx_audit_change_item_entity
  ON audit_schema.audit_change_item (organization_id, entity_type, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION audit_schema.is_maintenance_bypass(target_table OID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(current_setting('ossie.maintenance_mode', true), '') = 'on'
    AND target_table IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_namespace
      WHERE nspname = 'audit_schema'
        AND pg_get_userbyid(nspowner) = current_user
    );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION audit_schema.reject_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Audit Evidence is append-only' USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION audit_schema.reject_audit_truncate()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NULL; END IF;
  RAISE EXCEPTION 'Audit Evidence cannot be truncated by the runtime role' USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_event_append_only
  BEFORE UPDATE OR DELETE ON audit_schema.audit_event
  FOR EACH ROW EXECUTE FUNCTION audit_schema.reject_audit_mutation();
CREATE TRIGGER audit_event_no_truncate
  BEFORE TRUNCATE ON audit_schema.audit_event
  FOR EACH STATEMENT EXECUTE FUNCTION audit_schema.reject_audit_truncate();
CREATE TRIGGER audit_change_item_append_only
  BEFORE UPDATE OR DELETE ON audit_schema.audit_change_item
  FOR EACH ROW EXECUTE FUNCTION audit_schema.reject_audit_mutation();
CREATE TRIGGER audit_change_item_no_truncate
  BEFORE TRUNCATE ON audit_schema.audit_change_item
  FOR EACH STATEMENT EXECUTE FUNCTION audit_schema.reject_audit_truncate();

CREATE OR REPLACE FUNCTION audit_schema.require_project_insert_context()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF COALESCE(current_setting('ossie.audit_event_id', true), '') = ''
    OR current_setting('ossie.audit_organization_id', true) IS DISTINCT FROM NEW.organization_id
    OR current_setting('ossie.audit_action', true) IS DISTINCT FROM 'project.created'
    OR current_setting('ossie.audit_command', true) IS DISTINCT FROM 'project.create'
  THEN
    RAISE EXCEPTION 'Project INSERT requires matching Audit context' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION audit_schema.verify_project_insert_evidence()
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
    WHERE event.id = expected_event_id
      AND event.organization_id = NEW.organization_id
      AND event.project_id = NEW.id
      AND event.root_resource_type = 'project'
      AND event.root_resource_id = NEW.id
      AND event.action = 'project.created'
      AND item.entity_type = 'project'
      AND item.entity_id = NEW.id
      AND item.operation = 'create'
      AND item.field_name IS NULL
  ) THEN
    RAISE EXCEPTION 'Project INSERT requires matching committed Audit Evidence' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_insert_audit_context_guard
  BEFORE INSERT ON project_schema.project
  FOR EACH ROW EXECUTE FUNCTION audit_schema.require_project_insert_context();

CREATE CONSTRAINT TRIGGER project_insert_audit_evidence_guard
  AFTER INSERT ON project_schema.project
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_project_insert_evidence();

REVOKE ALL ON SCHEMA audit_schema FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA audit_schema FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA audit_schema FROM PUBLIC;

GRANT USAGE ON SCHEMA user_schema, organization_schema, auth_schema, project_schema,
  capture_schema, file_schema, guide_schema, publish_schema, interactive_demo_schema
  TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT ON ALL TABLES IN SCHEMA user_schema, organization_schema, auth_schema,
  project_schema, capture_schema, file_schema, guide_schema, publish_schema,
  interactive_demo_schema TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT INSERT ON
  user_schema.user,
  organization_schema.organization,
  organization_schema.org_user,
  organization_schema.org_invite,
  auth_schema.auth_session,
  project_schema.project,
  capture_schema.capture_session,
  file_schema.file,
  capture_schema.capture_asset,
  capture_schema.capture_event,
  guide_schema.guide,
  guide_schema.guide_block,
  guide_schema.guide_step,
  interactive_demo_schema.interactive_demo,
  interactive_demo_schema.demo_scene,
  interactive_demo_schema.demo_hotspot,
  publish_schema.published_artifact,
  publish_schema.publish_link,
  publish_schema.public_publish_viewer_session
  TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT UPDATE ON
  organization_schema.org_invite,
  auth_schema.auth_session,
  project_schema.project,
  capture_schema.capture_session,
  file_schema.file,
  capture_schema.capture_asset,
  capture_schema.capture_event,
  guide_schema.guide,
  guide_schema.guide_block,
  guide_schema.guide_step,
  interactive_demo_schema.interactive_demo,
  interactive_demo_schema.demo_scene,
  interactive_demo_schema.demo_hotspot,
  publish_schema.publish_link,
  publish_schema.public_publish_viewer_session
  TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT USAGE ON SCHEMA audit_schema TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT, INSERT ON audit_schema.audit_event, audit_schema.audit_change_item
  TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT EXECUTE ON FUNCTION audit_schema.is_maintenance_bypass(OID),
  audit_schema.reject_audit_mutation(), audit_schema.reject_audit_truncate(),
  audit_schema.require_project_insert_context(), audit_schema.verify_project_insert_evidence()
  TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM audit_schema.audit_event LIMIT 1)
    OR EXISTS (SELECT 1 FROM audit_schema.audit_change_item LIMIT 1)
  THEN
    RAISE EXCEPTION 'Refusing to remove populated Audit Evidence' USING ERRCODE = '55000';
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS project_insert_audit_evidence_guard ON project_schema.project;
DROP TRIGGER IF EXISTS project_insert_audit_context_guard ON project_schema.project;
DROP FUNCTION IF EXISTS audit_schema.verify_project_insert_evidence();
DROP FUNCTION IF EXISTS audit_schema.require_project_insert_context();
DROP SCHEMA audit_schema CASCADE;

ALTER TABLE organization_schema.org_user DROP CONSTRAINT IF EXISTS uq_org_user_id_organization;
ALTER TABLE project_schema.project DROP CONSTRAINT IF EXISTS uq_project_id_organization;

REVOKE SELECT ON ALL TABLES IN SCHEMA user_schema, organization_schema, auth_schema,
  project_schema, capture_schema, file_schema, guide_schema, publish_schema,
  interactive_demo_schema FROM __OSSIE_RUNTIME_DB_ROLE__;
REVOKE INSERT, UPDATE ON ALL TABLES IN SCHEMA user_schema, organization_schema,
  auth_schema, project_schema, capture_schema, file_schema, guide_schema,
  publish_schema, interactive_demo_schema FROM __OSSIE_RUNTIME_DB_ROLE__;
REVOKE USAGE ON SCHEMA user_schema, organization_schema, auth_schema, project_schema,
  capture_schema, file_schema, guide_schema, publish_schema, interactive_demo_schema
  FROM __OSSIE_RUNTIME_DB_ROLE__;
