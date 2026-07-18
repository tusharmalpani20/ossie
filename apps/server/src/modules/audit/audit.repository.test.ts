import {
  create_row_change,
  create_scalar_change,
  type AuditEvent,
} from "@repo/audit-domain";
import { describe, expect, it, vi } from "vitest";
import { write_audit_event } from "./audit.repository";

const event = (): AuditEvent => ({
  id: "01J00000000000000000000000",
  organization_id: "01J00000000000000000000001",
  project_id: "01J00000000000000000000002",
  root_resource_type: "project",
  root_resource_id: "01J00000000000000000000002",
  action: "project.created",
  source_type: "web",
  actor_type: "org_user",
  actor_org_user_id: "01J00000000000000000000003",
  actor_label: "Owner User",
  request_id: "request-1",
  correlation_id: null,
  idempotency_key_hash: null,
  before_row_version: null,
  after_row_version: 1,
  outcome: "committed",
  reason: null,
  occurred_at: "2026-07-19T00:00:00.000Z",
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

describe("audit repository", () => {
  it("writes one event and its typed items without serialized payloads", async () => {
    const calls: Array<{ sql: string; values?: unknown[] }> = [];
    const client = {
      query: vi.fn(async (sql: string, values?: unknown[]) => {
        calls.push({ sql, values });
        return { rows: [] };
      }),
    };
    await write_audit_event(client, event());
    expect(calls).toHaveLength(3);
    expect(calls[0]?.sql).toContain("INSERT INTO audit_schema.audit_event");
    expect(calls[2]?.sql).toContain("after_text_value");
    expect(calls[2]?.values).toContain("Onboarding");
    expect(calls.every(({ sql }) => !/json|payload|metadata/iu.test(sql))).toBe(
      true,
    );
  });

  it("replaces database failures with a stable non-sensitive error", async () => {
    const client = {
      query: vi.fn(async () => {
        throw new Error("database rejected secret-value");
      }),
    };
    await expect(write_audit_event(client, event()))
      .rejects.toThrow(/^audit_persistence_failed$/u);
    try {
      await write_audit_event(client, event());
    } catch (error) {
      expect(String(error)).not.toContain("secret-value");
    }
  });
});
