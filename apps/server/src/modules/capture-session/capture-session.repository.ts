import { ulid } from "ulid";
import type {
  CaptureAsset,
  CaptureAssetType,
  FileStorageProvider,
} from "../capture-asset/capture-asset.service";
import type {
  CaptureEvent,
  CaptureEventType,
} from "../capture-event/capture-event.service";
import {
  type CaptureSession,
  type CaptureSessionRepository,
  type CaptureSessionSourceType,
  type CaptureSessionStatus,
  type NormalizedUpdateCaptureSessionInput,
} from "./capture-session.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};

type CaptureSessionRow = {
  id: string;
  organization_id: string;
  project_id: string;
  project_version_id: string;
  project_version: CaptureSession["project_version"];
  name: string;
  description: string | null;
  status: CaptureSessionStatus;
  source_type: CaptureSessionSourceType;
  started_at: Date | null;
  completed_at: Date | null;
  canceled_at: Date | null;
  start_url: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  user_agent: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type CaptureEventRow = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  capture_asset_id: string | null;
  event_type: CaptureEventType;
  event_index: number;
  occurred_at: Date;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_selector: string | null;
  target_role: string | null;
  target_test_id: string | null;
  target_text: string | null;
  client_x: number | null;
  client_y: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  input_intent: string | null;
  input_value_redacted: true;
  note: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type CaptureAssetRow = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  asset_type: CaptureAssetType;
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: Date;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
  file_id: string;
  file_storage_provider: FileStorageProvider;
  file_mime_type: string;
  file_size_bytes: string | number;
  file_original_name: string | null;
  file_checksum_sha256: string | null;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const map_capture_session = (row: CaptureSessionRow): CaptureSession => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  project_version_id: row.project_version_id,
  project_version: row.project_version,
  name: row.name,
  description: row.description,
  status: row.status,
  source_type: row.source_type,
  started_at: row.started_at?.toISOString() ?? null,
  completed_at: row.completed_at?.toISOString() ?? null,
  canceled_at: row.canceled_at?.toISOString() ?? null,
  start_url: row.start_url,
  browser_name: row.browser_name,
  browser_version: row.browser_version,
  operating_system: row.operating_system,
  viewport_width: row.viewport_width,
  viewport_height: row.viewport_height,
  device_pixel_ratio: row.device_pixel_ratio,
  user_agent: row.user_agent,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_capture_event = (row: CaptureEventRow): CaptureEvent => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  capture_session_id: row.capture_session_id,
  capture_asset_id: row.capture_asset_id,
  event_type: row.event_type,
  event_index: row.event_index,
  occurred_at: row.occurred_at.toISOString(),
  page_url: row.page_url,
  page_title: row.page_title,
  target_label: row.target_label,
  target_selector: row.target_selector,
  target_role: row.target_role,
  target_test_id: row.target_test_id,
  target_text: row.target_text,
  client_x: row.client_x,
  client_y: row.client_y,
  viewport_width: row.viewport_width,
  viewport_height: row.viewport_height,
  device_pixel_ratio: row.device_pixel_ratio,
  input_intent: row.input_intent,
  input_value_redacted: row.input_value_redacted,
  note: row.note,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_capture_asset = (row: CaptureAssetRow): CaptureAsset => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  capture_session_id: row.capture_session_id,
  file: {
    id: row.file_id,
    storage_provider: row.file_storage_provider,
    mime_type: row.file_mime_type,
    size_bytes: Number(row.file_size_bytes),
    original_name: row.file_original_name,
    checksum_sha256: row.file_checksum_sha256,
  },
  asset_type: row.asset_type,
  width: row.width,
  height: row.height,
  device_pixel_ratio: row.device_pixel_ratio,
  page_url: row.page_url,
  page_title: row.page_title,
  captured_at: row.captured_at.toISOString(),
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const capture_session_select = `
  id,
  organization_id,
  project_id,
  project_version_id,
  (SELECT json_build_object(
    'id', project_version.id, 'name', project_version.name,
    'slug', project_version.slug, 'status', project_version.status,
    'position', project_version.position
  ) FROM project_schema.project_version project_version
    WHERE project_version.id = capture_session.project_version_id
      AND project_version.project_id = capture_session.project_id
      AND project_version.organization_id = capture_session.organization_id
  ) AS project_version,
  name,
  description,
  status,
  source_type,
  started_at,
  completed_at,
  canceled_at,
  start_url,
  browser_name,
  browser_version,
  operating_system,
  viewport_width,
  viewport_height,
  device_pixel_ratio,
  user_agent,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const capture_event_select = `
  id,
  organization_id,
  project_id,
  capture_session_id,
  capture_asset_id,
  event_type,
  event_index,
  occurred_at,
  page_url,
  page_title,
  target_label,
  target_selector,
  target_role,
  target_test_id,
  target_text,
  client_x,
  client_y,
  viewport_width,
  viewport_height,
  device_pixel_ratio,
  input_intent,
  input_value_redacted,
  note,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const capture_asset_select = `
  capture_asset.id,
  capture_asset.organization_id,
  capture_asset.project_id,
  capture_asset.capture_session_id,
  capture_asset.asset_type,
  capture_asset.width,
  capture_asset.height,
  capture_asset.device_pixel_ratio,
  capture_asset.page_url,
  capture_asset.page_title,
  capture_asset.captured_at,
  capture_asset.created_by_id,
  capture_asset.updated_by_id,
  capture_asset.version,
  capture_asset.created_at,
  capture_asset.updated_at,
  app_file.id AS file_id,
  app_file.storage_provider AS file_storage_provider,
  app_file.mime_type AS file_mime_type,
  app_file.size_bytes AS file_size_bytes,
  app_file.original_name AS file_original_name,
  app_file.checksum_sha256 AS file_checksum_sha256
`;

const update_assignments = (data: NormalizedUpdateCaptureSessionInput) => {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const add_assignment = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (data.name !== undefined) {
    add_assignment("name", data.name);
  }
  if (data.description !== undefined) {
    add_assignment("description", data.description);
  }
  if (data.status !== undefined) {
    add_assignment("status", data.status);
    if (data.status === "capturing") {
      assignments.push("started_at = COALESCE(started_at, CURRENT_TIMESTAMP)");
    }
    if (data.status === "completed") {
      assignments.push(
        "completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)",
      );
    }
    if (data.status === "canceled") {
      assignments.push(
        "canceled_at = COALESCE(canceled_at, CURRENT_TIMESTAMP)",
      );
    }
  }
  if (data.start_url !== undefined) {
    add_assignment("start_url", data.start_url);
  }
  if (data.browser_name !== undefined) {
    add_assignment("browser_name", data.browser_name);
  }
  if (data.browser_version !== undefined) {
    add_assignment("browser_version", data.browser_version);
  }
  if (data.operating_system !== undefined) {
    add_assignment("operating_system", data.operating_system);
  }
  if (data.viewport_width !== undefined) {
    add_assignment("viewport_width", data.viewport_width);
  }
  if (data.viewport_height !== undefined) {
    add_assignment("viewport_height", data.viewport_height);
  }
  if (data.device_pixel_ratio !== undefined) {
    add_assignment("device_pixel_ratio", data.device_pixel_ratio);
  }
  if (data.user_agent !== undefined) {
    add_assignment("user_agent", data.user_agent);
  }
  if (data.metadata !== undefined) {
    add_assignment("metadata", data.metadata);
  }

  return {
    assignments,
    values,
  };
};

export const build_capture_session_repository = (
  db: Queryable,
): CaptureSessionRepository => ({
  async project_exists(input) {
    const result = await db.query<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM project_schema.project
        WHERE id = $1
        AND organization_id = $2
        AND is_deleted = FALSE
      ) AS exists
    `,
      [input.project_id, input.organization_id],
    );

    return Boolean(result.rows[0]?.exists);
  },

  async create_capture_session(input) {
    const result = await db.query<CaptureSessionRow>(
      `
      INSERT INTO capture_schema.capture_session (
        id,
        organization_id,
        project_id,
        project_version_id,
        name,
        description,
        source_type,
        start_url,
        browser_name,
        browser_version,
        operating_system,
        viewport_width,
        viewport_height,
        device_pixel_ratio,
        user_agent,
        metadata,
        created_by_id,
        updated_by_id,
        status,
        started_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'manual'), $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17,
        CASE WHEN $18 THEN 'capturing' ELSE 'draft' END,
        CASE WHEN $18 THEN CURRENT_TIMESTAMP ELSE NULL END)
      RETURNING ${capture_session_select}
    `,
      [
        ulid(),
        input.organization_id,
        input.project_id,
        input.data.project_version_id,
        input.data.name,
        input.data.description ?? null,
        input.data.source_type ?? null,
        input.data.start_url ?? null,
        input.data.browser_name ?? null,
        input.data.browser_version ?? null,
        input.data.operating_system ?? null,
        input.data.viewport_width ?? null,
        input.data.viewport_height ?? null,
        input.data.device_pixel_ratio ?? null,
        input.data.user_agent ?? null,
        input.data.metadata ?? null,
        input.actor_org_user_id,
        input.data.start_immediately,
      ],
    );
    const row = first_row(result);

    if (!row) {
      throw new Error("Failed to create capture session");
    }

    return map_capture_session(row);
  },

  async list_capture_sessions(input) {
    const values: unknown[] = [
      input.project_id,
      input.organization_id,
      input.project_version_id,
    ];
    const status_filter = input.status ? "AND status = $4" : "";

    if (input.status) {
      values.push(input.status);
    }

    const result = await db.query<CaptureSessionRow>(
      `
      SELECT ${capture_session_select}
      FROM capture_schema.capture_session
      WHERE project_id = $1
      AND organization_id = $2
      AND project_version_id = $3
      AND is_deleted = FALSE
      ${status_filter}
      ORDER BY created_at DESC, id DESC
    `,
      values,
    );

    return result.rows.map(map_capture_session);
  },

  async find_capture_session(input) {
    const result = await db.query<CaptureSessionRow>(
      `
      SELECT ${capture_session_select}
      FROM capture_schema.capture_session
      WHERE id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      LIMIT 1
    `,
      [input.capture_session_id, input.project_id, input.organization_id],
    );
    const row = first_row(result);

    return row ? map_capture_session(row) : null;
  },

  async get_capture_session_detail(input) {
    const session_result = await db.query<CaptureSessionRow>(
      `
      SELECT ${capture_session_select}
      FROM capture_schema.capture_session
      WHERE id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      LIMIT 1
    `,
      [input.capture_session_id, input.project_id, input.organization_id],
    );
    const session_row = first_row(session_result);

    if (!session_row) {
      return null;
    }

    const events_result = await db.query<CaptureEventRow>(
      `
      SELECT ${capture_event_select}
      FROM capture_schema.capture_event
      WHERE capture_session_id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      ORDER BY event_index ASC, created_at ASC, id ASC
    `,
      [input.capture_session_id, input.project_id, input.organization_id],
    );
    const assets_result = await db.query<CaptureAssetRow>(
      `
      SELECT ${capture_asset_select}
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      WHERE capture_asset.capture_session_id = $1
      AND capture_asset.project_id = $2
      AND capture_asset.organization_id = $3
      AND capture_asset.is_deleted = FALSE
      AND app_file.is_deleted = FALSE
      ORDER BY capture_asset.created_at ASC, capture_asset.id ASC
    `,
      [input.capture_session_id, input.project_id, input.organization_id],
    );

    return {
      capture_session: map_capture_session(session_row),
      capture_events: events_result.rows.map(map_capture_event),
      capture_assets: assets_result.rows.map(map_capture_asset),
    };
  },

  async update_capture_session(input) {
    const update = update_assignments(input.data);
    const values = [
      ...update.values,
      input.actor_org_user_id,
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ];
    const actor_index = update.values.length + 1;
    const capture_session_index = update.values.length + 2;
    const project_index = update.values.length + 3;
    const organization_index = update.values.length + 4;

    const result = await db.query<CaptureSessionRow>(
      `
      UPDATE capture_schema.capture_session
      SET ${[
        ...update.assignments,
        `updated_by_id = $${actor_index}`,
        "updated_at = CURRENT_TIMESTAMP",
        "version = version + 1",
      ].join(", ")}
      WHERE id = $${capture_session_index}
      AND project_id = $${project_index}
      AND organization_id = $${organization_index}
      AND is_deleted = FALSE
      RETURNING ${capture_session_select}
    `,
      values,
    );
    const row = first_row(result);

    return row ? map_capture_session(row) : null;
  },

  async complete_capture_session(input) {
    const find_current = async () => {
      const current_result = await db.query<CaptureSessionRow>(
        `
        SELECT ${capture_session_select}
        FROM capture_schema.capture_session
        WHERE id = $1
        AND project_id = $2
        AND organization_id = $3
        AND is_deleted = FALSE
        LIMIT 1
      `,
        [input.capture_session_id, input.project_id, input.organization_id],
      );

      return first_row(current_result);
    };
    const current_row = await find_current();

    if (!current_row) {
      return {
        outcome: "not_found" as const,
        capture_session: null,
      };
    }

    if (current_row.status === "completed") {
      return {
        outcome: "already_completed" as const,
        capture_session: map_capture_session(current_row),
      };
    }

    if (
      current_row.status === "canceled" ||
      current_row.status === "archived"
    ) {
      return {
        outcome: "not_completable" as const,
        capture_session: map_capture_session(current_row),
      };
    }

    const result = await db.query<CaptureSessionRow>(
      `
      UPDATE capture_schema.capture_session
      SET
        status = 'completed',
        completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND project_id = $3
      AND organization_id = $4
      AND is_deleted = FALSE
      AND status IN ('draft', 'capturing')
      RETURNING ${capture_session_select}
    `,
      [
        input.actor_org_user_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );
    const row = first_row(result);

    if (!row) {
      const refreshed_row = await find_current();

      if (refreshed_row?.status === "completed") {
        return {
          outcome: "already_completed" as const,
          capture_session: map_capture_session(refreshed_row),
        };
      }

      if (
        refreshed_row?.status === "canceled" ||
        refreshed_row?.status === "archived"
      ) {
        return {
          outcome: "not_completable" as const,
          capture_session: map_capture_session(refreshed_row),
        };
      }

      return {
        outcome: "not_found" as const,
        capture_session: null,
      };
    }

    return {
      outcome: "completed" as const,
      capture_session: map_capture_session(row),
    };
  },

  async delete_capture_session(input) {
    const result = await db.query<CaptureSessionRow>(
      `
      UPDATE capture_schema.capture_session
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND project_id = $3
      AND organization_id = $4
      AND is_deleted = FALSE
      RETURNING ${capture_session_select}
    `,
      [
        input.actor_org_user_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );

    return result.rows.length > 0;
  },

  async reassign_project_version(input) {
    await db.query("SELECT project_schema.lock_project_version_scope($1)", [
      input.project_id,
    ]);
    const current = await db.query<
      CaptureSessionRow & { has_children: boolean }
    >(
      `
      SELECT ${capture_session_select},
        (EXISTS (SELECT 1 FROM capture_schema.capture_event WHERE capture_session_id = capture_session.id)
         OR EXISTS (SELECT 1 FROM capture_schema.capture_asset WHERE capture_session_id = capture_session.id)) AS has_children
      FROM capture_schema.capture_session
      WHERE id = $1 AND project_id = $2 AND organization_id = $3
        AND is_deleted = FALSE FOR UPDATE
    `,
      [input.capture_session_id, input.project_id, input.organization_id],
    );
    const row = first_row(current);
    if (!row) return { outcome: "not_found", capture_session: null };
    const session = map_capture_session(row);
    if (row.project_version_id === input.project_version_id)
      return { outcome: "unchanged", capture_session: session };
    if (row.version !== input.expected_version)
      return { outcome: "conflict", capture_session: session };
    if (row.status !== "draft" || row.started_at !== null || row.has_children)
      return { outcome: "locked", capture_session: session };
    const target = await db.query<{ status: "active" | "archived" }>(
      `
      SELECT status FROM project_schema.project_version
      WHERE id = $1 AND project_id = $2 AND organization_id = $3
      FOR UPDATE
    `,
      [input.project_version_id, input.project_id, input.organization_id],
    );
    if (!target.rows[0])
      return { outcome: "project_version_not_found", capture_session: session };
    if (target.rows[0].status !== "active")
      return { outcome: "project_version_archived", capture_session: session };
    const updated = await db.query<CaptureSessionRow>(
      `
      UPDATE capture_schema.capture_session SET project_version_id = $1,
        updated_by_id = $2, updated_at = CURRENT_TIMESTAMP, version = version + 1
      WHERE id = $3 AND project_id = $4 AND organization_id = $5
      RETURNING ${capture_session_select}
    `,
      [
        input.project_version_id,
        input.actor_org_user_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );
    return {
      outcome: "reassigned",
      capture_session: map_capture_session(updated.rows[0]!),
    };
  },
});
