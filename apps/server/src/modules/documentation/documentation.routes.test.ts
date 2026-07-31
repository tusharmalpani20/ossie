import Fastify from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import {
  build_documentation_routes,
  type DocumentationRouteDependencies,
} from "./documentation.routes";
import {
  current_access_request_context,
  run_with_access_request_context,
} from "../access/access-request-context";

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
  get_discovery_policy: vi.fn(),
  update_discovery_policy: vi.fn(),
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
  list_carry_forward_options: vi.fn(async () => ({ sites: [] })),
  carry_forward: vi.fn(),
  update_edition: vi.fn(),
  transition_edition: vi.fn(),
  list_pages: vi.fn(async () => []),
  transition_page: vi.fn(),
  transition_openapi_source: vi.fn(),
  get_try_it_policy: vi.fn(async () => ({ policy: null })),
  upsert_try_it_policy: vi.fn(),
  get_try_it_configuration: vi.fn(async () => null),
  get_publish_link_try_it_policy: vi.fn(async () => null),
  upsert_publish_link_try_it_policy: vi.fn(),
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
  it("carries selected Sites into the route target Version and returns replay status", async () => {
    const targetVersionId = "01J00000000000000000000002";
    const carry_forward = vi.fn(async () => ({
      carry_forward: {
        id: "01J00000000000000000000004",
        source_project_version_id: "01J00000000000000000000001",
        target_project_version_id: targetVersionId,
        created_by_id: auth.org_user.id,
        created_at: "2026-07-30T00:00:00.000Z",
      },
      items: [],
      replayed: false,
      idempotent_replay: false,
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({ carry_forward }),
        resolve_project_version: vi.fn(async () => ({
          id: targetVersionId,
        })),
      }),
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-sites/carry-forward",
      cookies: { ossie_session: "session" },
      headers: { "idempotency-key": "carry-1" },
      payload: {
        source_project_version_id: "01J00000000000000000000001",
        target_project_version_id: targetVersionId,
        selections: [
          {
            site_id: "01J00000000000000000000003",
            expected_source_edition_version: 2,
            expected_source_draft_version: 4,
          },
        ],
      },
    });
    await app.close();

    expect(response.statusCode).toBe(201);
    expect(carry_forward).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: "project",
        target_project_version_id: targetVersionId,
        idempotency_key: "carry-1",
      }),
    );
  });

  it("returns the accepted 422 contract when a carry graph exceeds its ceiling", async () => {
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          carry_forward: vi.fn(async () => {
            throw Object.assign(new Error("Carry limit exceeded"), {
              code: "documentation_carry_forward_limit_exceeded",
            });
          }),
        }),
        resolve_project_version: vi.fn(async () => ({
          id: "01J00000000000000000000002",
        })),
      }),
    );
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-sites/carry-forward",
      cookies: { ossie_session: "session" },
      headers: { "idempotency-key": "carry-limit" },
      payload: {
        source_project_version_id: "01J00000000000000000000001",
        target_project_version_id: "01J00000000000000000000002",
        selections: [
          {
            site_id: "01J00000000000000000000003",
            expected_source_edition_version: 2,
            expected_source_draft_version: 4,
          },
        ],
      },
    });
    await app.close();

    expect(response.statusCode).toBe(422);
    expect(response.json()).toMatchObject({
      error: { type: "documentation_carry_forward_limit_exceeded" },
    });
  });

  it("validates resource-specific Edition and OpenAPI lifecycle bodies", async () => {
    const transition_edition = vi.fn(async () => ({
      status: "archived",
      version: 3,
    }));
    const transition_openapi_source = vi.fn(async () => ({
      status: "archived",
      version: 5,
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          transition_edition,
          transition_openapi_source,
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const edition = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/edition/lifecycle",
      cookies: { ossie_session: "session" },
      payload: {
        expected_edition_version: 2,
        transition: "archive",
      },
    });
    const openapi = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/openapi/source/lifecycle",
      cookies: { ossie_session: "session" },
      payload: {
        expected_source_version: 4,
        transition: "archive",
      },
    });
    await app.close();

    expect(edition.statusCode).toBe(200);
    expect(openapi.statusCode).toBe(200);
    expect(transition_edition).toHaveBeenCalledWith(
      expect.objectContaining({ expected_edition_version: 2 }),
    );
    expect(transition_openapi_source).toHaveBeenCalledWith(
      expect.objectContaining({ expected_source_version: 4 }),
    );
  });
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
            for await (const chunk of input.stream)
              expect(Buffer.from(chunk)).not.toHaveLength(0);
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

  it("returns bounded Retry-After metadata when import parsing is busy", async () => {
    const app = Fastify();
    await app.register(cookie);
    await app.register(multipart);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          inspect_import: vi.fn(async (input) => {
            for await (const chunk of input.stream)
              expect(Buffer.from(chunk)).not.toHaveLength(0);
            throw Object.assign(new Error("busy"), {
              code: "documentation_import_busy",
              retry_after_seconds: 3,
            });
          }),
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const boundary = "documentation-import-busy-test";
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project/versions/main/documentation-import-inspections?kind=page_markdown",
      cookies: { ossie_session: "session" },
      headers: {
        "idempotency-key": "inspect-busy-1",
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="start.md"\r\nContent-Type: text/markdown\r\n\r\n# Start\r\n--${boundary}--\r\n`,
      ),
    });
    await app.close();

    expect(response.statusCode).toBe(429);
    expect(response.headers["retry-after"]).toBe("3");
    expect(response.json()).toMatchObject({
      error: { type: "documentation_import_busy" },
    });
  });

  it("streams a prepared package and cleans its transient file after delivery", async () => {
    const cleanup = vi.fn(async () => undefined);
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          export_site_package: vi.fn(async () => ({
            stream: Readable.from(Buffer.from("zip bytes")),
            size_bytes: 9,
            filename: "docs-main-documentation-v1.zip",
            mime_type: "application/zip",
            cleanup,
          })),
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/export/package.zip?source=draft&expected_site_version=1&expected_draft_version=2",
      cookies: { ossie_session: "session" },
    });
    expect(response.statusCode).toBe(200);
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
    await app.close();

    expect(response.headers["content-length"]).toBe("9");
    expect(response.body).toBe("zip bytes");
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

  it("returns typed conflicts for required and invalidated review gates", async () => {
    const create_publication = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error("required"), {
          code: "documentation_review_approval_required",
        }),
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("invalidated"), {
          code: "documentation_review_approval_invalidated",
        }),
      );
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          create_publication,
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const request = {
      method: "POST" as const,
      url: "/api/v1/projects/project/versions/main/documentation-sites/site/publications",
      cookies: { ossie_session: "session" },
      headers: { "idempotency-key": "review-gate" },
      payload: {
        revision_id: "revision",
        link: {
          mode: "existing",
          link_id: "link",
          entry_id: "entry",
          expected_entry_version: 1,
        },
      },
    };

    const required = await app.inject(request);
    const invalidated = await app.inject({
      ...request,
      headers: { "idempotency-key": "review-gate-invalidated" },
    });
    await app.close();

    expect(required.statusCode).toBe(409);
    expect(required.json().error.type).toBe(
      "documentation_review_approval_required",
    );
    expect(invalidated.statusCode).toBe(409);
    expect(invalidated.json().error.type).toBe(
      "documentation_review_approval_invalidated",
    );
  });

  it("reads and updates one scoped Publish Link discovery policy", async () => {
    const get_discovery_policy = vi.fn(async () => ({
      publish_link_id: "link",
      indexing_enabled: false,
      is_primary_canonical: false,
      effective_indexing: false,
      effective_reason: "not_primary",
      version: 1,
    }));
    const update_discovery_policy = vi.fn(async () => ({
      publish_link_id: "link",
      indexing_enabled: true,
      is_primary_canonical: true,
      effective_indexing: true,
      effective_reason: "enabled",
      version: 2,
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          get_discovery_policy,
          update_discovery_policy,
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
      }),
    );
    const url =
      "/api/v1/projects/project/versions/main/documentation-sites/site/publish-links/link/discovery-policy";
    const read = await app.inject({
      method: "GET",
      url,
      cookies: { ossie_session: "session" },
    });
    const update = await app.inject({
      method: "PATCH",
      url,
      cookies: { ossie_session: "session" },
      payload: {
        expected_version: 1,
        indexing_enabled: true,
        is_primary_canonical: true,
      },
    });
    await app.close();

    expect(read.statusCode).toBe(200);
    expect(read.headers["cache-control"]).toBe("private, no-store");
    expect(update.statusCode).toBe(200);
    expect(update.json()).toMatchObject({
      effective_indexing: true,
      version: 2,
    });
    expect(update_discovery_policy).toHaveBeenCalledWith(
      expect.objectContaining({
        project_version_id: "version",
        site_id: "site",
        link_id: "link",
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
    const response = await run_with_access_request_context(
      {
        request_id: "revision-read",
        source_type: "web",
        route: null,
        auth: null,
        resolved_resource: null,
        public_surface: null,
        atomic_access_event_id: null,
        response_access_event_id: null,
        authorization: null,
      },
      async () => {
        const injected = await app.inject({
          url: "/api/v1/projects/project/versions/main/documentation-sites/site/revisions/3",
          cookies: { ossie_session: "session" },
        });
        expect(current_access_request_context()?.resolved_resource).toEqual({
          organization_id: "org",
          project_id: "project",
          root_resource_type: "documentation_revision",
          root_resource_id: "revision",
        });
        return injected;
      },
    );
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
    const resolve_public_site = vi.fn(async () => ({
      pages: [{ id: "page", canonical_path: "install" }],
      aliases: [
        { former_path: "old-install", documentation_page_id: "page" },
      ],
      redirects: [],
      openapi_operations: [],
      _discovery: { effective_indexing: true },
    }));
    const app = Fastify();
    await app.register(
      build_documentation_routes({
        auth_service: {} as never,
        documentation_service: documentation_service_stubs({
          resolve_public_site,
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
    expect(resolve_public_site).toHaveBeenCalledWith(
      expect.objectContaining({
        representation: "page",
        page_path: "old-install",
      }),
    );
    expect(resolve_public_site).toHaveBeenCalledWith(
      expect.objectContaining({ representation: "metadata" }),
    );
    delete process.env.OSSIE_PUBLIC_WEB_URL;
  });

  it("serves escaped route-specific initial HTML with CSP, canonical, and ETag", async () => {
    process.env.OSSIE_PUBLIC_WEB_URL = "https://docs.example.test";
    const resolve_public_site = vi.fn(async () => ({
      link: {
        visibility: "public",
        slug: "product-docs",
      },
      site: {
        id: "site",
        name: 'Product <script>alert("x")</script>',
        description: "Safe docs",
      },
      edition: { primary_language: "en-US" },
      revision: { primary_language: "en-US" },
      working_draft: { home_page_id: "page" },
      publication: { output_digest: "a".repeat(64) },
      pages: [
        {
          id: "page",
          title: "Install & configure",
          description: 'Never render "raw" metadata',
          canonical_path: "install",
          blocks: [{ kind: "paragraph", text: "Run the installer." }],
        },
      ],
      aliases: [],
      redirects: [],
      openapi_operations: [],
      _discovery: {
        effective_indexing: true,
        primary_slug: "product-docs",
      },
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        public_assets: {
          scripts: ["/assets/app.js"],
          styles: ["/assets/app.css"],
          asset_base: "/",
          production: true,
        },
        auth_service: {} as never,
        documentation_service: documentation_service_stubs({
          resolve_public_site,
        }),
        resolve_project_version: vi.fn(),
      }),
    );
    const response = await app.inject({ url: "/docs/product-docs/install" });
    const notModified = await app.inject({
      url: "/docs/product-docs/install",
      headers: { "if-none-match": response.headers.etag! },
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-security-policy"]).toContain(
      "script-src 'self'",
    );
    expect(response.body).toContain("<title>Install &amp; configure");
    expect(response.body).toContain(
      '<link rel="canonical" href="https://docs.example.test/docs/product-docs/install">',
    );
    expect(response.body).toContain('src="/assets/app.js"');
    expect(response.body).not.toContain("<script>alert");
    expect(notModified.statusCode).toBe(304);
    expect(resolve_public_site).toHaveBeenCalledTimes(2);
    expect(resolve_public_site).toHaveBeenCalledWith(
      expect.objectContaining({
        representation: "page",
        page_path: "install",
      }),
    );
    delete process.env.OSSIE_PUBLIC_WEB_URL;
  });

  it("falls back to a bounded noindex shell when route-specific HTML is oversized", async () => {
    process.env.OSSIE_PUBLIC_WEB_URL = "https://docs.example.test";
    const oversizedMarker = `private-${"x".repeat(4_000)}`;
    const resolve_public_site = vi.fn(async () => ({
      link: { visibility: "public", slug: "product-docs" },
      site: { id: "site", name: "Product docs", description: "Safe docs" },
      edition: { primary_language: "en-US" },
      revision: { primary_language: "en-US" },
      working_draft: { home_page_id: "page" },
      publication: { output_digest: "a".repeat(64) },
      pages: [
        {
          id: "page",
          title: `Install ${"T".repeat(4_000)}`,
          description: "Install safely",
          canonical_path: "install",
          blocks: [{ kind: "paragraph", text: oversizedMarker }],
        },
      ],
      aliases: [],
      redirects: [],
      openapi_operations: [],
      _discovery: { effective_indexing: true, primary_slug: "product-docs" },
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        initial_html_max_bytes: 2_000,
        public_assets: {
          scripts: ["/assets/app.js"],
          styles: [],
          asset_base: "/",
          production: true,
        },
        auth_service: {} as never,
        documentation_service: documentation_service_stubs({
          resolve_public_site,
        }),
        resolve_project_version: vi.fn(),
      }),
    );

    const response = await app.inject({ url: "/docs/product-docs/install" });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(Buffer.byteLength(response.body, "utf8")).toBeLessThanOrEqual(2_000);
    expect(response.body).toContain(
      '<meta name="robots" content="noindex,nofollow">',
    );
    expect(response.body).toContain("Content loads in the application.");
    expect(response.body).toContain(`"output_digest":"${"a".repeat(64)}"`);
    expect(response.body).not.toContain(oversizedMarker);
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

  it("projects public Site and operation responses without repository-only OpenAPI fields", async () => {
    const descriptor = {
      descriptor_version: 1,
      destination_key: "get-pets",
      method: "GET",
      path: "/pets",
      summary: "List pets",
      parameters: [],
      request_body: null,
      security: { bearer: true, api_key_header_names: ["X-Api-Key"] },
      unsupported_reasons: [],
    };
    const app = Fastify();
    await app.register(
      build_documentation_routes({
        auth_service: {} as never,
        documentation_service: documentation_service_stubs({
          resolve_public_site: vi.fn(async () => ({
            site: { id: "site", name: "Docs" },
            edition: { id: "edition", title: "Docs" },
            working_draft: { home_page_id: "page" },
            revision: {
              site_name: "Docs",
              site_description: null,
              primary_language: "en-US",
              home_page_id: "page",
              file_id: "private-file",
              content_digest: "private-digest",
            },
            publication: {
              id: "publication",
              publication_sequence: 2,
              output_digest: "public-output-digest",
              internal_note: "private publication note",
            },
            pages: [],
            navigation: { nodes: [] },
            routing: { aliases: [], rules: [] },
            aliases: [],
            redirects: [],
            snippets: [],
            assets: [
              {
                id: "asset",
                name: "Image",
                source_kind: "documentation_asset",
                storage_key: "private/key",
                file_id: "private-file",
              },
            ],
            openapi_source: {
              id: "source",
              file_id: "private-file",
              digest: "private-digest",
              server_candidates: ["https://unapproved.example.com"],
            },
            openapi_operations: [
              {
                id: "operation-row",
                openapi_source_id: "source",
                descriptor_digest: "private-digest",
                request_descriptor: descriptor,
                ...descriptor,
              },
            ],
            search_documents: [{ search_text: "private index" }],
            frozen_policy: { approved_origin: "https://api.example.com" },
          })),
        }),
        resolve_project_version: vi.fn(),
      }),
    );
    const root = await app.inject({
      url: "/api/v1/public/publish-links/docs/documentation",
    });
    const operation = await app.inject({
      url: "/api/v1/public/publish-links/docs/documentation/operations/get-pets",
    });
    await app.close();

    expect(root.statusCode).toBe(200);
    expect(root.body).not.toContain("private-file");
    expect(root.body).not.toContain("private-digest");
    expect(root.body).not.toContain("unapproved.example.com");
    expect(root.body).not.toContain("api.example.com");
    expect(root.body).not.toContain("private publication note");
    expect(root.json()).toMatchObject({
      publication: {
        id: "publication",
        publication_sequence: 2,
        output_digest: "public-output-digest",
      },
    });
    expect(operation.statusCode).toBe(200);
    expect(operation.json()).toEqual({
      operation: {
        destination_key: descriptor.destination_key,
        method: descriptor.method,
        path: descriptor.path,
        summary: descriptor.summary,
        descriptor_version: 1,
        request_descriptor: descriptor,
      },
    });
  });

  it("exposes a secret-free public configuration and accepts only content-free reports", async () => {
    const originalEnv = { ...process.env };
    process.env.COOKIE_SECRET = "test-cookie-secret-that-is-at-least-32-bytes";
    process.env.OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS =
      "https://api.example.com";
    const descriptor = {
      descriptor_version: 1,
      destination_key: "get-pets",
      method: "GET",
      path: "/pets",
      summary: "List pets",
      parameters: [],
      request_body: null,
      security: { bearer: true, api_key_header_names: [] },
      unsupported_reasons: [],
    };
    const resolve_public_site = vi.fn(async () => ({
      link: {
        id: "link",
        organization_id: "organization",
        project_id: "project",
      },
      entry: { id: "entry" },
      publication: { id: "publication" },
      pages: [],
      aliases: [],
      redirects: [],
      openapi_operations: [
        {
          destination_key: "get-pets",
          request_descriptor: descriptor,
        },
      ],
      _try_it: {
        frozen_policy_id: "frozen-policy",
        link_policy_id: "link-policy",
        approved_origin: "https://api.example.com",
        base_path: "/v1",
        allow_bearer: true,
        api_key_header_name: null,
        operation_destination_keys: ["get-pets"],
      },
    }));
    const app = Fastify();
    const append_access_event = vi.fn(async () => undefined);
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: {} as never,
        documentation_service: documentation_service_stubs({
          resolve_public_site,
        }),
        resolve_project_version: vi.fn(),
        validate_try_it_origin: vi.fn(async ({ origin }) => origin),
        access_event_writer: { append: append_access_event },
      }),
    );
    const root =
      "/api/v1/public/publish-links/docs/documentation/operations/get-pets";
    const configuration = await app.inject({
      url: `${root}/try-it-configuration`,
    });
    expect(configuration.statusCode).toBe(200);
    expect(configuration.headers["cache-control"]).toBe("private, no-store");
    expect(configuration.headers.vary).toContain("Cookie");
    expect(configuration.json()).toMatchObject({
      surface: "public",
      approved_origin: "https://api.example.com",
      base_path: "/v1",
      operation: descriptor,
      allowed_credential_modes: ["none", "bearer"],
    });
    expect(configuration.body).not.toContain("test-cookie-secret");

    const report = await app.inject({
      method: "POST",
      url: `${root}/try-it-attempts`,
      payload: {
        attempt_token: configuration.json().attempt_token,
        outcome: "completed",
      },
    });
    const leakingReport = await app.inject({
      method: "POST",
      url: `${root}/try-it-attempts`,
      payload: {
        attempt_token: configuration.json().attempt_token,
        outcome: "completed",
        target_status: 200,
      },
    });
    await app.close();
    process.env = originalEnv;
    expect(report.statusCode, report.body).toBe(204);
    expect(leakingReport.statusCode).toBe(400);
    expect(append_access_event).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "documentation.try_it.attempt_completed",
        request_id: null,
        http_method: null,
        route_template: null,
      }),
    );
  });

  it("reports an internal attempt against the same immutable Revision selection", async () => {
    const originalEnv = { ...process.env };
    process.env.COOKIE_SECRET = "test-cookie-secret-that-is-at-least-32-bytes";
    process.env.OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS =
      "https://api.example.com";
    const descriptor = {
      descriptor_version: 1,
      destination_key: "get-pets",
      method: "GET",
      path: "/pets",
      summary: "List pets",
      parameters: [],
      request_body: null,
      security: { bearer: false, api_key_header_names: [] },
      unsupported_reasons: [],
    };
    const get_try_it_configuration = vi.fn(async () => ({
      policy_id: "policy",
      policy_version: 2,
      approved_origin: "https://api.example.com",
      base_path: "/v1",
      allow_bearer: false,
      api_key_header_name: null,
      request_descriptor: descriptor,
    }));
    const app = Fastify();
    await app.register(cookie);
    await app.register(
      build_documentation_routes({
        auth_service: { get_current_auth_context: vi.fn(async () => auth) },
        documentation_service: documentation_service_stubs({
          get_try_it_configuration,
        }),
        resolve_project_version: vi.fn(async () => ({ id: "version" })),
        validate_try_it_origin: vi.fn(async ({ origin }) => origin),
        access_event_writer: { append: vi.fn(async () => undefined) },
      }),
    );
    const root =
      "/api/v1/projects/project/versions/main/documentation-sites/site/openapi/operations/get-pets";
    const selection = "source=revision&revision_number=3";
    const configuration = await app.inject({
      url: `${root}/try-it-configuration?${selection}`,
      cookies: { ossie_session: "session" },
    });
    const report = await app.inject({
      method: "POST",
      url: `${root}/try-it-attempts?${selection}`,
      cookies: { ossie_session: "session" },
      payload: {
        attempt_token: configuration.json().attempt_token,
        outcome: "completed",
      },
    });
    await app.close();
    process.env = originalEnv;

    expect(configuration.statusCode).toBe(200);
    expect(report.statusCode, report.body).toBe(204);
    expect(get_try_it_configuration).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        source: "revision",
        revision_number: 3,
      }),
    );
  });
});
