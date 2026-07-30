-- 025_documentation_site_first_vertical_slice.sql
-- Created On: 2026-07-30

-- UP:

CREATE SCHEMA IF NOT EXISTS documentation_schema;

ALTER TABLE file_schema.file
  ADD CONSTRAINT uq_file_id_organization UNIQUE (id, organization_id);

CREATE TABLE documentation_schema.documentation_site (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(1000) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_site_scope UNIQUE (id, project_id, organization_id),
  CONSTRAINT fk_documentation_site_project FOREIGN KEY (project_id, organization_id)
    REFERENCES project_schema.project(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_site_creator FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_site_updater FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_documentation_site_name CHECK (length(trim(name)) BETWEEN 1 AND 200)
);

CREATE TABLE documentation_schema.site_edition (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  primary_language VARCHAR(35) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_site_edition_scope UNIQUE (id, documentation_site_id, project_version_id, project_id, organization_id),
  CONSTRAINT uq_site_edition_parent_scope UNIQUE (id, documentation_site_id, project_id, organization_id),
  CONSTRAINT uq_site_edition_site_project_version UNIQUE (documentation_site_id, project_version_id),
  CONSTRAINT fk_site_edition_site FOREIGN KEY (documentation_site_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_site(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_edition_version FOREIGN KEY (project_version_id, project_id, organization_id)
    REFERENCES project_schema.project_version(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_edition_creator FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_edition_updater FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_working_draft (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL UNIQUE,
  home_page_id VARCHAR(26) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_site_working_draft_scope UNIQUE (id, site_edition_id, documentation_site_id, project_id, organization_id),
  CONSTRAINT fk_site_working_draft_edition FOREIGN KEY
    (site_edition_id, documentation_site_id, project_id, organization_id)
    REFERENCES documentation_schema.site_edition
    (id, documentation_site_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_working_draft_creator FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_working_draft_updater FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_page (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_working_draft_id VARCHAR(26) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(1000) DEFAULT NULL,
  canonical_path VARCHAR(240) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_page_scope UNIQUE (id, site_edition_id, project_id, organization_id),
  CONSTRAINT uq_documentation_page_path UNIQUE (site_edition_id, canonical_path),
  CONSTRAINT fk_documentation_page_draft FOREIGN KEY
    (site_working_draft_id, site_edition_id, documentation_site_id, project_id, organization_id)
    REFERENCES documentation_schema.site_working_draft
    (id, site_edition_id, documentation_site_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_page_creator FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_page_updater FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT
);

ALTER TABLE documentation_schema.site_working_draft
  ADD CONSTRAINT fk_site_working_draft_home_page FOREIGN KEY
  (home_page_id, site_edition_id, project_id, organization_id)
  REFERENCES documentation_schema.documentation_page
  (id, site_edition_id, project_id, organization_id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE documentation_schema.documentation_page_keyword (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_page_id VARCHAR(26) NOT NULL,
  keyword VARCHAR(100) NOT NULL CHECK (length(trim(keyword)) BETWEEN 1 AND 100),
  position INTEGER NOT NULL CHECK (position > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_documentation_page_keyword_position UNIQUE (documentation_page_id, position),
  CONSTRAINT uq_documentation_page_keyword_value UNIQUE (documentation_page_id, keyword),
  CONSTRAINT fk_documentation_page_keyword_page FOREIGN KEY
    (documentation_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_page_block (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_page_id VARCHAR(26) NOT NULL,
  kind VARCHAR(50) NOT NULL CHECK (kind IN ('paragraph','heading','ordered_list','unordered_list','code','link','image','divider','api_reference')),
  position INTEGER NOT NULL CHECK (position > 0),
  heading_level INTEGER DEFAULT NULL CHECK (heading_level IS NULL OR heading_level BETWEEN 2 AND 4),
  text_content TEXT DEFAULT NULL,
  code_language VARCHAR(40) DEFAULT NULL,
  link_url TEXT DEFAULT NULL,
  linked_page_id VARCHAR(26) DEFAULT NULL,
  documentation_asset_id VARCHAR(26) DEFAULT NULL,
  openapi_source_id VARCHAR(26) DEFAULT NULL,
  operation_key VARCHAR(255) DEFAULT NULL,
  alt_text VARCHAR(1000) DEFAULT NULL,
  image_caption VARCHAR(1000) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_page_block_position UNIQUE (documentation_page_id, position) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT uq_documentation_page_block_scope UNIQUE (id, documentation_page_id, site_edition_id, project_id, organization_id),
  CONSTRAINT fk_documentation_page_block_page FOREIGN KEY
    (documentation_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_list_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_page_id VARCHAR(26) NOT NULL,
  documentation_page_block_id VARCHAR(26) NOT NULL,
  text_content TEXT NOT NULL CHECK (length(trim(text_content)) > 0),
  position INTEGER NOT NULL CHECK (position > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_documentation_list_item_position UNIQUE (documentation_page_block_id, position),
  CONSTRAINT fk_documentation_list_item_block FOREIGN KEY
    (documentation_page_block_id, documentation_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page_block
    (id, documentation_page_id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.navigation_tree (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_navigation_tree_edition UNIQUE (site_edition_id),
  CONSTRAINT uq_navigation_tree_scope UNIQUE (id, site_edition_id, project_id, organization_id),
  CONSTRAINT fk_navigation_tree_edition FOREIGN KEY
    (site_edition_id, documentation_site_id, project_id, organization_id)
    REFERENCES documentation_schema.site_edition
    (id, documentation_site_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.navigation_node (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  navigation_tree_id VARCHAR(26) NOT NULL,
  parent_id VARCHAR(26) DEFAULT NULL,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('group','page')),
  label VARCHAR(200) DEFAULT NULL,
  documentation_page_id VARCHAR(26) DEFAULT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_navigation_node_scope UNIQUE (id, site_edition_id, project_id, organization_id),
  CONSTRAINT uq_navigation_page_once UNIQUE (navigation_tree_id, documentation_page_id),
  CONSTRAINT uq_navigation_node_position UNIQUE (navigation_tree_id, parent_id, position),
  CONSTRAINT chk_navigation_node_kind CHECK (
    (kind='group' AND label IS NOT NULL AND documentation_page_id IS NULL)
    OR (kind='page' AND label IS NULL AND documentation_page_id IS NOT NULL)
  ),
  CONSTRAINT fk_navigation_node_page FOREIGN KEY
    (documentation_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_navigation_node_tree FOREIGN KEY
    (navigation_tree_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.navigation_tree
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_navigation_node_parent FOREIGN KEY
    (parent_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.navigation_node
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.routing_set (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_routing_set_edition UNIQUE (site_edition_id),
  CONSTRAINT uq_routing_set_scope UNIQUE (id, site_edition_id, project_id, organization_id),
  CONSTRAINT fk_routing_set_edition FOREIGN KEY
    (site_edition_id, documentation_site_id, project_id, organization_id)
    REFERENCES documentation_schema.site_edition
    (id, documentation_site_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.page_slug_alias (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  routing_set_id VARCHAR(26) NOT NULL,
  documentation_page_id VARCHAR(26) NOT NULL,
  former_path VARCHAR(240) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_page_slug_alias_path UNIQUE (site_edition_id, former_path),
  CONSTRAINT fk_page_slug_alias_routing_set FOREIGN KEY
    (routing_set_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.routing_set
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_page_slug_alias_page FOREIGN KEY
    (documentation_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_redirect_rule (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  routing_set_id VARCHAR(26) NOT NULL,
  source_path VARCHAR(240) NOT NULL,
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('redirect','gone')),
  target_page_id VARCHAR(26) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_redirect_source UNIQUE (site_edition_id, source_path),
  CONSTRAINT fk_documentation_redirect_routing_set FOREIGN KEY
    (routing_set_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.routing_set
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_documentation_redirect_outcome CHECK (
    (outcome='redirect' AND target_page_id IS NOT NULL)
    OR (outcome='gone' AND target_page_id IS NULL)
  ),
  CONSTRAINT fk_documentation_redirect_target FOREIGN KEY
    (target_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_asset (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  file_id VARCHAR(26) NOT NULL,
  mime_type VARCHAR(100) NOT NULL CHECK (mime_type IN ('image/png','image/jpeg','image/webp','image/gif')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  digest VARCHAR(64) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_asset_scope UNIQUE (id, site_edition_id, project_id, organization_id),
  CONSTRAINT uq_documentation_asset_file UNIQUE (site_edition_id, file_id),
  CONSTRAINT fk_documentation_asset_edition FOREIGN KEY
    (site_edition_id, documentation_site_id, project_id, organization_id)
    REFERENCES documentation_schema.site_edition
    (id, documentation_site_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_asset_file FOREIGN KEY (file_id, organization_id)
    REFERENCES file_schema.file(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.openapi_inspection (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  file_id VARCHAR(26) NOT NULL,
  digest VARCHAR(64) NOT NULL,
  openapi_version VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  operation_count INTEGER NOT NULL CHECK (operation_count >= 0),
  parsed_document JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ DEFAULT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_openapi_inspection_scope UNIQUE (id, site_edition_id, project_id, organization_id),
  CONSTRAINT fk_openapi_inspection_edition FOREIGN KEY
    (site_edition_id, documentation_site_id, project_id, organization_id)
    REFERENCES documentation_schema.site_edition
    (id, documentation_site_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_openapi_inspection_file FOREIGN KEY (file_id, organization_id)
    REFERENCES file_schema.file(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.openapi_source (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  file_id VARCHAR(26) NOT NULL,
  digest VARCHAR(64) NOT NULL,
  openapi_version VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_openapi_source_edition UNIQUE (site_edition_id),
  CONSTRAINT uq_openapi_source_scope UNIQUE (id, site_edition_id, project_id, organization_id),
  CONSTRAINT fk_openapi_source_file FOREIGN KEY (file_id, organization_id)
    REFERENCES file_schema.file(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_command_receipt (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(200) NOT NULL,
  request_digest VARCHAR(64) NOT NULL,
  response_status INTEGER NOT NULL CHECK (response_status BETWEEN 200 AND 299),
  response_body JSONB NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_command_receipt UNIQUE
    (organization_id, project_id, operation, idempotency_key)
);

CREATE TABLE documentation_schema.documentation_draft_search_document (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_page_id VARCHAR(26) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(1000) DEFAULT NULL,
  canonical_path VARCHAR(240) NOT NULL,
  search_text TEXT NOT NULL,
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_draft_search_page UNIQUE (documentation_page_id),
  CONSTRAINT fk_documentation_draft_search_page FOREIGN KEY
    (documentation_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);
CREATE INDEX idx_documentation_draft_search_vector
  ON documentation_schema.documentation_draft_search_document USING GIN(search_vector);

CREATE TABLE documentation_schema.openapi_operation (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  openapi_source_id VARCHAR(26) NOT NULL,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  operation_id VARCHAR(255) DEFAULT NULL,
  destination_key VARCHAR(255) NOT NULL,
  summary VARCHAR(1000) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_openapi_operation_destination UNIQUE (openapi_source_id, destination_key),
  CONSTRAINT fk_openapi_operation_source FOREIGN KEY
    (openapi_source_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.openapi_source
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.comment_thread (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_page_id VARCHAR(26) NOT NULL,
  block_anchor_id VARCHAR(26) DEFAULT NULL,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  state VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (state IN ('open','resolved')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_comment_thread_scope UNIQUE (id, documentation_page_id, site_edition_id, project_id, organization_id),
  CONSTRAINT uq_comment_thread_parent_scope UNIQUE (id, site_edition_id, project_id, organization_id),
  CONSTRAINT fk_comment_thread_page FOREIGN KEY
    (documentation_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.comment_reply (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  comment_thread_id VARCHAR(26) NOT NULL,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_comment_reply_scope UNIQUE (id, comment_thread_id, site_edition_id, project_id, organization_id),
  CONSTRAINT fk_comment_reply_thread FOREIGN KEY
    (comment_thread_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.comment_thread
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.comment_mention (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  comment_thread_id VARCHAR(26) NOT NULL,
  comment_reply_id VARCHAR(26) DEFAULT NULL,
  mentioned_org_user_id VARCHAR(26) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_comment_mention UNIQUE (comment_thread_id, comment_reply_id, mentioned_org_user_id),
  CONSTRAINT fk_comment_mention_member FOREIGN KEY (mentioned_org_user_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT
);

-- Complete immutable snapshots. Private comments are intentionally excluded.
CREATE TABLE documentation_schema.site_revision (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  home_page_id VARCHAR(26) NOT NULL,
  primary_language VARCHAR(35) NOT NULL,
  content_digest VARCHAR(64) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_site_revision_scope UNIQUE (id, site_edition_id, project_version_id, project_id, organization_id),
  CONSTRAINT uq_site_revision_parent_scope UNIQUE (id, site_edition_id, project_id, organization_id),
  CONSTRAINT uq_site_revision_edition_number UNIQUE (site_edition_id, revision_number),
  CONSTRAINT uq_site_revision_edition_content_digest UNIQUE (site_edition_id, content_digest),
  CONSTRAINT fk_site_revision_edition FOREIGN KEY
    (site_edition_id, documentation_site_id, project_version_id, project_id, organization_id)
    REFERENCES documentation_schema.site_edition
    (id, documentation_site_id, project_version_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_page (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_page_id VARCHAR(26) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(1000) DEFAULT NULL,
  canonical_path VARCHAR(240) NOT NULL,
  content_text TEXT NOT NULL,
  CONSTRAINT uq_site_revision_page UNIQUE (site_revision_id, source_page_id),
  CONSTRAINT uq_site_revision_page_path UNIQUE (site_revision_id, canonical_path),
  CONSTRAINT fk_site_revision_page_revision FOREIGN KEY
    (site_revision_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.site_revision
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_page_keyword (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_page_id VARCHAR(26) NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  CONSTRAINT uq_site_revision_page_keyword_position UNIQUE (site_revision_page_id, position),
  CONSTRAINT fk_site_revision_page_keyword_page FOREIGN KEY (site_revision_page_id)
    REFERENCES documentation_schema.site_revision_page(id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_page_block (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_page_id VARCHAR(26) NOT NULL,
  source_block_id VARCHAR(26) NOT NULL,
  kind VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  heading_level INTEGER DEFAULT NULL,
  text_content TEXT DEFAULT NULL,
  code_language VARCHAR(40) DEFAULT NULL,
  link_url TEXT DEFAULT NULL,
  linked_source_page_id VARCHAR(26) DEFAULT NULL,
  source_asset_id VARCHAR(26) DEFAULT NULL,
  source_openapi_source_id VARCHAR(26) DEFAULT NULL,
  operation_key VARCHAR(255) DEFAULT NULL,
  alt_text VARCHAR(1000) DEFAULT NULL,
  image_caption VARCHAR(1000) DEFAULT NULL,
  CONSTRAINT uq_site_revision_page_block_source UNIQUE (site_revision_id, source_block_id),
  CONSTRAINT uq_site_revision_page_block_position UNIQUE (site_revision_page_id, position),
  CONSTRAINT fk_site_revision_page_block_page FOREIGN KEY (site_revision_page_id)
    REFERENCES documentation_schema.site_revision_page(id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_list_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_page_block_id VARCHAR(26) NOT NULL,
  source_list_item_id VARCHAR(26) NOT NULL,
  text_content TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  CONSTRAINT uq_site_revision_list_item_source UNIQUE (site_revision_id, source_list_item_id),
  CONSTRAINT uq_site_revision_list_item_position UNIQUE (site_revision_page_block_id, position),
  CONSTRAINT fk_site_revision_list_item_block FOREIGN KEY (site_revision_page_block_id)
    REFERENCES documentation_schema.site_revision_page_block(id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_navigation_node (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_navigation_node_id VARCHAR(26) NOT NULL,
  parent_source_navigation_node_id VARCHAR(26) DEFAULT NULL,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('group','page')),
  label VARCHAR(200) DEFAULT NULL,
  source_page_id VARCHAR(26) DEFAULT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  CONSTRAINT uq_site_revision_navigation_source UNIQUE (site_revision_id, source_navigation_node_id)
);

CREATE TABLE documentation_schema.site_revision_page_alias (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_page_id VARCHAR(26) NOT NULL,
  former_path VARCHAR(240) NOT NULL,
  CONSTRAINT uq_site_revision_alias_path UNIQUE (site_revision_id, former_path)
);

CREATE TABLE documentation_schema.site_revision_redirect_rule (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_path VARCHAR(240) NOT NULL,
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('redirect','gone')),
  target_source_page_id VARCHAR(26) DEFAULT NULL,
  CONSTRAINT uq_site_revision_redirect_path UNIQUE (site_revision_id, source_path)
);

CREATE TABLE documentation_schema.site_revision_openapi_operation (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_openapi_operation_id VARCHAR(26) NOT NULL,
  method VARCHAR(10) NOT NULL,
  path TEXT NOT NULL,
  operation_id VARCHAR(255) DEFAULT NULL,
  destination_key VARCHAR(255) NOT NULL,
  summary VARCHAR(1000) DEFAULT NULL,
  CONSTRAINT uq_site_revision_operation_destination UNIQUE (site_revision_id, destination_key)
);

CREATE TABLE documentation_schema.site_revision_asset_reference (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_asset_id VARCHAR(26) NOT NULL,
  file_id VARCHAR(26) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  digest VARCHAR(64) NOT NULL,
  alt_text VARCHAR(1000) NOT NULL,
  CONSTRAINT uq_site_revision_asset_source UNIQUE (site_revision_id, source_asset_id),
  CONSTRAINT fk_site_revision_asset_file FOREIGN KEY (file_id, organization_id)
    REFERENCES file_schema.file(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE publish_schema.site_publication (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  publication_sequence INTEGER NOT NULL CHECK (publication_sequence > 0),
  preparation_version INTEGER NOT NULL CHECK (preparation_version > 0),
  output_digest VARCHAR(64) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_site_publication_scope UNIQUE (id, documentation_site_id, site_edition_id, project_version_id, project_id, organization_id),
  CONSTRAINT uq_site_publication_edition_sequence UNIQUE (site_edition_id, publication_sequence),
  CONSTRAINT uq_site_publication_reuse UNIQUE (site_revision_id, preparation_version, output_digest),
  CONSTRAINT fk_site_publication_revision FOREIGN KEY
    (site_revision_id, site_edition_id, project_version_id, project_id, organization_id)
    REFERENCES documentation_schema.site_revision
    (id, site_edition_id, project_version_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE publish_schema.site_publication_search_document (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_publication_id VARCHAR(26) NOT NULL,
  source_page_id VARCHAR(26) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(1000) DEFAULT NULL,
  canonical_path VARCHAR(240) NOT NULL,
  search_text TEXT NOT NULL,
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED,
  CONSTRAINT uq_site_publication_search_page UNIQUE (site_publication_id, source_page_id)
);
CREATE INDEX idx_site_publication_search_vector
  ON publish_schema.site_publication_search_document USING GIN(search_vector);

ALTER TABLE publish_schema.publish_link
  ADD COLUMN resource_family VARCHAR(50) NOT NULL DEFAULT 'artifact',
  ADD COLUMN documentation_site_id VARCHAR(26) DEFAULT NULL,
  ALTER COLUMN artifact_type DROP NOT NULL,
  DROP CONSTRAINT chk_publish_link_type,
  DROP CONSTRAINT chk_publish_link_family,
  ADD CONSTRAINT chk_publish_link_resource_family CHECK (resource_family IN ('artifact','documentation_site')),
  ADD CONSTRAINT chk_publish_link_family CHECK (
    (resource_family='artifact' AND artifact_type IN ('guide','interactive_demo') AND documentation_site_id IS NULL
      AND ((artifact_type='guide' AND guide_id IS NOT NULL AND interactive_demo_id IS NULL)
        OR (artifact_type='interactive_demo' AND interactive_demo_id IS NOT NULL AND guide_id IS NULL)))
    OR
    (resource_family='documentation_site' AND artifact_type IS NULL AND guide_id IS NULL
      AND interactive_demo_id IS NULL AND documentation_site_id IS NOT NULL)
  ),
  ADD CONSTRAINT fk_publish_link_documentation_site FOREIGN KEY
    (documentation_site_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_site(id, project_id, organization_id) ON DELETE RESTRICT;

ALTER TABLE publish_schema.publish_link_entry
  ADD COLUMN documentation_site_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN site_edition_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN site_publication_id VARCHAR(26) DEFAULT NULL,
  ALTER COLUMN published_artifact_id DROP NOT NULL,
  DROP CONSTRAINT chk_publish_link_entry_family,
  ADD CONSTRAINT chk_publish_link_entry_family CHECK (
    (published_artifact_id IS NOT NULL AND documentation_site_id IS NULL
      AND site_edition_id IS NULL AND site_publication_id IS NULL)
    OR
    (published_artifact_id IS NULL AND guide_id IS NULL AND guide_edition_id IS NULL
      AND interactive_demo_id IS NULL AND interactive_demo_edition_id IS NULL
      AND documentation_site_id IS NOT NULL AND site_edition_id IS NOT NULL
      AND site_publication_id IS NOT NULL)
  ),
  ADD CONSTRAINT fk_publish_link_entry_site_publication FOREIGN KEY
    (site_publication_id, documentation_site_id, site_edition_id, project_version_id, project_id, organization_id)
    REFERENCES publish_schema.site_publication
    (id, documentation_site_id, site_edition_id, project_version_id, project_id, organization_id) ON DELETE RESTRICT;

CREATE FUNCTION documentation_schema.prevent_immutable_documentation_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'immutable Documentation history cannot be changed' USING ERRCODE='55000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_revision_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_page_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision_page
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_page_keyword_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision_page_keyword
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_page_block_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision_page_block
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_list_item_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision_list_item
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_navigation_node_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision_navigation_node
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_page_alias_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision_page_alias
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_redirect_rule_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision_redirect_rule
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_openapi_operation_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision_openapi_operation
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_revision_asset_reference_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.site_revision_asset_reference
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_publication_immutable
BEFORE UPDATE OR DELETE ON publish_schema.site_publication
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_publication_search_immutable
BEFORE UPDATE OR DELETE ON publish_schema.site_publication_search_document
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER page_slug_alias_immutable
BEFORE UPDATE OR DELETE ON documentation_schema.page_slug_alias
FOR EACH ROW EXECUTE FUNCTION documentation_schema.prevent_immutable_documentation_mutation();

GRANT USAGE ON SCHEMA documentation_schema TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT,UPDATE ON
  documentation_schema.documentation_site,
  documentation_schema.site_edition,
  documentation_schema.site_working_draft,
  documentation_schema.documentation_page,
  documentation_schema.documentation_page_keyword,
  documentation_schema.documentation_page_block,
  documentation_schema.documentation_list_item,
  documentation_schema.navigation_tree,
  documentation_schema.navigation_node,
  documentation_schema.routing_set,
  documentation_schema.documentation_redirect_rule,
  documentation_schema.documentation_asset,
  documentation_schema.openapi_inspection,
  documentation_schema.openapi_source,
  documentation_schema.openapi_operation,
  documentation_schema.comment_thread,
  documentation_schema.comment_reply,
  documentation_schema.comment_mention,
  documentation_schema.documentation_draft_search_document
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT DELETE ON
  documentation_schema.documentation_page_keyword,
  documentation_schema.documentation_page_block,
  documentation_schema.documentation_list_item,
  documentation_schema.navigation_node,
  documentation_schema.documentation_redirect_rule,
  documentation_schema.openapi_operation,
  documentation_schema.documentation_draft_search_document
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT ON
  documentation_schema.page_slug_alias,
  documentation_schema.documentation_command_receipt,
  documentation_schema.site_revision,
  documentation_schema.site_revision_page,
  documentation_schema.site_revision_page_keyword,
  documentation_schema.site_revision_page_block,
  documentation_schema.site_revision_list_item,
  documentation_schema.site_revision_navigation_node,
  documentation_schema.site_revision_page_alias,
  documentation_schema.site_revision_redirect_rule,
  documentation_schema.site_revision_openapi_operation,
  documentation_schema.site_revision_asset_reference,
  publish_schema.site_publication,
  publish_schema.site_publication_search_document
TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM documentation_schema.documentation_site LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.site_publication LIMIT 1)
  THEN
    RAISE EXCEPTION 'Refusing to roll back populated Documentation first vertical slice'
      USING ERRCODE='55000';
  END IF;
END;
$$;

ALTER TABLE publish_schema.publish_link_entry
  DROP CONSTRAINT fk_publish_link_entry_site_publication,
  DROP CONSTRAINT chk_publish_link_entry_family,
  DROP COLUMN site_publication_id,
  DROP COLUMN site_edition_id,
  DROP COLUMN documentation_site_id,
  ALTER COLUMN published_artifact_id SET NOT NULL,
  ADD CONSTRAINT chk_publish_link_entry_family CHECK (
    (guide_id IS NOT NULL AND guide_edition_id IS NOT NULL AND interactive_demo_id IS NULL AND interactive_demo_edition_id IS NULL)
    OR (interactive_demo_id IS NOT NULL AND interactive_demo_edition_id IS NOT NULL AND guide_id IS NULL AND guide_edition_id IS NULL)
  );

ALTER TABLE publish_schema.publish_link
  DROP CONSTRAINT fk_publish_link_documentation_site,
  DROP CONSTRAINT chk_publish_link_family,
  DROP CONSTRAINT chk_publish_link_resource_family,
  DROP COLUMN documentation_site_id,
  DROP COLUMN resource_family,
  ALTER COLUMN artifact_type SET NOT NULL,
  ADD CONSTRAINT chk_publish_link_type CHECK (artifact_type IN ('guide','interactive_demo')),
  ADD CONSTRAINT chk_publish_link_family CHECK (
    (artifact_type='guide' AND guide_id IS NOT NULL AND interactive_demo_id IS NULL)
    OR (artifact_type='interactive_demo' AND interactive_demo_id IS NOT NULL AND guide_id IS NULL)
  );

DROP TABLE publish_schema.site_publication_search_document;
DROP TABLE publish_schema.site_publication;
DROP TABLE documentation_schema.site_revision_asset_reference;
DROP TABLE documentation_schema.site_revision_openapi_operation;
DROP TABLE documentation_schema.site_revision_redirect_rule;
DROP TABLE documentation_schema.site_revision_page_alias;
DROP TABLE documentation_schema.site_revision_navigation_node;
DROP TABLE documentation_schema.site_revision_list_item;
DROP TABLE documentation_schema.site_revision_page_block;
DROP TABLE documentation_schema.site_revision_page_keyword;
DROP TABLE documentation_schema.site_revision_page;
DROP TABLE documentation_schema.site_revision;
DROP TABLE documentation_schema.documentation_draft_search_document;
DROP TABLE documentation_schema.documentation_command_receipt;
DROP TABLE documentation_schema.comment_mention;
DROP TABLE documentation_schema.comment_reply;
DROP TABLE documentation_schema.comment_thread;
DROP TABLE documentation_schema.openapi_operation;
DROP TABLE documentation_schema.openapi_source;
DROP TABLE documentation_schema.openapi_inspection;
DROP TABLE documentation_schema.documentation_asset;
DROP TABLE documentation_schema.documentation_redirect_rule;
DROP TABLE documentation_schema.page_slug_alias;
DROP TABLE documentation_schema.navigation_node;
DROP TABLE documentation_schema.routing_set;
DROP TABLE documentation_schema.navigation_tree;
DROP TABLE documentation_schema.documentation_list_item;
DROP TABLE documentation_schema.documentation_page_block;
DROP TABLE documentation_schema.documentation_page_keyword;
ALTER TABLE documentation_schema.site_working_draft DROP CONSTRAINT fk_site_working_draft_home_page;
DROP TABLE documentation_schema.documentation_page;
DROP TABLE documentation_schema.site_working_draft;
DROP TABLE documentation_schema.site_edition;
DROP TABLE documentation_schema.documentation_site;
ALTER TABLE file_schema.file DROP CONSTRAINT uq_file_id_organization;
DROP FUNCTION documentation_schema.prevent_immutable_documentation_mutation();
DROP SCHEMA documentation_schema;
