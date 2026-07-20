import type {
  ArtifactRevisionSummary,
  GuideRevisionDetail,
  InteractiveDemoRevisionDetail,
} from "@repo/types";
import { ulid } from "ulid";
import { assert_guide_revision_writable } from "@repo/guide-domain";
import { assert_interactive_demo_revision_writable } from "@repo/demo-domain";
import { ArtifactHasNoPublishableContentError } from "@repo/publish-domain";
import { build_guide_repository } from "../guide/guide.repository";
import { build_interactive_demo_repository } from "../interactive-demo/interactive-demo.repository";
import {
  canonicalize_demo_revision_content,
  canonicalize_guide_revision_content,
  hash_revision_content,
} from "./artifact-revision-content";
import { ArtifactEditionNotFoundError } from "./artifact-revision.service";

type QueryResult<Row> = { rows: Row[] };
export type RevisionQueryable = {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>;
};

type Auth = { organization_id: string; actor_org_user_id: string };
type HistoryInput = {
  auth: Auth;
  project_id: string;
  project_version_id: string;
  limit: number;
  before_revision_number?: number;
};
type RevisionRow = Omit<ArtifactRevisionSummary, "created_at"> & {
  created_at: Date;
};
type GuideRevisionBlockRow = Omit<
  GuideRevisionDetail["guide_blocks"][number],
  "step"
>;
type GuideRevisionStep = NonNullable<
  GuideRevisionDetail["guide_blocks"][number]["step"]
>;
type GuideRevisionStepRow = Omit<
  GuideRevisionStep,
  "display_capture_asset_id" | "annotations"
> & { guide_revision_block_id: string };
type GuideRevisionAnnotationRow = GuideRevisionStep["annotations"][number] & {
  guide_revision_step_id: string;
};
type DemoRevisionSceneRow = Omit<
  InteractiveDemoRevisionDetail["demo_scenes"][number],
  "hotspots"
>;
type DemoRevisionHotspot =
  InteractiveDemoRevisionDetail["demo_scenes"][number]["hotspots"][number];
type DemoRevisionHotspotRow = Omit<DemoRevisionHotspot, "transition"> & {
  demo_revision_scene_id: string;
};
type DemoRevisionTransitionRow = NonNullable<
  DemoRevisionHotspot["transition"]
> & { demo_revision_hotspot_id: string };

type LockedEdition = {
  edition_id: string;
  edition_version: number;
  edition_status: "draft" | "archived";
  working_draft_id: string;
  working_draft_version: number;
  project_status: "active" | "archived";
  project_version_status: "active" | "archived";
  title: string;
  description: string | null;
};

const assert_writable = (
  locked: LockedEdition,
  input: {
    expected_edition_version: number;
    expected_working_draft_version: number;
  },
  kind: "guide" | "interactive_demo",
) => {
  const values = { ...locked, ...input };
  if (kind === "guide") assert_guide_revision_writable(values);
  else assert_interactive_demo_revision_writable(values);
};

const lock_edition = async (
  db: RevisionQueryable,
  input: ScopeBase & { artifact_id: string },
  kind: "guide" | "interactive_demo",
) => {
  const artifact_column = kind === "guide" ? "guide_id" : "interactive_demo_id";
  const edition_table =
    kind === "guide"
      ? "guide_schema.guide_edition"
      : "interactive_demo_schema.interactive_demo_edition";
  const draft_table =
    kind === "guide"
      ? "guide_schema.guide_working_draft"
      : "interactive_demo_schema.interactive_demo_working_draft";
  const draft_fk =
    kind === "guide" ? "guide_edition_id" : "interactive_demo_edition_id";
  const result = await db.query<LockedEdition>(
    `SELECT edition.id AS edition_id,edition.version AS edition_version,edition.status AS edition_status,
       draft.id AS working_draft_id,draft.version AS working_draft_version,
       project.status AS project_status,project_version.status AS project_version_status,
       edition.title,edition.description
     FROM ${edition_table} edition
     JOIN ${draft_table} draft ON draft.${draft_fk}=edition.id
     JOIN project_schema.project project ON project.id=edition.project_id AND project.organization_id=edition.organization_id
     JOIN project_schema.project_version project_version ON project_version.id=edition.project_version_id
       AND project_version.project_id=edition.project_id AND project_version.organization_id=edition.organization_id
     WHERE edition.organization_id=$1 AND edition.project_id=$2 AND edition.project_version_id=$3
       AND edition.${artifact_column}=$4 FOR UPDATE OF edition,draft`,
    [
      input.auth.organization_id,
      input.project_id,
      input.project_version_id,
      input.artifact_id,
    ],
  );
  return result.rows[0] ?? null;
};

type ScopeBase = { auth: Auth; project_id: string; project_version_id: string };

const summary = (row: RevisionRow): ArtifactRevisionSummary => ({
  ...row,
  created_at: row.created_at.toISOString(),
});

const current_guide_content = async (
  db: RevisionQueryable,
  input: ScopeBase & { guide_id: string },
) => {
  const repository = build_guide_repository(db as never);
  const detail = await repository.find_guide_detail({
    organization_id: input.auth.organization_id,
    project_id: input.project_id,
    project_version_id: input.project_version_id,
    guide_id: input.guide_id,
  });
  if (!detail) return null;
  return {
    detail,
    canonical: canonicalize_guide_revision_content({
      title: detail.edition.title,
      description: detail.edition.description,
      blocks: detail.guide_blocks,
    }),
  };
};

const current_demo_content = async (
  db: RevisionQueryable,
  input: ScopeBase & { interactive_demo_id: string },
) => {
  const repository = build_interactive_demo_repository(db as never);
  const detail = await repository.find_demo({
    organization_id: input.auth.organization_id,
    project_id: input.project_id,
    project_version_id: input.project_version_id,
    interactive_demo_id: input.interactive_demo_id,
  });
  if (!detail) return null;
  const listed = await repository.list_scenes({
    organization_id: input.auth.organization_id,
    project_id: input.project_id,
    project_version_id: input.project_version_id,
    interactive_demo_id: input.interactive_demo_id,
  });
  const demo_scenes = await Promise.all(
    listed.demo_scenes.map(async (scene) => ({
      ...scene,
      hotspots: (
        await repository.list_hotspots({
          organization_id: input.auth.organization_id,
          project_id: input.project_id,
          project_version_id: input.project_version_id,
          interactive_demo_id: input.interactive_demo_id,
          demo_scene_id: scene.id,
        })
      ).demo_hotspots,
    })),
  );
  return {
    detail,
    demo_scenes,
    canonical: canonicalize_demo_revision_content({
      title: detail.edition.title,
      description: detail.edition.description,
      scenes: demo_scenes,
    }),
  };
};

const latest_revision = async (
  db: RevisionQueryable,
  edition_id: string,
  kind: "guide" | "interactive_demo",
) => {
  const table =
    kind === "guide"
      ? "guide_schema.guide_revision"
      : "interactive_demo_schema.interactive_demo_revision";
  const column =
    kind === "guide" ? "guide_edition_id" : "interactive_demo_edition_id";
  const result = await db.query<RevisionRow & { content_sha256: string }>(
    `SELECT id,${column} AS edition_id,revision_number,trigger,title,description,
       source_working_draft_version,created_by_id,created_at,content_sha256
     FROM ${table} WHERE ${column}=$1 ORDER BY revision_number DESC LIMIT 1`,
    [edition_id],
  );
  return result.rows[0] ?? null;
};

const insert_guide_revision = async (
  db: RevisionQueryable,
  input: ScopeBase & { guide_id: string },
  locked: LockedEdition,
  content: Awaited<ReturnType<typeof current_guide_content>> & {},
  digest: string,
  trigger:
    | "manual_checkpoint"
    | "publication"
    | "carry_forward" = "manual_checkpoint",
) => {
  const latest = await latest_revision(db, locked.edition_id, "guide");
  if (latest?.content_sha256 === digest)
    return { revision: summary(latest), reused: true };
  const revision_id = ulid();
  const revision_number = (latest?.revision_number ?? 0) + 1;
  const root = await db.query<RevisionRow>(
    `INSERT INTO guide_schema.guide_revision
      (id,organization_id,project_id,guide_id,guide_edition_id,project_version_id,revision_number,trigger,
       title,description,source_working_draft_version,content_sha256,created_by_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id,guide_edition_id AS edition_id,revision_number,trigger,title,description,
       source_working_draft_version,created_by_id,created_at`,
    [
      revision_id,
      input.auth.organization_id,
      input.project_id,
      input.guide_id,
      locked.edition_id,
      input.project_version_id,
      revision_number,
      trigger,
      locked.title,
      locked.description,
      locked.working_draft_version,
      digest,
      input.auth.actor_org_user_id,
    ],
  );
  for (const block of content.detail.guide_blocks) {
    const block_id = ulid();
    await db.query(
      `INSERT INTO guide_schema.guide_revision_block
      (id,organization_id,project_id,guide_revision_id,block_type,title,body,block_index)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        block_id,
        input.auth.organization_id,
        input.project_id,
        revision_id,
        block.block_type,
        block.title,
        block.body,
        block.block_index,
      ],
    );
    if (!block.step) continue;
    const step_id = ulid();
    await db.query(
      `INSERT INTO guide_schema.guide_revision_step
      (id,organization_id,project_id,guide_revision_id,guide_revision_block_id,source_capture_session_id,
       source_capture_event_id,source_capture_asset_id,selected_capture_asset_id,screenshot_hidden,title,body)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        step_id,
        input.auth.organization_id,
        input.project_id,
        revision_id,
        block_id,
        block.step.source_capture_session_id,
        block.step.source_capture_event_id,
        block.step.source_capture_asset_id,
        block.step.selected_capture_asset_id,
        block.step.screenshot_hidden,
        block.step.title,
        block.step.body,
      ],
    );
    for (const annotation of block.step.annotations)
      await db.query(
        `INSERT INTO guide_schema.guide_revision_annotation
       (id,organization_id,project_id,guide_revision_id,guide_revision_step_id,annotation_type,annotation_index,x,y,width,height)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          ulid(),
          input.auth.organization_id,
          input.project_id,
          revision_id,
          step_id,
          annotation.annotation_type,
          annotation.annotation_index,
          annotation.x,
          annotation.y,
          annotation.width,
          annotation.height,
        ],
      );
  }
  return { revision: summary(root.rows[0]!), reused: false };
};

const insert_demo_revision = async (
  db: RevisionQueryable,
  input: ScopeBase & { interactive_demo_id: string },
  locked: LockedEdition,
  content: Awaited<ReturnType<typeof current_demo_content>> & {},
  digest: string,
  trigger:
    | "manual_checkpoint"
    | "publication"
    | "carry_forward" = "manual_checkpoint",
) => {
  const latest = await latest_revision(
    db,
    locked.edition_id,
    "interactive_demo",
  );
  if (latest?.content_sha256 === digest)
    return { revision: summary(latest), reused: true };
  const revision_id = ulid();
  const revision_number = (latest?.revision_number ?? 0) + 1;
  const root = await db.query<RevisionRow>(
    `INSERT INTO interactive_demo_schema.interactive_demo_revision
    (id,organization_id,project_id,interactive_demo_id,interactive_demo_edition_id,project_version_id,revision_number,
     trigger,title,description,source_working_draft_version,content_sha256,created_by_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING id,interactive_demo_edition_id AS edition_id,revision_number,trigger,title,description,
      source_working_draft_version,created_by_id,created_at`,
    [
      revision_id,
      input.auth.organization_id,
      input.project_id,
      input.interactive_demo_id,
      locked.edition_id,
      input.project_version_id,
      revision_number,
      trigger,
      locked.title,
      locked.description,
      locked.working_draft_version,
      digest,
      input.auth.actor_org_user_id,
    ],
  );
  const scene_ids = new Map<string, string>();
  for (const scene of content.demo_scenes) {
    const id = ulid();
    scene_ids.set(scene.id, id);
    await db.query(
      `INSERT INTO interactive_demo_schema.demo_revision_scene
      (id,organization_id,project_id,interactive_demo_revision_id,source_capture_session_id,source_capture_event_id,
       source_capture_asset_id,background_capture_asset_id,scene_index,title,description)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id,
        input.auth.organization_id,
        input.project_id,
        revision_id,
        scene.source_capture_session_id,
        scene.source_capture_event_id,
        scene.source_capture_asset_id,
        scene.background_capture_asset_id,
        scene.scene_index,
        scene.title,
        scene.description,
      ],
    );
  }
  for (const scene of content.demo_scenes)
    for (const hotspot of scene.hotspots) {
      const id = ulid();
      await db.query(
        `INSERT INTO interactive_demo_schema.demo_revision_hotspot
      (id,organization_id,project_id,interactive_demo_revision_id,demo_revision_scene_id,hotspot_type,label,content,
       x,y,width,height,hotspot_index) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          id,
          input.auth.organization_id,
          input.project_id,
          revision_id,
          scene_ids.get(scene.id),
          hotspot.hotspot_type,
          hotspot.label,
          hotspot.content,
          hotspot.x,
          hotspot.y,
          hotspot.width,
          hotspot.height,
          hotspot.hotspot_index,
        ],
      );
      if (hotspot.transition)
        await db.query(
          `INSERT INTO interactive_demo_schema.demo_revision_transition
      (id,organization_id,project_id,interactive_demo_revision_id,demo_revision_hotspot_id,target_demo_revision_scene_id)
      VALUES($1,$2,$3,$4,$5,$6)`,
          [
            ulid(),
            input.auth.organization_id,
            input.project_id,
            revision_id,
            id,
            scene_ids.get(hotspot.transition.target_scene_id),
          ],
        );
    }
  return { revision: summary(root.rows[0]!), reused: false };
};

const checkpoint_guide = async (
  db: RevisionQueryable,
  input: ScopeBase & {
    guide_id: string;
    expected_edition_version: number;
    expected_working_draft_version: number;
  },
) => {
  const locked = await lock_edition(
    db,
    { ...input, artifact_id: input.guide_id },
    "guide",
  );
  if (!locked) throw new ArtifactEditionNotFoundError();
  assert_writable(locked, input, "guide");
  const content = await current_guide_content(db, input);
  if (!content) throw new ArtifactEditionNotFoundError();
  return insert_guide_revision(
    db,
    input,
    locked,
    content,
    hash_revision_content(content.canonical),
  );
};

const checkpoint_demo = async (
  db: RevisionQueryable,
  input: ScopeBase & {
    interactive_demo_id: string;
    expected_edition_version: number;
    expected_working_draft_version: number;
  },
) => {
  const locked = await lock_edition(
    db,
    { ...input, artifact_id: input.interactive_demo_id },
    "interactive_demo",
  );
  if (!locked) throw new ArtifactEditionNotFoundError();
  assert_writable(locked, input, "interactive_demo");
  const content = await current_demo_content(db, input);
  if (!content) throw new ArtifactEditionNotFoundError();
  return insert_demo_revision(
    db,
    input,
    locked,
    content,
    hash_revision_content(content.canonical),
  );
};

export const create_or_reuse_guide_revision_for_publication = async (
  db: RevisionQueryable,
  input: ScopeBase & {
    guide_id: string;
    expected_edition_version: number;
    expected_working_draft_version: number;
  },
) => {
  const locked = await lock_edition(
    db,
    { ...input, artifact_id: input.guide_id },
    "guide",
  );
  if (!locked) throw new ArtifactEditionNotFoundError();
  assert_writable(locked, input, "guide");
  const content = await current_guide_content(db, input);
  if (!content) throw new ArtifactEditionNotFoundError();
  if (content.detail.guide_blocks.length === 0)
    throw new ArtifactHasNoPublishableContentError();
  return {
    locked,
    ...(await insert_guide_revision(
      db,
      input,
      locked,
      content,
      hash_revision_content(content.canonical),
      "publication",
    )),
  };
};

export const create_or_reuse_demo_revision_for_publication = async (
  db: RevisionQueryable,
  input: ScopeBase & {
    interactive_demo_id: string;
    expected_edition_version: number;
    expected_working_draft_version: number;
  },
) => {
  const locked = await lock_edition(
    db,
    { ...input, artifact_id: input.interactive_demo_id },
    "interactive_demo",
  );
  if (!locked) throw new ArtifactEditionNotFoundError();
  assert_writable(locked, input, "interactive_demo");
  const content = await current_demo_content(db, input);
  if (!content) throw new ArtifactEditionNotFoundError();
  if (content.demo_scenes.length === 0)
    throw new ArtifactHasNoPublishableContentError();
  return {
    locked,
    ...(await insert_demo_revision(
      db,
      input,
      locked,
      content,
      hash_revision_content(content.canonical),
      "publication",
    )),
  };
};

export const create_or_reuse_guide_revision_for_carry_forward = async (
  db: RevisionQueryable,
  input: ScopeBase & { guide_id: string },
) => {
  const locked = await lock_edition(
    db,
    { ...input, artifact_id: input.guide_id },
    "guide",
  );
  if (!locked) throw new ArtifactEditionNotFoundError();
  const content = await current_guide_content(db, input);
  if (!content) throw new ArtifactEditionNotFoundError();
  return {
    locked,
    ...(await insert_guide_revision(
      db,
      input,
      locked,
      content,
      hash_revision_content(content.canonical),
      "carry_forward",
    )),
  };
};

export const create_or_reuse_demo_revision_for_carry_forward = async (
  db: RevisionQueryable,
  input: ScopeBase & { interactive_demo_id: string },
) => {
  const locked = await lock_edition(
    db,
    { ...input, artifact_id: input.interactive_demo_id },
    "interactive_demo",
  );
  if (!locked) throw new ArtifactEditionNotFoundError();
  const content = await current_demo_content(db, input);
  if (!content) throw new ArtifactEditionNotFoundError();
  return {
    locked,
    ...(await insert_demo_revision(
      db,
      input,
      locked,
      content,
      hash_revision_content(content.canonical),
      "carry_forward",
    )),
  };
};

const tombstone = async (
  db: RevisionQueryable,
  table: string,
  draft_column: string,
  draft_id: string,
  actor_id: string,
) =>
  db.query(
    `UPDATE ${table} SET is_deleted=TRUE,deleted_at=CURRENT_TIMESTAMP,deleted_by_id=$2,
  updated_by_id=$2,updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE ${draft_column}=$1 AND is_deleted=FALSE`,
    [draft_id, actor_id],
  );

const restore_guide = async (
  db: RevisionQueryable,
  input: ScopeBase & {
    guide_id: string;
    revision_number: number;
    expected_edition_version: number;
    expected_working_draft_version: number;
  },
) => {
  const locked = await lock_edition(
    db,
    { ...input, artifact_id: input.guide_id },
    "guide",
  );
  if (!locked) throw new ArtifactEditionNotFoundError();
  assert_writable(locked, input, "guide");
  const revision = await get_guide_revision(db, input);
  if (!revision) return null;
  const current = await current_guide_content(db, input);
  if (!current) throw new ArtifactEditionNotFoundError();
  const desired = canonicalize_guide_revision_content({
    title: revision.revision.title,
    description: revision.revision.description,
    blocks: revision.guide_blocks,
  });
  if (
    hash_revision_content(current.canonical) === hash_revision_content(desired)
  )
    return { ...current.detail, revision: revision.revision, restored: false };
  await db.query(
    `UPDATE guide_schema.guide_edition SET title=$1,description=$2,updated_by_id=$3,
    updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$4`,
    [
      revision.revision.title,
      revision.revision.description,
      input.auth.actor_org_user_id,
      locked.edition_id,
    ],
  );
  await db.query(
    `UPDATE guide_schema.guide_working_draft SET updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,
    version=version+1 WHERE id=$2`,
    [input.auth.actor_org_user_id, locked.working_draft_id],
  );
  await tombstone(
    db,
    "guide_schema.guide_annotation",
    "guide_working_draft_id",
    locked.working_draft_id,
    input.auth.actor_org_user_id,
  );
  await tombstone(
    db,
    "guide_schema.guide_step",
    "guide_working_draft_id",
    locked.working_draft_id,
    input.auth.actor_org_user_id,
  );
  await tombstone(
    db,
    "guide_schema.guide_block",
    "guide_working_draft_id",
    locked.working_draft_id,
    input.auth.actor_org_user_id,
  );
  for (const block of revision.guide_blocks) {
    const block_id = ulid();
    await db.query(
      `INSERT INTO guide_schema.guide_block
      (id,organization_id,project_id,guide_working_draft_id,block_type,title,body,block_index,created_by_id,updated_by_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
      [
        block_id,
        input.auth.organization_id,
        input.project_id,
        locked.working_draft_id,
        block.block_type,
        block.title,
        block.body,
        block.block_index,
        input.auth.actor_org_user_id,
      ],
    );
    if (!block.step) continue;
    const step_id = ulid();
    await db.query(
      `INSERT INTO guide_schema.guide_step
      (id,organization_id,project_id,guide_working_draft_id,guide_block_id,source_capture_session_id,
       source_capture_event_id,source_capture_asset_id,selected_capture_asset_id,screenshot_hidden,title,body,created_by_id,updated_by_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)`,
      [
        step_id,
        input.auth.organization_id,
        input.project_id,
        locked.working_draft_id,
        block_id,
        block.step.source_capture_session_id,
        block.step.source_capture_event_id,
        block.step.source_capture_asset_id,
        block.step.selected_capture_asset_id,
        block.step.screenshot_hidden,
        block.step.title,
        block.step.body,
        input.auth.actor_org_user_id,
      ],
    );
    for (const annotation of block.step.annotations)
      await db.query(
        `INSERT INTO guide_schema.guide_annotation
      (id,organization_id,project_id,guide_working_draft_id,guide_step_id,annotation_type,annotation_index,x,y,width,height,
       created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
        [
          ulid(),
          input.auth.organization_id,
          input.project_id,
          locked.working_draft_id,
          step_id,
          annotation.annotation_type,
          annotation.annotation_index,
          annotation.x,
          annotation.y,
          annotation.width,
          annotation.height,
          input.auth.actor_org_user_id,
        ],
      );
  }
  const after = await build_guide_repository(db as never).find_guide_detail({
    organization_id: input.auth.organization_id,
    project_id: input.project_id,
    project_version_id: input.project_version_id,
    guide_id: input.guide_id,
  });
  return { ...after, revision: revision.revision, restored: true };
};

const restore_demo = async (
  db: RevisionQueryable,
  input: ScopeBase & {
    interactive_demo_id: string;
    revision_number: number;
    expected_edition_version: number;
    expected_working_draft_version: number;
  },
) => {
  const locked = await lock_edition(
    db,
    { ...input, artifact_id: input.interactive_demo_id },
    "interactive_demo",
  );
  if (!locked) throw new ArtifactEditionNotFoundError();
  assert_writable(locked, input, "interactive_demo");
  const revision = await get_demo_revision(db, input);
  if (!revision) return null;
  const current = await current_demo_content(db, input);
  if (!current) throw new ArtifactEditionNotFoundError();
  const target_ids = new Map(
    revision.demo_scenes.map((scene) => [scene.id, scene.scene_index]),
  );
  const desired = canonicalize_demo_revision_content({
    title: revision.revision.title,
    description: revision.revision.description,
    scenes: revision.demo_scenes.map((scene) => ({
      ...scene,
      hotspots: scene.hotspots.map((hotspot) => ({
        ...hotspot,
        transition: hotspot.transition
          ? {
              target_scene_id: hotspot.transition.target_demo_revision_scene_id,
            }
          : null,
      })),
    })),
  });
  if (
    hash_revision_content(current.canonical) === hash_revision_content(desired)
  )
    return {
      ...current.detail,
      demo_scenes: current.demo_scenes,
      revision: revision.revision,
      restored: false,
    };
  await db.query(
    `UPDATE interactive_demo_schema.interactive_demo_edition SET title=$1,description=$2,updated_by_id=$3,
    updated_at=CURRENT_TIMESTAMP,version=version+1 WHERE id=$4`,
    [
      revision.revision.title,
      revision.revision.description,
      input.auth.actor_org_user_id,
      locked.edition_id,
    ],
  );
  await db.query(
    `UPDATE interactive_demo_schema.interactive_demo_working_draft SET updated_by_id=$1,updated_at=CURRENT_TIMESTAMP,
    version=version+1 WHERE id=$2`,
    [input.auth.actor_org_user_id, locked.working_draft_id],
  );
  await tombstone(
    db,
    "interactive_demo_schema.demo_transition",
    "interactive_demo_working_draft_id",
    locked.working_draft_id,
    input.auth.actor_org_user_id,
  );
  await tombstone(
    db,
    "interactive_demo_schema.demo_hotspot",
    "interactive_demo_working_draft_id",
    locked.working_draft_id,
    input.auth.actor_org_user_id,
  );
  await tombstone(
    db,
    "interactive_demo_schema.demo_scene",
    "interactive_demo_working_draft_id",
    locked.working_draft_id,
    input.auth.actor_org_user_id,
  );
  const scene_ids = new Map<number, string>();
  for (const scene of revision.demo_scenes) {
    const id = ulid();
    scene_ids.set(scene.scene_index, id);
    await db.query(
      `INSERT INTO interactive_demo_schema.demo_scene
    (id,organization_id,project_id,interactive_demo_working_draft_id,source_capture_session_id,source_capture_event_id,
     source_capture_asset_id,background_capture_asset_id,scene_index,title,description,created_by_id,updated_by_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
      [
        id,
        input.auth.organization_id,
        input.project_id,
        locked.working_draft_id,
        scene.source_capture_session_id,
        scene.source_capture_event_id,
        scene.source_capture_asset_id,
        scene.background_capture_asset_id,
        scene.scene_index,
        scene.title,
        scene.description,
        input.auth.actor_org_user_id,
      ],
    );
  }
  for (const scene of revision.demo_scenes)
    for (const hotspot of scene.hotspots) {
      const id = ulid();
      await db.query(
        `INSERT INTO interactive_demo_schema.demo_hotspot
    (id,organization_id,project_id,interactive_demo_working_draft_id,demo_scene_id,hotspot_type,label,content,x,y,width,height,
     hotspot_index,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
        [
          id,
          input.auth.organization_id,
          input.project_id,
          locked.working_draft_id,
          scene_ids.get(scene.scene_index),
          hotspot.hotspot_type,
          hotspot.label,
          hotspot.content,
          hotspot.x,
          hotspot.y,
          hotspot.width,
          hotspot.height,
          hotspot.hotspot_index,
          input.auth.actor_org_user_id,
        ],
      );
      if (hotspot.transition) {
        const target_index = target_ids.get(
          hotspot.transition.target_demo_revision_scene_id,
        )!;
        await db.query(
          `INSERT INTO interactive_demo_schema.demo_transition
      (id,organization_id,project_id,interactive_demo_working_draft_id,demo_hotspot_id,target_scene_id,created_by_id,updated_by_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$7)`,
          [
            ulid(),
            input.auth.organization_id,
            input.project_id,
            locked.working_draft_id,
            id,
            scene_ids.get(target_index),
            input.auth.actor_org_user_id,
          ],
        );
      }
    }
  const after = await current_demo_content(db, input);
  return {
    ...after?.detail,
    demo_scenes: after?.demo_scenes ?? [],
    revision: revision.revision,
    restored: true,
  };
};

const revision_assets = async (
  db: RevisionQueryable,
  ids: string[],
  input: { auth: Auth; project_id: string },
) => {
  if (!ids.length) return [];
  const result = await db.query<{
    id: string;
    capture_session_id: string;
    status: "active" | "archived";
    mime_type: string;
    width: number | null;
    height: number | null;
  }>(
    `SELECT asset.id,asset.capture_session_id,asset.status,file_record.mime_type,asset.width,asset.height
     FROM capture_schema.capture_asset asset JOIN file_schema.file file_record ON file_record.id=asset.file_id
     WHERE asset.organization_id=$1 AND asset.project_id=$2 AND asset.id=ANY($3::varchar[])
       AND asset.is_deleted=FALSE AND file_record.is_deleted=FALSE`,
    [input.auth.organization_id, input.project_id, ids],
  );
  return result.rows.map((row) => ({
    ...row,
    file_url: `/api/v1/projects/${input.project_id}/capture-sessions/${row.capture_session_id}/assets/${row.id}/file`,
  }));
};

type RevisionScope = {
  auth: Auth;
  project_id: string;
  project_version_id: string;
  revision_number: number;
};

const get_guide_revision = async (
  db: RevisionQueryable,
  input: RevisionScope & { guide_id: string },
): Promise<GuideRevisionDetail | null> => {
  const root = await db.query<RevisionRow>(
    `SELECT revision.id,revision.guide_edition_id AS edition_id,revision.revision_number,
       revision.trigger,revision.title,revision.description,revision.source_working_draft_version,
       revision.created_by_id,revision.created_at
     FROM guide_schema.guide_revision revision
     JOIN guide_schema.guide_edition edition ON edition.id=revision.guide_edition_id
     WHERE revision.organization_id=$1 AND revision.project_id=$2
       AND revision.project_version_id=$3 AND revision.guide_id=$4
       AND revision.revision_number=$5`,
    [
      input.auth.organization_id,
      input.project_id,
      input.project_version_id,
      input.guide_id,
      input.revision_number,
    ],
  );
  const revision = root.rows[0];
  if (!revision) return null;
  const blocks = await db.query<GuideRevisionBlockRow>(
    `SELECT id,block_type,title,body,block_index FROM guide_schema.guide_revision_block
     WHERE guide_revision_id=$1 ORDER BY block_index,id`,
    [revision.id],
  );
  const steps = await db.query<GuideRevisionStepRow>(
    `SELECT id,guide_revision_block_id,source_capture_session_id,source_capture_event_id,
       source_capture_asset_id,selected_capture_asset_id,screenshot_hidden,title,body
     FROM guide_schema.guide_revision_step WHERE guide_revision_id=$1 ORDER BY id`,
    [revision.id],
  );
  const annotations = await db.query<GuideRevisionAnnotationRow>(
    `SELECT id,guide_revision_step_id,annotation_type,annotation_index,x::float8 AS x,y::float8 AS y,
       width::float8 AS width,height::float8 AS height
     FROM guide_schema.guide_revision_annotation WHERE guide_revision_id=$1 ORDER BY annotation_index,id`,
    [revision.id],
  );
  const by_step = new Map<string, GuideRevisionStep["annotations"]>();
  for (const annotation of annotations.rows) {
    const { guide_revision_step_id, ...safe } = annotation;
    const values = by_step.get(guide_revision_step_id) ?? [];
    values.push(safe);
    by_step.set(guide_revision_step_id, values);
  }
  const by_block = new Map(
    steps.rows.map((step) => {
      const { guide_revision_block_id, ...safe } = step;
      return [
        guide_revision_block_id,
        {
          ...safe,
          display_capture_asset_id: safe.screenshot_hidden
            ? null
            : (safe.selected_capture_asset_id ?? safe.source_capture_asset_id),
          annotations: by_step.get(safe.id) ?? [],
        },
      ];
    }),
  );
  const guide_blocks = blocks.rows.map((block) => ({
    ...block,
    step: by_block.get(block.id) ?? null,
  }));
  const asset_ids = [
    ...new Set(
      steps.rows.flatMap((step) =>
        [step.source_capture_asset_id, step.selected_capture_asset_id].filter(
          Boolean,
        ),
      ),
    ),
  ] as string[];
  return {
    revision: summary(revision),
    guide_blocks,
    capture_assets: await revision_assets(db, asset_ids, input),
  };
};

const get_demo_revision = async (
  db: RevisionQueryable,
  input: RevisionScope & { interactive_demo_id: string },
): Promise<InteractiveDemoRevisionDetail | null> => {
  const root = await db.query<RevisionRow>(
    `SELECT revision.id,revision.interactive_demo_edition_id AS edition_id,revision.revision_number,
       revision.trigger,revision.title,revision.description,revision.source_working_draft_version,
       revision.created_by_id,revision.created_at
     FROM interactive_demo_schema.interactive_demo_revision revision
     JOIN interactive_demo_schema.interactive_demo_edition edition ON edition.id=revision.interactive_demo_edition_id
     WHERE revision.organization_id=$1 AND revision.project_id=$2
       AND revision.project_version_id=$3 AND revision.interactive_demo_id=$4
       AND revision.revision_number=$5`,
    [
      input.auth.organization_id,
      input.project_id,
      input.project_version_id,
      input.interactive_demo_id,
      input.revision_number,
    ],
  );
  const revision = root.rows[0];
  if (!revision) return null;
  const scenes = await db.query<DemoRevisionSceneRow>(
    `SELECT id,source_capture_session_id,source_capture_event_id,
    source_capture_asset_id,background_capture_asset_id,scene_index,title,description
    FROM interactive_demo_schema.demo_revision_scene WHERE interactive_demo_revision_id=$1 ORDER BY scene_index,id`,
    [revision.id],
  );
  const hotspots = await db.query<DemoRevisionHotspotRow>(
    `SELECT id,demo_revision_scene_id,hotspot_type,label,content,
    x::float8 AS x,y::float8 AS y,width::float8 AS width,height::float8 AS height,hotspot_index
    FROM interactive_demo_schema.demo_revision_hotspot WHERE interactive_demo_revision_id=$1 ORDER BY hotspot_index,id`,
    [revision.id],
  );
  const transitions = await db.query<DemoRevisionTransitionRow>(
    `SELECT id,demo_revision_hotspot_id,target_demo_revision_scene_id
    FROM interactive_demo_schema.demo_revision_transition WHERE interactive_demo_revision_id=$1 ORDER BY id`,
    [revision.id],
  );
  const transition_by_hotspot = new Map(
    transitions.rows.map(({ demo_revision_hotspot_id, ...transition }) => [
      demo_revision_hotspot_id,
      transition,
    ]),
  );
  const hotspots_by_scene = new Map<string, DemoRevisionHotspot[]>();
  for (const hotspot of hotspots.rows) {
    const { demo_revision_scene_id, ...safe } = hotspot;
    const values = hotspots_by_scene.get(demo_revision_scene_id) ?? [];
    values.push({
      ...safe,
      transition: transition_by_hotspot.get(safe.id) ?? null,
    });
    hotspots_by_scene.set(demo_revision_scene_id, values);
  }
  const demo_scenes = scenes.rows.map((scene) => ({
    ...scene,
    hotspots: hotspots_by_scene.get(scene.id) ?? [],
  }));
  const asset_ids = [
    ...new Set(
      scenes.rows.flatMap((scene) =>
        [
          scene.source_capture_asset_id,
          scene.background_capture_asset_id,
        ].filter(Boolean),
      ),
    ),
  ] as string[];
  return {
    revision: summary(revision),
    demo_scenes,
    capture_assets: await revision_assets(db, asset_ids, input),
  };
};

const history = async (
  db: RevisionQueryable,
  input: HistoryInput & { artifact_id: string },
  kind: "guide" | "interactive_demo",
) => {
  const edition_table =
    kind === "guide"
      ? "guide_schema.guide_edition"
      : "interactive_demo_schema.interactive_demo_edition";
  const artifact_column = kind === "guide" ? "guide_id" : "interactive_demo_id";
  const revision_table =
    kind === "guide"
      ? "guide_schema.guide_revision"
      : "interactive_demo_schema.interactive_demo_revision";
  const revision_edition_column =
    kind === "guide" ? "guide_edition_id" : "interactive_demo_edition_id";
  const edition = await db.query<{ id: string }>(
    `SELECT id FROM ${edition_table} WHERE organization_id=$1 AND project_id=$2 AND project_version_id=$3 AND ${artifact_column}=$4`,
    [
      input.auth.organization_id,
      input.project_id,
      input.project_version_id,
      input.artifact_id,
    ],
  );
  const edition_id = edition.rows[0]?.id;
  if (!edition_id) return null;
  const result = await db.query<RevisionRow>(
    `SELECT id, ${revision_edition_column} AS edition_id, revision_number, trigger, title, description, source_working_draft_version, created_by_id, created_at
     FROM ${revision_table}
     WHERE ${revision_edition_column}=$1 AND revision_number < $2
     ORDER BY revision_number DESC LIMIT $3`,
    [
      edition_id,
      input.before_revision_number ?? 2_147_483_647,
      input.limit + 1,
    ],
  );
  const has_more = result.rows.length > input.limit;
  const visible = result.rows.slice(0, input.limit).map((row) => ({
    ...row,
    created_at: row.created_at.toISOString(),
  }));
  return {
    revisions: visible,
    next_before_revision_number:
      has_more && visible.length
        ? visible[visible.length - 1]!.revision_number
        : null,
  };
};

export const build_artifact_revision_repository = (db: RevisionQueryable) => ({
  checkpoint_guide(
    input: ScopeBase & {
      guide_id: string;
      expected_edition_version: number;
      expected_working_draft_version: number;
    },
  ) {
    return checkpoint_guide(db, input);
  },
  list_guide_revisions(input: HistoryInput & { guide_id: string }) {
    return history(db, { ...input, artifact_id: input.guide_id }, "guide").then(
      (result) =>
        result ?? { revisions: [], next_before_revision_number: null },
    );
  },
  list_interactive_demo_revisions(
    input: HistoryInput & { interactive_demo_id: string },
  ) {
    return history(
      db,
      { ...input, artifact_id: input.interactive_demo_id },
      "interactive_demo",
    ).then(
      (result) =>
        result ?? { revisions: [], next_before_revision_number: null },
    );
  },
  get_guide_revision(input: RevisionScope & { guide_id: string }) {
    return get_guide_revision(db, input);
  },
  restore_guide_revision(
    input: RevisionScope & {
      guide_id: string;
      expected_edition_version: number;
      expected_working_draft_version: number;
    },
  ) {
    return restore_guide(db, input);
  },
  checkpoint_interactive_demo(
    input: ScopeBase & {
      interactive_demo_id: string;
      expected_edition_version: number;
      expected_working_draft_version: number;
    },
  ) {
    return checkpoint_demo(db, input);
  },
  get_interactive_demo_revision(
    input: RevisionScope & { interactive_demo_id: string },
  ) {
    return get_demo_revision(db, input);
  },
  restore_interactive_demo_revision(
    input: RevisionScope & {
      interactive_demo_id: string;
      expected_edition_version: number;
      expected_working_draft_version: number;
    },
  ) {
    return restore_demo(db, input);
  },
});
