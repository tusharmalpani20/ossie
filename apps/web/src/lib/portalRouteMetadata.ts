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
  | "interactive_demos";

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
};

/** Returns shell metadata for a parsed portal route. */
export const portalRouteMetadata = (route: PortalRoute): PortalRouteMetadata =>
  metadataByType[route.type] ?? {
    section: null,
    usesPortalShell: false,
    label: "Unsupported",
  };
