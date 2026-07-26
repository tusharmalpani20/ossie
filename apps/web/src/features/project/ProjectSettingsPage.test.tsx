/**
 * @fileoverview Project settings page tests.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ProjectSettingsPage } from "./ProjectSettingsPage";
import type { Project, UpdateProjectInput } from "./types";

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
    loadProject?: (projectId: string) => Promise<{ project: Project }>;
    updateProject?: (
      projectId: string,
      input: UpdateProjectInput,
    ) => Promise<{ project: Project }>;
    currentPath?: string;
    performLogout?: () => Promise<void>;
    navigate?: (path: string) => void;
  } = {},
) => {
  const loadProject = overrides.loadProject ?? vi.fn(async () => ({ project }));
  const updateProject =
    overrides.updateProject ??
    vi.fn(async (_projectId: string, input: UpdateProjectInput) => ({
      project: {
        ...project,
        ...input,
        version: project.version + 1,
        updated_at: "2026-06-05T10:10:00.000Z",
      },
    }));

  render(
    <ProjectSettingsPage
      projectId={overrides.projectId ?? "project_1"}
      loadProject={loadProject}
      updateProject={updateProject}
      currentPath={overrides.currentPath}
      performLogout={overrides.performLogout}
      navigate={overrides.navigate}
    />,
  );

  return { loadProject, updateProject };
};

describe("ProjectSettingsPage", () => {
  it("loads project settings and links back to the workspace", async () => {
    const { loadProject } = renderPage();

    expect(screen.getByText("Loading project settings...")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Project settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Internal onboarding demos"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        "Reusable captures and guides for internal teams.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("internal-onboarding-demos"),
    ).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to workspace" }),
    ).toHaveAttribute("href", "/projects/project_1/versions/main");
    expect(loadProject).toHaveBeenCalledWith("project_1");
  });

  it("saves project detail changes and resets the dirty state", async () => {
    const updateProject = vi.fn(
      async (_projectId: string, input: UpdateProjectInput) => ({
        project: {
          ...project,
          ...input,
          version: 2,
          updated_at: "2026-06-05T10:10:00.000Z",
        },
      }),
    );
    renderPage({ updateProject });

    fireEvent.change(await screen.findByLabelText("Project name"), {
      target: { value: "Internal training demos" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(updateProject).toHaveBeenCalledWith("project_1", {
        name: "Internal training demos",
        description: null,
        slug: null,
      }),
    );
    expect(
      await screen.findByText("Project settings saved."),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Internal training demos"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("validates project name before saving", async () => {
    const { updateProject } = renderPage();

    fireEvent.change(await screen.findByLabelText("Project name"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Project name is required."),
    ).toBeInTheDocument();
    expect(updateProject).not.toHaveBeenCalled();
  });

  it("archives and unarchives a project", async () => {
    const updateProject = vi
      .fn<
        (
          projectId: string,
          input: UpdateProjectInput,
        ) => Promise<{ project: Project }>
      >()
      .mockImplementationOnce(async () => ({
        project: {
          ...project,
          status: "archived",
          version: 2,
          updated_at: "2026-06-05T10:10:00.000Z",
        },
      }))
      .mockImplementationOnce(async () => ({
        project: {
          ...project,
          status: "active",
          version: 3,
          updated_at: "2026-06-05T10:15:00.000Z",
        },
      }));
    renderPage({ updateProject });

    fireEvent.click(
      await screen.findByRole("button", { name: "Archive project" }),
    );

    await waitFor(() =>
      expect(updateProject).toHaveBeenCalledWith("project_1", {
        status: "archived",
      }),
    );
    expect(await screen.findByText("Project archived.")).toBeInTheDocument();
    expect(screen.getByText("archived")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restore project" }));

    await waitFor(() =>
      expect(updateProject).toHaveBeenLastCalledWith("project_1", {
        status: "active",
      }),
    );
    expect(await screen.findByText("Project restored.")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("keeps settings visible when update fails", async () => {
    renderPage({
      updateProject: async () => {
        throw new ApiClientError({
          kind: "validation",
          status: 409,
          type: "project_slug_conflict",
          message: "A project with this slug already exists",
        });
      },
    });

    fireEvent.change(await screen.findByLabelText("Slug"), {
      target: { value: "duplicate-slug" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("A project with this slug already exists."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Project settings" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("duplicate-slug")).toBeInTheDocument();
  });

  it("renders unauthenticated not-found and retry states", async () => {
    const { rerender } = render(
      <ProjectSettingsPage
        projectId="project_1"
        currentPath="/projects/project_1/settings"
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
      await screen.findByText("Sign in to manage this project."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fsettings",
    );

    rerender(
      <ProjectSettingsPage
        projectId="missing"
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

    const loadProject = vi
      .fn<() => Promise<{ project: Project }>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ project });
    rerender(
      <ProjectSettingsPage projectId="project_1" loadProject={loadProject} />,
    );

    expect(
      await screen.findByText("Could not load project settings."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadProject).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole("heading", { name: "Project settings" }),
    ).toBeInTheDocument();
  });

  it("signs out from project settings", async () => {
    const performLogout = vi.fn(async () => {});
    const navigate = vi.fn();

    renderPage({ performLogout, navigate });

    expect(
      await screen.findByRole("heading", { name: "Project settings" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(performLogout).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith("/login");
  });
});
