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
    ] as const)
      expect(project_role_has_capability("editor", capability)).toBe(true);
    for (const capability of [
      "project.settings.manage",
      "project.membership.manage",
      "project.compliance.read",
      "project_version.manage",
      "asset.purge",
    ] as const)
      expect(project_role_has_capability("editor", capability)).toBe(false);
  });

  it("keeps Viewer strictly read-only", () => {
    for (const capability of [
      "project.read",
      "capture.read",
      "artifact.read",
      "publication.read",
    ] as const)
      expect(project_role_has_capability("viewer", capability)).toBe(true);
    for (const capability of capabilities.filter(
      (value) =>
        ![
          "project.read",
          "capture.read",
          "artifact.read",
          "publication.read",
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
