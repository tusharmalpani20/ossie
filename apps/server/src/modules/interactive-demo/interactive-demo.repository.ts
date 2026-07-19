import { ulid } from "ulid";
import {
  InteractiveDemoEditionConflictError,
  InteractiveDemoWorkingDraftConflictError,
} from "@repo/demo-domain";
import type {
  DemoHotspot,
  DemoScene,
  DemoTransition,
  InteractiveDemoEdition,
  InteractiveDemoWorkingDraft,
} from "@repo/types/demo";
import type {
  InteractiveDemoDetail,
  InteractiveDemoRepository,
  InteractiveDemoSummary,
} from "./interactive-demo.service";

type Result<T> = { rows: T[] };
type Queryable = {
  query: <T = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<Result<T>>;
};
type Client = Queryable & { release: () => void };
type Database = Queryable & { connect?: () => Promise<Client> };
type Dated<T> = Omit<T, "created_at" | "updated_at"> & {
  created_at: Date;
  updated_at: Date;
};
type EditionRow = Dated<InteractiveDemoEdition>;
type DraftRow = Dated<InteractiveDemoWorkingDraft>;
type SceneRow = Dated<DemoScene>;
type TransitionRow = Dated<DemoTransition>;
type HotspotRow = Dated<Omit<DemoHotspot, "transition">>;
const first = <T>(r: Result<T>) => r.rows[0] ?? null;
const iso = <T extends { created_at: Date; updated_at: Date }>(r: T) => ({
  ...r,
  created_at: r.created_at.toISOString(),
  updated_at: r.updated_at.toISOString(),
});
const tx = async <T>(db: Database, fn: (q: Queryable) => Promise<T>) => {
  if (!db.connect || "release" in db) return fn(db);
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const v = await fn(c);
    await c.query("COMMIT");
    return v;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
};
const edition_columns = `id,organization_id,project_id,interactive_demo_id,project_version_id,source_capture_session_id,title,description,status,created_by_id,updated_by_id,version,created_at,updated_at`;
const draft_columns = `id,organization_id,project_id,interactive_demo_edition_id,created_by_id,updated_by_id,version,created_at,updated_at`;
const scene_columns = `id,organization_id,project_id,interactive_demo_working_draft_id,source_capture_session_id,source_capture_event_id,source_capture_asset_id,scene_index,title,description,background_capture_asset_id,created_by_id,updated_by_id,version,created_at,updated_at`;
const hotspot_columns = `id,organization_id,project_id,interactive_demo_working_draft_id,demo_scene_id,hotspot_type,label,content,x::float8 AS x,y::float8 AS y,width::float8 AS width,height::float8 AS height,hotspot_index,created_by_id,updated_by_id,version,created_at,updated_at`;
const transition_columns = `id,organization_id,project_id,interactive_demo_working_draft_id,demo_hotspot_id,target_scene_id,created_by_id,updated_by_id,version,created_at,updated_at`;
const map_edition = (r: EditionRow): InteractiveDemoEdition => iso(r);
const map_draft = (r: DraftRow): InteractiveDemoWorkingDraft => iso(r);
const map_scene = (r: SceneRow): DemoScene => iso(r);
const map_transition = (r: TransitionRow): DemoTransition => iso(r);
const resolve_draft = async (
  db: Queryable,
  i: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
  },
) =>
  first(
    await db.query<DraftRow>(
      `SELECT d.* FROM interactive_demo_schema.interactive_demo_working_draft d JOIN interactive_demo_schema.interactive_demo_edition e ON e.id=d.interactive_demo_edition_id WHERE e.interactive_demo_id=$1 AND e.project_version_id=$2 AND e.project_id=$3 AND e.organization_id=$4`,
      [
        i.interactive_demo_id,
        i.project_version_id,
        i.project_id,
        i.organization_id,
      ],
    ),
  );
const scenes = async (
  db: Queryable,
  draft_id: string,
  project_id: string,
  organization_id: string,
) =>
  (
    await db.query<SceneRow>(
      `SELECT ${scene_columns} FROM interactive_demo_schema.demo_scene WHERE interactive_demo_working_draft_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE ORDER BY scene_index,id`,
      [draft_id, project_id, organization_id],
    )
  ).rows.map(map_scene);
const hotspots = async (
  db: Queryable,
  draft_id: string,
  scene_id: string,
  project_id: string,
  organization_id: string,
) => {
  const hs = await db.query<HotspotRow>(
    `SELECT ${hotspot_columns} FROM interactive_demo_schema.demo_hotspot WHERE interactive_demo_working_draft_id=$1 AND demo_scene_id=$2 AND project_id=$3 AND organization_id=$4 AND is_deleted=FALSE ORDER BY hotspot_index,id`,
    [draft_id, scene_id, project_id, organization_id],
  );
  const ts = await db.query<TransitionRow>(
    `SELECT ${transition_columns} FROM interactive_demo_schema.demo_transition WHERE interactive_demo_working_draft_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE`,
    [draft_id, project_id, organization_id],
  );
  const by = new Map(
    ts.rows.map((r) => [r.demo_hotspot_id, map_transition(r)]),
  );
  return hs.rows.map(
    (r) =>
      ({ ...iso(r), transition: by.get(r.id) ?? null }) satisfies DemoHotspot,
  );
};
const detail = async (
  db: Queryable,
  i: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
  },
): Promise<InteractiveDemoDetail | null> => {
  const r = first(
    await db.query<{
      artifact_id: string;
      artifact_created_by_id: string;
      artifact_created_at: Date;
      organization_id: string;
      project_id: string;
      edition_id: string;
      project_version_id: string;
      source_capture_session_id: string | null;
      title: string;
      description: string | null;
      status: "draft" | "archived";
      edition_created_by_id: string;
      edition_updated_by_id: string;
      edition_version: number;
      edition_created_at: Date;
      edition_updated_at: Date;
      draft_id: string;
      draft_created_by_id: string;
      draft_updated_by_id: string;
      draft_version: number;
      draft_created_at: Date;
      draft_updated_at: Date;
    }>(
      `SELECT a.id artifact_id,a.created_by_id artifact_created_by_id,a.created_at artifact_created_at,a.organization_id,a.project_id,e.id edition_id,e.project_version_id,e.source_capture_session_id,e.title,e.description,e.status,e.created_by_id edition_created_by_id,e.updated_by_id edition_updated_by_id,e.version edition_version,e.created_at edition_created_at,e.updated_at edition_updated_at,d.id draft_id,d.created_by_id draft_created_by_id,d.updated_by_id draft_updated_by_id,d.version draft_version,d.created_at draft_created_at,d.updated_at draft_updated_at FROM interactive_demo_schema.interactive_demo a JOIN interactive_demo_schema.interactive_demo_edition e ON e.interactive_demo_id=a.id JOIN interactive_demo_schema.interactive_demo_working_draft d ON d.interactive_demo_edition_id=e.id WHERE a.id=$1 AND a.project_id=$2 AND a.organization_id=$3 AND e.project_version_id=$4`,
      [
        i.interactive_demo_id,
        i.project_id,
        i.organization_id,
        i.project_version_id,
      ],
    ),
  );
  if (!r) return null;
  const artifact = {
    id: r.artifact_id,
    organization_id: r.organization_id,
    project_id: r.project_id,
    created_by_id: r.artifact_created_by_id,
    created_at: r.artifact_created_at.toISOString(),
  };
  const edition = {
    id: r.edition_id,
    organization_id: r.organization_id,
    project_id: r.project_id,
    interactive_demo_id: r.artifact_id,
    project_version_id: r.project_version_id,
    source_capture_session_id: r.source_capture_session_id,
    title: r.title,
    description: r.description,
    status: r.status,
    created_by_id: r.edition_created_by_id,
    updated_by_id: r.edition_updated_by_id,
    version: r.edition_version,
    created_at: r.edition_created_at.toISOString(),
    updated_at: r.edition_updated_at.toISOString(),
  };
  const working_draft = {
    id: r.draft_id,
    organization_id: r.organization_id,
    project_id: r.project_id,
    interactive_demo_edition_id: r.edition_id,
    created_by_id: r.draft_created_by_id,
    updated_by_id: r.draft_updated_by_id,
    version: r.draft_version,
    created_at: r.draft_created_at.toISOString(),
    updated_at: r.draft_updated_at.toISOString(),
  };
  return {
    artifact,
    edition,
    working_draft,
    authored_updated_at:
      edition.updated_at > working_draft.updated_at
        ? edition.updated_at
        : working_draft.updated_at,
  };
};
const advance = async (
  db: Queryable,
  id: string,
  expected: number,
  actor: string,
) => {
  const r = first(
    await db.query<DraftRow>(
      `UPDATE interactive_demo_schema.interactive_demo_working_draft SET updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$2 AND version=$3 RETURNING ${draft_columns}`,
      [actor, id, expected],
    ),
  );
  if (!r) throw new InteractiveDemoWorkingDraftConflictError();
  return map_draft(r);
};
const create_root = async (
  db: Queryable,
  i: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    source_capture_session_id: string | null;
    actor_org_user_id: string;
    title: string;
    description: string | null;
  },
) => {
  const artifact_id = ulid(),
    edition_id = ulid(),
    draft_id = ulid();
  await db.query(
    `INSERT INTO interactive_demo_schema.interactive_demo(id,organization_id,project_id,created_by_id) VALUES($1,$2,$3,$4)`,
    [artifact_id, i.organization_id, i.project_id, i.actor_org_user_id],
  );
  await db.query(
    `INSERT INTO interactive_demo_schema.interactive_demo_edition(id,organization_id,project_id,interactive_demo_id,project_version_id,source_capture_session_id,title,description,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
    [
      edition_id,
      i.organization_id,
      i.project_id,
      artifact_id,
      i.project_version_id,
      i.source_capture_session_id,
      i.title,
      i.description,
      i.actor_org_user_id,
    ],
  );
  await db.query(
    `INSERT INTO interactive_demo_schema.interactive_demo_working_draft(id,organization_id,project_id,interactive_demo_edition_id,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$5)`,
    [
      draft_id,
      i.organization_id,
      i.project_id,
      edition_id,
      i.actor_org_user_id,
    ],
  );
  return { artifact_id, draft_id };
};

export const build_interactive_demo_repository = (
  db: Database,
): InteractiveDemoRepository => ({
  async project_exists(i) {
    return Boolean(
      first(
        await db.query(
          `SELECT 1 FROM project_schema.project WHERE id=$1 AND organization_id=$2`,
          [i.project_id, i.organization_id],
        ),
      ),
    );
  },
  async create_demo(i) {
    return tx(db, async (q) => {
      const root = await create_root(q, {
        ...i,
        project_version_id: i.data.project_version_id,
        source_capture_session_id: null,
        title: i.data.title,
        description: i.data.description,
      });
      return (await detail(q, {
        ...i,
        interactive_demo_id: root.artifact_id,
        project_version_id: i.data.project_version_id,
      }))!;
    });
  },
  async list_demos(i) {
    const r = await db.query<
      {
        artifact_id: string;
        artifact_created_by_id: string;
        artifact_created_at: Date;
        authored_updated_at: Date;
      } & EditionRow
    >(
      `SELECT a.id artifact_id,a.created_by_id artifact_created_by_id,a.created_at artifact_created_at,e.*,GREATEST(e.updated_at,d.updated_at) authored_updated_at FROM interactive_demo_schema.interactive_demo a JOIN interactive_demo_schema.interactive_demo_edition e ON e.interactive_demo_id=a.id JOIN interactive_demo_schema.interactive_demo_working_draft d ON d.interactive_demo_edition_id=e.id WHERE a.project_id=$1 AND a.organization_id=$2 AND e.project_version_id=$3 ORDER BY authored_updated_at DESC,e.id DESC`,
      [i.project_id, i.organization_id, i.project_version_id],
    );
    return r.rows.map(
      (x) =>
        ({
          artifact: {
            id: x.artifact_id,
            organization_id: x.organization_id,
            project_id: x.project_id,
            created_by_id: x.artifact_created_by_id,
            created_at: x.artifact_created_at.toISOString(),
          },
          edition: map_edition(x),
          authored_updated_at: x.authored_updated_at.toISOString(),
        }) satisfies InteractiveDemoSummary,
    );
  },
  find_demo(i) {
    return detail(db, i);
  },
  async update_demo(i) {
    const r = first(
      await db.query<EditionRow>(
        `UPDATE interactive_demo_schema.interactive_demo_edition SET title=COALESCE($1,title),description=CASE WHEN $2 THEN $3 ELSE description END,updated_by_id=$4,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE interactive_demo_id=$5 AND project_version_id=$6 AND project_id=$7 AND organization_id=$8 AND version=$9 AND status='draft' RETURNING ${edition_columns}`,
        [
          i.data.title ?? null,
          "description" in i.data,
          i.data.description ?? null,
          i.actor_org_user_id,
          i.interactive_demo_id,
          i.project_version_id,
          i.project_id,
          i.organization_id,
          i.expected_edition_version,
        ],
      ),
    );
    if (!r) throw new InteractiveDemoEditionConflictError();
    return map_edition(r);
  },
  async update_demo_status(i) {
    const r = first(
      await db.query<EditionRow>(
        `UPDATE interactive_demo_schema.interactive_demo_edition SET status=$1,updated_by_id=$2,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE interactive_demo_id=$3 AND project_version_id=$4 AND project_id=$5 AND organization_id=$6 AND version=$7 AND status<>$1 RETURNING ${edition_columns}`,
        [
          i.status,
          i.actor_org_user_id,
          i.interactive_demo_id,
          i.project_version_id,
          i.project_id,
          i.organization_id,
          i.expected_edition_version,
        ],
      ),
    );
    if (!r) throw new InteractiveDemoEditionConflictError();
    return map_edition(r);
  },
  async background_asset_exists(i) {
    return Boolean(
      first(
        await db.query(
          `SELECT 1 FROM capture_schema.capture_asset WHERE id=$1 AND project_id=$2 AND organization_id=$3 AND asset_type='screenshot' AND is_deleted=FALSE`,
          [i.capture_asset_id, i.project_id, i.organization_id],
        ),
      ),
    );
  },
  async find_capture_session_for_demo(i) {
    return first(
      await db.query(
        `SELECT id,name,description FROM capture_schema.capture_session WHERE id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE`,
        [i.capture_session_id, i.project_id, i.organization_id],
      ),
    ) as never;
  },
  async capture_session_exists_for_demo(i) {
    return Boolean(
      first(
        await db.query(
          `SELECT 1 FROM capture_schema.capture_session WHERE id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE`,
          [i.capture_session_id, i.project_id, i.organization_id],
        ),
      ),
    );
  },
  async list_capture_events_for_demo(i) {
    return (
      await db.query(
        `SELECT id,event_type,event_index,capture_asset_id,page_url,page_title,target_label,target_role,target_text,note FROM capture_schema.capture_event WHERE capture_session_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE ORDER BY event_index,id`,
        [i.capture_session_id, i.project_id, i.organization_id],
      )
    ).rows as never;
  },
  async list_screenshot_capture_asset_ids(i) {
    if (!i.capture_asset_ids.length) return [];
    return (
      await db.query<{ id: string }>(
        `SELECT id FROM capture_schema.capture_asset WHERE id=ANY($1::varchar[]) AND capture_session_id=$2 AND project_id=$3 AND organization_id=$4 AND asset_type='screenshot' AND is_deleted=FALSE`,
        [
          i.capture_asset_ids,
          i.capture_session_id,
          i.project_id,
          i.organization_id,
        ],
      )
    ).rows.map((x) => x.id);
  },
  async create_demo_from_capture(i) {
    return tx(db, async (q) => {
      const s = first(
        await q.query<{ project_version_id: string }>(
          `SELECT project_version_id FROM capture_schema.capture_session WHERE id=$1 AND project_id=$2 AND organization_id=$3 FOR SHARE`,
          [i.capture_session_id, i.project_id, i.organization_id],
        ),
      );
      if (!s) throw new Error("capture session disappeared");
      const root = await create_root(q, {
        ...i,
        project_version_id: s.project_version_id,
        source_capture_session_id: i.capture_session_id,
        title: i.data.title,
        description: i.data.description,
      });
      for (const scene of i.data.scenes)
        await q.query(
          `INSERT INTO interactive_demo_schema.demo_scene(id,organization_id,project_id,interactive_demo_working_draft_id,source_capture_session_id,source_capture_event_id,source_capture_asset_id,scene_index,title,description,background_capture_asset_id,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
          [
            ulid(),
            i.organization_id,
            i.project_id,
            root.draft_id,
            i.capture_session_id,
            scene.source_capture_event_id,
            scene.source_capture_asset_id,
            scene.scene_index,
            scene.title,
            scene.description,
            scene.background_capture_asset_id,
            i.actor_org_user_id,
          ],
        );
      const d = (await detail(q, {
        ...i,
        interactive_demo_id: root.artifact_id,
        project_version_id: s.project_version_id,
      }))!;
      return {
        artifact: d.artifact,
        edition: d.edition,
        working_draft: d.working_draft,
        demo_scenes: await scenes(
          q,
          root.draft_id,
          i.project_id,
          i.organization_id,
        ),
      };
    });
  },
  async create_scene(i) {
    return tx(db, async (q) => {
      const d = await resolve_draft(q, i);
      if (!d) throw new InteractiveDemoWorkingDraftConflictError();
      const idx = Number(
        first(
          await q.query<{ n: number }>(
            `SELECT COALESCE(MAX(scene_index),0)+1 n FROM interactive_demo_schema.demo_scene WHERE interactive_demo_working_draft_id=$1 AND is_deleted=FALSE`,
            [d.id],
          ),
        )?.n ?? 1,
      );
      const r = first(
        await q.query<SceneRow>(
          `INSERT INTO interactive_demo_schema.demo_scene(id,organization_id,project_id,interactive_demo_working_draft_id,source_capture_session_id,source_capture_event_id,source_capture_asset_id,scene_index,title,description,background_capture_asset_id,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING ${scene_columns}`,
          [
            ulid(),
            i.organization_id,
            i.project_id,
            d.id,
            i.data.source_capture_session_id ?? null,
            i.data.source_capture_event_id ?? null,
            i.data.source_capture_asset_id ?? null,
            idx,
            i.data.title ?? null,
            i.data.description ?? null,
            i.data.background_capture_asset_id ?? null,
            i.actor_org_user_id,
          ],
        ),
      )!;
      return {
        demo_scene: map_scene(r),
        working_draft: await advance(
          q,
          d.id,
          i.expected_working_draft_version,
          i.actor_org_user_id,
        ),
      };
    });
  },
  async list_scenes(i) {
    const d = await resolve_draft(db, i);
    if (!d) throw new InteractiveDemoWorkingDraftConflictError();
    return {
      demo_scenes: await scenes(db, d.id, i.project_id, i.organization_id),
      working_draft: map_draft(d),
    };
  },
  async update_scene(i) {
    return tx(db, async (q) => {
      const d = await resolve_draft(q, i);
      if (!d) return null;
      const r = first(
        await q.query<SceneRow>(
          `UPDATE interactive_demo_schema.demo_scene SET title=CASE WHEN $1 THEN $2 ELSE title END,description=CASE WHEN $3 THEN $4 ELSE description END,background_capture_asset_id=CASE WHEN $5 THEN $6 ELSE background_capture_asset_id END,updated_by_id=$7,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$8 AND interactive_demo_working_draft_id=$9 AND is_deleted=FALSE RETURNING ${scene_columns}`,
          [
            "title" in i.data,
            i.data.title ?? null,
            "description" in i.data,
            i.data.description ?? null,
            "background_capture_asset_id" in i.data,
            i.data.background_capture_asset_id ?? null,
            i.actor_org_user_id,
            i.demo_scene_id,
            d.id,
          ],
        ),
      );
      if (!r) return null;
      return {
        demo_scene: map_scene(r),
        working_draft: await advance(
          q,
          d.id,
          i.expected_working_draft_version,
          i.actor_org_user_id,
        ),
      };
    });
  },
  async reorder_scenes(i) {
    return tx(db, async (q) => {
      const d = await resolve_draft(q, i);
      if (!d) throw new InteractiveDemoWorkingDraftConflictError();
      for (let n = 0; n < i.scene_ids.length; n++)
        await q.query(
          `UPDATE interactive_demo_schema.demo_scene SET scene_index=$1,updated_by_id=$2,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$3 AND interactive_demo_working_draft_id=$4 AND is_deleted=FALSE`,
          [1000000 + n + 1, i.actor_org_user_id, i.scene_ids[n], d.id],
        );
      for (let n = 0; n < i.scene_ids.length; n++)
        await q.query(
          `UPDATE interactive_demo_schema.demo_scene SET scene_index=$1 WHERE id=$2`,
          [n + 1, i.scene_ids[n]],
        );
      return {
        demo_scenes: await scenes(q, d.id, i.project_id, i.organization_id),
        working_draft: await advance(
          q,
          d.id,
          i.expected_working_draft_version,
          i.actor_org_user_id,
        ),
      };
    });
  },
  async delete_scene(i) {
    return tx(db, async (q) => {
      const d = await resolve_draft(q, i);
      if (!d) return { deleted: false, working_draft: null };
      const exists = first(
        await q.query<{ id: string }>(
          `SELECT id FROM interactive_demo_schema.demo_scene WHERE id=$1 AND interactive_demo_working_draft_id=$2 AND is_deleted=FALSE FOR UPDATE`,
          [i.demo_scene_id, d.id],
        ),
      );
      if (!exists) return { deleted: false, working_draft: null };
      await q.query(
        `UPDATE interactive_demo_schema.demo_transition SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE interactive_demo_working_draft_id=$2 AND is_deleted=FALSE AND (target_scene_id=$3 OR demo_hotspot_id IN (SELECT id FROM interactive_demo_schema.demo_hotspot WHERE demo_scene_id=$3 AND is_deleted=FALSE))`,
        [i.actor_org_user_id, d.id, i.demo_scene_id],
      );
      await q.query(
        `UPDATE interactive_demo_schema.demo_hotspot SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE demo_scene_id=$2 AND interactive_demo_working_draft_id=$3 AND is_deleted=FALSE`,
        [i.actor_org_user_id, i.demo_scene_id, d.id],
      );
      await q.query(
        `UPDATE interactive_demo_schema.demo_scene SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$2 AND interactive_demo_working_draft_id=$3 AND is_deleted=FALSE`,
        [i.actor_org_user_id, i.demo_scene_id, d.id],
      );
      return {
        deleted: true,
        working_draft: await advance(
          q,
          d.id,
          i.expected_working_draft_version,
          i.actor_org_user_id,
        ),
      };
    });
  },
  async find_scene(i) {
    const d = await resolve_draft(db, i);
    if (!d) return null;
    return (
      (await scenes(db, d.id, i.project_id, i.organization_id)).find(
        (x) => x.id === i.demo_scene_id,
      ) ?? null
    );
  },
  async create_hotspot(i) {
    return tx(db, async (q) => {
      const d = await resolve_draft(q, i);
      if (!d) throw new InteractiveDemoWorkingDraftConflictError();
      const idx = Number(
        first(
          await q.query<{ n: number }>(
            `SELECT COALESCE(MAX(hotspot_index),0)+1 n FROM interactive_demo_schema.demo_hotspot WHERE demo_scene_id=$1 AND is_deleted=FALSE`,
            [i.demo_scene_id],
          ),
        )?.n ?? 1,
      );
      const id = ulid();
      await q.query(
        `INSERT INTO interactive_demo_schema.demo_hotspot(id,organization_id,project_id,interactive_demo_working_draft_id,demo_scene_id,hotspot_type,label,content,x,y,width,height,hotspot_index,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
        [
          id,
          i.organization_id,
          i.project_id,
          d.id,
          i.demo_scene_id,
          i.data.hotspot_type,
          i.data.label ?? null,
          i.data.content ?? null,
          i.data.x,
          i.data.y,
          i.data.width,
          i.data.height,
          idx,
          i.actor_org_user_id,
        ],
      );
      if (i.data.transition)
        await q.query(
          `INSERT INTO interactive_demo_schema.demo_transition(id,organization_id,project_id,interactive_demo_working_draft_id,demo_hotspot_id,target_scene_id,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$7)`,
          [
            ulid(),
            i.organization_id,
            i.project_id,
            d.id,
            id,
            i.data.transition.target_scene_id,
            i.actor_org_user_id,
          ],
        );
      const hs = await hotspots(
        q,
        d.id,
        i.demo_scene_id,
        i.project_id,
        i.organization_id,
      );
      return {
        demo_hotspot: hs.find((x) => x.id === id)!,
        working_draft: await advance(
          q,
          d.id,
          i.expected_working_draft_version,
          i.actor_org_user_id,
        ),
      };
    });
  },
  async list_hotspots(i) {
    const d = await resolve_draft(db, i);
    if (!d) throw new InteractiveDemoWorkingDraftConflictError();
    return {
      demo_hotspots: await hotspots(
        db,
        d.id,
        i.demo_scene_id,
        i.project_id,
        i.organization_id,
      ),
      working_draft: map_draft(d),
    };
  },
  async update_hotspot(i) {
    return tx(db, async (q) => {
      const d = await resolve_draft(q, i);
      if (!d) return null;
      const existing = first(
        await q.query<{ id: string }>(
          `SELECT id FROM interactive_demo_schema.demo_hotspot
     WHERE id=$1 AND demo_scene_id=$2 AND interactive_demo_working_draft_id=$3
       AND is_deleted=FALSE FOR UPDATE`,
          [i.demo_hotspot_id, i.demo_scene_id, d.id],
        ),
      );
      if (!existing) return null;

      const changes_hotspot = Object.keys(i.data).some(
        (key) => key !== "transition",
      );
      if (changes_hotspot) {
        await q.query(
          `UPDATE interactive_demo_schema.demo_hotspot
      SET hotspot_type=COALESCE($1,hotspot_type),label=CASE WHEN $2 THEN $3 ELSE label END,
          content=CASE WHEN $4 THEN $5 ELSE content END,x=COALESCE($6,x),y=COALESCE($7,y),
          width=COALESCE($8,width),height=COALESCE($9,height),updated_by_id=$10,
          updated_at=CURRENT_TIMESTAMP,version=version+1
      WHERE id=$11 AND demo_scene_id=$12 AND interactive_demo_working_draft_id=$13
        AND is_deleted=FALSE`,
          [
            i.data.hotspot_type ?? null,
            "label" in i.data,
            i.data.label ?? null,
            "content" in i.data,
            i.data.content ?? null,
            i.data.x ?? null,
            i.data.y ?? null,
            i.data.width ?? null,
            i.data.height ?? null,
            i.actor_org_user_id,
            i.demo_hotspot_id,
            i.demo_scene_id,
            d.id,
          ],
        );
      }

      if ("transition" in i.data) {
        if (i.data.transition === null) {
          await q.query(
            `UPDATE interactive_demo_schema.demo_transition
       SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,
           updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1
       WHERE demo_hotspot_id=$2 AND is_deleted=FALSE`,
            [i.actor_org_user_id, i.demo_hotspot_id],
          );
        } else if (i.data.transition) {
          const transition = await q.query<{ id: string }>(
            `UPDATE interactive_demo_schema.demo_transition
       SET target_scene_id=$1,updated_by_id=$2,updated_at=CURRENT_TIMESTAMP,version=version+1
       WHERE demo_hotspot_id=$3 AND is_deleted=FALSE RETURNING id`,
            [
              i.data.transition.target_scene_id,
              i.actor_org_user_id,
              i.demo_hotspot_id,
            ],
          );
          if (!transition.rows.length) {
            await q.query(
              `INSERT INTO interactive_demo_schema.demo_transition(
          id,organization_id,project_id,interactive_demo_working_draft_id,
          demo_hotspot_id,target_scene_id,created_by_id,updated_by_id
        ) VALUES($1,$2,$3,$4,$5,$6,$7,$7)`,
              [
                ulid(),
                i.organization_id,
                i.project_id,
                d.id,
                i.demo_hotspot_id,
                i.data.transition.target_scene_id,
                i.actor_org_user_id,
              ],
            );
          }
        }
      }
      const hs = await hotspots(
        q,
        d.id,
        i.demo_scene_id,
        i.project_id,
        i.organization_id,
      );
      return {
        demo_hotspot: hs.find((x) => x.id === i.demo_hotspot_id)!,
        working_draft: await advance(
          q,
          d.id,
          i.expected_working_draft_version,
          i.actor_org_user_id,
        ),
      };
    });
  },
  async reorder_hotspots(i) {
    return tx(db, async (q) => {
      const d = await resolve_draft(q, i);
      if (!d) throw new InteractiveDemoWorkingDraftConflictError();
      for (let n = 0; n < i.hotspot_ids.length; n++)
        await q.query(
          `UPDATE interactive_demo_schema.demo_hotspot SET hotspot_index=$1,updated_by_id=$2,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$3 AND demo_scene_id=$4 AND interactive_demo_working_draft_id=$5 AND is_deleted=FALSE`,
          [
            1000000 + n + 1,
            i.actor_org_user_id,
            i.hotspot_ids[n],
            i.demo_scene_id,
            d.id,
          ],
        );
      for (let n = 0; n < i.hotspot_ids.length; n++)
        await q.query(
          `UPDATE interactive_demo_schema.demo_hotspot SET hotspot_index=$1 WHERE id=$2`,
          [n + 1, i.hotspot_ids[n]],
        );
      return {
        demo_hotspots: await hotspots(
          q,
          d.id,
          i.demo_scene_id,
          i.project_id,
          i.organization_id,
        ),
        working_draft: await advance(
          q,
          d.id,
          i.expected_working_draft_version,
          i.actor_org_user_id,
        ),
      };
    });
  },
  async delete_hotspot(i) {
    return tx(db, async (q) => {
      const d = await resolve_draft(q, i);
      if (!d) return { deleted: false, working_draft: null };
      const r = await q.query(
        `UPDATE interactive_demo_schema.demo_hotspot SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$2 AND demo_scene_id=$3 AND interactive_demo_working_draft_id=$4 AND is_deleted=FALSE RETURNING id`,
        [i.actor_org_user_id, i.demo_hotspot_id, i.demo_scene_id, d.id],
      );
      if (!r.rows.length) return { deleted: false, working_draft: null };
      await q.query(
        `UPDATE interactive_demo_schema.demo_transition SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE demo_hotspot_id=$2 AND is_deleted=FALSE`,
        [i.actor_org_user_id, i.demo_hotspot_id],
      );
      return {
        deleted: true,
        working_draft: await advance(
          q,
          d.id,
          i.expected_working_draft_version,
          i.actor_org_user_id,
        ),
      };
    });
  },
});
