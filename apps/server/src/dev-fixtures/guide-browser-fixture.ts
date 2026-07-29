/**
 * Dev/test-only Guide browser fixture. The builder is side-effect free; the
 * seeder below composes the guarded Capture fixture and product HTTP routes.
 */
import { build_capture_portal_browser_fixture } from "./capture-portal-browser-fixture";
import { seed_capture_portal_browser_fixture } from "./capture-portal-browser-fixture";
import { Password } from "../common/services/password.common.service";
import { hash_session_token } from "../modules/authentication/session-token";
import { hash_public_link_password } from "../modules/publish/public-link-password";
import { with_maintenance_client } from "../test-support/database";

export const guide_browser_fixture_password =
  "safe local browser fixture password";

const guide_ids = {
  editor_user: "01K12700000000000000000001",
  editor_org_user: "01K12700000000000000000002",
  editor_session: "01K12700000000000000000003",
  editor_membership: "01K12700000000000000000004",
  active_guide: "01K12700000000000000000005",
  empty_guide: "01K12700000000000000000006",
  archived_guide: "01K12700000000000000000007",
  active_edition: "01K12700000000000000000008",
  active_draft: "01K12700000000000000000009",
  empty_edition: "01K12700000000000000000010",
  empty_draft: "01K12700000000000000000011",
  archived_edition: "01K12700000000000000000012",
  archived_draft: "01K12700000000000000000013",
  revision_one: "01K12700000000000000000014",
  revision_two: "01K12700000000000000000015",
  publication_one: "01K12700000000000000000016",
  publication_two: "01K12700000000000000000017",
  archived_asset: "01K12700000000000000000018",
  broken_file: "01K12700000000000000000019",
  broken_asset: "01K12700000000000000000020",
} as const;

export const build_guide_browser_fixture = () => {
  const capture = build_capture_portal_browser_fixture();
  const admin = capture.users.find(
    ({ project_role }) => project_role === "project_admin",
  )!;
  const viewer = capture.users.find(
    ({ project_role }) => project_role === "viewer",
  )!;
  const project_id = capture.project_id;

  return {
    organization_id: capture.organization_id,
    project_id,
    password: guide_browser_fixture_password,
    users: [
      {
        email: admin.email,
        project_role: "project_admin" as const,
        session_token: admin.session_token,
      },
      {
        email: "plan127-editor@example.test",
        project_role: "editor" as const,
        session_token: "plan127-editor-browser-session-token",
      },
      {
        email: viewer.email,
        project_role: "viewer" as const,
        session_token: viewer.session_token,
      },
    ],
    project_versions: capture.project_versions.map(({ id, slug, status }) => ({
      id,
      slug,
      status,
    })),
    guides: [
      { id: guide_ids.active_guide, state: "active" as const },
      { id: guide_ids.empty_guide, state: "empty" as const },
      { id: guide_ids.archived_guide, state: "archived" as const },
    ],
    public_links: [
      { slug: "plan127-public", access: "public" as const },
      { slug: "plan127-password", access: "password" as const },
      { slug: "plan127-restricted", access: "restricted" as const },
      { slug: "plan127-expired", access: "expired" as const },
      { slug: "plan127-revoked", access: "revoked" as const },
    ],
    media_cases: [
      "active",
      "archived_protected",
      "broken",
      "missing",
    ] as const,
    revision_count: 2,
    routes: {
      editor: `/projects/${project_id}/versions/summer-release/guides/${guide_ids.active_guide}`,
      empty: `/projects/${project_id}/versions/summer-release/guides/${guide_ids.empty_guide}`,
      archived: `/projects/${project_id}/versions/summer-release/guides/${guide_ids.archived_guide}`,
      list: `/projects/${project_id}/versions/summer-release/guides`,
      carry_forward: `/projects/${project_id}/versions/summer-release/carry-forward`,
      public_reader: "/p/plan127-public",
      public_embed: "/p/plan127-public/embed",
    },
    ids: guide_ids,
  };
};

const fixture_id = (family: number, index: number) =>
  `01K127${String(family).padStart(2, "0")}${String(index).padStart(18, "0")}`;

export const seed_guide_browser_fixture = async () => {
  await seed_capture_portal_browser_fixture();
  const fixture = build_guide_browser_fixture();
  const capture = build_capture_portal_browser_fixture();
  const admin = capture.users.find(
    ({ project_role }) => project_role === "project_admin",
  )!;
  const named_version = capture.project_versions.find(
    ({ slug }) => slug === "summer-release",
  )!;
  const completed_session = capture.capture_sessions.find(
    ({ status }) => status === "completed",
  )!;
  const editor = fixture.users.find(({ project_role }) => project_role === "editor")!;
  const password_hash = await Password.to_hash(guide_browser_fixture_password);
  const public_password = await hash_public_link_password(
    guide_browser_fixture_password,
  );

  await with_maintenance_client(async (client) => {
    const query = client.query.bind(client);
    await query(
      `INSERT INTO user_schema.user(id,email,password_hash,display_name)
       VALUES($1,$2,$3,'Plan 127 Editor')`,
      [guide_ids.editor_user, editor.email, password_hash],
    );
    await query(
      `INSERT INTO organization_schema.org_user(id,organization_id,user_id,role)
       VALUES($1,$2,$3,'member')`,
      [guide_ids.editor_org_user, fixture.organization_id, guide_ids.editor_user],
    );
    await query(
      `INSERT INTO auth_schema.auth_session
       (id,user_id,organization_id,org_user_id,token_hash,expires_at)
       VALUES($1,$2,$3,$4,$5,CURRENT_TIMESTAMP + interval '30 days')`,
      [
        guide_ids.editor_session,
        guide_ids.editor_user,
        fixture.organization_id,
        guide_ids.editor_org_user,
        hash_session_token(editor.session_token),
      ],
    );
    await query(
      `INSERT INTO project_schema.project_membership
       (id,organization_id,project_id,org_user_id,role,created_by_id,updated_by_id)
       VALUES($1,$2,$3,$4,'editor',$5,$5)`,
      [
        guide_ids.editor_membership,
        fixture.organization_id,
        fixture.project_id,
        guide_ids.editor_org_user,
        admin.org_user_id,
      ],
    );

    await query(
      `INSERT INTO capture_schema.capture_asset
       (id,organization_id,project_id,capture_session_id,file_id,asset_type,status,
        width,height,device_pixel_ratio,page_url,page_title,created_by_id,updated_by_id)
       SELECT $1,organization_id,project_id,capture_session_id,file_id,asset_type,'archived',
        width,height,device_pixel_ratio,page_url,'Archived protected fixture',created_by_id,updated_by_id
       FROM capture_schema.capture_asset WHERE id=$2`,
      [guide_ids.archived_asset, capture.screenshot_asset_id],
    );
    await query(
      `INSERT INTO file_schema.file
       (id,organization_id,storage_provider,storage_key,mime_type,size_bytes,
        original_name,checksum_sha256,created_by_id,updated_by_id)
       VALUES($1,$2,'local',$3,'image/png',68,'missing-fixture.png',
        repeat('0',64),$4,$4)`,
      [
        guide_ids.broken_file,
        fixture.organization_id,
        `organizations/${fixture.organization_id}/projects/${fixture.project_id}/missing/fixture.png`,
        admin.org_user_id,
      ],
    );
    await query(
      `INSERT INTO capture_schema.capture_asset
       (id,organization_id,project_id,capture_session_id,file_id,asset_type,status,
        width,height,device_pixel_ratio,page_url,page_title,created_by_id,updated_by_id)
       VALUES($1,$2,$3,$4,$5,'screenshot','active',1280,720,1,
        'https://example.test/plan127','Broken fixture media',$6,$6)`,
      [
        guide_ids.broken_asset,
        fixture.organization_id,
        fixture.project_id,
        completed_session.id,
        guide_ids.broken_file,
        admin.org_user_id,
      ],
    );

    for (const guide of fixture.guides) {
      const edition_id =
        guide.state === "active"
          ? guide_ids.active_edition
          : guide.state === "empty"
            ? guide_ids.empty_edition
            : guide_ids.archived_edition;
      const draft_id =
        guide.state === "active"
          ? guide_ids.active_draft
          : guide.state === "empty"
            ? guide_ids.empty_draft
            : guide_ids.archived_draft;
      await query(
        `INSERT INTO guide_schema.guide
         (id,organization_id,project_id,created_by_id)
         VALUES($1,$2,$3,$4)`,
        [guide.id, fixture.organization_id, fixture.project_id, admin.org_user_id],
      );
      await query(
        `INSERT INTO guide_schema.guide_edition
         (id,organization_id,project_id,guide_id,project_version_id,title,description,
          status,version,created_by_id,updated_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,3,$9,$9)`,
        [
          edition_id,
          fixture.organization_id,
          fixture.project_id,
          guide.id,
          named_version.id,
          `Plan 127 ${guide.state} Guide`,
          "Safe synthetic Guide browser fixture",
          guide.state === "archived" ? "archived" : "draft",
          admin.org_user_id,
        ],
      );
      await query(
        `INSERT INTO guide_schema.guide_working_draft
         (id,organization_id,project_id,guide_edition_id,version,created_by_id,updated_by_id)
         VALUES($1,$2,$3,$4,7,$5,$5)`,
        [
          draft_id,
          fixture.organization_id,
          fixture.project_id,
          edition_id,
          admin.org_user_id,
        ],
      );
    }

    const block_types = [
      "step",
      "header",
      "paragraph",
      "tip",
      "alert",
      "divider",
    ] as const;
    for (let index = 0; index < 20; index += 1) {
      const block_type = block_types[index % block_types.length]!;
      const block_id = fixture_id(10, index + 1);
      await query(
        `INSERT INTO guide_schema.guide_block
         (id,organization_id,project_id,guide_working_draft_id,block_type,title,body,
          block_index,created_by_id,updated_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
        [
          block_id,
          fixture.organization_id,
          fixture.project_id,
          guide_ids.active_draft,
          block_type,
          block_type === "header"
            ? `Section ${index + 1}`
            : block_type === "tip" || block_type === "alert"
              ? `${block_type} ${index + 1}`
              : null,
          block_type === "paragraph" ||
          block_type === "tip" ||
          block_type === "alert"
            ? `Safe synthetic content ${index + 1}`
            : null,
          index + 1,
          admin.org_user_id,
        ],
      );
      if (block_type === "step") {
        const step_id = fixture_id(11, index + 1);
        const selected_asset =
          index === 0
            ? capture.screenshot_asset_id
            : index === 6
              ? guide_ids.archived_asset
              : guide_ids.broken_asset;
        await query(
          `INSERT INTO guide_schema.guide_step
           (id,organization_id,project_id,guide_working_draft_id,guide_block_id,
            selected_capture_asset_id,title,body,created_by_id,updated_by_id)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
          [
            step_id,
            fixture.organization_id,
            fixture.project_id,
            guide_ids.active_draft,
            block_id,
            selected_asset,
            `Step ${index + 1}`,
            "Follow this safe synthetic step.",
            admin.org_user_id,
          ],
        );
        await query(
          `INSERT INTO guide_schema.guide_annotation
           (id,organization_id,project_id,guide_working_draft_id,guide_step_id,
            annotation_type,annotation_index,x,y,width,height,created_by_id,updated_by_id)
           VALUES($1,$2,$3,$4,$5,'highlight',1,$6,$7,$8,$9,$10,$10)`,
          [
            fixture_id(12, index + 1),
            fixture.organization_id,
            fixture.project_id,
            guide_ids.active_draft,
            step_id,
            index === 0 ? 0 : 0.1,
            index === 0 ? 0 : 0.2,
            index === 0 ? 1 : 0.3,
            index === 0 ? 1 : 0.4,
            admin.org_user_id,
          ],
        );
      }
    }

    for (const [index, revision_id] of [
      guide_ids.revision_one,
      guide_ids.revision_two,
    ].entries()) {
      await query(
        `INSERT INTO guide_schema.guide_revision
         (id,organization_id,project_id,guide_id,guide_edition_id,project_version_id,
          revision_number,trigger,title,description,source_working_draft_version,
          content_sha256,created_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,'Plan 127 active Guide',
          'Safe immutable fixture',$9,$10,$11)`,
        [
          revision_id,
          fixture.organization_id,
          fixture.project_id,
          guide_ids.active_guide,
          guide_ids.active_edition,
          named_version.id,
          index + 1,
          index === 0 ? "manual_checkpoint" : "publication",
          index === 0 ? 6 : 7,
          String(index).repeat(64),
          admin.org_user_id,
        ],
      );
      const revision_block_id = fixture_id(20 + index, 1);
      const revision_step_id = fixture_id(22 + index, 1);
      await query(
        `INSERT INTO guide_schema.guide_revision_block
         (id,organization_id,project_id,guide_revision_id,block_type,block_index)
         VALUES($1,$2,$3,$4,'step',1)`,
        [
          revision_block_id,
          fixture.organization_id,
          fixture.project_id,
          revision_id,
        ],
      );
      await query(
        `INSERT INTO guide_schema.guide_revision_step
         (id,organization_id,project_id,guide_revision_id,guide_revision_block_id,
          selected_capture_asset_id,title,body)
         VALUES($1,$2,$3,$4,$5,$6,'Published fixture step','Immutable content')`,
        [
          revision_step_id,
          fixture.organization_id,
          fixture.project_id,
          revision_id,
          revision_block_id,
          capture.screenshot_asset_id,
        ],
      );
    }

    for (const [index, publication_id] of [
      guide_ids.publication_one,
      guide_ids.publication_two,
    ].entries()) {
      await query(
        `INSERT INTO publish_schema.published_artifact
         (id,organization_id,project_id,artifact_type,project_version_id,
          publication_sequence,guide_id,guide_edition_id,guide_revision_id,created_by_id)
         VALUES($1,$2,$3,'guide',$4,$5,$6,$7,$8,$9)`,
        [
          publication_id,
          fixture.organization_id,
          fixture.project_id,
          named_version.id,
          index + 1,
          guide_ids.active_guide,
          guide_ids.active_edition,
          index === 0 ? guide_ids.revision_one : guide_ids.revision_two,
          admin.org_user_id,
        ],
      );
    }

    for (const [index, link] of fixture.public_links.entries()) {
      const link_id = fixture_id(40, index + 1);
      const password = link.access === "password";
      const revoked = link.access === "revoked";
      await query(
        `INSERT INTO publish_schema.publish_link
         (id,organization_id,project_id,artifact_type,guide_id,name,slug,visibility,
          expires_at,password_hash,password_salt,password_set_at,password_updated_at,
          status,created_by_id,revoked_by_id,revoked_at)
         VALUES($1,$2,$3,'guide',$4,$5,$6,$7,
          CASE WHEN $8 THEN CURRENT_TIMESTAMP - interval '1 day' ELSE NULL END,
          $9::text,$10::text,
          CASE WHEN $9::text IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
          CASE WHEN $9::text IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
          $11,$12::varchar(26),
          CASE WHEN $13::boolean THEN $12::varchar(26) ELSE NULL END,
          CASE WHEN $13::boolean THEN CURRENT_TIMESTAMP ELSE NULL END)`,
        [
          link_id,
          fixture.organization_id,
          fixture.project_id,
          guide_ids.active_guide,
          `Plan 127 ${link.access}`,
          link.slug,
          link.access === "restricted" ? "restricted" : "public",
          link.access === "expired",
          password ? public_password.hash : null,
          password ? public_password.salt : null,
          revoked ? "revoked" : "active",
          admin.org_user_id,
          revoked,
        ],
      );
      await query(
        `INSERT INTO publish_schema.publish_link_entry
         (id,organization_id,project_id,publish_link_id,published_artifact_id,
          project_version_id,guide_id,guide_edition_id,position,is_default,
          created_by_id,updated_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,1,TRUE,$9,$9)`,
        [
          fixture_id(41, index + 1),
          fixture.organization_id,
          fixture.project_id,
          link_id,
          guide_ids.publication_two,
          named_version.id,
          guide_ids.active_guide,
          guide_ids.active_edition,
          admin.org_user_id,
        ],
      );
    }
  });

  return fixture;
};
