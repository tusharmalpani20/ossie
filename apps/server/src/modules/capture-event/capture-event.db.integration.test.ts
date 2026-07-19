import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import {
  reset_test_database,
  run_test_fixture_mutation,
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

const create_project = async (session_token: string) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: { ossie_session: session_token },
    payload: { name: "Onboarding Demo" },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().project.id as string;
};

const create_capture_session = async (
  session_token: string,
  project_id: string,
  source_type: "manual" | "extension" | "import" = "extension",
) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions`,
    cookies: { ossie_session: session_token },
    payload: {
      name: "Create department workflow",
      source_type,
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().capture_session.id as string;
};

const create_capture_asset = async (
  session_token: string,
  project_id: string,
  capture_session_id: string,
) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets`,
    cookies: { ossie_session: session_token },
    payload: {
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 1,
      file: {
        storage_key: "captures/acme/project/session/screenshot-1.png",
        mime_type: "image/png",
        size_bytes: 123456,
      },
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return {
    capture_asset_id: response.json().capture_asset.id as string,
    file_id: response.json().capture_asset.file.id as string,
  };
};

describe("DB-backed capture event API", () => {
  beforeEach(async () => {
    await reset_test_database();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates lists gets and soft deletes capture events without deleting linked assets", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
    );
    const { capture_asset_id, file_id } = await create_capture_asset(
      session_token,
      project_id,
      capture_session_id,
    );
    const owner_context = await get_owner_context();
    const app = build({ logger: false });

    const click_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "click",
        event_index: 2,
        capture_asset_id,
        occurred_at: "2026-06-05T10:00:00.000Z",
        page_url: "https://example.internal/app/department",
        page_title: "Department",
        target_label: "Add Department",
        client_x: 1200,
        client_y: 84,
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 1,
        metadata: { source: "manual" },
      },
    });
    const note_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "note",
        event_index: 1,
        note: "Start from department list",
      },
    });

    expect(click_response.statusCode).toBe(201);
    expect(click_response.json().capture_event).toMatchObject({
      organization_id: owner_context?.organization_id,
      project_id,
      capture_session_id,
      capture_asset_id,
      event_type: "click",
      event_index: 2,
      occurred_at: "2026-06-05T10:00:00.000Z",
      target_label: "Add Department",
      input_value_redacted: true,
      created_by_id: owner_context?.org_user_id,
      updated_by_id: owner_context?.org_user_id,
      version: 1,
    });
    expect(JSON.stringify(click_response.json())).not.toContain("metadata");
    expect(JSON.stringify(click_response.json())).not.toContain("is_deleted");
    expect(JSON.stringify(click_response.json())).not.toContain("deleted_at");
    expect(JSON.stringify(click_response.json())).not.toContain(
      "deleted_by_id",
    );
    expect(note_response.statusCode).toBe(201);

    const capture_event_id = click_response.json().capture_event.id as string;

    const list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
    });
    const click_list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events?event_type=click`,
      cookies: { ossie_session: session_token },
    });
    const get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events/${capture_event_id}`,
      cookies: { ossie_session: session_token },
    });
    const duplicate_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "note",
        event_index: 1,
        note: "Duplicate index",
      },
    });
    const missing_project_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/missing_project/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "note",
        event_index: 3,
        note: "Missing project",
      },
    });
    const missing_capture_session_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/missing_capture_session/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "note",
        event_index: 3,
        note: "Missing capture session",
      },
    });
    const invalid_asset_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "capture",
        event_index: 3,
        capture_asset_id: "missing_asset",
      },
    });
    await run_test_fixture_mutation(
      `
      UPDATE capture_schema.capture_asset
      SET is_deleted = TRUE
      WHERE id = $1
    `,
      [capture_asset_id],
    );
    const deleted_asset_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "capture",
        event_index: 3,
        capture_asset_id,
      },
    });
    await run_test_fixture_mutation(
      `
      UPDATE capture_schema.capture_asset
      SET is_deleted = FALSE
      WHERE id = $1
    `,
      [capture_asset_id],
    );
    const raw_value_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "input",
        event_index: 3,
        target_label: "Password",
        input_value: "secret",
      },
    });
    const unredacted_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "input",
        event_index: 3,
        target_label: "Department Name",
        input_value_redacted: false,
      },
    });
    const delete_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events/${capture_event_id}`,
      cookies: { ossie_session: session_token },
    });

    expect(list_response.statusCode).toBe(200);
    expect(
      list_response
        .json()
        .capture_events.map(
          (event: { event_index: number }) => event.event_index,
        ),
    ).toEqual([1, 2]);
    expect(click_list_response.statusCode).toBe(200);
    expect(click_list_response.json().capture_events).toHaveLength(1);
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json().capture_event.id).toBe(capture_event_id);
    expect(duplicate_response.statusCode).toBe(409);
    expect(duplicate_response.json().error.type).toBe(
      "capture_event_index_conflict",
    );
    expect(missing_project_response.statusCode).toBe(404);
    expect(missing_project_response.json().error.type).toBe(
      "project_not_found",
    );
    expect(missing_capture_session_response.statusCode).toBe(404);
    expect(missing_capture_session_response.json().error.type).toBe(
      "capture_session_not_found",
    );
    expect(invalid_asset_response.statusCode).toBe(404);
    expect(invalid_asset_response.json().error.type).toBe(
      "capture_asset_not_found",
    );
    expect(deleted_asset_response.statusCode).toBe(404);
    expect(deleted_asset_response.json().error.type).toBe(
      "capture_asset_not_found",
    );
    expect(raw_value_response.statusCode).toBe(400);
    expect(raw_value_response.json().error.type).toBe("invalid_capture_event");
    expect(unredacted_response.statusCode).toBe(400);
    expect(unredacted_response.json().error.type).toBe("invalid_capture_event");
    expect(delete_response.statusCode).toBe(204);
    expect(delete_response.body).toBe("");

    const persisted_after_delete = await pool.query<{
      event_deleted: boolean;
      asset_deleted: boolean;
      file_deleted: boolean;
      event_deleted_by_id: string | null;
      event_version: number;
      event_metadata: unknown;
    }>(
      `
      SELECT
        capture_event.is_deleted AS event_deleted,
        capture_asset.is_deleted AS asset_deleted,
        app_file.is_deleted AS file_deleted,
        capture_event.deleted_by_id AS event_deleted_by_id,
        capture_event.version AS event_version,
        capture_event.metadata AS event_metadata
      FROM capture_schema.capture_event capture_event
      INNER JOIN capture_schema.capture_asset capture_asset ON capture_asset.id = capture_event.capture_asset_id
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      WHERE capture_event.id = $1
      AND capture_asset.id = $2
      AND app_file.id = $3
    `,
      [capture_event_id, capture_asset_id, file_id],
    );

    expect(persisted_after_delete.rows[0]).toMatchObject({
      event_deleted: true,
      asset_deleted: false,
      file_deleted: false,
      event_deleted_by_id: owner_context?.org_user_id,
      event_version: 2,
      event_metadata: { source: "manual" },
    });

    const hidden_get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events/${capture_event_id}`,
      cookies: { ossie_session: session_token },
    });

    expect(hidden_get_response.statusCode).toBe(404);
    expect(hidden_get_response.json().error.type).toBe(
      "capture_event_not_found",
    );

    await app.close();
  }, 30000);

  it("reorders manual capture events while preserving contiguous indexes", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
      "manual",
    );
    const app = build({ logger: false });

    const first_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "note",
        event_index: 1,
        note: "First step",
      },
    });
    const second_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "note",
        event_index: 2,
        note: "Second step",
      },
    });
    const third_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "note",
        event_index: 3,
        note: "Third step",
      },
    });

    expect(first_response.statusCode).toBe(201);
    expect(second_response.statusCode).toBe(201);
    expect(third_response.statusCode).toBe(201);

    const first_id = first_response.json().capture_event.id as string;
    const second_id = second_response.json().capture_event.id as string;
    const third_id = third_response.json().capture_event.id as string;

    await run_test_fixture_mutation(
      `
      UPDATE capture_schema.capture_event
      SET is_deleted = TRUE
      WHERE id = $1
    `,
      [second_id],
    );

    const reorder_response = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events/order`,
      cookies: { ossie_session: session_token },
      payload: {
        event_ids: [third_id, first_id],
      },
    });
    const list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
    });
    const invalid_extension_session_id = await create_capture_session(
      session_token,
      project_id,
      "extension",
    );
    const extension_reorder_response = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${project_id}/capture-sessions/${invalid_extension_session_id}/events/order`,
      cookies: { ossie_session: session_token },
      payload: {
        event_ids: [third_id, first_id],
      },
    });

    expect(reorder_response.statusCode).toBe(200);
    expect(
      reorder_response
        .json()
        .capture_events.map((event: { id: string }) => event.id),
    ).toEqual([third_id, first_id]);
    expect(
      reorder_response
        .json()
        .capture_events.map(
          (event: { event_index: number }) => event.event_index,
        ),
    ).toEqual([1, 2]);
    expect(list_response.statusCode).toBe(200);
    expect(
      list_response
        .json()
        .capture_events.map((event: { id: string }) => event.id),
    ).toEqual([third_id, first_id]);
    expect(
      list_response
        .json()
        .capture_events.map(
          (event: { event_index: number }) => event.event_index,
        ),
    ).toEqual([1, 2]);
    expect(extension_reorder_response.statusCode).toBe(409);
    expect(extension_reorder_response.json().error.type).toBe(
      "capture_event_reorder_not_allowed",
    );

    await app.close();
  });

  it("updates safe manual capture event text and uses it for later guide generation", async () => {
    const session_token = await setup_owner();
    const project_id = await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
      "manual",
    );
    const owner_context = await get_owner_context();
    const app = build({ logger: false });

    const create_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "note",
        event_index: 1,
        note: "Original source note",
      },
    });
    expect(create_response.statusCode).toBe(201);
    const capture_event_id = create_response.json().capture_event.id as string;

    const update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events/${capture_event_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        page_title: " Department list ",
        page_url: " https://example.internal/app/departments ",
        target_label: " Add Department ",
        target_text: " ",
        input_intent: " ",
        note: " Open the corrected department list. ",
      },
    });
    expect(update_response.statusCode).toBe(200);
    expect(update_response.json().capture_event).toMatchObject({
      id: capture_event_id,
      event_type: "note",
      event_index: 1,
      page_title: "Department list",
      page_url: "https://example.internal/app/departments",
      target_label: "Add Department",
      target_text: null,
      input_intent: null,
      note: "Open the corrected department list.",
      updated_by_id: owner_context?.org_user_id,
      version: 2,
    });

    const persisted = await pool.query<{
      event_index: number;
      page_title: string | null;
      page_url: string | null;
      target_label: string | null;
      target_text: string | null;
      input_intent: string | null;
      note: string | null;
      updated_by_id: string;
      version: number;
    }>(
      `
      SELECT
        event_index,
        page_title,
        page_url,
        target_label,
        target_text,
        input_intent,
        note,
        updated_by_id,
        version
      FROM capture_schema.capture_event
      WHERE id = $1
    `,
      [capture_event_id],
    );
    expect(persisted.rows[0]).toEqual({
      event_index: 1,
      page_title: "Department list",
      page_url: "https://example.internal/app/departments",
      target_label: "Add Department",
      target_text: null,
      input_intent: null,
      note: "Open the corrected department list.",
      updated_by_id: owner_context?.org_user_id,
      version: 2,
    });

    const partial_update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events/${capture_event_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        page_title: "Department list v2",
      },
    });
    expect(partial_update_response.statusCode).toBe(200);
    expect(partial_update_response.json().capture_event).toMatchObject({
      page_title: "Department list v2",
      page_url: "https://example.internal/app/departments",
      target_label: "Add Department",
      note: "Open the corrected department list.",
      version: 3,
    });

    const create_guide_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Department guide",
      },
    });
    expect(create_guide_response.statusCode).toBe(201);
    expect(create_guide_response.json().guide_blocks[0].step).toMatchObject({
      title: "Open the corrected department list.",
      body: null,
      source_capture_event_id: capture_event_id,
    });

    const extension_session_id = await create_capture_session(
      session_token,
      project_id,
      "extension",
    );
    const extension_event_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${extension_session_id}/events`,
      cookies: { ossie_session: session_token },
      payload: {
        event_type: "note",
        event_index: 1,
        note: "Extension note",
      },
    });
    expect(extension_event_response.statusCode).toBe(201);
    const extension_update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${extension_session_id}/events/${extension_event_response.json().capture_event.id}`,
      cookies: { ossie_session: session_token },
      payload: {
        note: "Should not update",
      },
    });
    expect(extension_update_response.statusCode).toBe(409);
    expect(extension_update_response.json().error.type).toBe(
      "capture_event_update_not_allowed",
    );

    await run_test_fixture_mutation(
      `
      UPDATE capture_schema.capture_session
      SET status = 'archived'
      WHERE id = $1
    `,
      [capture_session_id],
    );
    const archived_update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events/${capture_event_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        note: "Should not update archived session",
      },
    });
    expect(archived_update_response.statusCode).toBe(409);
    expect(archived_update_response.json().error.type).toBe(
      "capture_event_update_not_allowed",
    );

    await app.close();
  });
});
