import { describe, expect, it } from "vitest";
import {
  ComplianceAuditEventDetailResponseSchema,
  ComplianceEventsResponseSchema,
} from "./compliance";

const common = {
  id: "01J00000000000000000000000",
  organization_id: "01J00000000000000000000001",
  project_id: null,
  root_resource_type: "organization",
  root_resource_id: "01J00000000000000000000001",
  action: "project.list_viewed",
  source_type: "web",
  actor_type: "org_user",
  actor_org_user_id: "01J00000000000000000000002",
  actor_label: "Synthetic owner",
  request_id: "request-1",
  occurred_at: "2026-07-19T12:00:00.000Z",
};

describe("compliance contracts", () => {
  it("parses a mixed bounded cursor page", () => {
    const response = {
      events: [
        {
          ...common,
          evidence_kind: "audit",
          outcome: "committed",
          correlation_id: null,
          idempotency_key_hash: null,
          before_row_version: null,
          after_row_version: null,
          reason: null,
          change_item_count: 1,
        },
        {
          ...common,
          id: "01J00000000000000000000003",
          evidence_kind: "access",
          outcome: "succeeded",
          http_method: "GET",
          route_template: "/api/v1/projects",
          access_surface: "portal",
          authorization_type: "organization_role",
          authorization_role: "owner",
          reason_code: null,
          response_bytes: null,
        },
      ],
      page: { next_cursor: null, has_more: false },
      totals: {
        audit_events: 1,
        audit_change_items: 1,
        access_events: 1,
        oldest_occurred_at: "2026-07-19T12:00:00.000Z",
        newest_occurred_at: "2026-07-19T12:00:00.000Z",
      },
    };

    expect(ComplianceEventsResponseSchema.parse(response)).toEqual(response);
  });

  it("uses a discriminated typed state instead of sparse SQL columns", () => {
    const response = {
      event: {
        ...common,
        evidence_kind: "audit",
        outcome: "committed",
        correlation_id: null,
        idempotency_key_hash: null,
        before_row_version: 1,
        after_row_version: 2,
        reason: null,
        change_item_count: 1,
        change_items: [
          {
            id: "01J00000000000000000000004",
            entity_type: "project",
            entity_id: common.root_resource_id,
            parent_entity_type: null,
            parent_entity_id: null,
            logical_key: null,
            operation: "update",
            field_name: "name",
            value_type: "text",
            before: { state: "redacted" },
            after: { state: "value", value_type: "text", value: "Safe name" },
          },
        ],
      },
    };

    expect(ComplianceAuditEventDetailResponseSchema.parse(response)).toEqual(
      response,
    );
    expect(() =>
      ComplianceAuditEventDetailResponseSchema.parse({
        event: {
          ...response.event,
          change_items: [
            {
              ...response.event.change_items[0],
              after: {
                state: "value",
                value_type: "text",
                before_text_value: "unsafe sparse column",
              },
            },
          ],
        },
      }),
    ).toThrow();
  });
});
