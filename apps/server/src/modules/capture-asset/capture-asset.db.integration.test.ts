import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";

const multipart_payload = (
  parts: Array<{
    name: string;
    value: string | Buffer;
    filename?: string;
    content_type?: string;
  }>,
) => {
  const boundary = "----ossie-db-test-boundary";
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
    cookies: {
      ossie_session: session_token,
    },
    payload: {
      name: "Onboarding Demo",
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

const create_capture_session = async (
  session_token: string,
  project_id: string,
  project_version_id: string,
) => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${project_id}/capture-sessions`,
    cookies: {
      ossie_session: session_token,
    },
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

describe("DB-backed capture asset API", () => {
  let storage_root: string;

  beforeEach(async () => {
    storage_root = await mkdtemp(path.join(tmpdir(), "ossie-db-storage-"));
    process.env.OSSIE_LOCAL_STORAGE_ROOT = storage_root;
    process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES = "1048576";
    await reset_test_database();
  });

  afterEach(async () => {
    delete process.env.OSSIE_LOCAL_STORAGE_ROOT;
    delete process.env.OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES;
    await rm(storage_root, { recursive: true, force: true });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("uploads screenshot bytes stores file metadata and streams bytes back", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
      project_version_id,
    );
    const owner_context = await get_owner_context();
    const app = build({ logger: false });
    const bytes = Buffer.from("fake png bytes");
    const upload_body = multipart_payload([
      {
        name: "file",
        filename: "screenshot.png",
        content_type: "image/png",
        value: bytes,
      },
      { name: "width", value: "1440" },
      { name: "height", value: "900" },
      { name: "device_pixel_ratio", value: "2" },
      { name: "page_url", value: "https://example.internal/app/department" },
      { name: "page_title", value: "Department" },
      { name: "metadata", value: JSON.stringify({ step: 1 }) },
    ]);

    const upload_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/upload`,
      cookies: {
        ossie_session: session_token,
      },
      ...upload_body,
    });

    expect(upload_response.statusCode).toBe(201);
    expect(upload_response.json().capture_asset).toMatchObject({
      organization_id: owner_context?.organization_id,
      project_id,
      capture_session_id,
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 2,
      page_url: "https://example.internal/app/department",
      page_title: "Department",
      file: {
        storage_provider: "local",
        mime_type: "image/png",
        size_bytes: bytes.length,
        original_name: "screenshot.png",
        checksum_sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    });
    expect(JSON.stringify(upload_response.json())).not.toContain("storage_key");

    const capture_asset_id = upload_response.json().capture_asset.id as string;
    const file_id = upload_response.json().capture_asset.file.id as string;
    const persisted = await pool.query<{
      storage_provider: string;
      storage_key: string;
      checksum_sha256: string;
    }>(
      `
      SELECT app_file.storage_provider, app_file.storage_key, app_file.checksum_sha256
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      WHERE capture_asset.id = $1
    `,
      [capture_asset_id],
    );

    expect(persisted.rows[0]).toEqual({
      storage_provider: "local",
      storage_key: `organizations/${owner_context?.organization_id}/projects/${project_id}/capture-sessions/${capture_session_id}/${file_id}.png`,
      checksum_sha256: createHash("sha256").update(bytes).digest("hex"),
    });

    const read_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}/file`,
      cookies: {
        ossie_session: session_token,
      },
    });

    expect(read_response.statusCode).toBe(200);
    expect(read_response.headers["content-type"]).toBe("image/png");
    expect(read_response.headers["content-length"]).toBe(String(bytes.length));
    expect(read_response.headers["cache-control"]).toBe("private, max-age=300");
    expect(read_response.body).toBe(bytes.toString());

    const archive_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}/archive`,
      cookies: { ossie_session: session_token },
      payload: { expected_asset_version: 1 },
    });
    expect(archive_response.statusCode).toBe(200);

    const delete_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}`,
      cookies: {
        ossie_session: session_token,
      },
      payload: { expected_asset_version: 2 },
    });
    expect(delete_response.statusCode).toBe(200);
    expect(delete_response.json()).toMatchObject({ status: "completed" });

    const read_deleted_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}/file`,
      cookies: {
        ossie_session: session_token,
      },
    });
    expect(read_deleted_response.statusCode).toBe(404);
    expect(read_deleted_response.json().error.type).toBe(
      "capture_asset_not_found",
    );

    await app.close();
  });

  it("creates, archives, and physically purges screenshot asset metadata under a capture session", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const capture_session_id = await create_capture_session(
      session_token,
      project_id,
      project_version_id,
    );
    const owner_context = await get_owner_context();
    const app = build({ logger: false });

    const create_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets`,
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 1,
        page_url: "https://example.internal/app/department",
        page_title: "Department",
        captured_at: "2026-06-05T10:00:00.000Z",
        metadata: {
          capture_mode: "manual",
        },
        file: {
          storage_provider: "local",
          storage_key: "captures/acme/project/session/screenshot-1.png",
          mime_type: "image/png",
          size_bytes: 123456,
          original_name: "screenshot-1.png",
          checksum_sha256: "checksum",
          metadata: {
            absolute_path: "/tmp/secret.png",
          },
        },
      },
    });

    expect(create_response.statusCode).toBe(201);
    expect(create_response.json().capture_asset).toMatchObject({
      organization_id: owner_context?.organization_id,
      project_id,
      capture_session_id,
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 1,
      page_url: "https://example.internal/app/department",
      page_title: "Department",
      captured_at: "2026-06-05T10:00:00.000Z",
      created_by_id: owner_context?.org_user_id,
      updated_by_id: owner_context?.org_user_id,
      version: 1,
      file: {
        storage_provider: "local",
        mime_type: "image/png",
        size_bytes: 123456,
        original_name: "screenshot-1.png",
        checksum_sha256: "checksum",
      },
    });
    expect(JSON.stringify(create_response.json())).not.toContain("storage_key");
    expect(JSON.stringify(create_response.json())).not.toContain("metadata");
    expect(JSON.stringify(create_response.json())).not.toContain("is_deleted");
    expect(JSON.stringify(create_response.json())).not.toContain("deleted_at");
    expect(JSON.stringify(create_response.json())).not.toContain(
      "deleted_by_id",
    );

    const capture_asset_id = create_response.json().capture_asset.id as string;
    const file_id = create_response.json().capture_asset.file.id as string;

    const persisted_before_delete = await pool.query<{
      asset_metadata: unknown;
      file_metadata: unknown;
      storage_key: string;
      asset_deleted: boolean;
      file_deleted: boolean;
    }>(
      `
      SELECT
        capture_asset.metadata AS asset_metadata,
        app_file.metadata AS file_metadata,
        app_file.storage_key,
        capture_asset.is_deleted AS asset_deleted,
        app_file.is_deleted AS file_deleted
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      WHERE capture_asset.id = $1
    `,
      [capture_asset_id],
    );

    expect(persisted_before_delete.rows[0]).toMatchObject({
      asset_metadata: {
        capture_mode: "manual",
      },
      file_metadata: {
        absolute_path: "/tmp/secret.png",
      },
      storage_key: "captures/acme/project/session/screenshot-1.png",
      asset_deleted: false,
      file_deleted: false,
    });

    const list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets?asset_type=screenshot`,
      cookies: {
        ossie_session: session_token,
      },
    });
    const get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}`,
      cookies: {
        ossie_session: session_token,
      },
    });
    const duplicate_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets`,
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        asset_type: "screenshot",
        file: {
          storage_key: "CAPTURES/acme/project/session/SCREENSHOT-1.png",
          mime_type: "image/png",
          size_bytes: 123456,
        },
      },
    });
    const unsupported_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets`,
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        asset_type: "html_snapshot",
        file: {
          storage_key: "captures/acme/project/session/source.html",
          mime_type: "text/html",
          size_bytes: 123456,
        },
      },
    });
    const missing_project_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/missing_project/capture-sessions/${capture_session_id}/assets`,
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        asset_type: "screenshot",
        file: {
          storage_key: "captures/acme/project/session/missing-project.png",
          mime_type: "image/png",
          size_bytes: 123456,
        },
      },
    });
    const missing_capture_session_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/missing_capture_session/assets`,
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        asset_type: "screenshot",
        file: {
          storage_key: "captures/acme/project/session/missing-session.png",
          mime_type: "image/png",
          size_bytes: 123456,
        },
      },
    });
    const archive_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}/archive`,
      cookies: { ossie_session: session_token },
      payload: { expected_asset_version: 1 },
    });
    expect(archive_response.statusCode).toBe(200);

    const delete_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}`,
      cookies: {
        ossie_session: session_token,
      },
      payload: { expected_asset_version: 2 },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json().capture_assets).toHaveLength(1);
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json().capture_asset.id).toBe(capture_asset_id);
    expect(duplicate_response.statusCode).toBe(409);
    expect(duplicate_response.json().error.type).toBe(
      "file_storage_key_conflict",
    );
    expect(unsupported_response.statusCode).toBe(400);
    expect(unsupported_response.json().error.type).toBe(
      "unsupported_capture_asset_type",
    );
    expect(missing_project_response.statusCode).toBe(404);
    expect(missing_project_response.json().error.type).toBe(
      "project_not_found",
    );
    expect(missing_capture_session_response.statusCode).toBe(404);
    expect(missing_capture_session_response.json().error.type).toBe(
      "capture_session_not_found",
    );
    expect(delete_response.statusCode).toBe(200);
    expect(delete_response.json()).toMatchObject({ status: "completed" });

    const persisted_after_delete = await pool.query<{
      asset_deleted: boolean;
      file_deleted: boolean;
      asset_deleted_by_id: string | null;
      file_deleted_by_id: string | null;
      asset_version: number;
      file_version: number;
    }>(
      `
      SELECT
        capture_asset.is_deleted AS asset_deleted,
        app_file.is_deleted AS file_deleted,
        capture_asset.deleted_by_id AS asset_deleted_by_id,
        app_file.deleted_by_id AS file_deleted_by_id,
        capture_asset.version AS asset_version,
        app_file.version AS file_version
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      WHERE capture_asset.id = $1
      AND app_file.id = $2
    `,
      [capture_asset_id, file_id],
    );

    expect(persisted_after_delete.rows[0]).toMatchObject({
      asset_deleted: true,
      file_deleted: true,
      asset_deleted_by_id: owner_context?.org_user_id,
      file_deleted_by_id: owner_context?.org_user_id,
      asset_version: 3,
      file_version: 2,
    });

    const hidden_list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets`,
      cookies: {
        ossie_session: session_token,
      },
    });
    const hidden_get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-sessions/${capture_session_id}/assets/${capture_asset_id}`,
      cookies: {
        ossie_session: session_token,
      },
    });

    expect(hidden_list_response.statusCode).toBe(200);
    expect(hidden_list_response.json().capture_assets).toEqual([]);
    expect(hidden_get_response.statusCode).toBe(404);
    expect(hidden_get_response.json().error.type).toBe(
      "capture_asset_not_found",
    );

    await app.close();
  });

  it("lists active screenshot assets across a project for guide editing", async () => {
    const session_token = await setup_owner();
    const { project_id, project_version_id } =
      await create_project(session_token);
    const first_capture_session_id = await create_capture_session(
      session_token,
      project_id,
      project_version_id,
    );
    const second_capture_session_id = await create_capture_session(
      session_token,
      project_id,
      project_version_id,
    );
    const app = build({ logger: false });

    const first_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${first_capture_session_id}/assets`,
      cookies: { ossie_session: session_token },
      payload: {
        asset_type: "screenshot",
        captured_at: "2026-06-05T10:00:00.000Z",
        file: {
          storage_key: "captures/acme/project/session/screenshot-1.png",
          mime_type: "image/png",
          size_bytes: 123456,
          original_name: "screenshot-1.png",
        },
      },
    });
    const second_response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project_id}/capture-sessions/${second_capture_session_id}/assets`,
      cookies: { ossie_session: session_token },
      payload: {
        asset_type: "screenshot",
        captured_at: "2026-06-05T10:05:00.000Z",
        file: {
          storage_key: "captures/acme/project/session/screenshot-2.png",
          mime_type: "image/png",
          size_bytes: 456789,
          original_name: "screenshot-2.png",
        },
      },
    });

    expect(first_response.statusCode).toBe(201);
    expect(second_response.statusCode).toBe(201);

    const project_list_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}/capture-assets?project_version_id=${project_version_id}&asset_type=screenshot`,
      cookies: { ossie_session: session_token },
    });

    expect(project_list_response.statusCode).toBe(200);
    expect(
      project_list_response
        .json()
        .capture_assets.map(
          (asset: {
            id: string;
            capture_session_id: string;
            file_url: string;
            file: { original_name: string | null };
          }) => ({
            id: asset.id,
            capture_session_id: asset.capture_session_id,
            file_url: asset.file_url,
            original_name: asset.file.original_name,
          }),
        ),
    ).toEqual([
      {
        id: first_response.json().capture_asset.id,
        capture_session_id: first_capture_session_id,
        file_url: `/api/v1/projects/${project_id}/capture-sessions/${first_capture_session_id}/assets/${first_response.json().capture_asset.id}/file`,
        original_name: "screenshot-1.png",
      },
      {
        id: second_response.json().capture_asset.id,
        capture_session_id: second_capture_session_id,
        file_url: `/api/v1/projects/${project_id}/capture-sessions/${second_capture_session_id}/assets/${second_response.json().capture_asset.id}/file`,
        original_name: "screenshot-2.png",
      },
    ]);

    await app.close();
  });
});
