import { ulid } from "ulid";
import type { ArtifactCarryForwardResponse } from "@repo/types";
import {
  create_or_reuse_demo_revision_for_carry_forward,
  create_or_reuse_guide_revision_for_carry_forward,
  build_artifact_revision_repository,
  type RevisionQueryable,
} from "../artifact-revision/artifact-revision.repository";
import {
  ArtifactCarryForwardIdempotencyConflictError,
  ArtifactCarryForwardProjectVersionNotFoundError,
  ArtifactCarryForwardTargetConflictError,
  ArtifactCarryForwardTargetReadOnlyError,
  type PersistedCarryForwardInput,
} from "./artifact-carry-forward.service";

type OperationRow = {
  id: string;
  source_project_version_id: string;
  target_project_version_id: string;
  created_by_id: string;
  created_at: Date;
  request_fingerprint_sha256: string;
};

const replay = async (
  db: RevisionQueryable,
  row: OperationRow,
): Promise<ArtifactCarryForwardResponse> => {
  const items = await db.query<ArtifactCarryForwardResponse["items"][number]>(
    `
    SELECT root.artifact_type,root.artifact_id,
      COALESCE(guide.source_guide_edition_id,demo.source_interactive_demo_edition_id) AS source_edition_id,
      COALESCE(guide.source_guide_revision_id,demo.source_interactive_demo_revision_id) AS source_revision_id,
      COALESCE(guide_revision.revision_number,demo_revision.revision_number) AS source_revision_number,
      COALESCE(guide.target_guide_edition_id,demo.target_interactive_demo_edition_id) AS target_edition_id,
      COALESCE(guide.target_guide_working_draft_id,demo.target_interactive_demo_working_draft_id) AS target_working_draft_id
    FROM project_schema.artifact_carry_forward_item root
    LEFT JOIN guide_schema.guide_carry_forward_item guide ON guide.artifact_carry_forward_item_id=root.id
    LEFT JOIN guide_schema.guide_revision guide_revision ON guide_revision.id=guide.source_guide_revision_id
    LEFT JOIN interactive_demo_schema.interactive_demo_carry_forward_item demo ON demo.artifact_carry_forward_item_id=root.id
    LEFT JOIN interactive_demo_schema.interactive_demo_revision demo_revision ON demo_revision.id=demo.source_interactive_demo_revision_id
    WHERE root.artifact_carry_forward_id=$1 ORDER BY root.item_index`,
    [row.id],
  );
  return {
    carry_forward: {
      id: row.id,
      source_project_version_id: row.source_project_version_id,
      target_project_version_id: row.target_project_version_id,
      created_by_id: row.created_by_id,
      created_at: row.created_at.toISOString(),
    },
    items: items.rows,
    replayed: true,
  };
};

export const build_artifact_carry_forward_repository = (
  db: RevisionQueryable,
) => ({
  async carry_forward(
    input: PersistedCarryForwardInput,
  ): Promise<ArtifactCarryForwardResponse> {
    const project = await db.query<{ id: string }>(
      `SELECT id FROM project_schema.project
       WHERE id=$1 AND organization_id=$2 AND is_deleted=FALSE
       FOR UPDATE`,
      [input.project_id, input.auth.organization_id],
    );
    if (project.rows.length !== 1) {
      throw new ArtifactCarryForwardProjectVersionNotFoundError();
    }
    const prior = (
      await db.query<OperationRow>(
        `SELECT id,source_project_version_id,target_project_version_id,
      created_by_id,created_at,request_fingerprint_sha256 FROM project_schema.artifact_carry_forward
      WHERE organization_id=$1 AND project_id=$2 AND created_by_id=$3 AND idempotency_key_hash=$4`,
        [
          input.auth.organization_id,
          input.project_id,
          input.auth.actor_org_user_id,
          input.idempotency_key_hash,
        ],
      )
    ).rows[0];
    if (prior) {
      if (prior.request_fingerprint_sha256 !== input.request_fingerprint_sha256)
        throw new ArtifactCarryForwardIdempotencyConflictError();
      return replay(db, prior);
    }
    const versions = await db.query<{
      id: string;
      status: "active" | "archived";
    }>(
      `SELECT id,status FROM project_schema.project_version
      WHERE organization_id=$1 AND project_id=$2 AND id=ANY($3::varchar[]) ORDER BY id FOR UPDATE`,
      [
        input.auth.organization_id,
        input.project_id,
        [input.source_project_version_id, input.target_project_version_id],
      ],
    );
    if (versions.rows.length !== 2)
      throw new ArtifactCarryForwardProjectVersionNotFoundError();
    if (
      versions.rows.find(({ id }) => id === input.target_project_version_id)
        ?.status !== "active"
    )
      throw new ArtifactCarryForwardTargetReadOnlyError();
    const guide_ids = input.artifacts
      .filter(({ artifact_type }) => artifact_type === "guide")
      .map(({ artifact_id }) => artifact_id);
    const demo_ids = input.artifacts
      .filter(({ artifact_type }) => artifact_type === "interactive_demo")
      .map(({ artifact_id }) => artifact_id);
    const blockers = (
      await db.query<{
        artifact_type: "guide" | "interactive_demo";
        artifact_id: string;
      }>(
        `
      SELECT 'guide'::text artifact_type,guide_id artifact_id FROM guide_schema.guide_edition
       WHERE organization_id=$1 AND project_id=$2 AND project_version_id=$3 AND guide_id=ANY($4::varchar[])
      UNION ALL SELECT 'interactive_demo',interactive_demo_id FROM interactive_demo_schema.interactive_demo_edition
       WHERE organization_id=$1 AND project_id=$2 AND project_version_id=$3 AND interactive_demo_id=ANY($5::varchar[])`,
        [
          input.auth.organization_id,
          input.project_id,
          input.target_project_version_id,
          guide_ids,
          demo_ids,
        ],
      )
    ).rows;
    if (blockers.length)
      throw new ArtifactCarryForwardTargetConflictError(blockers);
    const operation_id = ulid();
    const operation = (
      await db.query<OperationRow>(
        `INSERT INTO project_schema.artifact_carry_forward
      (id,organization_id,project_id,source_project_version_id,target_project_version_id,idempotency_key_hash,
       request_fingerprint_sha256,selection_count,created_by_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id,source_project_version_id,target_project_version_id,created_by_id,created_at,request_fingerprint_sha256`,
        [
          operation_id,
          input.auth.organization_id,
          input.project_id,
          input.source_project_version_id,
          input.target_project_version_id,
          input.idempotency_key_hash,
          input.request_fingerprint_sha256,
          input.artifacts.length,
          input.auth.actor_org_user_id,
        ],
      )
    ).rows[0]!;
    const items: ArtifactCarryForwardResponse["items"] = [];
    for (let index = 0; index < input.artifacts.length; index++) {
      const selection = input.artifacts[index]!;
      const item_id = ulid();
      await db.query(
        `INSERT INTO project_schema.artifact_carry_forward_item
        (id,organization_id,project_id,artifact_carry_forward_id,item_index,artifact_type,artifact_id)
        VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [
          item_id,
          input.auth.organization_id,
          input.project_id,
          operation_id,
          index + 1,
          selection.artifact_type,
          selection.artifact_id,
        ],
      );
      if (selection.artifact_type === "guide") {
        const source = await create_or_reuse_guide_revision_for_carry_forward(
          db,
          {
            auth: input.auth,
            project_id: input.project_id,
            project_version_id: input.source_project_version_id,
            guide_id: selection.artifact_id,
          },
        );
        const revision = await build_artifact_revision_repository(
          db,
        ).get_guide_revision({
          auth: input.auth,
          project_id: input.project_id,
          project_version_id: input.source_project_version_id,
          guide_id: selection.artifact_id,
          revision_number: source.revision.revision_number,
        });
        if (!revision)
          throw new ArtifactCarryForwardProjectVersionNotFoundError();
        const edition_id = ulid(),
          draft_id = ulid();
        await db.query(
          `INSERT INTO guide_schema.guide_edition
          (id,organization_id,project_id,guide_id,project_version_id,source_capture_session_id,title,description,status,
           source_guide_edition_id,source_guide_revision_id,created_by_id,updated_by_id)
          VALUES($1,$2,$3,$4,$5,NULL,$6,$7,'draft',$8,$9,$10,$10)`,
          [
            edition_id,
            input.auth.organization_id,
            input.project_id,
            selection.artifact_id,
            input.target_project_version_id,
            revision.revision.title,
            revision.revision.description,
            source.locked.edition_id,
            revision.revision.id,
            input.auth.actor_org_user_id,
          ],
        );
        await db.query(
          `INSERT INTO guide_schema.guide_working_draft
          (id,organization_id,project_id,guide_edition_id,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$5)`,
          [
            draft_id,
            input.auth.organization_id,
            input.project_id,
            edition_id,
            input.auth.actor_org_user_id,
          ],
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
              draft_id,
              block.block_type,
              block.title,
              block.body,
              block.block_index,
              input.auth.actor_org_user_id,
            ],
          );
          if (block.step) {
            const step_id = ulid();
            const effective = block.step.screenshot_hidden
              ? null
              : (block.step.selected_capture_asset_id ??
                block.step.source_capture_asset_id);
            await db.query(
              `INSERT INTO guide_schema.guide_step
            (id,organization_id,project_id,guide_working_draft_id,guide_block_id,source_capture_session_id,source_capture_event_id,
             source_capture_asset_id,selected_capture_asset_id,screenshot_hidden,title,body,created_by_id,updated_by_id)
            VALUES($1,$2,$3,$4,$5,NULL,NULL,NULL,$6,$7,$8,$9,$10,$10)`,
              [
                step_id,
                input.auth.organization_id,
                input.project_id,
                draft_id,
                block_id,
                effective,
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
                  draft_id,
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
        }
        await db.query(
          `INSERT INTO guide_schema.guide_carry_forward_item
          (artifact_carry_forward_item_id,organization_id,project_id,guide_id,source_guide_edition_id,source_guide_revision_id,
           target_guide_edition_id,target_guide_working_draft_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            item_id,
            input.auth.organization_id,
            input.project_id,
            selection.artifact_id,
            source.locked.edition_id,
            revision.revision.id,
            edition_id,
            draft_id,
          ],
        );
        items.push({
          artifact_type: "guide",
          artifact_id: selection.artifact_id,
          source_edition_id: source.locked.edition_id,
          source_revision_id: revision.revision.id,
          source_revision_number: revision.revision.revision_number,
          target_edition_id: edition_id,
          target_working_draft_id: draft_id,
        });
      } else {
        const source = await create_or_reuse_demo_revision_for_carry_forward(
          db,
          {
            auth: input.auth,
            project_id: input.project_id,
            project_version_id: input.source_project_version_id,
            interactive_demo_id: selection.artifact_id,
          },
        );
        const revision = await build_artifact_revision_repository(
          db,
        ).get_interactive_demo_revision({
          auth: input.auth,
          project_id: input.project_id,
          project_version_id: input.source_project_version_id,
          interactive_demo_id: selection.artifact_id,
          revision_number: source.revision.revision_number,
        });
        if (!revision)
          throw new ArtifactCarryForwardProjectVersionNotFoundError();
        const edition_id = ulid(),
          draft_id = ulid();
        await db.query(
          `INSERT INTO interactive_demo_schema.interactive_demo_edition
          (id,organization_id,project_id,interactive_demo_id,project_version_id,source_capture_session_id,title,description,status,
           source_interactive_demo_edition_id,source_interactive_demo_revision_id,created_by_id,updated_by_id)
          VALUES($1,$2,$3,$4,$5,NULL,$6,$7,'draft',$8,$9,$10,$10)`,
          [
            edition_id,
            input.auth.organization_id,
            input.project_id,
            selection.artifact_id,
            input.target_project_version_id,
            revision.revision.title,
            revision.revision.description,
            source.locked.edition_id,
            revision.revision.id,
            input.auth.actor_org_user_id,
          ],
        );
        await db.query(
          `INSERT INTO interactive_demo_schema.interactive_demo_working_draft
          (id,organization_id,project_id,interactive_demo_edition_id,created_by_id,updated_by_id) VALUES($1,$2,$3,$4,$5,$5)`,
          [
            draft_id,
            input.auth.organization_id,
            input.project_id,
            edition_id,
            input.auth.actor_org_user_id,
          ],
        );
        const scene_ids = new Map<string, string>();
        for (const scene of revision.demo_scenes) {
          const id = ulid();
          scene_ids.set(scene.id, id);
          const effective =
            scene.background_capture_asset_id ?? scene.source_capture_asset_id;
          await db.query(
            `INSERT INTO interactive_demo_schema.demo_scene
            (id,organization_id,project_id,interactive_demo_working_draft_id,source_capture_session_id,source_capture_event_id,
             source_capture_asset_id,background_capture_asset_id,scene_index,title,description,created_by_id,updated_by_id)
            VALUES($1,$2,$3,$4,NULL,NULL,NULL,$5,$6,$7,$8,$9,$9)`,
            [
              id,
              input.auth.organization_id,
              input.project_id,
              draft_id,
              effective,
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
                draft_id,
                scene_ids.get(scene.id),
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
            if (hotspot.transition)
              await db.query(
                `INSERT INTO interactive_demo_schema.demo_transition
            (id,organization_id,project_id,interactive_demo_working_draft_id,demo_hotspot_id,target_scene_id,created_by_id,updated_by_id)
            VALUES($1,$2,$3,$4,$5,$6,$7,$7)`,
                [
                  ulid(),
                  input.auth.organization_id,
                  input.project_id,
                  draft_id,
                  id,
                  scene_ids.get(
                    hotspot.transition.target_demo_revision_scene_id,
                  ),
                  input.auth.actor_org_user_id,
                ],
              );
          }
        await db.query(
          `INSERT INTO interactive_demo_schema.interactive_demo_carry_forward_item
          (artifact_carry_forward_item_id,organization_id,project_id,interactive_demo_id,source_interactive_demo_edition_id,
           source_interactive_demo_revision_id,target_interactive_demo_edition_id,target_interactive_demo_working_draft_id)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            item_id,
            input.auth.organization_id,
            input.project_id,
            selection.artifact_id,
            source.locked.edition_id,
            revision.revision.id,
            edition_id,
            draft_id,
          ],
        );
        items.push({
          artifact_type: "interactive_demo",
          artifact_id: selection.artifact_id,
          source_edition_id: source.locked.edition_id,
          source_revision_id: revision.revision.id,
          source_revision_number: revision.revision.revision_number,
          target_edition_id: edition_id,
          target_working_draft_id: draft_id,
        });
      }
    }
    return {
      carry_forward: {
        id: operation.id,
        source_project_version_id: operation.source_project_version_id,
        target_project_version_id: operation.target_project_version_id,
        created_by_id: operation.created_by_id,
        created_at: operation.created_at.toISOString(),
      },
      items,
      replayed: false,
    };
  },
});
