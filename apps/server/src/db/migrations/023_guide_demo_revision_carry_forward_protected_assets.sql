-- 023_guide_demo_revision_carry_forward_protected_assets.sql
-- Created On: 2026-07-19

-- UP:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM publish_schema.published_artifact LIMIT 1) THEN
    RAISE EXCEPTION 'Refusing Revision/protected Asset migration while Published Artifacts lack a typed Asset projection; reset and reseed through migration 023'
      USING ERRCODE = '55000';
  END IF;
  IF EXISTS (
    SELECT 1 FROM capture_schema.capture_asset asset
    JOIN file_schema.file file_record ON file_record.id = asset.file_id
    WHERE asset.is_deleted OR file_record.is_deleted
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Refusing Revision/protected Asset migration while legacy deleted Asset/File rows cannot be classified; reset and reseed through migration 023'
      USING ERRCODE = '55000';
  END IF;
END;
$$;

-- capture asset lifecycle
ALTER TABLE capture_schema.capture_asset
  ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active',
  ADD CONSTRAINT chk_capture_asset_status CHECK (status IN ('active', 'archived'));

ALTER TABLE guide_schema.guide_edition
  ADD CONSTRAINT uq_guide_edition_lineage_target UNIQUE (id, guide_id, project_id, organization_id);
ALTER TABLE interactive_demo_schema.interactive_demo_edition
  ADD CONSTRAINT uq_interactive_demo_edition_lineage_target UNIQUE (id, interactive_demo_id, project_id, organization_id);

CREATE TABLE guide_schema.guide_revision (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  guide_id VARCHAR(26) NOT NULL,
  guide_edition_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  revision_number INTEGER NOT NULL,
  trigger VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  source_working_draft_version INTEGER NOT NULL,
  content_sha256 CHAR(64) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_guide_revision_number UNIQUE (guide_edition_id, revision_number),
  CONSTRAINT uq_guide_revision_id_scope UNIQUE (id, project_id, organization_id),
  CONSTRAINT uq_guide_revision_lineage_scope UNIQUE (id, guide_edition_id, guide_id, project_id, organization_id),
  CONSTRAINT uq_guide_revision_scope UNIQUE (id, guide_edition_id, guide_id, project_version_id, project_id, organization_id),
  CONSTRAINT fk_guide_revision_edition_scope FOREIGN KEY (guide_edition_id, guide_id, project_version_id, project_id, organization_id)
    REFERENCES guide_schema.guide_edition(id, guide_id, project_version_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_revision_actor_scope FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_guide_revision_number CHECK (revision_number > 0),
  CONSTRAINT chk_guide_revision_trigger CHECK (trigger IN ('manual_checkpoint', 'publication', 'carry_forward')),
  CONSTRAINT chk_guide_revision_title CHECK (length(trim(title)) > 0),
  CONSTRAINT chk_guide_revision_draft_version CHECK (source_working_draft_version > 0),
  CONSTRAINT chk_guide_revision_digest CHECK (content_sha256 ~ '^[0-9a-f]{64}$')
);

CREATE TABLE guide_schema.guide_revision_block (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  guide_revision_id VARCHAR(26) NOT NULL,
  block_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  body TEXT DEFAULT NULL,
  block_index INTEGER NOT NULL,
  CONSTRAINT uq_guide_revision_block_scope UNIQUE (id, guide_revision_id, project_id, organization_id),
  CONSTRAINT uq_guide_revision_block_order UNIQUE (guide_revision_id, block_index),
  CONSTRAINT fk_guide_revision_block_revision FOREIGN KEY (guide_revision_id, project_id, organization_id)
    REFERENCES guide_schema.guide_revision(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_guide_revision_block_type CHECK (block_type IN ('step', 'header', 'paragraph', 'tip', 'alert', 'capture', 'divider', 'gif')),
  CONSTRAINT chk_guide_revision_block_index CHECK (block_index > 0)
);

CREATE TABLE guide_schema.guide_revision_step (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  guide_revision_id VARCHAR(26) NOT NULL,
  guide_revision_block_id VARCHAR(26) NOT NULL UNIQUE,
  source_capture_session_id VARCHAR(26) DEFAULT NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL,
  selected_capture_asset_id VARCHAR(26) DEFAULT NULL,
  screenshot_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  title VARCHAR(255) NOT NULL,
  body TEXT DEFAULT NULL,
  CONSTRAINT uq_guide_revision_step_scope UNIQUE (id, guide_revision_id, project_id, organization_id),
  CONSTRAINT fk_guide_revision_step_block FOREIGN KEY (guide_revision_block_id, guide_revision_id, project_id, organization_id)
    REFERENCES guide_schema.guide_revision_block(id, guide_revision_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_revision_step_source_session FOREIGN KEY (source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_session(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_revision_step_source_event FOREIGN KEY (source_capture_event_id, source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_event(id, capture_session_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_revision_step_source_asset FOREIGN KEY (source_capture_asset_id, source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, capture_session_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_revision_step_selected_asset FOREIGN KEY (selected_capture_asset_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_guide_revision_step_title CHECK (length(trim(title)) > 0)
);

CREATE TABLE guide_schema.guide_revision_annotation (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  guide_revision_id VARCHAR(26) NOT NULL,
  guide_revision_step_id VARCHAR(26) NOT NULL,
  annotation_type VARCHAR(50) NOT NULL,
  annotation_index INTEGER NOT NULL,
  x NUMERIC(8,6) NOT NULL,
  y NUMERIC(8,6) NOT NULL,
  width NUMERIC(8,6) NOT NULL,
  height NUMERIC(8,6) NOT NULL,
  CONSTRAINT uq_guide_revision_annotation_order UNIQUE (guide_revision_step_id, annotation_index),
  CONSTRAINT fk_guide_revision_annotation_step FOREIGN KEY (guide_revision_step_id, guide_revision_id, project_id, organization_id)
    REFERENCES guide_schema.guide_revision_step(id, guide_revision_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_guide_revision_annotation_type CHECK (annotation_type = 'highlight'),
  CONSTRAINT chk_guide_revision_annotation_index CHECK (annotation_index > 0 AND annotation_index <= 10),
  CONSTRAINT chk_guide_revision_annotation_box CHECK (x >= 0 AND y >= 0 AND width > 0 AND height > 0 AND x + width <= 1 AND y + height <= 1)
);

CREATE TABLE interactive_demo_schema.interactive_demo_revision (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_id VARCHAR(26) NOT NULL,
  interactive_demo_edition_id VARCHAR(26) NOT NULL,
  project_version_id VARCHAR(26) NOT NULL,
  revision_number INTEGER NOT NULL,
  trigger VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  source_working_draft_version INTEGER NOT NULL,
  content_sha256 CHAR(64) NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_interactive_demo_revision_number UNIQUE (interactive_demo_edition_id, revision_number),
  CONSTRAINT uq_interactive_demo_revision_id_scope UNIQUE (id, project_id, organization_id),
  CONSTRAINT uq_interactive_demo_revision_lineage_scope UNIQUE (id, interactive_demo_edition_id, interactive_demo_id, project_id, organization_id),
  CONSTRAINT uq_interactive_demo_revision_scope UNIQUE (id, interactive_demo_edition_id, interactive_demo_id, project_version_id, project_id, organization_id),
  CONSTRAINT fk_interactive_demo_revision_edition_scope FOREIGN KEY (interactive_demo_edition_id, interactive_demo_id, project_version_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo_edition(id, interactive_demo_id, project_version_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_interactive_demo_revision_actor_scope FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_interactive_demo_revision_number CHECK (revision_number > 0),
  CONSTRAINT chk_interactive_demo_revision_trigger CHECK (trigger IN ('manual_checkpoint', 'publication', 'carry_forward')),
  CONSTRAINT chk_interactive_demo_revision_title CHECK (length(trim(title)) > 0),
  CONSTRAINT chk_interactive_demo_revision_draft_version CHECK (source_working_draft_version > 0),
  CONSTRAINT chk_interactive_demo_revision_digest CHECK (content_sha256 ~ '^[0-9a-f]{64}$')
);

CREATE TABLE interactive_demo_schema.demo_revision_scene (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_revision_id VARCHAR(26) NOT NULL,
  source_capture_session_id VARCHAR(26) DEFAULT NULL,
  source_capture_event_id VARCHAR(26) DEFAULT NULL,
  source_capture_asset_id VARCHAR(26) DEFAULT NULL,
  background_capture_asset_id VARCHAR(26) DEFAULT NULL,
  scene_index INTEGER NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  CONSTRAINT uq_demo_revision_scene_scope UNIQUE (id, interactive_demo_revision_id, project_id, organization_id),
  CONSTRAINT uq_demo_revision_scene_order UNIQUE (interactive_demo_revision_id, scene_index),
  CONSTRAINT fk_demo_revision_scene_revision FOREIGN KEY (interactive_demo_revision_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo_revision(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_revision_scene_source_session FOREIGN KEY (source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_session(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_revision_scene_source_event FOREIGN KEY (source_capture_event_id, source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_event(id, capture_session_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_revision_scene_source_asset FOREIGN KEY (source_capture_asset_id, source_capture_session_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, capture_session_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_revision_scene_background_asset FOREIGN KEY (background_capture_asset_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_demo_revision_scene_index CHECK (scene_index > 0)
);

CREATE TABLE interactive_demo_schema.demo_revision_hotspot (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_revision_id VARCHAR(26) NOT NULL,
  demo_revision_scene_id VARCHAR(26) NOT NULL,
  hotspot_type VARCHAR(50) NOT NULL,
  label VARCHAR(255) DEFAULT NULL,
  content TEXT DEFAULT NULL,
  x NUMERIC(8,6) NOT NULL,
  y NUMERIC(8,6) NOT NULL,
  width NUMERIC(8,6) NOT NULL,
  height NUMERIC(8,6) NOT NULL,
  hotspot_index INTEGER NOT NULL,
  CONSTRAINT uq_demo_revision_hotspot_scope UNIQUE (id, interactive_demo_revision_id, project_id, organization_id),
  CONSTRAINT uq_demo_revision_hotspot_order UNIQUE (demo_revision_scene_id, hotspot_index),
  CONSTRAINT fk_demo_revision_hotspot_scene FOREIGN KEY (demo_revision_scene_id, interactive_demo_revision_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.demo_revision_scene(id, interactive_demo_revision_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_demo_revision_hotspot_type CHECK (hotspot_type IN ('click', 'info', 'next')),
  CONSTRAINT chk_demo_revision_hotspot_index CHECK (hotspot_index > 0),
  CONSTRAINT chk_demo_revision_hotspot_box CHECK (x >= 0 AND y >= 0 AND width > 0 AND height > 0 AND x + width <= 1 AND y + height <= 1)
);

CREATE TABLE interactive_demo_schema.demo_revision_transition (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_revision_id VARCHAR(26) NOT NULL,
  demo_revision_hotspot_id VARCHAR(26) NOT NULL UNIQUE,
  target_demo_revision_scene_id VARCHAR(26) NOT NULL,
  CONSTRAINT fk_demo_revision_transition_hotspot FOREIGN KEY (demo_revision_hotspot_id, interactive_demo_revision_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.demo_revision_hotspot(id, interactive_demo_revision_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_revision_transition_target FOREIGN KEY (target_demo_revision_scene_id, interactive_demo_revision_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.demo_revision_scene(id, interactive_demo_revision_id, project_id, organization_id) ON DELETE RESTRICT
);

ALTER TABLE guide_schema.guide_edition
  ADD COLUMN source_guide_edition_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN source_guide_revision_id VARCHAR(26) DEFAULT NULL,
  ADD CONSTRAINT chk_guide_edition_lineage_pair CHECK ((source_guide_edition_id IS NULL) = (source_guide_revision_id IS NULL)),
  ADD CONSTRAINT fk_guide_edition_lineage_revision FOREIGN KEY (source_guide_revision_id, source_guide_edition_id, guide_id, project_id, organization_id)
    REFERENCES guide_schema.guide_revision(id, guide_edition_id, guide_id, project_id, organization_id) ON DELETE RESTRICT;

ALTER TABLE interactive_demo_schema.interactive_demo_edition
  ADD COLUMN source_interactive_demo_edition_id VARCHAR(26) DEFAULT NULL,
  ADD COLUMN source_interactive_demo_revision_id VARCHAR(26) DEFAULT NULL,
  ADD CONSTRAINT chk_interactive_demo_edition_lineage_pair CHECK ((source_interactive_demo_edition_id IS NULL) = (source_interactive_demo_revision_id IS NULL)),
  ADD CONSTRAINT fk_interactive_demo_edition_lineage_revision FOREIGN KEY (source_interactive_demo_revision_id, source_interactive_demo_edition_id, interactive_demo_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo_revision(id, interactive_demo_edition_id, interactive_demo_id, project_id, organization_id) ON DELETE RESTRICT;

CREATE TABLE project_schema.artifact_carry_forward (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL REFERENCES organization_schema.organization(id) ON DELETE RESTRICT,
  project_id VARCHAR(26) NOT NULL,
  source_project_version_id VARCHAR(26) NOT NULL,
  target_project_version_id VARCHAR(26) NOT NULL,
  idempotency_key_hash CHAR(64) NOT NULL,
  request_fingerprint_sha256 CHAR(64) NOT NULL,
  selection_count INTEGER NOT NULL,
  created_by_id VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_artifact_carry_forward_actor_key UNIQUE (organization_id, project_id, created_by_id, idempotency_key_hash),
  CONSTRAINT uq_artifact_carry_forward_scope UNIQUE (id, project_id, organization_id),
  CONSTRAINT fk_artifact_carry_forward_project FOREIGN KEY (project_id, organization_id)
    REFERENCES project_schema.project(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_artifact_carry_forward_source FOREIGN KEY (source_project_version_id, project_id, organization_id)
    REFERENCES project_schema.project_version(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_artifact_carry_forward_target FOREIGN KEY (target_project_version_id, project_id, organization_id)
    REFERENCES project_schema.project_version(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_artifact_carry_forward_actor FOREIGN KEY (created_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_artifact_carry_forward_versions CHECK (source_project_version_id <> target_project_version_id),
  CONSTRAINT chk_artifact_carry_forward_count CHECK (selection_count BETWEEN 1 AND 50),
  CONSTRAINT chk_artifact_carry_forward_key_hash CHECK (idempotency_key_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_artifact_carry_forward_fingerprint CHECK (request_fingerprint_sha256 ~ '^[0-9a-f]{64}$')
);

CREATE TABLE project_schema.artifact_carry_forward_item (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  artifact_carry_forward_id VARCHAR(26) NOT NULL,
  item_index INTEGER NOT NULL,
  artifact_type VARCHAR(50) NOT NULL,
  artifact_id VARCHAR(26) NOT NULL,
  CONSTRAINT uq_artifact_carry_forward_item_scope UNIQUE (id, artifact_type, artifact_id, project_id, organization_id),
  CONSTRAINT uq_artifact_carry_forward_item_id_scope UNIQUE (id, project_id, organization_id),
  CONSTRAINT uq_artifact_carry_forward_item_order UNIQUE (artifact_carry_forward_id, item_index),
  CONSTRAINT uq_artifact_carry_forward_item_artifact UNIQUE (artifact_carry_forward_id, artifact_type, artifact_id),
  CONSTRAINT fk_artifact_carry_forward_item_operation FOREIGN KEY (artifact_carry_forward_id, project_id, organization_id)
    REFERENCES project_schema.artifact_carry_forward(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_artifact_carry_forward_item_index CHECK (item_index > 0),
  CONSTRAINT chk_artifact_carry_forward_item_type CHECK (artifact_type IN ('guide', 'interactive_demo'))
);

CREATE TABLE guide_schema.guide_carry_forward_item (
  artifact_carry_forward_item_id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  guide_id VARCHAR(26) NOT NULL,
  source_guide_edition_id VARCHAR(26) NOT NULL,
  source_guide_revision_id VARCHAR(26) NOT NULL,
  target_guide_edition_id VARCHAR(26) NOT NULL,
  target_guide_working_draft_id VARCHAR(26) NOT NULL,
  CONSTRAINT fk_guide_carry_forward_root FOREIGN KEY (artifact_carry_forward_item_id, project_id, organization_id)
    REFERENCES project_schema.artifact_carry_forward_item(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_carry_forward_artifact FOREIGN KEY (guide_id, project_id, organization_id)
    REFERENCES guide_schema.guide(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_carry_forward_source_revision FOREIGN KEY (source_guide_revision_id, source_guide_edition_id, guide_id, project_id, organization_id)
    REFERENCES guide_schema.guide_revision(id, guide_edition_id, guide_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_carry_forward_target_edition FOREIGN KEY (target_guide_edition_id, guide_id, project_id, organization_id)
    REFERENCES guide_schema.guide_edition(id, guide_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_guide_carry_forward_target_draft FOREIGN KEY (target_guide_working_draft_id, project_id, organization_id)
    REFERENCES guide_schema.guide_working_draft(id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE interactive_demo_schema.interactive_demo_carry_forward_item (
  artifact_carry_forward_item_id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  interactive_demo_id VARCHAR(26) NOT NULL,
  source_interactive_demo_edition_id VARCHAR(26) NOT NULL,
  source_interactive_demo_revision_id VARCHAR(26) NOT NULL,
  target_interactive_demo_edition_id VARCHAR(26) NOT NULL,
  target_interactive_demo_working_draft_id VARCHAR(26) NOT NULL,
  CONSTRAINT fk_demo_carry_forward_root FOREIGN KEY (artifact_carry_forward_item_id, project_id, organization_id)
    REFERENCES project_schema.artifact_carry_forward_item(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_carry_forward_artifact FOREIGN KEY (interactive_demo_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_carry_forward_source_revision FOREIGN KEY (source_interactive_demo_revision_id, source_interactive_demo_edition_id, interactive_demo_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo_revision(id, interactive_demo_edition_id, interactive_demo_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_carry_forward_target_edition FOREIGN KEY (target_interactive_demo_edition_id, interactive_demo_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo_edition(id, interactive_demo_id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_demo_carry_forward_target_draft FOREIGN KEY (target_interactive_demo_working_draft_id, project_id, organization_id)
    REFERENCES interactive_demo_schema.interactive_demo_working_draft(id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE FUNCTION project_schema.artifact_carry_forward_exactly_one_detail()
RETURNS TRIGGER AS $$
DECLARE root_id TEXT := COALESCE(NEW.id, OLD.id);
DECLARE expected_type TEXT;
DECLARE guide_count INTEGER;
DECLARE demo_count INTEGER;
BEGIN
  SELECT artifact_type INTO expected_type FROM project_schema.artifact_carry_forward_item WHERE id=root_id;
  SELECT count(*) INTO guide_count FROM guide_schema.guide_carry_forward_item WHERE artifact_carry_forward_item_id=root_id;
  SELECT count(*) INTO demo_count FROM interactive_demo_schema.interactive_demo_carry_forward_item WHERE artifact_carry_forward_item_id=root_id;
  IF guide_count + demo_count <> 1 OR (expected_type='guide' AND guide_count<>1) OR (expected_type='interactive_demo' AND demo_count<>1) THEN
    RAISE EXCEPTION 'Carry-Forward item requires exactly one matching typed detail'
      USING ERRCODE='23514', CONSTRAINT='artifact_carry_forward_exactly_one_detail';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER artifact_carry_forward_item_detail_guard
  AFTER INSERT ON project_schema.artifact_carry_forward_item DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION project_schema.artifact_carry_forward_exactly_one_detail();

CREATE TABLE capture_schema.capture_asset_purge_operation (
  id VARCHAR(26) PRIMARY KEY,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  capture_asset_id VARCHAR(26) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL,
  failure_code VARCHAR(100) DEFAULT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  requested_by_id VARCHAR(26) NOT NULL,
  completed_by_id VARCHAR(26) DEFAULT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT uq_capture_asset_purge_operation_scope UNIQUE (id, capture_asset_id, project_id, organization_id),
  CONSTRAINT fk_capture_asset_purge_asset FOREIGN KEY (capture_asset_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, project_id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_capture_asset_purge_requester FOREIGN KEY (requested_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT fk_capture_asset_purge_completer FOREIGN KEY (completed_by_id, organization_id)
    REFERENCES organization_schema.org_user(id, organization_id) ON DELETE RESTRICT,
  CONSTRAINT chk_capture_asset_purge_status CHECK (status IN ('pending', 'failed', 'completed')),
  CONSTRAINT chk_capture_asset_purge_attempt CHECK (attempt_count > 0),
  CONSTRAINT chk_capture_asset_purge_state CHECK (
    (status='pending' AND failure_code IS NULL AND completed_by_id IS NULL AND completed_at IS NULL)
    OR (status='failed' AND failure_code IS NOT NULL AND completed_by_id IS NULL AND completed_at IS NULL)
    OR (status='completed' AND failure_code IS NULL AND completed_by_id IS NOT NULL AND completed_at IS NOT NULL)
  )
);

CREATE TABLE publish_schema.published_artifact_capture_asset (
  id VARCHAR(26) PRIMARY KEY,
  published_artifact_id VARCHAR(26) NOT NULL,
  capture_asset_id VARCHAR(26) NOT NULL,
  organization_id VARCHAR(26) NOT NULL,
  project_id VARCHAR(26) NOT NULL,
  CONSTRAINT uq_published_artifact_capture_asset UNIQUE (published_artifact_id, capture_asset_id),
  CONSTRAINT fk_published_asset_projection_publication FOREIGN KEY (published_artifact_id)
    REFERENCES publish_schema.published_artifact(id) ON DELETE RESTRICT,
  CONSTRAINT fk_published_asset_projection_asset FOREIGN KEY (capture_asset_id, project_id, organization_id)
    REFERENCES capture_schema.capture_asset(id, project_id, organization_id) ON DELETE RESTRICT
);

CREATE FUNCTION project_schema.enforce_artifact_edition_lineage()
RETURNS TRIGGER AS $$
DECLARE source_version_id TEXT;
BEGIN
  IF TG_OP='UPDATE' AND (
    to_jsonb(OLD)->>CASE WHEN TG_TABLE_SCHEMA='guide_schema' THEN 'source_guide_edition_id' ELSE 'source_interactive_demo_edition_id' END
    IS DISTINCT FROM
    to_jsonb(NEW)->>CASE WHEN TG_TABLE_SCHEMA='guide_schema' THEN 'source_guide_edition_id' ELSE 'source_interactive_demo_edition_id' END
    OR to_jsonb(OLD)->>CASE WHEN TG_TABLE_SCHEMA='guide_schema' THEN 'source_guide_revision_id' ELSE 'source_interactive_demo_revision_id' END
    IS DISTINCT FROM
    to_jsonb(NEW)->>CASE WHEN TG_TABLE_SCHEMA='guide_schema' THEN 'source_guide_revision_id' ELSE 'source_interactive_demo_revision_id' END
  ) THEN RAISE EXCEPTION 'Artifact Edition lineage is immutable' USING ERRCODE='23514',CONSTRAINT='artifact_edition_lineage_immutable'; END IF;
  IF TG_TABLE_SCHEMA='guide_schema' AND NEW.source_guide_edition_id IS NOT NULL THEN
    SELECT project_version_id INTO source_version_id FROM guide_schema.guide_edition WHERE id=NEW.source_guide_edition_id;
  ELSIF TG_TABLE_SCHEMA='interactive_demo_schema' AND NEW.source_interactive_demo_edition_id IS NOT NULL THEN
    SELECT project_version_id INTO source_version_id FROM interactive_demo_schema.interactive_demo_edition WHERE id=NEW.source_interactive_demo_edition_id;
  END IF;
  IF source_version_id IS NOT NULL AND source_version_id=NEW.project_version_id THEN
    RAISE EXCEPTION 'Carry-Forward lineage must cross Project Versions' USING ERRCODE='23514',CONSTRAINT='artifact_edition_lineage_version';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER guide_edition_lineage_guard BEFORE INSERT OR UPDATE ON guide_schema.guide_edition
  FOR EACH ROW EXECUTE FUNCTION project_schema.enforce_artifact_edition_lineage();
CREATE TRIGGER interactive_demo_edition_lineage_guard BEFORE INSERT OR UPDATE ON interactive_demo_schema.interactive_demo_edition
  FOR EACH ROW EXECUTE FUNCTION project_schema.enforce_artifact_edition_lineage();

CREATE FUNCTION capture_schema.enforce_capture_asset_reference_lifecycle()
RETURNS TRIGGER AS $$
DECLARE key_name TEXT; asset_id TEXT; state TEXT; purge_state TEXT; command TEXT:=current_setting('ossie.audit_command',TRUE);
BEGIN
  FOREACH key_name IN ARRAY ARRAY['source_capture_asset_id','selected_capture_asset_id','background_capture_asset_id'] LOOP
    asset_id:=to_jsonb(NEW)->>key_name;
    IF asset_id IS NULL OR (TG_OP='UPDATE' AND asset_id IS NOT DISTINCT FROM to_jsonb(OLD)->>key_name) THEN CONTINUE; END IF;
    SELECT asset.status,operation.status INTO state,purge_state FROM capture_schema.capture_asset asset
      LEFT JOIN capture_schema.capture_asset_purge_operation operation ON operation.capture_asset_id=asset.id
      WHERE asset.id=asset_id AND asset.project_id=NEW.project_id AND asset.organization_id=NEW.organization_id AND asset.is_deleted=FALSE FOR SHARE OF asset;
    IF state IS NULL OR purge_state IN ('pending','failed','completed') THEN
      RAISE EXCEPTION 'Capture Asset is unavailable' USING ERRCODE='23514',CONSTRAINT='capture_asset_reference_lifecycle_guard';
    END IF;
    IF state='archived' AND command NOT IN ('artifact.carry_forward','guide.revision.restore','interactive_demo.revision.restore') THEN
      RAISE EXCEPTION 'Archived Capture Asset cannot be newly selected' USING ERRCODE='23514',CONSTRAINT='capture_asset_reference_lifecycle_guard';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER guide_step_asset_lifecycle_guard BEFORE INSERT OR UPDATE ON guide_schema.guide_step
  FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_capture_asset_reference_lifecycle();
CREATE TRIGGER demo_scene_asset_lifecycle_guard BEFORE INSERT OR UPDATE ON interactive_demo_schema.demo_scene
  FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_capture_asset_reference_lifecycle();

CREATE FUNCTION capture_schema.enforce_capture_asset_lifecycle_mutation()
RETURNS TRIGGER AS $$
DECLARE command TEXT:=current_setting('ossie.audit_command',TRUE); purge_state TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT ((OLD.status='active' AND NEW.status='archived' AND command='capture_asset.archive')
      OR (OLD.status='archived' AND NEW.status='active' AND command='capture_asset.restore')) THEN
      RAISE EXCEPTION 'Invalid Capture Asset lifecycle transition' USING ERRCODE='23514',CONSTRAINT='capture_asset_lifecycle_command_guard';
    END IF;
    IF NEW.status='active' THEN SELECT status INTO purge_state FROM capture_schema.capture_asset_purge_operation WHERE capture_asset_id=NEW.id;
      IF purge_state IN ('pending','failed','completed') THEN RAISE EXCEPTION 'Purged Asset cannot be restored' USING ERRCODE='23514',CONSTRAINT='capture_asset_restore_purge_guard'; END IF;
    END IF;
  END IF;
  IF NOT OLD.is_deleted AND NEW.is_deleted AND command<>'capture_asset.purge.complete' THEN
    RAISE EXCEPTION 'Capture Asset purge requires its workflow' USING ERRCODE='23514',CONSTRAINT='capture_asset_purge_command_guard';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER capture_asset_lifecycle_guard BEFORE UPDATE ON capture_schema.capture_asset
  FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_capture_asset_lifecycle_mutation();

CREATE FUNCTION capture_schema.enforce_file_purge_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT OLD.is_deleted AND NEW.is_deleted AND (
    current_setting('ossie.audit_command',TRUE)<>'capture_asset.purge.complete'
    OR NOT EXISTS(SELECT 1 FROM capture_schema.capture_asset asset
      JOIN capture_schema.capture_asset_purge_operation operation ON operation.capture_asset_id=asset.id
      WHERE asset.file_id=NEW.id AND operation.status='pending')
  ) THEN RAISE EXCEPTION 'File purge requires a pending Asset purge' USING ERRCODE='23514',CONSTRAINT='file_purge_command_guard'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER file_purge_guard BEFORE UPDATE ON file_schema.file
  FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_file_purge_mutation();

CREATE FUNCTION capture_schema.enforce_capture_asset_purge_request()
RETURNS TRIGGER AS $$
DECLARE asset_file_id TEXT;
BEGIN
  IF NEW.status<>'pending' THEN RETURN NEW; END IF;
  SELECT file_id INTO asset_file_id FROM capture_schema.capture_asset WHERE id=NEW.capture_asset_id AND project_id=NEW.project_id
    AND organization_id=NEW.organization_id AND status='archived' AND is_deleted=FALSE FOR UPDATE;
  IF asset_file_id IS NULL OR EXISTS(SELECT 1 FROM capture_schema.capture_asset other WHERE other.file_id=asset_file_id AND other.id<>NEW.capture_asset_id AND other.is_deleted=FALSE)
    OR EXISTS(SELECT 1 FROM guide_schema.guide_step WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND is_deleted=FALSE AND NEW.capture_asset_id IN(source_capture_asset_id,selected_capture_asset_id))
    OR EXISTS(SELECT 1 FROM interactive_demo_schema.demo_scene WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND is_deleted=FALSE AND NEW.capture_asset_id IN(source_capture_asset_id,background_capture_asset_id))
    OR EXISTS(SELECT 1 FROM guide_schema.guide_revision_step WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND NEW.capture_asset_id IN(source_capture_asset_id,selected_capture_asset_id))
    OR EXISTS(SELECT 1 FROM interactive_demo_schema.demo_revision_scene WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND NEW.capture_asset_id IN(source_capture_asset_id,background_capture_asset_id))
    OR EXISTS(SELECT 1 FROM publish_schema.published_artifact_capture_asset WHERE project_id=NEW.project_id AND organization_id=NEW.organization_id AND capture_asset_id=NEW.capture_asset_id)
  THEN RAISE EXCEPTION 'Capture Asset is protected' USING ERRCODE='23514',CONSTRAINT='capture_asset_purge_protection_guard'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER capture_asset_purge_request_guard BEFORE INSERT OR UPDATE ON capture_schema.capture_asset_purge_operation
  FOR EACH ROW EXECUTE FUNCTION capture_schema.enforce_capture_asset_purge_request();

CREATE FUNCTION project_schema.prevent_immutable_revision_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN COALESCE(NEW, OLD); END IF;
  RAISE EXCEPTION 'Immutable Revision and Carry-Forward history cannot be changed'
    USING ERRCODE='23514', CONSTRAINT='immutable_revision_guard';
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION project_schema.verify_guide_revision_block_shape()
RETURNS TRIGGER AS $$
DECLARE root_id TEXT:=COALESCE(NEW.guide_revision_id,OLD.guide_revision_id); bad BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM guide_schema.guide_revision_block block
    WHERE block.guide_revision_id=root_id AND ((block.block_type='step')<>(EXISTS(SELECT 1 FROM guide_schema.guide_revision_step step
      WHERE step.guide_revision_block_id=block.id)))) INTO bad;
  IF bad THEN RAISE EXCEPTION 'Guide Revision block/Step shape is invalid' USING ERRCODE='23514',CONSTRAINT='guide_revision_block_shape'; END IF;
  RETURN COALESCE(NEW,OLD);
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER guide_revision_block_shape_guard AFTER INSERT ON guide_schema.guide_revision_block
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION project_schema.verify_guide_revision_block_shape();

DO $$
DECLARE target REGCLASS;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'guide_schema.guide_revision'::regclass,
    'guide_schema.guide_revision_block'::regclass,
    'guide_schema.guide_revision_step'::regclass,
    'guide_schema.guide_revision_annotation'::regclass,
    'interactive_demo_schema.interactive_demo_revision'::regclass,
    'interactive_demo_schema.demo_revision_scene'::regclass,
    'interactive_demo_schema.demo_revision_hotspot'::regclass,
    'interactive_demo_schema.demo_revision_transition'::regclass,
    'project_schema.artifact_carry_forward'::regclass,
    'project_schema.artifact_carry_forward_item'::regclass,
    'guide_schema.guide_carry_forward_item'::regclass,
    'interactive_demo_schema.interactive_demo_carry_forward_item'::regclass,
    'publish_schema.published_artifact_capture_asset'::regclass
  ] LOOP
    EXECUTE format('CREATE TRIGGER immutable_history_guard BEFORE UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION project_schema.prevent_immutable_revision_mutation()', target);
    EXECUTE format('CREATE TRIGGER immutable_history_truncate_guard BEFORE TRUNCATE ON %s FOR EACH STATEMENT EXECUTE FUNCTION project_schema.prevent_immutable_revision_mutation()', target);
  END LOOP;
END;
$$;

ALTER FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid_v022;
CREATE FUNCTION audit_schema.mutation_command_policy_is_valid(selected_command TEXT, selected_action TEXT, selected_actor_type TEXT, selected_source_type TEXT)
RETURNS BOOLEAN AS $$
  SELECT audit_schema.mutation_command_policy_is_valid_v022(selected_command, selected_action, selected_actor_type, selected_source_type)
    OR ((selected_command, selected_action) IN (
      ('guide.revision.checkpoint', 'guide.revision.created'),
      ('guide.revision.restore', 'guide.revision.restored'),
      ('interactive_demo.revision.checkpoint', 'interactive_demo.revision.created'),
      ('interactive_demo.revision.restore', 'interactive_demo.revision.restored'),
      ('artifact.carry_forward', 'artifact.editions.carried_forward'),
      ('capture_asset.archive', 'capture_asset.archived'),
      ('capture_asset.restore', 'capture_asset.restored'),
      ('capture_asset.purge.request', 'capture_asset.purge_requested'),
      ('capture_asset.purge.fail', 'capture_asset.purge_failed'),
      ('capture_asset.purge.complete', 'capture_asset.purged')
    ) AND selected_actor_type='org_user' AND selected_source_type IN ('web','api','extension'));
$$ LANGUAGE SQL IMMUTABLE;

DO $$
DECLARE registration RECORD;
DECLARE operation_short TEXT;
BEGIN
  FOR registration IN SELECT * FROM (VALUES
    ('capture_schema', 'capture_asset', 'UPDATE', 'capture_asset', 'capture_asset.archive,capture_asset.restore,capture_asset.purge.complete'),
    ('file_schema', 'file', 'UPDATE', 'file', 'capture_asset.purge.complete'),
    ('capture_schema', 'capture_asset_purge_operation', 'INSERT', 'capture_asset_purge_operation', 'capture_asset.purge.request'),
    ('capture_schema', 'capture_asset_purge_operation', 'UPDATE', 'capture_asset_purge_operation', 'capture_asset.purge.fail,capture_asset.purge.complete'),
    ('guide_schema', 'guide_revision', 'INSERT', 'guide_revision', 'guide.revision.checkpoint,artifact.carry_forward'),
    ('guide_schema', 'guide_revision_block', 'INSERT', 'guide_revision_block', 'guide.revision.checkpoint,artifact.carry_forward'),
    ('guide_schema', 'guide_revision_step', 'INSERT', 'guide_revision_step', 'guide.revision.checkpoint,artifact.carry_forward'),
    ('guide_schema', 'guide_revision_annotation', 'INSERT', 'guide_revision_annotation', 'guide.revision.checkpoint,artifact.carry_forward'),
    ('interactive_demo_schema', 'interactive_demo_revision', 'INSERT', 'interactive_demo_revision', 'interactive_demo.revision.checkpoint,artifact.carry_forward'),
    ('interactive_demo_schema', 'demo_revision_scene', 'INSERT', 'demo_revision_scene', 'interactive_demo.revision.checkpoint,artifact.carry_forward'),
    ('interactive_demo_schema', 'demo_revision_hotspot', 'INSERT', 'demo_revision_hotspot', 'interactive_demo.revision.checkpoint,artifact.carry_forward'),
    ('interactive_demo_schema', 'demo_revision_transition', 'INSERT', 'demo_revision_transition', 'interactive_demo.revision.checkpoint,artifact.carry_forward'),
    ('project_schema', 'artifact_carry_forward', 'INSERT', 'artifact_carry_forward', 'artifact.carry_forward'),
    ('project_schema', 'artifact_carry_forward_item', 'INSERT', 'artifact_carry_forward_item', 'artifact.carry_forward'),
    ('guide_schema', 'guide_carry_forward_item', 'INSERT', 'guide_carry_forward_item', 'artifact.carry_forward'),
    ('interactive_demo_schema', 'interactive_demo_carry_forward_item', 'INSERT', 'interactive_demo_carry_forward_item', 'artifact.carry_forward'),
    ('publish_schema', 'published_artifact_capture_asset', 'INSERT', 'published_artifact_capture_asset', 'publish.guide,publish.interactive_demo'),
    ('guide_schema', 'guide_edition', 'INSERT', 'guide_edition', 'guide.create_from_capture,artifact.carry_forward'),
    ('guide_schema', 'guide_edition', 'UPDATE', 'guide_edition', 'guide.update,guide.archive,guide.restore,guide.revision.restore'),
    ('guide_schema', 'guide_working_draft', 'INSERT', 'guide_working_draft', 'guide.create_from_capture,artifact.carry_forward'),
    ('guide_schema', 'guide_working_draft', 'UPDATE', 'guide_working_draft', 'guide.revision.restore,guide.step.update,guide.blocks.reorder,guide.block.create,guide.block.update,guide.block.screenshot.update,guide.block.annotations.update,guide.block.screenshot_upload,guide.block.delete'),
    ('guide_schema', 'guide_block', 'INSERT', 'guide_block', 'guide.create_from_capture,guide.revision.restore,guide.block.create,artifact.carry_forward'),
    ('guide_schema', 'guide_block', 'UPDATE', 'guide_block', 'guide.revision.restore,guide.blocks.reorder,guide.block.create,guide.block.update,guide.block.delete'),
    ('guide_schema', 'guide_step', 'INSERT', 'guide_step', 'guide.create_from_capture,guide.revision.restore,guide.block.create,artifact.carry_forward'),
    ('guide_schema', 'guide_step', 'UPDATE', 'guide_step', 'guide.revision.restore,guide.step.update,guide.block.screenshot.update,guide.block.screenshot_upload,guide.block.delete'),
    ('guide_schema', 'guide_annotation', 'INSERT', 'guide_annotation', 'guide.revision.restore,guide.block.annotations.update,artifact.carry_forward'),
    ('guide_schema', 'guide_annotation', 'UPDATE', 'guide_annotation', 'guide.revision.restore,guide.block.screenshot.update,guide.block.annotations.update,guide.block.delete'),
    ('interactive_demo_schema', 'interactive_demo_edition', 'INSERT', 'interactive_demo_edition', 'interactive_demo.create_from_capture,interactive_demo.create,artifact.carry_forward'),
    ('interactive_demo_schema', 'interactive_demo_edition', 'UPDATE', 'interactive_demo_edition', 'interactive_demo.update,interactive_demo.archive,interactive_demo.restore,interactive_demo.revision.restore'),
    ('interactive_demo_schema', 'interactive_demo_working_draft', 'INSERT', 'interactive_demo_working_draft', 'interactive_demo.create_from_capture,interactive_demo.create,artifact.carry_forward'),
    ('interactive_demo_schema', 'interactive_demo_working_draft', 'UPDATE', 'interactive_demo_working_draft', 'interactive_demo.revision.restore,interactive_demo.scene.create,interactive_demo.scene.update,interactive_demo.scenes.reorder,interactive_demo.scene.delete,interactive_demo.hotspot.create,interactive_demo.hotspot.update,interactive_demo.hotspots.reorder,interactive_demo.hotspot.delete'),
    ('interactive_demo_schema', 'demo_scene', 'INSERT', 'demo_scene', 'interactive_demo.create_from_capture,interactive_demo.revision.restore,interactive_demo.scene.create,artifact.carry_forward'),
    ('interactive_demo_schema', 'demo_scene', 'UPDATE', 'demo_scene', 'interactive_demo.revision.restore,interactive_demo.scene.update,interactive_demo.scenes.reorder,interactive_demo.scene.delete'),
    ('interactive_demo_schema', 'demo_hotspot', 'INSERT', 'demo_hotspot', 'interactive_demo.revision.restore,interactive_demo.hotspot.create,artifact.carry_forward'),
    ('interactive_demo_schema', 'demo_hotspot', 'UPDATE', 'demo_hotspot', 'interactive_demo.revision.restore,interactive_demo.scene.delete,interactive_demo.hotspot.update,interactive_demo.hotspots.reorder,interactive_demo.hotspot.delete'),
    ('interactive_demo_schema', 'demo_transition', 'INSERT', 'demo_transition', 'interactive_demo.revision.restore,interactive_demo.hotspot.create,interactive_demo.hotspot.update,artifact.carry_forward'),
    ('interactive_demo_schema', 'demo_transition', 'UPDATE', 'demo_transition', 'interactive_demo.revision.restore,interactive_demo.scene.delete,interactive_demo.hotspot.update,interactive_demo.hotspot.delete')
  ) AS entries(schema_name, table_name, sql_operation, entity_type, commands)
  LOOP
    operation_short := CASE registration.sql_operation WHEN 'INSERT' THEN 'i' ELSE 'u' END;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', registration.table_name || '_' || operation_short || '_audit_ctx', registration.schema_name, registration.table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', registration.table_name || '_' || operation_short || '_audit_evd', registration.schema_name, registration.table_name);
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

GRANT SELECT, INSERT ON guide_schema.guide_revision, guide_schema.guide_revision_block,
  guide_schema.guide_revision_step, guide_schema.guide_revision_annotation,
  interactive_demo_schema.interactive_demo_revision,
  interactive_demo_schema.demo_revision_scene,
  interactive_demo_schema.demo_revision_hotspot,
  interactive_demo_schema.demo_revision_transition,
  project_schema.artifact_carry_forward,
  project_schema.artifact_carry_forward_item,
  guide_schema.guide_carry_forward_item,
  interactive_demo_schema.interactive_demo_carry_forward_item,
  publish_schema.published_artifact_capture_asset TO __OSSIE_RUNTIME_DB_ROLE__;
GRANT SELECT, INSERT, UPDATE ON capture_schema.capture_asset_purge_operation TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM guide_schema.guide_revision LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.interactive_demo_revision LIMIT 1)
    OR EXISTS (SELECT 1 FROM project_schema.artifact_carry_forward LIMIT 1)
    OR EXISTS (SELECT 1 FROM capture_schema.capture_asset_purge_operation LIMIT 1)
    OR EXISTS (SELECT 1 FROM publish_schema.published_artifact_capture_asset LIMIT 1)
    OR EXISTS (SELECT 1 FROM guide_schema.guide_edition WHERE source_guide_revision_id IS NOT NULL LIMIT 1)
    OR EXISTS (SELECT 1 FROM interactive_demo_schema.interactive_demo_edition WHERE source_interactive_demo_revision_id IS NOT NULL LIMIT 1)
    OR EXISTS (SELECT 1 FROM capture_schema.capture_asset WHERE status <> 'active' LIMIT 1)
  THEN
    RAISE EXCEPTION 'Refusing to remove populated Revision and protected Asset foundation'
      USING ERRCODE='55000';
  END IF;
END;
$$;

DROP FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT);
ALTER FUNCTION audit_schema.mutation_command_policy_is_valid_v022(TEXT, TEXT, TEXT, TEXT)
  RENAME TO mutation_command_policy_is_valid;
DROP TABLE publish_schema.published_artifact_capture_asset;
DROP TRIGGER capture_asset_purge_request_guard ON capture_schema.capture_asset_purge_operation;
DROP FUNCTION capture_schema.enforce_capture_asset_purge_request();
DROP TABLE capture_schema.capture_asset_purge_operation;
DROP TRIGGER file_purge_guard ON file_schema.file;
DROP FUNCTION capture_schema.enforce_file_purge_mutation();
DROP TRIGGER capture_asset_lifecycle_guard ON capture_schema.capture_asset;
DROP FUNCTION capture_schema.enforce_capture_asset_lifecycle_mutation();
DROP TRIGGER guide_step_asset_lifecycle_guard ON guide_schema.guide_step;
DROP TRIGGER demo_scene_asset_lifecycle_guard ON interactive_demo_schema.demo_scene;
DROP FUNCTION capture_schema.enforce_capture_asset_reference_lifecycle();
DROP TRIGGER artifact_carry_forward_item_detail_guard ON project_schema.artifact_carry_forward_item;
DROP FUNCTION project_schema.artifact_carry_forward_exactly_one_detail();
DROP TABLE interactive_demo_schema.interactive_demo_carry_forward_item;
DROP TABLE guide_schema.guide_carry_forward_item;
DROP TABLE project_schema.artifact_carry_forward_item;
DROP TABLE project_schema.artifact_carry_forward;
DROP TRIGGER interactive_demo_edition_lineage_guard ON interactive_demo_schema.interactive_demo_edition;
DROP TRIGGER guide_edition_lineage_guard ON guide_schema.guide_edition;
ALTER TABLE interactive_demo_schema.interactive_demo_edition
  DROP CONSTRAINT fk_interactive_demo_edition_lineage_revision,
  DROP CONSTRAINT chk_interactive_demo_edition_lineage_pair,
  DROP COLUMN source_interactive_demo_revision_id,
  DROP COLUMN source_interactive_demo_edition_id;
ALTER TABLE guide_schema.guide_edition
  DROP CONSTRAINT fk_guide_edition_lineage_revision,
  DROP CONSTRAINT chk_guide_edition_lineage_pair,
  DROP COLUMN source_guide_revision_id,
  DROP COLUMN source_guide_edition_id;
DROP FUNCTION project_schema.enforce_artifact_edition_lineage();
DROP TABLE interactive_demo_schema.demo_revision_transition;
DROP TABLE interactive_demo_schema.demo_revision_hotspot;
DROP TABLE interactive_demo_schema.demo_revision_scene;
DROP TABLE interactive_demo_schema.interactive_demo_revision;
DROP TABLE guide_schema.guide_revision_annotation;
DROP TABLE guide_schema.guide_revision_step;
DROP TABLE guide_schema.guide_revision_block;
DROP TABLE guide_schema.guide_revision;
DROP FUNCTION project_schema.verify_guide_revision_block_shape();
DROP FUNCTION project_schema.prevent_immutable_revision_mutation();
ALTER TABLE capture_schema.capture_asset DROP CONSTRAINT chk_capture_asset_status, DROP COLUMN status;
ALTER TABLE interactive_demo_schema.interactive_demo_edition
  DROP CONSTRAINT uq_interactive_demo_edition_lineage_target;
ALTER TABLE guide_schema.guide_edition
  DROP CONSTRAINT uq_guide_edition_lineage_target;

-- Restore every pre-023 mutation registration that this migration replaced.
-- Empty DOWN/UP must not leave an older table accepting child-119 commands.
DO $$
DECLARE registration RECORD;
DECLARE operation_short TEXT;
BEGIN
  FOR registration IN SELECT * FROM (VALUES
    ('file_schema', 'file', 'UPDATE', 'file', 'capture_asset.delete'),
    ('capture_schema', 'capture_asset', 'UPDATE', 'capture_asset', 'capture_asset.delete'),
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
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', registration.table_name || '_' || operation_short || '_audit_ctx', registration.schema_name, registration.table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', registration.table_name || '_' || operation_short || '_audit_evd', registration.schema_name, registration.table_name);
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
