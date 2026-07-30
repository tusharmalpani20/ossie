import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrations_dir = new URL("./migrations", import.meta.url);

const read_migrations = () => {
  return readdirSync(migrations_dir)
    .filter((file_name) => file_name.endsWith(".sql"))
    .sort()
    .map((file_name) =>
      readFileSync(join(migrations_dir.pathname, file_name), "utf8"),
    )
    .join("\n");
};

const approved_runtime_delete_grants = [
  "GRANT SELECT,INSERT,UPDATE,DELETE ON publish_schema.publish_link_entry TO __OSSIE_RUNTIME_DB_ROLE__;",
  `GRANT DELETE ON
  documentation_schema.documentation_page_keyword,
  documentation_schema.documentation_page_block,
  documentation_schema.documentation_list_item,
  documentation_schema.navigation_node,
  documentation_schema.documentation_redirect_rule,
  documentation_schema.openapi_operation,
  documentation_schema.documentation_draft_search_document
TO __OSSIE_RUNTIME_DB_ROLE__;`,
  `GRANT DELETE ON
  documentation_schema.documentation_snippet_block,
  documentation_schema.documentation_snippet_list_item,
  documentation_schema.documentation_snippet_table_row,
  documentation_schema.documentation_snippet_table_cell,
  documentation_schema.documentation_snippet_tab_item,
  documentation_schema.documentation_table_row,
  documentation_schema.documentation_table_cell,
  documentation_schema.documentation_tab_item
TO __OSSIE_RUNTIME_DB_ROLE__;`,
] as const;

const without_approved_runtime_delete_grants = (sql: string) =>
  approved_runtime_delete_grants.reduce(
    (remaining_sql, approved_grant) =>
      remaining_sql.replace(approved_grant, ""),
    sql,
  );

const table_definition = (sql: string, table_name: string) => {
  const escaped_table_name = table_name.replaceAll(".", "\\.");
  const match = sql.match(
    new RegExp(
      `CREATE TABLE (?:IF NOT EXISTS )?${escaped_table_name} \\(([\\s\\S]*?)\\n\\);`,
      "i",
    ),
  );
  return match?.[1] ?? "";
};

describe("foundation schema migrations", () => {
  it("defines typed relational append-only Audit Evidence without JSON", () => {
    const sql = read_migrations();
    const event = table_definition(sql, "audit_schema.audit_event");
    const item = table_definition(sql, "audit_schema.audit_change_item");

    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS audit_schema");
    expect(event).toContain("organization_id VARCHAR(26) NOT NULL");
    expect(event).toContain("actor_org_user_id VARCHAR(26) DEFAULT NULL");
    expect(event).toContain("before_row_version INTEGER DEFAULT NULL");
    expect(item).toContain("before_text_value VARCHAR(4000) DEFAULT NULL");
    expect(item).toContain("after_decimal_value NUMERIC DEFAULT NULL");
    expect(item).toContain("before_timestamp_value TIMESTAMPTZ DEFAULT NULL");
    expect(`${event}\n${item}`.toLowerCase()).not.toContain("json");
    expect(sql).toContain("project_insert_audit_context_guard");
    expect(sql).toContain("project_insert_audit_evidence_guard");
    expect(sql).toContain("ON DELETE RESTRICT");
    expect(sql).toContain("__OSSIE_RUNTIME_DB_ROLE__");
    expect(sql).toContain("__OSSIE_MAINTENANCE_DB_ROLE__");
    expect(sql).toContain("SELECT 1 FROM user_schema.user");
    expect(sql).toContain("pg_namespace");
    expect(sql).toContain("operation = 'create' AND before_state = 'absent'");
    expect(sql).toContain("GRANT SELECT ON ALL TABLES");
    expect(sql).not.toContain(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES",
    );
    expect(sql).toContain(
      "GRANT SELECT,INSERT,UPDATE,DELETE ON publish_schema.publish_link_entry TO __OSSIE_RUNTIME_DB_ROLE__;",
    );
    expect(sql).toContain(approved_runtime_delete_grants[1]);
    expect(without_approved_runtime_delete_grants(sql)).not.toMatch(
      /GRANT[^;]*\bDELETE\b/iu,
    );
  });

  it("installs generalized mutation guards for every runtime-writable product operation", () => {
    const sql = read_migrations();
    const migration = readFileSync(
      new URL(
        "./migrations/016_existing_mutation_audit_coverage.sql",
        import.meta.url,
      ),
      "utf8",
    );

    expect(migration).toContain("audit_schema.require_mutation_context");
    expect(migration).toContain("audit_schema.verify_mutation_evidence");
    expect(migration).toContain(
      "audit_schema.mutation_command_policy_is_valid",
    );
    expect(migration).toContain("ossie_audit_guard_context");
    expect(migration).toContain("ossie_audit_guard_evidence");
    expect(migration).toContain("public_publish_viewer_session");
    expect(migration).toContain("current_setting('ossie.audit_action', true)");
    expect(migration).toContain(
      "current_setting('ossie.audit_actor_type', true)",
    );
    expect(migration).toContain(
      "current_setting('ossie.audit_source_type', true)",
    );
    expect(migration).toContain(
      "DROP TRIGGER IF EXISTS project_insert_audit_context_guard",
    );
    expect(without_approved_runtime_delete_grants(sql)).not.toMatch(
      /GRANT[^;]*\bDELETE\b/iu,
    );
  });

  it("defines typed relational append-only Access Evidence", () => {
    const migration = readFileSync(
      new URL(
        "./migrations/017_access_evidence_and_compliance_timelines.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const event = table_definition(migration, "audit_schema.access_event");

    expect(event).toContain("organization_id VARCHAR(26) NOT NULL");
    expect(event).toContain("project_id VARCHAR(26) DEFAULT NULL");
    expect(event).toContain("route_template VARCHAR(255) DEFAULT NULL");
    expect(event).toContain("authorization_type VARCHAR(32) NOT NULL");
    expect(event).toContain("response_bytes BIGINT DEFAULT NULL");
    expect(event.toLowerCase()).not.toContain("json");
    expect(migration).toContain("access_event_append_only");
    expect(migration).toContain("access_event_no_truncate");
    expect(migration).toContain(
      "GRANT SELECT, INSERT ON audit_schema.access_event",
    );
    expect(migration).toContain("Refusing to remove populated Access Evidence");
    expect(migration).not.toMatch(/GRANT[^;]*\b(?:UPDATE|DELETE|TRUNCATE)\b/iu);

    const hardening = readFileSync(
      new URL(
        "./migrations/018_access_evidence_constraint_hardening.sql",
        import.meta.url,
      ),
      "utf8",
    );
    expect(hardening).toContain("chk_access_event_scoped_success");
    expect(hardening).toContain("root_resource_id IS NOT NULL");
  });

  it("defines tenant-safe guarded Project Membership persistence", () => {
    const migration = readFileSync(
      new URL(
        "./migrations/019_project_membership_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const membership = table_definition(
      migration,
      "project_schema.project_membership",
    );

    expect(membership).toContain("organization_id VARCHAR(26) NOT NULL");
    expect(membership).toContain("project_id VARCHAR(26) NOT NULL");
    expect(membership).toContain("org_user_id VARCHAR(26) NOT NULL");
    expect(membership).toContain("role VARCHAR(50) NOT NULL");
    expect(membership).toContain(
      "status VARCHAR(50) NOT NULL DEFAULT 'active'",
    );
    expect(membership).toContain("version INTEGER NOT NULL DEFAULT 1");
    expect(membership.toLowerCase()).not.toContain("json");
    expect(migration).toContain(
      "Refusing Project Membership migration while Projects exist",
    );
    expect(migration).toContain(
      "Refusing Project Membership migration with unsupported organization admin role",
    );
    expect(migration).toContain("project_membership_owner_guard");
    expect(migration).toContain("org_user_owner_membership_guard");
    expect(migration).toContain("project.membership.assign");
    expect(migration).toContain("project.membership.role_change");
    expect(migration).toContain("project.membership.remove");
    expect(migration).toContain(
      "GRANT SELECT, INSERT, UPDATE ON project_schema.project_membership",
    );
    expect(migration).toContain("authorization_type = 'project_role'");
    expect(migration).toContain("chk_access_event_scoped_success");
    expect(migration).toContain(
      "Refusing to remove populated Project Membership",
    );
    expect(migration).not.toMatch(/GRANT[^;]*\b(?:DELETE|TRUNCATE)\b/iu);
  });

  it("defines tenant-safe guarded Project Version persistence", () => {
    const migration = readFileSync(
      new URL(
        "./migrations/020_project_version_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const project_version = table_definition(
      migration,
      "project_schema.project_version",
    );
    const alias = table_definition(
      migration,
      "project_schema.project_version_alias",
    );

    expect(project_version).toContain("organization_id VARCHAR(26) NOT NULL");
    expect(project_version).toContain("project_id VARCHAR(26) NOT NULL");
    expect(project_version).toContain("slug VARCHAR(100) NOT NULL");
    expect(project_version).toContain("position INTEGER NOT NULL");
    expect(project_version).toContain("version INTEGER NOT NULL DEFAULT 1");
    expect(alias).toContain("project_version_id VARCHAR(26) NOT NULL");
    expect(`${project_version}\n${alias}`.toLowerCase()).not.toContain("json");
    expect(migration).toContain(
      "default_project_version_id VARCHAR(26) NOT NULL",
    );
    expect(migration).toContain("DEFERRABLE INITIALLY DEFERRED");
    expect(migration).toContain("project_version_slug_namespace_guard");
    expect(migration).toContain("project_version_mutation_command_guard");
    expect(migration).toContain("project_version_alias_provenance_guard");
    expect(migration).toContain("project_version_legacy_content_guard");
    expect(migration).toContain("project_version.set_default");
    expect(migration).toContain(
      "GRANT SELECT, INSERT, UPDATE ON project_schema.project_version",
    );
    expect(migration).toContain(
      "GRANT SELECT, INSERT ON project_schema.project_version_alias",
    );
    expect(migration).toContain(
      "Refusing Project Version migration while Projects exist",
    );
    expect(migration).toContain(
      "Refusing to remove populated Project Version foundation",
    );
    expect(migration).not.toMatch(/GRANT[^;]*\b(?:DELETE|TRUNCATE)\b/iu);
  });

  it("keeps the maintenance reset explicit instead of cascading to unknown tables", () => {
    const reset_source = readFileSync(
      new URL("../test-support/database.ts", import.meta.url),
      "utf8",
    );
    expect(reset_source).not.toContain("RESTART IDENTITY CASCADE");
  });

  it("define the accepted user organization auth session and project foundation", () => {
    const sql = read_migrations();

    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS user_schema");
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS organization_schema");
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS auth_schema");
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS project_schema");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS user_schema.user");
    expect(table_definition(sql, "user_schema.user")).not.toContain(
      "organization_id",
    );

    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS organization_schema.organization",
    );
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS organization_schema.org_user",
    );
    expect(sql).toContain("role VARCHAR(50) NOT NULL");

    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS auth_schema.auth_session",
    );
    expect(sql).toContain("org_user_id");
    expect(sql).toContain("token_hash TEXT NOT NULL");
    expect(sql).not.toContain("jwt_token");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS project_schema.project");
    expect(sql).toContain(
      "created_by_id VARCHAR(26) NOT NULL REFERENCES organization_schema.org_user(id)",
    );
  });

  it("defines the guide artifact schema separately from capture source material", () => {
    const sql = read_migrations();

    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS guide_schema");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS guide_schema.guide");
    expect(sql).toContain(
      "CREATE TABLE IF NOT EXISTS guide_schema.guide_block",
    );
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS guide_schema.guide_step");
    expect(table_definition(sql, "guide_schema.guide")).toContain(
      "source_capture_session_id VARCHAR(26) DEFAULT NULL",
    );
    expect(table_definition(sql, "guide_schema.guide_block")).toContain(
      "block_index INTEGER NOT NULL",
    );
    expect(sql).toContain("ALTER TABLE guide_schema.guide_block");
    expect(sql).toContain(
      "ADD COLUMN IF NOT EXISTS content JSONB DEFAULT NULL",
    );
    expect(sql).toContain(
      "ADD COLUMN IF NOT EXISTS selected_capture_asset_id VARCHAR(26) DEFAULT NULL REFERENCES capture_schema.capture_asset(id)",
    );
    expect(sql).toContain(
      "ADD COLUMN IF NOT EXISTS screenshot_hidden BOOLEAN NOT NULL DEFAULT FALSE",
    );
    expect(table_definition(sql, "guide_schema.guide_block")).toContain(
      "CONSTRAINT chk_guide_block_type CHECK (block_type IN ('step', 'header', 'paragraph', 'tip', 'alert', 'capture', 'divider', 'gif'))",
    );
    expect(table_definition(sql, "guide_schema.guide_step")).toContain(
      "guide_block_id VARCHAR(26) NOT NULL",
    );
    expect(sql).toContain("uq_guide_block_guide_index_active");
    expect(sql).toContain("uq_guide_step_block_active");
  });

  it("replaces Guide and Demo roots with relational Edition and Working Draft ownership", () => {
    const migration = readFileSync(
      new URL(
        "./migrations/022_guide_demo_edition_working_draft_relational_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    );

    const guide_edition = table_definition(
      migration,
      "guide_schema.guide_edition",
    );
    const guide_draft = table_definition(
      migration,
      "guide_schema.guide_working_draft",
    );
    const annotation = table_definition(
      migration,
      "guide_schema.guide_annotation",
    );
    const demo_edition = table_definition(
      migration,
      "interactive_demo_schema.interactive_demo_edition",
    );
    const demo_draft = table_definition(
      migration,
      "interactive_demo_schema.interactive_demo_working_draft",
    );
    const transition = table_definition(
      migration,
      "interactive_demo_schema.demo_transition",
    );
    const up = migration.split("-- DOWN:")[0] ?? migration;

    expect(migration).toContain(
      "Refusing Guide/Demo relational migration while authored or published rows exist",
    );
    expect(guide_edition).toContain("project_version_id VARCHAR(26) NOT NULL");
    expect(guide_draft).toContain(
      "guide_edition_id VARCHAR(26) NOT NULL UNIQUE",
    );
    expect(annotation).toContain("guide_working_draft_id VARCHAR(26) NOT NULL");
    expect(demo_edition).toContain("project_version_id VARCHAR(26) NOT NULL");
    expect(demo_draft).toContain(
      "interactive_demo_edition_id VARCHAR(26) NOT NULL UNIQUE",
    );
    expect(transition).toContain("demo_hotspot_id VARCHAR(26) NOT NULL");
    expect(migration).toContain("guide_edition_exactly_one_working_draft");
    expect(migration).toContain(
      "interactive_demo_edition_exactly_one_working_draft",
    );
    expect(migration).toContain("artifact_edition_mutation_command_guard");
    expect(migration).toContain("guide_working_draft_id VARCHAR(26) NOT NULL");
    expect(migration).toContain(
      "interactive_demo_working_draft_id VARCHAR(26) NOT NULL",
    );
    expect(up).not.toContain("content JSONB");
    expect(up).not.toContain("target_scene_id VARCHAR(26) DEFAULT NULL");
    expect(migration).toContain(
      "Refusing to remove populated Guide/Demo relational foundation",
    );
  });

  it("adds immutable Revisions, atomic Carry-Forward, and protected Asset lifecycle", () => {
    const migration = readFileSync(
      new URL(
        "./migrations/023_guide_demo_revision_carry_forward_protected_assets.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const up = migration.split("-- DOWN:")[0] ?? migration;
    const down = migration.split("-- DOWN:")[1] ?? "";

    for (const table of [
      "guide_schema.guide_revision",
      "guide_schema.guide_revision_block",
      "guide_schema.guide_revision_step",
      "guide_schema.guide_revision_annotation",
      "interactive_demo_schema.interactive_demo_revision",
      "interactive_demo_schema.demo_revision_scene",
      "interactive_demo_schema.demo_revision_hotspot",
      "interactive_demo_schema.demo_revision_transition",
      "project_schema.artifact_carry_forward",
      "project_schema.artifact_carry_forward_item",
      "guide_schema.guide_carry_forward_item",
      "interactive_demo_schema.interactive_demo_carry_forward_item",
      "capture_schema.capture_asset_purge_operation",
      "publish_schema.published_artifact_capture_asset",
    ]) {
      expect(up).toContain(`CREATE TABLE ${table}`);
    }
    expect(up).toContain("source_guide_revision_id");
    expect(up).toContain("source_interactive_demo_revision_id");
    expect(up).toContain("CAPTURE ASSET lifecycle".toLowerCase());
    expect(up).toContain("status VARCHAR(50) NOT NULL DEFAULT 'active'");
    expect(up).toContain("artifact_carry_forward_exactly_one_detail");
    expect(up).toContain("expected_artifact_id");
    expect(up).toContain("capture_asset_purge_version_guard");
    expect(up).toContain("uq_published_artifact_scope");
    expect(up).toContain(
      "FOREIGN KEY (published_artifact_id, project_id, organization_id)",
    );
    expect(up).toContain(
      "REVOKE ALL ON FUNCTION audit_schema.mutation_command_policy_is_valid(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC",
    );
    expect(up).toContain("prevent_immutable_revision_mutation");
    expect(up).not.toContain("snapshot_json JSON");
    expect(migration).toContain(
      "Refusing to remove populated Revision and protected Asset foundation",
    );
    expect(down).toContain("capture_asset.delete");
    expect(down).toContain(
      "guide.step.update,guide.blocks.reorder,guide.block.create",
    );
    expect(down).toContain(
      "interactive_demo.scene.create,interactive_demo.scene.update",
    );
    expect(down).not.toContain("guide.revision.restore");
    expect(down).not.toContain("artifact.carry_forward");
  });

  it("replaces publish snapshots with Revision-backed Publications and manifests", () => {
    const migration = readFileSync(
      new URL(
        "./migrations/024_revision_backed_publication_and_publish_link_manifests.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const up = migration.split("-- DOWN:")[0] ?? migration;
    const down = migration.split("-- DOWN:")[1] ?? "";

    expect(up).toContain("CREATE TABLE publish_schema.published_artifact");
    expect(up).toContain("publication_sequence INTEGER NOT NULL");
    expect(up).toContain("guide_revision_id VARCHAR(26)");
    expect(up).toContain("interactive_demo_revision_id VARCHAR(26)");
    expect(up).toContain("CREATE TABLE publish_schema.publish_link_entry");
    expect(up).toContain("publish_link_manifest_guard");
    expect(up).toContain("prevent_published_artifact_mutation");
    expect(up).toContain("publish_link_entry_d_audit_ctx");
    expect(up).toContain("publish.guide");
    expect(up).toContain("interactive_demo.publish_link.entry_rolled_back");
    expect(up).not.toContain("snapshot_json JSON");
    expect(up).not.toContain("version_number INTEGER");
    expect(up).not.toContain("published_artifact_capture_asset (");
    expect(down).toContain(
      "Refusing to roll back populated Revision-backed Publication schema",
    );
    expect(down).toContain("snapshot_json JSONB NOT NULL");
    expect(
      down.indexOf("DROP TABLE publish_schema.publish_link_entry"),
    ).toBeLessThan(
      down.indexOf(
        "DROP FUNCTION audit_schema.verify_delete_mutation_evidence",
      ),
    );
  });

  it("adds relational Documentation authoring, immutable Site snapshots, and family-safe links", () => {
    const migration = readFileSync(
      new URL(
        "./migrations/025_documentation_site_first_vertical_slice.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const up = migration.split("-- DOWN:")[0] ?? migration;
    const down = migration.split("-- DOWN:")[1] ?? "";

    for (const table of [
      "documentation_schema.documentation_site",
      "documentation_schema.site_edition",
      "documentation_schema.site_working_draft",
      "documentation_schema.documentation_page",
      "documentation_schema.documentation_page_block",
      "documentation_schema.navigation_node",
      "documentation_schema.page_slug_alias",
      "documentation_schema.documentation_redirect_rule",
      "documentation_schema.openapi_source",
      "documentation_schema.openapi_operation",
      "documentation_schema.comment_thread",
      "documentation_schema.comment_reply",
      "documentation_schema.comment_mention",
      "documentation_schema.site_revision",
      "documentation_schema.site_revision_page",
      "publish_schema.site_publication",
      "publish_schema.site_publication_search_document",
    ]) {
      expect(up).toContain(`CREATE TABLE ${table}`);
    }
    expect(up).toContain(
      "resource_family VARCHAR(50) NOT NULL DEFAULT 'artifact'",
    );
    expect(up).toContain("documentation_site_id VARCHAR(26) DEFAULT NULL");
    expect(up).toContain("site_publication_id VARCHAR(26) DEFAULT NULL");
    expect(up).toContain("prevent_immutable_documentation_mutation");
    expect(up).toContain("comments are intentionally excluded");
    for (const authoritative_table of [
      "documentation_schema.documentation_site",
      "documentation_schema.site_edition",
      "documentation_schema.site_working_draft",
      "documentation_schema.documentation_page",
      "documentation_schema.documentation_page_block",
      "documentation_schema.navigation_node",
      "documentation_schema.page_slug_alias",
      "documentation_schema.documentation_redirect_rule",
      "documentation_schema.openapi_source",
      "documentation_schema.openapi_operation",
      "documentation_schema.comment_thread",
      "documentation_schema.comment_reply",
      "documentation_schema.comment_mention",
      "documentation_schema.site_revision",
      "documentation_schema.site_revision_page",
      "publish_schema.site_publication",
      "publish_schema.site_publication_search_document",
    ]) {
      expect(
        table_definition(up, authoritative_table).toLowerCase(),
      ).not.toContain("jsonb");
    }
    expect(
      table_definition(up, "documentation_schema.openapi_inspection"),
    ).toContain("parsed_document JSONB NOT NULL");
    expect(
      table_definition(
        up,
        "documentation_schema.documentation_command_receipt",
      ),
    ).toContain("response_body JSONB NOT NULL");
    expect(down).toContain(
      "Refusing to roll back populated Documentation first vertical slice",
    );
  });

  it("adds relational Documentation snippets, typed content children, and frozen dependencies", () => {
    const migration = readFileSync(
      new URL(
        "./migrations/026_documentation_content_snippets_and_asset_workflows.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const up = migration.split("-- DOWN:")[0] ?? migration;
    const down = migration.split("-- DOWN:")[1] ?? "";

    for (const table of [
      "documentation_schema.documentation_snippet",
      "documentation_schema.documentation_snippet_block",
      "documentation_schema.documentation_snippet_list_item",
      "documentation_schema.documentation_table_row",
      "documentation_schema.documentation_table_cell",
      "documentation_schema.documentation_tab_item",
      "documentation_schema.documentation_snippet_table_row",
      "documentation_schema.documentation_snippet_table_cell",
      "documentation_schema.documentation_snippet_tab_item",
      "documentation_schema.site_revision_snippet",
      "documentation_schema.site_revision_snippet_block",
      "documentation_schema.site_revision_snippet_list_item",
      "documentation_schema.site_revision_snippet_table_row",
      "documentation_schema.site_revision_snippet_table_cell",
      "documentation_schema.site_revision_snippet_tab_item",
      "documentation_schema.site_revision_page_table_row",
      "documentation_schema.site_revision_page_table_cell",
      "documentation_schema.site_revision_page_tab_item",
      "documentation_schema.site_revision_artifact_reference",
    ])
      expect(up).toContain(`CREATE TABLE ${table}`);

    const snippet = table_definition(
      up,
      "documentation_schema.documentation_snippet",
    );
    expect(snippet).toContain("site_edition_id VARCHAR(26) NOT NULL");
    expect(snippet).toContain("site_working_draft_id VARCHAR(26) NOT NULL");
    expect(snippet).toContain("status VARCHAR(20) NOT NULL DEFAULT 'active'");
    expect(snippet).toContain("version INTEGER NOT NULL DEFAULT 1");
    expect(snippet.toLowerCase()).not.toContain("json");

    expect(up).toContain("source_kind VARCHAR(30) NOT NULL");
    expect(up).toContain("linked_source_block_id VARCHAR(26) DEFAULT NULL");
    expect(up).toContain("published_artifact_id VARCHAR(26)");
    expect(up).toContain("capture_asset_id VARCHAR(26)");
    expect(up).toContain("prevent_immutable_documentation_mutation");
    expect(up).toContain("'site_revision_artifact_reference'");
    expect(up).toContain(
      "UNIQUE (site_revision_id, source_kind, source_asset_id)",
    );
    for (const constraint of [
      "fk_documentation_page_block_linked_page",
      "fk_documentation_page_block_documentation_asset",
      "fk_documentation_page_block_openapi_source",
      "fk_documentation_snippet_block_linked_page",
      "fk_documentation_snippet_block_linked_heading",
      "fk_documentation_snippet_block_documentation_asset",
      "fk_documentation_snippet_block_openapi_source",
    ])
      expect(up).toContain(constraint);
    expect(up).toContain("BEFORE TRUNCATE ON documentation_schema.");
    expect(up).toContain("site_publication_no_truncate");
    expect(down).toContain(
      "Refusing to roll back populated Documentation content workflows",
    );
  });

  it("adds actor-bound import provenance and exact immutable OpenAPI source snapshots", () => {
    const migration = readFileSync(
      new URL(
        "./migrations/027_documentation_import_export_portability.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const up = migration.split("-- DOWN:")[0] ?? migration;
    const down = migration.split("-- DOWN:")[1] ?? "";
    const inspection = table_definition(
      up,
      "documentation_schema.documentation_import_inspection",
    );
    const application = table_definition(
      up,
      "documentation_schema.documentation_import_application",
    );
    const revision_source = table_definition(
      up,
      "documentation_schema.site_revision_openapi_source",
    );

    expect(inspection).toContain("created_by_id VARCHAR(26) NOT NULL");
    expect(inspection).toContain(
      "status VARCHAR(20) NOT NULL DEFAULT 'ready'",
    );
    expect(inspection).toContain("safe_report JSONB DEFAULT NULL");
    expect(inspection).toContain("octet_length(safe_report::TEXT)");
    expect(application).toContain("inspection_id VARCHAR(26) NOT NULL");
    expect(application).toContain("pages_count INTEGER NOT NULL");
    expect(application.toLowerCase()).not.toContain("json");
    expect(revision_source).toContain("file_id VARCHAR(26) NOT NULL");
    expect(revision_source).toContain("digest VARCHAR(64) NOT NULL");
    expect(up).toContain("ALTER COLUMN parsed_document DROP NOT NULL");
    expect(up).toContain("documentation_import_inspection_transition_guard");
    expect(up).toContain("site_revision_openapi_source_immutable");
    expect(up).toContain("site_revision_openapi_source_no_truncate");
    expect(up).toContain("documentation_import_application_immutable");
    expect(up).toContain("documentation_import_application_no_truncate");
    expect(up).toContain("documentation.import.inspect");
    expect(up).toContain("documentation.site_package_import.apply");
    expect(down).toContain(
      "Refusing to roll back populated Documentation portability",
    );
  });
});
