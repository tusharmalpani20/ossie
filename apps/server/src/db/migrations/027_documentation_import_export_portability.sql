-- 027_documentation_import_export_portability.sql
-- Created On: 2026-07-30

-- UP:

ALTER TABLE documentation_schema.openapi_inspection
  ALTER COLUMN parsed_document DROP NOT NULL;

CREATE TABLE documentation_schema.documentation_import_inspection (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  kind VARCHAR(30) NOT NULL
    CHECK (kind IN ('page_markdown','site_package')),
  status VARCHAR(20) NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready','consumed','cancelled','expired')),
  source_file_id VARCHAR(26) NOT NULL,
  source_digest VARCHAR(64) NOT NULL
    CHECK (source_digest ~ '^[a-f0-9]{64}$'),
  source_size_bytes BIGINT NOT NULL CHECK (source_size_bytes >= 0),
  format_version INTEGER DEFAULT NULL
    CHECK (format_version IS NULL OR format_version = 1),
  content_fingerprint VARCHAR(64) NOT NULL
    CHECK (content_fingerprint ~ '^[a-f0-9]{64}$'),
  safe_report JSONB DEFAULT NULL
    CHECK (safe_report IS NULL OR octet_length(safe_report::TEXT) <= 4194304),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ DEFAULT NULL,
  cancelled_at TIMESTAMPTZ DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_import_inspection_scope UNIQUE
    (id, project_version_id, project_id, organization_id),
  CONSTRAINT chk_documentation_import_inspection_format CHECK (
    (kind='page_markdown' AND format_version IS NULL)
    OR (kind='site_package' AND format_version=1)
  ),
  CONSTRAINT chk_documentation_import_inspection_terminal CHECK (
    (status='ready' AND consumed_at IS NULL AND cancelled_at IS NULL
      AND safe_report IS NOT NULL)
    OR (status='consumed' AND consumed_at IS NOT NULL
      AND cancelled_at IS NULL AND safe_report IS NULL)
    OR (status='cancelled' AND consumed_at IS NULL
      AND cancelled_at IS NOT NULL AND safe_report IS NULL)
    OR (status='expired' AND consumed_at IS NULL
      AND cancelled_at IS NULL AND safe_report IS NULL)
  ),
  CONSTRAINT fk_documentation_import_inspection_version FOREIGN KEY
    (project_version_id, project_id, organization_id)
    REFERENCES project_schema.project_version
    (id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_import_inspection_actor FOREIGN KEY
    (created_by_id, organization_id)
    REFERENCES organization_schema.org_user
    (id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_import_inspection_file FOREIGN KEY
    (source_file_id, organization_id)
    REFERENCES file_schema.file
    (id, organization_id) ON DELETE RESTRICT
);

CREATE INDEX idx_documentation_import_inspection_actor_ready
  ON documentation_schema.documentation_import_inspection
  (organization_id,project_id,project_version_id,created_by_id,status,expires_at);
CREATE INDEX idx_documentation_import_inspection_cleanup
  ON documentation_schema.documentation_import_inspection
  (status,expires_at,id);

CREATE TABLE documentation_schema.documentation_import_application (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  inspection_id VARCHAR(26) NOT NULL UNIQUE,
  kind VARCHAR(30) NOT NULL
    CHECK (kind IN ('page_markdown','site_package')),
  format_version INTEGER DEFAULT NULL
    CHECK (format_version IS NULL OR format_version=1),
  source_digest VARCHAR(64) NOT NULL
    CHECK (source_digest ~ '^[a-f0-9]{64}$'),
  content_fingerprint VARCHAR(64) NOT NULL
    CHECK (content_fingerprint ~ '^[a-f0-9]{64}$'),
  pages_count INTEGER NOT NULL CHECK (pages_count >= 0),
  snippets_count INTEGER NOT NULL CHECK (snippets_count >= 0),
  assets_count INTEGER NOT NULL CHECK (assets_count >= 0),
  openapi_sources_count INTEGER NOT NULL CHECK (openapi_sources_count IN (0,1)),
  external_bindings_count INTEGER NOT NULL CHECK (external_bindings_count >= 0),
  navigation_nodes_count INTEGER NOT NULL CHECK (navigation_nodes_count >= 0),
  aliases_count INTEGER NOT NULL CHECK (aliases_count >= 0),
  routes_count INTEGER NOT NULL CHECK (routes_count >= 0),
  blocks_count INTEGER NOT NULL CHECK (blocks_count >= 0),
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documentation_import_application_inspection FOREIGN KEY
    (inspection_id,project_version_id,project_id,organization_id)
    REFERENCES documentation_schema.documentation_import_inspection
    (id,project_version_id,project_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_import_application_edition FOREIGN KEY
    (site_edition_id,documentation_site_id,project_version_id,project_id,
     organization_id)
    REFERENCES documentation_schema.site_edition
    (id,documentation_site_id,project_version_id,project_id,organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_import_application_actor FOREIGN KEY
    (created_by_id,organization_id)
    REFERENCES organization_schema.org_user(id,organization_id)
    ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_openapi_source (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL UNIQUE,
  source_openapi_source_id VARCHAR(26) NOT NULL,
  file_id VARCHAR(26) NOT NULL,
  digest VARCHAR(64) NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$'),
  mime_type VARCHAR(100) NOT NULL
    CHECK (mime_type IN ('application/json','application/yaml','text/yaml')),
  original_format VARCHAR(10) NOT NULL
    CHECK (original_format IN ('json','yaml')),
  openapi_version VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_site_revision_openapi_source_revision FOREIGN KEY
    (site_revision_id,site_edition_id,project_id,organization_id)
    REFERENCES documentation_schema.site_revision
    (id,site_edition_id,project_id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_revision_openapi_source_file FOREIGN KEY
    (file_id,organization_id)
    REFERENCES file_schema.file(id,organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_revision_openapi_source_source FOREIGN KEY
    (source_openapi_source_id,site_edition_id,project_id,organization_id)
    REFERENCES documentation_schema.openapi_source
    (id,site_edition_id,project_id,organization_id) ON DELETE RESTRICT
);

CREATE FUNCTION documentation_schema.enforce_import_inspection_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF OLD.status <> 'ready' OR NEW.status NOT IN ('consumed','cancelled','expired')
    OR NEW.status = OLD.status
  THEN
    RAISE EXCEPTION 'invalid Documentation Import Inspection transition'
      USING ERRCODE='55000';
  END IF;
  NEW.safe_report := NULL;
  NEW.updated_at := CURRENT_TIMESTAMP;
  NEW.version := OLD.version + 1;
  IF NEW.status='consumed' THEN
    NEW.consumed_at := COALESCE(NEW.consumed_at,CURRENT_TIMESTAMP);
    NEW.cancelled_at := NULL;
  ELSIF NEW.status='cancelled' THEN
    NEW.cancelled_at := COALESCE(NEW.cancelled_at,CURRENT_TIMESTAMP);
    NEW.consumed_at := NULL;
  ELSE
    NEW.consumed_at := NULL;
    NEW.cancelled_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documentation_import_inspection_transition_guard
BEFORE UPDATE ON documentation_schema.documentation_import_inspection
FOR EACH ROW EXECUTE FUNCTION
documentation_schema.enforce_import_inspection_transition();

DROP TRIGGER file_purge_guard ON file_schema.file;
ALTER FUNCTION capture_schema.enforce_file_purge_mutation()
  RENAME TO enforce_file_purge_mutation_v023;
CREATE FUNCTION capture_schema.enforce_file_purge_mutation()
RETURNS TRIGGER AS $$
DECLARE selected_command TEXT:=current_setting('ossie.audit_command',TRUE);
BEGIN
  IF NOT OLD.is_deleted AND NEW.is_deleted AND NOT (
    (
      selected_command='capture_asset.purge.complete'
      AND EXISTS(
        SELECT 1 FROM capture_schema.capture_asset asset
        JOIN capture_schema.capture_asset_purge_operation operation
          ON operation.capture_asset_id=asset.id
        WHERE asset.file_id=NEW.id AND operation.status='pending'
      )
    ) OR (
      selected_command IN (
        'documentation.page_markdown_import.apply',
        'documentation.site_package_import.apply',
        'documentation.import.cancel',
        'documentation.import.expire'
      )
      AND OLD.metadata->>'purpose'='documentation_import_inspection'
      AND EXISTS(
        SELECT 1
          FROM documentation_schema.documentation_import_inspection inspection
         WHERE inspection.source_file_id=NEW.id
           AND inspection.organization_id=NEW.organization_id
           AND inspection.status IN ('consumed','cancelled','expired')
      )
    )
  ) THEN
    RAISE EXCEPTION 'File purge requires an authorized lifecycle workflow'
      USING ERRCODE='23514',CONSTRAINT='file_purge_command_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER file_purge_guard BEFORE UPDATE ON file_schema.file
FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_file_purge_mutation();

CREATE FUNCTION documentation_schema.mark_import_source_file_deleted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE file_schema.file
  SET is_deleted=TRUE,
      deleted_at=COALESCE(deleted_at,CURRENT_TIMESTAMP),
      deleted_by_id=CASE WHEN NEW.status='expired' THEN NULL ELSE NEW.created_by_id END,
      updated_by_id=NEW.created_by_id,
      updated_at=CURRENT_TIMESTAMP,
      version=version+1
  WHERE id=NEW.source_file_id AND organization_id=NEW.organization_id
    AND is_deleted=FALSE;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documentation_import_inspection_source_cleanup
AFTER UPDATE ON documentation_schema.documentation_import_inspection
FOR EACH ROW WHEN (OLD.status='ready' AND NEW.status <> 'ready')
EXECUTE FUNCTION documentation_schema.mark_import_source_file_deleted();

CREATE TRIGGER documentation_import_application_immutable
BEFORE UPDATE OR DELETE
ON documentation_schema.documentation_import_application
FOR EACH ROW EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER documentation_import_application_no_truncate
BEFORE TRUNCATE
ON documentation_schema.documentation_import_application
FOR EACH STATEMENT EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_openapi_source_immutable
BEFORE UPDATE OR DELETE
ON documentation_schema.site_revision_openapi_source
FOR EACH ROW EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_openapi_source_no_truncate
BEFORE TRUNCATE
ON documentation_schema.site_revision_openapi_source
FOR EACH STATEMENT EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid_v026;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT,
  selected_action TEXT,
  selected_actor_type TEXT,
  selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v026(
    selected_command,selected_action,selected_actor_type,selected_source_type
  ) OR (
    (selected_command,selected_action) IN (
      ('documentation.import.inspect','documentation.import.inspected'),
      ('documentation.page_markdown_import.apply',
       'documentation.page_markdown_import_applied'),
      ('documentation.site_package_import.apply',
       'documentation.site_package_import_applied'),
      ('documentation.import.cancel','documentation.import.cancelled')
    )
    AND selected_actor_type='org_user'
    AND selected_source_type IN ('web','api','extension')
  ) OR (
    (selected_command,selected_action)=('documentation.import.expire','documentation.import.expired')
    AND selected_actor_type='system'
    AND selected_source_type='system'
  );
$$ LANGUAGE SQL IMMUTABLE;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) TO __OSSIE_RUNTIME_DB_ROLE__;

DROP TRIGGER file_i_audit_ctx ON file_schema.file;
DROP TRIGGER file_i_audit_evd ON file_schema.file;
CREATE TRIGGER file_i_audit_ctx BEFORE INSERT ON file_schema.file
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'file','direct',
  'capture_asset.create,capture_asset.upload,guide.block.screenshot_upload,documentation.openapi.inspect,documentation.asset.upload,documentation.import.inspect,documentation.site_package_import.apply'
);
CREATE CONSTRAINT TRIGGER file_i_audit_evd AFTER INSERT ON file_schema.file
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'file','direct',
  'capture_asset.create,capture_asset.upload,guide.block.screenshot_upload,documentation.openapi.inspect,documentation.asset.upload,documentation.import.inspect,documentation.site_package_import.apply'
);
DROP TRIGGER file_u_audit_ctx ON file_schema.file;
DROP TRIGGER file_u_audit_evd ON file_schema.file;
CREATE TRIGGER file_u_audit_ctx BEFORE UPDATE ON file_schema.file
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'file','direct',
  'capture_asset.purge.complete,documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.import.cancel,documentation.import.expire'
);
CREATE CONSTRAINT TRIGGER file_u_audit_evd AFTER UPDATE ON file_schema.file
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'file','direct',
  'capture_asset.purge.complete,documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.import.cancel,documentation.import.expire'
);

DROP TRIGGER documentation_asset_i_audit_ctx
  ON documentation_schema.documentation_asset;
DROP TRIGGER documentation_asset_i_audit_evd
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

DROP TRIGGER documentation_site_i_audit_ctx
  ON documentation_schema.documentation_site;
DROP TRIGGER documentation_site_i_audit_evd
  ON documentation_schema.documentation_site;
CREATE TRIGGER documentation_site_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_site
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_site','direct',
  'documentation.site_package_import.apply,documentation.site.create'
);
CREATE CONSTRAINT TRIGGER documentation_site_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_site
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_site','direct',
  'documentation.site_package_import.apply,documentation.site.create'
);

DROP TRIGGER documentation_page_i_audit_ctx
  ON documentation_schema.documentation_page;
DROP TRIGGER documentation_page_i_audit_evd
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
CREATE TRIGGER documentation_page_d_audit_ctx
BEFORE DELETE ON documentation_schema.documentation_page
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_delete_mutation_context(
  'documentation_page','documentation.site_package_import.apply'
);
CREATE CONSTRAINT TRIGGER documentation_page_d_audit_evd
AFTER DELETE ON documentation_schema.documentation_page
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_delete_mutation_evidence(
  'documentation_page'
);

DROP TRIGGER documentation_snippet_i_audit_ctx
  ON documentation_schema.documentation_snippet;
DROP TRIGGER documentation_snippet_i_audit_evd
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

DROP TRIGGER navigation_tree_u_audit_ctx
  ON documentation_schema.navigation_tree;
DROP TRIGGER navigation_tree_u_audit_evd
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

DROP TRIGGER routing_set_u_audit_ctx
  ON documentation_schema.routing_set;
DROP TRIGGER routing_set_u_audit_evd
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

DROP TRIGGER openapi_source_i_audit_ctx
  ON documentation_schema.openapi_source;
DROP TRIGGER openapi_source_i_audit_evd
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

CREATE TRIGGER documentation_import_inspection_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_import_inspection
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_import_inspection','direct','documentation.import.inspect'
);
CREATE CONSTRAINT TRIGGER documentation_import_inspection_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_import_inspection
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_import_inspection','direct','documentation.import.inspect'
);
CREATE TRIGGER documentation_import_inspection_u_audit_ctx
BEFORE UPDATE ON documentation_schema.documentation_import_inspection
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_import_inspection','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.import.cancel,documentation.import.expire'
);
CREATE CONSTRAINT TRIGGER documentation_import_inspection_u_audit_evd
AFTER UPDATE ON documentation_schema.documentation_import_inspection
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_import_inspection','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply,documentation.import.cancel,documentation.import.expire'
);
CREATE TRIGGER documentation_import_application_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_import_application
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_import_application','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply'
);
CREATE CONSTRAINT TRIGGER documentation_import_application_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_import_application
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_import_application','direct',
  'documentation.page_markdown_import.apply,documentation.site_package_import.apply'
);

GRANT SELECT,INSERT,UPDATE ON
  documentation_schema.documentation_import_inspection
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT ON
  documentation_schema.documentation_import_application,
  documentation_schema.site_revision_openapi_source
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT DELETE ON documentation_schema.documentation_page
TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

REVOKE DELETE ON documentation_schema.documentation_page
FROM __OSSIE_RUNTIME_DB_ROLE__;
DROP TRIGGER IF EXISTS documentation_page_d_audit_evd
  ON documentation_schema.documentation_page;
DROP TRIGGER IF EXISTS documentation_page_d_audit_ctx
  ON documentation_schema.documentation_page;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM documentation_schema.documentation_import_inspection LIMIT 1
  ) OR EXISTS (
    SELECT 1 FROM documentation_schema.documentation_import_application LIMIT 1
  ) OR EXISTS (
    SELECT 1 FROM documentation_schema.site_revision_openapi_source LIMIT 1
  ) THEN
    RAISE EXCEPTION
      'Refusing to roll back populated Documentation portability'
      USING ERRCODE='55000';
  END IF;
END;
$$;

DROP TRIGGER documentation_import_application_i_audit_evd
  ON documentation_schema.documentation_import_application;
DROP TRIGGER documentation_import_application_i_audit_ctx
  ON documentation_schema.documentation_import_application;
DROP TRIGGER documentation_import_inspection_u_audit_evd
  ON documentation_schema.documentation_import_inspection;
DROP TRIGGER documentation_import_inspection_u_audit_ctx
  ON documentation_schema.documentation_import_inspection;
DROP TRIGGER documentation_import_inspection_i_audit_evd
  ON documentation_schema.documentation_import_inspection;
DROP TRIGGER documentation_import_inspection_i_audit_ctx
  ON documentation_schema.documentation_import_inspection;

DROP TRIGGER openapi_source_i_audit_ctx
  ON documentation_schema.openapi_source;
DROP TRIGGER openapi_source_i_audit_evd
  ON documentation_schema.openapi_source;
CREATE TRIGGER openapi_source_i_audit_ctx
BEFORE INSERT ON documentation_schema.openapi_source
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'openapi_source','direct','documentation.openapi.apply'
);
CREATE CONSTRAINT TRIGGER openapi_source_i_audit_evd
AFTER INSERT ON documentation_schema.openapi_source
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'openapi_source','direct','documentation.openapi.apply'
);

DROP TRIGGER routing_set_u_audit_ctx
  ON documentation_schema.routing_set;
DROP TRIGGER routing_set_u_audit_evd
  ON documentation_schema.routing_set;
CREATE TRIGGER routing_set_u_audit_ctx
BEFORE UPDATE ON documentation_schema.routing_set
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'routing_set','direct','documentation.routing.replace'
);
CREATE CONSTRAINT TRIGGER routing_set_u_audit_evd
AFTER UPDATE ON documentation_schema.routing_set
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'routing_set','direct','documentation.routing.replace'
);

DROP TRIGGER navigation_tree_u_audit_ctx
  ON documentation_schema.navigation_tree;
DROP TRIGGER navigation_tree_u_audit_evd
  ON documentation_schema.navigation_tree;
CREATE TRIGGER navigation_tree_u_audit_ctx
BEFORE UPDATE ON documentation_schema.navigation_tree
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'navigation_tree','direct','documentation.navigation.replace'
);
CREATE CONSTRAINT TRIGGER navigation_tree_u_audit_evd
AFTER UPDATE ON documentation_schema.navigation_tree
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'navigation_tree','direct','documentation.navigation.replace'
);

DROP TRIGGER documentation_snippet_i_audit_ctx
  ON documentation_schema.documentation_snippet;
DROP TRIGGER documentation_snippet_i_audit_evd
  ON documentation_schema.documentation_snippet;
CREATE TRIGGER documentation_snippet_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_snippet
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_snippet','direct','documentation.snippet.create'
);
CREATE CONSTRAINT TRIGGER documentation_snippet_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_snippet
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_snippet','direct','documentation.snippet.create'
);

DROP TRIGGER documentation_page_i_audit_ctx
  ON documentation_schema.documentation_page;
DROP TRIGGER documentation_page_i_audit_evd
  ON documentation_schema.documentation_page;
CREATE TRIGGER documentation_page_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_page
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_page','direct',
  'documentation.site.create,documentation.page.create'
);
CREATE CONSTRAINT TRIGGER documentation_page_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_page
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_page','direct',
  'documentation.site.create,documentation.page.create'
);

DROP TRIGGER documentation_site_i_audit_ctx
  ON documentation_schema.documentation_site;
DROP TRIGGER documentation_site_i_audit_evd
  ON documentation_schema.documentation_site;
CREATE TRIGGER documentation_site_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_site
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_site','direct','documentation.site.create'
);
CREATE CONSTRAINT TRIGGER documentation_site_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_site
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_site','direct','documentation.site.create'
);

DROP TRIGGER documentation_asset_i_audit_ctx
  ON documentation_schema.documentation_asset;
DROP TRIGGER documentation_asset_i_audit_evd
  ON documentation_schema.documentation_asset;
CREATE TRIGGER documentation_asset_i_audit_ctx
BEFORE INSERT ON documentation_schema.documentation_asset
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'documentation_asset','direct','documentation.asset.upload'
);
CREATE CONSTRAINT TRIGGER documentation_asset_i_audit_evd
AFTER INSERT ON documentation_schema.documentation_asset
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'documentation_asset','direct','documentation.asset.upload'
);

DROP TRIGGER file_i_audit_ctx ON file_schema.file;
DROP TRIGGER file_i_audit_evd ON file_schema.file;
DROP TRIGGER file_u_audit_ctx ON file_schema.file;
DROP TRIGGER file_u_audit_evd ON file_schema.file;
CREATE TRIGGER file_i_audit_ctx BEFORE INSERT ON file_schema.file
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'file','direct',
  'capture_asset.create,capture_asset.upload,guide.block.screenshot_upload,documentation.openapi.inspect,documentation.asset.upload'
);
CREATE CONSTRAINT TRIGGER file_i_audit_evd AFTER INSERT ON file_schema.file
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'file','direct',
  'capture_asset.create,capture_asset.upload,guide.block.screenshot_upload,documentation.openapi.inspect,documentation.asset.upload'
);
CREATE TRIGGER file_u_audit_ctx BEFORE UPDATE ON file_schema.file
FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
  'file','direct','capture_asset.purge.complete'
);
CREATE CONSTRAINT TRIGGER file_u_audit_evd AFTER UPDATE ON file_schema.file
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
  'file','direct','capture_asset.purge.complete'
);

DROP FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v026(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid;

DROP TRIGGER site_revision_openapi_source_no_truncate
  ON documentation_schema.site_revision_openapi_source;
DROP TRIGGER site_revision_openapi_source_immutable
  ON documentation_schema.site_revision_openapi_source;
DROP TRIGGER documentation_import_application_no_truncate
  ON documentation_schema.documentation_import_application;
DROP TRIGGER documentation_import_application_immutable
  ON documentation_schema.documentation_import_application;
DROP TRIGGER documentation_import_inspection_source_cleanup
  ON documentation_schema.documentation_import_inspection;
DROP TRIGGER documentation_import_inspection_transition_guard
  ON documentation_schema.documentation_import_inspection;
DROP FUNCTION documentation_schema.mark_import_source_file_deleted();
DROP TRIGGER file_purge_guard ON file_schema.file;
DROP FUNCTION capture_schema.enforce_file_purge_mutation();
ALTER FUNCTION capture_schema.enforce_file_purge_mutation_v023()
  RENAME TO enforce_file_purge_mutation;
CREATE TRIGGER file_purge_guard BEFORE UPDATE ON file_schema.file
FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_file_purge_mutation();
DROP FUNCTION documentation_schema.enforce_import_inspection_transition();

DROP TABLE documentation_schema.site_revision_openapi_source;
DROP TABLE documentation_schema.documentation_import_application;
DROP TABLE documentation_schema.documentation_import_inspection;

ALTER TABLE documentation_schema.openapi_inspection
  ALTER COLUMN parsed_document SET NOT NULL;
