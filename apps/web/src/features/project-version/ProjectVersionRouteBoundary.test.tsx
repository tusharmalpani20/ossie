/**
 * @fileoverview Project Version route boundary tests.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
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
  description: "A calm place for product knowledge.",
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
  it("uses the established sign-in screen when Version context is unauthenticated", async () => {
    window.history.pushState(
      {},
      "",
      "/projects/project_1/versions/summer-release?tab=overview",
    );
    const navigate = vi.fn();
    api.getProject.mockRejectedValue(
      new ApiClientError({
        kind: "unauthenticated",
        status: 401,
        type: "authentication_required",
        message: "Authentication required",
      }),
    );

    render(
      <ProjectVersionRouteBoundary
        projectId="project_1"
        versionSlug="summer-release"
        allowVersionOwnedContent
        activeSection="capture_sessions"
        currentLabel="Capture Session"
        navigate={navigate}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Welcome back to Ossie" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Sign in to view this Project Version.",
      }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "/login?next=%2Fprojects%2Fproject_1%2Fversions%2Fsummer-release%3Ftab%3Doverview",
      ),
    );
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });

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

  it("presents the default Version as a task-focused project home", async () => {
    const navigate = vi.fn();
    render(
      <ProjectVersionRouteBoundary
        projectId="project_1"
        versionSlug="main"
        navigate={navigate}
      />,
    );

    const allProjects = await screen.findByRole("link", {
      name: "All projects",
    });
    expect(allProjects).toHaveAttribute("href", "/projects");
    fireEvent.click(allProjects);
    expect(navigate).toHaveBeenCalledWith("/projects");
    expect(
      screen.getByRole("heading", { name: "Ossie", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Project identity")).toHaveTextContent("O");
    expect(
      screen.getByText("A calm place for product knowledge."),
    ).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("Default version")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Start a capture", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start a capture" }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/capture-sessions",
    );
    expect(
      screen.getByRole("heading", {
        name: "Quick access",
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open guides" })).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/guides",
    );
    expect(
      screen.getByRole("button", { name: "More version actions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open carry forward edits" }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/carry-forward",
    );
    expect(
      screen.queryByText("Build from your captures"),
    ).not.toBeInTheDocument();
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

  it("keeps list route family when the boundary selector changes Project Versions", async () => {
    const navigate = vi.fn();
    api.listProjectVersions.mockResolvedValue({
      project_versions: [
        version,
        { ...version, id: "version_2", name: "Q3", slug: "q3", position: 2 },
      ],
    });

    render(
      <ProjectVersionRouteBoundary
        projectId="project_1"
        versionSlug="main"
        allowVersionOwnedContent
        activeSection="guides"
        currentLabel="Guides"
        navigate={navigate}
      >
        {() => <h1>Project Version guides</h1>}
      </ProjectVersionRouteBoundary>,
    );

    await screen.findByRole("heading", { name: "Project Version guides" });
    fireEvent.change(screen.getByLabelText("Project Version"), {
      target: { value: "q3" },
    });

    expect(navigate).toHaveBeenCalledWith(
      "/projects/project_1/versions/q3/guides",
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
      await screen.findByRole("link", { name: "Start a capture" }),
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
      screen.getByRole("link", { name: "Open carry forward edits" }),
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
      screen.queryByRole("link", { name: "Open carry forward edits" }),
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
    await screen.findByRole("heading", { name: "Start a capture" });
    expect(
      screen.queryByRole("link", { name: "Open carry forward edits" }),
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
