import { ulid } from "ulid";
import {
  type CaptureAsset,
  type CaptureAssetFile,
  type CaptureAssetRepository,
  type CaptureAssetType,
  FileStorageKeyConflictError,
  type FileStorageProvider,
} from "./capture-asset.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};

type CaptureAssetRow = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  asset_type: CaptureAssetType;
  status: "active" | "archived";
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

type CaptureAssetFileRow = CaptureAssetRow & {
  file_storage_key: string;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

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
  status: row.status,
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

const capture_asset_select = `
  capture_asset.id,
  capture_asset.organization_id,
  capture_asset.project_id,
  capture_asset.capture_session_id,
  capture_asset.asset_type,
  capture_asset.status,
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

const capture_asset_file_select = `
  ${capture_asset_select},
  app_file.storage_key AS file_storage_key
`;

const is_storage_key_conflict = (error: unknown) => {
  const pg_error = error as { code?: string; constraint?: string };
  return (
    pg_error.code === "23505" &&
    pg_error.constraint === "uq_file_storage_key_active_per_org"
  );
};

export const build_capture_asset_transactional_repository = (
  db: Queryable,
) => ({
  async project_exists(input: { organization_id: string; project_id: string }) {
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

  async capture_session_exists(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) {
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

  async create_capture_asset(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: Parameters<CaptureAssetRepository["create_capture_asset"]>[0]["data"];
  }) {
    return this.create_uploaded_capture_asset({
      ...input,
      file_id: ulid(),
      capture_asset_id: ulid(),
    });
  },

  async create_uploaded_capture_asset(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    file_id: string;
    capture_asset_id: string;
    data: Parameters<
      CaptureAssetRepository["create_uploaded_capture_asset"]
    >[0]["data"];
  }) {
    try {
      const result = await db.query<CaptureAssetRow>(
        `
        WITH inserted_file AS (
          INSERT INTO file_schema.file (
            id,
            organization_id,
            storage_provider,
            storage_key,
            mime_type,
            size_bytes,
            original_name,
            checksum_sha256,
            metadata,
            created_by_id,
            updated_by_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
          RETURNING
            id,
            storage_provider,
            mime_type,
            size_bytes,
            original_name,
            checksum_sha256
        ),
        inserted_asset AS (
          INSERT INTO capture_schema.capture_asset (
            id,
            organization_id,
            project_id,
            capture_session_id,
            file_id,
            asset_type,
            width,
            height,
            device_pixel_ratio,
            page_url,
            page_title,
            captured_at,
            metadata,
            created_by_id,
            updated_by_id
          )
          SELECT
            $11,
            $2,
            $12,
            $13,
            inserted_file.id,
            $14,
            $15,
            $16,
            $17,
            $18,
            $19,
            COALESCE($20::timestamptz, CURRENT_TIMESTAMP),
            $21,
            $10,
            $10
          FROM inserted_file
          RETURNING
            id,
            organization_id,
            project_id,
            capture_session_id,
            asset_type,
            width,
            height,
            device_pixel_ratio,
            page_url,
            page_title,
            captured_at,
            created_by_id,
            updated_by_id,
            version,
            created_at,
            updated_at,
            file_id
        )
        SELECT
          inserted_asset.*,
          inserted_file.storage_provider AS file_storage_provider,
          inserted_file.mime_type AS file_mime_type,
          inserted_file.size_bytes AS file_size_bytes,
          inserted_file.original_name AS file_original_name,
          inserted_file.checksum_sha256 AS file_checksum_sha256
        FROM inserted_asset
        INNER JOIN inserted_file ON inserted_file.id = inserted_asset.file_id
      `,
        [
          input.file_id,
          input.organization_id,
          input.data.file.storage_provider,
          input.data.file.storage_key,
          input.data.file.mime_type,
          input.data.file.size_bytes,
          input.data.file.original_name ?? null,
          input.data.file.checksum_sha256 ?? null,
          input.data.file.metadata ?? null,
          input.actor_org_user_id,
          input.capture_asset_id,
          input.project_id,
          input.capture_session_id,
          input.data.asset_type,
          input.data.width ?? null,
          input.data.height ?? null,
          input.data.device_pixel_ratio ?? null,
          input.data.page_url ?? null,
          input.data.page_title ?? null,
          input.data.captured_at ?? null,
          input.data.metadata ?? null,
        ],
      );
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to create capture asset");
      }

      return map_capture_asset(row);
    } catch (error) {
      if (is_storage_key_conflict(error)) {
        throw new FileStorageKeyConflictError();
      }

      throw error;
    }
  },

  async list_capture_assets(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    asset_type?: CaptureAssetType;
    include_archived?: boolean;
  }) {
    const values: unknown[] = [
      input.capture_session_id,
      input.project_id,
      input.organization_id,
    ];
    const asset_type_filter = input.asset_type
      ? "AND capture_asset.asset_type = $4"
      : "";
    const lifecycle_filter = input.include_archived
      ? ""
      : "AND capture_asset.status = 'active'";

    if (input.asset_type) {
      values.push(input.asset_type);
    }

    const result = await db.query<CaptureAssetRow>(
      `
      SELECT ${capture_asset_select}
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      WHERE capture_asset.capture_session_id = $1
      AND capture_asset.project_id = $2
      AND capture_asset.organization_id = $3
      AND capture_asset.is_deleted = FALSE
      AND app_file.is_deleted = FALSE
      ${lifecycle_filter}
      ${asset_type_filter}
      ORDER BY capture_asset.created_at DESC, capture_asset.id DESC
    `,
      values,
    );

    return result.rows.map(map_capture_asset);
  },

  async list_project_capture_assets(input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    asset_type?: CaptureAssetType;
  }) {
    const values: unknown[] = [
      input.project_id,
      input.organization_id,
      input.project_version_id,
    ];
    const asset_type_filter = input.asset_type
      ? "AND capture_asset.asset_type = $4"
      : "";

    if (input.asset_type) {
      values.push(input.asset_type);
    }

    const result = await db.query<CaptureAssetRow>(
      `
      SELECT ${capture_asset_select}
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      INNER JOIN capture_schema.capture_session capture_session
        ON capture_session.id = capture_asset.capture_session_id
       AND capture_session.project_id = capture_asset.project_id
       AND capture_session.organization_id = capture_asset.organization_id
      WHERE capture_asset.project_id = $1
      AND capture_asset.organization_id = $2
      AND capture_session.project_version_id = $3
      AND capture_asset.is_deleted = FALSE
      AND app_file.is_deleted = FALSE
      AND capture_asset.status = 'active'
      ${asset_type_filter}
      ORDER BY capture_asset.captured_at ASC, capture_asset.created_at ASC, capture_asset.id ASC
    `,
      values,
    );

    return result.rows.map(map_capture_asset);
  },

  async find_capture_asset(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) {
    const result = await db.query<CaptureAssetRow>(
      `
      SELECT ${capture_asset_select}
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      WHERE capture_asset.id = $1
      AND capture_asset.capture_session_id = $2
      AND capture_asset.project_id = $3
      AND capture_asset.organization_id = $4
      AND capture_asset.is_deleted = FALSE
      AND app_file.is_deleted = FALSE
      LIMIT 1
    `,
      [
        input.capture_asset_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );
    const row = first_row(result);

    return row ? map_capture_asset(row) : null;
  },

  async find_capture_asset_file(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }): Promise<CaptureAssetFile | null> {
    const result = await db.query<CaptureAssetFileRow>(
      `
      SELECT ${capture_asset_file_select}
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      WHERE capture_asset.id = $1
      AND capture_asset.capture_session_id = $2
      AND capture_asset.project_id = $3
      AND capture_asset.organization_id = $4
      AND capture_asset.is_deleted = FALSE
      AND app_file.is_deleted = FALSE
      LIMIT 1
    `,
      [
        input.capture_asset_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );
    const row = first_row(result);

    if (!row) {
      return null;
    }

    return {
      capture_asset: map_capture_asset(row),
      file: {
        id: row.file_id,
        storage_provider: row.file_storage_provider,
        storage_key: row.file_storage_key,
        mime_type: row.file_mime_type,
        size_bytes: Number(row.file_size_bytes),
      },
    };
  },

  async transition_capture_asset(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
    actor_org_user_id: string;
    expected_asset_version: number;
    status: "active" | "archived";
  }) {
    const asset_result = await db.query<CaptureAssetRow>(
      `
      UPDATE capture_schema.capture_asset
      SET
        status = $1,
        updated_by_id = $2,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      FROM file_schema.file app_file
      WHERE capture_asset.id = $4
      AND capture_asset.capture_session_id = $5
      AND capture_asset.project_id = $6
      AND capture_asset.organization_id = $7
      AND capture_asset.is_deleted = FALSE
      AND capture_asset.version = $3
      AND app_file.id=capture_asset.file_id AND app_file.is_deleted=FALSE
      RETURNING ${capture_asset_select}
    `,
      [
        input.status,
        input.actor_org_user_id,
        input.expected_asset_version,
        input.capture_asset_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );
    const row = asset_result.rows[0];
    return row ? map_capture_asset(row) : null;
  },

  async get_capture_asset_protection(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) {
    const asset = (
      await db.query<{
        status: "active" | "archived";
        file_id: string;
        purge_operation_status: "pending" | "failed" | "completed" | null;
      }>(
        `
      SELECT asset.status,asset.file_id,operation.status AS purge_operation_status
      FROM capture_schema.capture_asset asset LEFT JOIN capture_schema.capture_asset_purge_operation operation
        ON operation.capture_asset_id=asset.id
      WHERE asset.id=$1 AND asset.capture_session_id=$2 AND asset.project_id=$3 AND asset.organization_id=$4
        AND asset.is_deleted=FALSE`,
        [
          input.capture_asset_id,
          input.capture_session_id,
          input.project_id,
          input.organization_id,
        ],
      )
    ).rows[0];
    if (!asset) return null;
    const dependencies = (
      await db.query<Record<string, unknown>>(
        `
      SELECT 'guide_working_draft' dependency_type,edition.guide_id artifact_id,edition.id edition_id,NULL::int revision_number,
        NULL::varchar published_artifact_id,NULL::int publication_number,NULL::varchar capture_asset_id
      FROM guide_schema.guide_step step JOIN guide_schema.guide_working_draft draft ON draft.id=step.guide_working_draft_id
      JOIN guide_schema.guide_edition edition ON edition.id=draft.guide_edition_id
      WHERE step.project_id=$1 AND step.organization_id=$2 AND step.is_deleted=FALSE AND ($3 IN (step.source_capture_asset_id,step.selected_capture_asset_id))
      UNION ALL SELECT 'interactive_demo_working_draft',edition.interactive_demo_id,edition.id,NULL,NULL,NULL,NULL
      FROM interactive_demo_schema.demo_scene scene JOIN interactive_demo_schema.interactive_demo_working_draft draft ON draft.id=scene.interactive_demo_working_draft_id
      JOIN interactive_demo_schema.interactive_demo_edition edition ON edition.id=draft.interactive_demo_edition_id
      WHERE scene.project_id=$1 AND scene.organization_id=$2 AND scene.is_deleted=FALSE AND ($3 IN (scene.source_capture_asset_id,scene.background_capture_asset_id))
      UNION ALL SELECT 'guide_revision',revision.guide_id,revision.guide_edition_id,revision.revision_number,NULL,NULL,NULL
      FROM guide_schema.guide_revision_step step JOIN guide_schema.guide_revision revision ON revision.id=step.guide_revision_id
      WHERE step.project_id=$1 AND step.organization_id=$2 AND ($3 IN (step.source_capture_asset_id,step.selected_capture_asset_id))
      UNION ALL SELECT 'interactive_demo_revision',revision.interactive_demo_id,revision.interactive_demo_edition_id,revision.revision_number,NULL,NULL,NULL
      FROM interactive_demo_schema.demo_revision_scene scene JOIN interactive_demo_schema.interactive_demo_revision revision ON revision.id=scene.interactive_demo_revision_id
      WHERE scene.project_id=$1 AND scene.organization_id=$2 AND ($3 IN (scene.source_capture_asset_id,scene.background_capture_asset_id))
      UNION ALL SELECT 'published_artifact',NULL,NULL,NULL,published.id,published.version_number,NULL
      FROM publish_schema.published_artifact_capture_asset projection JOIN publish_schema.published_artifact published ON published.id=projection.published_artifact_id
      WHERE projection.project_id=$1 AND projection.organization_id=$2 AND projection.capture_asset_id=$3
      UNION ALL SELECT 'shared_file_asset',NULL,NULL,NULL,NULL,NULL,other.id
      FROM capture_schema.capture_asset other WHERE other.project_id=$1 AND other.organization_id=$2 AND other.file_id=$4
        AND other.id<>$3 AND other.is_deleted=FALSE`,
        [
          input.project_id,
          input.organization_id,
          input.capture_asset_id,
          asset.file_id,
        ],
      )
    ).rows;
    const safe = dependencies
      .slice(0, 100)
      .map((row) =>
        Object.fromEntries(
          Object.entries(row).filter(([, value]) => value !== null),
        ),
      );
    return {
      capture_asset_id: input.capture_asset_id,
      status: asset.status,
      purge_operation_status: asset.purge_operation_status,
      can_purge:
        asset.status === "archived" &&
        asset.purge_operation_status !== "completed" &&
        dependencies.length === 0,
      total_dependency_count: dependencies.length,
      dependencies: safe,
    } as never;
  },

  async find_completed_capture_asset_purge(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) {
    const row = (
      await db.query<{
        id: string;
        status: "completed";
        attempt_count: number;
      }>(
        `
      SELECT operation.id,operation.status,operation.attempt_count
      FROM capture_schema.capture_asset_purge_operation operation
      JOIN capture_schema.capture_asset asset ON asset.id=operation.capture_asset_id
      WHERE operation.capture_asset_id=$1 AND operation.project_id=$2 AND operation.organization_id=$3
        AND asset.capture_session_id=$4 AND operation.status='completed'`,
        [
          input.capture_asset_id,
          input.project_id,
          input.organization_id,
          input.capture_session_id,
        ],
      )
    ).rows[0];
    return row
      ? {
          capture_asset_id: input.capture_asset_id,
          purge_operation_id: row.id,
          status: row.status,
          attempt_count: row.attempt_count,
        }
      : null;
  },

  async begin_capture_asset_purge(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
    actor_org_user_id: string;
    expected_asset_version: number;
  }) {
    const completed = (
      await db.query<{
        id: string;
        status: "completed";
        attempt_count: number;
      }>(
        `
      SELECT operation.id,operation.status,operation.attempt_count
      FROM capture_schema.capture_asset_purge_operation operation
      JOIN capture_schema.capture_asset asset ON asset.id=operation.capture_asset_id
      WHERE operation.capture_asset_id=$1 AND operation.project_id=$2 AND operation.organization_id=$3
        AND asset.capture_session_id=$4 AND operation.status='completed'
      FOR UPDATE OF operation`,
        [
          input.capture_asset_id,
          input.project_id,
          input.organization_id,
          input.capture_session_id,
        ],
      )
    ).rows[0];
    if (completed)
      return {
        operation: {
          capture_asset_id: input.capture_asset_id,
          purge_operation_id: completed.id,
          status: completed.status,
          attempt_count: completed.attempt_count,
        },
        storage_key: "",
        completed: true,
      };
    const asset = (
      await db.query<{
        file_id: string;
        storage_key: string;
        status: "active" | "archived";
        version: number;
      }>(
        `
      SELECT asset.file_id,file_record.storage_key,asset.status,asset.version FROM capture_schema.capture_asset asset
      JOIN file_schema.file file_record ON file_record.id=asset.file_id
      WHERE asset.id=$1 AND asset.capture_session_id=$2 AND asset.project_id=$3 AND asset.organization_id=$4
        AND asset.is_deleted=FALSE AND file_record.is_deleted=FALSE FOR UPDATE OF asset,file_record`,
        [
          input.capture_asset_id,
          input.capture_session_id,
          input.project_id,
          input.organization_id,
        ],
      )
    ).rows[0];
    if (!asset) return null;
    const existing = (
      await db.query<{
        id: string;
        status: "pending" | "failed" | "completed";
        attempt_count: number;
      }>(
        `
      SELECT id,status,attempt_count FROM capture_schema.capture_asset_purge_operation WHERE capture_asset_id=$1 FOR UPDATE`,
        [input.capture_asset_id],
      )
    ).rows[0];
    if (
      asset.status !== "archived" ||
      asset.version !== input.expected_asset_version
    )
      return null;
    let operation = existing;
    if (existing?.status === "failed")
      operation = (
        await db.query<typeof existing>(
          `UPDATE capture_schema.capture_asset_purge_operation
      SET status='pending',failure_code=NULL,attempt_count=attempt_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=$1
      RETURNING id,status,attempt_count`,
          [existing.id],
        )
      ).rows[0];
    if (!operation)
      operation = (
        await db.query<typeof existing>(
          `INSERT INTO capture_schema.capture_asset_purge_operation
      (id,organization_id,project_id,capture_asset_id,status,requested_by_id) VALUES($1,$2,$3,$4,'pending',$5)
      RETURNING id,status,attempt_count`,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            input.capture_asset_id,
            input.actor_org_user_id,
          ],
        )
      ).rows[0];
    return {
      operation: {
        capture_asset_id: input.capture_asset_id,
        purge_operation_id: operation!.id,
        status: operation!.status,
        attempt_count: operation!.attempt_count,
      },
      storage_key: asset.storage_key,
      completed: false,
    };
  },

  async fail_capture_asset_purge(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
    operation_id: string;
    failure_code: string;
    actor_org_user_id: string;
  }) {
    const row = (
      await db.query<{ id: string; status: "failed"; attempt_count: number }>(
        `UPDATE capture_schema.capture_asset_purge_operation
      SET status='failed',failure_code=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND capture_asset_id=$3 AND project_id=$4
        AND organization_id=$5 AND status='pending' RETURNING id,status,attempt_count`,
        [
          input.failure_code,
          input.operation_id,
          input.capture_asset_id,
          input.project_id,
          input.organization_id,
        ],
      )
    ).rows[0]!;
    return {
      capture_asset_id: input.capture_asset_id,
      purge_operation_id: row.id,
      status: row.status,
      attempt_count: row.attempt_count,
    };
  },

  async complete_capture_asset_purge(input: {
    organization_id: string;
    project_id: string;
    capture_asset_id: string;
    operation_id: string;
    actor_org_user_id: string;
  }) {
    const locked_asset = (
      await db.query<{ file_id: string }>(
        `
      SELECT asset.file_id FROM capture_schema.capture_asset asset
      JOIN file_schema.file file_record ON file_record.id=asset.file_id
      WHERE asset.id=$1 AND asset.project_id=$2 AND asset.organization_id=$3
      FOR UPDATE OF asset,file_record`,
        [input.capture_asset_id, input.project_id, input.organization_id],
      )
    ).rows[0];
    if (!locked_asset)
      throw new Error("Capture Asset purge target was not found");
    const operation = (
      await db.query<{
        id: string;
        status: "pending" | "failed" | "completed";
        attempt_count: number;
      }>(
        `
      SELECT id,status,attempt_count FROM capture_schema.capture_asset_purge_operation
      WHERE id=$1 AND capture_asset_id=$2 AND project_id=$3 AND organization_id=$4 FOR UPDATE`,
        [
          input.operation_id,
          input.capture_asset_id,
          input.project_id,
          input.organization_id,
        ],
      )
    ).rows[0];
    if (!operation)
      throw new Error("Capture Asset purge operation was not found");
    if (operation.status === "completed")
      return {
        capture_asset_id: input.capture_asset_id,
        purge_operation_id: operation.id,
        status: operation.status,
        attempt_count: operation.attempt_count,
      };
    if (operation.status !== "pending")
      throw new Error("Capture Asset purge operation is not pending");
    const asset = (
      await db.query<{ file_id: string }>(
        `UPDATE capture_schema.capture_asset SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,
      deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$2 AND project_id=$3
      AND organization_id=$4 AND is_deleted=FALSE RETURNING file_id`,
        [
          input.actor_org_user_id,
          input.capture_asset_id,
          input.project_id,
          input.organization_id,
        ],
      )
    ).rows[0];
    if (!asset)
      throw new Error(
        "Capture Asset purge completion lost its active tombstone target",
      );
    await db.query(
      `UPDATE file_schema.file SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,
      updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$2 AND organization_id=$3 AND is_deleted=FALSE`,
      [input.actor_org_user_id, locked_asset.file_id, input.organization_id],
    );
    const row = (
      await db.query<{
        id: string;
        status: "completed";
        attempt_count: number;
      }>(
        `UPDATE capture_schema.capture_asset_purge_operation
      SET status='completed',failure_code=NULL,completed_by_id=$1,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      WHERE id=$2 AND capture_asset_id=$3 AND project_id=$4 AND organization_id=$5 AND status='pending' RETURNING id,status,attempt_count`,
        [
          input.actor_org_user_id,
          input.operation_id,
          input.capture_asset_id,
          input.project_id,
          input.organization_id,
        ],
      )
    ).rows[0];
    if (!row)
      throw new Error(
        "Capture Asset purge completion did not update its operation",
      );
    return {
      capture_asset_id: input.capture_asset_id,
      purge_operation_id: row.id,
      status: row.status,
      attempt_count: row.attempt_count,
    };
  },
});

export const build_uncovered_capture_asset_repository = (
  pool: Queryable & {
    connect: () => Promise<Queryable & { release: () => void }>;
  },
): CaptureAssetRepository => ({
  ...build_capture_asset_transactional_repository(pool),

  async transaction(callback) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(
        build_capture_asset_transactional_repository(client),
      );
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
});
