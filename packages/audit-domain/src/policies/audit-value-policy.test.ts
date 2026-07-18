import { describe, expect, it } from "vitest";
import {
  create_row_change,
  create_scalar_change,
  validate_audit_event,
} from "./audit-value-policy";
import type { AuditEvent } from "../types/audit-evidence";

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

  it("rejects invalid runtime literals, digests, Row Version order, and timestamps", () => {
    const item = create_row_change({
      id: "01J00000000000000000000004",
      organization_id: "01J00000000000000000000001",
      audit_event_id: "01J00000000000000000000000",
      entity_type: "project",
      entity_id: "01J00000000000000000000002",
      operation: "create",
    });
    const invalid = (overrides: Record<string, unknown>) => ({
      ...base_event(),
      items: [item],
      ...overrides,
    }) as unknown as AuditEvent;

    expect(() => validate_audit_event(invalid({ source_type: "browser" })))
      .toThrowError(/invalid_audit_source/);
    expect(() => validate_audit_event(invalid({ actor_type: "service", actor_org_user_id: null })))
      .toThrowError(/invalid_audit_actor/);
    expect(() => validate_audit_event(invalid({ outcome: "failed" })))
      .toThrowError(/invalid_audit_outcome/);
    expect(() => validate_audit_event(invalid({ idempotency_key_hash: "raw-key" })))
      .toThrowError(/invalid_audit_idempotency_hash/);
    expect(() => validate_audit_event(invalid({ before_row_version: 2, after_row_version: 1 })))
      .toThrowError(/invalid_audit_row_version/);
    expect(() => validate_audit_event(invalid({ occurred_at: "2026-07-19" })))
      .toThrowError(/invalid_audit_timestamp/);
  });

  it("rejects malformed item shapes and operation-state transitions", () => {
    expect(() => create_scalar_change({
      id: "01J00000000000000000000005",
      organization_id: "01J00000000000000000000001",
      audit_event_id: "01J00000000000000000000000",
      entity_type: "project",
      entity_id: "01J00000000000000000000002",
      operation: "create",
      field_name: "name",
      value_type: "text",
      before: { state: "value", value: "old" },
      after: { state: "value", value: "new" },
    })).toThrowError(/invalid_audit_transition/);

    const malformed_item = {
      ...create_row_change({
        id: "01J00000000000000000000004",
        organization_id: "01J00000000000000000000001",
        audit_event_id: "01J00000000000000000000000",
        entity_type: "project",
        entity_id: "01J00000000000000000000002",
        operation: "create",
      }),
      parent_entity_type: "organization",
      parent_entity_id: null,
    };
    expect(() => validate_audit_event({
      ...base_event(),
      items: [malformed_item],
    })).toThrowError(/invalid_audit_item/);
  });
});
