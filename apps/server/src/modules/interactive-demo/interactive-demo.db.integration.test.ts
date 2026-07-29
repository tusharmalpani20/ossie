import { ulid } from "ulid";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import {
  reset_test_database,
  with_maintenance_client,
} from "../../test-support/database";

const setup_owner = async () => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/setup/first-run",
    payload: {
      owner: {
        email: "owner@example.com",
        password: "safe local password",
        first_name: "Owner",
        last_name: "User",
      },
      organization: {
        name: "Acme",
      },
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  const session_cookie = response.cookies.find(
    (cookie) => cookie.name === "ossie_session",
  );
  expect(session_cookie?.value).toEqual(expect.any(String));
  return session_cookie?.value ?? "";
};

const create_project = async (session_token: string) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: {
      ossie_session: session_token,
    },
    payload: {
      name: "Interactive Demo Project",
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return {
    project_id: response.json().project.id as string,
    project_version_id: response.json().project.default_project_version
      .id as string,
  };
};

const get_owner_context = async () => {
  const owner_context = await pool.query<{
    organization_id: string;
    org_user_id: string;
  }>(`
    SELECT org_user.organization_id, org_user.id AS org_user_id
    FROM organization_schema.org_user org_user
    INNER JOIN user_schema.user app_user ON app_user.id = org_user.user_id
    WHERE app_user.email = 'owner@example.com'
  `);

  const row = owner_context.rows[0];
  expect(row).toBeDefined();
  return row;
};

const insert_screenshot_asset = async (input: {
  organization_id: string;
  org_user_id: string;
  project_id: string;
}) => {
  const capture_session_id = ulid();
  const file_id = ulid();
  const capture_asset_id = ulid();

  await with_maintenance_client(async (client) => {
    await client.query(
      `
    INSERT INTO capture_schema.capture_session (
      id,
      organization_id,
      project_id,
      project_version_id,
      name,
      created_by_id,
      updated_by_id
    )
    VALUES (
      $1,
      $2,
      $3,
      (SELECT default_project_version_id FROM project_schema.project WHERE id = $3::varchar),
      'Demo source capture',
      $4,
      $4
    )
  `,
      [
        capture_session_id,
        input.organization_id,
        input.project_id,
        input.org_user_id,
      ],
    );
    await client.query(
      `
    INSERT INTO file_schema.file (
      id,
      organization_id,
      storage_provider,
      storage_key,
      mime_type,
      size_bytes,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, 'local', $3, 'image/png', 100, $4, $4)
  `,
      [
        file_id,
        input.organization_id,
        `interactive-demo/${file_id}.png`,
        input.org_user_id,
      ],
    );
    await client.query(
      `
    INSERT INTO capture_schema.capture_asset (
      id,
      organization_id,
      project_id,
      capture_session_id,
      file_id,
      asset_type,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, $3, $4, $5, 'screenshot', $6, $6)
    `,
      [
        capture_asset_id,
        input.organization_id,
        input.project_id,
        capture_session_id,
        file_id,
        input.org_user_id,
      ],
    );
  });

  return { capture_asset_id, capture_session_id };
};

const insert_capture_source_material = async (input: {
  organization_id: string;
  org_user_id: string;
  project_id: string;
}) => {
  const capture_session_id = ulid();
  const first_file_id = ulid();
  const second_file_id = ulid();
  const first_asset_id = ulid();
  const second_asset_id = ulid();
  const note_event_id = ulid();
  const click_event_id = ulid();
  const capture_event_id = ulid();

  await with_maintenance_client(async (client) => {
    await client.query(
      `
    INSERT INTO capture_schema.capture_session (
      id,
      organization_id,
      project_id,
      project_version_id,
      name,
      description,
      status,
      source_type,
      created_by_id,
      updated_by_id
    )
    VALUES (
      $1,
      $2,
      $3,
      (SELECT default_project_version_id FROM project_schema.project WHERE id = $3::varchar),
      'Department setup',
      'Create departments in ERP',
      'completed',
      'extension',
      $4,
      $4
    )
  `,
      [
        capture_session_id,
        input.organization_id,
        input.project_id,
        input.org_user_id,
      ],
    );
    await client.query(
      `
    INSERT INTO file_schema.file (
      id,
      organization_id,
      storage_provider,
      storage_key,
      mime_type,
      size_bytes,
      created_by_id,
      updated_by_id
    )
    VALUES
      ($1, $3, 'local', $4, 'image/png', 100, $2, $2),
      ($5, $3, 'local', $6, 'image/png', 100, $2, $2)
  `,
      [
        first_file_id,
        input.org_user_id,
        input.organization_id,
        `interactive-demo/${first_file_id}.png`,
        second_file_id,
        `interactive-demo/${second_file_id}.png`,
      ],
    );
    await client.query(
      `
    INSERT INTO capture_schema.capture_asset (
      id,
      organization_id,
      project_id,
      capture_session_id,
      file_id,
      asset_type,
      page_title,
      created_by_id,
      updated_by_id
    )
    VALUES
      ($1, $2, $3, $4, $5, 'screenshot', 'Department List', $7, $7),
      ($6, $2, $3, $4, $8, 'screenshot', 'New Department', $7, $7)
  `,
      [
        first_asset_id,
        input.organization_id,
        input.project_id,
        capture_session_id,
        first_file_id,
        second_asset_id,
        input.org_user_id,
        second_file_id,
      ],
    );
    await client.query(
      `
    INSERT INTO capture_schema.capture_event (
      id,
      organization_id,
      project_id,
      capture_session_id,
      capture_asset_id,
      event_type,
      event_index,
      page_title,
      target_text,
      note,
      input_value_redacted,
      created_by_id,
      updated_by_id
    )
    VALUES
      ($1, $4, $5, $6, NULL, 'note', 1, NULL, NULL, 'Skipped note', TRUE, $7, $7),
      ($2, $4, $5, $6, $8, 'click', 2, 'Department List', 'Add Department', NULL, TRUE, $7, $7),
      ($3, $4, $5, $6, $9, 'capture', 3, 'New Department', NULL, NULL, TRUE, $7, $7)
  `,
      [
        note_event_id,
        click_event_id,
        capture_event_id,
        input.organization_id,
        input.project_id,
        capture_session_id,
        input.org_user_id,
        first_asset_id,
        second_asset_id,
      ],
    );
  });

  return {
    capture_session_id,
    first_asset_id,
    second_asset_id,
    click_event_id,
    capture_event_id,
  };
};

describe("DB-backed interactive demo API", () => {
  beforeEach(async () => {
    await reset_test_database();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("persists a version-scoped Edition, Working Draft, scenes, transitions, and lifecycle changes", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const owner_context = await get_owner_context();
    const { capture_asset_id, capture_session_id } =
      await insert_screenshot_asset({
        organization_id: owner_context?.organization_id ?? "",
        org_user_id: owner_context?.org_user_id ?? "",
        project_id,
      });
    const app = build({ logger: false });

    const created = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos`,
      cookies: { ossie_session: session_token },
      payload: {
        project_version_id,
        title: "Product Tour",
        description: "Internal walkthrough",
      },
    });
    expect(created.statusCode, created.body).toBe(201);
    expect(created.json().artifact).toMatchObject({ project_id });
    expect(created.json().edition).toMatchObject({
      project_version_id,
      title: "Product Tour",
      status: "draft",
      version: 1,
    });
    expect(created.json().working_draft.version).toBe(1);
    const demo_id = created.json().artifact.id as string;

    const first_scene = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${demo_id}/scenes?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Welcome",
        background_capture_asset_id: capture_asset_id,
        expected_working_draft_version: created.json().working_draft.version,
      },
    });
    expect(first_scene.statusCode, first_scene.body).toBe(201);

    const second_scene = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${demo_id}/scenes?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Dashboard",
        background_capture_asset_id: capture_asset_id,
        expected_working_draft_version:
          first_scene.json().working_draft.version,
      },
    });
    expect(second_scene.statusCode, second_scene.body).toBe(201);

    const hotspot = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${demo_id}/scenes/${first_scene.json().demo_scene.id}/hotspots?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        hotspot_type: "click",
        label: "Continue",
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.12,
        transition: { target_scene_id: second_scene.json().demo_scene.id },
        expected_working_draft_version:
          second_scene.json().working_draft.version,
      },
    });
    expect(hotspot.statusCode, hotspot.body).toBe(201);
    expect(hotspot.json().demo_hotspot.transition).toMatchObject({
      target_scene_id: second_scene.json().demo_scene.id,
    });
    const transition_id = hotspot.json().demo_hotspot.transition.id as string;

    const retargeted_hotspot = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/interactive-demos/${demo_id}/scenes/${first_scene.json().demo_scene.id}/hotspots/${hotspot.json().demo_hotspot.id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        transition: { target_scene_id: first_scene.json().demo_scene.id },
        expected_working_draft_version: hotspot.json().working_draft.version,
      },
    });
    expect(retargeted_hotspot.statusCode, retargeted_hotspot.body).toBe(200);
    expect(retargeted_hotspot.json().demo_hotspot.transition).toMatchObject({
      id: transition_id,
      target_scene_id: first_scene.json().demo_scene.id,
      version: 2,
    });

    const listed_scenes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/interactive-demos/${demo_id}/scenes?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });
    expect(listed_scenes.statusCode, listed_scenes.body).toBe(200);
    expect(listed_scenes.json().background_capture_assets).toEqual([
      expect.objectContaining({
        id: capture_asset_id,
        project_id,
        capture_session_id,
        file_url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}/file`,
      }),
    ]);

    const archived = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${demo_id}/archive?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: { expected_edition_version: created.json().edition.version },
    });
    expect(archived.statusCode, archived.body).toBe(200);
    expect(archived.json().edition.status).toBe("archived");

    const blocked_write = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/interactive-demos/${demo_id}/scenes?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Blocked",
        expected_working_draft_version:
          retargeted_hotspot.json().working_draft.version,
      },
    });
    expect(blocked_write.statusCode).toBe(409);
    expect(blocked_write.json().error.type).toBe(
      "interactive_demo_not_editable",
    );

    const rows = await pool.query<{
      editions: string;
      drafts: string;
      scenes: string;
      transitions: string;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM interactive_demo_schema.interactive_demo_edition)::text AS editions,
        (SELECT COUNT(*) FROM interactive_demo_schema.interactive_demo_working_draft)::text AS drafts,
        (SELECT COUNT(*) FROM interactive_demo_schema.demo_scene WHERE is_deleted = FALSE)::text AS scenes,
        (SELECT COUNT(*) FROM interactive_demo_schema.demo_transition WHERE is_deleted = FALSE)::text AS transitions
    `);
    expect(rows.rows[0]).toEqual({
      editions: "1",
      drafts: "1",
      scenes: "2",
      transitions: "1",
    });
    await app.close();
  }, 60_000);

  it("generates independent relational demos from version-owned Capture source", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const owner_context = await get_owner_context();
    const source = await insert_capture_source_material({
      organization_id: owner_context?.organization_id ?? "",
      org_user_id: owner_context?.org_user_id ?? "",
      project_id,
    });
    const app = build({ logger: false });

    const create_from_capture = () =>
      app.inject({
        method: "POST",
        url: `/api/v1/projects/${project_id}/capture-sessions/${source.capture_session_id}/interactive-demos`,
        cookies: { ossie_session: session_token },
        payload: {},
      });
    const first = await create_from_capture();
    const second = await create_from_capture();

    expect(first.statusCode, first.body).toBe(201);
    expect(second.statusCode, second.body).toBe(201);
    expect(first.json().artifact.id).not.toBe(second.json().artifact.id);
    expect(first.json().edition).toMatchObject({
      project_version_id,
      source_capture_session_id: source.capture_session_id,
      title: "Department setup",
      description: "Create departments in ERP",
    });
    expect(first.json().working_draft.version).toBe(1);
    expect(first.json().demo_scenes).toHaveLength(2);
    expect(first.json().demo_scenes[0]).toMatchObject({
      source_capture_session_id: source.capture_session_id,
      source_capture_event_id: source.click_event_id,
      background_capture_asset_id: source.first_asset_id,
    });
    expect(JSON.stringify(first.json())).not.toContain("storage_key");
    await app.close();
  }, 60_000);
});
