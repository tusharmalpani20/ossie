import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AUDIT_COMMANDS,
  AUDIT_COVERAGE_REGISTRY,
  find_audit_command,
} from "./audit-coverage-registry";

describe("audit coverage registry", () => {
  it("registers every current semantic mutation command", () => {
    expect(AUDIT_COVERAGE_REGISTRY).toHaveLength(53);
    expect(
      new Set(AUDIT_COVERAGE_REGISTRY.map(({ command }) => command)).size,
    ).toBe(53);
    expect(AUDIT_COMMANDS).toContain("setup.complete_first_run");
    expect(AUDIT_COMMANDS).toContain("guide.block.screenshot_upload");
    expect(AUDIT_COMMANDS).toContain("publish.viewer_session.touch");
  });

  it("covers all 19 product tables and the 34 runtime table-operation classes", () => {
    const writes = AUDIT_COVERAGE_REGISTRY.flatMap(({ writes }) => writes);
    expect(new Set(writes.map(({ table }) => table)).size).toBe(19);
    expect(
      new Set(
        writes.map(({ table, sql_operation }) => `${table}:${sql_operation}`),
      ).size,
    ).toBe(34);
    expect(
      writes.every(({ sql_operation }) => sql_operation !== "DELETE"),
    ).toBe(true);
  });

  it("keeps public viewer maintenance system-only and normal commands org-user-only", () => {
    expect(find_audit_command("publish.viewer_session.create")).toMatchObject({
      actor_types: ["system"],
      source_types: ["system"],
    });
    expect(find_audit_command("project.create")).toMatchObject({
      actor_types: ["org_user"],
    });
    expect(() => find_audit_command("missing.command")).toThrowError(
      /unknown_audit_command/,
    );
  });

  it("allows persisted import provenance for every Capture-owned command", () => {
    const capture_commands = AUDIT_COVERAGE_REGISTRY.filter(({ command }) =>
      command.startsWith("capture_"),
    );

    expect(capture_commands).not.toHaveLength(0);
    expect(
      capture_commands.every(({ source_types }) =>
        source_types.includes("import"),
      ),
    ).toBe(true);
    expect(
      find_audit_command("guide.block.screenshot_upload").source_types,
    ).toContain("import");
  });

  it("models status and revocation timestamp changes as updates, not row deletion", () => {
    for (const command of [
      "authentication.session.revoke",
      "organization.invite.revoke",
      "publish.guide_link.revoke",
      "publish.interactive_demo_link.revoke",
      "publish.guide_link.password_update",
      "publish.interactive_demo_link.password_update",
    ]) {
      expect(
        find_audit_command(command).writes.every(({ evidence_operations }) =>
          evidence_operations.includes("update"),
        ),
      ).toBe(true);
    }
  });

  it("declares every table touched by multi-table atomic commands", () => {
    expect(
      find_audit_command("setup.complete_first_run").writes.map(
        ({ table }) => table,
      ),
    ).toEqual([
      "user_schema.user",
      "organization_schema.organization",
      "organization_schema.org_user",
      "auth_schema.auth_session",
    ]);
    expect(
      find_audit_command("guide.block.screenshot_upload").writes.map(
        ({ table }) => table,
      ),
    ).toEqual(
      expect.arrayContaining([
        "file_schema.file",
        "capture_schema.capture_asset",
        "guide_schema.guide_block",
        "guide_schema.guide",
      ]),
    );
  });

  it("keeps the database command/action policy synchronized with the registry", () => {
    const migration = readFileSync(
      new URL(
        "../../db/migrations/016_existing_mutation_audit_coverage.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const policy_start = migration.indexOf("FROM (VALUES");
    const policy_end = migration.indexOf(") AS policy(command, action)");
    const policy = migration.slice(policy_start, policy_end);
    const pairs = [...policy.matchAll(/\('([^']+)', '([^']+)'\)/gu)].map(
      ([, command, action]) => ({ command, action }),
    );

    expect(pairs).toEqual(
      AUDIT_COVERAGE_REGISTRY.map(({ command, action }) => ({
        command,
        action,
      })),
    );
  });

  it("keeps migration trigger command arguments synchronized with registry order", () => {
    const migration = readFileSync(
      new URL(
        "../../db/migrations/016_existing_mutation_audit_coverage.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const expected = new Map<string, string[]>();
    for (const registration of AUDIT_COVERAGE_REGISTRY) {
      for (const write of registration.writes) {
        const key = `${write.table}:${write.sql_operation}`;
        const commands = expected.get(key) ?? [];
        if (!commands.includes(registration.command))
          commands.push(registration.command);
        expected.set(key, commands);
      }
    }
    const rows = [
      ...migration.matchAll(
        /\('([^']+)', '([^']+)', '(INSERT|UPDATE)', '[^']+', '[^']+', '([^']+)'\)/gu,
      ),
    ];
    const actual = new Map(
      rows.map(([, schema, table, operation, commands]) => [
        `${schema}.${table}:${operation}`,
        commands!.split(","),
      ]),
    );

    expect(actual).toEqual(expected);
  });
});
