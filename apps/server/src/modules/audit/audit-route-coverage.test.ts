import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { build } from "../../app";
import {
  AUDIT_COMMANDS,
  AUDIT_COVERAGE_REGISTRY,
} from "./audit-coverage-registry";
import { ACCESS_ROUTE_COVERAGE_REGISTRY } from "../access/access-coverage-registry";

const normalize_openapi_route = (method: string, path: string) => {
  const parameterized = path.replaceAll(/\{([^}]+)\}/gu, ":$1");
  const full_path = `/api/v1${parameterized}`.replace(/\/$/u, "");
  return `${method.toUpperCase()} ${full_path}`;
};

describe("Audit mutation entry-point coverage", () => {
  it("registers every state-changing HTTP route exposed by OpenAPI", async () => {
    const app = build({
      logger: false,
      readiness_check: async () => undefined,
    });
    try {
      await app.ready();
      const specification = app.swagger() as {
        paths: Record<string, Record<string, unknown>>;
      };
      const actual = Object.entries(specification.paths).flatMap(
        ([path, operations]) =>
          Object.keys(operations)
            .filter((method) =>
              ["post", "put", "patch", "delete"].includes(method),
            )
            .map((method) => normalize_openapi_route(method, path)),
      );
      const access_only_routes = new Set(
        ACCESS_ROUTE_COVERAGE_REGISTRY.filter(
          ({ policy }) => policy === "denial_only",
        ).map(({ method, route_template }) => `${method} ${route_template}`),
      );
      const registered = AUDIT_COVERAGE_REGISTRY.flatMap(
        ({ routes }) => routes,
      ).filter((route) => !route.startsWith("GET "));

      expect([...new Set(registered)].sort()).toEqual(
        [
          ...new Set(actual.filter((route) => !access_only_routes.has(route))),
        ].sort(),
      );
    } finally {
      await app.close();
    }
  });

  it("references every semantic command from a production Audit adapter", () => {
    const source_root = new URL("../../", import.meta.url);
    const audit_sources = globSync("**/*.ts", {
      cwd: source_root.pathname,
      exclude: [
        "**/*.test.ts",
        "**/audit-coverage-registry.ts",
        "**/test-support/**",
      ],
    })
      .map((file) => readFileSync(new URL(file, source_root), "utf8"))
      .join("\n");

    expect(
      AUDIT_COMMANDS.filter(
        (command) => !audit_sources.includes(`"${command}"`),
      ),
    ).toEqual([]);
    expect(
      AUDIT_COVERAGE_REGISTRY.filter(({ routes }) => routes.length === 0).map(
        ({ command }) => command,
      ),
    ).toEqual([
      "authentication.session.touch",
      "capture_asset.purge.fail",
      "capture_asset.purge.complete",
      "documentation.import.expire",
    ]);
  });
});
