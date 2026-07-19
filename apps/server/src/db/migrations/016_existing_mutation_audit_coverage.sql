-- 016_existing_mutation_audit_coverage.sql
-- Created On: 2026-07-19

-- UP:

DROP TRIGGER IF EXISTS project_insert_audit_evidence_guard ON project_schema.project;
DROP TRIGGER IF EXISTS project_insert_audit_context_guard ON project_schema.project;
DROP FUNCTION IF EXISTS audit_schema.verify_project_insert_evidence();
DROP FUNCTION IF EXISTS audit_schema.require_project_insert_context();

CREATE OR REPLACE FUNCTION audit_schema.require_mutation_context()
RETURNS TRIGGER AS $$
DECLARE
  row_data JSONB := to_jsonb(NEW);
  row_organization_id TEXT;
  allowed_commands TEXT[] := string_to_array(TG_ARGV[2], ',');
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

  IF COALESCE(current_setting('ossie.audit_event_id', true), '') = ''
    OR COALESCE(current_setting('ossie.audit_action', true), '') = ''
    OR COALESCE(current_setting('ossie.audit_actor_type', true), '') = ''
    OR COALESCE(current_setting('ossie.audit_source_type', true), '') = ''
    OR current_setting('ossie.audit_organization_id', true) IS DISTINCT FROM row_organization_id
    OR NOT (current_setting('ossie.audit_command', true) = ANY (allowed_commands))
  THEN
    RAISE EXCEPTION 'Mutation requires matching Audit context'
      USING ERRCODE = '23514', CONSTRAINT = 'ossie_audit_guard_context';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION audit_schema.verify_mutation_evidence()
RETURNS TRIGGER AS $$
DECLARE
  row_data JSONB := to_jsonb(NEW);
  old_data JSONB := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
  row_organization_id TEXT;
  expected_operation TEXT;
  expected_event_id TEXT := current_setting('ossie.audit_event_id', true);
  row_id TEXT := row_data ->> 'id';
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
      USING ERRCODE = '23514', CONSTRAINT = 'ossie_audit_guard_evidence';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  registration RECORD;
  operation_short TEXT;
BEGIN
  FOR registration IN
    SELECT * FROM (VALUES
      ('user_schema', 'user', 'INSERT', 'user', 'context', 'setup.complete_first_run,organization.invite.accept'),
      ('organization_schema', 'organization', 'INSERT', 'organization', 'id', 'setup.complete_first_run'),
      ('organization_schema', 'org_user', 'INSERT', 'org_user', 'direct', 'setup.complete_first_run,organization.invite.accept'),
      ('organization_schema', 'org_invite', 'INSERT', 'org_invite', 'direct', 'organization.invite.create'),
      ('organization_schema', 'org_invite', 'UPDATE', 'org_invite', 'direct', 'organization.invite.revoke,organization.invite.accept'),
      ('auth_schema', 'auth_session', 'INSERT', 'auth_session', 'direct', 'setup.complete_first_run,authentication.session.create,organization.invite.accept'),
      ('auth_schema', 'auth_session', 'UPDATE', 'auth_session', 'direct', 'authentication.session.touch,authentication.session.revoke'),
      ('project_schema', 'project', 'INSERT', 'project', 'direct', 'project.create'),
      ('project_schema', 'project', 'UPDATE', 'project', 'direct', 'project.update,project.delete'),
      ('capture_schema', 'capture_session', 'INSERT', 'capture_session', 'direct', 'capture_session.create'),
      ('capture_schema', 'capture_session', 'UPDATE', 'capture_session', 'direct', 'capture_session.update,capture_session.complete,capture_session.delete'),
      ('file_schema', 'file', 'INSERT', 'file', 'direct', 'capture_asset.create,capture_asset.upload,guide.block.screenshot_upload'),
      ('file_schema', 'file', 'UPDATE', 'file', 'direct', 'capture_asset.delete'),
      ('capture_schema', 'capture_asset', 'INSERT', 'capture_asset', 'direct', 'capture_asset.create,capture_asset.upload,guide.block.screenshot_upload'),
      ('capture_schema', 'capture_asset', 'UPDATE', 'capture_asset', 'direct', 'capture_asset.delete'),
      ('capture_schema', 'capture_event', 'INSERT', 'capture_event', 'direct', 'capture_event.create'),
      ('capture_schema', 'capture_event', 'UPDATE', 'capture_event', 'direct', 'capture_event.update,capture_event.reorder,capture_event.delete'),
      ('guide_schema', 'guide', 'INSERT', 'guide', 'direct', 'guide.create_from_capture'),
      ('guide_schema', 'guide', 'UPDATE', 'guide', 'direct', 'guide.update,guide.step.update,guide.blocks.reorder,guide.block.create,guide.block.update,guide.block.screenshot.update,guide.block.annotations.update,guide.block.screenshot_upload,guide.block.delete'),
      ('guide_schema', 'guide_block', 'INSERT', 'guide_block', 'direct', 'guide.create_from_capture,guide.block.create'),
      ('guide_schema', 'guide_block', 'UPDATE', 'guide_block', 'direct', 'guide.blocks.reorder,guide.block.create,guide.block.update,guide.block.screenshot.update,guide.block.annotations.update,guide.block.screenshot_upload,guide.block.delete'),
      ('guide_schema', 'guide_step', 'INSERT', 'guide_step', 'direct', 'guide.create_from_capture,guide.block.create'),
      ('guide_schema', 'guide_step', 'UPDATE', 'guide_step', 'direct', 'guide.step.update,guide.block.update,guide.block.delete'),
      ('interactive_demo_schema', 'interactive_demo', 'INSERT', 'interactive_demo', 'direct', 'interactive_demo.create_from_capture,interactive_demo.create'),
      ('interactive_demo_schema', 'interactive_demo', 'UPDATE', 'interactive_demo', 'direct', 'interactive_demo.update,interactive_demo.delete'),
      ('interactive_demo_schema', 'demo_scene', 'INSERT', 'demo_scene', 'direct', 'interactive_demo.create_from_capture,interactive_demo.scene.create'),
      ('interactive_demo_schema', 'demo_scene', 'UPDATE', 'demo_scene', 'direct', 'interactive_demo.scene.update,interactive_demo.scenes.reorder,interactive_demo.scene.delete'),
      ('interactive_demo_schema', 'demo_hotspot', 'INSERT', 'demo_hotspot', 'direct', 'interactive_demo.hotspot.create'),
      ('interactive_demo_schema', 'demo_hotspot', 'UPDATE', 'demo_hotspot', 'direct', 'interactive_demo.hotspot.update,interactive_demo.hotspots.reorder,interactive_demo.hotspot.delete'),
      ('publish_schema', 'published_artifact', 'INSERT', 'published_artifact', 'direct', 'publish.guide,publish.interactive_demo'),
      ('publish_schema', 'publish_link', 'INSERT', 'publish_link', 'direct', 'publish.guide,publish.interactive_demo'),
      ('publish_schema', 'publish_link', 'UPDATE', 'publish_link', 'direct', 'publish.guide,publish.interactive_demo,publish.guide_link.revoke,publish.interactive_demo_link.revoke,publish.guide_link.access_update,publish.interactive_demo_link.access_update,publish.guide_link.password_update,publish.interactive_demo_link.password_update'),
      ('publish_schema', 'public_publish_viewer_session', 'INSERT', 'public_publish_viewer_session', 'viewer', 'publish.viewer_session.create'),
      ('publish_schema', 'public_publish_viewer_session', 'UPDATE', 'public_publish_viewer_session', 'viewer', 'publish.viewer_session.touch,publish.guide_link.revoke,publish.interactive_demo_link.revoke,publish.guide_link.password_update,publish.interactive_demo_link.password_update')
    ) AS entries(schema_name, table_name, sql_operation, entity_type, tenant_mode, commands)
  LOOP
    operation_short := CASE registration.sql_operation WHEN 'INSERT' THEN 'i' ELSE 'u' END;
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE %s ON %I.%I FOR EACH ROW EXECUTE FUNCTION audit_schema.require_mutation_context(%L, %L, %L)',
      registration.table_name || '_' || operation_short || '_audit_ctx',
      registration.sql_operation, registration.schema_name, registration.table_name,
      registration.entity_type, registration.tenant_mode, registration.commands
    );
    EXECUTE format(
      'CREATE CONSTRAINT TRIGGER %I AFTER %s ON %I.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_mutation_evidence(%L, %L, %L)',
      registration.table_name || '_' || operation_short || '_audit_evd',
      registration.sql_operation, registration.schema_name, registration.table_name,
      registration.entity_type, registration.tenant_mode, registration.commands
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION audit_schema.require_mutation_context() FROM PUBLIC;
REVOKE ALL ON FUNCTION audit_schema.verify_mutation_evidence() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION audit_schema.require_mutation_context(),
  audit_schema.verify_mutation_evidence() TO __OSSIE_RUNTIME_DB_ROLE__;

-- DOWN:

DO $$
DECLARE
  guarded_trigger RECORD;
BEGIN
  FOR guarded_trigger IN
    SELECT namespace.nspname AS schema_name, class.relname AS table_name, trigger.tgname AS trigger_name
    FROM pg_trigger trigger
    JOIN pg_class class ON class.oid = trigger.tgrelid
    JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
    JOIN pg_proc procedure ON procedure.oid = trigger.tgfoid
    JOIN pg_namespace procedure_namespace ON procedure_namespace.oid = procedure.pronamespace
    WHERE NOT trigger.tgisinternal
      AND procedure_namespace.nspname = 'audit_schema'
      AND procedure.proname IN ('require_mutation_context', 'verify_mutation_evidence')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', guarded_trigger.trigger_name, guarded_trigger.schema_name, guarded_trigger.table_name);
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS audit_schema.verify_mutation_evidence();
DROP FUNCTION IF EXISTS audit_schema.require_mutation_context();

CREATE OR REPLACE FUNCTION audit_schema.require_project_insert_context()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF COALESCE(current_setting('ossie.audit_event_id', true), '') = ''
    OR current_setting('ossie.audit_organization_id', true) IS DISTINCT FROM NEW.organization_id
    OR current_setting('ossie.audit_action', true) IS DISTINCT FROM 'project.created'
    OR current_setting('ossie.audit_command', true) IS DISTINCT FROM 'project.create'
  THEN
    RAISE EXCEPTION 'Project INSERT requires matching Audit context' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION audit_schema.verify_project_insert_evidence()
RETURNS TRIGGER AS $$
BEGIN
  IF audit_schema.is_maintenance_bypass(TG_RELID) THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM audit_schema.audit_event event
    JOIN audit_schema.audit_change_item item ON item.audit_event_id = event.id
    WHERE event.id = current_setting('ossie.audit_event_id', true)
      AND event.organization_id = NEW.organization_id
      AND item.entity_type = 'project' AND item.entity_id = NEW.id
      AND item.operation = 'create' AND item.field_name IS NULL
  ) THEN
    RAISE EXCEPTION 'Project INSERT requires matching committed Audit Evidence' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_insert_audit_context_guard
  BEFORE INSERT ON project_schema.project
  FOR EACH ROW EXECUTE FUNCTION audit_schema.require_project_insert_context();
CREATE CONSTRAINT TRIGGER project_insert_audit_evidence_guard
  AFTER INSERT ON project_schema.project DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION audit_schema.verify_project_insert_evidence();

GRANT EXECUTE ON FUNCTION audit_schema.require_project_insert_context(),
  audit_schema.verify_project_insert_evidence() TO __OSSIE_RUNTIME_DB_ROLE__;
