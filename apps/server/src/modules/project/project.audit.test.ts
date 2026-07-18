import { describe, expect, it } from "vitest";
import {
  build_project_created_event,
  build_project_deleted_event,
  build_project_updated_event,
} from "./project.audit";
import type { Project } from "./project.service";

const project: Project = {
  id: "01J00000000000000000000002",
  organization_id: "01J00000000000000000000001",
  name: "Onboarding",
  description: null,
  slug: null,
  color: "#2563eb",
  icon: null,
  status: "active",
  created_by_id: "01J00000000000000000000003",
  updated_by_id: "01J00000000000000000000003",
  version: 1,
  created_at: "2026-07-19T00:00:00.000Z",
  updated_at: "2026-07-19T00:00:00.000Z",
};

describe("Project Audit adapter", () => {
  it("builds one row marker, allowlisted scalars, and a redacted metadata marker", () => {
    const event = build_project_created_event({
      event_id: "01J00000000000000000000000",
      project,
      actor_org_user_id: "01J00000000000000000000003",
      actor_label: "Owner User",
      request_id: "request-1",
      metadata_was_present: true,
      occurred_at: "2026-07-19T00:00:00.000Z",
    });
    expect(event.items.filter((item) => item.field_name === null)).toHaveLength(
      1,
    );
    expect(event.items.map((item) => item.field_name)).toEqual(
      expect.arrayContaining([
        null,
        "name",
        "description",
        "slug",
        "color",
        "icon",
        "status",
        "metadata",
      ]),
    );
    expect(
      event.items.find((item) => item.field_name === "metadata")?.after,
    ).toEqual({ state: "redacted" });
    expect(JSON.stringify(event)).not.toContain("metadata-value");
  });

  it("emits only persisted Project field changes and a root Row Version envelope", () => {
    const after = { ...project, name: "Updated", version: 2 };
    const event = build_project_updated_event({
      event_id: "01J00000000000000000000000",
      before: project,
      after,
      actor_org_user_id: project.updated_by_id,
      actor_label: "Owner User",
      request_id: null,
      occurred_at: "2026-07-19T00:00:00.000Z",
      metadata_changed: false,
    });
    expect(event.before_row_version).toBe(1);
    expect(event.after_row_version).toBe(2);
    expect(event.items).toEqual([
      expect.objectContaining({
        field_name: "name",
        before: { state: "value", value: "Onboarding" },
        after: { state: "value", value: "Updated" },
      }),
    ]);
  });

  it("uses delete evidence for a Project soft deletion", () => {
    const event = build_project_deleted_event({
      event_id: "01J00000000000000000000000",
      before: project,
      after: { ...project, version: 2 },
      actor_org_user_id: project.updated_by_id,
      actor_label: "Owner User",
      request_id: null,
      occurred_at: "2026-07-19T00:00:00.000Z",
    });
    expect(event.items).toEqual([
      expect.objectContaining({ field_name: null, operation: "delete" }),
    ]);
  });
});
