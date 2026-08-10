/**
 * @fileoverview Project workspace page tests.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ProjectWorkspacePage } from "./ProjectWorkspacePage";
import type { Project } from "./types";

const project: Project = {
  id: "project_1",
  organization_id: "organization_1",
  name: "Internal onboarding demos",
  description: "Reusable captures and guides for internal teams.",
  slug: "internal-onboarding-demos",
  color: "#2563eb",
  icon: "folder",
  status: "active",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T10:00:00.000Z",
  updated_at: "2026-06-05T10:05:00.000Z",
  access: { role: "project_admin", source: "organization_owner" },
  default_project_version: {
    id: "version_1",
    name: "Main",
    slug: "main",
    status: "active",
    position: 1,
  },
};

const renderPage = (
  overrides: {
    projectId?: string;
    loadProject?: () => Promise<{ project: Project }>;
    currentPath?: string;
    performLogout?: () => Promise<void>;
    navigate?: (path: string) => void;
  } = {},
) => {
  const loadProject = overrides.loadProject ?? vi.fn(async () => ({ project }));

  render(
    <ProjectWorkspacePage
      projectId={overrides.projectId ?? "project_1"}
      loadProject={loadProject}
      currentPath={overrides.currentPath}
      performLogout={overrides.performLogout}
      navigate={overrides.navigate}
    />,
  );

  return { loadProject };
};

describe("ProjectWorkspacePage", () => {
  it("renders project details and workspace links", async () => {
    const { loadProject } = renderPage();

    expect(screen.getByText("Loading project...")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Projects", level: 1 }),
    ).toBeVisible();
    expect(screen.getByRole("status", { name: "Projects" })).toHaveTextContent(
      "Loading project...",
    );
    expect(
      await screen.findByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Reusable captures and guides for internal teams."),
    ).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(
      screen.getByText("Default Project Version: Main"),
    ).toBeInTheDocument();
    expect(screen.getByText("internal-onboarding-demos")).toBeInTheDocument();
    expect(screen.getByText(/Updated /)).toBeInTheDocument();
    expect(screen.getByText(/Created /)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open capture sessions" }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/capture-sessions",
    );
    expect(screen.getByRole("link", { name: "Open guides" })).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/guides",
    );
    expect(
      screen.getByRole("link", { name: "Open interactive demos" }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/interactive-demos",
    );
    expect(
      screen.getByRole("link", { name: "Project settings" }),
    ).toHaveAttribute("href", "/projects/project_1/settings");
    expect(loadProject).toHaveBeenCalledWith("project_1");
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
    expect(screen.queryByText("org_user_1")).not.toBeInTheDocument();
    expect(screen.queryByText("version")).not.toBeInTheDocument();
    expect(screen.queryByText("#2563eb")).not.toBeInTheDocument();
    expect(screen.queryByText("folder")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/documentation",
    );
    expect(screen.queryByText("Video")).not.toBeInTheDocument();
  });

  it("URL-encodes Project and Default Project Version identifiers in workspace links", async () => {
    renderPage({
      projectId: "project / 1",
      loadProject: async () => ({
        project: {
          ...project,
          id: "project / 1",
          default_project_version: {
            ...project.default_project_version,
            slug: "release / 1",
          },
        },
      }),
    });

    expect(
      await screen.findByRole("link", { name: "Open capture sessions" }),
    ).toHaveAttribute(
      "href",
      "/projects/project%20%2F%201/versions/release%20%2F%201/capture-sessions",
    );
    expect(screen.getByRole("link", { name: "Open guides" })).toHaveAttribute(
      "href",
      "/projects/project%20%2F%201/versions/release%20%2F%201/guides",
    );
    expect(
      screen.getByRole("link", { name: "Open interactive demos" }),
    ).toHaveAttribute(
      "href",
      "/projects/project%20%2F%201/versions/release%20%2F%201/interactive-demos",
    );
    expect(
      screen.getByRole("link", { name: "Project settings" }),
    ).toHaveAttribute("href", "/projects/project%20%2F%201/settings");
  });

  it("renders projects without optional description and slug", async () => {
    renderPage({
      loadProject: async () => ({
        project: {
          ...project,
          description: null,
          slug: null,
          color: null,
          icon: null,
        },
      }),
    });

    expect(
      await screen.findByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Reusable captures and guides for internal teams."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("internal-onboarding-demos"),
    ).not.toBeInTheDocument();
  });

  it("renders archived projects", async () => {
    renderPage({
      loadProject: async () => ({
        project: {
          ...project,
          status: "archived",
        },
      }),
    });

    expect(await screen.findByText("archived")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Project settings" }),
    ).toHaveAttribute("href", "/projects/project_1/settings");
  });

  it("does not crash on invalid project timestamps", async () => {
    renderPage({
      loadProject: async () => ({
        project: {
          ...project,
          created_at: "not a date",
          updated_at: "also not a date",
        },
      }),
    });

    expect(await screen.findByText("Updated Unknown")).toBeInTheDocument();
    expect(screen.getByText("Created Unknown")).toBeInTheDocument();
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <ProjectWorkspacePage
        projectId="project_1"
        currentPath="/projects/project_1?tab=overview"
        loadProject={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "unauthenticated",
            message: "Authentication is required",
          });
        }}
      />,
    );

    expect(
      await screen.findByText("Sign in to view this project."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Projects", level: 1 }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%3Ftab%3Doverview",
    );

    rerender(
      <ProjectWorkspacePage
        projectId="missing"
        currentPath="/projects/missing"
        loadProject={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            type: "project_not_found",
            message: "Project was not found",
          });
        }}
      />,
    );

    expect(
      await screen.findByText("Project was not found."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Projects", level: 1 }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "Projects" })).toBeInTheDocument();
  });

  it("signs out from the project workspace", async () => {
    const performLogout = vi.fn(async () => {});
    const navigate = vi.fn();

    renderPage({ performLogout, navigate });

    expect(
      await screen.findByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(performLogout).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("keeps workspace content visible when sign-out fails", async () => {
    renderPage({
      performLogout: async () => {
        throw new Error("Network failed");
      },
      navigate: vi.fn(),
    });

    expect(
      await screen.findByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText("Could not sign out.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
  });

  it("renders generic errors and supports retry", async () => {
    const loadProject = vi
      .fn<() => Promise<{ project: Project }>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ project });

    renderPage({ loadProject });

    expect(
      await screen.findByText("Could not load project."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Projects", level: 1 }),
    ).toBeVisible();
    expect(screen.getByRole("alert", { name: "Projects" })).toHaveTextContent(
      "Could not load project.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadProject).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
  });
});
