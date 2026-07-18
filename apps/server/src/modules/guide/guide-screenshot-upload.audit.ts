import { validate_audit_event, type AuditSourceType } from "@repo/audit-domain";
import { ulid } from "ulid";
import { build_capture_asset_created_event } from "../capture-asset/capture-asset.audit";
import {
  build_capture_asset_transactional_repository,
  build_uncovered_capture_asset_repository,
} from "../capture-asset/capture-asset.repository";
import {
  build_capture_asset_service,
  InvalidCaptureAssetUploadError,
  type CaptureAsset,
  type CaptureAssetFileStorage,
  type CaptureAssetRepository,
  type UploadCaptureAssetInput,
} from "../capture-asset/capture-asset.service";
import { find_audit_command } from "../audit/audit-coverage-registry";
import { resolve_org_user_audit_context } from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_guide_repository } from "./guide.repository";
import { build_guide_audit_event } from "./guide.audit";
import type { GuideBlock, GuideDetail } from "./guide.service";

type Pool = Parameters<typeof build_uncovered_capture_asset_repository>[0];

export type GuideScreenshotUploadInput = {
  auth: { organization_id: string; actor_org_user_id: string };
  project_id: string;
  guide_id: string;
  guide_block_id: string;
  capture_session_id: string;
  file: {
    stream: NodeJS.ReadableStream;
    mime_type: string;
    original_name?: string | null;
    declared_size_bytes?: number;
  };
  data: UploadCaptureAssetInput;
};

export const build_audited_guide_screenshot_upload_service = (
  pool: Pool,
  options: { file_storage: CaptureAssetFileStorage; max_upload_bytes: number },
) => ({
  async upload(input: GuideScreenshotUploadInput): Promise<{ capture_asset: CaptureAsset; guide_block: GuideBlock }> {
    let guide_block: GuideBlock | null = null;
    const uncovered = build_uncovered_capture_asset_repository(pool);
    const repository: CaptureAssetRepository = {
      ...uncovered,
      async transaction(callback) {
        const event_id = ulid();
        const occurred_at = new Date().toISOString();
        let before: GuideDetail | null = null;
        let after: GuideDetail | null = null;
        let actor_context: Awaited<ReturnType<typeof resolve_org_user_audit_context>> | null = null;
        let source_type: AuditSourceType = "web";
        const result = await run_audited_mutation({
          pool,
          event_id,
          command: find_audit_command("guide.block.screenshot_upload"),
          context: async (client) => {
            await client.query("SELECT id FROM guide_schema.guide WHERE id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE FOR UPDATE", [input.guide_id, input.project_id, input.auth.organization_id]);
            const guide_repository = build_guide_repository(client);
            before = await guide_repository.find_guide_detail({ organization_id: input.auth.organization_id, project_id: input.project_id, guide_id: input.guide_id });
            const block = before?.guide_blocks.find((row) => row.id === input.guide_block_id);
            if (!block || block.block_type !== "step") throw new InvalidCaptureAssetUploadError();
            const provenance = await client.query<{ source_type: string }>("SELECT source_type FROM capture_schema.capture_session WHERE id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE", [input.capture_session_id, input.project_id, input.auth.organization_id]);
            const raw = provenance.rows[0]?.source_type;
            source_type = raw === "extension" || raw === "import" ? raw : "web";
            actor_context = await resolve_org_user_audit_context(client, { organization_id: input.auth.organization_id, actor_org_user_id: input.auth.actor_org_user_id, source_type });
            return actor_context.mutation;
          },
          execute: async (client) => {
            const asset = await callback(build_capture_asset_transactional_repository(client)) as CaptureAsset;
            const guide_repository = build_guide_repository(client);
            guide_block = await guide_repository.update_guide_block_screenshot({
              organization_id: input.auth.organization_id,
              project_id: input.project_id,
              guide_id: input.guide_id,
              guide_block_id: input.guide_block_id,
              actor_org_user_id: input.auth.actor_org_user_id,
              data: { selected_capture_asset_id: asset.id, screenshot_hidden: false },
            });
            after = await guide_repository.find_guide_detail({ organization_id: input.auth.organization_id, project_id: input.project_id, guide_id: input.guide_id });
            return asset;
          },
          build_event: (asset) => {
            const asset_event = build_capture_asset_created_event({ event_id, asset, actor_org_user_id: input.auth.actor_org_user_id, actor_label: actor_context!.actor_label, occurred_at, source_type, action: "guide.block.screenshot_uploaded" });
            const guide_event = build_guide_audit_event({ event_id, occurred_at, actor: { organization_id: input.auth.organization_id, project_id: input.project_id, actor_org_user_id: input.auth.actor_org_user_id }, context: actor_context!, action: "guide.block.screenshot_uploaded", before, after });
            if (!guide_event) return null;
            return validate_audit_event({ ...guide_event, items: [...asset_event.items, ...guide_event.items] });
          },
          write_audit_event,
        });
        return result as Awaited<ReturnType<typeof callback>>;
      },
    };
    const service = build_capture_asset_service(repository, options);
    const capture_asset = await service.upload_capture_asset({ auth: input.auth, project_id: input.project_id, capture_session_id: input.capture_session_id, file: input.file, data: input.data });
    return { capture_asset, guide_block: guide_block! };
  },
});
