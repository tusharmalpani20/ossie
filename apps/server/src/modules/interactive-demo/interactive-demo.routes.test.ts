import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import {
  build_interactive_demo_routes,
  type InteractiveDemoRouteDependencies,
} from "./interactive-demo.routes";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import cookie from "@fastify/cookie";

describe("interactive demo routes", () => {
  it("requires Project Version for lists and returns Edition envelope", async () => {
    const list_interactive_demos = vi.fn(async () => []);
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(cookie);
    await app.register(
      build_interactive_demo_routes({
        auth_service: {
          get_current_auth_context: vi.fn(async () => ({
            organization: { id: "org_1" },
            org_user: { id: "member_1" },
          })),
        },
        interactive_demo_service: { list_interactive_demos } as never,
      } as unknown as InteractiveDemoRouteDependencies),
      { prefix: "/api/v1/projects" },
    );
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/projects/project_1/interactive-demos",
        })
      ).statusCode,
    ).toBe(400);
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/interactive-demos?project_version_id=version_1",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ interactive_demo_editions: [] });
    await app.close();
  });

  it("maps archived Project Version database guards to the stable read-only contract", async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(cookie);
    await app.register(
      build_interactive_demo_routes({
        auth_service: {
          get_current_auth_context: vi.fn(async () => ({
            organization: { id: "org_1" },
            org_user: { id: "member_1" },
          })),
        },
        interactive_demo_service: {
          update_interactive_demo_status: vi.fn(async () => {
            throw {
              code: "23514",
              constraint: "artifact_project_version_active_guard",
            };
          }),
        } as never,
      } as unknown as InteractiveDemoRouteDependencies),
      { prefix: "/api/v1/projects" },
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/interactive-demos/demo_1/archive?project_version_id=version_1",
      payload: { expected_edition_version: 1 },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().error.type).toBe("project_version_read_only");
    await app.close();
  });
});
