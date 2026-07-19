import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
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
  return (
    response.cookies.find((cookie) => cookie.name === "ossie_session")?.value ??
    ""
  );
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
  return {
    project_id: response.json().project.id as string,
    project_version_id: response.json().project.default_project_version
      .id as string,
  };
};

const create_capture_session = async (
  session_token: string,
  project_id: string,
  project_version_id: string,
) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions`,
    cookies: { ossie_session: session_token },
    payload: {
      name: "Create department workflow",
      project_version_id,
      source_type: "manual",
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
      file: {
        storage_key: `captures/${capture_session_id}/screenshot-${Date.now()}.png`,
        mime_type: "image/png",
        size_bytes: 123456,
      },
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().capture_asset.id as string;
};

const create_capture_event = async (
  session_token: string,
  project_id: string,
  capture_session_id: string,
  payload: Record<string, unknown>,
) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/events`,
    cookies: { ossie_session: session_token },
    payload,
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  return response.json().capture_event.id as string;
};

const multipart_payload = (
  parts: Array<{
    name: string;
    value: string | Buffer;
    filename?: string;
    content_type?: string;
  }>,
) => {
  const boundary = "----ossie-test-boundary";
  const chunks: Buffer[] = [];

  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${part.name}"${
          part.filename ? `; filename="${part.filename}"` : ""
        }\r\n`,
      ),
    );
    if (part.content_type) {
      chunks.push(Buffer.from(`Content-Type: ${part.content_type}\r\n`));
    }
    chunks.push(Buffer.from("\r\n"));
    chunks.push(
      Buffer.isBuffer(part.value) ? part.value : Buffer.from(part.value),
    );
    chunks.push(Buffer.from("\r\n"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
    },
    payload: Buffer.concat(chunks),
  };
};

describe("DB-backed guide API", () => {
  let storage_root: string;
  let previous_storage_root: string | undefined;
  let previous_max_upload_bytes: string | undefined;

  beforeAll(async () => {
    storage_root = await mkdtemp(path.join(tmpdir(), "ossie-guide-test-"));
    previous_storage_root = process.env.OSSIE_LOCAL_STORAGE_ROOT;
    previous_max_upload_bytes = process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES;
    process.env.OSSIE_LOCAL_STORAGE_ROOT = storage_root;
    process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES = "1048576";
  });

  beforeEach(async () => {
    await reset_test_database();
  });

  afterAll(async () => {
    if (previous_storage_root === undefined) {
      delete process.env.OSSIE_LOCAL_STORAGE_ROOT;
    } else {
      process.env.OSSIE_LOCAL_STORAGE_ROOT = previous_storage_root;
    }

    if (previous_max_upload_bytes === undefined) {
      delete process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES;
    } else {
      process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES = previous_max_upload_bytes;
    }

    await rm(storage_root, { recursive: true, force: true });
    await pool.end();
  });

  it("creates lists and reads an editable draft guide from selected capture events", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
      project_version_id,
    );
    const active_asset_id = await create_capture_asset(
      session_token,
      project_id,
      capture_session_id,
    );
    const deleted_asset_id = await create_capture_asset(
      session_token,
      project_id,
      capture_session_id,
    );

    const note_event_id = await create_capture_event(
      session_token,
      project_id,
      capture_session_id,
      {
        event_type: "note",
        event_index: 1,
        note: "Start from department list",
      },
    );
    const click_event_id = await create_capture_event(
      session_token,
      project_id,
      capture_session_id,
      {
        event_type: "click",
        event_index: 2,
        capture_asset_id: deleted_asset_id,
        page_title: "Department",
        target_label: "Add Department",
        target_selector: "button[data-testid='add-department']",
      },
    );
    const input_event_id = await create_capture_event(
      session_token,
      project_id,
      capture_session_id,
      {
        event_type: "input",
        event_index: 3,
        capture_asset_id: active_asset_id,
        page_title: "New Department",
        target_label: "Department Name",
        input_intent: "typed a redacted department name",
      },
    );

    await run_test_fixture_mutation(
      `
      UPDATE capture_schema.capture_asset
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [deleted_asset_id],
    );

    const app = build({ logger: false });
    const create_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Department setup guide",
        selected_capture_event_ids: [
          input_event_id,
          note_event_id,
          click_event_id,
        ],
      },
    });

    expect(create_response.statusCode).toBe(201);
    const created_body = create_response.json();
    expect(created_body.edition).toMatchObject({
      project_id,
      source_capture_session_id: capture_session_id,
      title: "Department setup guide",
      status: "draft",
    });
    expect(
      created_body.guide_blocks.map(
        (block: { block_index: number }) => block.block_index,
      ),
    ).toEqual([1, 2, 3]);
    expect(
      created_body.guide_blocks.map(
        (block: { step: { title: string } }) => block.step.title,
      ),
    ).toEqual([
      "Start from department list",
      'Click "Add Department"',
      'Enter the required value in "Department Name"',
    ]);
    expect(created_body.guide_blocks[0].step.source_capture_event_id).toBe(
      note_event_id,
    );
    expect(
      created_body.guide_blocks[1].step.source_capture_asset_id,
    ).toBeNull();
    expect(created_body.guide_blocks[2].step.source_capture_asset_id).toBe(
      active_asset_id,
    );
    expect(JSON.stringify(created_body)).not.toContain("target_selector");
    expect(JSON.stringify(created_body)).not.toContain("input_intent");
    expect(JSON.stringify(created_body)).not.toContain("storage_key");
    expect(JSON.stringify(created_body)).not.toContain("is_deleted");

    const guide_id = created_body.artifact.id as string;
    const list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });
    const get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });
    const missing_event_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Missing event guide",
        selected_capture_event_ids: ["missing_event"],
      },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json().guide_editions).toHaveLength(1);
    expect(list_response.json().guide_editions[0].artifact.id).toBe(guide_id);
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json().artifact.id).toBe(guide_id);
    expect(get_response.json().guide_blocks).toHaveLength(3);
    expect(missing_event_response.statusCode).toBe(404);
    expect(missing_event_response.json().error.type).toBe(
      "capture_event_not_found",
    );

    const first_step_id = created_body.guide_blocks[0].step.id as string;
    const first_block_id = created_body.guide_blocks[0].id as string;
    const second_block_id = created_body.guide_blocks[1].id as string;
    const third_block_id = created_body.guide_blocks[2].id as string;

    const update_guide_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Edited department setup guide",
        description: "Internal onboarding draft",
        expected_edition_version: created_body.edition.version,
      },
    });
    const update_step_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/steps/${first_step_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Start from the department list",
        body: "Use the department list as the starting point.",
        expected_working_draft_version: created_body.working_draft.version,
      },
    });
    expect(update_step_response.statusCode, update_step_response.body).toBe(
      200,
    );
    const reorder_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/reorder?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        block_ids: [third_block_id, first_block_id, second_block_id],
        expected_working_draft_version:
          update_step_response.json().working_draft.version,
      },
    });
    const delete_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${first_block_id}?project_version_id=${project_version_id}&expected_working_draft_version=${reorder_response.json().working_draft.version}`,
      cookies: { ossie_session: session_token },
    });
    const after_delete_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });
    const create_header_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        block_type: "header",
        expected_working_draft_version:
          after_delete_response.json().working_draft.version,
        position: {
          placement: "before",
          guide_block_id: second_block_id,
        },
        title: "Department details",
      },
    });
    const created_header_block = create_header_response
      .json()
      .guide_blocks?.find(
        (block: { block_type: string }) => block.block_type === "header",
      );
    const update_header_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${created_header_block?.id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        expected_working_draft_version:
          create_header_response.json().working_draft.version,
        title: "Department setup details",
      },
    });
    const after_header_update_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });
    const create_paragraph_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        block_type: "paragraph",
        expected_working_draft_version:
          update_header_response.json().working_draft.version,
        position: {
          placement: "after",
          guide_block_id: created_header_block?.id,
        },
        body: "Confirm the department fields before saving.",
      },
    });
    const created_paragraph_block = create_paragraph_response
      .json()
      .guide_blocks?.find(
        (block: { block_type: string }) => block.block_type === "paragraph",
      );
    const update_paragraph_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${created_paragraph_block?.id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        expected_working_draft_version:
          create_paragraph_response.json().working_draft.version,
        body: "Review the department fields before saving.",
      },
    });
    const create_divider_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        block_type: "divider",
        expected_working_draft_version:
          update_paragraph_response.json().working_draft.version,
        position: {
          placement: "after",
          guide_block_id: created_paragraph_block?.id,
        },
      },
    });
    const created_divider_block = create_divider_response
      .json()
      .guide_blocks?.find(
        (block: { block_type: string }) => block.block_type === "divider",
      );
    const after_paragraph_divider_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });
    const archive_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/archive?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        expected_edition_version: update_guide_response.json().edition.version,
      },
    });
    const archived_step_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/steps/${first_step_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Cannot edit archived guide",
        expected_working_draft_version:
          create_divider_response.json().working_draft.version,
      },
    });

    expect(update_guide_response.statusCode).toBe(200);
    expect(update_guide_response.json().edition).toMatchObject({
      guide_id,
      title: "Edited department setup guide",
      description: "Internal onboarding draft",
      version: 2,
    });
    expect(update_step_response.statusCode).toBe(200);
    expect(update_step_response.json().guide_step).toMatchObject({
      id: first_step_id,
      title: "Start from the department list",
      body: "Use the department list as the starting point.",
      source_capture_event_id: note_event_id,
      version: 2,
    });
    expect(reorder_response.statusCode).toBe(200);
    expect(
      reorder_response
        .json()
        .guide_blocks.map((block: { id: string; block_index: number }) => ({
          id: block.id,
          block_index: block.block_index,
        })),
    ).toEqual([
      { id: third_block_id, block_index: 1 },
      { id: first_block_id, block_index: 2 },
      { id: second_block_id, block_index: 3 },
    ]);
    expect(delete_response.statusCode).toBe(200);
    expect(delete_response.json().working_draft).toBeDefined();
    expect(after_delete_response.statusCode).toBe(200);
    expect(
      after_delete_response
        .json()
        .guide_blocks.map((block: { id: string; block_index: number }) => ({
          id: block.id,
          block_index: block.block_index,
        })),
    ).toEqual([
      { id: third_block_id, block_index: 1 },
      { id: second_block_id, block_index: 2 },
    ]);
    expect(JSON.stringify(after_delete_response.json())).not.toContain(
      first_block_id,
    );
    expect(create_header_response.statusCode).toBe(201);
    expect(
      create_header_response
        .json()
        .guide_blocks.map((block: { id: string; block_index: number }) => ({
          id: block.id,
          block_index: block.block_index,
        })),
    ).toEqual([
      { id: third_block_id, block_index: 1 },
      { id: created_header_block.id, block_index: 2 },
      { id: second_block_id, block_index: 3 },
    ]);
    expect(created_header_block).toMatchObject({
      block_type: "header",
      title: "Department details",
      step: null,
    });
    expect(update_header_response.statusCode).toBe(200);
    expect(update_header_response.json().guide_block).toMatchObject({
      id: created_header_block.id,
      title: "Department setup details",
      step: null,
    });
    expect(after_header_update_response.statusCode).toBe(200);
    expect(
      after_header_update_response
        .json()
        .guide_blocks.map(
          (block: { block_index: number }) => block.block_index,
        ),
    ).toEqual([1, 2, 3]);
    expect(after_header_update_response.json().guide_blocks[1]).toMatchObject({
      id: created_header_block.id,
      title: "Department setup details",
    });
    expect(create_paragraph_response.statusCode).toBe(201);
    expect(created_paragraph_block).toMatchObject({
      block_type: "paragraph",
      body: "Confirm the department fields before saving.",
      step: null,
    });
    expect(update_paragraph_response.statusCode).toBe(200);
    expect(update_paragraph_response.json().guide_block).toMatchObject({
      id: created_paragraph_block.id,
      body: "Review the department fields before saving.",
      step: null,
    });
    expect(create_divider_response.statusCode).toBe(201);
    expect(created_divider_block).toMatchObject({
      block_type: "divider",
      title: null,
      body: null,
      step: null,
    });
    expect(after_paragraph_divider_response.statusCode).toBe(200);
    expect(
      after_paragraph_divider_response
        .json()
        .guide_blocks.map(
          (block: { block_index: number }) => block.block_index,
        ),
    ).toEqual([1, 2, 3, 4, 5]);
    expect(
      after_paragraph_divider_response.json().guide_blocks[2],
    ).toMatchObject({
      id: created_paragraph_block.id,
      body: "Review the department fields before saving.",
    });
    expect(
      after_paragraph_divider_response.json().guide_blocks[3],
    ).toMatchObject({
      id: created_divider_block.id,
      title: null,
      body: null,
    });
    expect(archive_response.statusCode).toBe(200);
    expect(archive_response.json().edition.status).toBe("archived");
    expect(archived_step_response.statusCode).toBe(409);
    expect(archived_step_response.json().error.type).toBe("guide_not_editable");

    const capture_counts = await pool.query<{ count: string }>(
      `
      SELECT COUNT(*) AS count
      FROM capture_schema.capture_event
      WHERE capture_session_id = $1
      AND is_deleted = FALSE
    `,
      [capture_session_id],
    );
    expect(capture_counts.rows[0]?.count).toBe("3");

    await app.close();
  }, 60_000);

  it("persists generated guide steps from screenshot-backed capture events", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
      project_version_id,
    );
    const active_asset_id = await create_capture_asset(
      session_token,
      project_id,
      capture_session_id,
    );
    const deleted_asset_id = await create_capture_asset(
      session_token,
      project_id,
      capture_session_id,
    );

    const first_capture_event_id = await create_capture_event(
      session_token,
      project_id,
      capture_session_id,
      {
        event_type: "capture",
        event_index: 2,
        capture_asset_id: active_asset_id,
        page_title: "Department List",
        page_url: "https://example.test/departments",
        input_value_redacted: true,
      },
    );
    const duplicate_asset_event_id = await create_capture_event(
      session_token,
      project_id,
      capture_session_id,
      {
        event_type: "capture",
        event_index: 3,
        capture_asset_id: active_asset_id,
        page_title: "Department List Duplicate",
        page_url: "https://example.test/departments",
        input_value_redacted: true,
      },
    );
    const deleted_asset_event_id = await create_capture_event(
      session_token,
      project_id,
      capture_session_id,
      {
        event_type: "capture",
        event_index: 1,
        capture_asset_id: deleted_asset_id,
        page_url: "https://example.test/departments/new",
        input_value_redacted: true,
      },
    );

    await run_test_fixture_mutation(
      `
      UPDATE capture_schema.capture_asset
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [deleted_asset_id],
    );

    const app = build({ logger: false });
    const create_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Screenshot capture guide",
      },
    });

    expect(create_response.statusCode).toBe(201);
    const created_body = create_response.json();
    expect(
      created_body.guide_blocks.map(
        (block: { step: { source_capture_event_id: string } }) =>
          block.step.source_capture_event_id,
      ),
    ).toEqual([
      deleted_asset_event_id,
      first_capture_event_id,
      duplicate_asset_event_id,
    ]);
    expect(
      created_body.guide_blocks.map(
        (block: { step: { source_capture_asset_id: string | null } }) =>
          block.step.source_capture_asset_id,
      ),
    ).toEqual([null, active_asset_id, active_asset_id]);
    expect(
      created_body.guide_blocks.map(
        (block: {
          step: {
            title: string;
            body: string | null;
            source_capture_asset_id: string | null;
          };
        }) => ({
          title: block.step.title,
          body: block.step.body,
          source_capture_asset_id: block.step.source_capture_asset_id,
        }),
      ),
    ).toEqual([
      {
        title: 'Capture "https://example.test/departments/new"',
        body: "Captured from this page.",
        source_capture_asset_id: null,
      },
      {
        title: 'Capture "Department List"',
        body: "Captured from https://example.test/departments.",
        source_capture_asset_id: active_asset_id,
      },
      {
        title: 'Capture "Department List Duplicate"',
        body: "Captured from https://example.test/departments.",
        source_capture_asset_id: active_asset_id,
      },
    ]);
    expect(JSON.stringify(created_body)).not.toContain("input_value");
    expect(JSON.stringify(created_body)).not.toContain("storage_key");

    const guide_id = created_body.artifact.id as string;
    const get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });

    expect(get_response.statusCode).toBe(200);
    expect(get_response.json().source_capture_assets).toEqual([
      {
        id: active_asset_id,
        capture_session_id,
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: null,
        page_url: null,
        page_title: null,
        captured_at: expect.any(String),
        file_url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${active_asset_id}/file`,
        file: {
          id: expect.any(String),
          original_name: null,
          mime_type: "image/png",
          size_bytes: 123456,
        },
      },
    ]);
    expect(JSON.stringify(get_response.json())).not.toContain(deleted_asset_id);
    expect(JSON.stringify(get_response.json())).not.toContain("storage_key");
    expect(JSON.stringify(get_response.json())).not.toContain(
      "checksum_sha256",
    );

    await app.close();
  }, 30_000);

  it("replaces and hides guide step screenshots without mutating capture source records", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
      project_version_id,
    );
    const source_asset_id = await create_capture_asset(
      session_token,
      project_id,
      capture_session_id,
    );
    const replacement_asset_id = await create_capture_asset(
      session_token,
      project_id,
      capture_session_id,
    );

    await create_capture_event(session_token, project_id, capture_session_id, {
      event_type: "capture",
      event_index: 1,
      capture_asset_id: source_asset_id,
      page_title: "Department List",
      page_url: "https://example.test/departments",
    });

    const app = build({ logger: false });
    const create_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Screenshot replacement guide",
      },
    });

    expect(create_response.statusCode).toBe(201);
    const guide_id = create_response.json().artifact.id as string;
    const guide_block_id = create_response.json().guide_blocks[0].id as string;

    const annotations_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${guide_block_id}/annotations?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        expected_working_draft_version:
          create_response.json().working_draft.version,
        annotations: [
          {
            type: "highlight",
            x: 0.2,
            y: 0.15,
            width: 0.25,
            height: 0.1,
          },
        ],
      },
    });

    expect(annotations_response.statusCode).toBe(200);
    expect(
      annotations_response.json().guide_block.step.annotations,
    ).toMatchObject([
      {
        id: expect.any(String),
        annotation_type: "highlight",
        annotation_index: 1,
        x: 0.2,
        y: 0.15,
        width: 0.25,
        height: 0.1,
      },
    ]);

    const annotated_detail_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });

    expect(annotated_detail_response.statusCode).toBe(200);
    expect(
      annotated_detail_response.json().guide_blocks[0].step.annotations,
    ).toEqual(annotations_response.json().guide_block.step.annotations);

    const annotation_id = annotations_response.json().guide_block.step
      .annotations[0].id as string;
    const revised_annotations_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${guide_block_id}/annotations?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        expected_working_draft_version:
          annotations_response.json().working_draft.version,
        annotations: [
          {
            id: annotation_id,
            type: "highlight",
            x: 0.25,
            y: 0.15,
            width: 0.25,
            height: 0.1,
          },
        ],
      },
    });

    expect(
      revised_annotations_response.statusCode,
      revised_annotations_response.body,
    ).toBe(200);
    expect(
      revised_annotations_response.json().guide_block.step.annotations,
    ).toMatchObject([{ id: annotation_id, x: 0.25, version: 2 }]);

    const annotated_export_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/export/markdown?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });

    expect(annotated_export_response.statusCode).toBe(200);
    const public_base_url = (
      process.env.API_URL ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    expect(annotated_export_response.json().filename).toBe(
      "screenshot-replacement-guide.md",
    );
    expect(annotated_export_response.json().markdown).toContain(
      "# Screenshot replacement guide\n",
    );
    expect(annotated_export_response.json().markdown).toContain(
      '## 1. Capture "Department List"',
    );
    expect(annotated_export_response.json().markdown).toContain(
      `![Capture "Department List"](${public_base_url}/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${source_asset_id}/file)`,
    );
    expect(annotated_export_response.json().markdown).toContain(
      "- Highlight 1: x 25%, y 15%, width 25%, height 10%",
    );
    expect(annotated_export_response.json().markdown).not.toContain(
      "storage_key",
    );
    expect(annotated_export_response.json().markdown).not.toContain(
      "organization_id",
    );

    const replace_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${guide_block_id}/screenshot?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        capture_asset_id: replacement_asset_id,
        expected_working_draft_version:
          revised_annotations_response.json().working_draft.version,
      },
    });

    expect(replace_response.statusCode).toBe(200);
    expect(replace_response.json().guide_block.step).toMatchObject({
      source_capture_asset_id: source_asset_id,
      selected_capture_asset_id: replacement_asset_id,
      screenshot_hidden: false,
      display_capture_asset_id: replacement_asset_id,
      annotations: [],
    });

    const after_replace_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });

    expect(after_replace_response.statusCode).toBe(200);
    expect(after_replace_response.json().guide_blocks[0].step).toMatchObject({
      source_capture_asset_id: source_asset_id,
      selected_capture_asset_id: replacement_asset_id,
      screenshot_hidden: false,
      display_capture_asset_id: replacement_asset_id,
      annotations: [],
    });
    expect(
      after_replace_response
        .json()
        .source_capture_assets.map((asset: { id: string }) => asset.id),
    ).toEqual([replacement_asset_id]);

    const source_block = await pool.query<{
      source_capture_asset_id: string | null;
    }>(
      `
      SELECT source_capture_asset_id
      FROM guide_schema.guide_step
      WHERE guide_block_id = $1
    `,
      [guide_block_id],
    );
    expect(source_block.rows[0]?.source_capture_asset_id).toBe(source_asset_id);

    const hide_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${guide_block_id}/screenshot?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        capture_asset_id: null,
        expected_working_draft_version:
          replace_response.json().working_draft.version,
      },
    });

    expect(hide_response.statusCode).toBe(200);
    expect(hide_response.json().guide_block.step).toMatchObject({
      source_capture_asset_id: source_asset_id,
      selected_capture_asset_id: null,
      screenshot_hidden: true,
      display_capture_asset_id: null,
      annotations: [],
    });

    const after_hide_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });

    expect(after_hide_response.statusCode).toBe(200);
    expect(after_hide_response.json().guide_blocks[0].step).toMatchObject({
      selected_capture_asset_id: null,
      screenshot_hidden: true,
      display_capture_asset_id: null,
      annotations: [],
    });
    expect(after_hide_response.json().source_capture_assets).toEqual([]);

    const hidden_export_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/export/markdown?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });

    expect(hidden_export_response.statusCode).toBe(200);
    expect(hidden_export_response.json().markdown).not.toContain(
      "![Department List]",
    );
    expect(hidden_export_response.json().markdown).not.toContain("Highlight 1");

    await app.close();
  }, 30_000);

  it("uploads a replacement guide step screenshot and publishes it in the snapshot", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
      project_version_id,
    );
    const source_asset_id = await create_capture_asset(
      session_token,
      project_id,
      capture_session_id,
    );

    await create_capture_event(session_token, project_id, capture_session_id, {
      event_type: "capture",
      event_index: 1,
      capture_asset_id: source_asset_id,
      page_title: "Department List",
      page_url: "https://example.test/departments",
    });

    const app = build({ logger: false });
    const create_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "Uploaded screenshot guide",
      },
    });

    expect(create_response.statusCode).toBe(201);
    const guide_id = create_response.json().artifact.id as string;
    const guide_block_id = create_response.json().guide_blocks[0].id as string;
    const uploaded_bytes = Buffer.from("uploaded replacement png bytes");
    const upload_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${guide_block_id}/screenshot-upload?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      ...multipart_payload([
        {
          name: "file",
          filename: "replacement.png",
          content_type: "image/png",
          value: uploaded_bytes,
        },
        { name: "width", value: "1440" },
        { name: "height", value: "900" },
        { name: "page_title", value: "Uploaded replacement" },
        { name: "page_url", value: "https://example.test/replacement" },
        { name: "metadata", value: JSON.stringify({ source: "editor" }) },
        { name: "capture_session_id", value: "attacker_session" },
        {
          name: "expected_working_draft_version",
          value: String(create_response.json().working_draft.version),
        },
      ]),
    });

    expect(upload_response.statusCode).toBe(201);
    const uploaded_asset_id = upload_response.json().capture_asset.id as string;
    expect(upload_response.json().capture_asset).toMatchObject({
      id: uploaded_asset_id,
      capture_session_id,
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      page_title: "Uploaded replacement",
      page_url: "https://example.test/replacement",
      file_url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${uploaded_asset_id}/file`,
      file: {
        original_name: "replacement.png",
        mime_type: "image/png",
        size_bytes: uploaded_bytes.length,
      },
    });
    expect(upload_response.json().guide_block.step).toMatchObject({
      source_capture_asset_id: source_asset_id,
      selected_capture_asset_id: uploaded_asset_id,
      screenshot_hidden: false,
      display_capture_asset_id: uploaded_asset_id,
    });
    expect(JSON.stringify(upload_response.json())).not.toContain(
      "attacker_session",
    );
    expect(JSON.stringify(upload_response.json())).not.toContain("storage_key");

    const uploaded_rows = await pool.query<{
      asset_id: string;
      file_id: string;
      capture_session_id: string;
      original_name: string;
      mime_type: string;
      size_bytes: string;
      selected_capture_asset_id: string;
      source_capture_asset_id: string;
    }>(
      `
      SELECT
        capture_asset.id AS asset_id,
        app_file.id AS file_id,
        capture_asset.capture_session_id,
        app_file.original_name,
        app_file.mime_type,
        app_file.size_bytes,
        guide_step.selected_capture_asset_id,
        guide_step.source_capture_asset_id
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      INNER JOIN guide_schema.guide_step guide_step ON guide_step.selected_capture_asset_id = capture_asset.id
      WHERE capture_asset.id = $1
    `,
      [uploaded_asset_id],
    );
    expect(uploaded_rows.rows).toEqual([
      {
        asset_id: uploaded_asset_id,
        file_id: expect.any(String),
        capture_session_id,
        original_name: "replacement.png",
        mime_type: "image/png",
        size_bytes: String(uploaded_bytes.length),
        selected_capture_asset_id: uploaded_asset_id,
        source_capture_asset_id: source_asset_id,
      },
    ]);

    const detail_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });
    expect(detail_response.statusCode).toBe(200);
    expect(
      detail_response.json().guide_blocks[0].step.display_capture_asset_id,
    ).toBe(uploaded_asset_id);
    expect(
      detail_response
        .json()
        .source_capture_assets.map((asset: { id: string }) => asset.id),
    ).toEqual([uploaded_asset_id]);

    const publish_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/publish?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });
    expect(publish_response.statusCode).toBe(201);
    const slug = publish_response.json().publish_link.slug as string;

    const public_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/publish-links/${slug}`,
    });
    expect(public_response.statusCode).toBe(200);
    expect(
      public_response.json().published_artifact.snapshot.blocks[0].source_asset,
    ).toMatchObject({
      id: uploaded_asset_id,
      file_url: `/api/v1/public/publish-links/${slug}/assets/${uploaded_asset_id}/file`,
      file: {
        original_name: "replacement.png",
        mime_type: "image/png",
        size_bytes: uploaded_bytes.length,
      },
    });

    await app.close();
  }, 60_000);

  it("exports a guide draft as HTML ZIP with local screenshot assets", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
      project_version_id,
    );
    const source_asset_id = await create_capture_asset(
      session_token,
      project_id,
      capture_session_id,
    );

    await create_capture_event(session_token, project_id, capture_session_id, {
      event_type: "capture",
      event_index: 1,
      capture_asset_id: source_asset_id,
      page_title: "Department List",
    });

    const app = build({ logger: false });
    const create_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/from-capture-session/${capture_session_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        title: "HTML Export Guide",
      },
    });

    expect(create_response.statusCode).toBe(201);
    const guide_id = create_response.json().artifact.id as string;
    const guide_block_id = create_response.json().guide_blocks[0].id as string;
    const uploaded_bytes = Buffer.from("html export png bytes");
    const upload_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${guide_block_id}/screenshot-upload?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      ...multipart_payload([
        {
          name: "file",
          filename: "html-export.png",
          content_type: "image/png",
          value: uploaded_bytes,
        },
        { name: "page_title", value: "Exported Department List" },
        {
          name: "expected_working_draft_version",
          value: String(create_response.json().working_draft.version),
        },
      ]),
    });

    expect(upload_response.statusCode).toBe(201);
    const uploaded_asset_id = upload_response.json().capture_asset.id as string;
    const annotations_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/blocks/${guide_block_id}/annotations?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
      payload: {
        expected_working_draft_version:
          upload_response.json().working_draft.version,
        annotations: [
          {
            type: "highlight",
            x: 0.2,
            y: 0.15,
            width: 0.25,
            height: 0.1,
          },
        ],
      },
    });

    expect(annotations_response.statusCode).toBe(200);

    const export_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/guides/${guide_id}/export/html.zip?project_version_id=${project_version_id}`,
      cookies: { ossie_session: session_token },
    });

    expect(export_response.statusCode).toBe(200);
    expect(export_response.headers["content-type"]).toBe("application/zip");
    expect(export_response.headers["content-disposition"]).toBe(
      'attachment; filename="html-export-guide-html-export.zip"',
    );
    const JSZip = (await import("jszip")).default;
    const archive = await JSZip.loadAsync(export_response.rawPayload);
    const html = await archive.file("index.html")?.async("string");

    expect(html).toContain("HTML Export Guide");
    expect(html).toContain(`assets/1-${uploaded_asset_id}.png`);
    expect(html).toContain("left: 20%; top: 15%; width: 25%; height: 10%;");
    expect(html).not.toContain("storage_key");
    expect(html).not.toContain("organizations/");
    await expect(
      archive.file(`assets/1-${uploaded_asset_id}.png`)?.async("nodebuffer"),
    ).resolves.toEqual(uploaded_bytes);
    await app.close();
  }, 30_000);
});
