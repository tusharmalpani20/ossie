import { describe, expect, it } from "vitest";
import { AUDIT_COVERAGE_REGISTRY } from "./audit-coverage-registry";

describe("audit coverage registry", () => {
  it("registers only Project INSERT in child 112", () => {
    expect(AUDIT_COVERAGE_REGISTRY).toEqual([
      {
        table: "project_schema.project",
        operation: "INSERT",
        command: "project.create",
        route: "POST /api/v1/projects",
        context_guard: "project_insert_audit_context_guard",
        deferred_guard: "project_insert_audit_evidence_guard",
      },
    ]);
  });
});
