import { ulid } from "ulid";
import {
  GuideEditionConflictError,
  GuideWorkingDraftConflictError,
} from "@repo/guide-domain";
import type {
  Guide,
  GuideAnnotation,
  GuideArtifact,
  GuideBlock,
  GuideDetail,
  GuideExportAssetFile,
  GuideRepository,
  GuideSourceCaptureAsset,
  GuideSourceEventType,
  GuideStep,
  GuideSummary,
  GuideWorkingDraft,
} from "./guide.service";

type QueryResult<Row> = { rows: Row[] };
type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};
type Client = Queryable & { release: () => void };
type Database = Queryable & { connect?: () => Promise<Client> };
type DateRow<T> = Omit<T, "created_at" | "updated_at"> & {
  created_at: Date;
  updated_at: Date;
};
type ArtifactRow = Omit<GuideArtifact, "created_at"> & { created_at: Date };
type EditionRow = DateRow<Guide>;
type DraftRow = DateRow<GuideWorkingDraft>;
type BlockRow = DateRow<Omit<GuideBlock, "step">>;
type StepRow = DateRow<
  Omit<GuideStep, "annotations" | "display_capture_asset_id">
>;
type AnnotationRow = DateRow<GuideAnnotation>;

const first = <T>(result: QueryResult<T>) => result.rows[0] ?? null;
const iso = <T extends { created_at: Date; updated_at: Date }>(row: T) => ({
  ...row,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});
const map_edition = (row: EditionRow): Guide => iso(row);
const map_draft = (row: DraftRow): GuideWorkingDraft => iso(row);
const map_annotation = (row: AnnotationRow): GuideAnnotation => iso(row);
const with_transaction = async <T>(
  db: Database,
  work: (client: Queryable) => Promise<T>,
) => {
  if (!db.connect || "release" in db) return work(db);
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

const edition_select = `id, organization_id, project_id, guide_id, project_version_id,
  source_capture_session_id, title, description, status, created_by_id, updated_by_id,
  version, created_at, updated_at`;
const draft_select = `id, organization_id, project_id, guide_edition_id, created_by_id,
  updated_by_id, version, created_at, updated_at`;
const block_select = `id, organization_id, project_id, guide_working_draft_id, block_type,
  title, body, block_index, created_by_id, updated_by_id, version, created_at, updated_at`;
const step_select = `id, organization_id, project_id, guide_working_draft_id, guide_block_id,
  source_capture_session_id, source_capture_event_id, source_capture_asset_id,
  selected_capture_asset_id, screenshot_hidden, title, body, created_by_id, updated_by_id,
  version, created_at, updated_at`;
const annotation_select = `id, organization_id, project_id, guide_working_draft_id,
  guide_step_id, annotation_type, annotation_index, x::float8 AS x, y::float8 AS y,
  width::float8 AS width, height::float8 AS height, created_by_id, updated_by_id,
  version, created_at, updated_at`;

const read_blocks = async (
  db: Queryable,
  draft_id: string,
  project_id: string,
  organization_id: string,
) => {
  const blocks = await db.query<BlockRow>(
    `SELECT ${block_select} FROM guide_schema.guide_block WHERE guide_working_draft_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE ORDER BY block_index,id`,
    [draft_id, project_id, organization_id],
  );
  const steps = await db.query<StepRow>(
    `SELECT ${step_select} FROM guide_schema.guide_step WHERE guide_working_draft_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE ORDER BY created_at,id`,
    [draft_id, project_id, organization_id],
  );
  const annotations = await db.query<AnnotationRow>(
    `SELECT ${annotation_select} FROM guide_schema.guide_annotation WHERE guide_working_draft_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE ORDER BY annotation_index,id`,
    [draft_id, project_id, organization_id],
  );
  const annotations_by_step = new Map<string, GuideAnnotation[]>();
  for (const row of annotations.rows) {
    const values = annotations_by_step.get(row.guide_step_id) ?? [];
    values.push(map_annotation(row));
    annotations_by_step.set(row.guide_step_id, values);
  }
  const steps_by_block = new Map(
    steps.rows.map((row) => [
      row.guide_block_id,
      {
        ...iso(row),
        display_capture_asset_id: row.screenshot_hidden
          ? null
          : (row.selected_capture_asset_id ?? row.source_capture_asset_id),
        annotations: annotations_by_step.get(row.id) ?? [],
      } satisfies GuideStep,
    ]),
  );
  return blocks.rows.map(
    (row) =>
      ({
        ...iso(row),
        step: steps_by_block.get(row.id) ?? null,
      }) satisfies GuideBlock,
  );
};

type AssetRow = {
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
const read_assets = async (
  db: Queryable,
  ids: string[],
  project_id: string,
  organization_id: string,
) => {
  if (!ids.length) return [];
  const result = await db.query<AssetRow>(
    `SELECT a.id,a.project_id,a.capture_session_id,a.asset_type,a.width,a.height,a.device_pixel_ratio,a.page_url,a.page_title,a.captured_at,f.id file_id,f.original_name,f.mime_type,f.size_bytes FROM capture_schema.capture_asset a JOIN file_schema.file f ON f.id=a.file_id WHERE a.id=ANY($1::varchar[]) AND a.project_id=$2 AND a.organization_id=$3 AND a.is_deleted=FALSE AND f.is_deleted=FALSE`,
    [ids, project_id, organization_id],
  );
  const mapped = new Map(
    result.rows.map((row) => [
      row.id,
      {
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
      } satisfies GuideSourceCaptureAsset,
    ]),
  );
  return ids
    .map((id) => mapped.get(id))
    .filter((value): value is GuideSourceCaptureAsset => Boolean(value));
};

const read_detail = async (
  db: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
  },
) => {
  const result = await db.query<
    ArtifactRow &
      EditionRow &
      DraftRow & {
        artifact_created_at: Date;
        edition_created_at: Date;
        edition_updated_at: Date;
        draft_created_at: Date;
        draft_updated_at: Date;
        artifact_created_by_id: string;
        edition_id: string;
        draft_id: string;
        edition_created_by_id: string;
        edition_updated_by_id: string;
        draft_created_by_id: string;
        draft_updated_by_id: string;
        edition_version: number;
        draft_version: number;
      }
  >(
    `
    SELECT g.id,g.organization_id,g.project_id,g.created_by_id artifact_created_by_id,g.created_at artifact_created_at,
      e.id edition_id,e.guide_id,e.project_version_id,e.source_capture_session_id,e.title,e.description,e.status,
      e.created_by_id edition_created_by_id,e.updated_by_id edition_updated_by_id,e.version edition_version,e.created_at edition_created_at,e.updated_at edition_updated_at,
      d.id draft_id,d.created_by_id draft_created_by_id,d.updated_by_id draft_updated_by_id,d.version draft_version,d.created_at draft_created_at,d.updated_at draft_updated_at
    FROM guide_schema.guide g JOIN guide_schema.guide_edition e ON e.guide_id=g.id
    JOIN guide_schema.guide_working_draft d ON d.guide_edition_id=e.id
    WHERE g.id=$1 AND g.project_id=$2 AND g.organization_id=$3 AND e.project_version_id=$4`,
    [
      input.guide_id,
      input.project_id,
      input.organization_id,
      input.project_version_id,
    ],
  );
  const row = first(result);
  if (!row) return null;
  const artifact: GuideArtifact = {
    id: row.id,
    organization_id: row.organization_id,
    project_id: row.project_id,
    created_by_id: row.artifact_created_by_id,
    created_at: row.artifact_created_at.toISOString(),
  };
  const edition: Guide = {
    id: row.edition_id,
    organization_id: row.organization_id,
    project_id: row.project_id,
    guide_id: row.guide_id,
    project_version_id: row.project_version_id,
    source_capture_session_id: row.source_capture_session_id,
    title: row.title,
    description: row.description,
    status: row.status,
    created_by_id: row.edition_created_by_id,
    updated_by_id: row.edition_updated_by_id,
    version: row.edition_version,
    created_at: row.edition_created_at.toISOString(),
    updated_at: row.edition_updated_at.toISOString(),
  };
  const working_draft: GuideWorkingDraft = {
    id: row.draft_id,
    organization_id: row.organization_id,
    project_id: row.project_id,
    guide_edition_id: row.edition_id,
    created_by_id: row.draft_created_by_id,
    updated_by_id: row.draft_updated_by_id,
    version: row.draft_version,
    created_at: row.draft_created_at.toISOString(),
    updated_at: row.draft_updated_at.toISOString(),
  };
  const guide_blocks = await read_blocks(
    db,
    working_draft.id,
    input.project_id,
    input.organization_id,
  );
  const asset_ids = [
    ...new Set(
      guide_blocks.flatMap((block) =>
        block.step?.display_capture_asset_id
          ? [block.step.display_capture_asset_id]
          : [],
      ),
    ),
  ];
  return {
    artifact,
    edition,
    working_draft,
    authored_updated_at:
      edition.updated_at > working_draft.updated_at
        ? edition.updated_at
        : working_draft.updated_at,
    guide_blocks,
    source_capture_assets: await read_assets(
      db,
      asset_ids,
      input.project_id,
      input.organization_id,
    ),
  } satisfies GuideDetail;
};

const advance_draft = async (
  db: Queryable,
  draft_id: string,
  expected: number,
  actor_id: string,
) => {
  const row = first(
    await db.query<DraftRow>(
      `UPDATE guide_schema.guide_working_draft SET updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$2 AND version=$3 RETURNING ${draft_select}`,
      [actor_id, draft_id, expected],
    ),
  );
  if (!row) throw new GuideWorkingDraftConflictError();
  return map_draft(row);
};
const resolve_draft = async (
  db: Queryable,
  input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
  },
) =>
  first(
    await db.query<DraftRow>(
      `SELECT d.id, d.organization_id, d.project_id, d.guide_edition_id, d.created_by_id, d.updated_by_id, d.version, d.created_at, d.updated_at FROM guide_schema.guide_working_draft d JOIN guide_schema.guide_edition e ON e.id=d.guide_edition_id WHERE e.guide_id=$1 AND e.project_version_id=$2 AND e.project_id=$3 AND e.organization_id=$4`,
      [
        input.guide_id,
        input.project_version_id,
        input.project_id,
        input.organization_id,
      ],
    ),
  );

export const build_guide_repository = (db: Database): GuideRepository => ({
  async project_exists(input) {
    return Boolean(
      first(
        await db.query(
          `SELECT 1 FROM project_schema.project WHERE id=$1 AND organization_id=$2`,
          [input.project_id, input.organization_id],
        ),
      ),
    );
  },
  async capture_session_exists(input) {
    return Boolean(
      first(
        await db.query(
          `SELECT 1 FROM capture_schema.capture_session WHERE id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE`,
          [input.capture_session_id, input.project_id, input.organization_id],
        ),
      ),
    );
  },
  async list_source_capture_events(input) {
    const result = await db.query<{
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
    }>(
      `SELECT id,event_type,event_index,capture_asset_id,page_url,page_title,target_label,target_role,target_text,note FROM capture_schema.capture_event WHERE capture_session_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE AND ($4::varchar[] IS NULL OR id=ANY($4)) ORDER BY event_index,id`,
      [
        input.capture_session_id,
        input.project_id,
        input.organization_id,
        input.selected_capture_event_ids ?? null,
      ],
    );
    return result.rows;
  },
  async list_active_capture_asset_ids(input) {
    if (!input.capture_asset_ids.length) return [];
    return (
      await db.query<{ id: string }>(
        `SELECT id FROM capture_schema.capture_asset WHERE id=ANY($1::varchar[]) AND capture_session_id=$2 AND project_id=$3 AND organization_id=$4 AND is_deleted=FALSE`,
        [
          input.capture_asset_ids,
          input.capture_session_id,
          input.project_id,
          input.organization_id,
        ],
      )
    ).rows.map((r) => r.id);
  },
  async active_screenshot_asset_exists(input) {
    return Boolean(
      first(
        await db.query(
          `SELECT 1 FROM capture_schema.capture_asset WHERE id=$1 AND project_id=$2 AND organization_id=$3 AND asset_type='screenshot' AND is_deleted=FALSE`,
          [input.capture_asset_id, input.project_id, input.organization_id],
        ),
      ),
    );
  },
  async create_guide_from_capture(input) {
    return with_transaction(db, async (client) => {
      const session = first(
        await client.query<{ project_version_id: string }>(
          `SELECT project_version_id FROM capture_schema.capture_session WHERE id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE FOR SHARE`,
          [input.capture_session_id, input.project_id, input.organization_id],
        ),
      );
      if (!session) throw new Error("capture session disappeared");
      const guide_id = ulid(),
        edition_id = ulid(),
        draft_id = ulid();
      await client.query(
        `INSERT INTO guide_schema.guide(id,organization_id,project_id,created_by_id) VALUES($1,$2,$3,$4)`,
        [
          guide_id,
          input.organization_id,
          input.project_id,
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO guide_schema.guide_edition(id,organization_id,project_id,guide_id,project_version_id,source_capture_session_id,title,description,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
        [
          edition_id,
          input.organization_id,
          input.project_id,
          guide_id,
          session.project_version_id,
          input.capture_session_id,
          input.data.title,
          input.data.description,
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO guide_schema.guide_working_draft(id,organization_id,project_id,guide_edition_id,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$5)`,
        [
          draft_id,
          input.organization_id,
          input.project_id,
          edition_id,
          input.actor_org_user_id,
        ],
      );
      for (const block of input.data.blocks) {
        const block_id = ulid(),
          step_id = ulid();
        await client.query(
          `INSERT INTO guide_schema.guide_block(id,organization_id,project_id,guide_working_draft_id,block_type,block_index,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$7)`,
          [
            block_id,
            input.organization_id,
            input.project_id,
            draft_id,
            block.block_type,
            block.block_index,
            input.actor_org_user_id,
          ],
        );
        await client.query(
          `INSERT INTO guide_schema.guide_step(id,organization_id,project_id,guide_working_draft_id,guide_block_id,source_capture_session_id,source_capture_event_id,source_capture_asset_id,title,body,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
          [
            step_id,
            input.organization_id,
            input.project_id,
            draft_id,
            block_id,
            input.capture_session_id,
            block.source_capture_event_id,
            block.source_capture_asset_id,
            block.step.title,
            block.step.body,
            input.actor_org_user_id,
          ],
        );
      }
      return (await read_detail(client, {
        ...input,
        guide_id,
        project_version_id: session.project_version_id,
      }))!;
    });
  },
  async list_guides(input) {
    const result = await db.query<
      {
        artifact_id: string;
        artifact_created_by_id: string;
        artifact_created_at: Date;
      } & EditionRow & { authored_updated_at: Date }
    >(
      `SELECT g.id artifact_id,g.created_by_id artifact_created_by_id,g.created_at artifact_created_at,e.*,GREATEST(e.updated_at,d.updated_at) authored_updated_at FROM guide_schema.guide g JOIN guide_schema.guide_edition e ON e.guide_id=g.id JOIN guide_schema.guide_working_draft d ON d.guide_edition_id=e.id WHERE g.project_id=$1 AND g.organization_id=$2 AND e.project_version_id=$3 ORDER BY authored_updated_at DESC,e.id DESC`,
      [input.project_id, input.organization_id, input.project_version_id],
    );
    return result.rows.map(
      (row) =>
        ({
          artifact: {
            id: row.artifact_id,
            organization_id: row.organization_id,
            project_id: row.project_id,
            created_by_id: row.artifact_created_by_id,
            created_at: row.artifact_created_at.toISOString(),
          },
          edition: map_edition(row),
          authored_updated_at: row.authored_updated_at.toISOString(),
        }) satisfies GuideSummary,
    );
  },
  find_guide_detail(input) {
    return read_detail(db, input);
  },
  async update_guide(input) {
    const row = first(
      await db.query<EditionRow>(
        `UPDATE guide_schema.guide_edition SET title=COALESCE($1,title),description=CASE WHEN $2 THEN $3 ELSE description END,updated_by_id=$4,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE guide_id=$5 AND project_version_id=$6 AND project_id=$7 AND organization_id=$8 AND version=$9 AND status='draft' RETURNING ${edition_select}`,
        [
          input.data.title ?? null,
          "description" in input.data,
          input.data.description ?? null,
          input.actor_org_user_id,
          input.guide_id,
          input.project_version_id,
          input.project_id,
          input.organization_id,
          input.expected_edition_version,
        ],
      ),
    );
    if (!row) throw new GuideEditionConflictError();
    return map_edition(row);
  },
  async update_guide_status(input) {
    const row = first(
      await db.query<EditionRow>(
        `UPDATE guide_schema.guide_edition SET status=$1,updated_by_id=$2,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE guide_id=$3 AND project_version_id=$4 AND project_id=$5 AND organization_id=$6 AND version=$7 AND status<>$1 RETURNING ${edition_select}`,
        [
          input.status,
          input.actor_org_user_id,
          input.guide_id,
          input.project_version_id,
          input.project_id,
          input.organization_id,
          input.expected_edition_version,
        ],
      ),
    );
    if (!row) throw new GuideEditionConflictError();
    return map_edition(row);
  },
  async find_guide_step(input) {
    const draft = await resolve_draft(db, input);
    if (!draft) return null;
    return (
      (await read_blocks(db, draft.id, input.project_id, input.organization_id))
        .map((b) => b.step)
        .find((s) => s?.id === input.guide_step_id) ?? null
    );
  },
  async update_guide_step(input) {
    return with_transaction(db, async (client) => {
      const draft = await resolve_draft(client, input);
      if (!draft) throw new GuideWorkingDraftConflictError();
      const row = first(
        await client.query<StepRow>(
          `UPDATE guide_schema.guide_step SET title=COALESCE($1,title),body=CASE WHEN $2 THEN $3 ELSE body END,updated_by_id=$4,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$5 AND guide_working_draft_id=$6 AND is_deleted=FALSE RETURNING ${step_select}`,
          [
            input.data.title ?? null,
            "body" in input.data,
            input.data.body ?? null,
            input.actor_org_user_id,
            input.guide_step_id,
            draft.id,
          ],
        ),
      );
      if (!row) throw new GuideWorkingDraftConflictError();
      const working_draft = await advance_draft(
        client,
        draft.id,
        input.expected_working_draft_version,
        input.actor_org_user_id,
      );
      const block = (
        await read_blocks(
          client,
          draft.id,
          input.project_id,
          input.organization_id,
        )
      ).find((b) => b.id === row.guide_block_id)!;
      return { guide_step: block.step!, working_draft };
    });
  },
  async list_guide_blocks(input) {
    const draft = await resolve_draft(db, input);
    return draft
      ? read_blocks(db, draft.id, input.project_id, input.organization_id)
      : [];
  },
  async reorder_guide_blocks(input) {
    return with_transaction(db, async (client) => {
      const draft = await resolve_draft(client, input);
      if (!draft) throw new GuideWorkingDraftConflictError();
      for (let i = 0; i < input.block_ids.length; i++)
        await client.query(
          `UPDATE guide_schema.guide_block SET block_index=$1,updated_by_id=$2,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$3 AND guide_working_draft_id=$4 AND is_deleted=FALSE`,
          [
            1000000 + i + 1,
            input.actor_org_user_id,
            input.block_ids[i],
            draft.id,
          ],
        );
      for (let i = 0; i < input.block_ids.length; i++)
        await client.query(
          `UPDATE guide_schema.guide_block SET block_index=$1 WHERE id=$2 AND guide_working_draft_id=$3`,
          [i + 1, input.block_ids[i], draft.id],
        );
      const working_draft = await advance_draft(
        client,
        draft.id,
        input.expected_working_draft_version,
        input.actor_org_user_id,
      );
      return {
        guide_blocks: await read_blocks(
          client,
          draft.id,
          input.project_id,
          input.organization_id,
        ),
        working_draft,
      };
    });
  },
  async create_guide_block(input) {
    return with_transaction(db, async (client) => {
      const draft = await resolve_draft(client, input);
      if (!draft) throw new GuideWorkingDraftConflictError();
      const current = await read_blocks(
        client,
        draft.id,
        input.project_id,
        input.organization_id,
      );
      let index = current.length + 1;
      if (input.data.position) {
        const target = current.find(
          (b) => b.id === input.data.position!.guide_block_id,
        )!;
        index =
          input.data.position.placement === "before"
            ? target.block_index
            : target.block_index + 1;
        await client.query(
          `UPDATE guide_schema.guide_block SET block_index=block_index+1000000,updated_by_id=$3,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE guide_working_draft_id=$1 AND block_index >= $2 AND is_deleted=FALSE`,
          [draft.id, index, input.actor_org_user_id],
        );
        await client.query(
          `UPDATE guide_schema.guide_block SET block_index=block_index-999999 WHERE guide_working_draft_id=$1 AND block_index >= $2 AND is_deleted=FALSE`,
          [draft.id, 1000000 + index],
        );
      }
      const block_id = ulid();
      await client.query(
        `INSERT INTO guide_schema.guide_block(id,organization_id,project_id,guide_working_draft_id,block_type,title,body,block_index,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
        [
          block_id,
          input.organization_id,
          input.project_id,
          draft.id,
          input.data.block_type,
          input.data.title ?? null,
          input.data.body ?? null,
          index,
          input.actor_org_user_id,
        ],
      );
      if (input.data.block_type === "step") {
        const step = input.data.step!;
        await client.query(
          `INSERT INTO guide_schema.guide_step(id,organization_id,project_id,guide_working_draft_id,guide_block_id,title,body,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            draft.id,
            block_id,
            step.title,
            step.body,
            input.actor_org_user_id,
          ],
        );
      }
      const working_draft = await advance_draft(
        client,
        draft.id,
        input.expected_working_draft_version,
        input.actor_org_user_id,
      );
      return {
        guide_blocks: await read_blocks(
          client,
          draft.id,
          input.project_id,
          input.organization_id,
        ),
        working_draft,
      };
    });
  },
  async update_guide_block(input) {
    return with_transaction(db, async (client) => {
      const draft = await resolve_draft(client, input);
      if (!draft) throw new GuideWorkingDraftConflictError();
      const row = first(
        await client.query<BlockRow>(
          `UPDATE guide_schema.guide_block SET title=$1,body=$2,updated_by_id=$3,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$4 AND guide_working_draft_id=$5 AND is_deleted=FALSE RETURNING ${block_select}`,
          [
            input.data.title,
            input.data.body,
            input.actor_org_user_id,
            input.guide_block_id,
            draft.id,
          ],
        ),
      );
      if (!row) throw new GuideWorkingDraftConflictError();
      const working_draft = await advance_draft(
        client,
        draft.id,
        input.expected_working_draft_version,
        input.actor_org_user_id,
      );
      return {
        guide_block: (
          await read_blocks(
            client,
            draft.id,
            input.project_id,
            input.organization_id,
          )
        ).find((b) => b.id === row.id)!,
        working_draft,
      };
    });
  },
  async update_guide_block_screenshot(input) {
    return with_transaction(db, async (client) => {
      const draft = await resolve_draft(client, input);
      if (!draft) throw new GuideWorkingDraftConflictError();
      const row = first(
        await client.query<StepRow>(
          `UPDATE guide_schema.guide_step SET selected_capture_asset_id=$1,screenshot_hidden=$2,updated_by_id=$3,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE guide_block_id=$4 AND guide_working_draft_id=$5 AND is_deleted=FALSE RETURNING ${step_select}`,
          [
            input.data.selected_capture_asset_id,
            input.data.screenshot_hidden,
            input.actor_org_user_id,
            input.guide_block_id,
            draft.id,
          ],
        ),
      );
      if (!row) throw new GuideWorkingDraftConflictError();
      await client.query(
        `UPDATE guide_schema.guide_annotation SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE guide_step_id=$2 AND is_deleted=FALSE`,
        [input.actor_org_user_id, row.id],
      );
      const working_draft = await advance_draft(
        client,
        draft.id,
        input.expected_working_draft_version,
        input.actor_org_user_id,
      );
      return {
        guide_block: (
          await read_blocks(
            client,
            draft.id,
            input.project_id,
            input.organization_id,
          )
        ).find((b) => b.id === input.guide_block_id)!,
        working_draft,
      };
    });
  },
  async update_guide_block_annotations(input) {
    return with_transaction(db, async (client) => {
      const draft = await resolve_draft(client, input);
      if (!draft) throw new GuideWorkingDraftConflictError();
      const step = first(
        await client.query<{ id: string }>(
          `SELECT id FROM guide_schema.guide_step WHERE guide_block_id=$1 AND guide_working_draft_id=$2 AND is_deleted=FALSE`,
          [input.guide_block_id, draft.id],
        ),
      );
      if (!step) throw new GuideWorkingDraftConflictError();

      const retained_ids = input.data.annotations.map(
        (annotation) => annotation.id,
      );
      await client.query(
        `UPDATE guide_schema.guide_annotation
         SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,
             updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1
         WHERE guide_step_id=$2 AND is_deleted=FALSE
           AND NOT (id=ANY($3::varchar[]))`,
        [input.actor_org_user_id, step.id, retained_ids],
      );

      for (const annotation of input.data.annotations) {
        const updated = await client.query(
          `UPDATE guide_schema.guide_annotation
           SET annotation_type=$1::varchar,annotation_index=$2,x=$3,y=$4,width=$5,height=$6,
               updated_by_id=CASE WHEN annotation_type IS DISTINCT FROM $1::varchar
                 OR annotation_index IS DISTINCT FROM $2
                 OR x IS DISTINCT FROM $3 OR y IS DISTINCT FROM $4
                 OR width IS DISTINCT FROM $5 OR height IS DISTINCT FROM $6
                 THEN $7 ELSE updated_by_id END,
               updated_at=CASE WHEN annotation_type IS DISTINCT FROM $1::varchar
                 OR annotation_index IS DISTINCT FROM $2
                 OR x IS DISTINCT FROM $3 OR y IS DISTINCT FROM $4
                 OR width IS DISTINCT FROM $5 OR height IS DISTINCT FROM $6
                 THEN CURRENT_TIMESTAMP ELSE updated_at END,
               version=version+CASE WHEN annotation_type IS DISTINCT FROM $1::varchar
                 OR annotation_index IS DISTINCT FROM $2
                 OR x IS DISTINCT FROM $3 OR y IS DISTINCT FROM $4
                 OR width IS DISTINCT FROM $5 OR height IS DISTINCT FROM $6
                 THEN 1 ELSE 0 END
           WHERE id=$8 AND guide_step_id=$9 AND is_deleted=FALSE
           RETURNING id`,
          [
            annotation.annotation_type,
            annotation.annotation_index,
            annotation.x,
            annotation.y,
            annotation.width,
            annotation.height,
            input.actor_org_user_id,
            annotation.id,
            step.id,
          ],
        );
        if (updated.rows.length === 0) {
          await client.query(
            `INSERT INTO guide_schema.guide_annotation(
               id,organization_id,project_id,guide_working_draft_id,guide_step_id,
               annotation_type,annotation_index,x,y,width,height,created_by_id,updated_by_id
             ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
            [
              annotation.id,
              input.organization_id,
              input.project_id,
              draft.id,
              step.id,
              annotation.annotation_type,
              annotation.annotation_index,
              annotation.x,
              annotation.y,
              annotation.width,
              annotation.height,
              input.actor_org_user_id,
            ],
          );
        }
      }

      const working_draft = await advance_draft(
        client,
        draft.id,
        input.expected_working_draft_version,
        input.actor_org_user_id,
      );
      return {
        guide_block: (
          await read_blocks(
            client,
            draft.id,
            input.project_id,
            input.organization_id,
          )
        ).find((block) => block.id === input.guide_block_id)!,
        working_draft,
      };
    });
  },
  async delete_guide_block(input) {
    return with_transaction(db, async (client) => {
      const draft = await resolve_draft(client, input);
      if (!draft) return { deleted: false, working_draft: null };
      const result = await client.query<{ id: string; block_index: number }>(
        `UPDATE guide_schema.guide_block SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$2 AND guide_working_draft_id=$3 AND is_deleted=FALSE RETURNING id,block_index`,
        [input.actor_org_user_id, input.guide_block_id, draft.id],
      );
      const deleted = result.rows[0];
      if (!deleted) return { deleted: false, working_draft: null };
      await client.query(
        `UPDATE guide_schema.guide_annotation SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE guide_step_id IN (SELECT id FROM guide_schema.guide_step WHERE guide_block_id=$2 AND is_deleted=FALSE) AND is_deleted=FALSE`,
        [input.actor_org_user_id, input.guide_block_id],
      );
      await client.query(
        `UPDATE guide_schema.guide_step SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE guide_block_id=$2 AND is_deleted=FALSE`,
        [input.actor_org_user_id, input.guide_block_id],
      );
      await client.query(
        `UPDATE guide_schema.guide_block SET block_index=block_index-1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE guide_working_draft_id=$2 AND block_index>$3 AND is_deleted=FALSE`,
        [input.actor_org_user_id, draft.id, deleted.block_index],
      );
      const working_draft = await advance_draft(
        client,
        draft.id,
        input.expected_working_draft_version,
        input.actor_org_user_id,
      );
      return { deleted: true, working_draft };
    });
  },
  async find_guide_export_asset_files(input) {
    if (!input.capture_asset_ids.length) return [];
    return (
      await db.query<GuideExportAssetFile>(
        `SELECT a.id capture_asset_id,f.storage_provider,f.storage_key,f.mime_type,f.original_name,f.size_bytes FROM capture_schema.capture_asset a JOIN file_schema.file f ON f.id=a.file_id JOIN guide_schema.guide_edition e ON e.guide_id=$1 AND e.project_version_id=$2 WHERE a.id=ANY($3::varchar[]) AND a.project_id=$4 AND a.organization_id=$5 AND a.is_deleted=FALSE AND f.is_deleted=FALSE`,
        [
          input.guide_id,
          input.project_version_id,
          input.capture_asset_ids,
          input.project_id,
          input.organization_id,
        ],
      )
    ).rows;
  },
});
