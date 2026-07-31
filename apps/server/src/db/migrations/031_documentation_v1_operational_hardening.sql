-- 031_documentation_v1_operational_hardening.sql
-- Created On: 2026-07-31

-- UP:

CREATE TABLE documentation_schema.organization_documentation_limits (
  organization_id VARCHAR(26) PRIMARY KEY
    REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  active_sites_limit INTEGER CHECK (active_sites_limit > 0),
  active_pages_limit INTEGER CHECK (active_pages_limit > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_organization_documentation_limits_creator FOREIGN KEY
    (created_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_organization_documentation_limits_updater FOREIGN KEY
    (updated_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT
);

ALTER TABLE documentation_schema.documentation_draft_search_document
  ADD COLUMN source_digest VARCHAR(64) NOT NULL
    DEFAULT repeat('0',64) CHECK (source_digest ~ '^[a-f0-9]{64}$'),
  ADD COLUMN heading_text TEXT NOT NULL DEFAULT '',
  ADD COLUMN body_text TEXT NOT NULL DEFAULT '',
  ADD COLUMN ranking_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple',coalesce(title,'')),'A') ||
    setweight(to_tsvector('simple',coalesce(heading_text,'')),'B') ||
    setweight(to_tsvector('simple',coalesce(description,'')),'B') ||
    setweight(to_tsvector('simple',coalesce(body_text,'')),'C')
  ) STORED;
CREATE INDEX idx_documentation_draft_ranking_vector
  ON documentation_schema.documentation_draft_search_document
  USING GIN(ranking_vector);

ALTER TABLE publish_schema.site_publication
  ADD CONSTRAINT uq_site_publication_tenant_scope
  UNIQUE (id,project_id,organization_id);

CREATE TABLE publish_schema.site_publication_search_generation (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_publication_id VARCHAR(26) NOT NULL,
  generation_number INTEGER NOT NULL CHECK (generation_number > 0),
  output_digest VARCHAR(64) NOT NULL
    CHECK (output_digest ~ '^[a-f0-9]{64}$'),
  projection_digest VARCHAR(64)
    CHECK (projection_digest IS NULL OR projection_digest ~ '^[a-f0-9]{64}$'),
  document_count INTEGER NOT NULL CHECK (document_count >= 0),
  status VARCHAR(30) NOT NULL
    CHECK (status IN ('ready','requires_rebuild')),
  legacy_compatible BOOLEAN NOT NULL DEFAULT FALSE,
  actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('org_user','system')),
  created_by_id VARCHAR(26),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_site_publication_search_generation_scope
    UNIQUE (id,site_publication_id,project_id,organization_id),
  CONSTRAINT uq_site_publication_search_generation_number
    UNIQUE (site_publication_id,generation_number),
  CONSTRAINT fk_site_publication_search_generation_publication FOREIGN KEY
    (site_publication_id,project_id,organization_id)
    REFERENCES publish_schema.site_publication
    (id,project_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_publication_search_generation_actor FOREIGN KEY
    (created_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_site_publication_search_generation_actor CHECK (
    (actor_type='org_user' AND created_by_id IS NOT NULL)
    OR (actor_type='system' AND created_by_id IS NULL)
  ),
  CONSTRAINT chk_site_publication_search_generation_state CHECK (
    (status='ready' AND projection_digest IS NOT NULL
      AND NOT legacy_compatible)
    OR
    (status='requires_rebuild' AND projection_digest IS NULL
      AND legacy_compatible AND generation_number=1)
  )
);
CREATE INDEX idx_site_publication_search_generation_scope
  ON publish_schema.site_publication_search_generation
  (organization_id,project_id,site_publication_id,generation_number DESC);

ALTER TABLE publish_schema.site_publication_search_document
  ADD COLUMN search_generation_id VARCHAR(26),
  ADD COLUMN heading_text TEXT NOT NULL DEFAULT '',
  ADD COLUMN body_text TEXT NOT NULL DEFAULT '',
  ADD COLUMN ranking_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple',coalesce(title,'')),'A') ||
    setweight(to_tsvector('simple',coalesce(heading_text,'')),'B') ||
    setweight(to_tsvector('simple',coalesce(description,'')),'B') ||
    setweight(to_tsvector('simple',coalesce(body_text,'')),'C')
  ) STORED;

INSERT INTO publish_schema.site_publication_search_generation (
  id,organization_id,project_id,site_publication_id,generation_number,
  output_digest,projection_digest,document_count,status,legacy_compatible,
  actor_type,created_by_id
)
SELECT upper(substr(md5(publication.id || ':documentation-search:1'),1,26)),
       publication.organization_id,publication.project_id,publication.id,1,
       publication.output_digest,NULL,count(document.id)::integer,
       'requires_rebuild',TRUE,'system',NULL
FROM publish_schema.site_publication publication
LEFT JOIN publish_schema.site_publication_search_document document
  ON document.site_publication_id=publication.id
GROUP BY publication.id,publication.organization_id,publication.project_id,
         publication.output_digest;

ALTER TABLE publish_schema.site_publication_search_document
  DISABLE TRIGGER site_publication_search_immutable;
UPDATE publish_schema.site_publication_search_document document
SET search_generation_id=generation.id
FROM publish_schema.site_publication_search_generation generation
WHERE generation.site_publication_id=document.site_publication_id
  AND generation.generation_number=1;
ALTER TABLE publish_schema.site_publication_search_document
  ENABLE TRIGGER site_publication_search_immutable;

ALTER TABLE publish_schema.site_publication_search_document
  ALTER COLUMN search_generation_id SET NOT NULL,
  DROP CONSTRAINT uq_site_publication_search_page,
  ADD CONSTRAINT uq_site_publication_search_generation_page
    UNIQUE (search_generation_id,source_page_id),
  ADD CONSTRAINT fk_site_publication_search_document_generation FOREIGN KEY
    (search_generation_id,site_publication_id,project_id,organization_id)
    REFERENCES publish_schema.site_publication_search_generation
    (id,site_publication_id,project_id,organization_id) ON DELETE RESTRICT;
CREATE INDEX idx_site_publication_search_ranking_vector
  ON publish_schema.site_publication_search_document
  USING GIN(ranking_vector);

CREATE TABLE publish_schema.site_publication_search_selection (
  site_publication_id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  search_generation_id VARCHAR(26) NOT NULL UNIQUE,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_site_publication_search_selection_generation FOREIGN KEY
    (search_generation_id,site_publication_id,project_id,organization_id)
    REFERENCES publish_schema.site_publication_search_generation
    (id,site_publication_id,project_id,organization_id) ON DELETE RESTRICT
);

INSERT INTO publish_schema.site_publication_search_selection (
  site_publication_id,organization_id,project_id,search_generation_id
)
SELECT site_publication_id,organization_id,project_id,id
FROM publish_schema.site_publication_search_generation
WHERE generation_number=1;

CREATE FUNCTION publish_schema.verify_site_publication_search_selection()
RETURNS TRIGGER AS $$
DECLARE
  selected_generation publish_schema.site_publication_search_generation%ROWTYPE;
  actual_count INTEGER;
BEGIN
  SELECT * INTO selected_generation
  FROM publish_schema.site_publication_search_generation
  WHERE id=NEW.search_generation_id
    AND site_publication_id=NEW.site_publication_id;
  SELECT count(*)::integer INTO actual_count
  FROM publish_schema.site_publication_search_document
  WHERE search_generation_id=NEW.search_generation_id;
  IF selected_generation.id IS NULL
    OR selected_generation.document_count<>actual_count
    OR NOT (
      (selected_generation.status='ready'
        AND selected_generation.projection_digest IS NOT NULL
        AND NOT selected_generation.legacy_compatible)
      OR
      (selected_generation.status='requires_rebuild'
        AND selected_generation.legacy_compatible
        AND selected_generation.generation_number=1)
    )
  THEN
    RAISE EXCEPTION 'incomplete Documentation publication search generation'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER site_publication_search_selection_complete
AFTER INSERT OR UPDATE
ON publish_schema.site_publication_search_selection
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION publish_schema.verify_site_publication_search_selection();

CREATE FUNCTION publish_schema.prevent_publication_search_generation_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN
    IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  RAISE EXCEPTION 'immutable Publication search generation cannot be changed'
    USING ERRCODE='55000';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER site_publication_search_generation_immutable
BEFORE UPDATE OR DELETE
ON publish_schema.site_publication_search_generation
FOR EACH ROW EXECUTE FUNCTION
  publish_schema.prevent_publication_search_generation_mutation();
CREATE TRIGGER site_publication_search_generation_no_truncate
BEFORE TRUNCATE
ON publish_schema.site_publication_search_generation
FOR EACH STATEMENT EXECUTE FUNCTION
  publish_schema.prevent_publication_search_generation_mutation();

CREATE TABLE publish_schema.documentation_discovery_policy (
  publish_link_id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  indexing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_primary_canonical BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documentation_discovery_policy_link FOREIGN KEY
    (publish_link_id,project_id,organization_id)
    REFERENCES publish_schema.publish_link(id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_discovery_policy_site FOREIGN KEY
    (documentation_site_id,project_id,organization_id)
    REFERENCES documentation_schema.documentation_site
    (id,project_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_discovery_policy_creator FOREIGN KEY
    (created_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_discovery_policy_updater FOREIGN KEY
    (updated_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_documentation_discovery_indexing_primary CHECK (
    NOT indexing_enabled OR is_primary_canonical
  )
);
CREATE UNIQUE INDEX uq_documentation_discovery_primary
  ON publish_schema.documentation_discovery_policy
  (organization_id,documentation_site_id)
  WHERE is_primary_canonical;

WITH eligible AS (
  SELECT link.id,
         row_number() OVER (
           PARTITION BY link.organization_id,link.documentation_site_id
           ORDER BY link.created_at,link.id
         ) AS candidate_rank
  FROM publish_schema.publish_link link
  WHERE link.resource_family='documentation_site'
    AND link.status='active'
    AND link.visibility='public'
    AND (link.expires_at IS NULL OR link.expires_at>CURRENT_TIMESTAMP)
    AND EXISTS (
      SELECT 1 FROM publish_schema.publish_link_entry entry
      WHERE entry.publish_link_id=link.id
    )
)
INSERT INTO publish_schema.documentation_discovery_policy (
  publish_link_id,organization_id,project_id,documentation_site_id,
  indexing_enabled,is_primary_canonical,created_by_id,updated_by_id
)
SELECT link.id,link.organization_id,link.project_id,link.documentation_site_id,
       coalesce(eligible.candidate_rank=1,FALSE),
       coalesce(eligible.candidate_rank=1,FALSE),
       link.created_by_id,link.created_by_id
FROM publish_schema.publish_link link
LEFT JOIN eligible ON eligible.id=link.id
WHERE link.resource_family='documentation_site';

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid_v030;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT,
  selected_action TEXT,
  selected_actor_type TEXT,
  selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v030(
    selected_command,selected_action,selected_actor_type,selected_source_type
  ) OR (
    (selected_command,selected_action) IN (
      ('documentation.organization_limits.update',
       'documentation.organization_limits.updated'),
      ('documentation.discovery_policy.update',
       'documentation.discovery_policy.updated'),
      ('documentation.projection_rebuild.draft',
       'documentation.projection.draft_search_rebuilt'),
      ('documentation.projection_rebuild.publication',
       'documentation.projection.publication_search_rebuilt')
    )
    AND (
      (selected_actor_type='org_user'
        AND selected_source_type IN ('web','api','extension'))
      OR
      (selected_actor_type='system' AND selected_source_type='system')
    )
  );
$$ LANGUAGE SQL IMMUTABLE;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) TO __OSSIE_RUNTIME_DB_ROLE__;

-- Organization-owned singleton rows use organization_id as their stable
-- identifier. Preserve the existing guard semantics while teaching the shared
-- evidence verifier how to match that legitimate row shape.
CREATE OR REPLACE FUNCTION audit_schema.verify_mutation_evidence()
RETURNS TRIGGER AS $$
DECLARE
  row_data JSONB := to_jsonb(NEW);
  old_data JSONB := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
  row_organization_id TEXT;
  expected_operation TEXT;
  expected_event_id TEXT := current_setting('ossie.audit_event_id', true);
  row_id TEXT := COALESCE(
    row_data ->> 'id',
    row_data ->> 'artifact_carry_forward_item_id',
    row_data ->> 'publish_link_id',
    row_data ->> 'organization_id'
  );
  before_version INTEGER;
  after_version INTEGER;
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;

  row_organization_id := CASE TG_ARGV[1]
    WHEN 'context' THEN current_setting('ossie.audit_organization_id', true)
    WHEN 'id' THEN row_data ->> 'id'
    WHEN 'viewer' THEN (
      SELECT link.organization_id
      FROM publish_schema.publish_link link
      WHERE link.id = row_data ->> 'publish_link_id'
    )
    ELSE row_data ->> 'organization_id'
  END;
  expected_operation := CASE
    WHEN TG_OP = 'INSERT' THEN 'create'
    WHEN COALESCE((old_data ->> 'is_deleted')::BOOLEAN, FALSE) = FALSE
      AND COALESCE((row_data ->> 'is_deleted')::BOOLEAN, FALSE) = TRUE THEN 'delete'
    ELSE 'update'
  END;
  before_version := CASE WHEN old_data ? 'version' THEN (old_data ->> 'version')::INTEGER END;
  after_version := CASE WHEN row_data ? 'version' THEN (row_data ->> 'version')::INTEGER END;
  IF NOT EXISTS (
    SELECT 1
    FROM audit_schema.audit_event event
    WHERE event.id = expected_event_id
      AND event.organization_id = row_organization_id
      AND event.action = current_setting('ossie.audit_action', true)
      AND event.actor_type = current_setting('ossie.audit_actor_type', true)
      AND event.source_type = current_setting('ossie.audit_source_type', true)
      AND audit_schema.mutation_command_policy_is_valid(
        current_setting('ossie.audit_command', true),
        event.action,
        event.actor_type,
        event.source_type
      )
      AND (
        EXISTS (
          SELECT 1
          FROM audit_schema.audit_change_item item
          WHERE item.audit_event_id = event.id
            AND item.organization_id = event.organization_id
            AND item.entity_type = TG_ARGV[0]
            AND item.entity_id = row_id
            AND item.operation = expected_operation
        )
        OR (
          TG_OP = 'UPDATE'
          AND before_version IS NOT NULL
          AND event.root_resource_type = TG_ARGV[0]
          AND event.root_resource_id = row_id
          AND event.before_row_version = before_version
          AND event.after_row_version = after_version
        )
      )
  ) THEN
    RAISE EXCEPTION 'Mutation requires matching committed Audit Evidence'
      USING ERRCODE = '23514', CONSTRAINT = 'ossie_audit_guard_evidence',
        DETAIL = format(
          'entity_type=%s entity_id=%s operation=%s',
          TG_ARGV[0],
          COALESCE(row_id, '<null>'),
          expected_operation
        );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_documentation_limits_i_audit_ctx
BEFORE INSERT ON documentation_schema.organization_documentation_limits
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'organization_documentation_limits','direct',
  'documentation.organization_limits.update'
);
CREATE CONSTRAINT TRIGGER organization_documentation_limits_i_audit_evd
AFTER INSERT ON documentation_schema.organization_documentation_limits
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'organization_documentation_limits','direct',
  'documentation.organization_limits.update'
);
CREATE TRIGGER organization_documentation_limits_u_audit_ctx
BEFORE UPDATE ON documentation_schema.organization_documentation_limits
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'organization_documentation_limits','direct',
  'documentation.organization_limits.update'
);
CREATE CONSTRAINT TRIGGER organization_documentation_limits_u_audit_evd
AFTER UPDATE ON documentation_schema.organization_documentation_limits
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'organization_documentation_limits','direct',
  'documentation.organization_limits.update'
);

CREATE TRIGGER documentation_discovery_policy_i_audit_ctx
BEFORE INSERT ON publish_schema.documentation_discovery_policy
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_discovery_policy','direct',
  'publish.documentation_link.create'
);
CREATE CONSTRAINT TRIGGER documentation_discovery_policy_i_audit_evd
AFTER INSERT ON publish_schema.documentation_discovery_policy
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_discovery_policy','direct',
  'publish.documentation_link.create'
);
CREATE TRIGGER documentation_discovery_policy_u_audit_ctx
BEFORE UPDATE ON publish_schema.documentation_discovery_policy
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_discovery_policy','direct',
  'documentation.discovery_policy.update'
);
CREATE CONSTRAINT TRIGGER documentation_discovery_policy_u_audit_evd
AFTER UPDATE ON publish_schema.documentation_discovery_policy
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_discovery_policy','direct',
  'documentation.discovery_policy.update'
);

GRANT SELECT,INSERT,UPDATE ON
  documentation_schema.organization_documentation_limits
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT ON
  publish_schema.site_publication_search_generation
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT,UPDATE ON
  publish_schema.site_publication_search_selection
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT,UPDATE ON
  publish_schema.documentation_discovery_policy
TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM documentation_schema.organization_documentation_limits
    )
    OR EXISTS (
      SELECT 1
      FROM publish_schema.site_publication_search_generation
      WHERE generation_number>1 OR NOT legacy_compatible
    )
    OR EXISTS (
      SELECT 1
      FROM publish_schema.documentation_discovery_policy policy
      JOIN publish_schema.publish_link link ON link.id=policy.publish_link_id
      WHERE policy.version<>1
        OR policy.created_by_id<>link.created_by_id
        OR policy.updated_by_id<>link.created_by_id
    )
  THEN
    RAISE EXCEPTION
      'Refusing to roll back Documentation V1 operational hardening'
      USING ERRCODE='55000';
  END IF;
END;
$$;

DROP TRIGGER documentation_discovery_policy_u_audit_evd
  ON publish_schema.documentation_discovery_policy;
DROP TRIGGER documentation_discovery_policy_u_audit_ctx
  ON publish_schema.documentation_discovery_policy;
DROP TRIGGER IF EXISTS documentation_draft_search_i_audit_ctx
  ON documentation_schema.documentation_draft_search_document;
DROP TRIGGER IF EXISTS documentation_draft_search_d_audit_ctx
  ON documentation_schema.documentation_draft_search_document;
DROP TRIGGER IF EXISTS site_publication_search_generation_i_audit_ctx
  ON publish_schema.site_publication_search_generation;
DROP TRIGGER IF EXISTS site_publication_search_document_i_audit_ctx
  ON publish_schema.site_publication_search_document;
DROP TRIGGER IF EXISTS site_publication_search_selection_i_audit_ctx
  ON publish_schema.site_publication_search_selection;
DROP TRIGGER IF EXISTS site_publication_search_selection_u_audit_ctx
  ON publish_schema.site_publication_search_selection;
DROP TRIGGER IF EXISTS documentation_draft_search_i_audit_evd
  ON documentation_schema.documentation_draft_search_document;
DROP TRIGGER IF EXISTS documentation_draft_search_d_audit_evd
  ON documentation_schema.documentation_draft_search_document;
DROP TRIGGER IF EXISTS documentation_draft_search_document_i_audit_ctx
  ON documentation_schema.documentation_draft_search_document;
DROP TRIGGER IF EXISTS documentation_draft_search_document_d_audit_ctx
  ON documentation_schema.documentation_draft_search_document;
DROP TRIGGER IF EXISTS documentation_draft_search_document_i_audit_evd
  ON documentation_schema.documentation_draft_search_document;
DROP TRIGGER IF EXISTS documentation_draft_search_document_d_audit_evd
  ON documentation_schema.documentation_draft_search_document;
DROP TRIGGER IF EXISTS site_publication_search_generation_i_audit_evd
  ON publish_schema.site_publication_search_generation;
DROP TRIGGER IF EXISTS site_publication_search_document_i_audit_evd
  ON publish_schema.site_publication_search_document;
DROP TRIGGER IF EXISTS site_publication_search_selection_i_audit_evd
  ON publish_schema.site_publication_search_selection;
DROP TRIGGER IF EXISTS site_publication_search_selection_u_audit_evd
  ON publish_schema.site_publication_search_selection;
DROP TRIGGER documentation_discovery_policy_i_audit_evd
  ON publish_schema.documentation_discovery_policy;
DROP TRIGGER documentation_discovery_policy_i_audit_ctx
  ON publish_schema.documentation_discovery_policy;
DROP TRIGGER organization_documentation_limits_u_audit_evd
  ON documentation_schema.organization_documentation_limits;
DROP TRIGGER organization_documentation_limits_u_audit_ctx
  ON documentation_schema.organization_documentation_limits;
DROP TRIGGER organization_documentation_limits_i_audit_evd
  ON documentation_schema.organization_documentation_limits;
DROP TRIGGER organization_documentation_limits_i_audit_ctx
  ON documentation_schema.organization_documentation_limits;
DROP FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v030(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid;

DROP TABLE publish_schema.documentation_discovery_policy;
DROP TRIGGER site_publication_search_generation_no_truncate
  ON publish_schema.site_publication_search_generation;
DROP TRIGGER site_publication_search_generation_immutable
  ON publish_schema.site_publication_search_generation;
DROP FUNCTION
  publish_schema.prevent_publication_search_generation_mutation();
DROP TRIGGER site_publication_search_selection_complete
  ON publish_schema.site_publication_search_selection;
DROP FUNCTION publish_schema.verify_site_publication_search_selection();
DROP TABLE publish_schema.site_publication_search_selection;

ALTER TABLE publish_schema.site_publication_search_document
  DROP CONSTRAINT fk_site_publication_search_document_generation,
  DROP CONSTRAINT uq_site_publication_search_generation_page,
  ADD CONSTRAINT uq_site_publication_search_page
    UNIQUE (site_publication_id,source_page_id),
  DROP COLUMN ranking_vector,
  DROP COLUMN body_text,
  DROP COLUMN heading_text,
  DROP COLUMN search_generation_id;
DROP TABLE publish_schema.site_publication_search_generation;
ALTER TABLE publish_schema.site_publication
  DROP CONSTRAINT uq_site_publication_tenant_scope;

DROP INDEX documentation_schema.idx_documentation_draft_ranking_vector;
ALTER TABLE documentation_schema.documentation_draft_search_document
  DROP COLUMN ranking_vector,
  DROP COLUMN body_text,
  DROP COLUMN heading_text,
  DROP COLUMN source_digest;

DROP TABLE documentation_schema.organization_documentation_limits;
