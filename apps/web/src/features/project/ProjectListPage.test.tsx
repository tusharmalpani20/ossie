/**
 * @fileoverview Project list page tests.
 */

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ProjectListPage } from "./ProjectListPage";
import type { Project } from "./types";

const authResponse = {
  auth: {
    user: {
      id: "user_1",
      email: "jane@example.com",
      display_name: "Jane Member",
    },
    organization: { id: "organization_1", name: "Ossie Labs" },
    org_user: { id: "org_user_1", role: "owner" as const },
    session: {
      id: "session_1",
      session_type: "browser",
      expires_at: "2026-09-01T10:00:00.000Z",
    },
  },
};

const projects: Project[] = [
  {
    id: "project_2",
    organization_id: "organization_1",
    name: "Archived onboarding demos",
    description: null,
    slug: null,
    color: "#2563eb",
    icon: "folder",
    status: "archived",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 2,
    created_at: "2026-06-05T09:00:00.000Z",
    updated_at: "2026-06-05T09:30:00.000Z",
    access: { role: "project_admin", source: "organization_owner" },
    default_project_version: {
      id: "version_2",
      name: "Main",
      slug: "main",
      status: "active",
      position: 1,
    },
  },
  {
    id: "project_1",
    organization_id: "organization_1",
    name: "Internal onboarding demos",
    description: "Reusable captures and guides for internal teams.",
    slug: "internal-onboarding-demos",
    color: "#0f766e",
    icon: "sparkles",
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
  },
];

const renderPage = (
  overrides: {
    loadProjects?: () => Promise<{ projects: Project[] }>;
    createProject?: (input: {
      name: string;
      description?: string | null;
      slug?: string | null;
    }) => Promise<{ project: Project }>;
    currentPath?: string;
    performLogout?: () => Promise<void>;
    navigate?: (path: string) => void;
    loadAuth?: () => Promise<typeof authResponse>;
  } = {},
) => {
  const loadProjects =
    overrides.loadProjects ?? vi.fn(async () => ({ projects }));
  const createProject =
    overrides.createProject ?? vi.fn(async () => ({ project: projects[1]! }));

  render(
    <ProjectListPage
      loadProjects={loadProjects}
      createProject={createProject}
      currentPath={overrides.currentPath}
      performLogout={overrides.performLogout}
      navigate={overrides.navigate}
      loadAuth={overrides.loadAuth ?? vi.fn(async () => authResponse)}
    />,
  );

  return { loadProjects, createProject };
};

describe("ProjectListPage", () => {
  it("renders projects in response order with workspace links", async () => {
    const { loadProjects } = renderPage();

    expect(screen.getByText("Loading projects...")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();

    const rows = screen.getAllByRole("article");
    expect(
      within(rows[0]!).getByRole("heading", {
        name: "Archived onboarding demos",
      }),
    ).toBeInTheDocument();
    expect(
      within(rows[1]!).getByRole("heading", {
        name: "Internal onboarding demos",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("archived")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(
      screen.getByText("Reusable captures and guides for internal teams."),
    ).toBeInTheDocument();
    expect(screen.getByText("internal-onboarding-demos")).toBeInTheDocument();
    expect(screen.getAllByText(/Updated /).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Created /).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", {
        name: "Open project Internal onboarding demos",
      }),
    ).toHaveAttribute("href", "/projects/project_1/versions/main");
    expect(
      screen.getByRole("button", { name: "Open account menu for Jane Member" }),
    ).toBeInTheDocument();
    expect(loadProjects).toHaveBeenCalledWith({ status: "active" });
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
    expect(screen.queryByText("org_user_1")).not.toBeInTheDocument();
    expect(screen.queryByText("version")).not.toBeInTheDocument();
    expect(screen.queryByText("#0f766e")).not.toBeInTheDocument();
    expect(screen.queryByText("sparkles")).not.toBeInTheDocument();
  });

  it("URL-encodes project IDs in workspace links", async () => {
    renderPage({
      loadProjects: async () => ({
        projects: [
          {
            ...projects[0]!,
            id: "project / 1",
            name: "Encoded project",
          },
        ],
      }),
    });

    expect(
      await screen.findByRole("link", { name: "Open project Encoded project" }),
    ).toHaveAttribute("href", "/projects/project%20%2F%201/versions/main");
  });

  it("renders empty project lists", async () => {
    renderPage({
      loadProjects: async () => ({ projects: [] }),
    });

    expect(
      await screen.findByRole("heading", { name: "No Projects yet" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        'img[src="/illustrations/ossie-projects-empty.png"]',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Projects organize your Captures, Guides, Interactive Demos, and Documentation.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create your first Project" }),
    ).toBeInTheDocument();
  });

  it("uses one page heading, compact lifecycle tabs, and no portal labels", async () => {
    const loadProjects = vi.fn(async () => ({ projects: [] }));
    renderPage({ loadProjects });

    expect(
      await screen.findByRole("heading", { name: "Projects", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Projects")).toHaveLength(2);
    expect(screen.queryByText("Portal")).not.toBeInTheDocument();
    expect(screen.queryByText("Portal home")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Breadcrumb" }),
    ).not.toBeInTheDocument();

    const activeTab = screen.getByRole("tab", { name: "Active" });
    const archivedTab = screen.getByRole("tab", { name: "Archived" });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
    expect(archivedTab).toHaveAttribute("aria-selected", "false");

    fireEvent.click(archivedTab);

    await waitFor(() =>
      expect(loadProjects).toHaveBeenLastCalledWith({ status: "archived" }),
    );
    expect(archivedTab).toHaveAttribute("aria-selected", "true");
  });

  it("provides project navigation controls and an account menu", async () => {
    renderPage({ loadProjects: async () => ({ projects: [] }) });

    expect(
      await screen.findByRole("heading", { name: "Projects", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Collapse navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open account menu for Jane Member" }),
    );

    const accountMenu = screen.getByRole("menu");
    expect(
      within(accountMenu).getByText("jane@example.com"),
    ).toBeInTheDocument();
    expect(within(accountMenu).getByText("Ossie Labs")).toBeInTheDocument();
    expect(
      within(accountMenu).getByText("Organization owner"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Organization members" }),
    ).toHaveAttribute("href", "/organization/members");
    expect(
      screen.getByRole("menuitem", { name: "Sign out" }),
    ).toBeInTheDocument();
  });

  it("opens and cancels the project creation form", async () => {
    renderPage({ loadProjects: async () => ({ projects: [] }) });

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Create a Project" });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).queryByText("* Required fields"),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        "Set up a space for related Captures, Guides, Interactive Demos, and Documentation.",
      ),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("Project name *")).toBeRequired();
    expect(within(dialog).getByLabelText("Project URL *")).toBeRequired();
    expect(
      within(dialog).getByLabelText("Description (optional)"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Close create Project" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Project name *")).toHaveFocus();
    expect(
      screen.getByRole("heading", { name: "No Projects yet" }),
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("dialog", { name: "Create a Project" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No Projects yet" }),
    ).toBeInTheDocument();
  });

  it("generates a Project URL from the name until the URL is edited", async () => {
    renderPage({ loadProjects: async () => ({ projects: [] }) });

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );

    const name = screen.getByLabelText("Project name *");
    const projectUrl = screen.getByLabelText("Project URL *");
    fireEvent.change(name, { target: { value: "Customer Onboarding" } });
    expect(projectUrl).toHaveValue("customer-onboarding");

    fireEvent.change(projectUrl, { target: { value: "onboarding" } });
    fireEvent.change(name, { target: { value: "Customer Success" } });
    expect(projectUrl).toHaveValue("onboarding");
  });

  it("asks before discarding entered Project details", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    renderPage({ loadProjects: async () => ({ projects: [] }) });

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );
    fireEvent.change(screen.getByLabelText("Project name *"), {
      target: { value: "Customer onboarding" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(confirm).toHaveBeenCalledWith(
      "Discard the Project details you entered?",
    );
    expect(
      screen.getByRole("dialog", { name: "Create a Project" }),
    ).toBeInTheDocument();

    confirm.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("dialog", { name: "Create a Project" }),
    ).not.toBeInTheDocument();
    confirm.mockRestore();
  });

  it("validates project names before creating projects", async () => {
    const { createProject } = renderPage();

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );
    fireEvent.change(screen.getByLabelText("Project name *"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect(screen.getByText("Project name is required.")).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it("requires a Project URL", async () => {
    const { createProject } = renderPage();

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );
    fireEvent.change(screen.getByLabelText("Project name *"), {
      target: { value: "Customer onboarding" },
    });
    fireEvent.change(screen.getByLabelText("Project URL *"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect(screen.getByText("Project URL is required.")).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it("creates projects from normalized form data and opens the new workspace", async () => {
    const createProject = vi.fn(async () => ({
      project: {
        ...projects[1]!,
        id: "project_created",
        name: "Created project",
      },
    }));
    const navigate = vi.fn();
    renderPage({ createProject, navigate });

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );
    fireEvent.change(screen.getByLabelText("Project name *"), {
      target: { value: " Created project " },
    });
    fireEvent.change(screen.getByLabelText("Description (optional)"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    await waitFor(() =>
      expect(createProject).toHaveBeenCalledWith({
        name: "Created project",
        slug: "created-project",
        description: null,
      }),
    );
    expect(navigate).toHaveBeenCalledWith(
      "/projects/project_created/versions/main",
    );
  });

  it("keeps project creation form values when creation fails", async () => {
    renderPage({
      createProject: async () => {
        throw new Error("Network failed");
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );
    fireEvent.change(screen.getByLabelText("Project name *"), {
      target: { value: "Created project" },
    });
    fireEvent.change(screen.getByLabelText("Project URL *"), {
      target: { value: "created-project" },
    });
    fireEvent.change(screen.getByLabelText("Description (optional)"), {
      target: { value: "A useful project." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect(
      await screen.findByText("Could not create project."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Project name *")).toHaveValue(
      "Created project",
    );
    expect(screen.getByLabelText("Project URL *")).toHaveValue(
      "created-project",
    );
    expect(screen.getByLabelText("Description (optional)")).toHaveValue(
      "A useful project.",
    );
  });

  it("renders project creation conflicts as form messages", async () => {
    renderPage({
      createProject: async () => {
        throw new ApiClientError({
          kind: "validation",
          status: 409,
          type: "project_name_conflict",
          message: "A project with this name already exists",
        });
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );
    fireEvent.change(screen.getByLabelText("Project name *"), {
      target: { value: "Created project" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect(
      await screen.findByText("A project with this name already exists."),
    ).toBeInTheDocument();
  });

  it("renders project slug conflicts as form messages", async () => {
    renderPage({
      createProject: async () => {
        throw new ApiClientError({
          kind: "validation",
          status: 409,
          type: "project_slug_conflict",
          message: "A project with this slug already exists",
        });
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );
    fireEvent.change(screen.getByLabelText("Project name *"), {
      target: { value: "Created project" },
    });
    fireEvent.change(screen.getByLabelText("Project URL *"), {
      target: { value: "created-project" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect(
      await screen.findByText("That Project URL is already in use."),
    ).toBeInTheDocument();
  });

  it("renders project creation authentication failures as form messages", async () => {
    renderPage({
      createProject: async () => {
        throw new ApiClientError({
          kind: "unauthenticated",
          status: 401,
          type: "unauthenticated",
          message: "Authentication is required",
        });
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );
    fireEvent.change(screen.getByLabelText("Project name *"), {
      target: { value: "Created project" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect(
      await screen.findByText("Sign in to create a project."),
    ).toBeInTheDocument();
  });

  it("disables project creation submit while the request is pending", async () => {
    let resolveCreate: ((value: { project: Project }) => void) | undefined;
    const createProject = vi.fn(
      () =>
        new Promise<{ project: Project }>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const navigate = vi.fn();
    renderPage({ createProject, navigate });

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create a new Project" }),
    );
    fireEvent.change(screen.getByLabelText("Project name *"), {
      target: { value: "Created project" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Project" }));

    expect(
      screen.getByRole("button", { name: "Creating Project..." }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Creating Project..." }),
    );
    expect(createProject).toHaveBeenCalledTimes(1);

    resolveCreate?.({ project: projects[1]! });
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "/projects/project_1/versions/main",
      ),
    );
  });

  it("redirects unauthenticated visitors to sign in with the current path", async () => {
    const navigate = vi.fn();

    renderPage({
      currentPath: "/projects?view=recent",
      navigate,
      loadProjects: async () => {
        throw new ApiClientError({
          kind: "unauthenticated",
          status: 401,
          type: "unauthenticated",
          message: "Authentication is required",
        });
      },
    });

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "/login?next=%2Fprojects%3Fview%3Drecent",
      ),
    );
    expect(
      screen.queryByRole("navigation", { name: "Portal navigation" }),
    ).not.toBeInTheDocument();
  });

  it("renders generic errors and supports retry", async () => {
    const loadProjects = vi
      .fn<() => Promise<{ projects: Project[] }>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ projects });

    renderPage({ loadProjects });

    expect(
      await screen.findByText("Could not load projects."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadProjects).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
  });

  it("handles invalid project timestamps", async () => {
    renderPage({
      loadProjects: async () => ({
        projects: [
          {
            ...projects[0]!,
            created_at: "not a date",
            updated_at: "also not a date",
          },
        ],
      }),
    });

    expect(await screen.findByText("Updated Unknown")).toBeInTheDocument();
    expect(screen.getByText("Created Unknown")).toBeInTheDocument();
  });

  it("signs out from the project list", async () => {
    const performLogout = vi.fn(async () => {});
    const navigate = vi.fn();

    renderPage({ performLogout, navigate });

    expect(
      await screen.findByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Open account menu for Jane Member" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

    await waitFor(() => expect(performLogout).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("keeps project list content visible when sign-out fails", async () => {
    renderPage({
      performLogout: async () => {
        throw new Error("Network failed");
      },
      navigate: vi.fn(),
    });

    expect(
      await screen.findByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Open account menu for Jane Member" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(await screen.findByText("Could not sign out.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
  });
});
