import fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { build_documentation_operations_routes } from "./documentation-operations.routes";

const summary = {
  limits: {
    active_sites_limit: null,
    active_pages_limit: null,
    version: 0,
    updated_at: null,
  },
  usage: {
    active_sites: 1,
    active_pages: 2,
    retained_file_bytes: 0,
    retained_revisions: 0,
    retained_publications: 0,
    active_import_inspections: 0,
    open_review_requests: 0,
  },
  states: [
    {
      dimension: "active_sites" as const,
      usage: 1,
      limit: null,
      state: "within_limit" as const,
    },
    {
      dimension: "active_pages" as const,
      usage: 2,
      limit: null,
      state: "within_limit" as const,
    },
    {
      dimension: "retained_file_bytes" as const,
      usage: 0,
      limit: null,
      state: "within_limit" as const,
    },
  ],
  permissions: { can_manage_limits: true },
  generated_at: "2026-07-31T00:00:00.000Z",
};

describe("Documentation operations routes", () => {
  it("returns private aggregate state and validates limit writes", async () => {
    const app = fastify();
    const service = {
      get_summary: vi.fn().mockResolvedValue(summary),
      update_limits: vi.fn().mockResolvedValue({
        limits: { ...summary.limits, version: 1 },
        usage: summary.usage,
        states: summary.states,
      }),
      rebuild_projection: vi.fn(),
    };
    await app.register(
      build_documentation_operations_routes({
        auth_service: {
          get_current_auth_context: vi.fn().mockResolvedValue({
            organization: { id: "org" },
            org_user: { id: "owner", role: "owner" },
          }),
        },
        service,
      }),
    );

    const read = await app.inject({
      method: "GET",
      url: "/api/v1/organization/documentation/operations",
      headers: { authorization: "Bearer test-session" },
    });
    expect(read.statusCode).toBe(200);
    expect(read.headers["cache-control"]).toBe("private, no-store");
    expect(read.json()).toEqual(summary);

    const invalid = await app.inject({
      method: "PUT",
      url: "/api/v1/organization/documentation/limits",
      headers: { authorization: "Bearer test-session" },
      payload: {
        expected_version: 0,
        active_sites_limit: 0,
        active_pages_limit: null,
      },
    });
    expect(invalid.statusCode).toBe(400);
    expect(service.update_limits).not.toHaveBeenCalled();
  });
});
