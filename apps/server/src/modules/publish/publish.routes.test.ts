import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { describe, expect, it, vi } from "vitest";
import {
  PublishLinkNotFoundError,
  PublishLinkRollbackInvalidError,
} from "@repo/publish-domain";
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
  it("resolves the Documentation family from the shared public-link root", async () => {
    const app = Fastify();
    const resolve_public_documentation = vi.fn(async () => ({
      resource_family: "documentation_site",
      revision: { site_name: "Product docs" },
    }));
    await app.register(
      build_publish_routes({
        auth_service: {} as never,
        publish_service: {} as never,
        resolve_public_documentation,
      }),
      { prefix: "/api/v1" },
    );
    const response = await app.inject({
      url: "/api/v1/public/publish-links/product-docs?resource_family=documentation_site",
    });
    expect(response.statusCode).toBe(200);
    expect(resolve_public_documentation).toHaveBeenCalledWith({
      slug: "product-docs",
      version_slug: null,
      viewer_token: undefined,
    });
    await app.close();
  });
  it("creates a shared viewer session for password-protected Documentation", async () => {
    const create_public_documentation_viewer_session = vi.fn(async () => ({
      token: "viewer-token",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_publish_routes({
        auth_service: {} as never,
        publish_service: {
          create_public_documentation_viewer_session,
        } as never,
      }),
      { prefix: "/api/v1" },
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/public/publish-links/product-docs/viewer-sessions?resource_family=documentation_site",
      payload: { password: "safe local password" },
    });
    expect(response.statusCode).toBe(201);
    expect(
      response.cookies.find((cookie) => cookie.name === "ossie_public_viewer"),
    ).toMatchObject({ value: "viewer-token", httpOnly: true });
    expect(create_public_documentation_viewer_session).toHaveBeenCalledWith({
      slug: "product-docs",
      password: "safe local password",
    });
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
  it("maps an invalid rollback direction to the documented conflict response", async () => {
    const app = Fastify();
    await app.register(
      build_publish_routes({
        auth_service: {
          get_current_auth_context: vi.fn(async () => ({
            organization: { id: "org_1" },
            org_user: { id: "member_1" },
          })),
        },
        publish_service: {
          rollback_publish_link_entry: vi.fn(async () => {
            throw new PublishLinkRollbackInvalidError();
          }),
        } as never,
      } as unknown as PublishRouteDependencies),
      { prefix: "/api/v1" },
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/guides/guide_1/publish-links/link_1/entries/entry_1/rollback?project_version_id=version_1",
      payload: {
        expected_link_version: 2,
        target_published_artifact_id: "publication_2",
      },
    });
    expect(response.statusCode, response.body).toBe(409);
    expect(response.json().error.type).toBe("publish_link_rollback_invalid");
    await app.close();
  });
});
