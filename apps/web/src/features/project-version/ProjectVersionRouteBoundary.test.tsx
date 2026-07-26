import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectVersionRouteBoundary } from "./ProjectVersionRouteBoundary";

const api = vi.hoisted(() => ({
  getProject: vi.fn(),
  resolveProjectVersion: vi.fn(),
  listProjectVersions: vi.fn(),
}));
vi.mock("../../lib/api", async (original) => ({
  ...(await original()),
  ...api,
}));
const version = {
  id: "version_1",
  organization_id: "org_1",
  project_id: "project_1",
  name: "Main",
  description: null,
  slug: "main",
  release_date: null,
  position: 1,
  status: "active",
  is_default: true,
  version: 1,
  created_by_id: "actor_1",
  updated_by_id: "actor_1",
  created_at: "2026-07-19T00:00:00.000Z",
  updated_at: "2026-07-19T00:00:00.000Z",
  aliases: [],
};
const project = {
  id: "project_1",
  name: "Ossie",
  status: "active",
  access: { role: "project_admin" },
  default_project_version: version,
};
beforeEach(() => {
  api.getProject.mockResolvedValue({ project });
  api.resolveProjectVersion.mockResolvedValue({
    project_version: version,
    resolution: "canonical",
  });
  api.listProjectVersions.mockResolvedValue({ project_versions: [version] });
});

describe("ProjectVersionRouteBoundary", () => {
  it("renders current legacy content only for the active Default Version", async () => {
    render(
      <ProjectVersionRouteBoundary projectId="project_1" versionSlug="main">
        {() => <h1>Default content</h1>}
      </ProjectVersionRouteBoundary>,
    );
    expect(
      await screen.findByRole("heading", { name: "Default content" }),
    ).toBeInTheDocument();
  });

  it("lets nested Project Version list routes own the active shell section", async () => {
    render(
      <ProjectVersionRouteBoundary
        projectId="project_1"
        versionSlug="main"
        allowVersionOwnedContent
        activeSection="guides"
        currentLabel="Guides"
      >
        {() => <h1>Project Version guides</h1>}
      </ProjectVersionRouteBoundary>,
    );

    expect(
      await screen.findByRole("heading", { name: "Project Version guides" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Guides" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("links a non-default Version to its scoped authored content and Carry-Forward", async () => {
    api.resolveProjectVersion.mockResolvedValue({
      project_version: {
        ...version,
        id: "version_2",
        slug: "q3",
        name: "Q3",
        is_default: false,
      },
      resolution: "canonical",
    });
    render(
      <ProjectVersionRouteBoundary projectId="project_1" versionSlug="q3">
        {() => <h1>Legacy content</h1>}
      </ProjectVersionRouteBoundary>,
    );
    expect(
      await screen.findByRole("link", { name: "Open capture sessions" }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/versions/q3/capture-sessions",
    );
    expect(
      screen.getByText(
        /Guides and Interactive Demos belong to this Project Version/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Legacy content" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open guides" })).toHaveAttribute(
      "href",
      "/projects/project_1/versions/q3/guides",
    );
    expect(
      screen.getByRole("link", { name: "Open interactive demos" }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/versions/q3/interactive-demos",
    );
    expect(
      screen.getByRole("link", { name: "Open carry forward editions" }),
    ).toHaveAttribute("href", "/projects/project_1/versions/q3/carry-forward");
  });

  it("renders Version-owned Capture content for an archived Version in read-only mode", async () => {
    api.resolveProjectVersion.mockResolvedValue({
      project_version: { ...version, status: "archived" },
      resolution: "canonical",
    });
    render(
      <ProjectVersionRouteBoundary
        projectId="project_1"
        versionSlug="main"
        allowVersionOwnedContent
      >
        {() => <h1>Archived captures</h1>}
      </ProjectVersionRouteBoundary>,
    );
    expect(
      await screen.findByRole("heading", { name: "Archived captures" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Archived Project Version/i)).toBeInTheDocument();
  });

  it("hides Carry-Forward when the target Version is archived or the member is a Viewer", async () => {
    api.resolveProjectVersion.mockResolvedValue({
      project_version: { ...version, status: "archived" },
      resolution: "canonical",
    });
    const { unmount } = render(
      <ProjectVersionRouteBoundary projectId="project_1" versionSlug="main" />,
    );
    await screen.findByText(/Archived Project Version/i);
    expect(
      screen.queryByRole("link", { name: "Open carry forward editions" }),
    ).not.toBeInTheDocument();
    unmount();

    api.resolveProjectVersion.mockResolvedValue({
      project_version: version,
      resolution: "canonical",
    });
    api.getProject.mockResolvedValue({
      project: { ...project, access: { role: "viewer" } },
    });
    render(
      <ProjectVersionRouteBoundary projectId="project_1" versionSlug="main" />,
    );
    await screen.findByRole("heading", { name: "Main" });
    expect(
      screen.queryByRole("link", { name: "Open carry forward editions" }),
    ).not.toBeInTheDocument();
  });

  it("canonicalizes an alias without accepting an external redirect", async () => {
    const replace = vi.fn();
    api.resolveProjectVersion.mockResolvedValue({
      project_version: version,
      resolution: "alias",
    });
    window.history.pushState(
      {},
      "",
      "/projects/project_1/versions/old/guides?tab=1#step",
    );
    render(
      <ProjectVersionRouteBoundary
        projectId="project_1"
        versionSlug="old"
        replace={replace}
      />,
    );
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/projects/project_1/versions/main/guides?tab=1#step",
      ),
    );
  });
});
