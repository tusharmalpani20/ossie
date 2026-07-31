import fastify from "fastify";
import cookie from "@fastify/cookie";
import { describe, expect, it, vi } from "vitest";
import { build_documentation_review_routes } from "./documentation-review.routes";

const build = async () => {
  const app = fastify();
  await app.register(cookie);
  const service = {
    get_policy: vi.fn().mockResolvedValue({ id: "policy", mode: "optional" }),
    update_policy: vi.fn(),
    list_candidates: vi.fn(),
    create_request: vi.fn(),
    list_requests: vi.fn(),
    get_request: vi.fn(),
    decide: vi.fn().mockResolvedValue({ id: "request", status: "approved" }),
    cancel: vi.fn(),
    preview_gate: vi.fn(),
    list_inbox: vi.fn(),
    mark_read: vi.fn(),
    list_evidence: vi.fn(),
    get_evidence: vi.fn(),
  };
  await app.register(
    build_documentation_review_routes({
      auth_service: {
        get_current_auth_context: vi.fn().mockResolvedValue({
          organization: { id: "org" },
          org_user: { id: "actor" },
        }),
      },
      resolve_project_version: vi.fn().mockResolvedValue({ id: "version" }),
      documentation_review_service: service,
    }),
    { prefix: "/api/v1/projects" },
  );
  return { app, service };
};

describe("documentation review routes", () => {
  it("resolves the version and returns a Site policy", async () => {
    const { app, service } = await build();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project/versions/v1/documentation-sites/site/review-policy",
    });
    expect(response.statusCode).toBe(200);
    expect(service.get_policy).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org",
        project_version_id: "version",
        site_id: "site",
      }),
    );
    await app.close();
  });

  it("requires idempotency and strict decision input", async () => {
    const { app, service } = await build();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/v1/documentation-sites/site/reviews/request/decisions",
      payload: {
        expected_review_request_version: 1,
        decision: "approve",
        reason: null,
      },
    });
    expect(response.statusCode).toBe(400);
    expect(service.decide).not.toHaveBeenCalled();
    await app.close();
  });

  it("uses the typed review error envelope for malformed requests", async () => {
    const { app } = await build();
    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project/versions/v1/documentation-sites/site/review-policy",
      headers: { "idempotency-key": "key" },
      payload: {
        expected_policy_version: 1,
        mode: "optional",
        required_approvals: 1,
        require_maintainer_approval: false,
        maintainer_org_user_ids: [],
        unexpected: true,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.type).toBe(
      "invalid_documentation_review_request",
    );
    await app.close();
  });

  it("maps invariant and gate failures to their planned status classes", async () => {
    const { app, service } = await build();
    service.get_policy.mockRejectedValueOnce(
      Object.assign(new Error("missing"), {
        code: "documentation_review_policy_missing",
      }),
    );
    const invariant = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project/versions/v1/documentation-sites/site/review-policy",
    });
    expect(invariant.statusCode).toBe(500);

    service.get_policy.mockRejectedValueOnce(
      Object.assign(new Error("approval"), {
        code: "documentation_review_approval_required",
      }),
    );
    const gate = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project/versions/v1/documentation-sites/site/review-policy",
    });
    expect(gate.statusCode).toBe(409);
    await app.close();
  });
});
