import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import { build_project_activity_routes } from "./project-activity.routes";

describe("Project Activity routes", () => {
  it("passes only the authenticated tenant, actor, path Project, and bounded query", async () => {
    const list = vi.fn().mockResolvedValue({ events: [], page: { next_cursor: null, has_more: false } });
    const app = Fastify(); app.setValidatorCompiler(validatorCompiler); app.setSerializerCompiler(serializerCompiler); await app.register(cookie);
    await app.register(build_project_activity_routes({
      auth_service: { get_current_auth_context: vi.fn().mockResolvedValue({ user: { id: "user-1", email: "e@example.test", display_name: "Editor" }, organization: { id: "org-1", name: "Org" }, org_user: { id: "editor-1", role: "member" }, session: { id: "session-1", session_type: "web", expires_at: "2026-08-01T00:00:00.000Z" } }) },
      activity_service: { list },
    }), { prefix: "/api/v1/projects" });
    const response = await app.inject({ method: "GET", url: "/api/v1/projects/project-1/activity?limit=10" });
    expect(response.statusCode).toBe(200);
    expect(list).toHaveBeenCalledWith({ auth: { organization_id: "org-1", actor_org_user_id: "editor-1" }, project_id: "project-1", query: { limit: 10 } });
  });
});
