/**
 * Disposable Interactive Demo browser fixture. It composes the guarded
 * Capture fixture, which resets only the recognized local test database and
 * writes media only below the configured test storage root.
 */
import { build_capture_portal_browser_fixture } from "./capture-portal-browser-fixture";
import { seed_capture_portal_browser_fixture } from "./capture-portal-browser-fixture";
import { Password } from "../common/services/password.common.service";
import { hash_session_token } from "../modules/authentication/session-token";
import { hash_public_link_password } from "../modules/publish/public-link-password";
import { with_maintenance_client } from "../test-support/database";

export const interactive_demo_browser_fixture_password =
  "safe local browser fixture password";

const fixture_id = (family: number, index: number) =>
  `01K128${String(family).padStart(2, "0")}${String(index).padStart(18, "0")}`;

const ids = {
  editor_user: fixture_id(1, 1),
  editor_org_user: fixture_id(1, 2),
  editor_session: fixture_id(1, 3),
  editor_membership: fixture_id(1, 4),
  active_demo: fixture_id(2, 1),
  empty_demo: fixture_id(2, 2),
  archived_demo: fixture_id(2, 3),
  active_edition: fixture_id(3, 1),
  active_draft: fixture_id(3, 2),
  empty_edition: fixture_id(3, 3),
  empty_draft: fixture_id(3, 4),
  archived_edition: fixture_id(3, 5),
  archived_draft: fixture_id(3, 6),
  conflict_edition: fixture_id(3, 7),
  conflict_draft: fixture_id(3, 8),
  archived_asset: fixture_id(4, 1),
  broken_file: fixture_id(4, 2),
  broken_asset: fixture_id(4, 3),
  revision_one: fixture_id(5, 1),
  revision_two: fixture_id(5, 2),
  publication_one: fixture_id(6, 1),
  publication_two: fixture_id(6, 2),
} as const;

export const build_interactive_demo_browser_fixture = () => {
  const capture = build_capture_portal_browser_fixture();
  const admin = capture.users.find(
    ({ project_role }) => project_role === "project_admin",
  )!;
  const viewer = capture.users.find(
    ({ project_role }) => project_role === "viewer",
  )!;

  return {
    organization_id: capture.organization_id,
    project_id: capture.project_id,
    password: interactive_demo_browser_fixture_password,
    users: [
      {
        email: admin.email,
        project_role: "project_admin" as const,
        session_token: admin.session_token,
      },
      {
        email: "plan128-editor@example.test",
        project_role: "editor" as const,
        session_token: "plan128-editor-browser-session-token",
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
    demos: [
      { id: ids.active_demo, state: "active" as const },
      { id: ids.empty_demo, state: "empty" as const },
      { id: ids.archived_demo, state: "archived" as const },
    ],
    scene_count: 12,
    hotspot_types: ["click", "info", "next"] as const,
    transition_cases: ["forward", "backward", "self", "terminal"] as const,
    public_links: [
      { slug: "plan128-public", access: "public" as const },
      { slug: "plan128-password", access: "password" as const },
      { slug: "plan128-restricted", access: "restricted" as const },
      { slug: "plan128-expired", access: "expired" as const },
      { slug: "plan128-revoked", access: "revoked" as const },
    ],
    media_cases: ["active", "archived_protected", "broken", "missing"] as const,
    revision_count: 2,
    stale_working_draft_version: 7,
    routes: {
      list: `/projects/${capture.project_id}/versions/summer-release/interactive-demos`,
      editor: `/projects/${capture.project_id}/versions/summer-release/interactive-demos/${ids.active_demo}`,
      empty: `/projects/${capture.project_id}/versions/summer-release/interactive-demos/${ids.empty_demo}`,
      archived: `/projects/${capture.project_id}/versions/summer-release/interactive-demos/${ids.archived_demo}`,
      preview: `/projects/${capture.project_id}/versions/summer-release/interactive-demos/${ids.active_demo}/preview`,
      revisions: `/projects/${capture.project_id}/versions/summer-release/interactive-demos/${ids.active_demo}/revisions`,
      carry_forward: `/projects/${capture.project_id}/versions/summer-release/carry-forward`,
      public_reader: "/d/plan128-public",
      public_embed: "/d/plan128-public/embed",
    },
    ids,
  };
};

export const seed_interactive_demo_browser_fixture = async () => {
  await seed_capture_portal_browser_fixture();
  const fixture = build_interactive_demo_browser_fixture();
  const capture = build_capture_portal_browser_fixture();
  const admin = capture.users.find(
    ({ project_role }) => project_role === "project_admin",
  )!;
  const editor = fixture.users.find(
    ({ project_role }) => project_role === "editor",
  )!;
  const named_version = capture.project_versions.find(
    ({ slug }) => slug === "summer-release",
  )!;
  const default_version = capture.project_versions.find(
    ({ is_default }) => is_default,
  )!;
  const completed_session = capture.capture_sessions.find(
    ({ status }) => status === "completed",
  )!;
  const password_hash = await Password.to_hash(
    interactive_demo_browser_fixture_password,
  );
  const public_password = await hash_public_link_password(
    interactive_demo_browser_fixture_password,
  );

  await with_maintenance_client(async (client) => {
    const query = client.query.bind(client);
    await query(
      `INSERT INTO user_schema.user(id,email,password_hash,display_name)
       VALUES($1,$2,$3,'Plan 128 Editor')`,
      [ids.editor_user, editor.email, password_hash],
    );
    await query(
      `INSERT INTO organization_schema.org_user(id,organization_id,user_id,role)
       VALUES($1,$2,$3,'member')`,
      [ids.editor_org_user, fixture.organization_id, ids.editor_user],
    );
    await query(
      `INSERT INTO auth_schema.auth_session
       (id,user_id,organization_id,org_user_id,token_hash,expires_at)
       VALUES($1,$2,$3,$4,$5,CURRENT_TIMESTAMP + interval '30 days')`,
      [
        ids.editor_session,
        ids.editor_user,
        fixture.organization_id,
        ids.editor_org_user,
        hash_session_token(editor.session_token),
      ],
    );
    await query(
      `INSERT INTO project_schema.project_membership
       (id,organization_id,project_id,org_user_id,role,created_by_id,updated_by_id)
       VALUES($1,$2,$3,$4,'editor',$5,$5)`,
      [
        ids.editor_membership,
        fixture.organization_id,
        fixture.project_id,
        ids.editor_org_user,
        admin.org_user_id,
      ],
    );

    await query(
      `INSERT INTO capture_schema.capture_asset
       (id,organization_id,project_id,capture_session_id,file_id,asset_type,status,
        width,height,device_pixel_ratio,page_url,page_title,created_by_id,updated_by_id)
       SELECT $1,organization_id,project_id,capture_session_id,file_id,asset_type,'archived',
        width,height,device_pixel_ratio,page_url,'Archived protected Demo background',
        created_by_id,updated_by_id
       FROM capture_schema.capture_asset WHERE id=$2`,
      [ids.archived_asset, capture.screenshot_asset_id],
    );
    await query(
      `INSERT INTO file_schema.file
       (id,organization_id,storage_provider,storage_key,mime_type,size_bytes,
        original_name,checksum_sha256,created_by_id,updated_by_id)
       VALUES($1,$2,'local',$3,'image/png',68,'missing-demo-fixture.png',
        repeat('0',64),$4,$4)`,
      [
        ids.broken_file,
        fixture.organization_id,
        `organizations/${fixture.organization_id}/projects/${fixture.project_id}/missing/demo-fixture.png`,
        admin.org_user_id,
      ],
    );
    await query(
      `INSERT INTO capture_schema.capture_asset
       (id,organization_id,project_id,capture_session_id,file_id,asset_type,status,
        width,height,device_pixel_ratio,page_url,page_title,created_by_id,updated_by_id)
       VALUES($1,$2,$3,$4,$5,'screenshot','active',1280,720,1,
        'https://example.test/plan128','Broken Demo background',$6,$6)`,
      [
        ids.broken_asset,
        fixture.organization_id,
        fixture.project_id,
        completed_session.id,
        ids.broken_file,
        admin.org_user_id,
      ],
    );

    for (const demo of fixture.demos) {
      const edition_id =
        demo.state === "active"
          ? ids.active_edition
          : demo.state === "empty"
            ? ids.empty_edition
            : ids.archived_edition;
      const draft_id =
        demo.state === "active"
          ? ids.active_draft
          : demo.state === "empty"
            ? ids.empty_draft
            : ids.archived_draft;
      await query(
        `INSERT INTO interactive_demo_schema.interactive_demo
         (id,organization_id,project_id,created_by_id)
         VALUES($1,$2,$3,$4)`,
        [
          demo.id,
          fixture.organization_id,
          fixture.project_id,
          admin.org_user_id,
        ],
      );
      await query(
        `INSERT INTO interactive_demo_schema.interactive_demo_edition
         (id,organization_id,project_id,interactive_demo_id,project_version_id,
          source_capture_session_id,title,description,status,version,created_by_id,updated_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,3,$10,$10)`,
        [
          edition_id,
          fixture.organization_id,
          fixture.project_id,
          demo.id,
          named_version.id,
          completed_session.id,
          `Plan 128 ${demo.state} Interactive Demo`,
          demo.state === "active"
            ? "A deliberately long but synthetic description for responsive authoring, reader, and embed checks."
            : "Safe synthetic Interactive Demo browser fixture.",
          demo.state === "archived" ? "archived" : "draft",
          admin.org_user_id,
        ],
      );
      await query(
        `INSERT INTO interactive_demo_schema.interactive_demo_working_draft
         (id,organization_id,project_id,interactive_demo_edition_id,version,created_by_id,updated_by_id)
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

    await query(
      `INSERT INTO interactive_demo_schema.interactive_demo_edition
       (id,organization_id,project_id,interactive_demo_id,project_version_id,title,
        description,status,version,created_by_id,updated_by_id)
       VALUES($1,$2,$3,$4,$5,'Existing target Edition','Carry-Forward conflict fixture',
        'draft',2,$6,$6)`,
      [
        ids.conflict_edition,
        fixture.organization_id,
        fixture.project_id,
        ids.active_demo,
        default_version.id,
        admin.org_user_id,
      ],
    );
    await query(
      `INSERT INTO interactive_demo_schema.interactive_demo_working_draft
       (id,organization_id,project_id,interactive_demo_edition_id,version,created_by_id,updated_by_id)
       VALUES($1,$2,$3,$4,2,$5,$5)`,
      [
        ids.conflict_draft,
        fixture.organization_id,
        fixture.project_id,
        ids.conflict_edition,
        admin.org_user_id,
      ],
    );

    const scene_ids = Array.from({ length: fixture.scene_count }, (_, index) =>
      fixture_id(10, index + 1),
    );
    const hotspot_ids = Array.from(
      { length: fixture.scene_count },
      (_, index) => fixture_id(11, index + 1),
    );
    for (let index = 0; index < fixture.scene_count; index += 1) {
      const background =
        index === 2
          ? ids.archived_asset
          : index === 3
            ? ids.broken_asset
            : index === 4
              ? null
              : capture.screenshot_asset_id;
      await query(
        `INSERT INTO interactive_demo_schema.demo_scene
         (id,organization_id,project_id,interactive_demo_working_draft_id,
          source_capture_session_id,source_capture_asset_id,scene_index,title,
          description,background_capture_asset_id,created_by_id,updated_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
        [
          scene_ids[index],
          fixture.organization_id,
          fixture.project_id,
          ids.active_draft,
          completed_session.id,
          capture.screenshot_asset_id,
          index + 1,
          `Scene ${index + 1} · Synthetic product journey`,
          `Safe Scene description ${index + 1}`,
          background,
          admin.org_user_id,
        ],
      );
      const hotspot_type = fixture.hotspot_types[index % 3]!;
      const boundary = index === 0;
      await query(
        `INSERT INTO interactive_demo_schema.demo_hotspot
         (id,organization_id,project_id,interactive_demo_working_draft_id,
          demo_scene_id,hotspot_type,label,content,x,y,width,height,hotspot_index,
          created_by_id,updated_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,$13,$13)`,
        [
          hotspot_ids[index],
          fixture.organization_id,
          fixture.project_id,
          ids.active_draft,
          scene_ids[index],
          hotspot_type,
          `Hotspot ${index + 1}`,
          hotspot_type === "info" ? "Synthetic terminal information." : null,
          boundary ? 0 : 0.1,
          boundary ? 0 : 0.2,
          boundary ? 1 : 0.25,
          boundary ? 1 : 0.12,
          admin.org_user_id,
        ],
      );
    }
    for (let index = 0; index < fixture.scene_count; index += 1) {
      if (index === 3) continue;
      const target_index =
        index === 0 ? 1 : index === 1 ? 0 : index === 2 ? 2 : index + 1;
      await query(
        `INSERT INTO interactive_demo_schema.demo_transition
         (id,organization_id,project_id,interactive_demo_working_draft_id,
          demo_hotspot_id,target_scene_id,created_by_id,updated_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$7)`,
        [
          fixture_id(12, index + 1),
          fixture.organization_id,
          fixture.project_id,
          ids.active_draft,
          hotspot_ids[index],
          scene_ids[target_index % scene_ids.length],
          admin.org_user_id,
        ],
      );
    }

    for (const [revision_index, revision_id] of [
      ids.revision_one,
      ids.revision_two,
    ].entries()) {
      await query(
        `INSERT INTO interactive_demo_schema.interactive_demo_revision
         (id,organization_id,project_id,interactive_demo_id,interactive_demo_edition_id,
          project_version_id,revision_number,trigger,title,description,
          source_working_draft_version,content_sha256,created_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,'Plan 128 active Interactive Demo',
          'Safe immutable Demo fixture',$9,$10,$11)`,
        [
          revision_id,
          fixture.organization_id,
          fixture.project_id,
          ids.active_demo,
          ids.active_edition,
          named_version.id,
          revision_index + 1,
          revision_index === 0 ? "manual_checkpoint" : "publication",
          revision_index === 0 ? 6 : 7,
          String(revision_index).repeat(64),
          admin.org_user_id,
        ],
      );
      const revision_scene_one = fixture_id(20 + revision_index * 3, 1);
      const revision_scene_two = fixture_id(20 + revision_index * 3, 2);
      const revision_hotspot = fixture_id(21 + revision_index * 3, 1);
      await query(
        `INSERT INTO interactive_demo_schema.demo_revision_scene
         (id,organization_id,project_id,interactive_demo_revision_id,
          background_capture_asset_id,scene_index,title,description)
         VALUES
          ($1,$2,$3,$4,$5,1,'Published start','Immutable Scene'),
          ($6,$2,$3,$4,$5,2,'Published finish','Immutable destination')`,
        [
          revision_scene_one,
          fixture.organization_id,
          fixture.project_id,
          revision_id,
          capture.screenshot_asset_id,
          revision_scene_two,
        ],
      );
      await query(
        `INSERT INTO interactive_demo_schema.demo_revision_hotspot
         (id,organization_id,project_id,interactive_demo_revision_id,
          demo_revision_scene_id,hotspot_type,label,x,y,width,height,hotspot_index)
         VALUES($1,$2,$3,$4,$5,'click','Continue',0.1,0.2,0.3,0.1,1)`,
        [
          revision_hotspot,
          fixture.organization_id,
          fixture.project_id,
          revision_id,
          revision_scene_one,
        ],
      );
      await query(
        `INSERT INTO interactive_demo_schema.demo_revision_transition
         (id,organization_id,project_id,interactive_demo_revision_id,
          demo_revision_hotspot_id,target_demo_revision_scene_id)
         VALUES($1,$2,$3,$4,$5,$6)`,
        [
          fixture_id(22 + revision_index * 3, 1),
          fixture.organization_id,
          fixture.project_id,
          revision_id,
          revision_hotspot,
          revision_scene_two,
        ],
      );
    }

    for (const [index, publication_id] of [
      ids.publication_one,
      ids.publication_two,
    ].entries()) {
      await query(
        `INSERT INTO publish_schema.published_artifact
         (id,organization_id,project_id,artifact_type,project_version_id,
          publication_sequence,interactive_demo_id,interactive_demo_edition_id,
          interactive_demo_revision_id,created_by_id)
         VALUES($1,$2,$3,'interactive_demo',$4,$5,$6,$7,$8,$9)`,
        [
          publication_id,
          fixture.organization_id,
          fixture.project_id,
          named_version.id,
          index + 1,
          ids.active_demo,
          ids.active_edition,
          index === 0 ? ids.revision_one : ids.revision_two,
          admin.org_user_id,
        ],
      );
    }

    for (const [index, link] of fixture.public_links.entries()) {
      const link_id = fixture_id(30, index + 1);
      const password = link.access === "password";
      const revoked = link.access === "revoked";
      await query(
        `INSERT INTO publish_schema.publish_link
         (id,organization_id,project_id,artifact_type,interactive_demo_id,name,
          slug,visibility,expires_at,password_hash,password_salt,password_set_at,
          password_updated_at,status,created_by_id,revoked_by_id,revoked_at)
         VALUES($1,$2,$3,'interactive_demo',$4,$5,$6,$7,
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
          ids.active_demo,
          `Plan 128 ${link.access}`,
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
          project_version_id,interactive_demo_id,interactive_demo_edition_id,
          position,is_default,created_by_id,updated_by_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,1,TRUE,$9,$9)`,
        [
          fixture_id(31, index + 1),
          fixture.organization_id,
          fixture.project_id,
          link_id,
          ids.publication_two,
          named_version.id,
          ids.active_demo,
          ids.active_edition,
          admin.org_user_id,
        ],
      );
    }
  });

  return fixture;
};
