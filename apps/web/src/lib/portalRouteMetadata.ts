/**
 * @fileoverview Metadata for routes that can render inside the portal shell.
 */

import type { PortalRoute } from "./routes";

export type PortalRouteSection =
  | "projects"
  | "organization_members"
  | "organization_compliance"
  | "project_workspace"
  | "project_activity"
  | "project_compliance"
  | "project_settings"
  | "capture_sessions"
  | "guides"
  | "interactive_demos"
  | "documentation";

export type PortalRouteMetadata = {
  section: PortalRouteSection | null;
  usesPortalShell: boolean;
  label: string;
};

const metadataByType: Partial<
  Record<PortalRoute["type"], PortalRouteMetadata>
> = {
  project_list: {
    section: "projects",
    usesPortalShell: true,
    label: "Projects",
  },
  organization_members: {
    section: "organization_members",
    usesPortalShell: true,
    label: "Organization members",
  },
  organization_compliance: {
    section: "organization_compliance",
    usesPortalShell: true,
    label: "Compliance timeline",
  },
  project_workspace: {
    section: "project_workspace",
    usesPortalShell: true,
    label: "Project workspace",
  },
  project_version_workspace: {
    section: "project_workspace",
    usesPortalShell: true,
    label: "Project Version workspace",
  },
  project_activity: {
    section: "project_activity",
    usesPortalShell: true,
    label: "Activity",
  },
  project_compliance: {
    section: "project_compliance",
    usesPortalShell: true,
    label: "Project compliance",
  },
  project_settings: {
    section: "project_settings",
    usesPortalShell: true,
    label: "Project settings",
  },
  project_capture_session_list: {
    section: "capture_sessions",
    usesPortalShell: true,
    label: "Capture sessions",
  },
  project_guide_list: {
    section: "guides",
    usesPortalShell: true,
    label: "Guides",
  },
  project_interactive_demo_list: {
    section: "interactive_demos",
    usesPortalShell: true,
    label: "Interactive demos",
  },
  documentation_site_list: {
    section: "documentation",
    usesPortalShell: true,
    label: "Documentation",
  },
  documentation_carry_forward: {
    section: "documentation",
    usesPortalShell: true,
    label: "Carry Forward Documentation",
  },
  documentation_site_editor: {
    section: "documentation",
    usesPortalShell: true,
    label: "Documentation Site",
  },
  documentation_page_editor: {
    section: "documentation",
    usesPortalShell: true,
    label: "Documentation Page",
  },
  documentation_draft_preview: {
    section: "documentation",
    usesPortalShell: true,
    label: "Documentation draft preview",
  },
  documentation_revision_preview: {
    section: "documentation",
    usesPortalShell: true,
    label: "Site Revision",
  },
  documentation_publication_preview: {
    section: "documentation",
    usesPortalShell: true,
    label: "Site Publication",
  },
};

/** Returns shell metadata for a parsed portal route. */
export const portalRouteMetadata = (route: PortalRoute): PortalRouteMetadata =>
  metadataByType[route.type] ?? {
    section: null,
    usesPortalShell: false,
    label: "Unsupported",
  };

const documentLabelByType: Record<PortalRoute["type"], string> = {
  login: "Sign in",
  setup: "Set up Ossie",
  project_list: "Projects",
  organization_members: "Organization members",
  organization_compliance: "Organization compliance",
  organization_invite_accept: "Accept invitation",
  project_workspace: "Project workspace",
  project_version_workspace: "Project Version workspace",
  project_carry_forward: "Carry forward artifacts",
  artifact_revision_history: "Revision history",
  artifact_revision_preview: "Revision preview",
  project_settings: "Project settings",
  project_compliance: "Project compliance",
  project_activity: "Project activity",
  capture_session_detail: "Capture Session",
  project_capture_session_list: "Capture Sessions",
  guide_detail: "Guide editor",
  guide_preview: "Guide preview",
  project_guide_list: "Guides",
  project_interactive_demo_list: "Interactive demos",
  interactive_demo_detail: "Interactive demo editor",
  interactive_demo_preview: "Interactive demo preview",
  documentation_site_list: "Documentation",
  documentation_carry_forward: "Carry Forward Documentation",
  documentation_site_editor: "Documentation Site",
  documentation_page_editor: "Documentation Page editor",
  documentation_draft_preview: "Documentation draft preview",
  documentation_revision_preview: "Site Revision",
  documentation_publication_preview: "Site Publication",
  public_documentation_reader: "Documentation",
  public_guide_reader: "Guide",
  public_guide_embed: "Guide",
  public_interactive_demo_reader: "Interactive demo",
  public_interactive_demo_embed: "Interactive demo",
  design_system_review: "Design system review",
  unsupported: "Page not found",
};

/**
 * Returns a privacy-safe document title for a route.
 *
 * Titles intentionally describe the surface rather than interpolating opaque
 * identifiers, invite tokens, or public slugs from the URL.
 */
export const portalDocumentTitle = (route: PortalRoute) =>
  `${documentLabelByType[route.type]} | Ossie`;
