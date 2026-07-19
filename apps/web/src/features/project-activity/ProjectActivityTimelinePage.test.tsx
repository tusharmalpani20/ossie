import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectActivityTimelinePage } from "./ProjectActivityTimelinePage";

describe("ProjectActivityTimelinePage", () => {
  it("renders only the curated Project activity fields", async () => {
    render(<ProjectActivityTimelinePage projectId="project-1" loadActivity={vi.fn().mockResolvedValue({
      events: [{ id: "event-1", project_id: "project-1", category: "content", action: "guide.updated", summary: "Guide updated", actor_type: "org_user", actor_label: "Editor", source_type: "web", occurred_at: "2026-07-19T00:00:00.000Z", grouped_event_count: 2 }],
      page: { next_cursor: null, has_more: false },
    })} />);
    expect(await screen.findByText("Guide updated")).toBeInTheDocument();
    expect(screen.getByText("2 grouped events")).toBeInTheDocument();
    expect(screen.queryByText(/authorization/i)).not.toBeInTheDocument();
  });
});
