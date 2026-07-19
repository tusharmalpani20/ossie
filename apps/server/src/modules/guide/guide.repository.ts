import { ulid } from "ulid";
import type {
  Guide,
  GuideBlock,
  GuideDetail,
  GuideExportAssetFile,
  GuideRepository,
  GuideSourceCaptureAsset,
  GuideSourceEvent,
  GuideSourceEventType,
  GuideStatus,
  GuideStep,
} from "./guide.service";

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

type TransactionCapable = Queryable & {
  connect?: () => Promise<TransactionClient>;
};

type GuideRow = {
  id: string;
  organization_id: string;
  project_id: string;
  source_capture_session_id: string | null;
  title: string;
  description: string | null;
  status: GuideStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type GuideBlockRow = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  selected_capture_asset_id: string | null;
  screenshot_hidden: boolean;
  block_type: GuideBlock["block_type"];
  content: GuideBlock["content"] | null;
  block_index: number;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type GuideStepRow = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_id: string;
  guide_block_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  title: string;
  body: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type GuideSourceEventRow = {
  id: string;
  event_type: GuideSourceEventType;
  event_index: number;
  capture_asset_id: string | null;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_role: string | null;
  target_text: string | null;
  note: string | null;
};

type GuideSourceCaptureAssetRow = {
  id: string;
  project_id: string;
  capture_session_id: string;
  asset_type: GuideSourceCaptureAsset["asset_type"];
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: Date;
  file_id: string;
  original_name: string | null;
  mime_type: string;
  size_bytes: number;
};

type GuideExportAssetFileRow = {
  capture_asset_id: string;
  storage_provider: "local" | "external";
  storage_key: string;
  mime_type: string;
  original_name: string | null;
  size_bytes: number;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const map_guide = (row: GuideRow): Guide => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  source_capture_session_id: row.source_capture_session_id,
  title: row.title,
  description: row.description,
  status: row.status,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_step = (row: GuideStepRow): GuideStep => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  guide_id: row.guide_id,
  guide_block_id: row.guide_block_id,
  source_capture_session_id: row.source_capture_session_id,
  source_capture_event_id: row.source_capture_event_id,
  source_capture_asset_id: row.source_capture_asset_id,
  title: row.title,
  body: row.body,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_block = (row: GuideBlockRow, step: GuideStep | null): GuideBlock => ({
  id: row.id,
  organization_id: row.organization_id,
  project_id: row.project_id,
  guide_id: row.guide_id,
  source_capture_session_id: row.source_capture_session_id,
  source_capture_event_id: row.source_capture_event_id,
  source_capture_asset_id: row.source_capture_asset_id,
  selected_capture_asset_id: row.selected_capture_asset_id,
  screenshot_hidden: row.screenshot_hidden,
  display_capture_asset_id: row.screenshot_hidden
    ? null
    : (row.selected_capture_asset_id ??
      row.source_capture_asset_id ??
      step?.source_capture_asset_id ??
      null),
  block_type: row.block_type,
  content: row.content,
  block_index: row.block_index,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
  step,
});

const map_source_event = (row: GuideSourceEventRow): GuideSourceEvent => ({
  id: row.id,
  event_type: row.event_type,
  event_index: row.event_index,
  capture_asset_id: row.capture_asset_id,
  page_url: row.page_url,
  page_title: row.page_title,
  target_label: row.target_label,
  target_role: row.target_role,
  target_text: row.target_text,
  note: row.note,
});

const map_source_capture_asset = (
  row: GuideSourceCaptureAssetRow,
): GuideSourceCaptureAsset => ({
  id: row.id,
  capture_session_id: row.capture_session_id,
  asset_type: row.asset_type,
  width: row.width,
  height: row.height,
  device_pixel_ratio: row.device_pixel_ratio,
  page_url: row.page_url,
  page_title: row.page_title,
  captured_at: row.captured_at.toISOString(),
  file_url: `/api/v1/projects/${row.project_id}/capture-sessions/${row.capture_session_id}/assets/${row.id}/file`,
  file: {
    id: row.file_id,
    original_name: row.original_name,
    mime_type: row.mime_type,
    size_bytes: Number(row.size_bytes),
  },
});

const guide_select = `
  id,
  organization_id,
  project_id,
  source_capture_session_id,
  title,
  description,
  status,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const guide_block_select = `
  id,
  organization_id,
  project_id,
  guide_id,
  source_capture_session_id,
  source_capture_event_id,
  source_capture_asset_id,
  selected_capture_asset_id,
  screenshot_hidden,
  block_type,
  content,
  block_index,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const guide_step_select = `
  id,
  organization_id,
  project_id,
  guide_id,
  guide_block_id,
  source_capture_session_id,
  source_capture_event_id,
  source_capture_asset_id,
  title,
  body,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;

const build_detail_from_rows = (
  guide_row: GuideRow,
  block_rows: GuideBlockRow[],
  step_rows: GuideStepRow[],
  source_capture_assets: GuideSourceCaptureAsset[] = [],
): GuideDetail => {
  const steps_by_block_id = new Map(
    step_rows.map((row) => [row.guide_block_id, map_step(row)]),
  );

  return {
    guide: map_guide(guide_row),
    guide_blocks: block_rows.map((row) =>
      map_block(row, steps_by_block_id.get(row.id) ?? null),
    ),
    source_capture_assets,
  };
};

const source_capture_asset_ids_from_blocks = (blocks: GuideBlock[]) => {
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const block of blocks) {
    const source_capture_asset_id = block.display_capture_asset_id;

    if (!source_capture_asset_id || seen.has(source_capture_asset_id)) {
      continue;
    }

    seen.add(source_capture_asset_id);
    ids.push(source_capture_asset_id);
  }

  return ids;
};

const read_source_capture_assets = async (
  db: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    source_capture_asset_ids: string[];
  },
) => {
  if (input.source_capture_asset_ids.length === 0) {
    return [];
  }

  const result = await db.query<GuideSourceCaptureAssetRow>(
    `
    SELECT
      capture_asset.id,
      capture_asset.project_id,
      capture_asset.capture_session_id,
      capture_asset.asset_type,
      capture_asset.width,
      capture_asset.height,
      capture_asset.device_pixel_ratio,
      capture_asset.page_url,
      capture_asset.page_title,
      capture_asset.captured_at,
      app_file.id AS file_id,
      app_file.original_name,
      app_file.mime_type,
      app_file.size_bytes
    FROM capture_schema.capture_asset capture_asset
    INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
    WHERE capture_asset.id = ANY($1::varchar[])
    AND capture_asset.project_id = $2
    AND capture_asset.organization_id = $3
    AND capture_asset.is_deleted = FALSE
    AND app_file.is_deleted = FALSE
  `,
    [input.source_capture_asset_ids, input.project_id, input.organization_id],
  );

  const assets_by_id = new Map(
    result.rows.map((row) => [row.id, map_source_capture_asset(row)]),
  );

  return input.source_capture_asset_ids
    .map((id) => assets_by_id.get(id))
    .filter((asset): asset is GuideSourceCaptureAsset => Boolean(asset));
};

const read_guide_blocks = async (
  db: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
  },
) => {
  const blocks_result = await db.query<GuideBlockRow>(
    `
    SELECT ${guide_block_select}
    FROM guide_schema.guide_block
    WHERE guide_id = $1
    AND project_id = $2
    AND organization_id = $3
    AND is_deleted = FALSE
    ORDER BY block_index ASC, created_at ASC, id ASC
  `,
    [input.guide_id, input.project_id, input.organization_id],
  );

  const steps_result = await db.query<GuideStepRow>(
    `
    SELECT ${guide_step_select}
    FROM guide_schema.guide_step
    WHERE guide_id = $1
    AND project_id = $2
    AND organization_id = $3
    AND is_deleted = FALSE
    ORDER BY created_at ASC, id ASC
  `,
    [input.guide_id, input.project_id, input.organization_id],
  );
  const steps_by_block_id = new Map(
    steps_result.rows.map((row) => [row.guide_block_id, map_step(row)]),
  );

  return blocks_result.rows.map((row) =>
    map_block(row, steps_by_block_id.get(row.id) ?? null),
  );
};

const touch_guide = async (
  db: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    actor_org_user_id: string;
  },
) => {
  await db.query(
    `
    UPDATE guide_schema.guide
    SET
      updated_by_id = $1,
      updated_at = CURRENT_TIMESTAMP,
      version = version + 1
    WHERE id = $2
    AND project_id = $3
    AND organization_id = $4
    AND is_deleted = FALSE
  `,
    [
      input.actor_org_user_id,
      input.guide_id,
      input.project_id,
      input.organization_id,
    ],
  );
};

const with_transaction = async <Result>(
  db: TransactionCapable,
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

export const build_guide_repository = (
  db: TransactionCapable,
): GuideRepository => ({
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
        FROM capture_schema.capture_session capture_session
        INNER JOIN project_schema.project project ON project.id = capture_session.project_id
        WHERE capture_session.id = $1
        AND capture_session.project_id = $2
        AND capture_session.organization_id = $3
        AND capture_session.is_deleted = FALSE
        AND project.is_deleted = FALSE
      ) AS exists
    `,
      [input.capture_session_id, input.project_id, input.organization_id],
    );

    return Boolean(result.rows[0]?.exists);
  },

  async list_source_capture_events(input) {
    const values: unknown[] = [
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ];
    const selected_filter = input.selected_capture_event_ids
      ? "AND id = ANY($4::varchar[])"
      : "";

    if (input.selected_capture_event_ids) {
      values.push(input.selected_capture_event_ids);
    }

    const result = await db.query<GuideSourceEventRow>(
      `
      SELECT
        id,
        event_type,
        event_index,
        capture_asset_id,
        page_url,
        page_title,
        target_label,
        target_role,
        target_text,
        note
      FROM capture_schema.capture_event
      WHERE capture_session_id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      ${selected_filter}
      ORDER BY event_index ASC, created_at ASC, id ASC
    `,
      values,
    );

    return result.rows.map(map_source_event);
  },

  async list_active_capture_asset_ids(input) {
    if (input.capture_asset_ids.length === 0) {
      return [];
    }

    const result = await db.query<{ id: string }>(
      `
      SELECT id
      FROM capture_schema.capture_asset
      WHERE id = ANY($1::varchar[])
      AND capture_session_id = $2
      AND project_id = $3
      AND organization_id = $4
      AND is_deleted = FALSE
    `,
      [
        input.capture_asset_ids,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );

    return result.rows.map((row) => row.id);
  },

  async active_screenshot_asset_exists(input) {
    const result = await db.query<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM capture_schema.capture_asset capture_asset
        INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
        WHERE capture_asset.id = $1
        AND capture_asset.project_id = $2
        AND capture_asset.organization_id = $3
        AND capture_asset.asset_type IN ('screenshot', 'redacted_screenshot')
        AND capture_asset.is_deleted = FALSE
        AND app_file.is_deleted = FALSE
      ) AS exists
    `,
      [input.capture_asset_id, input.project_id, input.organization_id],
    );

    return Boolean(result.rows[0]?.exists);
  },

  async create_guide_from_capture(input) {
    return with_transaction(db, async (client) => {
      const guide_result = await client.query<GuideRow>(
        `
        INSERT INTO guide_schema.guide (
          id,
          organization_id,
          project_id,
          source_capture_session_id,
          title,
          description,
          created_by_id,
          updated_by_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING ${guide_select}
      `,
        [
          ulid(),
          input.organization_id,
          input.project_id,
          input.capture_session_id,
          input.data.title,
          input.data.description,
          input.actor_org_user_id,
        ],
      );
      const guide_row = first_row(guide_result);

      if (!guide_row) {
        throw new Error("Failed to create guide");
      }

      const block_rows: GuideBlockRow[] = [];
      const step_rows: GuideStepRow[] = [];

      for (const block of input.data.blocks) {
        const block_result = await client.query<GuideBlockRow>(
          `
          INSERT INTO guide_schema.guide_block (
            id,
            organization_id,
            project_id,
            guide_id,
            source_capture_session_id,
            source_capture_event_id,
          source_capture_asset_id,
          block_type,
          content,
          block_index,
            created_by_id,
          updated_by_id
        )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, $9, $10, $10)
          RETURNING ${guide_block_select}
        `,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            guide_row.id,
            input.capture_session_id,
            block.source_capture_event_id,
            block.source_capture_asset_id,
            block.block_type,
            block.block_index,
            input.actor_org_user_id,
          ],
        );
        const block_row = first_row(block_result);

        if (!block_row) {
          throw new Error("Failed to create guide block");
        }

        const step_result = await client.query<GuideStepRow>(
          `
          INSERT INTO guide_schema.guide_step (
            id,
            organization_id,
            project_id,
            guide_id,
            guide_block_id,
            source_capture_session_id,
            source_capture_event_id,
            source_capture_asset_id,
            title,
            body,
            created_by_id,
            updated_by_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
          RETURNING ${guide_step_select}
        `,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            guide_row.id,
            block_row.id,
            input.capture_session_id,
            block.source_capture_event_id,
            block.source_capture_asset_id,
            block.step.title,
            block.step.body,
            input.actor_org_user_id,
          ],
        );
        const step_row = first_row(step_result);

        if (!step_row) {
          throw new Error("Failed to create guide step");
        }

        block_rows.push(block_row);
        step_rows.push(step_row);
      }

      return build_detail_from_rows(guide_row, block_rows, step_rows);
    });
  },

  async list_guides(input) {
    const result = await db.query<GuideRow>(
      `
      SELECT ${guide_select}
      FROM guide_schema.guide
      WHERE project_id = $1
      AND organization_id = $2
      AND is_deleted = FALSE
      ORDER BY created_at DESC, id DESC
    `,
      [input.project_id, input.organization_id],
    );

    return result.rows.map(map_guide);
  },

  async find_guide_detail(input) {
    const guide_result = await db.query<GuideRow>(
      `
      SELECT ${guide_select}
      FROM guide_schema.guide
      WHERE id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      LIMIT 1
    `,
      [input.guide_id, input.project_id, input.organization_id],
    );
    const guide_row = first_row(guide_result);

    if (!guide_row) {
      return null;
    }

    const blocks_result = await db.query<GuideBlockRow>(
      `
      SELECT ${guide_block_select}
      FROM guide_schema.guide_block
      WHERE guide_id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      ORDER BY block_index ASC, created_at ASC, id ASC
    `,
      [input.guide_id, input.project_id, input.organization_id],
    );

    const steps_result = await db.query<GuideStepRow>(
      `
      SELECT ${guide_step_select}
      FROM guide_schema.guide_step
      WHERE guide_id = $1
      AND project_id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      ORDER BY created_at ASC, id ASC
    `,
      [input.guide_id, input.project_id, input.organization_id],
    );

    const guide_blocks = build_detail_from_rows(
      guide_row,
      blocks_result.rows,
      steps_result.rows,
    ).guide_blocks;
    const source_capture_assets = await read_source_capture_assets(db, {
      organization_id: input.organization_id,
      project_id: input.project_id,
      source_capture_asset_ids:
        source_capture_asset_ids_from_blocks(guide_blocks),
    });

    return {
      guide: map_guide(guide_row),
      guide_blocks,
      source_capture_assets,
    };
  },

  async find_guide_export_asset_files(input) {
    if (input.capture_asset_ids.length === 0) {
      return [];
    }

    const result = await db.query<GuideExportAssetFileRow>(
      `
      SELECT DISTINCT ON (capture_asset.id)
        capture_asset.id AS capture_asset_id,
        app_file.storage_provider,
        app_file.storage_key,
        app_file.mime_type,
        app_file.original_name,
        app_file.size_bytes
      FROM guide_schema.guide guide
      INNER JOIN guide_schema.guide_block guide_block
        ON guide_block.guide_id = guide.id
        AND guide_block.project_id = guide.project_id
        AND guide_block.organization_id = guide.organization_id
        AND guide_block.is_deleted = FALSE
      LEFT JOIN guide_schema.guide_step guide_step
        ON guide_step.guide_block_id = guide_block.id
        AND guide_step.project_id = guide_block.project_id
        AND guide_step.organization_id = guide_block.organization_id
        AND guide_step.is_deleted = FALSE
      INNER JOIN capture_schema.capture_asset capture_asset
        ON capture_asset.id = ANY($4::varchar[])
        AND capture_asset.id IN (
          guide_block.selected_capture_asset_id,
          guide_block.source_capture_asset_id,
          guide_step.source_capture_asset_id
        )
        AND capture_asset.project_id = guide.project_id
        AND capture_asset.organization_id = guide.organization_id
        AND capture_asset.is_deleted = FALSE
      INNER JOIN file_schema.file app_file
        ON app_file.id = capture_asset.file_id
        AND app_file.organization_id = guide.organization_id
        AND app_file.is_deleted = FALSE
      WHERE guide.id = $1
      AND guide.project_id = $2
      AND guide.organization_id = $3
      AND guide.is_deleted = FALSE
      ORDER BY capture_asset.id
    `,
      [
        input.guide_id,
        input.project_id,
        input.organization_id,
        input.capture_asset_ids,
      ],
    );
    const files_by_asset_id = new Map(
      result.rows.map((row): [string, GuideExportAssetFile] => [
        row.capture_asset_id,
        {
          capture_asset_id: row.capture_asset_id,
          storage_provider: row.storage_provider,
          storage_key: row.storage_key,
          mime_type: row.mime_type,
          original_name: row.original_name,
          size_bytes: Number(row.size_bytes),
        },
      ]),
    );

    return input.capture_asset_ids
      .map((id) => files_by_asset_id.get(id))
      .filter((file): file is GuideExportAssetFile => Boolean(file));
  },

  async update_guide(input) {
    const assignments: string[] = [];
    const values: unknown[] = [];

    const add_assignment = (column: string, value: unknown) => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };

    if (input.data.title !== undefined) {
      add_assignment("title", input.data.title);
    }
    if (input.data.description !== undefined) {
      add_assignment("description", input.data.description);
    }
    if (input.data.status !== undefined) {
      add_assignment("status", input.data.status);
    }

    values.push(
      input.actor_org_user_id,
      input.guide_id,
      input.project_id,
      input.organization_id,
    );
    const actor_index = values.length - 3;
    const guide_index = values.length - 2;
    const project_index = values.length - 1;
    const organization_index = values.length;

    const result = await db.query<GuideRow>(
      `
      UPDATE guide_schema.guide
      SET ${[
        ...assignments,
        `updated_by_id = $${actor_index}`,
        "updated_at = CURRENT_TIMESTAMP",
        "version = version + 1",
      ].join(", ")}
      WHERE id = $${guide_index}
      AND project_id = $${project_index}
      AND organization_id = $${organization_index}
      AND is_deleted = FALSE
      RETURNING ${guide_select}
    `,
      values,
    );
    const row = first_row(result);

    if (!row) {
      throw new Error("Failed to update guide");
    }

    return map_guide(row);
  },

  async find_guide_step(input) {
    const result = await db.query<GuideStepRow>(
      `
      SELECT ${guide_step_select}
      FROM guide_schema.guide_step
      WHERE id = $1
      AND guide_id = $2
      AND project_id = $3
      AND organization_id = $4
      AND is_deleted = FALSE
      LIMIT 1
    `,
      [
        input.guide_step_id,
        input.guide_id,
        input.project_id,
        input.organization_id,
      ],
    );
    const row = first_row(result);

    return row ? map_step(row) : null;
  },

  async update_guide_step(input) {
    return with_transaction(db, async (client) => {
      const assignments: string[] = [];
      const values: unknown[] = [];

      const add_assignment = (column: string, value: unknown) => {
        values.push(value);
        assignments.push(`${column} = $${values.length}`);
      };

      if (input.data.title !== undefined) {
        add_assignment("title", input.data.title);
      }
      if (input.data.body !== undefined) {
        add_assignment("body", input.data.body);
      }

      values.push(
        input.actor_org_user_id,
        input.guide_step_id,
        input.guide_id,
        input.project_id,
        input.organization_id,
      );
      const actor_index = values.length - 4;
      const step_index = values.length - 3;
      const guide_index = values.length - 2;
      const project_index = values.length - 1;
      const organization_index = values.length;

      const result = await client.query<GuideStepRow>(
        `
        UPDATE guide_schema.guide_step
        SET ${[
          ...assignments,
          `updated_by_id = $${actor_index}`,
          "updated_at = CURRENT_TIMESTAMP",
          "version = version + 1",
        ].join(", ")}
        WHERE id = $${step_index}
        AND guide_id = $${guide_index}
        AND project_id = $${project_index}
        AND organization_id = $${organization_index}
        AND is_deleted = FALSE
        RETURNING ${guide_step_select}
      `,
        values,
      );
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to update guide step");
      }

      await touch_guide(client, input);

      return map_step(row);
    });
  },

  async list_guide_blocks(input) {
    return read_guide_blocks(db, input);
  },

  async reorder_guide_blocks(input) {
    return with_transaction(db, async (client) => {
      const active_blocks = await read_guide_blocks(client, input);
      const current_indexes = new Map(
        active_blocks.map((row) => [row.id, row.block_index]),
      );
      const changed_ids = input.block_ids.filter(
        (id, index) => current_indexes.get(id) !== index + 1,
      );
      if (changed_ids.length === 0) return active_blocks;
      await client.query(
        `
        UPDATE guide_schema.guide_block
        SET
          block_index = block_index + 1000000,
          updated_by_id = $1,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
        WHERE guide_id = $2
        AND project_id = $3
        AND organization_id = $4
        AND is_deleted = FALSE
        AND id = ANY($5::varchar[])
      `,
        [
          input.actor_org_user_id,
          input.guide_id,
          input.project_id,
          input.organization_id,
          changed_ids,
        ],
      );

      for (const [index, block_id] of input.block_ids.entries()) {
        if (!changed_ids.includes(block_id)) continue;
        await client.query(
          `
          UPDATE guide_schema.guide_block
          SET
            block_index = $1,
            updated_by_id = $2,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
          WHERE id = $3
          AND guide_id = $4
          AND project_id = $5
          AND organization_id = $6
          AND is_deleted = FALSE
        `,
          [
            index + 1,
            input.actor_org_user_id,
            block_id,
            input.guide_id,
            input.project_id,
            input.organization_id,
          ],
        );
      }

      await touch_guide(client, input);

      return read_guide_blocks(client, input);
    });
  },

  async create_guide_block(input) {
    return with_transaction(db, async (client) => {
      const active_blocks = await read_guide_blocks(client, input);
      const target_position = (() => {
        if (!input.data.position) {
          return active_blocks.length + 1;
        }

        const target = active_blocks.find(
          (block) => block.id === input.data.position?.guide_block_id,
        );

        if (!target) {
          return null;
        }

        return input.data.position.placement === "before"
          ? target.block_index
          : target.block_index + 1;
      })();

      if (!target_position) {
        return active_blocks;
      }

      await client.query(
        `
        UPDATE guide_schema.guide_block
        SET
          block_index = block_index + 1000000,
          updated_by_id = $1,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
        WHERE guide_id = $2
        AND project_id = $3
        AND organization_id = $4
        AND is_deleted = FALSE
        AND block_index >= $5
      `,
        [
          input.actor_org_user_id,
          input.guide_id,
          input.project_id,
          input.organization_id,
          target_position,
        ],
      );

      const block_id = ulid();
      const block_result = await client.query<GuideBlockRow>(
        `
        INSERT INTO guide_schema.guide_block (
          id,
          organization_id,
          project_id,
          guide_id,
          source_capture_session_id,
          source_capture_event_id,
          source_capture_asset_id,
          block_type,
          content,
          block_index,
          created_by_id,
          updated_by_id
        )
        VALUES ($1, $2, $3, $4, NULL, NULL, NULL, $5, $6, $7, $8, $8)
        RETURNING ${guide_block_select}
      `,
        [
          block_id,
          input.organization_id,
          input.project_id,
          input.guide_id,
          input.data.block_type,
          input.data.content ? JSON.stringify(input.data.content) : null,
          target_position,
          input.actor_org_user_id,
        ],
      );
      const block_row = first_row(block_result);

      if (!block_row) {
        throw new Error("Failed to create guide block");
      }

      if (input.data.block_type === "step" && input.data.step) {
        await client.query<GuideStepRow>(
          `
          INSERT INTO guide_schema.guide_step (
            id,
            organization_id,
            project_id,
            guide_id,
            guide_block_id,
            source_capture_session_id,
            source_capture_event_id,
            source_capture_asset_id,
            title,
            body,
            created_by_id,
            updated_by_id
          )
          VALUES ($1, $2, $3, $4, $5, NULL, NULL, NULL, $6, $7, $8, $8)
        `,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            input.guide_id,
            block_id,
            input.data.step.title,
            input.data.step.body,
            input.actor_org_user_id,
          ],
        );
      }

      const shifted_blocks = await read_guide_blocks(client, input);
      const shifted_without_insert = shifted_blocks
        .filter(
          (block) => block.id !== block_id && block.block_index >= 1000000,
        )
        .sort((left, right) => left.block_index - right.block_index);

      for (const [index, block] of shifted_without_insert.entries()) {
        await client.query(
          `
          UPDATE guide_schema.guide_block
          SET
            block_index = $1,
            updated_by_id = $2,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
          WHERE id = $3
          AND guide_id = $4
          AND project_id = $5
          AND organization_id = $6
          AND is_deleted = FALSE
        `,
          [
            target_position + index + 1,
            input.actor_org_user_id,
            block.id,
            input.guide_id,
            input.project_id,
            input.organization_id,
          ],
        );
      }

      await touch_guide(client, input);

      return read_guide_blocks(client, input);
    });
  },

  async update_guide_block(input) {
    return with_transaction(db, async (client) => {
      const result = await client.query<GuideBlockRow>(
        `
        UPDATE guide_schema.guide_block
        SET
          content = $1,
          updated_by_id = $2,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $3
        AND guide_id = $4
        AND project_id = $5
        AND organization_id = $6
        AND is_deleted = FALSE
        RETURNING ${guide_block_select}
      `,
        [
          JSON.stringify(input.data.content),
          input.actor_org_user_id,
          input.guide_block_id,
          input.guide_id,
          input.project_id,
          input.organization_id,
        ],
      );
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to update guide block");
      }

      await touch_guide(client, input);

      return map_block(row, null);
    });
  },

  async update_guide_block_screenshot(input) {
    return with_transaction(db, async (client) => {
      const result = await client.query<GuideBlockRow>(
        `
        UPDATE guide_schema.guide_block
        SET
          selected_capture_asset_id = $1,
          screenshot_hidden = $2,
          content = COALESCE(content, '{}'::jsonb) || '{"annotations":[]}'::jsonb,
          updated_by_id = $3,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $4
        AND guide_id = $5
        AND project_id = $6
        AND organization_id = $7
        AND is_deleted = FALSE
        RETURNING ${guide_block_select}
      `,
        [
          input.data.selected_capture_asset_id,
          input.data.screenshot_hidden,
          input.actor_org_user_id,
          input.guide_block_id,
          input.guide_id,
          input.project_id,
          input.organization_id,
        ],
      );
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to update guide block screenshot");
      }

      const steps_result = await client.query<GuideStepRow>(
        `
        SELECT ${guide_step_select}
        FROM guide_schema.guide_step
        WHERE guide_block_id = $1
        AND guide_id = $2
        AND project_id = $3
        AND organization_id = $4
        AND is_deleted = FALSE
        LIMIT 1
      `,
        [
          input.guide_block_id,
          input.guide_id,
          input.project_id,
          input.organization_id,
        ],
      );

      await touch_guide(client, input);

      return map_block(
        row,
        steps_result.rows[0] ? map_step(steps_result.rows[0]) : null,
      );
    });
  },

  async update_guide_block_annotations(input) {
    return with_transaction(db, async (client) => {
      const result = await client.query<GuideBlockRow>(
        `
        UPDATE guide_schema.guide_block
        SET
          content = $1,
          updated_by_id = $2,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $3
        AND guide_id = $4
        AND project_id = $5
        AND organization_id = $6
        AND is_deleted = FALSE
        RETURNING ${guide_block_select}
      `,
        [
          JSON.stringify(input.data.content),
          input.actor_org_user_id,
          input.guide_block_id,
          input.guide_id,
          input.project_id,
          input.organization_id,
        ],
      );
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to update guide block annotations");
      }

      const steps_result = await client.query<GuideStepRow>(
        `
        SELECT ${guide_step_select}
        FROM guide_schema.guide_step
        WHERE guide_block_id = $1
        AND guide_id = $2
        AND project_id = $3
        AND organization_id = $4
        AND is_deleted = FALSE
        LIMIT 1
      `,
        [
          input.guide_block_id,
          input.guide_id,
          input.project_id,
          input.organization_id,
        ],
      );

      await touch_guide(client, input);

      return map_block(
        row,
        steps_result.rows[0] ? map_step(steps_result.rows[0]) : null,
      );
    });
  },

  async delete_guide_block(input) {
    return with_transaction(db, async (client) => {
      const block_result = await client.query<GuideBlockRow>(
        `
        UPDATE guide_schema.guide_block
        SET
          is_deleted = TRUE,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_by_id = $1,
          updated_by_id = $1,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
        WHERE id = $2
        AND guide_id = $3
        AND project_id = $4
        AND organization_id = $5
        AND is_deleted = FALSE
        RETURNING ${guide_block_select}
      `,
        [
          input.actor_org_user_id,
          input.guide_block_id,
          input.guide_id,
          input.project_id,
          input.organization_id,
        ],
      );

      if (block_result.rows.length === 0) {
        return false;
      }

      await client.query(
        `
        UPDATE guide_schema.guide_step
        SET
          is_deleted = TRUE,
          deleted_at = CURRENT_TIMESTAMP,
          deleted_by_id = $1,
          updated_by_id = $1,
          updated_at = CURRENT_TIMESTAMP,
          version = version + 1
        WHERE guide_block_id = $2
        AND guide_id = $3
        AND project_id = $4
        AND organization_id = $5
        AND is_deleted = FALSE
      `,
        [
          input.actor_org_user_id,
          input.guide_block_id,
          input.guide_id,
          input.project_id,
          input.organization_id,
        ],
      );

      const remaining_blocks = await read_guide_blocks(client, input);

      for (const [index, block] of remaining_blocks.entries()) {
        if (block.block_index === index + 1) {
          continue;
        }

        await client.query(
          `
          UPDATE guide_schema.guide_block
          SET
            block_index = $1,
            updated_by_id = $2,
            updated_at = CURRENT_TIMESTAMP,
            version = version + 1
          WHERE id = $3
          AND guide_id = $4
          AND project_id = $5
          AND organization_id = $6
          AND is_deleted = FALSE
        `,
          [
            index + 1,
            input.actor_org_user_id,
            block.id,
            input.guide_id,
            input.project_id,
            input.organization_id,
          ],
        );
      }

      await touch_guide(client, input);

      return true;
    });
  },
});
