-- 017_access_evidence_and_compliance_timelines.sql
-- Created On: 2026-07-19

-- UP:

CREATE TABLE IF NOT EXISTS audit_schema.access_event (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) DEFAULT NULL,
  root_resource_type VARCHAR(80) NOT NULL,
  root_resource_id VARCHAR(26) DEFAULT NULL,
  action VARCHAR(120) NOT NULL,
  source_type VARCHAR(32) NOT NULL,
  actor_type VARCHAR(32) NOT NULL,
  actor_org_user_id VARCHAR(26) DEFAULT NULL,
  actor_label VARCHAR(200) NOT NULL,
  request_id VARCHAR(255) DEFAULT NULL,
  http_method VARCHAR(8) DEFAULT NULL,
  route_template VARCHAR(255) DEFAULT NULL,
  access_surface VARCHAR(32) NOT NULL,
  authorization_type VARCHAR(32) NOT NULL,
  authorization_role VARCHAR(32) DEFAULT NULL,
  outcome VARCHAR(24) NOT NULL,
  reason_code VARCHAR(32) DEFAULT NULL,
  response_bytes BIGINT DEFAULT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_access_event_organization FOREIGN KEY (organization_id)
    REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  CONSTRAINT fk_access_event_project_organization FOREIGN KEY (project_id, organization_id)
    REFERENCES project_schema.project(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_access_event_actor_organization FOREIGN KEY (actor_org_user_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_access_event_source CHECK (source_type IN ('web', 'extension', 'api', 'system')),
  CONSTRAINT chk_access_event_actor CHECK (
    (actor_type = 'org_user' AND actor_org_user_id IS NOT NULL)
    OR (actor_type IN ('anonymous', 'system') AND actor_org_user_id IS NULL)
  ),
  CONSTRAINT chk_access_event_outcome CHECK (outcome IN ('succeeded', 'denied', 'not_found', 'failed')),
  CONSTRAINT chk_access_event_surface CHECK (
    access_surface IN ('portal', 'extension', 'api', 'public_reader', 'public_embed', 'download', 'authentication', 'compliance')
  ),
  CONSTRAINT chk_access_event_authorization CHECK (
    authorization_type IN ('organization_role', 'public_link', 'public_link_password', 'public_secret', 'authentication', 'system')
    AND (
      (authorization_type = 'organization_role' AND authorization_role IN ('owner', 'member'))
      OR (authorization_type <> 'organization_role' AND authorization_role IS NULL)
    )
  ),
  CONSTRAINT chk_access_event_reason CHECK (
    (outcome = 'succeeded' AND reason_code IS NULL)
    OR (
      outcome <> 'succeeded'
      AND reason_code IN ('unauthenticated', 'invalid_credentials', 'forbidden', 'not_found', 'gone', 'invalid_request', 'conflict', 'internal_error')
    )
  ),
  CONSTRAINT chk_access_event_transport CHECK (
    (request_id IS NULL AND http_method IS NULL AND route_template IS NULL)
    OR (
      request_id IS NOT NULL
      AND http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
      AND route_template IS NOT NULL
      AND route_template LIKE '/%'
      AND route_template !~ '[?#@]'
    )
  ),
  CONSTRAINT chk_access_event_response_bytes CHECK (
    response_bytes IS NULL
    OR (response_bytes >= 0 AND access_surface = 'download' AND outcome = 'succeeded')
  ),
  CONSTRAINT chk_access_event_strings CHECK (
    length(trim(organization_id)) > 0
    AND length(trim(root_resource_type)) > 0
    AND length(trim(action)) > 0
    AND length(trim(actor_label)) > 0
  )
);

CREATE INDEX idx_access_event_organization_cursor
  ON audit_schema.access_event (organization_id, occurred_at DESC, id DESC);
CREATE INDEX idx_access_event_project_cursor
  ON audit_schema.access_event (organization_id, project_id, occurred_at DESC, id DESC);
CREATE INDEX idx_access_event_actor_cursor
  ON audit_schema.access_event (organization_id, actor_org_user_id, occurred_at DESC, id DESC);
CREATE INDEX idx_access_event_root_cursor
  ON audit_schema.access_event (organization_id, root_resource_type, root_resource_id, occurred_at DESC, id DESC);
CREATE INDEX idx_access_event_request
  ON audit_schema.access_event (request_id) WHERE request_id IS NOT NULL;

CREATE TRIGGER access_event_append_only
  BEFORE UPDATE OR DELETE ON audit_schema.access_event
  FOR EACH ROW EXECUTE FUNCTION audit_schema.reject_audit_mutation();
CREATE TRIGGER access_event_no_truncate
  BEFORE TRUNCATE ON audit_schema.access_event
  FOR EACH STATEMENT EXECUTE FUNCTION audit_schema.reject_audit_truncate();

GRANT SELECT, INSERT ON audit_schema.access_event TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM audit_schema.access_event LIMIT 1)
  THEN
    RAISE EXCEPTION 'Refusing to remove populated Access Evidence' USING ERRCODE = '55000';
  END IF;
END;
$$;

DROP TABLE audit_schema.access_event;
