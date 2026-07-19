-- 022_guide_demo_edition_working_draft_relational_foundation.sql
-- Created On: 2026-07-19

-- UP:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM guide_schema.guide LIMIT 1)
    OR EXISTS (SELECT 1 FROM guide_schema.guide_block LIMIT 1)
    OR EXISTS (SELECT 1 FROM guide_schema.guide_step LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.interactive_demo LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.demo_scene LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.demo_hotspot LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM publish_schema.published_artifact
      WHERE artifact_type IN ('guide', 'interactive_demo') LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM publish_schema.publish_link
      WHERE artifact_type IN ('guide', 'interactive_demo') LIMIT 1
    )
  THEN
    RAISE EXCEPTION 'Refusing Guide/Demo relational migration while authored or published rows exist; reset and reseed through migration 022'
      USING ERRCODE = '55000';
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS guide_project_version_legacy_content_guard ON guide_schema.guide;
DROP TRIGGER IF EXISTS interactive_demo_project_version_legacy_content_guard
  ON interactive_demo_schema.interactive_demo;
DROP TRIGGER IF EXISTS trg_demo_hotspot_target_scene_scope
  ON interactive_demo_schema.demo_hotspot;
DROP FUNCTION IF EXISTS interactive_demo_schema.enforce_demo_hotspot_target_scene_scope();

DROP TABLE interactive_demo_schema.demo_hotspot;
DROP TABLE interactive_demo_schema.demo_scene;
DROP TABLE interactive_demo_schema.interactive_demo;
DROP TABLE guide_schema.guide_step;
DROP TABLE guide_schema.guide_block;
DROP TABLE guide_schema.guide;

ALTER TABLE capture_schema.capture_session
  ADD CONSTRAINT uq_capture_session_id_version_project_organization
  UNIQUE (id, project_version_id, project_id, organization_id);
ALTER TABLE capture_schema.capture_asset
  ADD CONSTRAINT uq_capture_asset_id_project_organization
  UNIQUE (id, project_id, organization_id);
ALTER TABLE capture_schema.capture_event
  ADD CONSTRAINT uq_capture_event_id_session_project_organization
  UNIQUE (id, capture_session_id, project_id, organization_id);

CREATE TABLE IF NOT EXISTS guide_schema.guide (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_guide_id_project_organization UNIQUE (id, project_id, organization_id),
  CONSTRAINT fk_guide_project_organization FOREIGN KEY (project_id, organization_id)
    REFERENCES project_schema.project(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT
);
COMMENT ON TABLE guide_schema.guide IS
  'Immutable stable Guide Artifact identity. Mutable metadata and lifecycle belong to Guide Editions.';

CREATE TABLE IF NOT EXISTS guide_schema.guide_edition (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  guide_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  source_capture_session_id VARCHAR(26) DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_guide_edition_artifact_version UNIQUE (guide_id, project_version_id),
  CONSTRAINT uq_guide_edition_scope UNIQUE (id, guide_id, project_version_id, project_id, organization_id),
  CONSTRAINT uq_guide_edition_id_project_organization UNIQUE (id, project_id, organization_id),
  CONSTRAINT fk_guide_edition_artifact_scope FOREIGN KEY (guide_id, project_id, organization_id)
    REFERENCES guide_schema.guide(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_edition_version_scope FOREIGN KEY (project_version_id, project_id, organization_id)
    REFERENCES project_schema.project_version(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_edition_source_session_scope
    FOREIGN KEY (source_capture_session_id, project_version_id, project_id, organization_id)
    REFERENCES capture_schema.capture_session(id, project_version_id, project_id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_guide_edition_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_edition_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_guide_edition_title CHECK (length(trim(title)) > 0),
  CONSTRAINT chk_guide_edition_status CHECK (status IN ('draft', 'archived')),
  CONSTRAINT chk_guide_edition_version CHECK (version > 0)
);
CREATE INDEX idx_guide_edition_scope_status_created
  ON guide_schema.guide_edition
  (organization_id, project_id, project_version_id, status, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS guide_schema.guide_working_draft (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  guide_edition_id VARCHAR(26) NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_guide_working_draft_scope UNIQUE (id, project_id, organization_id),
  CONSTRAINT fk_guide_working_draft_edition_scope FOREIGN KEY (guide_edition_id, project_id, organization_id)
    REFERENCES guide_schema.guide_edition(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_working_draft_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_working_draft_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_guide_working_draft_version CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS guide_schema.guide_block (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  guide_working_draft_id VARCHAR(26) NOT NULL,
  block_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  body TEXT DEFAULT NULL,
  block_index INTEGER NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_guide_block_scope UNIQUE (id, guide_working_draft_id, project_id, organization_id),
  CONSTRAINT fk_guide_block_draft_scope FOREIGN KEY (guide_working_draft_id, project_id, organization_id)
    REFERENCES guide_schema.guide_working_draft(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_block_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_block_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_block_deleted_by_organization FOREIGN KEY (deleted_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_guide_block_type CHECK (block_type IN ('step', 'header', 'paragraph', 'tip', 'alert', 'capture', 'divider', 'gif')),
  CONSTRAINT chk_guide_block_content CHECK (
    (block_type = 'header' AND COALESCE(length(trim(title)), 0) > 0 AND body IS NULL)
    OR (block_type = 'paragraph' AND title IS NULL AND COALESCE(length(trim(body)), 0) > 0)
    OR (block_type IN ('tip', 'alert') AND (COALESCE(length(trim(title)), 0) > 0 OR COALESCE(length(trim(body)), 0) > 0))
    OR (block_type IN ('divider', 'step', 'capture', 'gif') AND title IS NULL AND body IS NULL)
  ),
  CONSTRAINT chk_guide_block_index CHECK (block_index > 0),
  CONSTRAINT chk_guide_block_version CHECK (version > 0),
  CONSTRAINT chk_guide_block_deleted CHECK (
    (is_deleted = FALSE AND deleted_at IS NULL AND deleted_by_id IS NULL)
    OR (is_deleted = TRUE AND deleted_at IS NOT NULL AND deleted_by_id IS NOT NULL)
  )
);
CREATE INDEX idx_guide_block_draft_active_order
  ON guide_schema.guide_block (guide_working_draft_id, block_index) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX uq_guide_block_draft_index_active
  ON guide_schema.guide_block (guide_working_draft_id, block_index) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS guide_schema.guide_step (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  guide_working_draft_id VARCHAR(26) NOT NULL,
  guide_block_id VARCHAR(26) NOT NULL,
  source_capture_session_id VARCHAR(26) DEFAULT NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL,
  selected_capture_asset_id VARCHAR(26) DEFAULT NULL,
  screenshot_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  title VARCHAR(255) NOT NULL,
  body TEXT DEFAULT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_guide_step_block_active_basis UNIQUE (id, guide_working_draft_id, project_id, organization_id),
  CONSTRAINT fk_guide_step_block_scope FOREIGN KEY (guide_block_id, guide_working_draft_id, project_id, organization_id)
    REFERENCES guide_schema.guide_block(id, guide_working_draft_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_step_source_session_scope FOREIGN KEY (source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_session(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_step_source_event_scope FOREIGN KEY (source_capture_event_id, source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_event(id, capture_session_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_step_source_asset_scope FOREIGN KEY (source_capture_asset_id, source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, capture_session_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_step_selected_asset_scope FOREIGN KEY (selected_capture_asset_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_step_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_step_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_step_deleted_by_organization FOREIGN KEY (deleted_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_guide_step_title CHECK (length(trim(title)) > 0),
  CONSTRAINT chk_guide_step_version CHECK (version > 0),
  CONSTRAINT chk_guide_step_deleted CHECK (
    (is_deleted = FALSE AND deleted_at IS NULL AND deleted_by_id IS NULL)
    OR (is_deleted = TRUE AND deleted_at IS NOT NULL AND deleted_by_id IS NOT NULL)
  )
);
CREATE UNIQUE INDEX uq_guide_step_block_active
  ON guide_schema.guide_step (guide_block_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS guide_schema.guide_annotation (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  guide_working_draft_id VARCHAR(26) NOT NULL,
  guide_step_id VARCHAR(26) NOT NULL,
  annotation_type VARCHAR(50) NOT NULL,
  annotation_index INTEGER NOT NULL,
  active_annotation_index INTEGER GENERATED ALWAYS AS (
    CASE WHEN is_deleted THEN NULL ELSE annotation_index END
  ) STORED,
  x NUMERIC(8,6) NOT NULL,
  y NUMERIC(8,6) NOT NULL,
  width NUMERIC(8,6) NOT NULL,
  height NUMERIC(8,6) NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_guide_annotation_step_scope FOREIGN KEY (guide_step_id, guide_working_draft_id, project_id, organization_id)
    REFERENCES guide_schema.guide_step(id, guide_working_draft_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_annotation_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_annotation_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_annotation_deleted_by_organization FOREIGN KEY (deleted_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_guide_annotation_type CHECK (annotation_type = 'highlight'),
  CONSTRAINT chk_guide_annotation_index CHECK (annotation_index > 0 AND annotation_index <= 10),
  CONSTRAINT chk_guide_annotation_box CHECK (
    x >= 0 AND y >= 0 AND width > 0 AND height > 0
    AND x + width <= 1 AND y + height <= 1
  ),
  CONSTRAINT chk_guide_annotation_version CHECK (version > 0),
  CONSTRAINT chk_guide_annotation_deleted CHECK (
    (is_deleted = FALSE AND deleted_at IS NULL AND deleted_by_id IS NULL)
    OR (is_deleted = TRUE AND deleted_at IS NOT NULL AND deleted_by_id IS NOT NULL)
  ),
  CONSTRAINT uq_guide_annotation_step_index_active
    UNIQUE (guide_step_id, active_annotation_index) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS interactive_demo_schema.interactive_demo (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_interactive_demo_id_project_organization UNIQUE (id, project_id, organization_id),
  CONSTRAINT fk_interactive_demo_project_organization FOREIGN KEY (project_id, organization_id)
    REFERENCES project_schema.project(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_interactive_demo_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT
);
COMMENT ON TABLE interactive_demo_schema.interactive_demo IS
  'Immutable stable Interactive Demo Artifact identity. Mutable metadata and lifecycle belong to Editions.';

CREATE TABLE IF NOT EXISTS interactive_demo_schema.interactive_demo_edition (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  source_capture_session_id VARCHAR(26) DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_interactive_demo_edition_artifact_version UNIQUE (interactive_demo_id, project_version_id),
  CONSTRAINT uq_interactive_demo_edition_scope UNIQUE (id, interactive_demo_id, project_version_id, project_id, organization_id),
  CONSTRAINT uq_interactive_demo_edition_id_project_organization UNIQUE (id, project_id, organization_id),
  CONSTRAINT fk_interactive_demo_edition_artifact_scope FOREIGN KEY (interactive_demo_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_interactive_demo_edition_version_scope FOREIGN KEY (project_version_id, project_id, organization_id)
    REFERENCES project_schema.project_version(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_interactive_demo_edition_source_session_scope
    FOREIGN KEY (source_capture_session_id, project_version_id, project_id, organization_id)
    REFERENCES capture_schema.capture_session(id, project_version_id, project_id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_interactive_demo_edition_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_interactive_demo_edition_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_interactive_demo_edition_title CHECK (length(trim(title)) > 0),
  CONSTRAINT chk_interactive_demo_edition_status CHECK (status IN ('draft', 'archived')),
  CONSTRAINT chk_interactive_demo_edition_version CHECK (version > 0)
);
CREATE INDEX idx_interactive_demo_edition_scope_status_created
  ON interactive_demo_schema.interactive_demo_edition
  (organization_id, project_id, project_version_id, status, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS interactive_demo_schema.interactive_demo_working_draft (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_edition_id VARCHAR(26) NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_interactive_demo_working_draft_scope UNIQUE (id, project_id, organization_id),
  CONSTRAINT fk_interactive_demo_working_draft_edition_scope FOREIGN KEY (interactive_demo_edition_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo_edition(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_interactive_demo_working_draft_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_interactive_demo_working_draft_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_interactive_demo_working_draft_version CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS interactive_demo_schema.demo_scene (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_working_draft_id VARCHAR(26) NOT NULL,
  source_capture_session_id VARCHAR(26) DEFAULT NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL,
  scene_index INTEGER NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  background_capture_asset_id VARCHAR(26) DEFAULT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_demo_scene_scope UNIQUE (id, interactive_demo_working_draft_id, project_id, organization_id),
  CONSTRAINT fk_demo_scene_draft_scope FOREIGN KEY (interactive_demo_working_draft_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo_working_draft(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_scene_source_session_scope FOREIGN KEY (source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_session(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_scene_source_event_scope FOREIGN KEY (source_capture_event_id, source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_event(id, capture_session_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_scene_source_asset_scope FOREIGN KEY (source_capture_asset_id, source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, capture_session_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_scene_background_asset_scope FOREIGN KEY (background_capture_asset_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_scene_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_scene_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_scene_deleted_by_organization FOREIGN KEY (deleted_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_demo_scene_index CHECK (scene_index > 0),
  CONSTRAINT chk_demo_scene_title CHECK (title IS NULL OR length(trim(title)) > 0),
  CONSTRAINT chk_demo_scene_version CHECK (version > 0),
  CONSTRAINT chk_demo_scene_deleted CHECK (
    (is_deleted = FALSE AND deleted_at IS NULL AND deleted_by_id IS NULL)
    OR (is_deleted = TRUE AND deleted_at IS NOT NULL AND deleted_by_id IS NOT NULL)
  )
);
CREATE INDEX idx_demo_scene_draft_active_order
  ON interactive_demo_schema.demo_scene (interactive_demo_working_draft_id, scene_index)
  WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX uq_demo_scene_draft_index_active
  ON interactive_demo_schema.demo_scene (interactive_demo_working_draft_id, scene_index)
  WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS interactive_demo_schema.demo_hotspot (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_working_draft_id VARCHAR(26) NOT NULL,
  demo_scene_id VARCHAR(26) NOT NULL,
  hotspot_type VARCHAR(50) NOT NULL,
  label VARCHAR(255) DEFAULT NULL,
  content TEXT DEFAULT NULL,
  x NUMERIC(8,6) NOT NULL,
  y NUMERIC(8,6) NOT NULL,
  width NUMERIC(8,6) NOT NULL,
  height NUMERIC(8,6) NOT NULL,
  hotspot_index INTEGER NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_demo_hotspot_scope UNIQUE (id, interactive_demo_working_draft_id, project_id, organization_id),
  CONSTRAINT fk_demo_hotspot_scene_scope FOREIGN KEY (demo_scene_id, interactive_demo_working_draft_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.demo_scene(id, interactive_demo_working_draft_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_hotspot_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_hotspot_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_hotspot_deleted_by_organization FOREIGN KEY (deleted_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_demo_hotspot_type CHECK (hotspot_type IN ('click', 'info', 'next')),
  CONSTRAINT chk_demo_hotspot_label CHECK (label IS NULL OR length(trim(label)) > 0),
  CONSTRAINT chk_demo_hotspot_box CHECK (
    x >= 0 AND y >= 0 AND width > 0 AND height > 0
    AND x + width <= 1 AND y + height <= 1
  ),
  CONSTRAINT chk_demo_hotspot_index CHECK (hotspot_index > 0),
  CONSTRAINT chk_demo_hotspot_version CHECK (version > 0),
  CONSTRAINT chk_demo_hotspot_deleted CHECK (
    (is_deleted = FALSE AND deleted_at IS NULL AND deleted_by_id IS NULL)
    OR (is_deleted = TRUE AND deleted_at IS NOT NULL AND deleted_by_id IS NOT NULL)
  )
);
CREATE INDEX idx_demo_hotspot_scene_active_order
  ON interactive_demo_schema.demo_hotspot (demo_scene_id, hotspot_index) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX uq_demo_hotspot_scene_index_active
  ON interactive_demo_schema.demo_hotspot (demo_scene_id, hotspot_index) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS interactive_demo_schema.demo_transition (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_working_draft_id VARCHAR(26) NOT NULL,
  demo_hotspot_id VARCHAR(26) NOT NULL,
  target_scene_id VARCHAR(26) NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL,
  updated_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_demo_transition_hotspot_scope FOREIGN KEY (demo_hotspot_id, interactive_demo_working_draft_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.demo_hotspot(id, interactive_demo_working_draft_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_transition_target_scope FOREIGN KEY (target_scene_id, interactive_demo_working_draft_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.demo_scene(id, interactive_demo_working_draft_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_transition_created_by_organization FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_transition_updated_by_organization FOREIGN KEY (updated_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_transition_deleted_by_organization FOREIGN KEY (deleted_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_demo_transition_version CHECK (version > 0),
  CONSTRAINT chk_demo_transition_deleted CHECK (
    (is_deleted = FALSE AND deleted_at IS NULL AND deleted_by_id IS NULL)
    OR (is_deleted = TRUE AND deleted_at IS NOT NULL AND deleted_by_id IS NOT NULL)
  )
);
CREATE UNIQUE INDEX uq_demo_transition_hotspot_active
  ON interactive_demo_schema.demo_transition (demo_hotspot_id) WHERE is_deleted = FALSE;

CREATE FUNCTION guide_schema.verify_guide_edition_working_draft()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM guide_schema.guide_working_draft draft
    WHERE draft.guide_edition_id = NEW.id
      AND draft.project_id = NEW.project_id
      AND draft.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'Every Guide Edition requires exactly one Working Draft'
      USING ERRCODE = '23514', CONSTRAINT = 'guide_edition_exactly_one_working_draft';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER guide_edition_exactly_one_working_draft
  AFTER INSERT ON guide_schema.guide_edition DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION guide_schema.verify_guide_edition_working_draft();

CREATE FUNCTION interactive_demo_schema.verify_interactive_demo_edition_working_draft()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM interactive_demo_schema.interactive_demo_working_draft draft
    WHERE draft.interactive_demo_edition_id = NEW.id
      AND draft.project_id = NEW.project_id
      AND draft.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'Every Interactive Demo Edition requires exactly one Working Draft'
      USING ERRCODE = '23514', CONSTRAINT = 'interactive_demo_edition_exactly_one_working_draft';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER interactive_demo_edition_exactly_one_working_draft
  AFTER INSERT ON interactive_demo_schema.interactive_demo_edition DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION interactive_demo_schema.verify_interactive_demo_edition_working_draft();

CREATE FUNCTION project_schema.enforce_artifact_edition_mutation()
RETURNS TRIGGER AS $$
DECLARE
  row_data JSONB := to_jsonb(NEW);
  old_data JSONB := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
  selected_project_id TEXT := row_data ->> 'project_id';
  selected_organization_id TEXT := row_data ->> 'organization_id';
  selected_version_id TEXT;
  selected_version_status TEXT;
  selected_edition_status TEXT;
  selected_command TEXT := current_setting('ossie.audit_command', true);
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  PERFORM project_schema.lock_project_version_scope(selected_project_id);

  IF NOT EXISTS (
    SELECT 1 FROM project_schema.project project_record
    WHERE project_record.id = selected_project_id
      AND project_record.organization_id = selected_organization_id
      AND project_record.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Archived Projects are read-only'
      USING ERRCODE = '23514', CONSTRAINT = 'artifact_project_active_guard';
  END IF;

  IF TG_TABLE_NAME IN ('guide', 'interactive_demo') THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME = 'guide_edition' OR TG_TABLE_NAME = 'interactive_demo_edition' THEN
    selected_version_id := row_data ->> 'project_version_id';
    selected_edition_status := row_data ->> 'status';
    IF TG_OP = 'UPDATE' THEN
      IF row_data ->> 'project_id' IS DISTINCT FROM old_data ->> 'project_id'
        OR row_data ->> 'organization_id' IS DISTINCT FROM old_data ->> 'organization_id'
        OR row_data ->> 'project_version_id' IS DISTINCT FROM old_data ->> 'project_version_id'
        OR (TG_TABLE_NAME = 'guide_edition' AND row_data ->> 'guide_id' IS DISTINCT FROM old_data ->> 'guide_id')
        OR (TG_TABLE_NAME = 'interactive_demo_edition' AND row_data ->> 'interactive_demo_id' IS DISTINCT FROM old_data ->> 'interactive_demo_id')
      THEN
        RAISE EXCEPTION 'Artifact Edition ownership is immutable'
          USING ERRCODE = '23514', CONSTRAINT = 'artifact_edition_ownership_guard';
      END IF;
      IF (old_data ->> 'version')::INTEGER + 1 <> (row_data ->> 'version')::INTEGER THEN
        RAISE EXCEPTION 'Artifact Edition Row Version must increment once'
          USING ERRCODE = '23514', CONSTRAINT = 'artifact_edition_mutation_command_guard';
      END IF;
      IF selected_command LIKE '%.archive' AND (old_data ->> 'status' <> 'draft' OR selected_edition_status <> 'archived') THEN
        RAISE EXCEPTION 'Artifact Edition archive transition is invalid'
          USING ERRCODE = '23514', CONSTRAINT = 'artifact_edition_mutation_command_guard';
      ELSIF selected_command LIKE '%.restore' AND (old_data ->> 'status' <> 'archived' OR selected_edition_status <> 'draft') THEN
        RAISE EXCEPTION 'Artifact Edition restore transition is invalid'
          USING ERRCODE = '23514', CONSTRAINT = 'artifact_edition_mutation_command_guard';
      ELSIF selected_command NOT LIKE '%.archive' AND selected_command NOT LIKE '%.restore'
        AND old_data ->> 'status' <> 'draft' THEN
        RAISE EXCEPTION 'Archived Artifact Editions are read-only'
          USING ERRCODE = '23514', CONSTRAINT = 'artifact_edition_active_guard';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME LIKE 'guide_%' THEN
    SELECT edition.project_version_id, edition.status
      INTO selected_version_id, selected_edition_status
    FROM guide_schema.guide_edition edition
    LEFT JOIN guide_schema.guide_working_draft draft
      ON draft.guide_edition_id = edition.id
    WHERE edition.project_id = selected_project_id
      AND edition.organization_id = selected_organization_id
      AND (edition.id = row_data ->> 'guide_edition_id'
        OR draft.id = row_data ->> 'guide_working_draft_id')
    FOR UPDATE OF edition;
  ELSE
    SELECT edition.project_version_id, edition.status
      INTO selected_version_id, selected_edition_status
    FROM interactive_demo_schema.interactive_demo_edition edition
    LEFT JOIN interactive_demo_schema.interactive_demo_working_draft draft
      ON draft.interactive_demo_edition_id = edition.id
    WHERE edition.project_id = selected_project_id
      AND edition.organization_id = selected_organization_id
      AND (edition.id = row_data ->> 'interactive_demo_edition_id'
        OR draft.id = row_data ->> 'interactive_demo_working_draft_id')
    FOR UPDATE OF edition;
  END IF;

  SELECT status INTO selected_version_status
  FROM project_schema.project_version
  WHERE id = selected_version_id AND project_id = selected_project_id
    AND organization_id = selected_organization_id
  FOR UPDATE;
  IF selected_version_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Archived Project Versions are read-only'
      USING ERRCODE = '23514', CONSTRAINT = 'artifact_project_version_active_guard';
  END IF;
  IF selected_edition_status IS DISTINCT FROM 'draft'
    AND selected_command NOT LIKE '%.archive'
    AND selected_command NOT LIKE '%.restore' THEN
    RAISE EXCEPTION 'Archived Artifact Editions are read-only'
      USING ERRCODE = '23514', CONSTRAINT = 'artifact_edition_active_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guide_artifact_mutation_guard
  BEFORE INSERT ON guide_schema.guide FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER guide_edition_mutation_guard
  BEFORE INSERT OR UPDATE ON guide_schema.guide_edition FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER guide_working_draft_mutation_guard
  BEFORE INSERT OR UPDATE ON guide_schema.guide_working_draft FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER guide_block_mutation_guard
  BEFORE INSERT OR UPDATE ON guide_schema.guide_block FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER guide_step_mutation_guard
  BEFORE INSERT OR UPDATE ON guide_schema.guide_step FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER guide_annotation_mutation_guard
  BEFORE INSERT OR UPDATE ON guide_schema.guide_annotation FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER interactive_demo_artifact_mutation_guard
  BEFORE INSERT ON interactive_demo_schema.interactive_demo FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER interactive_demo_edition_mutation_guard
  BEFORE INSERT OR UPDATE ON interactive_demo_schema.interactive_demo_edition FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER interactive_demo_working_draft_mutation_guard
  BEFORE INSERT OR UPDATE ON interactive_demo_schema.interactive_demo_working_draft FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER demo_scene_mutation_guard
  BEFORE INSERT OR UPDATE ON interactive_demo_schema.demo_scene FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER demo_hotspot_mutation_guard
  BEFORE INSERT OR UPDATE ON interactive_demo_schema.demo_hotspot FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();
CREATE TRIGGER demo_transition_mutation_guard
  BEFORE INSERT OR UPDATE ON interactive_demo_schema.demo_transition FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_artifact_edition_mutation();

CREATE FUNCTION project_schema.enforce_authored_asset_version_scope()
RETURNS TRIGGER AS $$
DECLARE
  selected_command TEXT := current_setting('ossie.audit_command', true);
  selected_version_id TEXT;
  selected_session_id TEXT;
  selected_asset_id TEXT;
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'guide_step' THEN
    SELECT edition.project_version_id INTO selected_version_id
    FROM guide_schema.guide_working_draft draft
    JOIN guide_schema.guide_edition edition ON edition.id = draft.guide_edition_id
    WHERE draft.id = NEW.guide_working_draft_id;
    selected_session_id := NEW.source_capture_session_id;
    selected_asset_id := COALESCE(NEW.selected_capture_asset_id, NEW.source_capture_asset_id);
  ELSE
    SELECT edition.project_version_id INTO selected_version_id
    FROM interactive_demo_schema.interactive_demo_working_draft draft
    JOIN interactive_demo_schema.interactive_demo_edition edition
      ON edition.id = draft.interactive_demo_edition_id
    WHERE draft.id = NEW.interactive_demo_working_draft_id;
    selected_session_id := NEW.source_capture_session_id;
    selected_asset_id := COALESCE(NEW.background_capture_asset_id, NEW.source_capture_asset_id);
  END IF;
  IF selected_session_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM capture_schema.capture_session session
    WHERE session.id = selected_session_id AND session.project_version_id = selected_version_id
  ) THEN
    RAISE EXCEPTION 'Authored source provenance must match the Artifact Edition Project Version'
      USING ERRCODE = '23514', CONSTRAINT = 'authored_source_version_guard';
  END IF;
  IF selected_asset_id IS NOT NULL
    AND selected_command <> 'artifact.carry_forward'
    AND NOT EXISTS (
    SELECT 1 FROM capture_schema.capture_asset asset
    JOIN capture_schema.capture_session session ON session.id = asset.capture_session_id
    WHERE asset.id = selected_asset_id AND session.project_version_id = selected_version_id
  ) THEN
    RAISE EXCEPTION 'New authored Asset selection must match the Artifact Edition Project Version'
      USING ERRCODE = '23514', CONSTRAINT = 'authored_asset_version_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER guide_step_asset_version_guard
  BEFORE INSERT OR UPDATE OF source_capture_session_id, source_capture_event_id,
    source_capture_asset_id, selected_capture_asset_id
  ON guide_schema.guide_step FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_authored_asset_version_scope();
CREATE TRIGGER demo_scene_asset_version_guard
  BEFORE INSERT OR UPDATE OF source_capture_session_id, source_capture_event_id,
    source_capture_asset_id, background_capture_asset_id
  ON interactive_demo_schema.demo_scene FOR EACH ROW
  EXECUTE FUNCTION project_schema.enforce_authored_asset_version_scope();

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid_v021;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(
  selected_command TEXT, selected_action TEXT,
  selected_actor_type TEXT, selected_source_type TEXT
)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v021(
    selected_command, selected_action, selected_actor_type, selected_source_type
  ) OR (
    (selected_command, selected_action) IN (
      ('guide.archive', 'guide.edition.archived'),
      ('guide.restore', 'guide.edition.restored'),
      ('interactive_demo.archive', 'interactive_demo.edition.archived'),
      ('interactive_demo.restore', 'interactive_demo.edition.restored')
    )
    AND selected_actor_type = 'org_user'
    AND selected_source_type IN ('web', 'api', 'extension')
  ) OR (
    (selected_command, selected_action) IN (
      ('guide.update', 'guide.edition.updated'),
      ('interactive_demo.update', 'interactive_demo.edition.updated')
    )
    AND selected_actor_type = 'org_user'
    AND selected_source_type IN ('web', 'api', 'extension')
  );
$$ LANGUAGE SQL IMMUTABLE;

DO $$
DECLARE
  registration RECORD;
  operation_short TEXT;
BEGIN
  FOR registration IN SELECT * FROM (VALUES
    ('guide_schema', 'guide', 'INSERT', 'guide', 'guide.create_from_capture'),
    ('guide_schema', 'guide_edition', 'INSERT', 'guide_edition', 'guide.create_from_capture'),
    ('guide_schema', 'guide_edition', 'UPDATE', 'guide_edition', 'guide.update,guide.archive,guide.restore'),
    ('guide_schema', 'guide_working_draft', 'INSERT', 'guide_working_draft', 'guide.create_from_capture'),
    ('guide_schema', 'guide_working_draft', 'UPDATE', 'guide_working_draft', 'guide.step.update,guide.blocks.reorder,guide.block.create,guide.block.update,guide.block.screenshot.update,guide.block.annotations.update,guide.block.screenshot_upload,guide.block.delete'),
    ('guide_schema', 'guide_block', 'INSERT', 'guide_block', 'guide.create_from_capture,guide.block.create'),
    ('guide_schema', 'guide_block', 'UPDATE', 'guide_block', 'guide.blocks.reorder,guide.block.create,guide.block.update,guide.block.delete'),
    ('guide_schema', 'guide_step', 'INSERT', 'guide_step', 'guide.create_from_capture,guide.block.create'),
    ('guide_schema', 'guide_step', 'UPDATE', 'guide_step', 'guide.step.update,guide.block.screenshot.update,guide.block.screenshot_upload,guide.block.delete'),
    ('guide_schema', 'guide_annotation', 'INSERT', 'guide_annotation', 'guide.block.annotations.update'),
    ('guide_schema', 'guide_annotation', 'UPDATE', 'guide_annotation', 'guide.block.screenshot.update,guide.block.annotations.update,guide.block.delete'),
    ('interactive_demo_schema', 'interactive_demo', 'INSERT', 'interactive_demo', 'interactive_demo.create_from_capture,interactive_demo.create'),
    ('interactive_demo_schema', 'interactive_demo_edition', 'INSERT', 'interactive_demo_edition', 'interactive_demo.create_from_capture,interactive_demo.create'),
    ('interactive_demo_schema', 'interactive_demo_edition', 'UPDATE', 'interactive_demo_edition', 'interactive_demo.update,interactive_demo.archive,interactive_demo.restore'),
    ('interactive_demo_schema', 'interactive_demo_working_draft', 'INSERT', 'interactive_demo_working_draft', 'interactive_demo.create_from_capture,interactive_demo.create'),
    ('interactive_demo_schema', 'interactive_demo_working_draft', 'UPDATE', 'interactive_demo_working_draft', 'interactive_demo.scene.create,interactive_demo.scene.update,interactive_demo.scenes.reorder,interactive_demo.scene.delete,interactive_demo.hotspot.create,interactive_demo.hotspot.update,interactive_demo.hotspots.reorder,interactive_demo.hotspot.delete'),
    ('interactive_demo_schema', 'demo_scene', 'INSERT', 'demo_scene', 'interactive_demo.create_from_capture,interactive_demo.scene.create'),
    ('interactive_demo_schema', 'demo_scene', 'UPDATE', 'demo_scene', 'interactive_demo.scene.update,interactive_demo.scenes.reorder,interactive_demo.scene.delete'),
    ('interactive_demo_schema', 'demo_hotspot', 'INSERT', 'demo_hotspot', 'interactive_demo.hotspot.create'),
    ('interactive_demo_schema', 'demo_hotspot', 'UPDATE', 'demo_hotspot', 'interactive_demo.scene.delete,interactive_demo.hotspot.update,interactive_demo.hotspots.reorder,interactive_demo.hotspot.delete'),
    ('interactive_demo_schema', 'demo_transition', 'INSERT', 'demo_transition', 'interactive_demo.hotspot.create,interactive_demo.hotspot.update'),
    ('interactive_demo_schema', 'demo_transition', 'UPDATE', 'demo_transition', 'interactive_demo.scene.delete,interactive_demo.hotspot.update,interactive_demo.hotspot.delete')
  ) AS entries(schema_name, table_name, sql_operation, entity_type, commands)
  LOOP
    operation_short := CASE registration.sql_operation WHEN 'INSERT' THEN 'i' ELSE 'u' END;
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE %s ON %I.%I FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(%L, %L, %L)',
      registration.table_name || '_' || operation_short || '_audit_ctx', registration.sql_operation,
      registration.schema_name, registration.table_name, registration.entity_type, 'direct', registration.commands
    );
    EXECUTE format(
      'CREATE CONSTRAINT TRIGGER %I AFTER %s ON %I.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_mutation_evidence(%L, %L, %L)',
      registration.table_name || '_' || operation_short || '_audit_evd', registration.sql_operation,
      registration.schema_name, registration.table_name, registration.entity_type, 'direct', registration.commands
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION project_schema.enforce_project_default_mutation_command()
RETURNS TRIGGER AS $$
DECLARE selected_command TEXT := current_setting('ossie.audit_command', true);
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF NEW.default_project_version_id IS NOT DISTINCT FROM OLD.default_project_version_id THEN RETURN NEW; END IF;
  IF selected_command <> 'project_version.set_default'
    OR NEW.version <> OLD.version + 1
    OR (to_jsonb(NEW) - ARRAY['default_project_version_id', 'updated_by_id', 'updated_at', 'version'])
      IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['default_project_version_id', 'updated_by_id', 'updated_at', 'version'])
  THEN
    RAISE EXCEPTION 'Project Default change does not match command'
      USING ERRCODE = '23514', CONSTRAINT = 'project_default_mutation_command_guard';
  END IF;
  PERFORM project_schema.lock_project_version_scope(NEW.id);
  IF NOT EXISTS (
    SELECT 1 FROM project_schema.project_version version_record
    WHERE version_record.id = NEW.default_project_version_id
      AND version_record.project_id = NEW.id
      AND version_record.organization_id = NEW.organization_id
      AND version_record.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Project Default must be an active Version in the same Project'
      USING ERRCODE = '23514', CONSTRAINT = 'project_default_version_active_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION project_schema.enforce_artifact_edition_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION project_schema.enforce_authored_asset_version_scope() FROM PUBLIC;
REVOKE ALL ON FUNCTION guide_schema.verify_guide_edition_working_draft() FROM PUBLIC;
REVOKE ALL ON FUNCTION interactive_demo_schema.verify_interactive_demo_edition_working_draft() FROM PUBLIC;
REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION project_schema.enforce_artifact_edition_mutation(),
  project_schema.enforce_authored_asset_version_scope(),
  guide_schema.verify_guide_edition_working_draft(),
  interactive_demo_schema.verify_interactive_demo_edition_working_draft(),
  audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT)
  TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT, INSERT ON guide_schema.guide,
  interactive_demo_schema.interactive_demo TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT, INSERT, UPDATE ON guide_schema.guide_edition,
  guide_schema.guide_working_draft, guide_schema.guide_block,
  guide_schema.guide_step, guide_schema.guide_annotation,
  interactive_demo_schema.interactive_demo_edition,
  interactive_demo_schema.interactive_demo_working_draft,
  interactive_demo_schema.demo_scene, interactive_demo_schema.demo_hotspot,
  interactive_demo_schema.demo_transition TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM guide_schema.guide LIMIT 1)
    OR EXISTS (SELECT 1 FROM guide_schema.guide_edition LIMIT 1)
    OR EXISTS (SELECT 1 FROM guide_schema.guide_working_draft LIMIT 1)
    OR EXISTS (SELECT 1 FROM guide_schema.guide_block LIMIT 1)
    OR EXISTS (SELECT 1 FROM guide_schema.guide_step LIMIT 1)
    OR EXISTS (SELECT 1 FROM guide_schema.guide_annotation LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.interactive_demo LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.interactive_demo_edition LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.interactive_demo_working_draft LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.demo_scene LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.demo_hotspot LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.demo_transition LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.published_artifact WHERE artifact_type IN ('guide', 'interactive_demo') LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.publish_link WHERE artifact_type IN ('guide', 'interactive_demo') LIMIT 1)
  THEN
    RAISE EXCEPTION 'Refusing to remove populated Guide/Demo relational foundation'
      USING ERRCODE = '55000';
  END IF;
END;
$$;

DROP TABLE interactive_demo_schema.demo_transition;
DROP TABLE interactive_demo_schema.demo_hotspot;
DROP TABLE interactive_demo_schema.demo_scene;
DROP TABLE interactive_demo_schema.interactive_demo_working_draft;
DROP TABLE interactive_demo_schema.interactive_demo_edition;
DROP TABLE interactive_demo_schema.interactive_demo;
DROP TABLE guide_schema.guide_annotation;
DROP TABLE guide_schema.guide_step;
DROP TABLE guide_schema.guide_block;
DROP TABLE guide_schema.guide_working_draft;
DROP TABLE guide_schema.guide_edition;
DROP TABLE guide_schema.guide;
DROP FUNCTION project_schema.enforce_authored_asset_version_scope();
DROP FUNCTION project_schema.enforce_artifact_edition_mutation();
DROP FUNCTION guide_schema.verify_guide_edition_working_draft();
DROP FUNCTION interactive_demo_schema.verify_interactive_demo_edition_working_draft();

ALTER TABLE capture_schema.capture_event
  DROP CONSTRAINT uq_capture_event_id_session_project_organization;
ALTER TABLE capture_schema.capture_asset
  DROP CONSTRAINT uq_capture_asset_id_project_organization;
ALTER TABLE capture_schema.capture_session
  DROP CONSTRAINT uq_capture_session_id_version_project_organization;

DROP FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v021(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid;

CREATE TABLE IF NOT EXISTS guide_schema.guide (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_session(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_guide_status CHECK (status IN ('draft', 'archived')),
  CONSTRAINT chk_guide_title_not_empty CHECK (length(trim(title)) > 0)
);
CREATE INDEX idx_guide_project_active_created ON guide_schema.guide (project_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_guide_source_capture_session_active ON guide_schema.guide (source_capture_session_id, created_at DESC) WHERE is_deleted = FALSE AND source_capture_session_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS guide_schema.guide_block (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  guide_id VARCHAR(26) NOT NULL REFERENCES guide_schema.guide(id) ON DELETE CASCADE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_session(id) ON DELETE SET NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_event(id) ON DELETE SET NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL,
  block_type VARCHAR(50) NOT NULL,
  block_index INTEGER NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content JSONB DEFAULT NULL,
  selected_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id),
  screenshot_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT chk_guide_block_type CHECK (block_type IN ('step', 'header', 'paragraph', 'tip', 'alert', 'capture', 'divider', 'gif')),
  CONSTRAINT chk_guide_block_index_positive CHECK (block_index >= 1)
);
CREATE INDEX idx_guide_block_guide_active_order ON guide_schema.guide_block (guide_id, block_index) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX uq_guide_block_guide_index_active ON guide_schema.guide_block (guide_id, block_index) WHERE is_deleted = FALSE;
CREATE INDEX idx_guide_block_selected_asset_active ON guide_schema.guide_block (selected_capture_asset_id) WHERE is_deleted = FALSE AND selected_capture_asset_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS guide_schema.guide_step (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  guide_id VARCHAR(26) NOT NULL REFERENCES guide_schema.guide(id) ON DELETE CASCADE,
  guide_block_id VARCHAR(26) NOT NULL REFERENCES guide_schema.guide_block(id) ON DELETE CASCADE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_session(id) ON DELETE SET NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_event(id) ON DELETE SET NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT DEFAULT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_guide_step_title_not_empty CHECK (length(trim(title)) > 0)
);
CREATE INDEX idx_guide_step_block_active ON guide_schema.guide_step (guide_block_id) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX uq_guide_step_block_active ON guide_schema.guide_step (guide_block_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS interactive_demo_schema.interactive_demo (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_session(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_interactive_demo_status CHECK (status IN ('draft', 'archived')),
  CONSTRAINT chk_interactive_demo_title_not_empty CHECK (length(trim(title)) > 0)
);
CREATE INDEX idx_interactive_demo_project_active_created ON interactive_demo_schema.interactive_demo (project_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_interactive_demo_source_capture_session_active ON interactive_demo_schema.interactive_demo (source_capture_session_id, created_at DESC) WHERE is_deleted = FALSE AND source_capture_session_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS interactive_demo_schema.demo_scene (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  interactive_demo_id VARCHAR(26) NOT NULL REFERENCES interactive_demo_schema.interactive_demo(id) ON DELETE CASCADE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_session(id) ON DELETE SET NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_event(id) ON DELETE SET NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL,
  scene_index INTEGER NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  background_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_demo_scene_index_positive CHECK (scene_index >= 1),
  CONSTRAINT chk_demo_scene_title_not_empty CHECK (title IS NULL OR length(trim(title)) > 0)
);
CREATE INDEX idx_demo_scene_demo_active_order ON interactive_demo_schema.demo_scene (interactive_demo_id, scene_index) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX uq_demo_scene_demo_index_active ON interactive_demo_schema.demo_scene (interactive_demo_id, scene_index) WHERE is_deleted = FALSE;
CREATE INDEX idx_demo_scene_background_asset_active ON interactive_demo_schema.demo_scene (background_capture_asset_id) WHERE is_deleted = FALSE AND background_capture_asset_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS interactive_demo_schema.demo_hotspot (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE CASCADE,
  project_id VARCHAR(26) NOT NULL REFERENCES project_schema.project(id) ON DELETE CASCADE,
  interactive_demo_id VARCHAR(26) NOT NULL REFERENCES interactive_demo_schema.interactive_demo(id) ON DELETE CASCADE,
  demo_scene_id VARCHAR(26) NOT NULL REFERENCES interactive_demo_schema.demo_scene(id) ON DELETE CASCADE,
  hotspot_type VARCHAR(50) NOT NULL,
  label VARCHAR(255) DEFAULT NULL,
  content TEXT DEFAULT NULL,
  x NUMERIC(8,6) NOT NULL,
  y NUMERIC(8,6) NOT NULL,
  width NUMERIC(8,6) NOT NULL,
  height NUMERIC(8,6) NOT NULL,
  target_scene_id VARCHAR(26) DEFAULT NULL REFERENCES interactive_demo_schema.demo_scene(id) ON DELETE SET NULL,
  hotspot_index INTEGER NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by_id VARCHAR(26) DEFAULT NULL REFERENCES organization_schema.org_user(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  updated_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_demo_hotspot_type CHECK (hotspot_type IN ('click', 'info', 'next')),
  CONSTRAINT chk_demo_hotspot_label_not_empty CHECK (label IS NULL OR length(trim(label)) > 0),
  CONSTRAINT chk_demo_hotspot_normalized_box CHECK (x >= 0 AND x <= 1 AND y >= 0 AND y <= 1 AND width > 0 AND width <= 1 AND height > 0 AND height <= 1 AND x + width <= 1 AND y + height <= 1),
  CONSTRAINT chk_demo_hotspot_index_positive CHECK (hotspot_index >= 1)
);
CREATE INDEX idx_demo_hotspot_scene_active_order ON interactive_demo_schema.demo_hotspot (demo_scene_id, hotspot_index) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX uq_demo_hotspot_scene_index_active ON interactive_demo_schema.demo_hotspot (demo_scene_id, hotspot_index) WHERE is_deleted = FALSE;
CREATE INDEX idx_demo_hotspot_target_scene_active ON interactive_demo_schema.demo_hotspot (target_scene_id) WHERE is_deleted = FALSE AND target_scene_id IS NOT NULL;

CREATE FUNCTION interactive_demo_schema.enforce_demo_hotspot_target_scene_scope()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_scene_id IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM interactive_demo_schema.demo_scene target_scene
    WHERE target_scene.id = NEW.target_scene_id
      AND target_scene.organization_id = NEW.organization_id
      AND target_scene.project_id = NEW.project_id
      AND target_scene.interactive_demo_id = NEW.interactive_demo_id
      AND target_scene.is_deleted = FALSE
  ) THEN RAISE EXCEPTION 'Demo hotspot target scene must belong to the same interactive demo' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_demo_hotspot_target_scene_scope
  BEFORE INSERT OR UPDATE OF organization_id, project_id, interactive_demo_id, target_scene_id
  ON interactive_demo_schema.demo_hotspot FOR EACH ROW
  EXECUTE FUNCTION interactive_demo_schema.enforce_demo_hotspot_target_scene_scope();

CREATE TRIGGER guide_project_version_legacy_content_guard
  BEFORE INSERT ON guide_schema.guide FOR EACH ROW
  EXECUTE FUNCTION project_schema.lock_project_version_legacy_root_insert();
CREATE TRIGGER interactive_demo_project_version_legacy_content_guard
  BEFORE INSERT ON interactive_demo_schema.interactive_demo FOR EACH ROW
  EXECUTE FUNCTION project_schema.lock_project_version_legacy_root_insert();

GRANT SELECT, INSERT, UPDATE ON guide_schema.guide, guide_schema.guide_block,
  guide_schema.guide_step, interactive_demo_schema.interactive_demo,
  interactive_demo_schema.demo_scene, interactive_demo_schema.demo_hotspot
  TO __OSSIE_RUNTIME_DB_ROLE__;
