import { describe, expect, it } from "vitest";
import { ProjectActivityResponseSchema } from "./project-activity";

describe("project activity contracts", () => {
  it("parses only the curated activity projection", () => {
    const response = {
      events: [{
        id: "01J00000000000000000000001",
        project_id: "01J00000000000000000000002",
        category: "content",
        action: "guide.updated",
        summary: "Guide updated",
        actor_type: "org_user",
        actor_label: "Synthetic editor",
        source_type: "web",
        occurred_at: "2026-07-19T12:00:00.000Z",
        grouped_event_count: 1,
      }],
      page: { next_cursor: null, has_more: false },
    };

    expect(ProjectActivityResponseSchema.parse(response)).toEqual(response);
  });

  it("rejects raw evidence fields", () => {
    const result = ProjectActivityResponseSchema.safeParse({
      events: [{
        id: "01J00000000000000000000001",
        project_id: "01J00000000000000000000002",
        category: "content",
        action: "guide.updated",
        summary: "Guide updated",
        actor_type: "org_user",
        actor_label: "Synthetic editor",
        source_type: "web",
        occurred_at: "2026-07-19T12:00:00.000Z",
        grouped_event_count: 1,
        request_id: "must-not-escape",
      }],
      page: { next_cursor: null, has_more: false },
    });

    expect(result.success).toBe(false);
  });
});
