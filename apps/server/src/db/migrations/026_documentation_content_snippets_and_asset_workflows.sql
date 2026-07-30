-- 026_documentation_content_snippets_and_asset_workflows.sql
-- Created On: 2026-07-30

-- UP:

ALTER TABLE publish_schema.published_artifact
  ADD CONSTRAINT uq_published_artifact_type_scope
  UNIQUE (id, artifact_type, project_id, organization_id);

ALTER TABLE documentation_schema.documentation_page_block
  DROP CONSTRAINT documentation_page_block_kind_check,
  ADD COLUMN callout_tone VARCHAR(20) DEFAULT NULL,
  ADD COLUMN display_title VARCHAR(200) DEFAULT NULL,
  ADD COLUMN quote_attribution VARCHAR(200) DEFAULT NULL,
  ADD COLUMN table_caption VARCHAR(1000) DEFAULT NULL,
  ADD COLUMN linked_block_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN snippet_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN published_artifact_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN published_artifact_type VARCHAR(50) DEFAULT NULL,
  ADD COLUMN capture_asset_id VARCHAR(26) DEFAULT NULL,
  ADD CONSTRAINT chk_documentation_page_block_kind CHECK (
    kind IN (
      'paragraph','heading','ordered_list','unordered_list','code','link',
      'image','divider','api_reference','quote','table','code_example',
      'callout','tabs','snippet_reference','guide_publication',
      'interactive_demo_publication'
    )
  ),
  ADD CONSTRAINT chk_documentation_page_block_callout_tone CHECK (
    callout_tone IS NULL OR callout_tone IN ('info','success','warning','danger')
  ),
  ADD CONSTRAINT chk_documentation_page_block_asset_source CHECK (
    kind <> 'image'
    OR ((documentation_asset_id IS NOT NULL)::INTEGER +
        (capture_asset_id IS NOT NULL)::INTEGER = 1)
  ),
  ADD CONSTRAINT chk_documentation_page_block_publication_type CHECK (
    (kind='guide_publication' AND published_artifact_id IS NOT NULL
      AND published_artifact_type='guide')
    OR (kind='interactive_demo_publication' AND published_artifact_id IS NOT NULL
      AND published_artifact_type='interactive_demo')
    OR (kind NOT IN ('guide_publication','interactive_demo_publication')
      AND published_artifact_id IS NULL AND published_artifact_type IS NULL)
  ),
  ADD CONSTRAINT fk_documentation_page_block_linked_page FOREIGN KEY
    (linked_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page
    (id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_documentation_page_block_linked_heading FOREIGN KEY
    (linked_block_id, linked_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page_block
    (id, documentation_page_id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT fk_documentation_page_block_documentation_asset FOREIGN KEY
    (documentation_asset_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_asset
    (id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_documentation_page_block_capture_asset FOREIGN KEY
    (capture_asset_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, project_id, organization_id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_documentation_page_block_openapi_source FOREIGN KEY
    (openapi_source_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.openapi_source
    (id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_documentation_page_block_publication FOREIGN KEY
    (published_artifact_id, published_artifact_type, project_id, organization_id)
    REFERENCES publish_schema.published_artifact
    (id, artifact_type, project_id, organization_id) ON DELETE RESTRICT;

CREATE TABLE documentation_schema.documentation_table_row (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_page_id VARCHAR(26) NOT NULL,
  documentation_page_block_id VARCHAR(26) NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 200),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_documentation_table_row_scope UNIQUE
    (id, documentation_page_block_id, documentation_page_id,
     site_edition_id, project_id, organization_id),
  CONSTRAINT uq_documentation_table_row_position UNIQUE
    (documentation_page_block_id, position) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT fk_documentation_table_row_block FOREIGN KEY
    (documentation_page_block_id, documentation_page_id, site_edition_id,
     project_id, organization_id)
    REFERENCES documentation_schema.documentation_page_block
    (id, documentation_page_id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_table_cell (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_page_id VARCHAR(26) NOT NULL,
  documentation_page_block_id VARCHAR(26) NOT NULL,
  documentation_table_row_id VARCHAR(26) NOT NULL,
  column_position INTEGER NOT NULL CHECK (column_position BETWEEN 1 AND 20),
  is_header BOOLEAN NOT NULL DEFAULT FALSE,
  text_content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_documentation_table_cell_position UNIQUE
    (documentation_table_row_id, column_position) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT fk_documentation_table_cell_row FOREIGN KEY
    (documentation_table_row_id, documentation_page_block_id,
     documentation_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_table_row
    (id, documentation_page_block_id, documentation_page_id,
     site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_tab_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_page_id VARCHAR(26) NOT NULL,
  documentation_page_block_id VARCHAR(26) NOT NULL,
  label VARCHAR(100) NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 100),
  body TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 20),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_documentation_tab_item_position UNIQUE
    (documentation_page_block_id, position) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT uq_documentation_tab_item_label UNIQUE
    (documentation_page_block_id, label),
  CONSTRAINT fk_documentation_tab_item_block FOREIGN KEY
    (documentation_page_block_id, documentation_page_id, site_edition_id,
     project_id, organization_id)
    REFERENCES documentation_schema.documentation_page_block
    (id, documentation_page_id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_snippet (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  documentation_site_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_working_draft_id VARCHAR(26) NOT NULL,
  name VARCHAR(200) NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_snippet_scope UNIQUE
    (id, site_edition_id, project_id, organization_id),
  CONSTRAINT fk_documentation_snippet_draft FOREIGN KEY
    (site_working_draft_id, site_edition_id, documentation_site_id,
     project_id, organization_id)
    REFERENCES documentation_schema.site_working_draft
    (id, site_edition_id, documentation_site_id, project_id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_snippet_creator FOREIGN KEY
    (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_snippet_updater FOREIGN KEY
    (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id)
    ON DELETE RESTRICT
);
CREATE UNIQUE INDEX uq_documentation_snippet_active_name
  ON documentation_schema.documentation_snippet
  (site_edition_id, lower(name)) WHERE status='active';

ALTER TABLE documentation_schema.documentation_page_block
  ADD CONSTRAINT fk_documentation_page_block_snippet FOREIGN KEY
    (snippet_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_snippet
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT;

CREATE TABLE documentation_schema.documentation_snippet_block (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_snippet_id VARCHAR(26) NOT NULL,
  kind VARCHAR(50) NOT NULL CHECK (
    kind IN (
      'paragraph','heading','ordered_list','unordered_list','code','link',
      'image','divider','api_reference','quote','table','code_example',
      'callout','tabs','guide_publication','interactive_demo_publication'
    )
  ),
  position INTEGER NOT NULL CHECK (position > 0),
  heading_level INTEGER DEFAULT NULL CHECK
    (heading_level IS NULL OR heading_level BETWEEN 2 AND 4),
  text_content TEXT DEFAULT NULL,
  code_language VARCHAR(40) DEFAULT NULL,
  link_url TEXT DEFAULT NULL,
  linked_page_id VARCHAR(26) DEFAULT NULL,
  linked_block_id VARCHAR(26) DEFAULT NULL,
  documentation_asset_id VARCHAR(26) DEFAULT NULL,
  capture_asset_id VARCHAR(26) DEFAULT NULL,
  openapi_source_id VARCHAR(26) DEFAULT NULL,
  operation_key VARCHAR(255) DEFAULT NULL,
  published_artifact_id VARCHAR(26) DEFAULT NULL,
  published_artifact_type VARCHAR(50) DEFAULT NULL,
  callout_tone VARCHAR(20) DEFAULT NULL CHECK
    (callout_tone IS NULL OR callout_tone IN ('info','success','warning','danger')),
  display_title VARCHAR(200) DEFAULT NULL,
  quote_attribution VARCHAR(200) DEFAULT NULL,
  table_caption VARCHAR(1000) DEFAULT NULL,
  alt_text VARCHAR(1000) DEFAULT NULL,
  image_caption VARCHAR(1000) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documentation_snippet_block_scope UNIQUE
    (id, documentation_snippet_id, site_edition_id, project_id, organization_id),
  CONSTRAINT uq_documentation_snippet_block_position UNIQUE
    (documentation_snippet_id, position) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT chk_documentation_snippet_block_asset_source CHECK (
    kind <> 'image'
    OR ((documentation_asset_id IS NOT NULL)::INTEGER +
        (capture_asset_id IS NOT NULL)::INTEGER = 1)
  ),
  CONSTRAINT chk_documentation_snippet_block_publication_type CHECK (
    (kind='guide_publication' AND published_artifact_id IS NOT NULL
      AND published_artifact_type='guide')
    OR (kind='interactive_demo_publication' AND published_artifact_id IS NOT NULL
      AND published_artifact_type='interactive_demo')
    OR (kind NOT IN ('guide_publication','interactive_demo_publication')
      AND published_artifact_id IS NULL AND published_artifact_type IS NULL)
  ),
  CONSTRAINT fk_documentation_snippet_block_snippet FOREIGN KEY
    (documentation_snippet_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_snippet
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_snippet_block_linked_page FOREIGN KEY
    (linked_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_snippet_block_linked_heading FOREIGN KEY
    (linked_block_id, linked_page_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_page_block
    (id, documentation_page_id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT fk_documentation_snippet_block_documentation_asset FOREIGN KEY
    (documentation_asset_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_asset
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_snippet_block_capture_asset FOREIGN KEY
    (capture_asset_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, project_id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_snippet_block_openapi_source FOREIGN KEY
    (openapi_source_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.openapi_source
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_documentation_snippet_block_publication FOREIGN KEY
    (published_artifact_id, published_artifact_type, project_id, organization_id)
    REFERENCES publish_schema.published_artifact
    (id, artifact_type, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_snippet_list_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_snippet_id VARCHAR(26) NOT NULL,
  documentation_snippet_block_id VARCHAR(26) NOT NULL,
  text_content TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_documentation_snippet_list_item_position UNIQUE
    (documentation_snippet_block_id, position),
  CONSTRAINT fk_documentation_snippet_list_item_block FOREIGN KEY
    (documentation_snippet_block_id, documentation_snippet_id,
     site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_snippet_block
    (id, documentation_snippet_id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_snippet_table_row (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_snippet_id VARCHAR(26) NOT NULL,
  documentation_snippet_block_id VARCHAR(26) NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 200),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_documentation_snippet_table_row_scope UNIQUE
    (id, documentation_snippet_block_id, documentation_snippet_id,
     site_edition_id, project_id, organization_id),
  CONSTRAINT uq_documentation_snippet_table_row_position UNIQUE
    (documentation_snippet_block_id, position),
  CONSTRAINT fk_documentation_snippet_table_row_block FOREIGN KEY
    (documentation_snippet_block_id, documentation_snippet_id,
     site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_snippet_block
    (id, documentation_snippet_id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_snippet_table_cell (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_snippet_id VARCHAR(26) NOT NULL,
  documentation_snippet_block_id VARCHAR(26) NOT NULL,
  documentation_snippet_table_row_id VARCHAR(26) NOT NULL,
  column_position INTEGER NOT NULL CHECK (column_position BETWEEN 1 AND 20),
  is_header BOOLEAN NOT NULL DEFAULT FALSE,
  text_content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_documentation_snippet_table_cell_position UNIQUE
    (documentation_snippet_table_row_id, column_position),
  CONSTRAINT fk_documentation_snippet_table_cell_row FOREIGN KEY
    (documentation_snippet_table_row_id, documentation_snippet_block_id,
     documentation_snippet_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_snippet_table_row
    (id, documentation_snippet_block_id, documentation_snippet_id,
     site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.documentation_snippet_tab_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  documentation_snippet_id VARCHAR(26) NOT NULL,
  documentation_snippet_block_id VARCHAR(26) NOT NULL,
  label VARCHAR(100) NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 100),
  body TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 20),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_documentation_snippet_tab_item_position UNIQUE
    (documentation_snippet_block_id, position),
  CONSTRAINT uq_documentation_snippet_tab_item_label UNIQUE
    (documentation_snippet_block_id, label),
  CONSTRAINT fk_documentation_snippet_tab_item_block FOREIGN KEY
    (documentation_snippet_block_id, documentation_snippet_id,
     site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.documentation_snippet_block
    (id, documentation_snippet_id, site_edition_id, project_id, organization_id)
    ON DELETE RESTRICT
);

ALTER TABLE documentation_schema.documentation_asset
  ADD COLUMN name VARCHAR(200),
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','archived')),
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  ADD COLUMN updated_by_id VARCHAR(26),
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
WITH names AS (
  SELECT asset.id,
         COALESCE(
           NULLIF(trim(regexp_replace(file.original_name,
             '[[:cntrl:]/\\]+', ' ', 'g')), ''),
           'Asset ' || right(asset.id, 6)
         ) base_name,
         count(*) OVER (
           PARTITION BY asset.site_edition_id,
           lower(COALESCE(NULLIF(trim(file.original_name), ''),
             'Asset ' || right(asset.id, 6)))
         ) duplicate_count
    FROM documentation_schema.documentation_asset asset
    JOIN file_schema.file file ON file.id=asset.file_id
)
UPDATE documentation_schema.documentation_asset asset
   SET name=left(names.base_name, 180) ||
       CASE WHEN names.duplicate_count > 1
         THEN ' ' || right(asset.id, 6) ELSE '' END,
       updated_by_id=asset.created_by_id
  FROM names WHERE names.id=asset.id;
ALTER TABLE documentation_schema.documentation_asset
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN updated_by_id SET NOT NULL,
  ADD CONSTRAINT fk_documentation_asset_updater FOREIGN KEY
    (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id)
    ON DELETE RESTRICT;
CREATE UNIQUE INDEX uq_documentation_asset_active_name
  ON documentation_schema.documentation_asset
  (site_edition_id, lower(name)) WHERE status='active';

ALTER TABLE documentation_schema.site_revision_page_block
  ADD COLUMN linked_source_block_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN source_kind VARCHAR(30) DEFAULT NULL,
  ADD COLUMN source_snippet_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN published_artifact_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN published_artifact_type VARCHAR(50) DEFAULT NULL,
  ADD COLUMN callout_tone VARCHAR(20) DEFAULT NULL,
  ADD COLUMN display_title VARCHAR(200) DEFAULT NULL,
  ADD COLUMN quote_attribution VARCHAR(200) DEFAULT NULL,
  ADD COLUMN table_caption VARCHAR(1000) DEFAULT NULL;

ALTER TABLE documentation_schema.site_revision_asset_reference
  DROP CONSTRAINT uq_site_revision_asset_source,
  ADD COLUMN source_kind VARCHAR(30) NOT NULL DEFAULT 'documentation_asset'
    CHECK (source_kind IN ('documentation_asset','capture_asset')),
  ADD COLUMN byte_size BIGINT DEFAULT NULL,
  ADD COLUMN width INTEGER DEFAULT NULL,
  ADD COLUMN height INTEGER DEFAULT NULL,
  ADD CONSTRAINT uq_site_revision_asset_source
    UNIQUE (site_revision_id, source_kind, source_asset_id);

CREATE TABLE documentation_schema.site_revision_page_table_row (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_page_block_id VARCHAR(26) NOT NULL,
  source_row_id VARCHAR(26) NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT uq_site_revision_page_table_row_position UNIQUE
    (site_revision_page_block_id, position),
  CONSTRAINT fk_site_revision_page_table_row_block FOREIGN KEY
    (site_revision_page_block_id)
    REFERENCES documentation_schema.site_revision_page_block(id)
    ON DELETE RESTRICT
);
CREATE TABLE documentation_schema.site_revision_page_table_cell (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_page_table_row_id VARCHAR(26) NOT NULL,
  source_cell_id VARCHAR(26) NOT NULL,
  column_position INTEGER NOT NULL,
  is_header BOOLEAN NOT NULL,
  text_content TEXT NOT NULL,
  CONSTRAINT uq_site_revision_page_table_cell_position UNIQUE
    (site_revision_page_table_row_id, column_position),
  CONSTRAINT fk_site_revision_page_table_cell_row FOREIGN KEY
    (site_revision_page_table_row_id)
    REFERENCES documentation_schema.site_revision_page_table_row(id)
    ON DELETE RESTRICT
);
CREATE TABLE documentation_schema.site_revision_page_tab_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_page_block_id VARCHAR(26) NOT NULL,
  source_tab_item_id VARCHAR(26) NOT NULL,
  label VARCHAR(100) NOT NULL,
  body TEXT NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT uq_site_revision_page_tab_item_position UNIQUE
    (site_revision_page_block_id, position),
  CONSTRAINT fk_site_revision_page_tab_item_block FOREIGN KEY
    (site_revision_page_block_id)
    REFERENCES documentation_schema.site_revision_page_block(id)
    ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_snippet (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_snippet_id VARCHAR(26) NOT NULL,
  name VARCHAR(200) NOT NULL,
  source_status VARCHAR(20) NOT NULL,
  CONSTRAINT uq_site_revision_snippet_scope UNIQUE
    (id, site_revision_id, source_snippet_id),
  CONSTRAINT uq_site_revision_snippet_source UNIQUE
    (site_revision_id, source_snippet_id),
  CONSTRAINT fk_site_revision_snippet_revision FOREIGN KEY
    (site_revision_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.site_revision
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT
);
CREATE TABLE documentation_schema.site_revision_snippet_block (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_snippet_id VARCHAR(26) NOT NULL,
  source_snippet_id VARCHAR(26) NOT NULL,
  source_block_id VARCHAR(26) NOT NULL,
  kind VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL,
  heading_level INTEGER DEFAULT NULL,
  text_content TEXT DEFAULT NULL,
  code_language VARCHAR(40) DEFAULT NULL,
  link_url TEXT DEFAULT NULL,
  linked_source_page_id VARCHAR(26) DEFAULT NULL,
  linked_source_block_id VARCHAR(26) DEFAULT NULL,
  source_kind VARCHAR(30) DEFAULT NULL,
  source_asset_id VARCHAR(26) DEFAULT NULL,
  source_openapi_source_id VARCHAR(26) DEFAULT NULL,
  operation_key VARCHAR(255) DEFAULT NULL,
  published_artifact_id VARCHAR(26) DEFAULT NULL,
  published_artifact_type VARCHAR(50) DEFAULT NULL,
  callout_tone VARCHAR(20) DEFAULT NULL,
  display_title VARCHAR(200) DEFAULT NULL,
  quote_attribution VARCHAR(200) DEFAULT NULL,
  table_caption VARCHAR(1000) DEFAULT NULL,
  alt_text VARCHAR(1000) DEFAULT NULL,
  image_caption VARCHAR(1000) DEFAULT NULL,
  CONSTRAINT uq_site_revision_snippet_block_source UNIQUE
    (site_revision_id, source_block_id),
  CONSTRAINT uq_site_revision_snippet_block_position UNIQUE
    (site_revision_snippet_id, position),
  CONSTRAINT fk_site_revision_snippet_block_snippet FOREIGN KEY
    (site_revision_snippet_id, site_revision_id, source_snippet_id)
    REFERENCES documentation_schema.site_revision_snippet
    (id, site_revision_id, source_snippet_id) ON DELETE RESTRICT
);
CREATE TABLE documentation_schema.site_revision_snippet_list_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_snippet_block_id VARCHAR(26) NOT NULL,
  source_list_item_id VARCHAR(26) NOT NULL,
  text_content TEXT NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT uq_site_revision_snippet_list_item_position UNIQUE
    (site_revision_snippet_block_id, position),
  CONSTRAINT fk_site_revision_snippet_list_item_block FOREIGN KEY
    (site_revision_snippet_block_id)
    REFERENCES documentation_schema.site_revision_snippet_block(id)
    ON DELETE RESTRICT
);
CREATE TABLE documentation_schema.site_revision_snippet_table_row (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_snippet_block_id VARCHAR(26) NOT NULL,
  source_row_id VARCHAR(26) NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT uq_site_revision_snippet_table_row_scope UNIQUE
    (id, site_revision_snippet_block_id),
  CONSTRAINT uq_site_revision_snippet_table_row_position UNIQUE
    (site_revision_snippet_block_id, position),
  CONSTRAINT fk_site_revision_snippet_table_row_block FOREIGN KEY
    (site_revision_snippet_block_id)
    REFERENCES documentation_schema.site_revision_snippet_block(id)
    ON DELETE RESTRICT
);
CREATE TABLE documentation_schema.site_revision_snippet_table_cell (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_snippet_table_row_id VARCHAR(26) NOT NULL,
  source_cell_id VARCHAR(26) NOT NULL,
  column_position INTEGER NOT NULL,
  is_header BOOLEAN NOT NULL,
  text_content TEXT NOT NULL,
  CONSTRAINT uq_site_revision_snippet_table_cell_position UNIQUE
    (site_revision_snippet_table_row_id, column_position),
  CONSTRAINT fk_site_revision_snippet_table_cell_row FOREIGN KEY
    (site_revision_snippet_table_row_id)
    REFERENCES documentation_schema.site_revision_snippet_table_row(id)
    ON DELETE RESTRICT
);
CREATE TABLE documentation_schema.site_revision_snippet_tab_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  site_revision_snippet_block_id VARCHAR(26) NOT NULL,
  source_tab_item_id VARCHAR(26) NOT NULL,
  label VARCHAR(100) NOT NULL,
  body TEXT NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT uq_site_revision_snippet_tab_item_position UNIQUE
    (site_revision_snippet_block_id, position),
  CONSTRAINT fk_site_revision_snippet_tab_item_block FOREIGN KEY
    (site_revision_snippet_block_id)
    REFERENCES documentation_schema.site_revision_snippet_block(id)
    ON DELETE RESTRICT
);

CREATE TABLE documentation_schema.site_revision_artifact_reference (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  site_edition_id VARCHAR(26) NOT NULL,
  site_revision_id VARCHAR(26) NOT NULL,
  source_block_id VARCHAR(26) NOT NULL,
  published_artifact_id VARCHAR(26) NOT NULL,
  artifact_type VARCHAR(50) NOT NULL
    CHECK (artifact_type IN ('guide','interactive_demo')),
  frozen_title VARCHAR(200) NOT NULL,
  frozen_description VARCHAR(1000) DEFAULT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  project_version_name VARCHAR(200) NOT NULL,
  project_version_slug VARCHAR(100) NOT NULL,
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  publication_sequence INTEGER NOT NULL CHECK (publication_sequence > 0),
  CONSTRAINT uq_site_revision_artifact_reference UNIQUE
    (site_revision_id, source_block_id),
  CONSTRAINT fk_site_revision_artifact_reference_revision FOREIGN KEY
    (site_revision_id, site_edition_id, project_id, organization_id)
    REFERENCES documentation_schema.site_revision
    (id, site_edition_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_site_revision_artifact_reference_publication FOREIGN KEY
    (published_artifact_id, artifact_type, project_id, organization_id)
    REFERENCES publish_schema.published_artifact
    (id, artifact_type, project_id, organization_id) ON DELETE RESTRICT
);

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'site_revision_page_table_row',
    'site_revision_page_table_cell',
    'site_revision_page_tab_item',
    'site_revision_snippet',
    'site_revision_snippet_block',
    'site_revision_snippet_list_item',
    'site_revision_snippet_table_row',
    'site_revision_snippet_table_cell',
    'site_revision_snippet_tab_item',
    'site_revision_artifact_reference'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON documentation_schema.%I
       FOR EACH ROW EXECUTE FUNCTION
       documentation_schema.prevent_immutable_documentation_mutation()',
      table_name || '_immutable', table_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN
    RETURN NULL;
  END IF;
  RAISE EXCEPTION 'immutable Documentation history cannot be changed'
    USING ERRCODE='55000';
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'site_revision','site_revision_page','site_revision_page_keyword',
    'site_revision_page_block','site_revision_list_item',
    'site_revision_navigation_node','site_revision_page_alias',
    'site_revision_redirect_rule','site_revision_openapi_operation',
    'site_revision_asset_reference','site_revision_page_table_row',
    'site_revision_page_table_cell','site_revision_page_tab_item',
    'site_revision_snippet','site_revision_snippet_block',
    'site_revision_snippet_list_item','site_revision_snippet_table_row',
    'site_revision_snippet_table_cell','site_revision_snippet_tab_item',
    'site_revision_artifact_reference','page_slug_alias'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE TRUNCATE ON documentation_schema.%I
       FOR EACH STATEMENT EXECUTE FUNCTION
       documentation_schema.prevent_immutable_documentation_mutation()',
      table_name || '_no_truncate', table_name
    );
  END LOOP;
END;
$$;
CREATE TRIGGER site_publication_no_truncate
BEFORE TRUNCATE ON publish_schema.site_publication
FOR EACH STATEMENT EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();
CREATE TRIGGER site_publication_search_no_truncate
BEFORE TRUNCATE ON publish_schema.site_publication_search_document
FOR EACH STATEMENT EXECUTE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation();

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid_v025;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT,
  selected_action TEXT,
  selected_actor_type TEXT,
  selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v025(
    selected_command,selected_action,selected_actor_type,selected_source_type
  ) OR (
    (selected_command,selected_action) IN (
      ('documentation.snippet.create','documentation.snippet_created'),
      ('documentation.snippet.update','documentation.snippet_updated'),
      ('documentation.snippet.content_replace',
       'documentation.snippet_content_replaced'),
      ('documentation.snippet.archive','documentation.snippet_archived'),
      ('documentation.snippet.restore','documentation.snippet_restored'),
      ('documentation.asset.update','documentation.asset_updated'),
      ('documentation.asset.archive','documentation.asset_archived'),
      ('documentation.asset.restore','documentation.asset_restored')
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
CREATE TRIGGER documentation_snippet_u_audit_ctx
  BEFORE UPDATE ON documentation_schema.documentation_snippet
  FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
    'documentation_snippet','direct',
    'documentation.snippet.update,documentation.snippet.content_replace,documentation.snippet.archive,documentation.snippet.restore'
  );
CREATE CONSTRAINT TRIGGER documentation_snippet_u_audit_evd
  AFTER UPDATE ON documentation_schema.documentation_snippet
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
    'documentation_snippet','direct',
    'documentation.snippet.update,documentation.snippet.content_replace,documentation.snippet.archive,documentation.snippet.restore'
  );
CREATE TRIGGER documentation_asset_u_audit_ctx
  BEFORE UPDATE ON documentation_schema.documentation_asset
  FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(
    'documentation_asset','direct',
    'documentation.asset.update,documentation.asset.archive,documentation.asset.restore'
  );
CREATE CONSTRAINT TRIGGER documentation_asset_u_audit_evd
  AFTER UPDATE ON documentation_schema.documentation_asset
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION audit_schema.verify_mutation_evidence(
    'documentation_asset','direct',
    'documentation.asset.update,documentation.asset.archive,documentation.asset.restore'
  );

DROP TRIGGER capture_asset_purge_request_guard
  ON capture_schema.capture_asset_purge_operation;
ALTER FUNCTION capture_schema.enforce_capture_asset_purge_request()
  RENAME TO enforce_capture_asset_purge_request_v025;
CREATE FUNCTION capture_schema.enforce_capture_asset_purge_request()
RETURNS TRIGGER AS $$
DECLARE asset_file_id TEXT; version_status TEXT;
BEGIN
  IF NEW.status<>'pending' THEN RETURN NEW; END IF;
  SELECT asset.file_id,version.status INTO asset_file_id,version_status
    FROM capture_schema.capture_asset asset
    JOIN capture_schema.capture_session session
      ON session.id=asset.capture_session_id
    JOIN project_schema.project_version version
      ON version.id=session.project_version_id
    WHERE asset.id=NEW.capture_asset_id AND asset.project_id=NEW.project_id
      AND asset.organization_id=NEW.organization_id
      AND asset.status='archived' AND asset.is_deleted=FALSE
    FOR UPDATE OF asset;
  IF asset_file_id IS NULL THEN
    RAISE EXCEPTION 'Capture Asset cannot be purged'
      USING ERRCODE='23514',
      CONSTRAINT='capture_asset_purge_protection_guard';
  END IF;
  IF version_status<>'active' THEN
    RAISE EXCEPTION 'Archived Project Versions are read-only'
      USING ERRCODE='23514',
      CONSTRAINT='capture_asset_purge_version_guard';
  END IF;
  IF EXISTS(
      SELECT 1 FROM capture_schema.capture_asset other
       WHERE other.file_id=asset_file_id
         AND other.id<>NEW.capture_asset_id AND other.is_deleted=FALSE
    )
    OR EXISTS(
      SELECT 1 FROM guide_schema.guide_step
       WHERE project_id=NEW.project_id
         AND organization_id=NEW.organization_id AND is_deleted=FALSE
         AND NEW.capture_asset_id IN(
           source_capture_asset_id,selected_capture_asset_id
         )
    )
    OR EXISTS(
      SELECT 1 FROM interactive_demo_schema.demo_scene
       WHERE project_id=NEW.project_id
         AND organization_id=NEW.organization_id AND is_deleted=FALSE
         AND NEW.capture_asset_id IN(
           source_capture_asset_id,background_capture_asset_id
         )
    )
    OR EXISTS(
      SELECT 1 FROM guide_schema.guide_revision_step
       WHERE project_id=NEW.project_id
         AND organization_id=NEW.organization_id
         AND NEW.capture_asset_id IN(
           source_capture_asset_id,selected_capture_asset_id
         )
    )
    OR EXISTS(
      SELECT 1 FROM interactive_demo_schema.demo_revision_scene
       WHERE project_id=NEW.project_id
         AND organization_id=NEW.organization_id
         AND NEW.capture_asset_id IN(
           source_capture_asset_id,background_capture_asset_id
         )
    )
    OR EXISTS(
      SELECT 1
        FROM documentation_schema.documentation_page_block block
       WHERE block.project_id=NEW.project_id
         AND block.organization_id=NEW.organization_id
         AND block.capture_asset_id=NEW.capture_asset_id
    )
    OR EXISTS(
      SELECT 1
        FROM documentation_schema.documentation_snippet_block block
       WHERE block.project_id=NEW.project_id
         AND block.organization_id=NEW.organization_id
         AND block.capture_asset_id=NEW.capture_asset_id
    )
    OR EXISTS(
      SELECT 1
        FROM documentation_schema.site_revision_asset_reference reference
       WHERE reference.project_id=NEW.project_id
         AND reference.organization_id=NEW.organization_id
         AND reference.source_kind='capture_asset'
         AND reference.source_asset_id=NEW.capture_asset_id
    )
  THEN
    RAISE EXCEPTION 'Capture Asset is protected'
      USING ERRCODE='23514',
      CONSTRAINT='capture_asset_purge_protection_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER capture_asset_purge_request_guard
  BEFORE INSERT OR UPDATE
  ON capture_schema.capture_asset_purge_operation
  FOR EACH ROW EXECUTE FUNCTION
  capture_schema.enforce_capture_asset_purge_request();
GRANT EXECUTE ON FUNCTION capture_schema.enforce_capture_asset_purge_request()
  TO __OSSIE_RUNTIME_DB_ROLE__;

GRANT SELECT,INSERT,UPDATE ON
  documentation_schema.documentation_snippet,
  documentation_schema.documentation_snippet_block,
  documentation_schema.documentation_snippet_list_item,
  documentation_schema.documentation_snippet_table_row,
  documentation_schema.documentation_snippet_table_cell,
  documentation_schema.documentation_snippet_tab_item,
  documentation_schema.documentation_table_row,
  documentation_schema.documentation_table_cell,
  documentation_schema.documentation_tab_item
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT DELETE ON
  documentation_schema.documentation_snippet_block,
  documentation_schema.documentation_snippet_list_item,
  documentation_schema.documentation_snippet_table_row,
  documentation_schema.documentation_snippet_table_cell,
  documentation_schema.documentation_snippet_tab_item,
  documentation_schema.documentation_table_row,
  documentation_schema.documentation_table_cell,
  documentation_schema.documentation_tab_item
TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT,INSERT ON
  documentation_schema.site_revision_page_table_row,
  documentation_schema.site_revision_page_table_cell,
  documentation_schema.site_revision_page_tab_item,
  documentation_schema.site_revision_snippet,
  documentation_schema.site_revision_snippet_block,
  documentation_schema.site_revision_snippet_list_item,
  documentation_schema.site_revision_snippet_table_row,
  documentation_schema.site_revision_snippet_table_cell,
  documentation_schema.site_revision_snippet_tab_item,
  documentation_schema.site_revision_artifact_reference
TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM documentation_schema.documentation_snippet LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM documentation_schema.documentation_page_block
       WHERE kind IN (
         'quote','table','code_example','callout','tabs','snippet_reference',
         'guide_publication','interactive_demo_publication'
       ) LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM documentation_schema.documentation_page_block
       WHERE linked_block_id IS NOT NULL OR capture_asset_id IS NOT NULL
       LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM documentation_schema.site_revision_artifact_reference LIMIT 1
    )
  THEN
    RAISE EXCEPTION 'Refusing to roll back populated Documentation content workflows'
      USING ERRCODE='55000';
  END IF;
END;
$$;

DROP TRIGGER site_publication_search_no_truncate
  ON publish_schema.site_publication_search_document;
DROP TRIGGER site_publication_no_truncate
  ON publish_schema.site_publication;
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'site_revision','site_revision_page','site_revision_page_keyword',
    'site_revision_page_block','site_revision_list_item',
    'site_revision_navigation_node','site_revision_page_alias',
    'site_revision_redirect_rule','site_revision_openapi_operation',
    'site_revision_asset_reference','page_slug_alias'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER %I ON documentation_schema.%I',
      table_name || '_no_truncate', table_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION
documentation_schema.prevent_immutable_documentation_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'immutable Documentation history cannot be changed'
    USING ERRCODE='55000';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER capture_asset_purge_request_guard
  ON capture_schema.capture_asset_purge_operation;
DROP FUNCTION capture_schema.enforce_capture_asset_purge_request();
ALTER FUNCTION capture_schema.enforce_capture_asset_purge_request_v025()
  RENAME TO enforce_capture_asset_purge_request;
CREATE TRIGGER capture_asset_purge_request_guard
  BEFORE INSERT OR UPDATE
  ON capture_schema.capture_asset_purge_operation
  FOR EACH ROW EXECUTE FUNCTION
  capture_schema.enforce_capture_asset_purge_request();

DROP TRIGGER documentation_asset_u_audit_evd
  ON documentation_schema.documentation_asset;
DROP TRIGGER documentation_asset_u_audit_ctx
  ON documentation_schema.documentation_asset;
DROP TRIGGER documentation_snippet_u_audit_evd
  ON documentation_schema.documentation_snippet;
DROP TRIGGER documentation_snippet_u_audit_ctx
  ON documentation_schema.documentation_snippet;
DROP TRIGGER documentation_snippet_i_audit_evd
  ON documentation_schema.documentation_snippet;
DROP TRIGGER documentation_snippet_i_audit_ctx
  ON documentation_schema.documentation_snippet;
DROP FUNCTION audit_schema.mutation_command_policy_is_valid(
  TEXT,TEXT,TEXT,TEXT
);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v025(
  TEXT,TEXT,TEXT,TEXT
) RENAME TO mutation_command_policy_is_valid;

DROP TABLE documentation_schema.site_revision_artifact_reference;
DROP TABLE documentation_schema.site_revision_snippet_tab_item;
DROP TABLE documentation_schema.site_revision_snippet_table_cell;
DROP TABLE documentation_schema.site_revision_snippet_table_row;
DROP TABLE documentation_schema.site_revision_snippet_list_item;
DROP TABLE documentation_schema.site_revision_snippet_block;
DROP TABLE documentation_schema.site_revision_snippet;
DROP TABLE documentation_schema.site_revision_page_tab_item;
DROP TABLE documentation_schema.site_revision_page_table_cell;
DROP TABLE documentation_schema.site_revision_page_table_row;

ALTER TABLE documentation_schema.site_revision_asset_reference
  DROP CONSTRAINT uq_site_revision_asset_source,
  DROP COLUMN height,
  DROP COLUMN width,
  DROP COLUMN byte_size,
  DROP COLUMN source_kind,
  ADD CONSTRAINT uq_site_revision_asset_source
    UNIQUE (site_revision_id, source_asset_id);
ALTER TABLE documentation_schema.site_revision_page_block
  DROP COLUMN table_caption,
  DROP COLUMN quote_attribution,
  DROP COLUMN display_title,
  DROP COLUMN callout_tone,
  DROP COLUMN published_artifact_type,
  DROP COLUMN published_artifact_id,
  DROP COLUMN source_snippet_id,
  DROP COLUMN source_kind,
  DROP COLUMN linked_source_block_id;

DROP INDEX documentation_schema.uq_documentation_asset_active_name;
ALTER TABLE documentation_schema.documentation_asset
  DROP CONSTRAINT fk_documentation_asset_updater,
  DROP COLUMN updated_at,
  DROP COLUMN updated_by_id,
  DROP COLUMN version,
  DROP COLUMN status,
  DROP COLUMN name;

DROP TABLE documentation_schema.documentation_snippet_tab_item;
DROP TABLE documentation_schema.documentation_snippet_table_cell;
DROP TABLE documentation_schema.documentation_snippet_table_row;
DROP TABLE documentation_schema.documentation_snippet_list_item;
ALTER TABLE documentation_schema.documentation_page_block
  DROP CONSTRAINT fk_documentation_page_block_snippet;
DROP TABLE documentation_schema.documentation_snippet_block;
DROP INDEX documentation_schema.uq_documentation_snippet_active_name;
DROP TABLE documentation_schema.documentation_snippet;
DROP TABLE documentation_schema.documentation_tab_item;
DROP TABLE documentation_schema.documentation_table_cell;
DROP TABLE documentation_schema.documentation_table_row;

ALTER TABLE documentation_schema.documentation_page_block
  DROP CONSTRAINT fk_documentation_page_block_publication,
  DROP CONSTRAINT fk_documentation_page_block_openapi_source,
  DROP CONSTRAINT fk_documentation_page_block_capture_asset,
  DROP CONSTRAINT fk_documentation_page_block_documentation_asset,
  DROP CONSTRAINT fk_documentation_page_block_linked_heading,
  DROP CONSTRAINT fk_documentation_page_block_linked_page,
  DROP CONSTRAINT chk_documentation_page_block_publication_type,
  DROP CONSTRAINT chk_documentation_page_block_asset_source,
  DROP CONSTRAINT chk_documentation_page_block_callout_tone,
  DROP CONSTRAINT chk_documentation_page_block_kind,
  DROP COLUMN capture_asset_id,
  DROP COLUMN published_artifact_type,
  DROP COLUMN published_artifact_id,
  DROP COLUMN snippet_id,
  DROP COLUMN linked_block_id,
  DROP COLUMN table_caption,
  DROP COLUMN quote_attribution,
  DROP COLUMN display_title,
  DROP COLUMN callout_tone,
  ADD CONSTRAINT documentation_page_block_kind_check CHECK (
    kind IN (
      'paragraph','heading','ordered_list','unordered_list','code','link',
      'image','divider','api_reference'
    )
  );
ALTER TABLE publish_schema.published_artifact
  DROP CONSTRAINT uq_published_artifact_type_scope;
