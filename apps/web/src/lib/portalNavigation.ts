/**
 * @fileoverview Shared portal navigation and breadcrumb helpers.
 */

import type { Project } from "@repo/types/project";
import type {
  ProjectVersion,
  ProjectVersionDetail,
} from "@repo/types/project-version";
import type { PortalRouteSection } from "./portalRouteMetadata";

export type PortalProjectContext = {
  id: string;
  name?: string;
  access?: Project["access"];
  defaultProjectVersionSlug?: string;
};

export type PortalProjectVersionContext = {
  slug: string;
  name?: string;
  status?: ProjectVersion["status"];
  isDefault?: boolean;
};

export type PortalNavigationItem = {
  label: string;
  href: string;
  active: boolean;
  ariaLabel?: string;
  /** Short label used in the compact shell while preserving the full accessible name. */
  displayLabel?: string;
};

export type PortalBreadcrumb = {
  label: string;
  href?: string;
};

export const projectVersionWorkspaceUrl = (projectId: string, slug: string) =>
  `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(slug)}`;

export const projectWorkspaceUrl = (
  project: PortalProjectContext,
  projectVersion?: PortalProjectVersionContext,
) => {
  const slug = projectVersion?.slug ?? project.defaultProjectVersionSlug;

  return slug
    ? projectVersionWorkspaceUrl(project.id, slug)
    : `/projects/${encodeURIComponent(project.id)}`;
};

const projectUrl = (
  project: PortalProjectContext,
  suffix: string,
  projectVersion?: PortalProjectVersionContext,
) => `${projectWorkspaceUrl(project, projectVersion)}${suffix}`;

const projectCanManageSettings = (project?: PortalProjectContext) =>
  project?.access?.role === "project_admin" ||
  project?.access?.source === "organization_owner";

/** Builds the allowed primary shell links for the current context. */
export const buildPortalNavigation = ({
  activeSection,
  project,
  projectVersion,
}: {
  activeSection: PortalRouteSection | null;
  project?: PortalProjectContext;
  projectVersion?: PortalProjectVersionContext;
}): PortalNavigationItem[] => {
  const items: PortalNavigationItem[] = [
    {
      label: "Projects",
      href: "/projects",
      active: activeSection === "projects",
    },
    {
      label: "Organization members",
      href: "/organization/members",
      active: activeSection === "organization_members",
      ariaLabel: "Portal organization members",
      displayLabel: "Members",
    },
    {
      label: "Compliance",
      href: "/organization/compliance",
      active: activeSection === "organization_compliance",
      ariaLabel: "Portal compliance",
    },
    {
      label: "Documentation operations",
      href: "/organization/documentation",
      active: activeSection === "organization_documentation",
      ariaLabel: "Portal Documentation operations",
      displayLabel: "Documentation",
    },
    {
      label: "Browser extension",
      href: "/extension",
      active: activeSection === "browser_extension",
      ariaLabel: "Download and install the Ossie browser extension",
    },
  ];

  if (!project) return items;

  items.push(
    {
      label: "Workspace",
      href: projectWorkspaceUrl(project, projectVersion),
      active: activeSection === "project_workspace",
      ariaLabel: "Project workspace",
    },
    {
      label: "Capture sessions",
      href: projectUrl(project, "/capture-sessions", projectVersion),
      active: activeSection === "capture_sessions",
    },
    {
      label: "Guides",
      href: projectUrl(project, "/guides", projectVersion),
      active: activeSection === "guides",
    },
    {
      label: "Interactive demos",
      href: projectUrl(project, "/interactive-demos", projectVersion),
      active: activeSection === "interactive_demos",
    },
    {
      label: "Documentation",
      href: projectUrl(project, "/documentation", projectVersion),
      active: activeSection === "documentation",
    },
    {
      label: "Activity",
      href: `/projects/${encodeURIComponent(project.id)}/activity`,
      active: activeSection === "project_activity",
    },
  );

  if (projectCanManageSettings(project)) {
    items.push({
      label: "Project settings",
      href: `/projects/${encodeURIComponent(project.id)}/settings`,
      active: activeSection === "project_settings",
      ariaLabel: "Portal project settings",
    });
  }

  return items;
};

/** Builds a compact breadcrumb trail for shell pages. */
export const buildPortalBreadcrumbs = ({
  activeLabel,
  project,
  projectVersion,
}: {
  activeLabel: string;
  project?: PortalProjectContext;
  projectVersion?: PortalProjectVersionContext;
}): PortalBreadcrumb[] => {
  const crumbs: PortalBreadcrumb[] = [{ label: "Projects", href: "/projects" }];

  if (project) {
    crumbs.push({
      label: project.name ?? project.id,
      href: projectWorkspaceUrl(project, projectVersion),
    });
  }

  if (projectVersion && !projectVersion.isDefault) {
    crumbs.push({
      label: projectVersion.name ?? projectVersion.slug,
      href: projectVersionWorkspaceUrl(project?.id ?? "", projectVersion.slug),
    });
  }

  if (activeLabel !== crumbs.at(-1)?.label) {
    crumbs.push({ label: activeLabel });
  }

  return crumbs;
};

/** Converts loaded API objects into the shell's smaller Project Version shape. */
export const portalProjectVersionFromDetail = (
  selected: ProjectVersionDetail,
): PortalProjectVersionContext => ({
  slug: selected.slug,
  name: selected.name,
  status: selected.status,
  isDefault: selected.is_default,
});
