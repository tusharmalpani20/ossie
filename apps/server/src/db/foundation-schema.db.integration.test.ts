import { afterAll, describe, expect, it } from "vitest";
import { ulid } from "ulid";
import { pool } from "../config/database.config";
import {
  run_test_fixture_mutation,
  with_maintenance_client,
} from "../test-support/database";

const test_fixture_pool = {
  query: run_test_fixture_mutation as typeof pool.query,
};

const schema_exists = async (schema_name: string) => {
  const result = await pool.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.schemata
      WHERE schema_name = $1
    ) AS exists
  `,
    [schema_name],
  );

  return Boolean(result.rows[0]?.exists);
};

const table_exists = async (schema_name: string, table_name: string) => {
  const result = await pool.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_name = $2
    ) AS exists
  `,
    [schema_name, table_name],
  );

  return Boolean(result.rows[0]?.exists);
};

const column_exists = async (
  schema_name: string,
  table_name: string,
  column_name: string,
) => {
  const result = await pool.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
      AND column_name = $3
    ) AS exists
  `,
    [schema_name, table_name, column_name],
  );

  return Boolean(result.rows[0]?.exists);
};

const index_exists = async (schema_name: string, index_name: string) => {
  const result = await pool.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = $1
      AND indexname = $2
    ) AS exists
  `,
    [schema_name, index_name],
  );

  return Boolean(result.rows[0]?.exists);
};

const table_comment = async (schema_name: string, table_name: string) => {
  const result = await pool.query<{ comment: string | null }>(
    `
    SELECT obj_description(($1 || '.' || $2)::regclass, 'pg_class') AS comment
  `,
    [schema_name, table_name],
  );

  return result.rows[0]?.comment ?? null;
};

const insert_constraint_test_context = async () => {
  const user_id = ulid();
  const organization_id = ulid();
  const org_user_id = ulid();
  const project_id = ulid();
  const capture_session_id = ulid();
  const guide_id = ulid();
  const guide_block_id = ulid();

  await with_maintenance_client(async (client) => {
    await client.query(
      `
    INSERT INTO user_schema.user (id, email, password_hash, display_name)
    VALUES ($1, $2, 'hash.salt', 'Constraint Owner')
  `,
      [user_id, `constraint-${user_id}@example.com`],
    );
    await client.query(
      `
    INSERT INTO organization_schema.organization (id, name)
    VALUES ($1, 'Constraint Org')
  `,
      [organization_id],
    );
    await client.query(
      `
    INSERT INTO organization_schema.org_user (id, user_id, organization_id, role)
    VALUES ($1, $2, $3, 'owner')
  `,
      [org_user_id, user_id, organization_id],
    );
    await client.query(
      "SELECT set_config('ossie.maintenance_mode', 'on', false)",
    );
    await client.query(
      `
    INSERT INTO project_schema.project (
      id,
      organization_id,
      name,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, 'Constraint Project', $3, $3)
  `,
      [project_id, organization_id, org_user_id],
    );
    await client.query(
      `
    INSERT INTO capture_schema.capture_session (
      id,
      organization_id,
      project_id,
      name,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, $3, 'Constraint Capture', $4, $4)
  `,
      [capture_session_id, organization_id, project_id, org_user_id],
    );
  });

  return {
    organization_id,
    org_user_id,
    project_id,
    capture_session_id,
    guide_id,
    guide_block_id,
  };
};

describe("foundation schema migrations on postgres", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("creates the accepted foundation schemas and tables", async () => {
    await expect(schema_exists("user_schema")).resolves.toBe(true);
    await expect(schema_exists("organization_schema")).resolves.toBe(true);
    await expect(schema_exists("auth_schema")).resolves.toBe(true);
    await expect(schema_exists("project_schema")).resolves.toBe(true);
    await expect(schema_exists("capture_schema")).resolves.toBe(true);
    await expect(schema_exists("file_schema")).resolves.toBe(true);
    await expect(schema_exists("guide_schema")).resolves.toBe(true);
    await expect(schema_exists("interactive_demo_schema")).resolves.toBe(true);
    await expect(schema_exists("publish_schema")).resolves.toBe(true);

    await expect(table_exists("user_schema", "user")).resolves.toBe(true);
    await expect(
      table_exists("organization_schema", "organization"),
    ).resolves.toBe(true);
    await expect(table_exists("organization_schema", "org_user")).resolves.toBe(
      true,
    );
    await expect(table_exists("auth_schema", "auth_session")).resolves.toBe(
      true,
    );
    await expect(table_exists("project_schema", "project")).resolves.toBe(true);
    await expect(
      table_exists("capture_schema", "capture_session"),
    ).resolves.toBe(true);
    await expect(table_exists("file_schema", "file")).resolves.toBe(true);
    await expect(table_exists("capture_schema", "capture_asset")).resolves.toBe(
      true,
    );
    await expect(table_exists("capture_schema", "capture_event")).resolves.toBe(
      true,
    );
    await expect(table_exists("guide_schema", "guide")).resolves.toBe(true);
    await expect(table_exists("guide_schema", "guide_block")).resolves.toBe(
      true,
    );
    await expect(table_exists("guide_schema", "guide_step")).resolves.toBe(
      true,
    );
    await expect(
      table_exists("interactive_demo_schema", "interactive_demo"),
    ).resolves.toBe(true);
    await expect(
      table_exists("interactive_demo_schema", "demo_scene"),
    ).resolves.toBe(true);
    await expect(
      table_exists("publish_schema", "published_artifact"),
    ).resolves.toBe(true);
    await expect(table_exists("publish_schema", "publish_link")).resolves.toBe(
      true,
    );
    await expect(
      table_exists("publish_schema", "public_publish_viewer_session"),
    ).resolves.toBe(true);
  });

  it("keeps user identity separate from organization membership", async () => {
    await expect(
      column_exists("user_schema", "user", "organization_id"),
    ).resolves.toBe(false);
    await expect(
      column_exists("organization_schema", "org_user", "organization_id"),
    ).resolves.toBe(true);
    await expect(
      column_exists("organization_schema", "org_user", "user_id"),
    ).resolves.toBe(true);
    await expect(
      column_exists("organization_schema", "org_user", "role"),
    ).resolves.toBe(true);
  });

  it("stores DB-backed sessions and project audit fields with org user context", async () => {
    await expect(
      column_exists("auth_schema", "auth_session", "token_hash"),
    ).resolves.toBe(true);
    await expect(
      column_exists("auth_schema", "auth_session", "org_user_id"),
    ).resolves.toBe(true);
    await expect(
      column_exists("auth_schema", "auth_session", "jwt_token"),
    ).resolves.toBe(false);

    await expect(
      column_exists("project_schema", "project", "created_by_id"),
    ).resolves.toBe(true);
    await expect(
      column_exists("project_schema", "project", "updated_by_id"),
    ).resolves.toBe(true);
    await expect(
      column_exists("project_schema", "project", "deleted_by_id"),
    ).resolves.toBe(true);
  });

  it("creates capture session source material schema", async () => {
    for (const column_name of [
      "organization_id",
      "project_id",
      "name",
      "status",
      "source_type",
      "started_at",
      "completed_at",
      "canceled_at",
      "metadata",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("capture_schema", "capture_session", column_name),
      ).resolves.toBe(true);
    }

    await expect(
      index_exists("capture_schema", "idx_capture_session_project_status"),
    ).resolves.toBe(true);
    await expect(
      index_exists("capture_schema", "idx_capture_session_org_created"),
    ).resolves.toBe(true);
    await expect(
      table_comment("capture_schema", "capture_session"),
    ).resolves.toMatch(/source material/i);
  });

  it("creates file and capture asset metadata schema", async () => {
    for (const column_name of [
      "organization_id",
      "storage_provider",
      "storage_key",
      "mime_type",
      "size_bytes",
      "metadata",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("file_schema", "file", column_name),
      ).resolves.toBe(true);
    }

    for (const column_name of [
      "organization_id",
      "project_id",
      "capture_session_id",
      "file_id",
      "asset_type",
      "width",
      "height",
      "device_pixel_ratio",
      "captured_at",
      "metadata",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("capture_schema", "capture_asset", column_name),
      ).resolves.toBe(true);
    }

    await expect(
      index_exists("file_schema", "idx_file_org_created"),
    ).resolves.toBe(true);
    await expect(
      index_exists("file_schema", "uq_file_storage_key_active_per_org"),
    ).resolves.toBe(true);
    await expect(
      index_exists("capture_schema", "idx_capture_asset_session_created"),
    ).resolves.toBe(true);
    await expect(
      index_exists("capture_schema", "idx_capture_asset_project_type"),
    ).resolves.toBe(true);
    await expect(table_comment("file_schema", "file")).resolves.toMatch(
      /storage metadata/i,
    );
    await expect(
      table_comment("capture_schema", "capture_asset"),
    ).resolves.toMatch(/product meaning/i);
  });

  it("creates capture event source material schema", async () => {
    for (const column_name of [
      "organization_id",
      "project_id",
      "capture_session_id",
      "capture_asset_id",
      "event_type",
      "event_index",
      "occurred_at",
      "page_url",
      "page_title",
      "target_label",
      "target_selector",
      "target_role",
      "target_test_id",
      "target_text",
      "client_x",
      "client_y",
      "viewport_width",
      "viewport_height",
      "device_pixel_ratio",
      "input_intent",
      "input_value_redacted",
      "note",
      "metadata",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("capture_schema", "capture_event", column_name),
      ).resolves.toBe(true);
    }

    await expect(
      index_exists("capture_schema", "uq_capture_event_session_index_active"),
    ).resolves.toBe(true);
    await expect(
      index_exists("capture_schema", "idx_capture_event_session_order"),
    ).resolves.toBe(true);
    await expect(
      index_exists("capture_schema", "idx_capture_event_asset"),
    ).resolves.toBe(true);
    await expect(
      index_exists("capture_schema", "idx_capture_event_project_created"),
    ).resolves.toBe(true);
    await expect(
      table_comment("capture_schema", "capture_event"),
    ).resolves.toMatch(/source event/i);
  });

  it("creates guide artifact schema separately from capture source material", async () => {
    for (const column_name of [
      "organization_id",
      "project_id",
      "source_capture_session_id",
      "title",
      "description",
      "status",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("guide_schema", "guide", column_name),
      ).resolves.toBe(true);
    }

    for (const column_name of [
      "organization_id",
      "project_id",
      "guide_id",
      "block_type",
      "block_index",
      "source_capture_event_id",
      "source_capture_asset_id",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("guide_schema", "guide_block", column_name),
      ).resolves.toBe(true);
    }

    for (const column_name of [
      "organization_id",
      "project_id",
      "guide_id",
      "guide_block_id",
      "title",
      "body",
      "source_capture_event_id",
      "source_capture_asset_id",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("guide_schema", "guide_step", column_name),
      ).resolves.toBe(true);
    }

    await expect(
      index_exists("guide_schema", "idx_guide_project_active_created"),
    ).resolves.toBe(true);
    await expect(
      index_exists("guide_schema", "idx_guide_source_capture_session_active"),
    ).resolves.toBe(true);
    await expect(
      index_exists("guide_schema", "idx_guide_block_guide_active_order"),
    ).resolves.toBe(true);
    await expect(
      index_exists("guide_schema", "uq_guide_block_guide_index_active"),
    ).resolves.toBe(true);
    await expect(
      index_exists("guide_schema", "idx_guide_step_block_active"),
    ).resolves.toBe(true);
    await expect(
      index_exists("guide_schema", "uq_guide_step_block_active"),
    ).resolves.toBe(true);
    await expect(table_comment("guide_schema", "guide")).resolves.toMatch(
      /editable guide artifact/i,
    );
  });

  it("creates interactive demo artifact schema separately from guides", async () => {
    for (const column_name of [
      "organization_id",
      "project_id",
      "source_capture_session_id",
      "title",
      "description",
      "status",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists(
          "interactive_demo_schema",
          "interactive_demo",
          column_name,
        ),
      ).resolves.toBe(true);
    }

    for (const column_name of [
      "organization_id",
      "project_id",
      "interactive_demo_id",
      "source_capture_session_id",
      "source_capture_event_id",
      "source_capture_asset_id",
      "scene_index",
      "title",
      "description",
      "background_capture_asset_id",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("interactive_demo_schema", "demo_scene", column_name),
      ).resolves.toBe(true);
    }

    for (const column_name of [
      "organization_id",
      "project_id",
      "interactive_demo_id",
      "demo_scene_id",
      "hotspot_type",
      "label",
      "content",
      "x",
      "y",
      "width",
      "height",
      "target_scene_id",
      "hotspot_index",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("interactive_demo_schema", "demo_hotspot", column_name),
      ).resolves.toBe(true);
    }

    await expect(
      index_exists(
        "interactive_demo_schema",
        "idx_interactive_demo_project_active_created",
      ),
    ).resolves.toBe(true);
    await expect(
      index_exists(
        "interactive_demo_schema",
        "idx_demo_scene_demo_active_order",
      ),
    ).resolves.toBe(true);
    await expect(
      index_exists(
        "interactive_demo_schema",
        "uq_demo_scene_demo_index_active",
      ),
    ).resolves.toBe(true);
    await expect(
      index_exists(
        "interactive_demo_schema",
        "idx_demo_hotspot_scene_active_order",
      ),
    ).resolves.toBe(true);
    await expect(
      index_exists(
        "interactive_demo_schema",
        "uq_demo_hotspot_scene_index_active",
      ),
    ).resolves.toBe(true);
    await expect(
      table_comment("interactive_demo_schema", "interactive_demo"),
    ).resolves.toMatch(/interactive demo artifact/i);
    await expect(
      table_comment("interactive_demo_schema", "demo_scene"),
    ).resolves.toMatch(/ordered scene/i);
    await expect(
      table_comment("interactive_demo_schema", "demo_hotspot"),
    ).resolves.toMatch(/hotspot/i);
  });

  it("creates publish snapshot and link schema separately from editable artifacts", async () => {
    for (const column_name of [
      "organization_id",
      "project_id",
      "artifact_type",
      "artifact_id",
      "version_number",
      "title",
      "snapshot_json",
      "created_by_id",
      "published_at",
    ]) {
      await expect(
        column_exists("publish_schema", "published_artifact", column_name),
      ).resolves.toBe(true);
    }

    for (const column_name of [
      "organization_id",
      "project_id",
      "artifact_type",
      "artifact_id",
      "published_artifact_id",
      "slug",
      "visibility",
      "expires_at",
      "password_hash",
      "password_salt",
      "password_set_at",
      "password_updated_at",
      "status",
      "created_by_id",
      "revoked_by_id",
      "published_at",
      "revoked_at",
    ]) {
      await expect(
        column_exists("publish_schema", "publish_link", column_name),
      ).resolves.toBe(true);
    }

    await expect(
      index_exists("publish_schema", "idx_published_artifact_source_created"),
    ).resolves.toBe(true);
    await expect(
      index_exists("publish_schema", "uq_publish_link_active_source"),
    ).resolves.toBe(true);
    await expect(
      index_exists("publish_schema", "idx_publish_link_slug_active"),
    ).resolves.toBe(true);
    await expect(
      index_exists("publish_schema", "idx_publish_link_public_access"),
    ).resolves.toBe(true);
    await expect(
      index_exists(
        "publish_schema",
        "idx_public_publish_viewer_session_link_active",
      ),
    ).resolves.toBe(true);
    await expect(
      table_comment("publish_schema", "published_artifact"),
    ).resolves.toMatch(/immutable/i);
    await expect(
      table_comment("publish_schema", "publish_link"),
    ).resolves.toMatch(/stable publish/i);
  });

  it("enforces publish snapshot versions slugs and active source links", async () => {
    const pool = test_fixture_pool;
    const context = await insert_constraint_test_context();
    const guide_id = ulid();
    const first_artifact_id = ulid();
    const second_artifact_id = ulid();

    await pool.query(
      `
      INSERT INTO guide_schema.guide (
        id,
        organization_id,
        project_id,
        source_capture_session_id,
        title,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'Publish Constraint Guide', $5, $5)
    `,
      [
        guide_id,
        context.organization_id,
        context.project_id,
        context.capture_session_id,
        context.org_user_id,
      ],
    );

    await pool.query(
      `
      INSERT INTO publish_schema.published_artifact (
        id,
        organization_id,
        project_id,
        artifact_type,
        artifact_id,
        version_number,
        title,
        snapshot_json,
        created_by_id
      )
      VALUES ($1, $2, $3, 'guide', $4, 1, 'Version 1', '{"artifact_type":"guide","blocks":[]}'::jsonb, $5)
    `,
      [
        first_artifact_id,
        context.organization_id,
        context.project_id,
        guide_id,
        context.org_user_id,
      ],
    );

    await expect(
      pool.query(
        `
      INSERT INTO publish_schema.published_artifact (
        id,
        organization_id,
        project_id,
        artifact_type,
        artifact_id,
        version_number,
        title,
        snapshot_json,
        created_by_id
      )
      VALUES ($1, $2, $3, 'guide', $4, 1, 'Duplicate Version', '{"artifact_type":"guide"}'::jsonb, $5)
    `,
        [
          second_artifact_id,
          context.organization_id,
          context.project_id,
          guide_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23505",
      constraint: "uq_published_artifact_source_version",
    });

    await pool.query(
      `
      INSERT INTO publish_schema.published_artifact (
        id,
        organization_id,
        project_id,
        artifact_type,
        artifact_id,
        version_number,
        title,
        snapshot_json,
        created_by_id
      )
      VALUES ($1, $2, $3, 'guide', $4, 2, 'Version 2', '{"artifact_type":"guide","blocks":[]}'::jsonb, $5)
    `,
      [
        second_artifact_id,
        context.organization_id,
        context.project_id,
        guide_id,
        context.org_user_id,
      ],
    );

    await pool.query(
      `
      INSERT INTO publish_schema.publish_link (
        id,
        organization_id,
        project_id,
        artifact_type,
        artifact_id,
        published_artifact_id,
        slug,
        created_by_id
      )
      VALUES ($1, $2, $3, 'guide', $4, $5, 'constraint-slug', $6)
    `,
      [
        ulid(),
        context.organization_id,
        context.project_id,
        guide_id,
        first_artifact_id,
        context.org_user_id,
      ],
    );

    await expect(
      pool.query(
        `
      INSERT INTO publish_schema.publish_link (
        id,
        organization_id,
        project_id,
        artifact_type,
        artifact_id,
        published_artifact_id,
        slug,
        created_by_id
      )
      VALUES ($1, $2, $3, 'guide', $4, $5, 'constraint-slug', $6)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          guide_id,
          second_artifact_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23505",
      constraint: "uq_publish_link_slug",
    });

    await expect(
      pool.query(
        `
      INSERT INTO publish_schema.publish_link (
        id,
        organization_id,
        project_id,
        artifact_type,
        artifact_id,
        published_artifact_id,
        slug,
        created_by_id
      )
      VALUES ($1, $2, $3, 'guide', $4, $5, 'second-active-source-slug', $6)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          guide_id,
          second_artifact_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23505",
      constraint: "uq_publish_link_active_source",
    });

    await pool.query(`
      UPDATE publish_schema.publish_link
      SET visibility = 'restricted',
          expires_at = CURRENT_TIMESTAMP + INTERVAL '1 day'
      WHERE slug = 'constraint-slug'
    `);

    const access_row = await pool.query<{
      visibility: string;
      expires_at: Date | null;
    }>(`
      SELECT visibility, expires_at
      FROM publish_schema.publish_link
      WHERE slug = 'constraint-slug'
    `);
    expect(access_row.rows[0]?.visibility).toBe("restricted");
    expect(access_row.rows[0]?.expires_at).toBeInstanceOf(Date);

    await expect(
      pool.query(`
      UPDATE publish_schema.publish_link
      SET visibility = 'private'
      WHERE slug = 'constraint-slug'
    `),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_publish_link_visibility",
    });

    await expect(
      pool.query(`
      UPDATE publish_schema.publish_link
      SET password_hash = 'hash-only'
      WHERE slug = 'constraint-slug'
    `),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_publish_link_password_fields",
    });

    await pool.query(`
      UPDATE publish_schema.publish_link
      SET password_hash = 'hash',
          password_salt = 'salt',
          password_set_at = CURRENT_TIMESTAMP,
          password_updated_at = CURRENT_TIMESTAMP
      WHERE slug = 'constraint-slug'
    `);

    const viewer_session_id = ulid();
    await pool.query(
      `
      INSERT INTO publish_schema.public_publish_viewer_session (
        id,
        publish_link_id,
        token_hash,
        expires_at
      )
      SELECT $1, id, 'token-hash', CURRENT_TIMESTAMP + INTERVAL '12 hours'
      FROM publish_schema.publish_link
      WHERE slug = 'constraint-slug'
    `,
      [viewer_session_id],
    );

    await expect(
      pool.query(
        `
      INSERT INTO publish_schema.public_publish_viewer_session (
        id,
        publish_link_id,
        token_hash,
        expires_at
      )
      SELECT $1, id, 'token-hash', CURRENT_TIMESTAMP + INTERVAL '12 hours'
      FROM publish_schema.publish_link
      WHERE slug = 'constraint-slug'
    `,
        [ulid()],
      ),
    ).rejects.toMatchObject({
      code: "23505",
      constraint: "uq_public_publish_viewer_session_token_hash",
    });
  });

  it("enforces file and capture asset metadata constraints", async () => {
    const pool = test_fixture_pool;
    const context = await insert_constraint_test_context();
    const file_id = ulid();

    await expect(
      pool.query(
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
      VALUES ($1, $2, 'memory', 'constraint/invalid-provider.png', 'image/png', 1, $3, $3)
    `,
        [ulid(), context.organization_id, context.org_user_id],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_file_storage_provider",
    });

    await expect(
      pool.query(
        `
      INSERT INTO file_schema.file (
        id,
        organization_id,
        storage_key,
        mime_type,
        size_bytes,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, 'constraint/negative-size.png', 'image/png', -1, $3, $3)
    `,
        [ulid(), context.organization_id, context.org_user_id],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_file_size_bytes_non_negative",
    });

    await pool.query(
      `
      INSERT INTO file_schema.file (
        id,
        organization_id,
        storage_key,
        mime_type,
        size_bytes,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, 'constraint/valid.png', 'image/png', 1, $3, $3)
    `,
      [file_id, context.organization_id, context.org_user_id],
    );

    await expect(
      pool.query(
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
      VALUES ($1, $2, $3, $4, $5, 'video', $6, $6)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.capture_session_id,
          file_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_capture_asset_type",
    });
  });

  it("enforces capture event metadata constraints", async () => {
    const pool = test_fixture_pool;
    const context = await insert_constraint_test_context();

    await expect(
      pool.query(
        `
      INSERT INTO capture_schema.capture_event (
        id,
        organization_id,
        project_id,
        capture_session_id,
        event_type,
        event_index,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'video', 1, $5, $5)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.capture_session_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_capture_event_type",
    });

    await expect(
      pool.query(
        `
      INSERT INTO capture_schema.capture_event (
        id,
        organization_id,
        project_id,
        capture_session_id,
        event_type,
        event_index,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'note', 0, $5, $5)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.capture_session_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_capture_event_index_positive",
    });

    await expect(
      pool.query(
        `
      INSERT INTO capture_schema.capture_event (
        id,
        organization_id,
        project_id,
        capture_session_id,
        event_type,
        event_index,
        input_value_redacted,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'input', 1, FALSE, $5, $5)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.capture_session_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_capture_event_input_value_redacted_true",
    });
  });

  it("enforces guide artifact constraints", async () => {
    const pool = test_fixture_pool;
    const context = await insert_constraint_test_context();

    await expect(
      pool.query(
        `
      INSERT INTO guide_schema.guide (
        id,
        organization_id,
        project_id,
        source_capture_session_id,
        title,
        status,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'Guide', 'published', $5, $5)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.capture_session_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_guide_status",
    });

    await pool.query(
      `
      INSERT INTO guide_schema.guide (
        id,
        organization_id,
        project_id,
        source_capture_session_id,
        title,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'Guide', $5, $5)
    `,
      [
        context.guide_id,
        context.organization_id,
        context.project_id,
        context.capture_session_id,
        context.org_user_id,
      ],
    );

    for (const [index, block_type] of [
      "step",
      "header",
      "paragraph",
      "tip",
      "alert",
      "capture",
      "divider",
      "gif",
    ].entries()) {
      await pool.query(
        `
        INSERT INTO guide_schema.guide_block (
          id,
          organization_id,
          project_id,
          guide_id,
          block_type,
          block_index,
          created_by_id,
          updated_by_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.guide_id,
          block_type,
          index + 1,
          context.org_user_id,
        ],
      );
    }

    await expect(
      pool.query(
        `
      INSERT INTO guide_schema.guide_block (
        id,
        organization_id,
        project_id,
        guide_id,
        block_type,
        block_index,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'scene', 1, $5, $5)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.guide_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_guide_block_type",
    });

    await expect(
      pool.query(
        `
      INSERT INTO guide_schema.guide_block (
        id,
        organization_id,
        project_id,
        guide_id,
        block_type,
        block_index,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'step', 0, $5, $5)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.guide_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_guide_block_index_positive",
    });

    await pool.query(
      `
      INSERT INTO guide_schema.guide_block (
        id,
        organization_id,
        project_id,
        guide_id,
        block_type,
        block_index,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'step', 100, $5, $5)
    `,
      [
        context.guide_block_id,
        context.organization_id,
        context.project_id,
        context.guide_id,
        context.org_user_id,
      ],
    );

    await expect(
      pool.query(
        `
      INSERT INTO guide_schema.guide_block (
        id,
        organization_id,
        project_id,
        guide_id,
        block_type,
        block_index,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, 'step', 100, $5, $5)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.guide_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23505",
      constraint: "uq_guide_block_guide_index_active",
    });

    await pool.query(
      `
      INSERT INTO guide_schema.guide_step (
        id,
        organization_id,
        project_id,
        guide_id,
        guide_block_id,
        title,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, 'Click "Add Department"', $6, $6)
    `,
      [
        ulid(),
        context.organization_id,
        context.project_id,
        context.guide_id,
        context.guide_block_id,
        context.org_user_id,
      ],
    );

    await expect(
      pool.query(
        `
      INSERT INTO guide_schema.guide_step (
        id,
        organization_id,
        project_id,
        guide_id,
        guide_block_id,
        title,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, 'Duplicate step', $6, $6)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.guide_id,
          context.guide_block_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23505",
      constraint: "uq_guide_step_block_active",
    });
  });
});
