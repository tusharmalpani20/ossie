import { describe, expect, it } from "vitest";
import {
  InvalidGuideBlockContentError,
  InvalidGuideBlockOrderError,
  InvalidGuideBlockScreenshotError,
  assert_guide_block_order_covers_active_blocks,
  normalize_create_guide_block_input,
  normalize_guide_block_ids,
  normalize_update_guide_block_annotations_input,
  normalize_update_guide_block_screenshot_input,
} from "./guide-block-policy";
import type { GuideBlock } from "@repo/types/guide";

const step_block: GuideBlock = {
  id: "block_1",
  organization_id: "org_1",
  project_id: "project_1",
  guide_working_draft_id: "draft_1",
  block_type: "step",
  title: null,
  body: null,
  block_index: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
  step: {
    id: "step_1",
    organization_id: "org_1",
    project_id: "project_1",
    guide_working_draft_id: "draft_1",
    guide_block_id: "block_1",
    source_capture_session_id: "session_1",
    source_capture_event_id: "event_1",
    source_capture_asset_id: "asset_1",
    selected_capture_asset_id: null,
    screenshot_hidden: false,
    display_capture_asset_id: "asset_1",
    title: "Step",
    body: null,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
    annotations: [{
      id: "ann_1",
      organization_id: "org_1",
      project_id: "project_1",
      guide_working_draft_id: "draft_1",
      guide_step_id: "step_1",
      annotation_type: "highlight",
      annotation_index: 1,
      x: 0,
      y: 0,
      width: 0.1,
      height: 0.1,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-07-07T00:00:00.000Z",
      updated_at: "2026-07-07T00:00:00.000Z",
    }],
  },
};

describe("guide block policy", () => {
  it("normalizes create block content by block type", () => {
    expect(normalize_create_guide_block_input({
      block_type: "step",
      position: { placement: "after", guide_block_id: " block_1 " },
      step: { title: " New step ", body: " " },
    })).toEqual({
      block_type: "step",
      position: { placement: "after", guide_block_id: "block_1" },
      step: { title: "New step", body: null },
    });

    expect(normalize_create_guide_block_input({
      block_type: "paragraph",
      body: " Body ",
    })).toEqual({
      block_type: "paragraph",
      title: null,
      body: "Body",
    });

    expect(() => normalize_create_guide_block_input({
      block_type: "paragraph",
      title: "No",
      body: "Body",
    })).toThrow(InvalidGuideBlockContentError);
  });

  it("validates full block reorder sets", () => {
    expect(normalize_guide_block_ids([" block_2 ", "block_1"])).toEqual(["block_2", "block_1"]);
    expect(() => normalize_guide_block_ids(["block_1", " block_1 "])).toThrow(InvalidGuideBlockOrderError);

    expect(() => assert_guide_block_order_covers_active_blocks(["block_1"], [
      { id: "block_1" },
      { id: "block_2" },
    ])).toThrow(InvalidGuideBlockOrderError);
  });

  it("normalizes screenshot selection and validates annotations with injected ids", () => {
    expect(normalize_update_guide_block_screenshot_input({
      capture_asset_id: " ",
      expected_working_draft_version: 1,
    })).toEqual({
      selected_capture_asset_id: null,
      screenshot_hidden: true,
    });

    expect(normalize_update_guide_block_screenshot_input({
      capture_asset_id: " asset_2 ",
      expected_working_draft_version: 1,
    })).toEqual({
      selected_capture_asset_id: "asset_2",
      screenshot_hidden: false,
    });

    expect(normalize_update_guide_block_annotations_input(step_block, {
      annotations: [
        { id: "ann_1", type: "highlight", x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
        { type: "highlight", x: 0, y: 0, width: 1, height: 1 },
      ],
      expected_working_draft_version: 1,
    }, () => "ann_new")).toEqual({
      annotations: [
        { id: "ann_1", annotation_type: "highlight", annotation_index: 1, x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
        { id: "ann_new", annotation_type: "highlight", annotation_index: 2, x: 0, y: 0, width: 1, height: 1 },
      ],
    });

    expect(() => normalize_update_guide_block_annotations_input({
      ...step_block,
      step: { ...step_block.step!, screenshot_hidden: true },
    }, { annotations: [], expected_working_draft_version: 1 }, () => "ann_new"))
      .toThrow(InvalidGuideBlockContentError);

    expect(() => normalize_update_guide_block_annotations_input(step_block, {
      annotations: [{ type: "highlight", x: 0.9, y: 0, width: 0.2, height: 0.1 }],
      expected_working_draft_version: 1,
    }, () => "ann_new")).toThrow(InvalidGuideBlockContentError);

    expect(() => {
      if (step_block.block_type !== "header") {
        throw new InvalidGuideBlockScreenshotError();
      }
    }).toThrow(InvalidGuideBlockScreenshotError);
  });
});
