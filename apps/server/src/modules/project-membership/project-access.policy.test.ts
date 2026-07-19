import { describe, expect, it } from "vitest";
import { project_role_has_capability, project_route_capability, type ProjectCapability } from "./project-access.policy";

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
  "publication.manage",
  "project_version.manage",
  "revision.checkpoint_restore",
  "revision.carry_forward",
  "asset.purge",
];

describe("project access policy", () => {
  it("allows Project Admin every current and accepted future capability seam", () => {
    expect(capabilities.every((capability) =>
      project_role_has_capability("project_admin", capability))).toBe(true);
  });

  it("allows Editor content work and Activity but not Project administration", () => {
    for (const capability of [
      "project.read", "project.activity.read", "capture.read", "capture.write",
      "artifact.read", "artifact.write", "publication.read", "publication.manage",
      "revision.checkpoint_restore", "revision.carry_forward",
    ] as const) expect(project_role_has_capability("editor", capability)).toBe(true);
    for (const capability of [
      "project.settings.manage", "project.membership.manage", "project.compliance.read",
      "project_version.manage", "asset.purge",
    ] as const) expect(project_role_has_capability("editor", capability)).toBe(false);
  });

  it("keeps Viewer strictly read-only", () => {
    for (const capability of [
      "project.read", "capture.read", "artifact.read", "publication.read",
    ] as const) expect(project_role_has_capability("viewer", capability)).toBe(true);
    for (const capability of capabilities.filter((value) => ![
      "project.read", "capture.read", "artifact.read", "publication.read",
    ].includes(value))) expect(project_role_has_capability("viewer", capability)).toBe(false);
  });

  it.each([
    ["GET", "/api/v1/projects/:project_id/capture-sessions", "capture.read"],
    ["POST", "/api/v1/projects/:project_id/capture-sessions", "capture.write"],
    ["GET", "/api/v1/projects/:project_id/guides/:guide_id/export/markdown", "artifact.read"],
    ["PATCH", "/api/v1/projects/:project_id/guides/:guide_id", "artifact.write"],
    ["GET", "/api/v1/projects/:project_id/guides/:guide_id/publish", "publication.read"],
    ["POST", "/api/v1/projects/:project_id/guides/:guide_id/publish", "publication.manage"],
    ["PATCH", "/api/v1/projects/:id", "project.settings.manage"],
  ])("maps %s %s to %s", (method, route, capability) => {
    expect(project_route_capability(method, route)).toBe(capability);
  });

  it("does not apply internal membership to public Publish Link routes", () => {
    expect(project_route_capability("GET", "/api/v1/public/publish-links/:slug")).toBeNull();
  });
});
