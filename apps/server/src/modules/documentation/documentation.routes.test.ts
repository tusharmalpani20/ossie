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
  authorize_portability: vi.fn(),
  inspect_import: vi.fn(),
  get_import_inspection: vi.fn(),
  cancel_import_inspection: vi.fn(),
  apply_import: vi.fn(),
  export_site_package: vi.fn(),
  export_page_markdown: vi.fn(),
  export_openapi_source: vi.fn(),
  inspect_openapi: vi.fn(),
  apply_openapi_source: vi.fn(),
  get_openapi_source: vi.fn(),
  upload_asset: vi.fn(),
  get_asset_file: vi.fn(),
  get_capture_asset_file: vi.fn(),
  get_public_asset_file: vi.fn(),
  get_public_capture_asset_file: vi.fn(),
  list_snippets: vi.fn(async () => []),
  create_snippet: vi.fn(),
  get_snippet: vi.fn(),
  update_snippet: vi.fn(),
  save_snippet: vi.fn(),
  transition_snippet: vi.fn(),
  list_assets: vi.fn(async () => []),
  update_asset: vi.fn(),
  transition_asset: vi.fn(),
  list_artifact_publications: vi.fn(async () => []),
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
  it("authorizes before streaming one portable Markdown inspection", async () => {
    const order: string[] = [];
    const authorize_portability = vi.fn(async () => {
      order.push("authorize");
    });
    const inspect_import = vi.fn(async (input) => {
      order.push("inspect");
      const chunks: Buffer[] = [];
      for await (const chunk of input.stream)
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      expect(Buffer.concat(chunks).toString("utf8")).toContain("# Start");
      return { id: "inspection", status: "ready" };
    });
    const app = Fastify();
    await app.register(cookie);
    await app.register(multipart);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          authorize_portability,
          inspect_import,
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const boundary = "documentation-import-test";
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-import-inspections?kind=page_markdown",
      cookies: { ossie_session: "session" },
      headers: {
        "idempotency-key": "inspect-1",
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="start.md"\r\nContent-Type: text/markdown\r\n\r\n# Start\r\n\r\nHello\r\n--${boundary}--\r\n`,
      ),
    });
    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      inspection: { id: "inspection", status: "ready" },
    });
    expect(order).toEqual(["authorize", "inspect"]);
    expect(inspect_import).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "page_markdown",
        mime_type: "text/markdown",
        original_name: "start.md",
      }),
    );
  });

  it("returns a replayed import inspection as 200 without exposing replay metadata", async () => {
    const app = Fastify();
    await app.register(cookie);
    await app.register(multipart);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          inspect_import: vi.fn(async (input) => {
            for await (const _chunk of input.stream) {
              // Consume the authorized multipart stream before replying.
            }
            return {
              id: "inspection",
              status: "cancelled",
              idempotent_replay: true,
            };
          }),
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const boundary = "documentation-import-replay-test";
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-import-inspections?kind=page_markdown",
      cookies: { ossie_session: "session" },
      headers: {
        "idempotency-key": "inspect-replay-1",
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="start.md"\r\nContent-Type: text/markdown\r\n\r\n# Start\r\n--${boundary}--\r\n`,
      ),
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      inspection: { id: "inspection", status: "cancelled" },
    });
  });

  it("applies an inspected import through the strict target contract", async () => {
    const apply_import = vi.fn(async () => ({
      id: "application",
      inspection_id: "inspection",
      target_site_id: "site",
      target_edition_id: "edition",
      created_page_id: "page",
      counts: { pages: 1 },
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({ apply_import }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-import-inspections/inspection/apply",
      cookies: { ossie_session: "session" },
      headers: { "idempotency-key": "apply-1" },
      payload: {
        content_fingerprint: "b".repeat(64),
        target: {
          mode: "page",
          site_id: "site",
          expected_draft_version: 3,
          title: "Start",
          canonical_path: "start",
          set_as_home: false,
        },
        external_bindings: [],
        confirm: true,
      },
    });
    await app.close();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      application: { id: "application", inspection_id: "inspection" },
    });
    expect(apply_import).toHaveBeenCalledWith(
      expect.objectContaining({
        inspection_id: "inspection",
        idempotency_key: "apply-1",
        data: expect.objectContaining({
          target: expect.objectContaining({ mode: "page" }),
        }),
      }),
    );
  });

  it("downloads a private no-sniff Markdown export with a safe filename", async () => {
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          export_page_markdown: vi.fn(async () => ({
            bytes: Buffer.from("# Start\n"),
            filename: "start.md",
            mime_type: "text/markdown; charset=utf-8",
          })),
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/pages/page/export/markdown?source=draft&expected_page_version=2&expected_draft_version=4",
      cookies: { ossie_session: "session" },
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("# Start\n");
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["content-disposition"]).toContain("start.md");
  });

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
        entries: [
          { id: "entry", version: 2, site_publication_id: "publication" },
        ],
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
      expect.objectContaining({
        site_id: "site",
        project_version_id: "version",
      }),
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
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/revisions/3",
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
      revision_number: 3,
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

  it("rejects unsafe Page content before it reaches persistence", async () => {
    const save_page = vi.fn();
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({ save_page }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );

    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/pages/page/content",
      cookies: { ossie_session: "session" },
      payload: {
        expected_page_version: 1,
        blocks: [
          {
            id: "01J00000000000000000000001",
            kind: "link",
            label: "Unsafe link",
            url: "ftp://evil.example.test/payload",
            target_block_id: null,
            position: 1,
            expected_version: null,
          },
        ],
      },
    });
    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json().error.type).toBe("documentation_content_unsafe");
    expect(save_page).not.toHaveBeenCalled();
  });

  it("keeps version-scoped redirects and metadata on the selected public entry", async () => {
    process.env.OSSIE_PUBLIC_WEB_URL = "https://docs.example.test";
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
    expect(sitemap.body).toContain(
      "<loc>https://docs.example.test/docs/product-docs/versions/v2/install</loc>",
    );
    expect(robots.statusCode).toBe(200);
    delete process.env.OSSIE_PUBLIC_WEB_URL;
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

  it("addresses immutable Revision history by Edition revision number", async () => {
    const get_revision = vi.fn(async () => ({
      id: "revision",
      revision_number: 7,
    }));
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
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/revisions/7",
      cookies: { ossie_session: "session" },
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(get_revision).toHaveBeenCalledWith(
      expect.objectContaining({ site_id: "site", revision_number: 7 }),
    );
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
    const gifUpload = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/assets",
      cookies: { ossie_session: "session" },
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="animated.gif"\r\nContent-Type: image/gif\r\n\r\ngif\r\n--${boundary}--\r\n`,
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
    expect(gifUpload.statusCode).toBe(415);
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

  it("exposes versioned Snippet, Asset library, and exact Publication workflows", async () => {
    const create_snippet = vi.fn(async () => ({
      id: "snippet",
      name: "Authentication warning",
      status: "active",
      version: 1,
      blocks: [],
    }));
    const save_snippet = vi.fn(async () => ({
      id: "snippet",
      name: "Authentication warning",
      status: "active",
      version: 2,
      blocks: [],
    }));
    const transition_asset = vi.fn(async () => ({
      source: { kind: "documentation_asset", id: "asset" },
      name: "Install",
      status: "archived",
      version: 2,
    }));
    const list_artifact_publications = vi.fn(async () => [
      {
        published_artifact_id: "publication",
        artifact_type: "guide",
        title: "Install guide",
        publication_sequence: 3,
        revision_number: 2,
      },
    ]);
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          create_snippet,
          save_snippet,
          transition_asset,
          list_artifact_publications,
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const root =
      "/api/v1/projects/project/versions/main/documentation-sites/site";
    const created = await app.inject({
      method: "POST",
      url: `${root}/snippets`,
      cookies: { ossie_session: "session" },
      headers: { "idempotency-key": "snippet-create-1" },
      payload: { name: "Authentication warning" },
    });
    const saved = await app.inject({
      method: "PUT",
      url: `${root}/snippets/snippet/content`,
      cookies: { ossie_session: "session" },
      payload: { expected_snippet_version: 1, blocks: [] },
    });
    const archived = await app.inject({
      method: "PATCH",
      url: `${root}/assets/asset/lifecycle`,
      cookies: { ossie_session: "session" },
      payload: { expected_version: 1, transition: "archive" },
    });
    const options = await app.inject({
      method: "GET",
      url: `${root}/artifact-publications?artifact_type=guide`,
      cookies: { ossie_session: "session" },
    });
    const projectOptions = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project/versions/main/documentation-artifact-publications?artifact_type=guide",
      cookies: { ossie_session: "session" },
    });
    const nested = await app.inject({
      method: "PUT",
      url: `${root}/snippets/snippet/content`,
      cookies: { ossie_session: "session" },
      payload: {
        expected_snippet_version: 2,
        blocks: [
          {
            id: "01J00000000000000000000001",
            kind: "snippet_reference",
            snippet_id: "01J00000000000000000000002",
            position: 1,
            expected_version: null,
          },
        ],
      },
    });
    const unsafe = await app.inject({
      method: "PUT",
      url: `${root}/snippets/snippet/content`,
      cookies: { ossie_session: "session" },
      payload: {
        expected_snippet_version: 2,
        blocks: [
          {
            id: "01J00000000000000000000003",
            kind: "link",
            label: "Unsafe link",
            url: "ftp://evil.example.test/payload",
            target_block_id: null,
            position: 1,
            expected_version: null,
          },
        ],
      },
    });
    await app.close();

    expect(created.statusCode).toBe(201);
    expect(saved.statusCode).toBe(200);
    expect(archived.statusCode).toBe(200);
    expect(options.statusCode).toBe(200);
    expect(projectOptions.statusCode).toBe(200);
    expect(options.json().publications[0].published_artifact_id).toBe(
      "publication",
    );
    expect(nested.statusCode).toBe(400);
    expect(unsafe.statusCode).toBe(400);
    expect(unsafe.json().error.type).toBe("documentation_content_unsafe");
    expect(create_snippet).toHaveBeenCalledWith(
      expect.objectContaining({
        site_id: "site",
        idempotency_key: "snippet-create-1",
        data: { name: "Authentication warning" },
      }),
    );
    expect(save_snippet).toHaveBeenCalledWith(
      expect.objectContaining({
        snippet_id: "snippet",
        expected_snippet_version: 1,
      }),
    );
    expect(transition_asset).toHaveBeenCalledWith(
      expect.objectContaining({
        asset_id: "asset",
        expected_version: 1,
        transition: "archive",
      }),
    );
    expect(list_artifact_publications).toHaveBeenCalledTimes(2);
    expect(list_artifact_publications).toHaveBeenLastCalledWith(
      expect.objectContaining({
        artifact_type: "guide",
        project_version_id: "version",
      }),
    );
  });
});
