import Fastify from "fastify";
import cookie from "@fastify/cookie";
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
  list_revisions: vi.fn(async () => []),
  get_revision: vi.fn(),
  create_revision: vi.fn(),
  create_publication: vi.fn(),
  rollback_publication: vi.fn(),
  resolve_public_site: vi.fn(),
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
});
