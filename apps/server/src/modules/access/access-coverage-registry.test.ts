import { describe, expect, it } from "vitest";
import { build } from "../../app";
import {
  ACCESS_ROUTE_COVERAGE_REGISTRY,
  access_route_registration,
} from "./access-coverage-registry";

const normalize_openapi_route = (method: string, path: string) => {
  const parameterized = path.replaceAll(/\{([^}]+)\}/gu, ":$1");
  const full_path = `/api/v1${parameterized}`.replace(/\/$/u, "");
  return `${method.toUpperCase()} ${full_path}`;
};

describe("Access route coverage", () => {
  it("classifies every API operation exactly once", async () => {
    const app = build({ logger: false, readiness_check: async () => undefined });
    try {
      await app.ready();
      const specification = app.swagger() as {
        paths: Record<string, Record<string, unknown>>;
      };
      const actual = Object.entries(specification.paths).flatMap(
        ([path, operations]) =>
          Object.keys(operations)
            .filter((method) =>
              ["get", "post", "put", "patch", "delete"].includes(method),
            )
            .map((method) => normalize_openapi_route(method, path)),
      );
      const registered = ACCESS_ROUTE_COVERAGE_REGISTRY.map(
        ({ method, route_template }) => `${method} ${route_template}`,
      );

      expect([...new Set(registered)].sort()).toEqual([...new Set(actual)].sort());
      expect(registered).toHaveLength(new Set(registered).size);
    } finally {
      await app.close();
    }
  });

  it("does not let internal session-touch commands claim top-level access", () => {
    const project = access_route_registration("POST", "/api/v1/projects");
    const public_read = access_route_registration(
      "GET",
      "/api/v1/public/publish-links/:slug",
    );

    expect(project?.atomic_commands).toContain("project.create");
    expect(project?.atomic_commands).not.toContain("authentication.session.touch");
    expect(public_read?.atomic_commands).not.toContain(
      "publish.viewer_session.touch",
    );
  });

  it("marks transport probes as explicit exclusions", () => {
    expect(
      access_route_registration("GET", "/api/v1/public/instance")?.policy,
    ).toBe("excluded_transport");
  });

  it("classifies extension downloads as authenticated Organization reads", () => {
    expect(
      access_route_registration("GET", "/api/v1/extension/download"),
    ).toMatchObject({
      action: "extension.bundle_downloaded",
      policy: "meaningful_read",
      root_resource_type: "organization",
      authorization_type: "organization_role",
    });
  });

  it("classifies Documentation authoring and public reader access explicitly", () => {
    expect(
      access_route_registration(
        "GET",
        "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/carry-forward-options",
      ),
    ).toMatchObject({
      action: "documentation_carry_forward.options_viewed",
      policy: "meaningful_read",
      root_resource_type: "project",
      authorization_type: "project_role",
    });
    expect(
      access_route_registration(
        "GET",
        "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages",
      ),
    ).toMatchObject({
      action: "documentation_page.list_viewed",
      policy: "meaningful_read",
      root_resource_type: "documentation_site",
      authorization_type: "project_role",
    });
    expect(
      access_route_registration(
        "GET",
        "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id",
      ),
    ).toMatchObject({
      policy: "meaningful_read",
      root_resource_type: "documentation_page",
      root_parameter: "page_id",
      authorization_type: "project_role",
    });
    expect(
      access_route_registration(
        "PUT",
        "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/content",
      ),
    ).toMatchObject({
      policy: "extension_conditional",
      root_resource_type: "documentation_page",
      root_parameter: "page_id",
      authorization_type: "project_role",
    });
    expect(
      access_route_registration(
        "GET",
        "/api/v1/public/publish-links/:slug/documentation/pages/:*",
      ),
    ).toMatchObject({
      policy: "public_access",
      root_resource_type: "publish_link",
      authorization_type: "public_link",
    });
  });
});
