import { describe, expect, it } from "vitest";
import { render_guide_html_export, render_guide_markdown } from "./guide-export-policy";
import type { GuideDetail } from "@repo/types/guide";

const detail: GuideDetail = {
  artifact: {
    id: "guide_1",
    organization_id: "org_1",
    project_id: "project_1",
    created_by_id: "org_user_1",
    created_at: "2026-07-07T00:00:00.000Z",
  },
  edition: {
    id: "edition_1",
    organization_id: "org_1",
    project_id: "project_1",
    guide_id: "guide_1",
    project_version_id: "version_1",
    source_capture_session_id: "session_1",
    title: "Setup [Guide]",
    description: "Line 1\r\nLine 2",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  },
  working_draft: {
    id: "draft_1",
    organization_id: "org_1",
    project_id: "project_1",
    guide_edition_id: "edition_1",
    version: 1,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  },
  authored_updated_at: "2026-07-07T00:00:00.000Z",
  guide_blocks: [{
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
      title: "Click [Save]",
      body: "Then continue.",
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
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.4,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-07-07T00:00:00.000Z",
        updated_at: "2026-07-07T00:00:00.000Z",
      }],
    },
  }],
  source_capture_assets: [{
    id: "asset_1",
    capture_session_id: "session_1",
    asset_type: "screenshot",
    width: 1280,
    height: 720,
    device_pixel_ratio: 1,
    page_url: "https://example.test/a path",
    page_title: "Settings",
    captured_at: "2026-07-07T00:00:00.000Z",
    file_url: "/files/screen(1).png",
    file: {
      id: "file_1",
      original_name: "screen.png",
      mime_type: "image/png",
      size_bytes: 100,
    },
  }],
};

describe("guide export policy", () => {
  it("renders deterministic markdown with escaped text and absolute screenshot URLs", () => {
    expect(render_guide_markdown(detail, "https://demo.test")).toContain("# Setup \\[Guide\\]");
    expect(render_guide_markdown(detail, "https://demo.test")).toContain("![Settings](https://demo.test/files/screen%281%29.png)");
    expect(render_guide_markdown(detail, "https://demo.test")).toContain("Highlight 1: x 10%, y 20%, width 30%, height 40%");
  });

  it("renders HTML export with escaped content and image references", () => {
    const rendered = render_guide_html_export(detail);

    expect(rendered.html).toContain("<title>Setup [Guide]</title>");
    expect(rendered.html).toContain("Click [Save]");
    expect(rendered.html).toContain("annotation annotation-highlight");
    expect(rendered.image_references).toEqual([{
      capture_asset_id: "asset_1",
      asset_path: "assets/1-asset_1.png",
      mime_type: "image/png",
    }]);
  });
});
