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

const table_definition = (sql: string, table_name: string) => {
  const escaped_table_name = table_name.replaceAll(".", "\\.");
  const match = sql.match(
    new RegExp(
      `CREATE TABLE IF NOT EXISTS ${escaped_table_name} \\(([\\s\\S]*?)\\n\\);`,
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
    expect(sql).not.toMatch(/GRANT[^;]*\bDELETE\b/iu);
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
    expect(sql).not.toMatch(/GRANT[^;]*\bDELETE\b/iu);
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
    expect(migration).toContain("GRANT SELECT, INSERT ON audit_schema.access_event");
    expect(migration).toContain("Refusing to remove populated Access Evidence");
    expect(migration).not.toMatch(/GRANT[^;]*\b(?:UPDATE|DELETE|TRUNCATE)\b/iu);
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
});
