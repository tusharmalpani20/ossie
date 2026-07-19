import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import { build_project_version_routes } from "./project-version.routes";

const auth = { user: { id: "user_1", email: "admin@example.test", display_name: "Admin" },
  organization: { id: "org_1", name: "Synthetic" }, org_user: { id: "actor_1", role: "member" },
  session: { id: "session_1", session_type: "web", expires_at: "2026-08-01T00:00:00.000Z" } };
const setup = async () => {
  const service = { list: vi.fn(async () => []), create: vi.fn(async () => ({ id: "version_2" })),
    resolve: vi.fn(async () => ({ project_version: { id: "version_1" }, resolution: "alias" })),
    get: vi.fn(async () => ({ id: "version_1" })), update: vi.fn(async () => ({ id: "version_1" })),
    reorder: vi.fn(async () => []), archive: vi.fn(async () => ({ id: "version_1" })),
    restore: vi.fn(async () => ({ id: "version_1" })), set_default: vi.fn(async () => ({ project: {}, project_version: {} })) };
  const app = Fastify(); app.setValidatorCompiler(validatorCompiler); app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie); await app.register(build_project_version_routes({
    auth_service: { get_current_auth_context: vi.fn(async () => auth) }, project_version_service: service as never,
  }), { prefix: "/api/v1/projects" });
  return { app, service };
};

describe("Project Version routes", () => {
  it("registers static resolution and order routes ahead of the id route", async () => {
    const { app, service } = await setup();
    expect((await app.inject({ method: "GET", url: "/api/v1/projects/project_1/versions/resolve/old-main" })).statusCode).toBe(200);
    expect(service.resolve).toHaveBeenCalledWith({ auth: { organization_id: "org_1", actor_org_user_id: "actor_1" },
      project_id: "project_1", slug: "old-main" });
    expect((await app.inject({ method: "PUT", url: "/api/v1/projects/project_1/versions/order",
      payload: { project_versions: [{ id: "version_1", expected_version: 1 }] } })).statusCode).toBe(200);
    expect(service.get).not.toHaveBeenCalled();
  });

  it("strictly validates create and optimistic lifecycle payloads", async () => {
    const { app } = await setup();
    expect((await app.inject({ method: "POST", url: "/api/v1/projects/project_1/versions",
      payload: { name: "Next", spoofed_actor: "actor_2" } })).statusCode).toBe(400);
    expect((await app.inject({ method: "POST", url: "/api/v1/projects/project_1/versions/version_1/archive",
      payload: { expected_version: 0 } })).statusCode).toBe(400);
  });
});
