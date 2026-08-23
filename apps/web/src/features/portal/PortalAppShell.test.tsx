/**
 * @fileoverview Portal application shell tests.
 */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PortalAccountProvider } from "./PortalAccountContext";
import { PortalAppShell } from "./PortalAppShell";

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

describe("PortalAppShell", () => {
  it("renders stable portal navigation and breadcrumbs", () => {
    render(
      <PortalAppShell
        activeSection="guides"
        currentLabel="Guides"
        project={{
          id: "project_1",
          name: "OSS Handbook",
          defaultProjectVersionSlug: "main",
          access: {
            role: "project_admin",
            source: "project_membership",
          },
        }}
        projectVersion={{ slug: "main", name: "Main", isDefault: true }}
      >
        <h1>Guides</h1>
      </PortalAppShell>,
    );

    expect(screen.getByRole("banner")).toHaveTextContent("OSS Handbook");
    expect(
      screen.getByRole("navigation", { name: "Portal navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Guides" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/documentation",
    );
    expect(screen.queryByText("Video")).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toHaveTextContent("ProjectsOSS HandbookGuides");
    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toHaveAttribute("href", "#portal-main-content");
    expect(screen.getByRole("main")).toHaveAttribute(
      "id",
      "portal-main-content",
    );
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("keeps viewer settings links out of the shell", () => {
    render(
      <PortalAppShell
        activeSection="project_workspace"
        currentLabel="Project workspace"
        project={{
          id: "project_1",
          name: "OSS Handbook",
          access: {
            role: "viewer",
            source: "project_membership",
          },
        }}
      >
        <h1>Workspace</h1>
      </PortalAppShell>,
    );

    expect(
      screen.queryByRole("link", { name: "Project settings" }),
    ).not.toBeInTheDocument();
  });

  it("keeps named Project Version context inside a labeled landmark", () => {
    render(
      <PortalAppShell
        activeSection="capture_sessions"
        currentLabel="Capture Session"
        project={{ id: "project_1", name: "OSS Handbook" }}
        projectVersion={{
          slug: "summer-release",
          name: "Summer release",
          isDefault: false,
        }}
      >
        <h1>Capture Session</h1>
      </PortalAppShell>,
    );

    expect(
      screen.getByRole("complementary", {
        name: "Named Project Version context",
      }),
    ).toHaveTextContent("Project Version");
  });

  it("uses the modern organization shell and loads account context outside Projects", async () => {
    const loadAuth = vi.fn(async () => authResponse);

    render(
      <PortalAppShell
        activeSection="organization_members"
        currentLabel="Organization members"
        loadAuth={loadAuth}
      >
        <h1>Organization members</h1>
      </PortalAppShell>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Portal navigation",
    });
    expect(
      screen.getByRole("link", { name: "Organization members" }),
    ).toHaveTextContent("Members");
    expect(navigation.querySelectorAll("svg")).toHaveLength(5);
    expect(screen.queryByText("Portal")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Breadcrumb" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("button", {
        name: "Open account menu for Jane Member",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", {
        name: "Current Organization and account",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Collapse navigation" }),
    ).toBeInTheDocument();
    expect(loadAuth).toHaveBeenCalledTimes(1);
  });

  it("keeps the loaded account when switching library sections", async () => {
    const loadAuth = vi.fn(async () => authResponse);
    const renderShell = (section: "projects" | "organization_members") => (
      <PortalAccountProvider>
        <PortalAppShell
          activeSection={section}
          currentLabel={
            section === "projects" ? "Projects" : "Organization members"
          }
          loadAuth={loadAuth}
        >
          <h1>{section === "projects" ? "Projects" : "Organization members"}</h1>
        </PortalAppShell>
      </PortalAccountProvider>
    );
    const view = render(renderShell("projects"));

    expect(
      await screen.findByRole("button", {
        name: "Open account menu for Jane Member",
      }),
    ).toBeInTheDocument();

    view.rerender(renderShell("organization_members"));

    expect(
      screen.getByRole("button", {
        name: "Open account menu for Jane Member",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
    expect(loadAuth).toHaveBeenCalledTimes(1);
  });

  it("uses client-side navigation for ordinary sidebar clicks", () => {
    const navigate = vi.fn();

    render(
      <PortalAppShell
        activeSection="projects"
        currentLabel="Projects"
        navigate={navigate}
      >
        <h1>Projects</h1>
      </PortalAppShell>,
    );

    const membersLink = screen.getByRole("link", {
      name: "Organization members",
    });
    expect(membersLink).toHaveAttribute("href", "/organization/members");

    fireEvent.click(membersLink);

    expect(navigate).toHaveBeenCalledWith("/organization/members");
  });

  it("preserves modified sidebar clicks for opening links in another tab", () => {
    const navigate = vi.fn();

    render(
      <PortalAppShell
        activeSection="projects"
        currentLabel="Projects"
        navigate={navigate}
      >
        <h1>Projects</h1>
      </PortalAppShell>,
    );

    fireEvent.click(
      screen.getByRole("link", { name: "Organization members" }),
      { ctrlKey: true },
    );

    expect(navigate).not.toHaveBeenCalled();
  });
});
