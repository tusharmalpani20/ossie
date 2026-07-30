import { describe, expect, it } from "vitest";
import {
  is_project_content_mutation,
  project_role_has_capability,
  project_route_capability,
  type ProjectCapability,
} from "./project-access.policy";

const capabilities: ProjectCapability[] = [
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
];

describe("project access policy", () => {
  it("allows Project Admin every current and accepted future capability seam", () => {
    expect(
      capabilities.every((capability) =>
        project_role_has_capability("project_admin", capability),
      ),
    ).toBe(true);
  });

  it("allows Editor content work and Activity but not Project administration", () => {
    for (const capability of [
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
    ] as const)
      expect(project_role_has_capability("editor", capability)).toBe(true);
    for (const capability of [
      "project.settings.manage",
      "project.membership.manage",
      "project.compliance.read",
      "project_version.manage",
      "asset.purge",
      "documentation.site.manage",
    ] as const)
      expect(project_role_has_capability("editor", capability)).toBe(false);
  });

  it("keeps Viewer strictly read-only", () => {
    for (const capability of [
      "project.read",
      "capture.read",
      "artifact.read",
      "publication.read",
      "documentation.read",
    ] as const)
      expect(project_role_has_capability("viewer", capability)).toBe(true);
    for (const capability of capabilities.filter(
      (value) =>
        ![
          "project.read",
          "capture.read",
          "artifact.read",
          "publication.read",
          "documentation.read",
        ].includes(value),
    ))
      expect(project_role_has_capability("viewer", capability)).toBe(false);
  });

  it.each([
    ["GET", "/api/v1/projects/:project_id/capture-sessions", "capture.read"],
    ["POST", "/api/v1/projects/:project_id/capture-sessions", "capture.write"],
    [
      "GET",
      "/api/v1/projects/:project_id/guides/:guide_id/export/markdown",
      "artifact.read",
    ],
    [
      "PATCH",
      "/api/v1/projects/:project_id/guides/:guide_id",
      "artifact.write",
    ],
    [
      "GET",
      "/api/v1/projects/:project_id/guides/:guide_id/publications",
      "publication.read",
    ],
    [
      "POST",
      "/api/v1/projects/:project_id/guides/:guide_id/publications",
      "publication.create",
    ],
    [
      "PATCH",
      "/api/v1/projects/:project_id/guides/:guide_id/publish-links/:link_id",
      "publish_link.manage",
    ],
    ["PATCH", "/api/v1/projects/:id", "project.settings.manage"],
    [
      "GET",
      "/api/v1/projects/:project_id/versions/:project_version_id",
      "project.read",
    ],
    ["POST", "/api/v1/projects/:project_id/versions", "project_version.manage"],
    [
      "GET",
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites",
      "documentation.read",
    ],
    [
      "POST",
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites",
      "documentation.site.manage",
    ],
    [
      "PUT",
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/content",
      "documentation.write",
    ],
    [
      "POST",
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/comments",
      "documentation.comment",
    ],
    [
      "POST",
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions",
      "documentation.checkpoint",
    ],
    [
      "POST",
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/carry-forward",
      "documentation.carry_forward",
    ],
    [
      "POST",
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications",
      "publication.create",
    ],
  ])("maps %s %s to %s", (method, route, capability) => {
    expect(project_route_capability(method, route)).toBe(capability);
  });

  it("does not apply internal membership to public Publish Link routes", () => {
    expect(
      project_route_capability("GET", "/api/v1/public/publish-links/:slug"),
    ).toBeNull();
  });

  it("blocks Project Version management while the owning Project is archived", () => {
    expect(is_project_content_mutation("project_version.manage")).toBe(true);
    expect(is_project_content_mutation("publish_link.manage")).toBe(true);
  });
});
