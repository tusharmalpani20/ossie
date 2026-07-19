import { describe, expect, it } from "vitest";
import { build_project_membership_event } from "./project-membership.audit";

const membership = {
  id: "01J00000000000000000000001", organization_id: "01J00000000000000000000002",
  project_id: "01J00000000000000000000003", org_user_id: "01J00000000000000000000004",
  role: "editor" as const, status: "active" as const, version: 1,
  created_by_id: "01J00000000000000000000005", updated_by_id: "01J00000000000000000000005",
  revoked_by_id: null, revoked_at: null, created_at: "2026-07-19T00:00:00.000Z",
  updated_at: "2026-07-19T00:00:00.000Z",
};

describe("Project Membership Audit adapter", () => {
  it("emits explicit row and safe scalar changes for assignment", () => {
    const event = build_project_membership_event({
      event_id: "01J00000000000000000000000", command: "project.membership.assign",
      before: null, after: membership, actor_org_user_id: membership.created_by_id,
      actor_label: "Synthetic admin", request_id: "request-1",
      occurred_at: "2026-07-19T00:00:00.000Z",
    });
    expect(event.action).toBe("project.membership.assigned");
    expect(event.root_resource_id).toBe(membership.project_id);
    expect(event.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ entity_type: "project_membership", operation: "create", field_name: null }),
      expect.objectContaining({ field_name: "role", after: { state: "value", value: "editor" } }),
      expect.objectContaining({ field_name: "status", after: { state: "value", value: "active" } }),
      expect.objectContaining({ field_name: "version", after: { state: "value", value: 1 } }),
    ]));
    expect(JSON.stringify(event)).not.toContain("email");
  });

  it("emits revocation lifecycle changes without deleting the row", () => {
    const after = { ...membership, status: "revoked" as const, version: 2,
      revoked_by_id: membership.created_by_id, revoked_at: "2026-07-19T00:01:00.000Z" };
    const event = build_project_membership_event({
      event_id: "01J00000000000000000000000", command: "project.membership.remove",
      before: membership, after, actor_org_user_id: membership.created_by_id,
      actor_label: "Synthetic admin", request_id: null,
      occurred_at: "2026-07-19T00:01:00.000Z",
    });
    expect(event.action).toBe("project.membership.removed");
    expect(event.items.every((item) => item.operation === "update")).toBe(true);
  });
});
