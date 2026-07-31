-- 030_documentation_api_try_it.sql
-- Created On: 2026-07-31

-- UP:

ALTER TABLE documentation_schema.openapi_source
  ADD COLUMN server_candidates JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(server_candidates)='array'
      AND pg_column_size(server_candidates) <= 262144);

ALTER TABLE documentation_schema.openapi_operation
  ADD COLUMN request_descriptor JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(request_descriptor)='object'
      AND pg_column_size(request_descriptor) <= 262144),
  ADD COLUMN descriptor_version INTEGER NOT NULL DEFAULT 0
    CHECK (descriptor_version IN (0,1)),
  ADD COLUMN descriptor_digest VARCHAR(64),
  ADD CONSTRAINT chk_openapi_operation_descriptor_digest CHECK (
    (descriptor_version=0 AND descriptor_digest IS NULL
      AND request_descriptor='{}'::jsonb)
    OR
    (descriptor_version=1 AND descriptor_digest ~ '^[a-f0-9]{64}$')
  );

ALTER TABLE documentation_schema.site_revision_openapi_source
  ADD COLUMN server_candidates JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(server_candidates)='array'
      AND pg_column_size(server_candidates) <= 262144);

ALTER TABLE documentation_schema.site_revision_openapi_operation
  ADD COLUMN request_descriptor JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(request_descriptor)='object'
      AND pg_column_size(request_descriptor) <= 262144),
  ADD COLUMN descriptor_version INTEGER NOT NULL DEFAULT 0
    CHECK (descriptor_version IN (0,1)),
  ADD COLUMN descriptor_digest VARCHAR(64),
  ADD CONSTRAINT chk_site_revision_openapi_operation_descriptor_digest CHECK (
    (descriptor_version=0 AND descriptor_digest IS NULL
      AND request_descriptor='{}'::jsonb)
    OR
    (descriptor_version=1 AND descriptor_digest ~ '^[a-f0-9]{64}$')
  );

CREATE TABLE documentation_schema.openapi_try_it_policy (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  openapi_source_id VARCHAR(26) NOT NULL,
  openapi_source_version INTEGER NOT NULL CHECK (openapi_source_version > 0),
  openapi_source_digest VARCHAR(64) NOT NULL
    CHECK (openapi_source_digest ~ '^[a-f0-9]{64}$'),
  status VARCHAR(20) NOT NULL CHECK (status IN ('disabled','enabled')),
  approved_origin TEXT,
  base_path TEXT,
  allow_bearer BOOLEAN NOT NULL DEFAULT FALSE,
  api_key_header_name VARCHAR(256),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_openapi_try_it_policy_edition UNIQUE (site_edition_id),
  CONSTRAINT uq_openapi_try_it_policy_scope UNIQUE
    (id,site_edition_id,project_id,organization_id),
  CONSTRAINT fk_openapi_try_it_policy_edition FOREIGN KEY
    (site_edition_id,documentation_site_id,project_id,organization_id)
    REFERENCES documentation_schema.site_edition
    (id,documentation_site_id,project_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_openapi_try_it_policy_source FOREIGN KEY
    (openapi_source_id,site_edition_id,project_id,organization_id)
    REFERENCES documentation_schema.openapi_source
    (id,site_edition_id,project_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_openapi_try_it_policy_creator FOREIGN KEY
    (created_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_openapi_try_it_policy_updater FOREIGN KEY
    (updated_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_openapi_try_it_policy_state CHECK (
    (status='disabled' AND approved_origin IS NULL AND base_path IS NULL
      AND NOT allow_bearer AND api_key_header_name IS NULL)
    OR
    (status='enabled' AND approved_origin IS NOT NULL
      AND approved_origin ~ '^https://[^/?#]+$'
      AND base_path IS NOT NULL AND left(base_path,1)='/')
  )
);

CREATE TABLE documentation_schema.openapi_try_it_operation_allowance (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  try_it_policy_id VARCHAR(26) NOT NULL,
  destination_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_openapi_try_it_operation_allowance UNIQUE
    (try_it_policy_id,destination_key),
  CONSTRAINT fk_openapi_try_it_operation_allowance_policy FOREIGN KEY
    (try_it_policy_id,site_edition_id,project_id,organization_id)
    REFERENCES documentation_schema.openapi_try_it_policy
    (id,site_edition_id,project_id,organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_openapi_try_it_policy (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL UNIQUE,
  source_openapi_source_id VARCHAR(26) NOT NULL,
  source_digest VARCHAR(64) NOT NULL CHECK (source_digest ~ '^[a-f0-9]{64}$'),
  source_policy_version INTEGER NOT NULL CHECK (source_policy_version > 0),
  approved_origin TEXT NOT NULL CHECK (approved_origin ~ '^https://[^/?#]+$'),
  base_path TEXT NOT NULL CHECK (left(base_path,1)='/'),
  allow_bearer BOOLEAN NOT NULL,
  api_key_header_name VARCHAR(256),
  policy_digest VARCHAR(64) NOT NULL CHECK (policy_digest ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_site_revision_openapi_try_it_policy_scope UNIQUE
    (id,site_revision_id,project_id,organization_id),
  CONSTRAINT fk_site_revision_openapi_try_it_policy_revision FOREIGN KEY
    (site_revision_id,site_edition_id,project_id,organization_id)
    REFERENCES documentation_schema.site_revision
    (id,site_edition_id,project_id,organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_openapi_try_it_operation_allowance (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  frozen_policy_id VARCHAR(26) NOT NULL,
  destination_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_site_revision_openapi_try_it_allowance UNIQUE
    (site_revision_id,destination_key),
  CONSTRAINT fk_site_revision_openapi_try_it_allowance_policy FOREIGN KEY
    (frozen_policy_id,site_revision_id,project_id,organization_id)
    REFERENCES documentation_schema.site_revision_openapi_try_it_policy
    (id,site_revision_id,project_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_revision_openapi_try_it_allowance_operation FOREIGN KEY
    (site_revision_id,destination_key)
    REFERENCES documentation_schema.site_revision_openapi_operation
    (site_revision_id,destination_key) ON DELETE RESTRICT
);

CREATE TABLE publish_schema.documentation_try_it_policy (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  publish_link_id VARCHAR(26) NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documentation_try_it_policy_link FOREIGN KEY
    (publish_link_id,project_id,organization_id)
    REFERENCES publish_schema.publish_link(id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_try_it_policy_creator FOREIGN KEY
    (created_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_try_it_policy_updater FOREIGN KEY
    (updated_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id) ON DELETE RESTRICT
);

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid_v029;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT,
  selected_action TEXT,
  selected_actor_type TEXT,
  selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v029(
    selected_command,selected_action,selected_actor_type,selected_source_type
  ) OR (
    (selected_command,selected_action) IN (
      ('documentation.openapi_try_it_policy.create',
       'documentation.openapi_try_it_policy.created'),
      ('documentation.openapi_try_it_policy.update',
       'documentation.openapi_try_it_policy.updated'),
      ('documentation.openapi_try_it_policy.disable',
       'documentation.openapi_try_it_policy.disabled'),
      ('documentation.publish_link_try_it_policy.enable',
       'documentation.publish_link_try_it_policy.enabled'),
      ('documentation.publish_link_try_it_policy.disable',
       'documentation.publish_link_try_it_policy.disabled')
    )
    AND selected_actor_type='org_user'
    AND selected_source_type IN ('web','api','extension')
  );
$$ LANGUAGE SQL IMMUTABLE;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) TO __OSSIE_RUNTIME_DB_ROLE__;

CREATE TRIGGER openapi_try_it_policy_i_audit_ctx
BEFORE INSERT ON documentation_schema.openapi_try_it_policy
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'openapi_try_it_policy','direct',
  'documentation.openapi_try_it_policy.create'
);
CREATE CONSTRAINT TRIGGER openapi_try_it_policy_i_audit_evd
AFTER INSERT ON documentation_schema.openapi_try_it_policy
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'openapi_try_it_policy','direct',
  'documentation.openapi_try_it_policy.create'
);
CREATE TRIGGER openapi_try_it_policy_u_audit_ctx
BEFORE UPDATE ON documentation_schema.openapi_try_it_policy
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'openapi_try_it_policy','direct',
  'documentation.openapi_try_it_policy.update,documentation.openapi_try_it_policy.disable'
);
CREATE CONSTRAINT TRIGGER openapi_try_it_policy_u_audit_evd
AFTER UPDATE ON documentation_schema.openapi_try_it_policy
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'openapi_try_it_policy','direct',
  'documentation.openapi_try_it_policy.update,documentation.openapi_try_it_policy.disable'
);

CREATE TRIGGER documentation_try_it_policy_i_audit_ctx
BEFORE INSERT ON publish_schema.documentation_try_it_policy
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_try_it_policy','direct',
  'documentation.publish_link_try_it_policy.enable,documentation.publish_link_try_it_policy.disable'
);
CREATE CONSTRAINT TRIGGER documentation_try_it_policy_i_audit_evd
AFTER INSERT ON publish_schema.documentation_try_it_policy
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_try_it_policy','direct',
  'documentation.publish_link_try_it_policy.enable,documentation.publish_link_try_it_policy.disable'
);
CREATE TRIGGER documentation_try_it_policy_u_audit_ctx
BEFORE UPDATE ON publish_schema.documentation_try_it_policy
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_try_it_policy','direct',
  'documentation.publish_link_try_it_policy.enable,documentation.publish_link_try_it_policy.disable'
);
CREATE CONSTRAINT TRIGGER documentation_try_it_policy_u_audit_evd
AFTER UPDATE ON publish_schema.documentation_try_it_policy
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_try_it_policy','direct',
  'documentation.publish_link_try_it_policy.enable,documentation.publish_link_try_it_policy.disable'
);

CREATE FUNCTION documentation_schema.enforce_documentation_try_it_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN
    IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  RAISE EXCEPTION 'immutable Documentation Try-It Revision state cannot be changed'
    USING ERRCODE='55000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_revision_openapi_try_it_policy_immutable
BEFORE UPDATE OR DELETE
ON documentation_schema.site_revision_openapi_try_it_policy
FOR EACH ROW EXECUTE FUNCTION
  documentation_schema.enforce_documentation_try_it_immutable();
CREATE TRIGGER site_revision_openapi_try_it_policy_no_truncate
BEFORE TRUNCATE
ON documentation_schema.site_revision_openapi_try_it_policy
FOR EACH STATEMENT EXECUTE FUNCTION
  documentation_schema.enforce_documentation_try_it_immutable();
CREATE TRIGGER site_revision_openapi_try_it_allowance_immutable
BEFORE UPDATE OR DELETE
ON documentation_schema.site_revision_openapi_try_it_operation_allowance
FOR EACH ROW EXECUTE FUNCTION
  documentation_schema.enforce_documentation_try_it_immutable();
CREATE TRIGGER site_revision_openapi_try_it_allowance_no_truncate
BEFORE TRUNCATE
ON documentation_schema.site_revision_openapi_try_it_operation_allowance
FOR EACH STATEMENT EXECUTE FUNCTION
  documentation_schema.enforce_documentation_try_it_immutable();

GRANT SELECT,INSERT,UPDATE ON
  documentation_schema.openapi_try_it_policy,
  publish_schema.documentation_try_it_policy
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT,DELETE ON
  documentation_schema.openapi_try_it_operation_allowance
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT ON
  documentation_schema.site_revision_openapi_try_it_policy,
  documentation_schema.site_revision_openapi_try_it_operation_allowance
TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM documentation_schema.openapi_try_it_policy)
    OR EXISTS (
      SELECT 1 FROM documentation_schema.openapi_operation
      WHERE descriptor_version=1
    )
    OR EXISTS (
      SELECT 1 FROM documentation_schema.site_revision_openapi_operation
      WHERE descriptor_version=1
    )
    OR EXISTS (SELECT 1 FROM publish_schema.documentation_try_it_policy)
  THEN
    RAISE EXCEPTION 'Refusing to roll back Documentation API Try-It'
      USING ERRCODE='55000';
  END IF;
END;
$$;

DROP TRIGGER site_revision_openapi_try_it_allowance_no_truncate
  ON documentation_schema.site_revision_openapi_try_it_operation_allowance;
DROP TRIGGER site_revision_openapi_try_it_allowance_immutable
  ON documentation_schema.site_revision_openapi_try_it_operation_allowance;
DROP TRIGGER site_revision_openapi_try_it_policy_no_truncate
  ON documentation_schema.site_revision_openapi_try_it_policy;
DROP TRIGGER site_revision_openapi_try_it_policy_immutable
  ON documentation_schema.site_revision_openapi_try_it_policy;
DROP FUNCTION documentation_schema.enforce_documentation_try_it_immutable();
DROP TRIGGER documentation_try_it_policy_u_audit_evd
  ON publish_schema.documentation_try_it_policy;
DROP TRIGGER documentation_try_it_policy_u_audit_ctx
  ON publish_schema.documentation_try_it_policy;
DROP TRIGGER documentation_try_it_policy_i_audit_evd
  ON publish_schema.documentation_try_it_policy;
DROP TRIGGER documentation_try_it_policy_i_audit_ctx
  ON publish_schema.documentation_try_it_policy;
DROP TRIGGER openapi_try_it_policy_u_audit_evd
  ON documentation_schema.openapi_try_it_policy;
DROP TRIGGER openapi_try_it_policy_u_audit_ctx
  ON documentation_schema.openapi_try_it_policy;
DROP TRIGGER openapi_try_it_policy_i_audit_evd
  ON documentation_schema.openapi_try_it_policy;
DROP TRIGGER openapi_try_it_policy_i_audit_ctx
  ON documentation_schema.openapi_try_it_policy;
DROP TABLE publish_schema.documentation_try_it_policy;
DROP TABLE documentation_schema.site_revision_openapi_try_it_operation_allowance;
DROP TABLE documentation_schema.site_revision_openapi_try_it_policy;
DROP TABLE documentation_schema.openapi_try_it_operation_allowance;
DROP TABLE documentation_schema.openapi_try_it_policy;
ALTER TABLE documentation_schema.site_revision_openapi_operation
  DROP CONSTRAINT chk_site_revision_openapi_operation_descriptor_digest,
  DROP COLUMN descriptor_digest,
  DROP COLUMN descriptor_version,
  DROP COLUMN request_descriptor;
ALTER TABLE documentation_schema.site_revision_openapi_source
  DROP COLUMN server_candidates;
ALTER TABLE documentation_schema.openapi_operation
  DROP CONSTRAINT chk_openapi_operation_descriptor_digest,
  DROP COLUMN descriptor_digest,
  DROP COLUMN descriptor_version,
  DROP COLUMN request_descriptor;
ALTER TABLE documentation_schema.openapi_source
  DROP COLUMN server_candidates;
DROP FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v029(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid;
