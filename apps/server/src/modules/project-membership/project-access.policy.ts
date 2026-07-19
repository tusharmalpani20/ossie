import type { ProjectRole } from "@repo/constants";

export type ProjectCapability =
  | "project.read"
  | "project.settings.manage"
  | "project.membership.manage"
  | "project.compliance.read"
  | "project.activity.read"
  | "capture.read"
  | "capture.write"
  | "artifact.read"
  | "artifact.write"
  | "publication.read"
  | "publication.manage"
  | "project_version.manage"
  | "revision.checkpoint_restore"
  | "revision.carry_forward"
  | "asset.purge";

const capabilities: Record<ProjectRole, ReadonlySet<ProjectCapability>> = {
  project_admin: new Set<ProjectCapability>([
    "project.read", "project.settings.manage", "project.membership.manage",
    "project.compliance.read", "project.activity.read", "capture.read",
    "capture.write", "artifact.read", "artifact.write", "publication.read",
    "publication.manage", "project_version.manage", "revision.checkpoint_restore",
    "revision.carry_forward", "asset.purge",
  ]),
  editor: new Set<ProjectCapability>([
    "project.read", "project.activity.read", "capture.read", "capture.write",
    "artifact.read", "artifact.write", "publication.read", "publication.manage",
    "revision.checkpoint_restore", "revision.carry_forward",
  ]),
  viewer: new Set<ProjectCapability>([
    "project.read", "capture.read", "artifact.read", "publication.read",
  ]),
};

export const project_role_has_capability = (
  role: ProjectRole,
  capability: ProjectCapability,
) => capabilities[role].has(capability);

export const is_project_content_mutation = (capability: ProjectCapability) =>
  capability === "capture.write" || capability === "artifact.write" ||
  capability === "publication.manage" || capability === "revision.checkpoint_restore" ||
  capability === "revision.carry_forward" || capability === "asset.purge";

export const project_route_capability = (
  method: string,
  route_template: string,
): ProjectCapability | null => {
  if (!route_template.startsWith("/api/v1/projects/")) return null;
  const read = method === "GET";
  if (route_template === "/api/v1/projects/:id")
    return read ? "project.read" : "project.settings.manage";
  if (route_template.includes("/memberships")) return "project.membership.manage";
  if (route_template.includes("/compliance/")) return "project.compliance.read";
  if (route_template.endsWith("/activity")) return "project.activity.read";
  if (route_template.includes("/capture-sessions") || route_template.includes("/capture-assets"))
    return read ? "capture.read" : "capture.write";
  if (route_template.includes("/guides") || route_template.includes("/interactive-demos")) {
    if (route_template.includes("/publish"))
      return read ? "publication.read" : "publication.manage";
    return read ? "artifact.read" : "artifact.write";
  }
  return null;
};
