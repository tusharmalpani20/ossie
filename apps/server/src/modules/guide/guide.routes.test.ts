import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import {
  build_guide_routes,
  type GuideRouteDependencies,
} from "./guide.routes";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import cookie from "@fastify/cookie";

describe("guide routes", () => {
  it("requires Project Version and returns the Edition list envelope", async () => {
    const list_guides = vi.fn(async () => []);
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(cookie);
    await app.register(
      build_guide_routes({
        auth_service: {
          get_current_auth_context: vi.fn(async () => ({
            organization: { id: "org_1" },
            org_user: { id: "member_1" },
          })),
        },
        guide_service: { list_guides } as never,
        guide_screenshot_upload_service: {} as never,
      } as unknown as GuideRouteDependencies),
      { prefix: "/api/v1/projects" },
    );
    const missing = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides",
    });
    expect(missing.statusCode).toBe(400);
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides?project_version_id=version_2",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ guide_editions: [] });
    expect(list_guides).toHaveBeenCalledWith(
      expect.objectContaining({ project_version_id: "version_2" }),
    );
    await app.close();
  });

  it("maps archived Project Version database guards to the stable read-only contract", async () => {
    const app = Fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(cookie);
    await app.register(
      build_guide_routes({
        auth_service: {
          get_current_auth_context: vi.fn(async () => ({
            organization: { id: "org_1" },
            org_user: { id: "member_1" },
          })),
        },
        guide_service: {
          update_guide_status: vi.fn(async () => {
            throw {
              code: "23514",
              constraint: "artifact_project_version_active_guard",
            };
          }),
        } as never,
        guide_screenshot_upload_service: {} as never,
      } as unknown as GuideRouteDependencies),
      { prefix: "/api/v1/projects" },
    );

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/archive?project_version_id=version_1",
      payload: { expected_edition_version: 1 },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().error.type).toBe("project_version_read_only");
    await app.close();
  });
});
