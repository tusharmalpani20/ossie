import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import { build_project_membership_routes } from "./project-membership.routes";

const auth = {
  user: { id: "user-1", email: "admin@example.test", display_name: "Admin" },
  organization: { id: "organization-1", name: "Synthetic" },
  org_user: { id: "admin-1", role: "member" },
  session: { id: "session-1", session_type: "web", expires_at: "2026-08-01T00:00:00.000Z" },
};

describe("project membership routes", () => {
  it("lists the roster and strictly picks assignment input", async () => {
    const list = vi.fn().mockResolvedValue({ members: [] });
    const assign = vi.fn().mockResolvedValue({ id: "membership-1" });
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(cookie);
    await app.register(build_project_membership_routes({
      auth_service: { get_current_auth_context: vi.fn().mockResolvedValue(auth) },
      membership_service: { list, assign, change_role: vi.fn(), remove: vi.fn() },
    }), { prefix: "/api/v1/projects" });
    expect((await app.inject({ method: "GET", url: "/api/v1/projects/project-1/memberships" })).statusCode).toBe(200);
    const response = await app.inject({ method: "POST", url: "/api/v1/projects/project-1/memberships",
      payload: { org_user_id: "member-1", role: "editor", actor_id: "spoofed" } });
    expect(response.statusCode).toBe(201);
    expect(assign).toHaveBeenCalledWith(expect.objectContaining({
      data: { org_user_id: "member-1", role: "editor" },
    }));
  });

  it("requires a positive expected Row Version for removal", async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(cookie);
    await app.register(build_project_membership_routes({
      auth_service: { get_current_auth_context: vi.fn().mockResolvedValue(auth) },
      membership_service: { list: vi.fn(), assign: vi.fn(), change_role: vi.fn(), remove: vi.fn() },
    }), { prefix: "/api/v1/projects" });
    const response = await app.inject({ method: "DELETE", url: "/api/v1/projects/project-1/memberships/membership-1?expected_version=0" });
    expect(response.statusCode).toBe(400);
  });
});
