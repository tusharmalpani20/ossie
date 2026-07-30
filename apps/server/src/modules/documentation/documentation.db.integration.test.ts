import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import {
  reset_test_database,
  with_maintenance_client,
} from "../../test-support/database";
import { build_documentation_repository } from "./documentation.repository";

const multipart_file = (filename: string, mime_type: string, bytes: Buffer) => {
  const boundary = "ossie-documentation-openapi-boundary";
  return {
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime_type}\r\n\r\n`,
      ),
      bytes,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]),
  };
};

const establish_project = async () => {
  const app = build({ logger: false });
  const setup = await app.inject({
    method: "POST",
    url: "/api/v1/setup/first-run",
    payload: {
      owner: {
        email: "documentation-owner@example.test",
        password: "safe local password",
        first_name: "Docs",
        last_name: "Owner",
      },
      organization: { name: "Documentation Test" },
    },
  });
  expect(setup.statusCode).toBe(201);
  const session = setup.cookies.find(
    (cookie) => cookie.name === "ossie_session",
  )?.value;
  const project = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: { ossie_session: session ?? "" },
    payload: { name: "Product" },
  });
  expect(project.statusCode).toBe(201);
  const actor = await pool.query<{
    organization_id: string;
    actor_org_user_id: string;
  }>(
    `SELECT organization_id,id actor_org_user_id
       FROM organization_schema.org_user WHERE role='owner'`,
  );
  await app.close();
  return {
    organization_id: actor.rows[0]!.organization_id,
    actor_org_user_id: actor.rows[0]!.actor_org_user_id,
    project_id: project.json().project.id as string,
    project_version_id: project.json().project.default_project_version
      .id as string,
    session_token: session ?? "",
  };
};

describe("DB-backed Documentation repository", () => {
  beforeEach(reset_test_database);
  afterAll(() => pool.end());

  it("atomically persists one Site, Edition, Working Draft, and Home Page", async () => {
    const scope = await establish_project();
    const repository = build_documentation_repository(pool);
    const created = await repository.create_site({
      ...scope,
      idempotency_key: "docs-create-1",
      name: "Product docs",
      description: null,
      primary_language: "en-US",
      initial_home_page: { title: "Home", path: "home" },
    });

    expect(created).toMatchObject({
      site: { name: "Product docs" },
      edition: { primary_language: "en-US" },
      working_draft: { version: 2 },
      home_page: { canonical_path: "home" },
    });
    const counts = await pool.query<{
      sites: string;
      editions: string;
      drafts: string;
      pages: string;
    }>(`
      SELECT
        (SELECT count(*) FROM documentation_schema.documentation_site) sites,
        (SELECT count(*) FROM documentation_schema.site_edition) editions,
        (SELECT count(*) FROM documentation_schema.site_working_draft) drafts,
        (SELECT count(*) FROM documentation_schema.documentation_page) pages
    `);
    expect(counts.rows[0]).toEqual({
      sites: "1",
      editions: "1",
      drafts: "1",
      pages: "1",
    });
  });

  it("persists Edition-owned Snippets and expanded Page blocks with independent conflicts", async () => {
    const scope = await establish_project();
    const app = build({ logger: false });
    const site = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "content-workflow-site" },
      payload: {
        name: "Content workflows",
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      },
    });
    expect(site.statusCode).toBe(201);
    const root = `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${site.json().site.id}`;
    const snippet = await app.inject({
      method: "POST",
      url: `${root}/snippets`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "snippet-create-db" },
      payload: { name: "Authentication warning" },
    });
    expect(snippet.statusCode).toBe(201);
    const snippetId = snippet.json().id as string;
    const snippetSaved = await app.inject({
      method: "PUT",
      url: `${root}/snippets/${snippetId}/content`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_snippet_version: 1,
        blocks: [
          {
            id: "01J00000000000000000000101",
            kind: "callout",
            tone: "warning",
            title: "Keep credentials private",
            text: "Never paste **secrets**.",
            position: 1,
            expected_version: null,
          },
          {
            id: "01J00000000000000000000102",
            kind: "tabs",
            position: 2,
            expected_version: null,
            items: [
              {
                id: "01J00000000000000000000103",
                label: "npm",
                body: "`npm install`",
                position: 1,
                expected_version: null,
              },
              {
                id: "01J00000000000000000000104",
                label: "pnpm",
                body: "`pnpm add`",
                position: 2,
                expected_version: null,
              },
            ],
          },
        ],
      },
    });
    expect(snippetSaved.statusCode).toBe(200);
    const page = await app.inject({
      method: "POST",
      url: `${root}/pages`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "content-workflow-page" },
      payload: {
        title: "Install",
        description: null,
        canonical_path: "install",
      },
    });
    expect(page.statusCode).toBe(201);
    const pageId = page.json().page.id as string;
    const pageSaved = await app.inject({
      method: "PUT",
      url: `${root}/pages/${pageId}/content`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_page_version: 1,
        blocks: [
          {
            id: "01J00000000000000000000105",
            kind: "quote",
            text: "Ship small slices.",
            attribution: "Ossie",
            position: 1,
            expected_version: null,
          },
          {
            id: "01J00000000000000000000106",
            kind: "table",
            caption: "Package commands",
            position: 2,
            expected_version: null,
            rows: [
              {
                id: "01J00000000000000000000107",
                position: 1,
                expected_version: null,
                cells: [
                  {
                    id: "01J00000000000000000000108",
                    column_position: 1,
                    expected_version: null,
                    is_header: true,
                    text: "Manager",
                  },
                  {
                    id: "01J00000000000000000000109",
                    column_position: 2,
                    expected_version: null,
                    is_header: true,
                    text: "Command",
                  },
                ],
              },
              {
                id: "01J0000000000000000000010A",
                position: 2,
                expected_version: null,
                cells: [
                  {
                    id: "01J0000000000000000000010B",
                    column_position: 1,
                    expected_version: null,
                    is_header: false,
                    text: "pnpm",
                  },
                  {
                    id: "01J0000000000000000000010C",
                    column_position: 2,
                    expected_version: null,
                    is_header: false,
                    text: "`pnpm add`",
                  },
                ],
              },
            ],
          },
          {
            id: "01J0000000000000000000010D",
            kind: "snippet_reference",
            snippet_id: snippetId,
            position: 3,
            expected_version: null,
          },
        ],
      },
    });
    expect(pageSaved.statusCode, pageSaved.body).toBe(200);
    const loaded = await app.inject({
      url: `${root}/pages/${pageId}`,
      cookies: { ossie_session: scope.session_token },
    });
    expect(loaded.statusCode).toBe(200);
    expect(loaded.json().page.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "table",
          caption: "Package commands",
          rows: expect.arrayContaining([
            expect.objectContaining({ cells: expect.any(Array) }),
          ]),
        }),
        expect.objectContaining({
          kind: "snippet_reference",
          snippet_id: snippetId,
        }),
      ]),
    );
    const snippetChanged = await app.inject({
      method: "PUT",
      url: `${root}/snippets/${snippetId}/content`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_snippet_version: 2,
        blocks: [
          {
            id: "01J0000000000000000000010E",
            kind: "paragraph",
            text: "Updated shared text.",
            position: 1,
            expected_version: null,
          },
        ],
      },
    });
    expect(snippetChanged.statusCode).toBe(200);
    const pageAfterSnippet = await app.inject({
      url: `${root}/pages/${pageId}`,
      cookies: { ossie_session: scope.session_token },
    });
    expect(pageAfterSnippet.json().page.version).toBe(2);
    await app.close();
  });

  it("exposes the authorized version-scoped Site creation API", async () => {
    const scope = await establish_project();
    const app = build({ logger: false });
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "site-create-route-1" },
      payload: {
        name: "Product docs",
        description: null,
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      site: { name: "Product docs" },
      edition: { primary_language: "en-US" },
      home_page: { canonical_path: "home" },
    });
    const replay = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "site-create-route-1" },
      payload: {
        name: "Product docs",
        description: null,
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      },
    });
    expect(replay.statusCode).toBe(200);
    expect(replay.json().site.id).toBe(response.json().site.id);
    const mismatchedReplay = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "site-create-route-1" },
      payload: {
        name: "Different docs",
        description: null,
        primary_language: "en-US",
      },
    });
    expect(mismatchedReplay.statusCode).toBe(409);
    const list = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites`,
      cookies: { ossie_session: scope.session_token },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().documentation_sites).toHaveLength(1);
    const page = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "page-create-route-1" },
      payload: {
        title: "Install",
        description: null,
        canonical_path: "install",
      },
    });
    expect(page.statusCode).toBe(201);
    const saved = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages/${page.json().page.id}/content`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_page_version: 1,
        blocks: [
          {
            id: "01J00000000000000000000001",
            kind: "paragraph",
            position: 1,
            expected_version: null,
            text: "Install Ossie safely.",
          },
          {
            id: "01J00000000000000000000002",
            kind: "ordered_list",
            position: 2,
            expected_version: null,
            items: [
              {
                id: "01J00000000000000000000003",
                text: "Create a Project.",
                position: 1,
                expected_version: null,
              },
            ],
          },
        ],
      },
    });
    expect(saved.statusCode, saved.body).toBe(200);
    expect(saved.json().page.version).toBe(2);
    const loaded = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages/${page.json().page.id}`,
      cookies: { ossie_session: scope.session_token },
    });
    expect(loaded.statusCode).toBe(200);
    expect(loaded.json().page.blocks).toEqual([
      {
        id: "01J00000000000000000000001",
        kind: "paragraph",
        position: 1,
        expected_version: 1,
        text: "Install Ossie safely.",
      },
      {
        id: "01J00000000000000000000002",
        kind: "ordered_list",
        position: 2,
        expected_version: 1,
        items: [
          {
            id: "01J00000000000000000000003",
            text: "Create a Project.",
            position: 1,
            expected_version: 1,
          },
        ],
      },
    ]);
    const secondPage = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "page-create-route-2" },
      payload: {
        title: "Reference",
        description: null,
        canonical_path: "reference",
      },
    });
    expect(secondPage.statusCode).toBe(201);
    const renamed = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages/${page.json().page.id}`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_version: 2,
        canonical_path: "install-guide",
        keywords: ["install", "setup"],
      },
    });
    expect(renamed.statusCode).toBe(200);
    const navigation = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/navigation`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_version: 1,
        nodes: [
          {
            id: "01J00000000000000000000004",
            parent_id: null,
            kind: "page",
            label: null,
            page_id: page.json().page.id,
            position: 1,
            expected_version: null,
          },
          {
            id: "01J00000000000000000000005",
            parent_id: null,
            kind: "page",
            label: null,
            page_id: secondPage.json().page.id,
            position: 2,
            expected_version: null,
          },
        ],
      },
    });
    expect(navigation.statusCode).toBe(200);
    const routing = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/routing`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_version: 1,
        rules: [
          {
            id: "01J00000000000000000000006",
            source_path: "setup",
            outcome: "redirect",
            target_page_id: secondPage.json().page.id,
            expected_version: null,
          },
          {
            id: "01J00000000000000000000007",
            source_path: "obsolete",
            outcome: "gone",
            target_page_id: null,
            expected_version: null,
          },
        ],
      },
    });
    expect(routing.statusCode).toBe(200);
    expect(routing.json().routing.aliases).toEqual([
      expect.objectContaining({
        former_path: "install",
        documentation_page_id: page.json().page.id,
      }),
    ]);
    const openapiDocument = Buffer.from(
      JSON.stringify({
        openapi: "3.1.0",
        info: { title: "Product API", version: "1.0.0" },
        paths: {
          "/widgets": {
            get: {
              operationId: "listWidgets",
              summary: "List widgets",
              responses: { "200": { description: "OK" } },
            },
          },
        },
      }),
    );
    const inspection = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/openapi/inspections`,
      cookies: { ossie_session: scope.session_token },
      ...multipart_file("openapi.json", "application/json", openapiDocument),
    });
    expect(inspection.statusCode).toBe(201);
    expect(inspection.json().inspection).toMatchObject({
      openapi_version: "3.1.0",
      operation_count: 1,
    });
    expect(JSON.stringify(inspection.json())).not.toContain('"paths"');
    const appliedSource = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/openapi/sources`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "openapi-apply-route-1" },
      payload: {
        inspection_id: inspection.json().inspection.id,
        expected_source_version: null,
      },
    });
    expect(appliedSource.statusCode).toBe(201);
    expect(appliedSource.json().operations).toEqual([
      expect.objectContaining({
        destination_key: "get-widgets-listwidgets",
      }),
    ]);
    const comment = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages/${page.json().page.id}/comments`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "comment-create-route-1" },
      payload: {
        body: "Please clarify this installation step.",
        block_anchor_id: "01J00000000000000000000001",
        mentioned_project_membership_ids: [],
      },
    });
    expect(comment.statusCode).toBe(201);
    const reply = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/comments/${comment.json().thread.id}/replies`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "comment-reply-route-1" },
      payload: {
        body: "Clarified in the latest saved draft.",
        mentioned_project_membership_ids: [],
      },
    });
    expect(reply.statusCode).toBe(201);
    const resolved = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/comments/${comment.json().thread.id}`,
      cookies: { ossie_session: scope.session_token },
      payload: { expected_version: 1, transition: "resolve" },
    });
    expect(resolved.statusCode).toBe(200);
    const reopened = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/comments/${comment.json().thread.id}`,
      cookies: { ossie_session: scope.session_token },
      payload: { expected_version: 2, transition: "reopen" },
    });
    expect(reopened.statusCode).toBe(200);
    const linked = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages/${page.json().page.id}/content`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_page_version: 3,
        blocks: [
          {
            id: "01J00000000000000000000001",
            kind: "paragraph",
            position: 1,
            expected_version: 1,
            text: "Install Ossie safely.",
          },
          {
            id: "01J00000000000000000000008",
            kind: "link",
            position: 2,
            expected_version: null,
            label: "Read the reference",
            page_id: secondPage.json().page.id,
          },
          {
            id: "01J00000000000000000000009",
            kind: "api_reference",
            position: 3,
            expected_version: null,
            openapi_source_id: appliedSource.json().source.id,
            operation_key: "get-widgets-listwidgets",
          },
        ],
      },
    });
    expect(linked.statusCode).toBe(200);
    const preview = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/preview`,
      cookies: { ossie_session: scope.session_token },
    });
    expect(preview.statusCode).toBe(200);
    const revision1 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/revisions`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "revision-route-1" },
      payload: {
        expected_draft_version: preview.json().preview.working_draft.version,
      },
    });
    expect(revision1.statusCode, revision1.body).toBe(201);
    const publication1 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/publications`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "publication-route-1" },
      payload: {
        revision_id: revision1.json().revision.id,
        link: {
          mode: "create",
          name: "Product docs",
          slug: "product-docs",
          visibility: "public",
        },
      },
    });
    expect(publication1.statusCode).toBe(201);
    const publicBefore = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/product-docs/documentation/pages/install-guide",
    });
    expect(publicBefore.statusCode).toBe(200);
    expect(publicBefore.json().page).toMatchObject({
      id: page.json().page.id,
      canonical_path: "install-guide",
    });
    expect(JSON.stringify(publicBefore.json())).not.toContain(
      "Please clarify this installation step.",
    );
    const passwordPublication = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/publications`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "publication-route-password" },
      payload: {
        revision_id: revision1.json().revision.id,
        link: {
          mode: "create",
          name: "Protected Product docs",
          slug: "protected-product-docs",
          visibility: "public",
          password: "safe local password",
        },
      },
    });
    expect(passwordPublication.statusCode).toBe(201);
    expect(
      (
        await app.inject({
          url: "/api/v1/public/publish-links/protected-product-docs/documentation/pages/install-guide",
        })
      ).statusCode,
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/public/publish-links/protected-product-docs/viewer-sessions?resource_family=documentation_site",
          payload: { password: "wrong password" },
        })
      ).statusCode,
    ).toBe(400);
    const viewerSession = await app.inject({
      method: "POST",
      url: "/api/v1/public/publish-links/protected-product-docs/viewer-sessions?resource_family=documentation_site",
      payload: { password: "safe local password" },
    });
    expect(viewerSession.statusCode).toBe(201);
    const viewerToken = viewerSession.cookies.find(
      (cookie) => cookie.name === "ossie_public_viewer",
    )?.value;
    expect(
      (
        await app.inject({
          url: "/api/v1/public/publish-links/protected-product-docs/documentation/pages/install-guide",
          cookies: { ossie_public_viewer: viewerToken ?? "" },
        })
      ).statusCode,
    ).toBe(200);
    const revokedPublication = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/publish-links/${passwordPublication.json().link.id}/revoke`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_link_version: passwordPublication.json().link.version,
      },
    });
    expect(revokedPublication.statusCode).toBe(200);
    expect(revokedPublication.json().publish_link).toMatchObject({
      status: "revoked",
      version: passwordPublication.json().link.version + 1,
    });
    expect(
      (
        await app.inject({
          url: "/api/v1/public/publish-links/protected-product-docs/documentation/pages/install-guide",
          cookies: { ossie_public_viewer: viewerToken ?? "" },
        })
      ).statusCode,
    ).toBe(404);
    const restrictedPublication = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/publications`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "publication-route-restricted" },
      payload: {
        revision_id: revision1.json().revision.id,
        link: {
          mode: "create",
          name: "Restricted Product docs",
          slug: "restricted-product-docs",
          visibility: "restricted",
        },
      },
    });
    expect(restrictedPublication.statusCode).toBe(201);
    expect(
      (
        await app.inject({
          url: "/api/v1/public/publish-links/restricted-product-docs/documentation/pages/install-guide",
        })
      ).statusCode,
    ).toBe(403);
    const expiredPublication = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/publications`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "publication-route-expired" },
      payload: {
        revision_id: revision1.json().revision.id,
        link: {
          mode: "create",
          name: "Expired Product docs",
          slug: "expired-product-docs",
          visibility: "public",
          expires_at: "2020-01-01T00:00:00.000Z",
        },
      },
    });
    expect(expiredPublication.statusCode).toBe(201);
    expect(
      (
        await app.inject({
          url: "/api/v1/public/publish-links/expired-product-docs/documentation/pages/install-guide",
        })
      ).statusCode,
    ).toBe(410);
    const publicOperation = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/product-docs/documentation/operations/get-widgets-listwidgets",
    });
    expect(publicOperation.statusCode).toBe(200);
    expect(publicOperation.json().operation).toMatchObject({
      method: "get",
      path: "/widgets",
      destination_key: "get-widgets-listwidgets",
    });
    const aliasRedirect = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/product-docs/documentation/pages/install",
    });
    expect(aliasRedirect.statusCode).toBe(308);
    expect(aliasRedirect.headers.location).toBe(
      "/docs/product-docs/install-guide",
    );
    const gone = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/product-docs/documentation/pages/obsolete",
    });
    expect(gone.statusCode).toBe(410);
    const changed = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages/${page.json().page.id}/content`,
      cookies: { ossie_session: scope.session_token },
      payload: {
        expected_page_version: 4,
        blocks: [
          {
            id: "01J00000000000000000000001",
            kind: "paragraph",
            position: 1,
            expected_version: 1,
            text: "This belongs only to Publication 2.",
          },
        ],
      },
    });
    expect(changed.statusCode).toBe(200);
    const publicStillOne = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/product-docs/documentation/pages/install-guide",
    });
    expect(publicStillOne.statusCode).toBe(200);
    expect(publicStillOne.json()).toEqual(publicBefore.json());
    const preview2 = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/preview`,
      cookies: { ossie_session: scope.session_token },
    });
    const revision2 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/revisions`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "revision-route-2" },
      payload: {
        expected_draft_version: preview2.json().preview.working_draft.version,
      },
    });
    expect(revision2.statusCode).toBe(201);
    const publication2 = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/publications`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "publication-route-2" },
      payload: {
        revision_id: revision2.json().revision.id,
        link: {
          mode: "existing",
          link_id: publication1.json().link.id,
          entry_id: publication1.json().entry.id,
          expected_entry_version: 1,
        },
      },
    });
    expect(publication2.statusCode).toBe(201);
    const publicTwo = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/product-docs/documentation/pages/install-guide",
    });
    expect(JSON.stringify(publicTwo.json())).toContain(
      "This belongs only to Publication 2.",
    );
    const rollback = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/publish-links/${publication1.json().link.id}/entries/${publication1.json().entry.id}/rollback`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "rollback-route-1" },
      payload: {
        site_publication_id: publication1.json().publication.id,
        expected_entry_version: 2,
      },
    });
    expect(rollback.statusCode).toBe(200);
    const publicRolledBack = await app.inject({
      method: "GET",
      url: "/api/v1/public/publish-links/product-docs/documentation/pages/install-guide",
    });
    expect(publicRolledBack.json()).toEqual(publicBefore.json());
    await expect(
      pool.query(
        `UPDATE publish_schema.site_publication
            SET output_digest='mutated'
          WHERE id=$1`,
        [publication1.json().publication.id],
      ),
    ).rejects.toMatchObject({ code: "42501" });
    const stale = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages/${page.json().page.id}/content`,
      cookies: { ossie_session: scope.session_token },
      payload: { expected_page_version: 1, blocks: [] },
    });
    expect(stale.statusCode).toBe(409);
    const independent = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${response.json().site.id}/pages/${secondPage.json().page.id}/content`,
      cookies: { ossie_session: scope.session_token },
      payload: { expected_page_version: 1, blocks: [] },
    });
    expect(independent.statusCode).toBe(200);
    const secondSite = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "site-create-nested-swap" },
      payload: {
        name: "Other docs",
        primary_language: "en-US",
        initial_home_page: { title: "Other home", path: "other-home" },
      },
    });
    expect(secondSite.statusCode).toBe(201);
    expect(
      (
        await app.inject({
          url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${secondSite.json().site.id}/pages/${page.json().page.id}`,
          cookies: { ossie_session: scope.session_token },
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites/${secondSite.json().site.id}/revisions/${revision1.json().revision.revision_number}`,
          cookies: { ossie_session: scope.session_token },
        })
      ).statusCode,
    ).toBe(404);
    const secondProject = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: { ossie_session: scope.session_token },
      payload: { name: "Other Product" },
    });
    expect(secondProject.statusCode).toBe(201);
    expect(
      (
        await app.inject({
          url: `/api/v1/projects/${secondProject.json().project.id}/versions/main/documentation-sites/${response.json().site.id}/pages/${page.json().page.id}`,
          cookies: { ossie_session: scope.session_token },
        })
      ).statusCode,
    ).toBe(404);
    const auditActions = await pool.query<{ action: string }>(
      `SELECT action FROM audit_schema.audit_event
        WHERE root_resource_type='documentation_site'
        ORDER BY occurred_at,id`,
    );
    expect(auditActions.rows.map(({ action }) => action)).toEqual(
      expect.arrayContaining([
        "documentation.site_created",
        "documentation.page_created",
        "documentation.page_path_changed",
        "documentation.page_content_replaced",
        "documentation.navigation_replaced",
        "documentation.routing_replaced",
        "documentation.openapi.inspected",
        "documentation.openapi_inspection_applied",
        "documentation.comment_thread_created",
        "documentation.comment_reply_created",
        "documentation.comment_resolved",
        "documentation.comment_reopened",
        "documentation.revision_created",
        "documentation.publish_link.created",
        "documentation.publish_link.manifest_updated",
        "documentation.publish_link.entry_rolled_back",
        "documentation.publish_link.revoked",
      ]),
    );
    const auditPayload = await pool.query<{ payload: string }>(
      `SELECT
         COALESCE((SELECT string_agg(to_jsonb(event)::text,' ')
                     FROM audit_schema.audit_event event),'')
         || ' ' ||
         COALESCE((SELECT string_agg(to_jsonb(item)::text,' ')
                     FROM audit_schema.audit_change_item item),'') payload`,
    );
    expect(auditPayload.rows[0]?.payload).not.toContain(
      "Please clarify this installation step.",
    );
    expect(auditPayload.rows[0]?.payload).not.toContain(
      "This belongs only to Publication 2.",
    );
    await expect(
      pool.query(
        `UPDATE documentation_schema.documentation_page
            SET title=title WHERE id=$1`,
        [page.json().page.id],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    for (const table of [
      "documentation_schema.page_slug_alias",
      "documentation_schema.site_revision",
      "documentation_schema.site_revision_page",
      "documentation_schema.site_revision_page_keyword",
      "documentation_schema.site_revision_page_block",
      "documentation_schema.site_revision_list_item",
      "documentation_schema.site_revision_navigation_node",
      "documentation_schema.site_revision_page_alias",
      "documentation_schema.site_revision_redirect_rule",
      "documentation_schema.site_revision_openapi_operation",
      "documentation_schema.site_revision_asset_reference",
      "publish_schema.site_publication",
      "publish_schema.site_publication_search_document",
    ]) {
      await expect(
        pool.query(`UPDATE ${table} SET id=id`),
      ).rejects.toMatchObject({
        code: expect.stringMatching(/23514|42501|55000/),
      });
      await expect(pool.query(`DELETE FROM ${table}`)).rejects.toMatchObject({
        code: expect.stringMatching(/23514|42501|55000/),
      });
      await expect(pool.query(`TRUNCATE ${table}`)).rejects.toMatchObject({
        code: expect.stringMatching(/23514|42501|55000/),
      });
    }
    await expect(
      with_maintenance_client((client) =>
        client.query(
          "TRUNCATE publish_schema.site_publication_search_document",
        ),
      ),
    ).resolves.toBeDefined();
    await app.close();
  });
});
