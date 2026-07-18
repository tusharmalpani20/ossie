import { describe, expect, it } from "vitest";
import { validate_audit_mutation_context } from "./audit-context";

describe("Audit mutation context", () => {
  it("accepts bounded scalar context", () => {
    expect(
      validate_audit_mutation_context({
        event_id: "01J00000000000000000000000",
        organization_id: "01J00000000000000000000001",
        action: "project.created",
        command: "project.create",
        actor_type: "org_user",
        source_type: "web",
      }),
    ).toEqual({
      event_id: "01J00000000000000000000000",
      organization_id: "01J00000000000000000000001",
      action: "project.created",
      command: "project.create",
      actor_type: "org_user",
      source_type: "web",
    });
  });

  it("rejects malformed context before a business write", () => {
    expect(() =>
      validate_audit_mutation_context({
        event_id: "x".repeat(27),
        organization_id: "01J00000000000000000000001",
        action: "project.created",
        command: "project.create",
        actor_type: "org_user",
        source_type: "web",
      }),
    ).toThrow(/invalid_audit_mutation_context/);
    expect(() =>
      validate_audit_mutation_context({
        event_id: "01J00000000000000000000000",
        organization_id: "01J00000000000000000000001",
        action: "project.created\nforged",
        command: "project.create",
        actor_type: "org_user",
        source_type: "web",
      }),
    ).toThrow(/invalid_audit_mutation_context/);
  });
});
