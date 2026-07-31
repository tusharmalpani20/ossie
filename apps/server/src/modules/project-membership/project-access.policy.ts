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
  | "publication.create"
  | "publish_link.manage"
  | "project_version.manage"
  | "revision.checkpoint_restore"
  | "revision.carry_forward"
  | "asset.purge"
  | "documentation.read"
  | "documentation.write"
  | "documentation.site.manage"
  | "documentation.comment"
  | "documentation.checkpoint"
  | "documentation.carry_forward"
  | "documentation.review.request"
  | "documentation.review.decide"
  | "documentation.review.manage"
  | "documentation.review.inbox"
  | "documentation.review.override"
  | "documentation.review.evidence.read_sensitive";

const capabilities: Record<ProjectRole, ReadonlySet<ProjectCapability>> = {
  project_admin: new Set<ProjectCapability>([
    "project.read",
    "project.settings.manage",
    "project.membership.manage",
    "project.compliance.read",
    "project.activity.read",
    "capture.read",
    "capture.write",
    "artifact.read",
    "artifact.write",
    "publication.read",
    "publication.create",
    "publish_link.manage",
    "project_version.manage",
    "revision.checkpoint_restore",
    "revision.carry_forward",
    "asset.purge",
    "documentation.read",
    "documentation.write",
    "documentation.site.manage",
    "documentation.comment",
    "documentation.checkpoint",
    "documentation.carry_forward",
    "documentation.review.request",
    "documentation.review.decide",
    "documentation.review.manage",
    "documentation.review.inbox",
    "documentation.review.override",
    "documentation.review.evidence.read_sensitive",
  ]),
  editor: new Set<ProjectCapability>([
    "project.read",
    "project.activity.read",
    "capture.read",
    "capture.write",
    "artifact.read",
    "artifact.write",
    "publication.read",
    "publication.create",
    "publish_link.manage",
    "revision.checkpoint_restore",
    "revision.carry_forward",
    "documentation.read",
    "documentation.write",
    "documentation.comment",
    "documentation.checkpoint",
    "documentation.carry_forward",
    "documentation.review.request",
    "documentation.review.decide",
    "documentation.review.inbox",
  ]),
  viewer: new Set<ProjectCapability>([
    "project.read",
    "capture.read",
    "artifact.read",
    "publication.read",
    "documentation.read",
    "documentation.review.decide",
    "documentation.review.inbox",
  ]),
};

export const project_role_has_capability = (
  role: ProjectRole,
  capability: ProjectCapability,
) => capabilities[role].has(capability);

export const is_project_content_mutation = (capability: ProjectCapability) =>
  capability === "capture.write" ||
  capability === "artifact.write" ||
  capability === "publication.create" ||
  capability === "publish_link.manage" ||
  capability === "revision.checkpoint_restore" ||
  capability === "revision.carry_forward" ||
  capability === "asset.purge" ||
  capability === "documentation.write" ||
  capability === "documentation.site.manage" ||
  capability === "documentation.comment" ||
  capability === "documentation.checkpoint" ||
  capability === "documentation.carry_forward" ||
  capability === "documentation.review.request" ||
  capability === "documentation.review.decide" ||
  capability === "documentation.review.manage" ||
  capability === "documentation.review.override" ||
  capability === "project_version.manage";

export const project_route_capability = (
  method: string,
  route_template: string,
): ProjectCapability | null => {
  if (!route_template.startsWith("/api/v1/projects/")) return null;
  const read = method === "GET";
  if (route_template === "/api/v1/projects/:id")
    return read ? "project.read" : "project.settings.manage";
  if (route_template.includes("/documentation-review-inbox"))
    return "documentation.review.inbox";
  if (route_template.includes("/documentation-sites")) {
    if (route_template.includes("/review-publication-evidence/:evidence_id"))
      return "documentation.review.evidence.read_sensitive";
    if (route_template.includes("/review-publication-evidence"))
      return "documentation.read";
    if (route_template.endsWith("/review-policy"))
      return read ? "documentation.read" : "documentation.review.manage";
    if (route_template.endsWith("/review-candidates"))
      return "documentation.review.request";
    if (route_template.endsWith("/review-gate")) return "documentation.read";
    if (route_template.includes("/reviews/")) {
      if (route_template.endsWith("/decisions"))
        return "documentation.review.decide";
      if (route_template.endsWith("/cancel"))
        return "documentation.review.request";
      return "documentation.read";
    }
    if (route_template.endsWith("/reviews"))
      return read ? "documentation.read" : "documentation.review.request";
  }
  if (route_template.includes("/documentation-sites")) {
    if (route_template.endsWith("/try-it-policy"))
      return read ? "documentation.read" : "documentation.site.manage";
    if (route_template.endsWith("/try-it-attempts"))
      return "documentation.read";
    if (route_template.endsWith("/documentation-sites/carry-forward"))
      return read ? "documentation.read" : "documentation.carry_forward";
    if (route_template.includes("/publications"))
      return read ? "publication.read" : "publication.create";
    if (route_template.includes("/publish-links"))
      return read ? "publication.read" : "publish_link.manage";
    if (route_template.includes("/comments"))
      return read ? "documentation.read" : "documentation.comment";
    if (route_template.includes("/revisions"))
      return read ? "documentation.read" : "documentation.checkpoint";
    if (
      !read &&
      (route_template.endsWith("/documentation-sites") ||
        route_template.endsWith("/edition"))
    )
      return "documentation.site.manage";
    return read ? "documentation.read" : "documentation.write";
  }
  if (route_template.includes("/documentation-search"))
    return "documentation.read";
  if (route_template.includes("/versions"))
    return read ? "project.read" : "project_version.manage";
  if (route_template.includes("/memberships"))
    return "project.membership.manage";
  if (route_template.includes("/compliance/")) return "project.compliance.read";
  if (route_template.endsWith("/activity")) return "project.activity.read";
  if (
    route_template.includes("/capture-sessions") ||
    route_template.includes("/capture-assets")
  )
    return read ? "capture.read" : "capture.write";
  if (
    route_template.includes("/guides") ||
    route_template.includes("/interactive-demos")
  ) {
    if (route_template.includes("/publications"))
      return read ? "publication.read" : "publication.create";
    if (route_template.includes("/publish-links"))
      return read ? "publication.read" : "publish_link.manage";
    return read ? "artifact.read" : "artifact.write";
  }
  return null;
};
