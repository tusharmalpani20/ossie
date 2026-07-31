import { describe, expect, it } from "vitest";
import {
  validate_audit_coverage,
  type AuditCommandCoverage,
} from "./audit-coverage";

describe("audit coverage", () => {
  const registration: AuditCommandCoverage = {
    command: "project.create",
    action: "project.created",
    routes: ["POST /api/v1/projects"],
    source_types: ["web"] as const,
    actor_types: ["org_user"] as const,
    writes: [{
      table: "project_schema.project",
      sql_operation: "INSERT" as const,
      evidence_operations: ["create"] as const,
      entity_type: "project",
    }],
  };

  it("accepts multiple commands sharing a table operation and multi-table commands", () => {
    const update: AuditCommandCoverage = {
      ...registration,
      command: "project.update",
      action: "project.updated",
      routes: ["PATCH /api/v1/projects/:id"],
      writes: [{
        table: "project_schema.project",
        entity_type: "project",
        sql_operation: "UPDATE" as const,
        evidence_operations: ["update"] as const,
      }],
    };
    const setup: AuditCommandCoverage = {
      ...registration,
      command: "setup.complete_first_run",
      action: "setup.owner_bootstrapped",
      routes: ["POST /api/v1/setup/first-run"],
      writes: [
        {
          table: "user_schema.user",
          sql_operation: "INSERT" as const,
          evidence_operations: ["create"] as const,
          entity_type: "user",
        },
        {
          table: "organization_schema.organization",
          sql_operation: "INSERT" as const,
          evidence_operations: ["create"] as const,
          entity_type: "organization",
        },
      ],
    };

    expect(validate_audit_coverage([registration, update, setup])).toHaveLength(3);
  });

  it("rejects duplicate commands while allowing repeated table operations", () => {
    expect(() => validate_audit_coverage([registration, { ...registration }]))
      .toThrowError(/duplicate_audit_coverage/);
    expect(() => validate_audit_coverage([
      registration,
      { ...registration, command: "project.create.other", action: "project.other_created" },
    ])).not.toThrow();
  });

  it.each([
    { ...registration, command: "Project Create" },
    { ...registration, action: "project create" },
    { ...registration, routes: ["projects"] },
    { ...registration, writes: [] },
    { ...registration, actor_types: [] },
    { ...registration, source_types: [] },
    { ...registration, writes: [{ ...registration.writes[0], table: "project" }] },
    { ...registration, writes: [{ ...registration.writes[0], evidence_operations: [] }] },
    {
      ...registration,
      writes: [{
        ...registration.writes[0],
        sql_operation: "UPDATE" as const,
        evidence_operations: ["create"] as const,
      }],
    },
  ])("rejects malformed command coverage", (input) => {
    expect(() => validate_audit_coverage([input as AuditCommandCoverage]))
      .toThrowError(/invalid_audit_coverage/);
  });

  it("allows an internal entry point to omit routes", () => {
    expect(validate_audit_coverage([{
      ...registration,
      command: "authentication.session.touch",
      action: "authentication.session.activity_recorded",
      routes: [],
      writes: [{
        table: "auth_schema.auth_session",
        sql_operation: "UPDATE",
        evidence_operations: ["update"],
        entity_type: "auth_session",
      }],
    }])).toHaveLength(1);
  });

  it("allows explicitly audit-only derived work without product-table guards", () => {
    expect(
      validate_audit_coverage([
        {
          ...registration,
          command: "documentation.projection_rebuild.draft",
          action: "documentation.projection.draft_search_rebuilt",
          writes: [],
          audit_only: true,
        },
      ]),
    ).toHaveLength(1);
  });
});
