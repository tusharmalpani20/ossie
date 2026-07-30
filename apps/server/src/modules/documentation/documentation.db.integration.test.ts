import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";
import { build_documentation_repository } from "./documentation.repository";

const multipart_file = (
  filename: string,
  mime_type: string,
  bytes: Buffer,
) => {
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
    expect(saved.statusCode).toBe(200);
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
      ...multipart_file(
        "openapi.json",
        "application/json",
        openapiDocument,
      ),
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
    expect(revision1.statusCode).toBe(201);
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
    await app.close();
  });
});
