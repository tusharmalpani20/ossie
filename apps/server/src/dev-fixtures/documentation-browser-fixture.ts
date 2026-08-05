/**
 * Disposable Documentation browser fixture. The builder is side-effect free;
 * the seeder composes the guarded Capture fixture and drives the real HTTP API.
 */
import type { LightMyRequestResponse } from "fastify";
import { build } from "../app";
import { pool } from "../config/database.config";
import {
  build_capture_portal_browser_fixture,
  seed_capture_portal_browser_fixture,
} from "./capture-portal-browser-fixture";

const multipart_file = (filename: string, mime_type: string, bytes: Buffer) => {
  const boundary = "ossie-documentation-browser-fixture";
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

const require_success = (response: LightMyRequestResponse, label: string) => {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `${label} failed (${response.statusCode}): ${response.body}`,
    );
  }
  return response.json() as Record<string, unknown>;
};

export const build_documentation_browser_fixture = () => {
  const capture = build_capture_portal_browser_fixture();
  const users = capture.users.map(({ email, project_role, session_token }) => ({
    email,
    project_role,
    session_token,
  }));
  return {
    organization_id: capture.organization_id,
    project_id: capture.project_id,
    capture_asset_id: capture.screenshot_asset_id,
    version_slug: "summer-release",
    users,
    cases: [
      "page_conflict",
      "private_comment",
      "openapi_reference",
      "publication_immutability",
      "rollback",
      "snippet_conflict",
      "asset_archive_protection",
      "expanded_content",
      "review_request",
      "review_inbox",
      "review_publication_evidence",
      "api_try_it_browser_direct",
      "request_examples",
    ] as const,
    routes: {
      list: `/projects/${capture.project_id}/versions/summer-release/documentation`,
      public_reader: "/docs/plan132-public/install-guide",
      public_alias: "/docs/plan132-public/install",
      public_redirect: "/docs/plan132-public/setup",
      public_gone: "/docs/plan132-public/obsolete",
      public_operation:
        "/docs/plan132-public/operations/get-widgets-listwidgets",
      public_unsupported_operation:
        "/docs/plan132-public/operations/post-widgets-createwidget",
      review_inbox: `/projects/${capture.project_id}/versions/summer-release/documentation/reviews`,
    },
  };
};

export const documentation_browser_fixture_cli_summary = (
  fixture: ReturnType<typeof build_documentation_browser_fixture>,
) => ({
  seeded: true,
  warning: "Synthetic disposable testing fixture only.",
  organization_id: fixture.organization_id,
  project_id: fixture.project_id,
  users: fixture.users.map(({ email, project_role }) => ({
    email,
    project_role,
  })),
  routes: fixture.routes,
  cases: fixture.cases,
});

export const seed_documentation_browser_fixture = async () => {
  await seed_capture_portal_browser_fixture();
  const base = build_documentation_browser_fixture();
  const admin = base.users.find(
    ({ project_role }) => project_role === "project_admin",
  )!;
  const viewer = build_capture_portal_browser_fixture().users.find(
    ({ project_role }) => project_role === "viewer",
  )!;
  const membership = await pool.query<{ id: string }>(
    `SELECT id FROM project_schema.project_membership
      WHERE organization_id=$1 AND project_id=$2 AND org_user_id=$3`,
    [base.organization_id, base.project_id, viewer.org_user_id],
  );
  process.env.OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS =
    "https://api.github.com";
  const app = build({
    logger: false,
    documentation_try_it_origin_validator: async ({ origin }) => origin,
  });
  const cookie = { ossie_session: admin.session_token };
  const root = `/api/v1/projects/${base.project_id}/versions/${base.version_slug}/documentation-sites`;

  try {
    const created = require_success(
      await app.inject({
        method: "POST",
        url: root,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-site" },
        payload: {
          name: "Plan 132 Product Documentation",
          description: "Exact, version-aware product and API documentation.",
          primary_language: "en-US",
          initial_home_page: { title: "Install", path: "install" },
        },
      }),
      "create Documentation Site",
    );
    const site = created.site as { id: string };
    const home = created.home_page as { id: string };
    const siteRoot = `${root}/${site.id}`;
    const image = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/assets`,
        cookies: cookie,
        ...multipart_file(
          "pixel.png",
          "image/png",
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            "base64",
          ),
        ),
      }),
      "upload Documentation image",
    ).asset as { id: string };
    const reference = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/pages`,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-reference-page" },
        payload: {
          title: "API reference",
          description: "Stable widget API reference.",
          canonical_path: "reference",
        },
      }),
      "create reference Page",
    ).page as { id: string };
    const currentReference = require_success(
      await app.inject({
        method: "GET",
        url: `${siteRoot}/pages/${reference.id}`,
        cookies: cookie,
      }),
      "load reference Page",
    ).page as { version: number };
    require_success(
      await app.inject({
        method: "PUT",
        url: `${siteRoot}/pages/${reference.id}/content`,
        cookies: cookie,
        payload: {
          expected_page_version: currentReference.version,
          blocks: [
            {
              id: "01K13200000000000000000001",
              kind: "paragraph",
              position: 1,
              expected_version: null,
              text: "Use this reference to integrate widgets.",
            },
          ],
        },
      }),
      "save reference Page",
    );
    const initialHome = require_success(
      await app.inject({
        method: "GET",
        url: `${siteRoot}/pages/${home.id}`,
        cookies: cookie,
      }),
      "load Home Page",
    ).page as { version: number };
    require_success(
      await app.inject({
        method: "PUT",
        url: `${siteRoot}/pages/${home.id}/content`,
        cookies: cookie,
        payload: {
          expected_page_version: initialHome.version,
          blocks: [
            {
              id: "01K13200000000000000000002",
              kind: "paragraph",
              position: 1,
              expected_version: null,
              text: "Install Ossie safely in your environment.",
            },
            {
              id: "01K13200000000000000000006",
              kind: "image",
              position: 2,
              expected_version: null,
              asset_id: image.id,
              alt_text: "One-pixel Documentation fixture image",
              caption: "Synthetic fixture image.",
            },
            {
              id: "01K13200000000000000000003",
              kind: "link",
              position: 3,
              expected_version: null,
              label: "Read the API reference",
              page_id: reference.id,
            },
          ],
        },
      }),
      "save Home Page",
    );
    const renamed = require_success(
      await app.inject({
        method: "PATCH",
        url: `${siteRoot}/pages/${home.id}`,
        cookies: cookie,
        payload: {
          expected_version: initialHome.version + 1,
          canonical_path: "install-guide",
          keywords: ["install", "setup"],
        },
      }),
      "rename Home Page",
    ).page as { version: number };
    require_success(
      await app.inject({
        method: "PUT",
        url: `${siteRoot}/navigation`,
        cookies: cookie,
        payload: {
          expected_version: 1,
          nodes: [
            {
              id: "01K13200000000000000000004",
              parent_id: null,
              kind: "page",
              label: null,
              page_id: home.id,
              position: 1,
              expected_version: null,
            },
            {
              id: "01K13200000000000000000005",
              parent_id: null,
              kind: "page",
              label: null,
              page_id: reference.id,
              position: 2,
              expected_version: null,
            },
          ],
        },
      }),
      "save navigation",
    );
    require_success(
      await app.inject({
        method: "PUT",
        url: `${siteRoot}/routing`,
        cookies: cookie,
        payload: {
          expected_version: 1,
          rules: [
            {
              id: "01K13200000000000000000006",
              source_path: "setup",
              outcome: "redirect",
              target_page_id: home.id,
              expected_version: null,
            },
            {
              id: "01K13200000000000000000007",
              source_path: "obsolete",
              outcome: "gone",
              target_page_id: null,
              expected_version: null,
            },
          ],
        },
      }),
      "save routes",
    );
    const inspected = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/openapi/inspections`,
        cookies: cookie,
        ...multipart_file(
          "plan132-openapi.json",
          "application/json",
          Buffer.from(
            JSON.stringify({
              openapi: "3.1.0",
              info: { title: "Widget API", version: "1.0.0" },
              components: {
                securitySchemes: {
                  bearerAuth: { type: "http", scheme: "bearer" },
                  fixtureApiKey: {
                    type: "apiKey",
                    in: "header",
                    name: "X-Ossie-Fixture-Key",
                  },
                },
              },
              paths: {
                "/widgets": {
                  get: {
                    operationId: "listWidgets",
                    summary: "List widgets",
                    security: [{ bearerAuth: [] }, { fixtureApiKey: [] }],
                    responses: { "200": { description: "OK" } },
                  },
                  post: {
                    operationId: "createWidget",
                    summary: "Create a widget",
                    requestBody: {
                      required: true,
                      content: {
                        "application/json": {
                          schema: {
                            type: "object",
                            required: ["name"],
                            properties: { name: { type: "string" } },
                          },
                        },
                      },
                    },
                    responses: { "201": { description: "Created" } },
                  },
                },
              },
            }),
          ),
        ),
      }),
      "inspect OpenAPI",
    ).inspection as { id: string };
    const applied = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/openapi/sources`,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-openapi-apply" },
        payload: {
          inspection_id: inspected.id,
          expected_source_version: null,
        },
      }),
      "apply OpenAPI",
    );
    const source = applied.source as { id: string };
    require_success(
      await app.inject({
        method: "PUT",
        url: `${siteRoot}/openapi/try-it-policy`,
        cookies: cookie,
        headers: { "idempotency-key": "plan137-try-it-policy" },
        payload: {
          expected_policy_version: null,
          status: "enabled",
          approved_origin: "https://api.github.com",
          base_path: "/",
          allow_bearer: true,
          api_key_header_name: "X-Ossie-Fixture-Key",
          operation_destination_keys: ["get-widgets-listwidgets"],
        },
      }),
      "enable synthetic Try-It policy",
    );
    const snippet = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/snippets`,
        cookies: cookie,
        headers: { "idempotency-key": "plan133-snippet" },
        payload: { name: "Reusable safety note" },
      }),
      "create Documentation Snippet",
    ).snippet as { id: string; version: number };
    require_success(
      await app.inject({
        method: "PUT",
        url: `${siteRoot}/snippets/${snippet.id}/content`,
        cookies: cookie,
        payload: {
          expected_snippet_version: snippet.version,
          blocks: [
            {
              id: "01K13300000000000000000001",
              kind: "callout",
              position: 1,
              expected_version: null,
              tone: "warning",
              title: "Before you continue",
              text: "Back up your configuration before changing production.",
            },
          ],
        },
      }),
      "save Documentation Snippet",
    );
    require_success(
      await app.inject({
        method: "PUT",
        url: `${siteRoot}/pages/${home.id}/content`,
        cookies: cookie,
        payload: {
          expected_page_version: renamed.version,
          blocks: [
            {
              id: "01K13200000000000000000002",
              kind: "paragraph",
              position: 1,
              expected_version: 1,
              text: "Install Ossie safely in your environment.",
            },
            {
              id: "01K13200000000000000000003",
              kind: "link",
              position: 2,
              expected_version: 1,
              label: "Read the API reference",
              page_id: reference.id,
            },
            {
              id: "01K13200000000000000000006",
              kind: "image",
              position: 3,
              expected_version: 1,
              source: { kind: "documentation_asset", id: image.id },
              alt_text: "One-pixel Documentation fixture image",
              caption: "Synthetic fixture image.",
            },
            {
              id: "01K13200000000000000000008",
              kind: "api_reference",
              position: 4,
              expected_version: null,
              openapi_source_id: source.id,
              operation_key: "get-widgets-listwidgets",
            },
            {
              id: "01K13300000000000000000002",
              kind: "quote",
              position: 5,
              expected_version: null,
              text: "Small, exact releases are easier to trust.",
              attribution: "Ossie docs",
            },
            {
              id: "01K13300000000000000000003",
              kind: "tabs",
              position: 6,
              expected_version: null,
              items: [
                {
                  id: "01K13300000000000000000004",
                  position: 1,
                  expected_version: null,
                  label: "Linux",
                  body: "Run `ossie install`.",
                },
                {
                  id: "01K13300000000000000000005",
                  position: 2,
                  expected_version: null,
                  label: "macOS",
                  body: "Run `brew install ossie`.",
                },
              ],
            },
            {
              id: "01K13300000000000000000006",
              kind: "table",
              position: 7,
              expected_version: null,
              caption: "Default ports",
              rows: [
                {
                  id: "01K13300000000000000000007",
                  position: 1,
                  expected_version: null,
                  cells: [
                    {
                      id: "01K13300000000000000000008",
                      column_position: 1,
                      expected_version: null,
                      is_header: true,
                      text: "Service",
                    },
                    {
                      id: "01K13300000000000000000009",
                      column_position: 2,
                      expected_version: null,
                      is_header: true,
                      text: "Port",
                    },
                  ],
                },
                {
                  id: "01K13300000000000000000010",
                  position: 2,
                  expected_version: null,
                  cells: [
                    {
                      id: "01K13300000000000000000011",
                      column_position: 1,
                      expected_version: null,
                      is_header: false,
                      text: "Web",
                    },
                    {
                      id: "01K13300000000000000000012",
                      column_position: 2,
                      expected_version: null,
                      is_header: false,
                      text: "3000",
                    },
                  ],
                },
              ],
            },
            {
              id: "01K13300000000000000000013",
              kind: "snippet_reference",
              position: 8,
              expected_version: null,
              snippet_id: snippet.id,
            },
            {
              id: "01K13300000000000000000014",
              kind: "image",
              position: 9,
              expected_version: null,
              source: {
                kind: "capture_asset",
                id: base.capture_asset_id,
              },
              alt_text: "Synthetic captured dashboard",
              caption: "Capture Asset reused from this Project.",
            },
          ],
        },
      }),
      "add OpenAPI reference",
    );
    const thread = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/pages/${home.id}/comments`,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-comment" },
        payload: {
          body: "Please verify this installation guidance.",
          block_anchor_id: "01K13200000000000000000002",
          mentioned_project_membership_ids: [membership.rows[0]!.id],
        },
      }),
      "create private comment",
    ).thread as { id: string; version: number };
    require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/comments/${thread.id}/replies`,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-comment-reply" },
        payload: {
          body: "Verified against the saved draft.",
          mentioned_project_membership_ids: [],
        },
      }),
      "reply to private comment",
    );
    require_success(
      await app.inject({
        method: "PATCH",
        url: `${siteRoot}/comments/${thread.id}`,
        cookies: cookie,
        payload: { expected_version: thread.version, transition: "resolve" },
      }),
      "resolve private comment",
    );
    require_success(
      await app.inject({
        method: "PATCH",
        url: `${siteRoot}/comments/${thread.id}`,
        cookies: cookie,
        payload: {
          expected_version: thread.version + 1,
          transition: "reopen",
        },
      }),
      "reopen private comment",
    );
    const preview = require_success(
      await app.inject({
        method: "GET",
        url: `${siteRoot}/preview`,
        cookies: cookie,
      }),
      "load saved preview",
    ).preview as {
      edition: { version: number };
      working_draft: { version: number };
    };
    const revision = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/revisions`,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-revision-1" },
        payload: {
          expected_edition_version: preview.edition.version,
          expected_draft_version: preview.working_draft.version,
        },
      }),
      "create Site Revision",
    ).revision as { id: string };
    const publication = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/publications`,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-publication-1" },
        payload: {
          revision_id: revision.id,
          link: {
            mode: "create",
            name: "Plan 132 public Documentation",
            slug: "plan132-public",
            visibility: "public",
          },
        },
      }),
      "publish exact Site Revision",
    );
    const publicationOne = publication.publication as { id: string };
    const link = publication.link as { id: string; version: number };
    const entry = publication.entry as { id: string; version: number };
    require_success(
      await app.inject({
        method: "PATCH",
        url: `${siteRoot}/publish-links/${link.id}/try-it-policy`,
        cookies: cookie,
        headers: { "idempotency-key": "plan137-link-try-it-policy" },
        payload: {
          expected_policy_version: null,
          expected_link_version: link.version,
          enabled: true,
        },
      }),
      "enable Try It on Publish Link",
    );
    const latestHome = require_success(
      await app.inject({
        method: "GET",
        url: `${siteRoot}/pages/${home.id}`,
        cookies: cookie,
      }),
      "reload Home Page before Publication 2",
    ).page as { version: number };
    require_success(
      await app.inject({
        method: "PUT",
        url: `${siteRoot}/pages/${home.id}/content`,
        cookies: cookie,
        payload: {
          expected_page_version: latestHome.version,
          blocks: [
            {
              id: "01K13200000000000000000002",
              kind: "paragraph",
              position: 1,
              expected_version: 1,
              text: "This draft belongs only to Publication 2.",
            },
          ],
        },
      }),
      "mutate Working Draft after Publication 1",
    );
    const previewTwo = require_success(
      await app.inject({
        method: "GET",
        url: `${siteRoot}/preview`,
        cookies: cookie,
      }),
      "load second saved preview",
    ).preview as {
      edition: { version: number };
      working_draft: { version: number };
    };
    const revisionTwo = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/revisions`,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-revision-2" },
        payload: {
          expected_edition_version: previewTwo.edition.version,
          expected_draft_version: previewTwo.working_draft.version,
        },
      }),
      "create Site Revision 2",
    ).revision as { id: string };
    const publicationTwoResult = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/publications`,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-publication-2" },
        payload: {
          revision_id: revisionTwo.id,
          link: {
            mode: "existing",
            link_id: link.id,
            entry_id: entry.id,
            expected_entry_version: entry.version,
          },
        },
      }),
      "switch link to Publication 2",
    );
    const publicationTwo = publicationTwoResult.publication as { id: string };
    const switchedEntry = publicationTwoResult.entry as { version: number };
    require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/publish-links/${link.id}/entries/${entry.id}/rollback`,
        cookies: cookie,
        headers: { "idempotency-key": "plan132-rollback-1" },
        payload: {
          site_publication_id: publicationOne.id,
          expected_entry_version: switchedEntry.version,
        },
      }),
      "roll link back to Publication 1",
    );
    const policy = require_success(
      await app.inject({
        method: "GET",
        url: `${siteRoot}/review-policy`,
        cookies: cookie,
      }),
      "load Documentation Review Policy",
    ) as { version: number };
    const review = require_success(
      await app.inject({
        method: "POST",
        url: `${siteRoot}/reviews`,
        cookies: cookie,
        headers: { "idempotency-key": "plan136-review-request-1" },
        payload: {
          site_revision_id: revisionTwo.id,
          expected_policy_version: policy.version,
          reviewer_org_user_ids: [viewer.org_user_id],
        },
      }),
      "request Documentation review",
    ) as { review_request: { id: string } };
    const secondary = require_success(
      await app.inject({
        method: "POST",
        url: root,
        cookies: cookie,
        headers: { "idempotency-key": "plan135-secondary-site" },
        payload: {
          name: "Plan 135 Operations Documentation",
          description:
            "A second Site used to verify bounded multi-Site Carry-Forward.",
          primary_language: "en-US",
          initial_home_page: {
            title: "Operations overview",
            path: "operations",
          },
        },
      }),
      "create second Documentation Site",
    );
    const secondarySite = secondary.site as { id: string };
    return {
      ...base,
      site_id: site.id,
      secondary_site_id: secondarySite.id,
      page_ids: { home: home.id, reference: reference.id },
      asset_id: image.id,
      capture_asset_id: base.capture_asset_id,
      snippet_id: snippet.id,
      revision_id: revision.id,
      revision_two_id: revisionTwo.id,
      publication_id: publicationOne.id,
      publication_two_id: publicationTwo.id,
      link_id: link.id,
      entry_id: entry.id,
      review_request_id: review.review_request.id,
      routes: {
        ...base.routes,
        editor: `${base.routes.list}/${site.id}`,
        page_editor: `${base.routes.list}/${site.id}/pages/${home.id}`,
        preview: `${base.routes.list}/${site.id}/preview`,
      },
    };
  } finally {
    await app.close();
  }
};
