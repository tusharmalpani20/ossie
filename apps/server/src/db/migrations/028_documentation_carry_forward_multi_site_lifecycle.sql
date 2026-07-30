-- 028_documentation_carry_forward_multi_site_lifecycle.sql
-- Created On: 2026-07-30

-- UP:

ALTER TABLE documentation_schema.site_edition
  ADD COLUMN title VARCHAR(200),
  ADD COLUMN description VARCHAR(1000) DEFAULT NULL,
  ADD COLUMN status VARCHAR(20),
  ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN archived_by_id VARCHAR(26) DEFAULT NULL;

UPDATE documentation_schema.site_edition edition
SET title=site.name,
    description=site.description,
    status='active'
FROM documentation_schema.documentation_site site
WHERE site.id=edition.documentation_site_id
  AND site.project_id=edition.project_id
  AND site.organization_id=edition.organization_id;

ALTER TABLE documentation_schema.site_edition
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active',
  ADD CONSTRAINT chk_site_edition_title
    CHECK (length(trim(title)) BETWEEN 1 AND 200),
  ADD CONSTRAINT chk_site_edition_status
    CHECK (status IN ('active','archived')),
  ADD CONSTRAINT chk_site_edition_archive_fields
    CHECK (
      (status='active' AND archived_at IS NULL AND archived_by_id IS NULL)
      OR
      (status='archived' AND archived_at IS NOT NULL AND archived_by_id IS NOT NULL)
    ),
  ADD CONSTRAINT fk_site_edition_archiver
    FOREIGN KEY (archived_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT;

CREATE INDEX idx_site_edition_version_status
  ON documentation_schema.site_edition
  (project_version_id,status,documentation_site_id);

ALTER TABLE documentation_schema.documentation_page
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN archived_by_id VARCHAR(26) DEFAULT NULL,
  ADD CONSTRAINT chk_documentation_page_status
    CHECK (status IN ('active','archived')),
  ADD CONSTRAINT chk_documentation_page_archive_fields
    CHECK (
      (status='active' AND archived_at IS NULL AND archived_by_id IS NULL)
      OR
      (status='archived' AND archived_at IS NOT NULL AND archived_by_id IS NOT NULL)
    ),
  ADD CONSTRAINT fk_documentation_page_archiver
    FOREIGN KEY (archived_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT;

CREATE INDEX idx_documentation_page_edition_status
  ON documentation_schema.documentation_page
  (site_edition_id,status,canonical_path);

ALTER TABLE documentation_schema.openapi_source
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN archived_by_id VARCHAR(26) DEFAULT NULL,
  ADD CONSTRAINT chk_openapi_source_status
    CHECK (status IN ('active','archived')),
  ADD CONSTRAINT chk_openapi_source_archive_fields
    CHECK (
      (status='active' AND archived_at IS NULL AND archived_by_id IS NULL)
      OR
      (status='archived' AND archived_at IS NOT NULL AND archived_by_id IS NOT NULL)
    ),
  ADD CONSTRAINT fk_openapi_source_archiver
    FOREIGN KEY (archived_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT;

CREATE INDEX idx_openapi_source_edition_status
  ON documentation_schema.openapi_source(site_edition_id,status);

ALTER TABLE documentation_schema.site_revision
  ADD COLUMN edition_title VARCHAR(200),
  ADD COLUMN edition_description VARCHAR(1000) DEFAULT NULL,
  ADD COLUMN creation_trigger VARCHAR(30) NOT NULL DEFAULT 'manual_checkpoint',
  ADD COLUMN snapshot_schema_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE documentation_schema.site_revision
  DISABLE TRIGGER site_revision_immutable;
UPDATE documentation_schema.site_revision
SET edition_title=site_name,
    edition_description=site_description;
ALTER TABLE documentation_schema.site_revision
  ENABLE TRIGGER site_revision_immutable;

ALTER TABLE documentation_schema.site_revision
  ALTER COLUMN edition_title SET NOT NULL,
  ADD CONSTRAINT chk_site_revision_creation_trigger
    CHECK (creation_trigger IN ('manual_checkpoint','publication','carry_forward')),
  ADD CONSTRAINT chk_site_revision_snapshot_schema_version
    CHECK (snapshot_schema_version IN (1,2)),
  DROP CONSTRAINT uq_site_revision_edition_content_digest,
  ADD CONSTRAINT uq_site_revision_edition_schema_content_digest
    UNIQUE (site_edition_id, snapshot_schema_version, content_digest);

ALTER TABLE documentation_schema.site_revision_asset_reference
  ADD COLUMN frozen_name VARCHAR(200) DEFAULT NULL;
UPDATE documentation_schema.site_revision_asset_reference reference
   SET frozen_name=asset.name
  FROM documentation_schema.documentation_asset asset
 WHERE reference.source_kind='documentation_asset'
   AND asset.id=reference.source_asset_id
   AND asset.site_edition_id=reference.site_edition_id
   AND asset.organization_id=reference.organization_id;
ALTER TABLE documentation_schema.site_revision_asset_reference
  ADD CONSTRAINT chk_site_revision_asset_frozen_name CHECK (
    source_kind<>'documentation_asset' OR frozen_name IS NOT NULL
  );

CREATE TABLE documentation_schema.documentation_carry_forward (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  source_project_version_id VARCHAR(26) NOT NULL,
  target_project_version_id VARCHAR(26) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  idempotency_key_hash VARCHAR(64) NOT NULL
    CHECK (idempotency_key_hash ~ '^[a-f0-9]{64}$'),
  request_digest VARCHAR(64) NOT NULL
    CHECK (request_digest ~ '^[a-f0-9]{64}$'),
  selection_count INTEGER NOT NULL CHECK (selection_count BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_carry_forward_scope UNIQUE
    (id,organization_id,project_id,source_project_version_id,
     target_project_version_id),
  CONSTRAINT uq_documentation_carry_forward_actor_key UNIQUE
    (organization_id,project_id,created_by_id,idempotency_key_hash),
  CONSTRAINT chk_documentation_carry_forward_versions
    CHECK (source_project_version_id <> target_project_version_id),
  CONSTRAINT fk_documentation_carry_forward_source_version FOREIGN KEY
    (source_project_version_id,project_id,organization_id)
    REFERENCES project_schema.project_version(id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_carry_forward_target_version FOREIGN KEY
    (target_project_version_id,project_id,organization_id)
    REFERENCES project_schema.project_version(id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_carry_forward_actor FOREIGN KEY
    (created_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_carry_forward_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  operation_id VARCHAR(26) NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  documentation_site_id VARCHAR(26) NOT NULL,
  source_project_version_id VARCHAR(26) NOT NULL,
  target_project_version_id VARCHAR(26) NOT NULL,
  source_site_edition_id VARCHAR(26) NOT NULL,
  source_site_revision_id VARCHAR(26) NOT NULL,
  source_revision_reused BOOLEAN NOT NULL,
  target_site_edition_id VARCHAR(26) NOT NULL,
  target_site_working_draft_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_carry_forward_item_position
    UNIQUE (operation_id,position),
  CONSTRAINT uq_documentation_carry_forward_item_site
    UNIQUE (operation_id,documentation_site_id),
  CONSTRAINT fk_documentation_carry_forward_item_operation FOREIGN KEY
    (operation_id,organization_id,project_id,source_project_version_id,
     target_project_version_id)
    REFERENCES documentation_schema.documentation_carry_forward
    (id,organization_id,project_id,source_project_version_id,
     target_project_version_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_carry_forward_item_site FOREIGN KEY
    (documentation_site_id,project_id,organization_id)
    REFERENCES documentation_schema.documentation_site
    (id,project_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_carry_forward_item_source_edition FOREIGN KEY
    (source_site_edition_id,documentation_site_id,source_project_version_id,
     project_id,organization_id)
    REFERENCES documentation_schema.site_edition
    (id,documentation_site_id,project_version_id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_carry_forward_item_source_revision FOREIGN KEY
    (source_site_revision_id,source_site_edition_id,source_project_version_id,
     project_id,organization_id)
    REFERENCES documentation_schema.site_revision
    (id,site_edition_id,project_version_id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_carry_forward_item_target_edition FOREIGN KEY
    (target_site_edition_id,documentation_site_id,target_project_version_id,
     project_id,organization_id)
    REFERENCES documentation_schema.site_edition
    (id,documentation_site_id,project_version_id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_carry_forward_item_target_draft FOREIGN KEY
    (target_site_working_draft_id,target_site_edition_id,documentation_site_id,
     project_id,organization_id)
    REFERENCES documentation_schema.site_working_draft
    (id,site_edition_id,documentation_site_id,project_id,organization_id)
    ON DELETE RESTRICT
);

CREATE TRIGGER documentation_carry_forward_immutable
BEFORE UPDATE OR DELETE
ON documentation_schema.documentation_carry_forward
FOR EACH ROW EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER documentation_carry_forward_no_truncate
BEFORE TRUNCATE
ON documentation_schema.documentation_carry_forward
FOR EACH STATEMENT EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER documentation_carry_forward_item_immutable
BEFORE UPDATE OR DELETE
ON documentation_schema.documentation_carry_forward_item
FOR EACH ROW EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER documentation_carry_forward_item_no_truncate
BEFORE TRUNCATE
ON documentation_schema.documentation_carry_forward_item
FOR EACH STATEMENT EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid_v027;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT,
  selected_action TEXT,
  selected_actor_type TEXT,
  selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v027(
    selected_command,selected_action,selected_actor_type,selected_source_type
  ) OR (
    (selected_command,selected_action) IN (
      ('documentation.carry_forward','documentation.editions_carried_forward'),
      ('documentation.edition.update','documentation.edition_updated'),
      ('documentation.edition.archive','documentation.edition.archived'),
      ('documentation.edition.restore','documentation.edition.restored'),
      ('documentation.page.archive','documentation.page.archived'),
      ('documentation.page.restore','documentation.page.restored'),
      ('documentation.openapi.archive','documentation.openapi.archived'),
      ('documentation.openapi.restore','documentation.openapi.restored')
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

CREATE TRIGGER documentation_carry_forward_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_carry_forward
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_carry_forward','direct','documentation.carry_forward'
);
CREATE CONSTRAINT TRIGGER documentation_carry_forward_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_carry_forward
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_carry_forward','direct','documentation.carry_forward'
);
CREATE TRIGGER documentation_carry_forward_item_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_carry_forward_item
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_carry_forward_item','direct','documentation.carry_forward'
);
CREATE CONSTRAINT TRIGGER documentation_carry_forward_item_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_carry_forward_item
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_carry_forward_item','direct','documentation.carry_forward'
);

DROP TRIGGER site_revision_i_audit_ctx
  ON documentation_schema.site_revision;
DROP TRIGGER site_revision_i_audit_evd
  ON documentation_schema.site_revision;
CREATE TRIGGER site_revision_i_audit_ctx
BEFORE INSERT ON documentation_schema.site_revision
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'site_revision','direct',
  'documentation.carry_forward,documentation.revision.create'
);
CREATE CONSTRAINT TRIGGER site_revision_i_audit_evd
AFTER INSERT ON documentation_schema.site_revision
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'site_revision','direct',
  'documentation.carry_forward,documentation.revision.create'
);

DROP TRIGGER documentation_page_i_audit_ctx
  ON documentation_schema.documentation_page;
DROP TRIGGER documentation_page_i_audit_evd
  ON documentation_schema.documentation_page;
CREATE TRIGGER documentation_page_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_page
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_page','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.site.create,documentation.carry_forward,documentation.page.create'
);
CREATE CONSTRAINT TRIGGER documentation_page_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_page
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_page','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.site.create,documentation.carry_forward,documentation.page.create'
);

DROP TRIGGER documentation_snippet_i_audit_ctx
  ON documentation_schema.documentation_snippet;
DROP TRIGGER documentation_snippet_i_audit_evd
  ON documentation_schema.documentation_snippet;
CREATE TRIGGER documentation_snippet_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_snippet
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_snippet','direct',
  'documentation.site_package_import.apply,documentation.snippet.create,documentation.carry_forward'
);
CREATE CONSTRAINT TRIGGER documentation_snippet_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_snippet
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_snippet','direct',
  'documentation.site_package_import.apply,documentation.snippet.create,documentation.carry_forward'
);

DROP TRIGGER documentation_asset_i_audit_ctx
  ON documentation_schema.documentation_asset;
DROP TRIGGER documentation_asset_i_audit_evd
  ON documentation_schema.documentation_asset;
CREATE TRIGGER documentation_asset_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_asset
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_asset','direct',
  'documentation.asset.upload,documentation.site_package_import.apply,documentation.carry_forward'
);
CREATE CONSTRAINT TRIGGER documentation_asset_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_asset
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_asset','direct',
  'documentation.asset.upload,documentation.site_package_import.apply,documentation.carry_forward'
);

DROP TRIGGER openapi_source_i_audit_ctx
  ON documentation_schema.openapi_source;
DROP TRIGGER openapi_source_i_audit_evd
  ON documentation_schema.openapi_source;
CREATE TRIGGER openapi_source_i_audit_ctx
BEFORE INSERT ON documentation_schema.openapi_source
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'openapi_source','direct',
  'documentation.site_package_import.apply,documentation.carry_forward,documentation.openapi.apply'
);
CREATE CONSTRAINT TRIGGER openapi_source_i_audit_evd
AFTER INSERT ON documentation_schema.openapi_source
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'openapi_source','direct',
  'documentation.site_package_import.apply,documentation.carry_forward,documentation.openapi.apply'
);

CREATE TRIGGER site_edition_u_audit_ctx
BEFORE UPDATE ON documentation_schema.site_edition
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'site_edition','direct',
  'documentation.edition.update,documentation.edition.archive,documentation.edition.restore'
);
CREATE CONSTRAINT TRIGGER site_edition_u_audit_evd
AFTER UPDATE ON documentation_schema.site_edition
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'site_edition','direct',
  'documentation.edition.update,documentation.edition.archive,documentation.edition.restore'
);

DROP TRIGGER documentation_page_u_audit_ctx
  ON documentation_schema.documentation_page;
DROP TRIGGER documentation_page_u_audit_evd
  ON documentation_schema.documentation_page;
CREATE TRIGGER documentation_page_u_audit_ctx
BEFORE UPDATE ON documentation_schema.documentation_page
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_page','direct',
  'documentation.page.update,documentation.page.path_change,documentation.page.content_replace,documentation.page.archive,documentation.page.restore'
);
CREATE CONSTRAINT TRIGGER documentation_page_u_audit_evd
AFTER UPDATE ON documentation_schema.documentation_page
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_page','direct',
  'documentation.page.update,documentation.page.path_change,documentation.page.content_replace,documentation.page.archive,documentation.page.restore'
);

DROP TRIGGER openapi_source_u_audit_ctx
  ON documentation_schema.openapi_source;
DROP TRIGGER openapi_source_u_audit_evd
  ON documentation_schema.openapi_source;
CREATE TRIGGER openapi_source_u_audit_ctx
BEFORE UPDATE ON documentation_schema.openapi_source
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'openapi_source','direct',
  'documentation.openapi.apply,documentation.openapi.archive,documentation.openapi.restore'
);
CREATE CONSTRAINT TRIGGER openapi_source_u_audit_evd
AFTER UPDATE ON documentation_schema.openapi_source
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'openapi_source','direct',
  'documentation.openapi.apply,documentation.openapi.archive,documentation.openapi.restore'
);

DROP TRIGGER navigation_tree_u_audit_ctx
  ON documentation_schema.navigation_tree;
DROP TRIGGER navigation_tree_u_audit_evd
  ON documentation_schema.navigation_tree;
CREATE TRIGGER navigation_tree_u_audit_ctx
BEFORE UPDATE ON documentation_schema.navigation_tree
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'navigation_tree','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.page.archive,documentation.navigation.replace'
);
CREATE CONSTRAINT TRIGGER navigation_tree_u_audit_evd
AFTER UPDATE ON documentation_schema.navigation_tree
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'navigation_tree','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.page.archive,documentation.navigation.replace'
);

DROP TRIGGER routing_set_u_audit_ctx
  ON documentation_schema.routing_set;
DROP TRIGGER routing_set_u_audit_evd
  ON documentation_schema.routing_set;
CREATE TRIGGER routing_set_u_audit_ctx
BEFORE UPDATE ON documentation_schema.routing_set
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'routing_set','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.page.archive,documentation.routing.replace'
);
CREATE CONSTRAINT TRIGGER routing_set_u_audit_evd
AFTER UPDATE ON documentation_schema.routing_set
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'routing_set','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.page.archive,documentation.routing.replace'
);

GRANT SELECT,INSERT ON
  documentation_schema.documentation_carry_forward,
  documentation_schema.documentation_carry_forward_item
TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM documentation_schema.documentation_carry_forward LIMIT 1
  ) OR EXISTS (
    SELECT 1 FROM documentation_schema.documentation_carry_forward_item LIMIT 1
  ) OR EXISTS (
    SELECT 1 FROM documentation_schema.site_edition
    WHERE status='archived' OR title IS DISTINCT FROM (
      SELECT site.name FROM documentation_schema.documentation_site site
      WHERE site.id=documentation_site_id
    ) OR description IS DISTINCT FROM (
      SELECT site.description FROM documentation_schema.documentation_site site
      WHERE site.id=documentation_site_id
    ) LIMIT 1
  ) OR EXISTS (
    SELECT 1 FROM documentation_schema.documentation_page
    WHERE status='archived' LIMIT 1
  ) OR EXISTS (
    SELECT 1 FROM documentation_schema.openapi_source
    WHERE status='archived' LIMIT 1
  ) OR EXISTS (
    SELECT 1 FROM documentation_schema.site_revision
    WHERE snapshot_schema_version=2 LIMIT 1
  ) THEN
    RAISE EXCEPTION
      'Refusing to roll back Documentation Carry-Forward and lifecycle'
      USING ERRCODE='55000';
  END IF;
END;
$$;

DROP TRIGGER documentation_carry_forward_item_i_audit_evd
  ON documentation_schema.documentation_carry_forward_item;
DROP TRIGGER documentation_carry_forward_item_i_audit_ctx
  ON documentation_schema.documentation_carry_forward_item;
DROP TRIGGER documentation_carry_forward_i_audit_evd
  ON documentation_schema.documentation_carry_forward;
DROP TRIGGER documentation_carry_forward_i_audit_ctx
  ON documentation_schema.documentation_carry_forward;

DROP TRIGGER openapi_source_i_audit_evd
  ON documentation_schema.openapi_source;
DROP TRIGGER openapi_source_i_audit_ctx
  ON documentation_schema.openapi_source;
CREATE TRIGGER openapi_source_i_audit_ctx
BEFORE INSERT ON documentation_schema.openapi_source
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'openapi_source','direct',
  'documentation.site_package_import.apply,documentation.openapi.apply'
);
CREATE CONSTRAINT TRIGGER openapi_source_i_audit_evd
AFTER INSERT ON documentation_schema.openapi_source
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'openapi_source','direct',
  'documentation.site_package_import.apply,documentation.openapi.apply'
);
DROP TRIGGER documentation_asset_i_audit_evd
  ON documentation_schema.documentation_asset;
DROP TRIGGER documentation_asset_i_audit_ctx
  ON documentation_schema.documentation_asset;
CREATE TRIGGER documentation_asset_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_asset
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_asset','direct',
  'documentation.asset.upload,documentation.site_package_import.apply'
);
CREATE CONSTRAINT TRIGGER documentation_asset_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_asset
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_asset','direct',
  'documentation.asset.upload,documentation.site_package_import.apply'
);
DROP TRIGGER documentation_snippet_i_audit_evd
  ON documentation_schema.documentation_snippet;
DROP TRIGGER documentation_snippet_i_audit_ctx
  ON documentation_schema.documentation_snippet;
CREATE TRIGGER documentation_snippet_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_snippet
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_snippet','direct',
  'documentation.site_package_import.apply,documentation.snippet.create'
);
CREATE CONSTRAINT TRIGGER documentation_snippet_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_snippet
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_snippet','direct',
  'documentation.site_package_import.apply,documentation.snippet.create'
);
DROP TRIGGER documentation_page_i_audit_evd
  ON documentation_schema.documentation_page;
DROP TRIGGER documentation_page_i_audit_ctx
  ON documentation_schema.documentation_page;
CREATE TRIGGER documentation_page_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_page
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_page','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.site.create,documentation.page.create'
);
CREATE CONSTRAINT TRIGGER documentation_page_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_page
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_page','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.site.create,documentation.page.create'
);
DROP TRIGGER site_revision_i_audit_evd
  ON documentation_schema.site_revision;
DROP TRIGGER site_revision_i_audit_ctx
  ON documentation_schema.site_revision;
CREATE TRIGGER site_revision_i_audit_ctx
BEFORE INSERT ON documentation_schema.site_revision
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'site_revision','direct','documentation.revision.create'
);
CREATE CONSTRAINT TRIGGER site_revision_i_audit_evd
AFTER INSERT ON documentation_schema.site_revision
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'site_revision','direct','documentation.revision.create'
);

DROP TRIGGER routing_set_u_audit_evd
  ON documentation_schema.routing_set;
DROP TRIGGER routing_set_u_audit_ctx
  ON documentation_schema.routing_set;
CREATE TRIGGER routing_set_u_audit_ctx
BEFORE UPDATE ON documentation_schema.routing_set
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'routing_set','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.routing.replace'
);
CREATE CONSTRAINT TRIGGER routing_set_u_audit_evd
AFTER UPDATE ON documentation_schema.routing_set
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'routing_set','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.routing.replace'
);
DROP TRIGGER navigation_tree_u_audit_evd
  ON documentation_schema.navigation_tree;
DROP TRIGGER navigation_tree_u_audit_ctx
  ON documentation_schema.navigation_tree;
CREATE TRIGGER navigation_tree_u_audit_ctx
BEFORE UPDATE ON documentation_schema.navigation_tree
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'navigation_tree','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.navigation.replace'
);
CREATE CONSTRAINT TRIGGER navigation_tree_u_audit_evd
AFTER UPDATE ON documentation_schema.navigation_tree
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'navigation_tree','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.navigation.replace'
);
DROP TRIGGER openapi_source_u_audit_evd
  ON documentation_schema.openapi_source;
DROP TRIGGER openapi_source_u_audit_ctx
  ON documentation_schema.openapi_source;
CREATE TRIGGER openapi_source_u_audit_ctx
BEFORE UPDATE ON documentation_schema.openapi_source
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'openapi_source','direct','documentation.openapi.apply'
);
CREATE CONSTRAINT TRIGGER openapi_source_u_audit_evd
AFTER UPDATE ON documentation_schema.openapi_source
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'openapi_source','direct','documentation.openapi.apply'
);
DROP TRIGGER documentation_page_u_audit_evd
  ON documentation_schema.documentation_page;
DROP TRIGGER documentation_page_u_audit_ctx
  ON documentation_schema.documentation_page;
CREATE TRIGGER documentation_page_u_audit_ctx
BEFORE UPDATE ON documentation_schema.documentation_page
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_page','direct',
  'documentation.page.update,documentation.page.path_change,documentation.page.content_replace'
);
CREATE CONSTRAINT TRIGGER documentation_page_u_audit_evd
AFTER UPDATE ON documentation_schema.documentation_page
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_page','direct',
  'documentation.page.update,documentation.page.path_change,documentation.page.content_replace'
);
DROP TRIGGER IF EXISTS site_edition_u_audit_evd
  ON documentation_schema.site_edition;
DROP TRIGGER IF EXISTS site_edition_u_audit_ctx
  ON documentation_schema.site_edition;

DROP FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v027(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid;

DROP TRIGGER documentation_carry_forward_item_no_truncate
  ON documentation_schema.documentation_carry_forward_item;
DROP TRIGGER documentation_carry_forward_item_immutable
  ON documentation_schema.documentation_carry_forward_item;
DROP TRIGGER documentation_carry_forward_no_truncate
  ON documentation_schema.documentation_carry_forward;
DROP TRIGGER documentation_carry_forward_immutable
  ON documentation_schema.documentation_carry_forward;
DROP TABLE documentation_schema.documentation_carry_forward_item;
DROP TABLE documentation_schema.documentation_carry_forward;

ALTER TABLE documentation_schema.site_revision_asset_reference
  DROP CONSTRAINT chk_site_revision_asset_frozen_name,
  DROP COLUMN frozen_name;

ALTER TABLE documentation_schema.site_revision
  DROP CONSTRAINT uq_site_revision_edition_schema_content_digest,
  ADD CONSTRAINT uq_site_revision_edition_content_digest
    UNIQUE (site_edition_id,content_digest),
  DROP CONSTRAINT chk_site_revision_snapshot_schema_version,
  DROP CONSTRAINT chk_site_revision_creation_trigger,
  DROP COLUMN snapshot_schema_version,
  DROP COLUMN creation_trigger,
  DROP COLUMN edition_description,
  DROP COLUMN edition_title;

DROP INDEX documentation_schema.idx_openapi_source_edition_status;
ALTER TABLE documentation_schema.openapi_source
  DROP CONSTRAINT fk_openapi_source_archiver,
  DROP CONSTRAINT chk_openapi_source_archive_fields,
  DROP CONSTRAINT chk_openapi_source_status,
  DROP COLUMN archived_by_id,
  DROP COLUMN archived_at,
  DROP COLUMN status;

DROP INDEX documentation_schema.idx_documentation_page_edition_status;
ALTER TABLE documentation_schema.documentation_page
  DROP CONSTRAINT fk_documentation_page_archiver,
  DROP CONSTRAINT chk_documentation_page_archive_fields,
  DROP CONSTRAINT chk_documentation_page_status,
  DROP COLUMN archived_by_id,
  DROP COLUMN archived_at,
  DROP COLUMN status;

DROP INDEX documentation_schema.idx_site_edition_version_status;
ALTER TABLE documentation_schema.site_edition
  DROP CONSTRAINT fk_site_edition_archiver,
  DROP CONSTRAINT chk_site_edition_archive_fields,
  DROP CONSTRAINT chk_site_edition_status,
  DROP CONSTRAINT chk_site_edition_title,
  DROP COLUMN archived_by_id,
  DROP COLUMN archived_at,
  DROP COLUMN status,
  DROP COLUMN description,
  DROP COLUMN title;
