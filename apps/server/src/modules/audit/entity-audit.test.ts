import { describe, expect, it } from "vitest";
import { build_entity_audit_event } from "./entity-audit";

describe("entity Audit evidence builder", () => {
  it("records safe fields while retaining only a redacted marker for content", () => {
    const event = build_entity_audit_event({
      id: "01J00000000000000000000000",
      organization_id: "01J00000000000000000000001",
      project_id: "01J00000000000000000000002",
      root_resource_type: "interactive_demo",
      root_resource_id: "01J00000000000000000000003",
      action: "interactive_demo.hotspot.created",
      actor_org_user_id: "01J00000000000000000000004",
      actor_label: "Owner",
      source_type: "web",
      occurred_at: "2026-07-19T00:00:00.000Z",
      before_row_version: 1,
      after_row_version: 1,
      changes: [
        {
          entity_type: "demo_hotspot",
          entity_id: "01J00000000000000000000005",
          parent_entity_type: "demo_scene",
          parent_entity_id: "01J00000000000000000000006",
          before: null,
          after: { label: "Continue", content: "private walkthrough text" },
          safe_fields: { label: "text" },
          redacted_fields: ["content"],
        },
      ],
    });

    expect(event!.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ operation: "create", field_name: null }),
        expect.objectContaining({
          field_name: "label",
          after: { state: "value", value: "Continue" },
        }),
        expect.objectContaining({
          field_name: "content",
          after: { state: "redacted" },
        }),
      ]),
    );
    expect(JSON.stringify(event)).not.toContain("private walkthrough text");
  });

  it("returns null for a true no-op", () => {
    expect(
      build_entity_audit_event({
        id: "01J00000000000000000000000",
        organization_id: "01J00000000000000000000001",
        project_id: null,
        root_resource_type: "organization",
        root_resource_id: "01J00000000000000000000001",
        action: "organization.updated",
        actor_org_user_id: "01J00000000000000000000004",
        actor_label: "Owner",
        source_type: "web",
        occurred_at: "2026-07-19T00:00:00.000Z",
        before_row_version: null,
        after_row_version: null,
        changes: [],
      }),
    ).toBeNull();
  });

  it("keeps null redacted fields null instead of claiming secret content is present", () => {
    const event = build_entity_audit_event({
      id: "01J00000000000000000000000",
      organization_id: "01J00000000000000000000001",
      project_id: null,
      root_resource_type: "auth_session",
      root_resource_id: "01J00000000000000000000002",
      action: "authentication.session.created",
      actor_org_user_id: "01J00000000000000000000003",
      actor_label: "Owner",
      source_type: "web",
      occurred_at: "2026-07-19T00:00:00.000Z",
      before_row_version: null,
      after_row_version: null,
      changes: [
        {
          entity_type: "auth_session",
          entity_id: "01J00000000000000000000002",
          parent_entity_type: "org_user",
          parent_entity_id: "01J00000000000000000000003",
          before: null,
          after: { token_hash: null },
          redacted_fields: ["token_hash"],
        },
      ],
    });

    expect(event!.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "token_hash",
          before: { state: "absent" },
          after: { state: "null" },
        }),
      ]),
    );
  });
});
