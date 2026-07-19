import { afterAll, describe, expect, it } from "vitest";
import { ulid } from "ulid";
import { pool } from "../config/database.config";
import {
  insert_test_project,
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
  const project_version_id = ulid();
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
    await insert_test_project(client.query.bind(client), {
      project_id,
      project_version_id,
      organization_id,
      actor_org_user_id: org_user_id,
      name: "Constraint Project",
    });
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
    VALUES ($1, $2, $3, $4, 'Constraint Capture', $5, $5)
  `,
      [
        capture_session_id,
        organization_id,
        project_id,
        project_version_id,
        org_user_id,
      ],
    );
  });

  return {
    organization_id,
    org_user_id,
    project_id,
    project_version_id,
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
      "project_version_id",
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
      index_exists(
        "capture_schema",
        "idx_capture_session_version_status_created",
      ),
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
      "id",
      "organization_id",
      "project_id",
      "created_by_id",
      "created_at",
    ]) {
      await expect(
        column_exists("guide_schema", "guide", column_name),
      ).resolves.toBe(true);
    }

    for (const removed_column of [
      "source_capture_session_id",
      "title",
      "description",
      "status",
      "version",
      "is_deleted",
    ]) {
      await expect(
        column_exists("guide_schema", "guide", removed_column),
      ).resolves.toBe(false);
    }

    for (const column_name of [
      "guide_id",
      "project_version_id",
      "source_capture_session_id",
      "title",
      "description",
      "status",
      "version",
    ]) {
      await expect(
        column_exists("guide_schema", "guide_edition", column_name),
      ).resolves.toBe(true);
    }

    await expect(
      column_exists("guide_schema", "guide_working_draft", "guide_edition_id"),
    ).resolves.toBe(true);

    for (const column_name of [
      "organization_id",
      "project_id",
      "guide_working_draft_id",
      "block_type",
      "block_index",
      "title",
      "body",
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
      "guide_working_draft_id",
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
      index_exists("guide_schema", "idx_guide_edition_scope_status_created"),
    ).resolves.toBe(true);
    await expect(
      index_exists("guide_schema", "idx_guide_block_draft_active_order"),
    ).resolves.toBe(true);
    await expect(
      index_exists("guide_schema", "uq_guide_block_draft_index_active"),
    ).resolves.toBe(true);
    await expect(
      index_exists("guide_schema", "uq_guide_step_block_active"),
    ).resolves.toBe(true);
    await expect(table_comment("guide_schema", "guide")).resolves.toMatch(
      /immutable stable guide artifact identity/i,
    );
  });

  it("creates interactive demo artifact schema separately from guides", async () => {
    for (const column_name of [
      "organization_id",
      "project_id",
      "created_by_id",
      "created_at",
    ]) {
      await expect(
        column_exists(
          "interactive_demo_schema",
          "interactive_demo",
          column_name,
        ),
      ).resolves.toBe(true);
    }

    for (const removed_column of [
      "source_capture_session_id",
      "title",
      "description",
      "status",
      "version",
      "is_deleted",
    ]) {
      await expect(
        column_exists(
          "interactive_demo_schema",
          "interactive_demo",
          removed_column,
        ),
      ).resolves.toBe(false);
    }

    for (const column_name of [
      "interactive_demo_id",
      "project_version_id",
      "source_capture_session_id",
      "title",
      "description",
      "status",
      "version",
    ]) {
      await expect(
        column_exists(
          "interactive_demo_schema",
          "interactive_demo_edition",
          column_name,
        ),
      ).resolves.toBe(true);
    }

    await expect(
      column_exists(
        "interactive_demo_schema",
        "interactive_demo_working_draft",
        "interactive_demo_edition_id",
      ),
    ).resolves.toBe(true);

    for (const column_name of [
      "organization_id",
      "project_id",
      "interactive_demo_working_draft_id",
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
      "interactive_demo_working_draft_id",
      "demo_scene_id",
      "hotspot_type",
      "label",
      "content",
      "x",
      "y",
      "width",
      "height",
      "hotspot_index",
      "created_by_id",
      "updated_by_id",
      "deleted_by_id",
    ]) {
      await expect(
        column_exists("interactive_demo_schema", "demo_hotspot", column_name),
      ).resolves.toBe(true);
    }

    for (const column_name of [
      "interactive_demo_working_draft_id",
      "demo_hotspot_id",
      "target_scene_id",
      "version",
    ]) {
      await expect(
        column_exists(
          "interactive_demo_schema",
          "demo_transition",
          column_name,
        ),
      ).resolves.toBe(true);
    }

    await expect(
      index_exists(
        "interactive_demo_schema",
        "idx_interactive_demo_edition_scope_status_created",
      ),
    ).resolves.toBe(true);
    await expect(
      index_exists(
        "interactive_demo_schema",
        "idx_demo_scene_draft_active_order",
      ),
    ).resolves.toBe(true);
    await expect(
      index_exists(
        "interactive_demo_schema",
        "uq_demo_scene_draft_index_active",
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
    ).resolves.toMatch(/immutable stable interactive demo artifact identity/i);
  });

  it("creates relational Publication and multi-version Publish Link schema", async () => {
    for (const column_name of [
      "organization_id",
      "project_id",
      "artifact_type",
      "publication_sequence",
      "guide_id",
      "guide_edition_id",
      "guide_revision_id",
      "interactive_demo_id",
      "interactive_demo_edition_id",
      "interactive_demo_revision_id",
      "project_version_id",
      "created_by_id",
      "published_at",
    ]) {
      await expect(
        column_exists("publish_schema", "published_artifact", column_name),
      ).resolves.toBe(true);
    }

    await expect(
      column_exists("publish_schema", "published_artifact", "snapshot_json"),
    ).resolves.toBe(false);
    await expect(
      column_exists("publish_schema", "published_artifact", "version_number"),
    ).resolves.toBe(false);
    await expect(
      table_exists("publish_schema", "published_artifact_capture_asset"),
    ).resolves.toBe(false);

    for (const table_name of [
      "published_artifact",
      "publish_link",
      "publish_link_entry",
      "public_publish_viewer_session",
    ]) {
      await expect(table_exists("publish_schema", table_name)).resolves.toBe(
        true,
      );
    }

    for (const column_name of [
      "name",
      "slug",
      "visibility",
      "status",
      "version",
      "guide_id",
      "interactive_demo_id",
    ]) {
      await expect(
        column_exists("publish_schema", "publish_link", column_name),
      ).resolves.toBe(true);
    }

    for (const column_name of [
      "publish_link_id",
      "published_artifact_id",
      "project_version_id",
      "position",
      "is_default",
      "version",
    ]) {
      await expect(
        column_exists("publish_schema", "publish_link_entry", column_name),
      ).resolves.toBe(true);
    }

    for (const index_name of [
      "uq_published_artifact_guide_sequence",
      "uq_published_artifact_demo_sequence",
      "uq_publish_link_entry_default",
      "idx_publish_link_entry_manifest",
      "idx_publish_link_public_access",
      "idx_public_publish_viewer_session_link_active",
    ]) {
      await expect(index_exists("publish_schema", index_name)).resolves.toBe(
        true,
      );
    }

    await expect(
      table_comment("publish_schema", "published_artifact"),
    ).resolves.toMatch(/immutable non-deletable Publication/i);
    await expect(
      table_comment("publish_schema", "publish_link"),
    ).resolves.toMatch(/multi-version access manifest/i);
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
    const guide_edition_id = ulid();
    const guide_working_draft_id = ulid();

    await pool.query(
      `INSERT INTO guide_schema.guide (id, organization_id, project_id, created_by_id)
       VALUES ($1, $2, $3, $4)`,
      [
        context.guide_id,
        context.organization_id,
        context.project_id,
        context.org_user_id,
      ],
    );

    await expect(
      pool.query(
        `
      INSERT INTO guide_schema.guide_edition (
        id,
        organization_id,
        project_id,
        guide_id,
        project_version_id,
        source_capture_session_id,
        title,
        status,
        created_by_id,
        updated_by_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Guide', 'published', $7, $7)
    `,
        [
          ulid(),
          context.organization_id,
          context.project_id,
          context.guide_id,
          context.project_version_id,
          context.capture_session_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_guide_edition_status",
    });

    await pool.query(
      `
      WITH edition AS (
        INSERT INTO guide_schema.guide_edition (
          id, organization_id, project_id, guide_id, project_version_id,
          source_capture_session_id, title, created_by_id, updated_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'Guide', $7, $7)
      )
      INSERT INTO guide_schema.guide_working_draft (
        id, organization_id, project_id, guide_edition_id, created_by_id, updated_by_id
      ) VALUES ($8, $2, $3, $1, $7, $7)
    `,
      [
        guide_edition_id,
        context.organization_id,
        context.project_id,
        context.guide_id,
        context.project_version_id,
        context.capture_session_id,
        context.org_user_id,
        guide_working_draft_id,
      ],
    );

    for (const [index, block_type] of [
      "step",
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
          guide_working_draft_id,
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
          guide_working_draft_id,
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
        guide_working_draft_id,
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
          guide_working_draft_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
    });

    await expect(
      pool.query(
        `
      INSERT INTO guide_schema.guide_block (
        id,
        organization_id,
        project_id,
        guide_working_draft_id,
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
          guide_working_draft_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23514",
      constraint: "chk_guide_block_index",
    });

    await pool.query(
      `
      INSERT INTO guide_schema.guide_block (
        id,
        organization_id,
        project_id,
        guide_working_draft_id,
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
        guide_working_draft_id,
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
        guide_working_draft_id,
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
          guide_working_draft_id,
          context.org_user_id,
        ],
      ),
    ).rejects.toMatchObject({
      code: "23505",
      constraint: "uq_guide_block_draft_index_active",
    });

    await pool.query(
      `
      INSERT INTO guide_schema.guide_step (
        id,
        organization_id,
        project_id,
        guide_working_draft_id,
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
        guide_working_draft_id,
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
        guide_working_draft_id,
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
          guide_working_draft_id,
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
