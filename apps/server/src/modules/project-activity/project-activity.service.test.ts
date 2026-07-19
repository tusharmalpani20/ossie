import { describe, expect, it, vi } from "vitest";
import { build_project_activity_service, InvalidProjectActivityCursorError } from "./project-activity.service";

describe("Project Activity service", () => {
  it("authorizes Editor Activity and returns a bounded cursor page", async () => {
    const authorize = vi.fn().mockResolvedValue({ role: "editor" });
    const list_events = vi.fn().mockResolvedValue({ events: [], has_more: false });
    const service = build_project_activity_service({ list_events }, { authorize });
    await expect(service.list({ auth: { organization_id: "org-1", actor_org_user_id: "editor-1" },
      project_id: "project-1", query: {} })).resolves.toEqual({
        events: [], page: { next_cursor: null, has_more: false },
      });
    expect(authorize).toHaveBeenCalledWith(expect.objectContaining({ capability: "project.activity.read" }));
  });

  it("rejects malformed cursors before querying evidence", async () => {
    const list_events = vi.fn();
    const service = build_project_activity_service({ list_events }, { authorize: vi.fn().mockResolvedValue({ role: "editor" }) });
    await expect(service.list({ auth: { organization_id: "org-1", actor_org_user_id: "editor-1" },
      project_id: "project-1", query: { cursor: "not valid!" } }))
      .rejects.toBeInstanceOf(InvalidProjectActivityCursorError);
    expect(list_events).not.toHaveBeenCalled();
  });
});
