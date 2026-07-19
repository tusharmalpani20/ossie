import { describe, expect, it, vi } from "vitest";
import { build_project_activity_repository, PROJECT_ACTIVITY_ACTIONS } from "./project-activity.repository";

describe("Project Activity repository", () => {
  it("curates all Project Version lifecycle actions as Project activity", () => {
    expect(PROJECT_ACTIVITY_ACTIONS).toEqual(expect.arrayContaining([
      "project_version.created", "project_version.updated", "project_version.reordered",
      "project_version.archived", "project_version.restored", "project_version.default_set",
    ]));
  });
  it("queries only the curated Audit allowlist in the requested tenant and Project", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: "event-1", project_id: "project-1", action: "guide.updated", actor_type: "org_user", actor_label: "Editor", source_type: "web", occurred_at: new Date("2026-07-19T00:00:00.000Z") }] });
    const result = await build_project_activity_repository({ query }).list_events({ organization_id: "org-1", project_id: "project-1", cursor: null, limit: 20 });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("FROM audit_schema.audit_event"), ["org-1", "project-1", PROJECT_ACTIVITY_ACTIONS, null, null, 21]);
    expect(result.events[0]).toMatchObject({ category: "content", summary: "Guide updated", grouped_event_count: 1 });
    expect(JSON.stringify(result)).not.toContain("authorization");
  });
});
