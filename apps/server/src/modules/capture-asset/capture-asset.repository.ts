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
  }) {
    const values: unknown[] = [
      input.capture_session_id,
      input.project_id,
      input.organization_id,
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
      WHERE capture_asset.capture_session_id = $1
      AND capture_asset.project_id = $2
      AND capture_asset.organization_id = $3
      AND capture_asset.is_deleted = FALSE
      AND app_file.is_deleted = FALSE
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
    asset_type?: CaptureAssetType;
  }) {
    const values: unknown[] = [input.project_id, input.organization_id];
    const asset_type_filter = input.asset_type
      ? "AND capture_asset.asset_type = $3"
      : "";

    if (input.asset_type) {
      values.push(input.asset_type);
    }

    const result = await db.query<CaptureAssetRow>(
      `
      SELECT ${capture_asset_select}
      FROM capture_schema.capture_asset capture_asset
      INNER JOIN file_schema.file app_file ON app_file.id = capture_asset.file_id
      WHERE capture_asset.project_id = $1
      AND capture_asset.organization_id = $2
      AND capture_asset.is_deleted = FALSE
      AND app_file.is_deleted = FALSE
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

  async delete_capture_asset(input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
    actor_org_user_id: string;
  }) {
    const asset_result = await db.query<{ file_id: string }>(
      `
      UPDATE capture_schema.capture_asset
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
      RETURNING file_id
    `,
      [
        input.actor_org_user_id,
        input.capture_asset_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );
    const file_id = asset_result.rows[0]?.file_id;

    if (!file_id) {
      return false;
    }

    await db.query(
      `
      UPDATE file_schema.file
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
    `,
      [input.actor_org_user_id, file_id, input.organization_id],
    );

    return true;
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
