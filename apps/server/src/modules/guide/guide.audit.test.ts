import { describe, expect, it } from "vitest";
import { build_guide_snapshot_changes } from "./guide.audit";
import type { GuideDetail } from "./guide.service";

const detail = (index: number, content: string): GuideDetail => ({
  guide: { id: "guide_1", organization_id: "org_1", project_id: "project_1", source_capture_session_id: null, title: "Guide", description: null, status: "draft", created_by_id: "user_1", updated_by_id: "user_1", version: 1, created_at: "2026-07-19T00:00:00.000Z", updated_at: "2026-07-19T00:00:00.000Z" },
  guide_blocks: [{ id: "block_1", organization_id: "org_1", project_id: "project_1", guide_id: "guide_1", source_capture_session_id: null, source_capture_event_id: null, source_capture_asset_id: null, selected_capture_asset_id: null, screenshot_hidden: false, display_capture_asset_id: null, block_type: "header", content: { title: content }, block_index: index, created_by_id: "user_1", updated_by_id: "user_1", version: 1, created_at: "2026-07-19T00:00:00.000Z", updated_at: "2026-07-19T00:00:00.000Z", step: null }],
  source_capture_assets: [],
});

describe("Guide Audit adapter", () => {
  it("describes logical order and redacts Guide Block content", () => {
    const changes = build_guide_snapshot_changes(detail(1, "private before"), detail(2, "private after"));
    const block = changes.find((change) => change.entity_type === "guide_block")!;
    expect(block.safe_fields).toHaveProperty("block_index", "integer");
    expect(block.redacted_fields).toContain("content");
    expect(JSON.stringify({ safe_fields: block.safe_fields, redacted_fields: block.redacted_fields })).not.toContain("private");
  });
});
