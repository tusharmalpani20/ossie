/**
 * @fileoverview Portal application shell tests.
 */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortalAppShell } from "./PortalAppShell";

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
    expect(screen.queryByText("Documentation")).not.toBeInTheDocument();
    expect(screen.queryByText("Video")).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toHaveTextContent("ProjectsOSS HandbookGuides");
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
});
