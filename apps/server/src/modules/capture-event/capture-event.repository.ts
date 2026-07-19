import { ulid } from "ulid";
import {
  type CaptureEvent,
  CaptureEventIndexConflictError,
  type CaptureEventRepository,
  type CaptureSessionStatus,
  type CaptureEventType,
  type CaptureSessionSourceType,
} from "./capture-event.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};

type TransactionClient = Queryable & {
  release: () => void;
};

type TransactionCapableQueryable = Queryable & {
  connect?: () => Promise<TransactionClient>;
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

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

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

const is_event_index_conflict = (error: unknown) => {
  const pg_error = error as { code?: string; constraint?: string };
  return (
    pg_error.code === "23505" &&
    pg_error.constraint === "uq_capture_event_session_index_active"
  );
};

const with_transaction = async <Result>(
  db: TransactionCapableQueryable,
  work: (client: Queryable) => Promise<Result>,
) => {
  if (!db.connect || "release" in db) {
    return work(db);
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const read_capture_events = async (
  db: Queryable,
  input: {
    capture_session_id: string;
    project_id: string;
    organization_id: string;
  },
) => {
  const result = await db.query<CaptureEventRow>(
    `
    SELECT ${capture_event_select}
    FROM capture_schema.capture_event
    WHERE capture_session_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE
    ORDER BY event_index ASC, created_at ASC, id ASC
  `,
    [input.capture_session_id, input.project_id, input.organization_id],
  );
  return result.rows.map(map_capture_event);
};

export const build_capture_event_repository = (
  db: TransactionCapableQueryable,
): CaptureEventRepository => ({
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

  async capture_session_exists(input) {
    const result = await db.query<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM capture_schema.capture_session
        WHERE id = $1
        AND project_id = $2
        AND organization_id = $3
        AND is_deleted = FALSE
      ) AS exists
    `,
      [input.capture_session_id, input.project_id, input.organization_id],
    );

    return Boolean(result.rows[0]?.exists);
  },

  async get_capture_session_source_type(input) {
    const result = await db.query<{ source_type: CaptureSessionSourceType }>(
      `
      SELECT capture_session.source_type
      FROM capture_schema.capture_session capture_session
      INNER JOIN project_schema.project project ON project.id = capture_session.project_id
      WHERE capture_session.id = $1
      AND capture_session.project_id = $2
      AND capture_session.organization_id = $3
      AND capture_session.is_deleted = FALSE
      AND project.is_deleted = FALSE
      LIMIT 1
    `,
      [input.capture_session_id, input.project_id, input.organization_id],
    );

    return result.rows[0]?.source_type ?? null;
  },

  async get_capture_session_editability(input) {
    const result = await db.query<{
      source_type: CaptureSessionSourceType;
      status: CaptureSessionStatus;
    }>(
      `
      SELECT capture_session.source_type, capture_session.status
      FROM capture_schema.capture_session capture_session
      INNER JOIN project_schema.project project ON project.id = capture_session.project_id
      WHERE capture_session.id = $1
      AND capture_session.project_id = $2
      AND capture_session.organization_id = $3
      AND capture_session.is_deleted = FALSE
      AND project.is_deleted = FALSE
      LIMIT 1
    `,
      [input.capture_session_id, input.project_id, input.organization_id],
    );

    return result.rows[0] ?? null;
  },

  async capture_asset_exists(input) {
    const result = await db.query<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM capture_schema.capture_asset
        WHERE id = $1
        AND capture_session_id = $2
        AND project_id = $3
        AND organization_id = $4
        AND is_deleted = FALSE
      ) AS exists
    `,
      [
        input.capture_asset_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );

    return Boolean(result.rows[0]?.exists);
  },

  async create_capture_event(input) {
    try {
      const result = await db.query<CaptureEventRow>(
        `
        INSERT INTO capture_schema.capture_event (
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
          metadata,
          created_by_id,
          updated_by_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, COALESCE($8::timestamptz, CURRENT_TIMESTAMP),
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, TRUE, $22, $23, $24, $24
        )
        RETURNING ${capture_event_select}
      `,
        [
          ulid(),
          input.organization_id,
          input.project_id,
          input.capture_session_id,
          input.data.capture_asset_id ?? null,
          input.data.event_type,
          input.data.event_index,
          input.data.occurred_at ?? null,
          input.data.page_url ?? null,
          input.data.page_title ?? null,
          input.data.target_label ?? null,
          input.data.target_selector ?? null,
          input.data.target_role ?? null,
          input.data.target_test_id ?? null,
          input.data.target_text ?? null,
          input.data.client_x ?? null,
          input.data.client_y ?? null,
          input.data.viewport_width ?? null,
          input.data.viewport_height ?? null,
          input.data.device_pixel_ratio ?? null,
          input.data.input_intent ?? null,
          input.data.note ?? null,
          input.data.metadata ?? null,
          input.actor_org_user_id,
        ],
      );
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to create capture event");
      }

      return map_capture_event(row);
    } catch (error) {
      if (is_event_index_conflict(error)) {
        throw new CaptureEventIndexConflictError();
      }

      throw error;
    }
  },

  async list_capture_events(input) {
    const values: unknown[] = [
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ];
    const event_type_filter = input.event_type ? "AND event_type = $4" : "";

    if (input.event_type) {
      values.push(input.event_type);
    }

    const result = await db.query<CaptureEventRow>(
      `
      SELECT ${capture_event_select}
      FROM capture_schema.capture_event
      WHERE capture_session_id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      ${event_type_filter}
      ORDER BY event_index ASC, created_at ASC, id ASC
    `,
      values,
    );

    return result.rows.map(map_capture_event);
  },

  async find_capture_event(input) {
    const result = await db.query<CaptureEventRow>(
      `
      SELECT ${capture_event_select}
      FROM capture_schema.capture_event
      WHERE id = $1
      AND capture_session_id = $2
      AND project_id = $3
      AND organization_id = $4
      AND is_deleted = FALSE
      LIMIT 1
    `,
      [
        input.capture_event_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );
    const row = first_row(result);

    return row ? map_capture_event(row) : null;
  },

  async delete_capture_event(input) {
    const result = await db.query<CaptureEventRow>(
      `
      UPDATE capture_schema.capture_event
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND capture_session_id = $3
      AND project_id = $4
      AND organization_id = $5
      AND is_deleted = FALSE
      RETURNING ${capture_event_select}
    `,
      [
        input.actor_org_user_id,
        input.capture_event_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );

    return result.rows.length > 0;
  },

  async update_capture_event(input) {
    const result = await db.query<CaptureEventRow>(
      `
      UPDATE capture_schema.capture_event
      SET
        page_url = CASE WHEN $1::boolean THEN $2 ELSE page_url END,
        page_title = CASE WHEN $3::boolean THEN $4 ELSE page_title END,
        target_label = CASE WHEN $5::boolean THEN $6 ELSE target_label END,
        target_text = CASE WHEN $7::boolean THEN $8 ELSE target_text END,
        input_intent = CASE WHEN $9::boolean THEN $10 ELSE input_intent END,
        note = CASE WHEN $11::boolean THEN $12 ELSE note END,
        updated_by_id = $13,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $14
      AND capture_session_id = $15
      AND project_id = $16
      AND organization_id = $17
      AND is_deleted = FALSE
      RETURNING ${capture_event_select}
    `,
      [
        Object.hasOwn(input.data, "page_url"),
        input.data.page_url ?? null,
        Object.hasOwn(input.data, "page_title"),
        input.data.page_title ?? null,
        Object.hasOwn(input.data, "target_label"),
        input.data.target_label ?? null,
        Object.hasOwn(input.data, "target_text"),
        input.data.target_text ?? null,
        Object.hasOwn(input.data, "input_intent"),
        input.data.input_intent ?? null,
        Object.hasOwn(input.data, "note"),
        input.data.note ?? null,
        input.actor_org_user_id,
        input.capture_event_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );
    const row = first_row(result);

    return row ? map_capture_event(row) : null;
  },

  async reorder_capture_events(input) {
    return with_transaction(db, async (client) => {
      const current = await client.query<{ id: string; event_index: number }>(
        `
        SELECT id, event_index FROM capture_schema.capture_event
        WHERE capture_session_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE
      `,
        [input.capture_session_id, input.project_id, input.organization_id],
      );
      const current_indexes = new Map(
        current.rows.map((row) => [row.id, row.event_index]),
      );
      const changed = input.event_ids
        .map((id, index) => ({ id, final_index: index + 1 }))
        .filter(
          ({ id, final_index }) => current_indexes.get(id) !== final_index,
        );
      const event_ids = changed.map(({ id }) => id);
      const final_indexes = changed.map(({ final_index }) => final_index);
      const temporary_indexes = final_indexes.map(
        (index) => index + input.event_ids.length + 100000,
      );

      if (changed.length === 0) {
        return read_capture_events(client, input);
      }
      await client.query(
        `
        UPDATE capture_schema.capture_event capture_event
        SET event_index = ordered.temporary_index
        FROM (
          SELECT *
          FROM unnest($1::text[], $2::int[]) AS requested(id, temporary_index)
        ) AS ordered
        WHERE capture_event.id = ordered.id
        AND capture_event.capture_session_id = $3
        AND capture_event.project_id = $4
        AND capture_event.organization_id = $5
        AND capture_event.is_deleted = FALSE
      `,
        [
          event_ids,
          temporary_indexes,
          input.capture_session_id,
          input.project_id,
          input.organization_id,
        ],
      );

      await client.query(
        `
        UPDATE capture_schema.capture_event capture_event
        SET
          event_index = ordered.final_index,
          updated_by_id = $6,
          updated_at = CURRENT_TIMESTAMP,
          version = capture_event.version + 1
        FROM (
          SELECT *
          FROM unnest($1::text[], $2::int[]) AS requested(id, final_index)
        ) AS ordered
        WHERE capture_event.id = ordered.id
        AND capture_event.capture_session_id = $3
        AND capture_event.project_id = $4
        AND capture_event.organization_id = $5
        AND capture_event.is_deleted = FALSE
      `,
        [
          event_ids,
          final_indexes,
          input.capture_session_id,
          input.project_id,
          input.organization_id,
          input.actor_org_user_id,
        ],
      );

      return read_capture_events(client, input);
    });
  },
});
