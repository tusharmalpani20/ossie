-- 019_project_membership_foundation.sql
-- Created On: 2026-07-19

-- UP:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM project_schema.project LIMIT 1) THEN
    RAISE EXCEPTION 'Refusing Project Membership migration while Projects exist; reset and reseed through migration 019' USING ERRCODE = '55000';
  END IF;
  IF EXISTS (SELECT 1 FROM organization_schema.org_user WHERE role = 'admin' LIMIT 1) THEN
    RAISE EXCEPTION 'Refusing Project Membership migration with unsupported organization admin role' USING ERRCODE = '55000';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS project_schema.project_membership (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  org_user_id VARCHAR(26) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  revoked_by_id VARCHAR(26) DEFAULT NULL,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_project_membership_project_org_user UNIQUE (project_id, org_user_id),
  CONSTRAINT fk_project_membership_project_organization FOREIGN KEY (project_id, organization_id)
    REFERENCES project_schema.project(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_membership_org_user_organization FOREIGN KEY (org_user_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_membership_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_membership_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_membership_revoked_by_organization FOREIGN KEY (revoked_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_project_membership_role CHECK (role IN ('project_admin', 'editor', 'viewer')),
  CONSTRAINT chk_project_membership_status CHECK (status IN ('active', 'revoked')),
  CONSTRAINT chk_project_membership_version CHECK (version > 0),
  CONSTRAINT chk_project_membership_identifiers CHECK (
    length(trim(id)) > 0 AND length(trim(organization_id)) > 0
    AND length(trim(project_id)) > 0 AND length(trim(org_user_id)) > 0
  ),
  CONSTRAINT chk_project_membership_lifecycle CHECK (
    (status = 'active' AND revoked_by_id IS NULL AND revoked_at IS NULL)
    OR (status = 'revoked' AND revoked_by_id IS NOT NULL AND revoked_at IS NOT NULL)
  )
);

CREATE INDEX idx_project_membership_actor_discovery
  ON project_schema.project_membership (organization_id, org_user_id, status, project_id);
CREATE INDEX idx_project_membership_project_authorization
  ON project_schema.project_membership (organization_id, project_id, status, role, org_user_id);

CREATE FUNCTION project_schema.reject_active_owner_project_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND EXISTS (
    SELECT 1 FROM organization_schema.org_user actor
    WHERE actor.id = NEW.org_user_id AND actor.organization_id = NEW.organization_id
      AND actor.role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Organization owners use implicit Project access' USING ERRCODE = '23514', CONSTRAINT = 'project_membership_owner_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_membership_owner_guard
  BEFORE INSERT OR UPDATE OF org_user_id, organization_id, status
  ON project_schema.project_membership
  FOR EACH ROW EXECUTE FUNCTION project_schema.reject_active_owner_project_membership();

CREATE FUNCTION project_schema.reject_owner_role_with_active_membership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'owner' AND OLD.role IS DISTINCT FROM NEW.role AND EXISTS (
    SELECT 1 FROM project_schema.project_membership membership
    WHERE membership.organization_id = NEW.organization_id
      AND membership.org_user_id = NEW.id AND membership.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Revoke active Project Memberships before promoting an Organization owner' USING ERRCODE = '23514', CONSTRAINT = 'org_user_owner_membership_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_user_owner_membership_guard
  BEFORE UPDATE OF role ON organization_schema.org_user
  FOR EACH ROW EXECUTE FUNCTION project_schema.reject_owner_role_with_active_membership();

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid_v016;

CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT,
  selected_action TEXT,
  selected_actor_type TEXT,
  selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v016(
    selected_command, selected_action, selected_actor_type, selected_source_type
  ) OR (
    (selected_command, selected_action) IN (
      ('project.membership.assign', 'project.membership.assigned'),
      ('project.membership.role_change', 'project.membership.role_changed'),
      ('project.membership.remove', 'project.membership.removed')
    )
    AND selected_actor_type = 'org_user'
    AND selected_source_type IN ('web', 'api')
  );
$$ LANGUAGE SQL IMMUTABLE;

CREATE TRIGGER project_membership_i_audit_ctx
  BEFORE INSERT ON project_schema.project_membership FOR EACH ROW
  EXECUTE FUNCTION audit_schema.require_mutation_context('project_membership', 'direct', 'project.create,project.membership.assign');
CREATE CONSTRAINT TRIGGER project_membership_i_audit_evd
  AFTER INSERT ON project_schema.project_membership DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION audit_schema.verify_mutation_evidence('project_membership', 'direct', 'project.create,project.membership.assign');
CREATE TRIGGER project_membership_u_audit_ctx
  BEFORE UPDATE ON project_schema.project_membership FOR EACH ROW
  EXECUTE FUNCTION audit_schema.require_mutation_context('project_membership', 'direct', 'project.membership.assign,project.membership.role_change,project.membership.remove');
CREATE CONSTRAINT TRIGGER project_membership_u_audit_evd
  AFTER UPDATE ON project_schema.project_membership DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION audit_schema.verify_mutation_evidence('project_membership', 'direct', 'project.membership.assign,project.membership.role_change,project.membership.remove');

REVOKE ALL ON FUNCTION project_schema.reject_active_owner_project_membership() FROM PUBLIC;
REVOKE ALL ON FUNCTION project_schema.reject_owner_role_with_active_membership() FROM PUBLIC;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid_v016(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_schema.mutation_command_policy_is_valid_v016(TEXT, TEXT, TEXT, TEXT),
  audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT) TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT, INSERT, UPDATE ON project_schema.project_membership TO __OSSIE_RUNTIME_DB_ROLE__;

ALTER TABLE audit_schema.access_event DROP CONSTRAINT chk_access_event_authorization;
-- Preserve the independent chk_access_event_scoped_success constraint from 018.
ALTER TABLE audit_schema.access_event ADD CONSTRAINT chk_access_event_authorization CHECK (
  authorization_type IN ('organization_role', 'project_role', 'public_link', 'public_link_password', 'public_secret', 'authentication', 'system')
  AND (
    (authorization_type = 'organization_role' AND authorization_role IN ('owner', 'member'))
    OR (authorization_type = 'project_role' AND (
      authorization_role IN ('project_admin', 'editor', 'viewer')
      OR (authorization_role IS NULL AND outcome <> 'succeeded')
    ))
    OR (authorization_type NOT IN ('organization_role', 'project_role') AND authorization_role IS NULL)
  )
);

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM project_schema.project_membership LIMIT 1) THEN
    RAISE EXCEPTION 'Refusing to remove populated Project Membership' USING ERRCODE = '55000';
  END IF;
  IF EXISTS (SELECT 1 FROM audit_schema.access_event WHERE authorization_type = 'project_role' LIMIT 1) THEN
    RAISE EXCEPTION 'Refusing to remove Project Membership while Project-role Access Evidence exists' USING ERRCODE = '55000';
  END IF;
END;
$$;

ALTER TABLE audit_schema.access_event DROP CONSTRAINT chk_access_event_authorization;
ALTER TABLE audit_schema.access_event ADD CONSTRAINT chk_access_event_authorization CHECK (
  authorization_type IN ('organization_role', 'public_link', 'public_link_password', 'public_secret', 'authentication', 'system')
  AND (
    (authorization_type = 'organization_role' AND authorization_role IN ('owner', 'member'))
    OR (authorization_type <> 'organization_role' AND authorization_role IS NULL)
  )
);

DROP TRIGGER project_membership_u_audit_evd ON project_schema.project_membership;
DROP TRIGGER project_membership_u_audit_ctx ON project_schema.project_membership;
DROP TRIGGER project_membership_i_audit_evd ON project_schema.project_membership;
DROP TRIGGER project_membership_i_audit_ctx ON project_schema.project_membership;
DROP FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v016(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid;
DROP TRIGGER org_user_owner_membership_guard ON organization_schema.org_user;
DROP FUNCTION project_schema.reject_owner_role_with_active_membership();
DROP TRIGGER project_membership_owner_guard ON project_schema.project_membership;
DROP FUNCTION project_schema.reject_active_owner_project_membership();
DROP TABLE project_schema.project_membership;
