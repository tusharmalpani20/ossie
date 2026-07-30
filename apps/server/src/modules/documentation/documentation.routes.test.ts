import Fastify from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import {
  build_documentation_routes,
  type DocumentationRouteDependencies,
} from "./documentation.routes";

const auth = {
  user: { id: "user", email: "owner@example.test", display_name: "Owner" },
  organization: { id: "org", name: "Organization" },
  org_user: { id: "actor", role: "owner" },
  session: {
    id: "session",
    session_type: "web",
    expires_at: "2026-07-31T00:00:00.000Z",
  },
};
const documentation_service_stubs = (
  overrides: Partial<
    DocumentationRouteDependencies["documentation_service"]
  > = {},
): DocumentationRouteDependencies["documentation_service"] => ({
  list_sites: vi.fn(async () => []),
  create_site: vi.fn(),
  create_page: vi.fn(),
  get_page: vi.fn(),
  save_page: vi.fn(),
  update_page: vi.fn(),
  replace_navigation: vi.fn(),
  replace_routing: vi.fn(),
  list_comments: vi.fn(async () => []),
  create_comment_thread: vi.fn(),
  create_comment_reply: vi.fn(),
  transition_comment: vi.fn(),
  get_preview: vi.fn(),
  search_draft: vi.fn(async () => []),
  list_revisions: vi.fn(async () => []),
  list_publications: vi.fn(async () => []),
  list_publish_links: vi.fn(async () => []),
  revoke_publish_link: vi.fn(),
  get_revision: vi.fn(),
  create_revision: vi.fn(),
  create_publication: vi.fn(),
  rollback_publication: vi.fn(),
  resolve_public_site: vi.fn(),
  inspect_openapi: vi.fn(),
  apply_openapi_source: vi.fn(),
  get_openapi_source: vi.fn(),
  upload_asset: vi.fn(),
  get_asset_file: vi.fn(),
  get_public_asset_file: vi.fn(),
  ...overrides,
});

const build_test_app = async (overrides?: {
  unauthenticated?: boolean;
  create_site?: DocumentationRouteDependencies["documentation_service"]["create_site"];
}) => {
  const app = Fastify();
  await app.register(cookie);
  await app.register(
    build_documentation_routes({
      auth_service: {
        get_current_auth_context: vi.fn(async () => {
          if (overrides?.unauthenticated) throw new Error("unauthenticated");
          return auth;
        }),
      },
      documentation_service: documentation_service_stubs({
        create_site:
          overrides?.create_site ??
          vi.fn(async () => ({
            site: { id: "site", name: "Product docs" },
            edition: { id: "edition", primary_language: "en-US" },
            working_draft: { id: "draft", version: 2 },
            home_page: { id: "page", canonical_path: "home" },
          })),
      }),
      resolve_project_version: vi.fn(async () => ({ id: "version" })),
    }),
  );
  return app;
};

describe("Documentation routes", () => {
  it("creates one version-scoped Site from a strict request", async () => {
    const create_site = vi.fn(async () => ({
      site: { id: "site", name: "Product docs" },
      edition: { id: "edition", primary_language: "en-US" },
      working_draft: { id: "draft", version: 2 },
      home_page: { id: "page", canonical_path: "home" },
    }));
    const app = await build_test_app({ create_site });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-sites",
      cookies: { ossie_session: "session" },
      headers: { "idempotency-key": "site-create-1" },
      payload: {
        name: "Product docs",
        description: null,
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      },
    });
    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      site: { id: "site" },
      edition: { id: "edition" },
    });
    expect(create_site).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        actor_org_user_id: "actor",
        idempotency_key: "site-create-1",
      }),
    );
  });

  it("lists authorized Sites in the selected Project Version", async () => {
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          list_sites: vi.fn(async () => [
            { id: "site", name: "Product docs", edition_id: "edition" },
          ]),
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project/versions/main/documentation-sites",
      cookies: { ossie_session: "session" },
    });
    await app.close();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      documentation_sites: [
        { id: "site", name: "Product docs", edition_id: "edition" },
      ],
    });
  });

  it("lists exact Publications and stable link entries for portal history", async () => {
    const list_publications = vi.fn(async () => [
      { id: "publication", publication_sequence: 1, revision_number: 1 },
    ]);
    const list_publish_links = vi.fn(async () => [
      {
        id: "link",
        slug: "product-docs",
        entries: [{ id: "entry", version: 2, site_publication_id: "publication" }],
      },
    ]);
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          list_publications,
          list_publish_links,
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const root =
      "/api/v1/projects/project/versions/main/documentation-sites/site";
    const publications = await app.inject({
      method: "GET",
      url: `${root}/publications`,
      cookies: { ossie_session: "session" },
    });
    const links = await app.inject({
      method: "GET",
      url: `${root}/publish-links`,
      cookies: { ossie_session: "session" },
    });
    await app.close();

    expect(publications.statusCode).toBe(200);
    expect(publications.json().publications).toHaveLength(1);
    expect(links.statusCode).toBe(200);
    expect(links.json().publish_links[0].entries[0].version).toBe(2);
    expect(list_publications).toHaveBeenCalledWith(
      expect.objectContaining({ site_id: "site", project_version_id: "version" }),
    );
  });

  it("revokes a version-matched Documentation Publish Link", async () => {
    const revoke_publish_link = vi.fn(async () => ({
      publish_link: { id: "link", status: "revoked", version: 4 },
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          revoke_publish_link,
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/publish-links/link/revoke",
      cookies: { ossie_session: "session" },
      payload: { expected_link_version: 3 },
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json().publish_link.status).toBe("revoked");
    expect(revoke_publish_link).toHaveBeenCalledWith({
      organization_id: "org",
      project_id: "project",
      project_version_id: "version",
      actor_org_user_id: "actor",
      site_id: "site",
      link_id: "link",
      expected_link_version: 3,
    });
  });

  it("scopes Revision reads to the requested version and Site", async () => {
    const get_revision = vi.fn(async () => ({ revision: { id: "revision" } }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({ get_revision }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const response = await app.inject({
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/revisions/revision",
      cookies: { ossie_session: "session" },
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(get_revision).toHaveBeenCalledWith({
      organization_id: "org",
      project_id: "project",
      project_version_id: "version",
      site_id: "site",
      actor_org_user_id: "actor",
      site_revision_id: "revision",
    });
  });

  it("rejects unknown fields and missing idempotency keys", async () => {
    const app = await build_test_app();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-sites",
      cookies: { ossie_session: "session" },
      payload: {
        name: "Docs",
        primary_language: "en",
        unexpected: true,
      },
    });
    await app.close();
    expect(response.statusCode).toBe(400);
    expect(response.json().error.type).toBe("invalid_documentation_request");
  });

  it("creates and independently saves a typed Documentation Page", async () => {
    const create_page = vi.fn(async () => ({
      id: "page",
      title: "Install",
      canonical_path: "install",
      version: 1,
    }));
    const save_page = vi.fn(async () => ({
      id: "page",
      title: "Install",
      canonical_path: "install",
      version: 2,
      blocks: [],
    }));
    const get_page = vi.fn(async () => ({
      id: "page",
      title: "Install",
      canonical_path: "install",
      version: 2,
      blocks: [],
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          create_page,
          get_page,
          save_page,
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/pages",
      cookies: { ossie_session: "session" },
      headers: { "idempotency-key": "page-create-1" },
      payload: {
        title: "Install",
        description: null,
        canonical_path: "install",
      },
    });
    const saved = await app.inject({
      method: "PUT",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/pages/page/content",
      cookies: { ossie_session: "session" },
      payload: { expected_page_version: 1, blocks: [] },
    });
    const loaded = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/pages/page",
      cookies: { ossie_session: "session" },
    });
    await app.close();
    expect(created.statusCode).toBe(201);
    expect(saved.statusCode).toBe(200);
    expect(loaded.statusCode).toBe(200);
    expect(save_page).toHaveBeenCalledWith(
      expect.objectContaining({ page_id: "page", expected_page_version: 1 }),
    );
  });

  it("keeps version-scoped redirects and metadata on the selected public entry", async () => {
    const app = Fastify();
    await app.register(
      build_documentation_routes({
        auth_service: {} as never,
        documentation_service: documentation_service_stubs({
          resolve_public_site: vi.fn(async () => ({
            pages: [{ id: "page", canonical_path: "install" }],
            aliases: [
              { former_path: "old-install", documentation_page_id: "page" },
            ],
            redirects: [],
            openapi_operations: [],
          })),
        }),
        resolve_project_version: vi.fn(),
      }),
    );
    const redirected = await app.inject({
      url: "/api/v1/public/publish-links/product-docs/versions/v2/documentation/pages/old-install",
    });
    const sitemap = await app.inject({
      url: "/api/v1/public/publish-links/product-docs/versions/v2/documentation/sitemap.xml",
    });
    const robots = await app.inject({
      url: "/api/v1/public/publish-links/product-docs/versions/v2/documentation/robots.txt",
    });
    await app.close();
    expect(redirected.headers.location).toBe(
      "/docs/product-docs/versions/v2/install",
    );
    expect(sitemap.statusCode).toBe(200);
    expect(sitemap.body).toContain("/docs/product-docs/versions/v2/install");
    expect(robots.statusCode).toBe(200);
  });

  it("searches only safe saved-draft fields after authorization", async () => {
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          search_draft: vi.fn(async ({ query }) =>
            query === "setup"
              ? [
                  {
                    page_id: "page",
                    title: "Install",
                    excerpt: "Safe setup copy",
                    canonical_path: "install",
                  },
                ]
              : [],
          ),
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const found = await app.inject({
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/search?q=setup",
      cookies: { ossie_session: "session" },
    });
    const absent = await app.inject({
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/search?q=private-comment",
      cookies: { ossie_session: "session" },
    });
    await app.close();
    expect(found.statusCode).toBe(200);
    expect(found.json().results).toHaveLength(1);
    expect(absent.json().results).toEqual([]);
  });

  it("accepts one bounded image and serves only a resolved public Asset", async () => {
    const upload_asset = vi.fn(async () => ({
      id: "asset",
      mime_type: "image/png",
      width: 1,
      height: 1,
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(multipart);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          upload_asset,
          get_public_asset_file: vi.fn(async ({ asset_id }) =>
            asset_id === "asset"
              ? {
                  stream: Readable.from(Buffer.from("image-bytes")),
                  mime_type: "image/png",
                  size_bytes: 11,
                }
              : null,
          ),
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const boundary = "documentation-asset-test";
    const upload = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/assets",
      cookies: { ossie_session: "session" },
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="pixel.png"\r\nContent-Type: image/png\r\n\r\npng\r\n--${boundary}--\r\n`,
      ),
    });
    const download = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/docs/documentation/assets/asset/file",
    });
    const missing = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/docs/documentation/assets/foreign/file",
    });
    await app.close();

    expect(upload.statusCode).toBe(201);
    expect(upload_asset).toHaveBeenCalledWith(
      expect.objectContaining({
        site_id: "site",
        mime_type: "image/png",
        original_name: "pixel.png",
      }),
    );
    expect(download.statusCode).toBe(200);
    expect(download.headers["content-type"]).toBe("image/png");
    expect(missing.statusCode).toBe(404);
  });
});
