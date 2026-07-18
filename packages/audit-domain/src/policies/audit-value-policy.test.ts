import { describe, expect, it } from "vitest";
import {
  create_row_change,
  create_scalar_change,
  validate_audit_event,
} from "./audit-value-policy";

const base_event = () => ({
  id: "01J00000000000000000000000",
  organization_id: "01J00000000000000000000001",
  project_id: "01J00000000000000000000002",
  root_resource_type: "project",
  root_resource_id: "01J00000000000000000000002",
  action: "project.created",
  source_type: "web" as const,
  actor_type: "org_user" as const,
  actor_org_user_id: "01J00000000000000000000003",
  actor_label: "Owner User",
  request_id: "request-1",
  correlation_id: null,
  idempotency_key_hash: null,
  before_row_version: null,
  after_row_version: 1,
  outcome: "committed" as const,
  reason: null,
  occurred_at: "2026-07-19T00:00:00.000Z",
});

describe("audit value policy", () => {
  it("accepts a typed Project creation event", () => {
    const event = validate_audit_event({
      ...base_event(),
      items: [
        create_row_change({
          id: "01J00000000000000000000004",
          organization_id: "01J00000000000000000000001",
          audit_event_id: "01J00000000000000000000000",
          entity_type: "project",
          entity_id: "01J00000000000000000000002",
          operation: "create",
        }),
        create_scalar_change({
          id: "01J00000000000000000000005",
          organization_id: "01J00000000000000000000001",
          audit_event_id: "01J00000000000000000000000",
          entity_type: "project",
          entity_id: "01J00000000000000000000002",
          operation: "create",
          field_name: "name",
          value_type: "text",
          before: { state: "absent" },
          after: { state: "value", value: "Onboarding" },
        }),
      ],
    });

    expect(event.items).toHaveLength(2);
  });

  it("rejects mismatched scalar values without echoing the value", () => {
    expect(() => create_scalar_change({
      id: "01J00000000000000000000005",
      organization_id: "01J00000000000000000000001",
      audit_event_id: "01J00000000000000000000000",
      entity_type: "project",
      entity_id: "01J00000000000000000000002",
      operation: "create",
      field_name: "name",
      value_type: "integer",
      before: { state: "absent" },
      after: { state: "value", value: "secret-value" },
    })).toThrowError(/invalid_audit_value/);

    try {
      create_scalar_change({
        id: "01J00000000000000000000005",
        organization_id: "01J00000000000000000000001",
        audit_event_id: "01J00000000000000000000000",
        entity_type: "project",
        entity_id: "01J00000000000000000000002",
        operation: "create",
        field_name: "name",
        value_type: "integer",
        before: { state: "absent" },
        after: { state: "value", value: "secret-value" },
      });
    } catch (error) {
      expect(String(error)).not.toContain("secret-value");
    }
  });

  it("requires same-Organization items and a matching event id", () => {
    expect(() => validate_audit_event({
      ...base_event(),
      items: [create_row_change({
        id: "01J00000000000000000000004",
        organization_id: "01J00000000000000000000999",
        audit_event_id: "01J00000000000000000000998",
        entity_type: "project",
        entity_id: "01J00000000000000000000002",
        operation: "create",
      })],
    })).toThrowError(/invalid_audit_scope/);
  });

  it("rejects empty events and invalid actor identity combinations", () => {
    expect(() => validate_audit_event({ ...base_event(), items: [] })).toThrowError(/empty_audit_event/);
    expect(() => validate_audit_event({
      ...base_event(),
      actor_type: "system",
      items: [create_row_change({
        id: "01J00000000000000000000004",
        organization_id: "01J00000000000000000000001",
        audit_event_id: "01J00000000000000000000000",
        entity_type: "project",
        entity_id: "01J00000000000000000000002",
        operation: "create",
      })],
    })).toThrowError(/invalid_audit_actor/);
  });
});
