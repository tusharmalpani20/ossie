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
});
