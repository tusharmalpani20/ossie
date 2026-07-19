import { describe, expect, it } from "vitest";
import type { GuideBlock } from "@repo/types/guide";
import { annotationsFromBlock, blockContentDraftsFromBlocks } from "./guideEditorHelpers";

const now = "2026-07-19T10:00:00.000Z";
const block: GuideBlock = {
  id: "block_1", organization_id: "org_1", project_id: "project_1", guide_working_draft_id: "draft_1", block_type: "step", title: null, body: null, block_index: 1, created_by_id: "user_1", updated_by_id: "user_1", version: 1, created_at: now, updated_at: now,
  step: { id: "step_1", organization_id: "org_1", project_id: "project_1", guide_working_draft_id: "draft_1", guide_block_id: "block_1", source_capture_session_id: null, source_capture_event_id: null, source_capture_asset_id: null, selected_capture_asset_id: null, screenshot_hidden: false, display_capture_asset_id: null, title: "Step", body: null, created_by_id: "user_1", updated_by_id: "user_1", version: 1, created_at: now, updated_at: now, annotations: [{ id: "annotation_1", organization_id: "org_1", project_id: "project_1", guide_working_draft_id: "draft_1", guide_step_id: "step_1", annotation_type: "highlight", annotation_index: 1, x: 0.1, y: 0.2, width: 0.3, height: 0.4, created_by_id: "user_1", updated_by_id: "user_1", version: 1, created_at: now, updated_at: now }] },
};

describe("guide editor helpers", () => {
  it("projects relational annotations into editor annotations", () => expect(annotationsFromBlock(block)).toEqual([expect.objectContaining({ id: "annotation_1", type: "highlight" })]));
  it("reads block text from relational columns", () => expect(blockContentDraftsFromBlocks([{ ...block, block_type: "tip", title: "Tip", body: "Body", step: null }]).block_1).toEqual({ title: "Tip", body: "Body" }));
});
