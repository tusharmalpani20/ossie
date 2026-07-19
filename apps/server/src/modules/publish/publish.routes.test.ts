import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { PublishLinkNotFoundError } from "@repo/publish-domain";
import {
  build_publish_routes,
  type PublishRouteDependencies,
} from "./publish.routes";

describe("relational publication routes", () => {
  it("removes the singular compatibility route and requires Project Version scope", async () => {
    const app = Fastify();
    const list_publications = vi.fn(async () => ({
      publications: [],
      next_before_publication_sequence: null,
    }));
    await app.register(
      build_publish_routes({
        auth_service: {
          get_current_auth_context: vi.fn(async () => ({
            organization: { id: "org_1" },
            org_user: { id: "member_1" },
          })),
        },
        publish_service: { list_publications } as never,
      } as unknown as PublishRouteDependencies),
      { prefix: "/api/v1" },
    );
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/projects/project_1/guides/guide_1/publish",
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/api/v1/projects/project_1/guides/guide_1/publications",
        })
      ).statusCode,
    ).toBe(400);
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/guides/guide_1/publications?project_version_id=pv_1",
    });
    expect(response.statusCode).toBe(200);
    expect(list_publications).toHaveBeenCalledWith(
      expect.objectContaining({
        project_version_id: "pv_1",
        artifact_type: "guide",
      }),
    );
    await app.close();
  });
  it("requires the route-family artifact type on public resolution", async () => {
    const app = Fastify();
    const resolve_public_publish_link = vi.fn();
    await app.register(
      build_publish_routes({
        auth_service: {} as never,
        publish_service: { resolve_public_publish_link } as never,
      } as PublishRouteDependencies),
      { prefix: "/api/v1" },
    );
    expect(
      (await app.inject({ url: "/api/v1/public/publish-links/slug_1" }))
        .statusCode,
    ).toBe(400);
    await app.close();
  });
  it("returns a non-revealing 404 when a public Publish Link is unavailable", async () => {
    const app = Fastify();
    await app.register(
      build_publish_routes({
        auth_service: {} as never,
        publish_service: {
          resolve_public_publish_link: vi.fn(async () => {
            throw new PublishLinkNotFoundError();
          }),
        } as never,
      } as PublishRouteDependencies),
      { prefix: "/api/v1" },
    );
    const response = await app.inject({
      url: "/api/v1/public/publish-links/missing?artifact_type=guide",
    });
    expect(response.statusCode, response.body).toBe(404);
    await app.close();
  });
});
