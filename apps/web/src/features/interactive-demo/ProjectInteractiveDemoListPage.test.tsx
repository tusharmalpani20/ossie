import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectInteractiveDemoListPage } from "./ProjectInteractiveDemoListPage";

const now = "2026-07-19T10:00:00.000Z";
describe("ProjectInteractiveDemoListPage", () => {
  it("renders Edition summaries for the selected Project Version", async () => {
    const loadDemos = vi.fn().mockResolvedValue({ interactive_demo_editions: [{
      artifact: { id: "demo_1", organization_id: "org_1", project_id: "project_1", created_by_id: "user_1", created_at: now },
      edition: { id: "edition_1", organization_id: "org_1", project_id: "project_1", interactive_demo_id: "demo_1", project_version_id: "version_2", source_capture_session_id: null, title: "Named Demo", description: null, status: "draft", created_by_id: "user_1", updated_by_id: "user_1", version: 1, created_at: now, updated_at: now },
      authored_updated_at: now,
    }] });
    render(<ProjectInteractiveDemoListPage projectId="project_1" projectVersionId="version_2" versionSlug="q3" loadDemos={loadDemos} />);
    expect(await screen.findByText("Named Demo")).toBeInTheDocument();
    expect(loadDemos).toHaveBeenCalledWith("project_1");
    expect(screen.getByRole("link", { name: /open demo/i })).toHaveAttribute("href", "/projects/project_1/versions/q3/interactive-demos/demo_1");
  });
});
