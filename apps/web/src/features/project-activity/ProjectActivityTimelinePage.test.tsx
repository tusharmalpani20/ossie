import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectActivityTimelinePage } from "./ProjectActivityTimelinePage";

const api = vi.hoisted(() => ({ getProject: vi.fn() }));

vi.mock("../../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/api")>()),
  getProject: api.getProject,
}));

const project = {
  id: "project-1",
  organization_id: "organization-1",
  name: "Test",
  description: null,
  slug: "test",
  color: null,
  icon: null,
  status: "active" as const,
  created_by_id: "user-1",
  updated_by_id: "user-1",
  version: 1,
  created_at: "2026-07-19T00:00:00.000Z",
  updated_at: "2026-07-19T00:00:00.000Z",
  access: {
    role: "project_admin" as const,
    source: "project_membership" as const,
  },
  default_project_version: {
    id: "version-1",
    project_id: "project-1",
    name: "Main",
    slug: "main",
    status: "active" as const,
    is_default: true,
    position: 0,
    description: null,
    release_date: null,
    created_at: "2026-07-19T00:00:00.000Z",
    updated_at: "2026-07-19T00:00:00.000Z",
  },
};

describe("ProjectActivityTimelinePage", () => {
  it("presents curated Project activity without the shell breadcrumb", async () => {
    api.getProject.mockResolvedValue({ project });
    render(
      <ProjectActivityTimelinePage
        projectId="project-1"
        loadActivity={vi.fn().mockResolvedValue({
          events: [
            {
              id: "event-1",
              project_id: "project-1",
              category: "content",
              action: "guide.updated",
              summary: "Guide updated",
              actor_type: "org_user",
              actor_label: "Editor",
              source_type: "web",
              occurred_at: "2026-07-19T00:00:00.000Z",
              grouped_event_count: 2,
            },
          ],
          page: { next_cursor: null, has_more: false },
        })}
      />,
    );

    expect(await screen.findByText("Guide updated")).toBeInTheDocument();
    expect(screen.getByText("2 grouped events")).toBeInTheDocument();
    expect(screen.queryByText(/authorization/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Breadcrumb" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Review important changes across this Project."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "Project activity" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Performed by" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("project-1")).not.toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Project settings" }),
    ).toHaveAttribute("href", "/projects/project-1/settings");
    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute(
      "href",
      "/projects/project-1/versions/main/documentation",
    );
  });
});
