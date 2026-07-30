/**
 * @fileoverview Portal navigation helper tests.
 */

import { describe, expect, it } from "vitest";
import {
  buildPortalBreadcrumbs,
  buildPortalNavigation,
  projectWorkspaceUrl,
} from "./portalNavigation";

describe("portalNavigation", () => {
  const project = {
    id: "project 1",
    name: "OSS Handbook",
    defaultProjectVersionSlug: "main",
    access: { role: "project_admin", source: "project_membership" },
  } as const;

  it("uses Project Version URLs when Project Version context is known", () => {
    expect(projectWorkspaceUrl(project, { slug: "spring-2026" })).toBe(
      "/projects/project%201/versions/spring-2026",
    );

    const labels = buildPortalNavigation({
      activeSection: "guides",
      project,
      projectVersion: { slug: "spring-2026" },
    }).map((item) => [item.label, item.href, item.active]);

    expect(labels).toContainEqual([
      "Guides",
      "/projects/project%201/versions/spring-2026/guides",
      true,
    ]);
    expect(labels).toContainEqual([
      "Documentation",
      "/projects/project%201/versions/spring-2026/documentation",
      false,
    ]);
  });

  it("hides project settings when the project role cannot manage settings", () => {
    expect(
      buildPortalNavigation({
        activeSection: "project_workspace",
        project: {
          ...project,
          access: { role: "viewer", source: "project_membership" },
        },
      }).some((item) => item.label === "Project settings"),
    ).toBe(false);
  });

  it("builds compact breadcrumbs without Project Version ceremony for Main", () => {
    expect(
      buildPortalBreadcrumbs({
        activeLabel: "Guides",
        project,
        projectVersion: { slug: "main", name: "Main", isDefault: true },
      }),
    ).toEqual([
      { label: "Projects", href: "/projects" },
      { label: "OSS Handbook", href: "/projects/project%201/versions/main" },
      { label: "Guides" },
    ]);
  });
});
