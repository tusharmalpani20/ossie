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
});
