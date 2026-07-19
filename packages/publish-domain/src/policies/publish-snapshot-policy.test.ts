import { describe, expect, it } from "vitest";
import { InteractiveDemoHasNoPublishableScenesError } from "../errors/publish-domain-error";
import {
  build_published_guide_snapshot,
  build_published_interactive_demo_snapshot,
} from "./publish-snapshot-policy";
import type {
  GuidePublishSourceDetail,
  InteractiveDemoPublishSourceDetail,
} from "../types/publish-domain";

const source_asset_1 = {
  id: "asset_1",
  capture_session_id: "capture_session_1",
  asset_type: "screenshot" as const,
  width: 1440,
  height: 900,
  device_pixel_ratio: 1,
  page_url: "https://example.test/one",
  page_title: "One",
  captured_at: "2026-07-07T00:00:00.000Z",
  file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
  file: {
    id: "file_1",
    original_name: "one.png",
    mime_type: "image/png",
    size_bytes: 1234,
  },
};

const source_asset_2 = {
  ...source_asset_1,
  id: "asset_2",
  page_title: "Two",
  file: {
    ...source_asset_1.file,
    id: "file_2",
    original_name: "two.png",
  },
};

const guide_detail: GuidePublishSourceDetail = {
  artifact: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    created_by_id: "org_user_1",
    created_at: "2026-07-07T00:00:00.000Z",
  },
  edition: {
    id: "guide_edition_1",
    organization_id: "organization_1",
    project_id: "project_1",
    guide_id: "guide_1",
    project_version_id: "version_1",
    source_capture_session_id: "capture_session_1",
    title: "Guide",
    description: null,
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  },
  working_draft: {
    id: "guide_draft_1", organization_id: "organization_1", project_id: "project_1",
    guide_edition_id: "guide_edition_1", version: 1, created_by_id: "org_user_1",
    updated_by_id: "org_user_1", created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  },
  guide_blocks: [{
    id: "block_2",
    organization_id: "organization_1",
    project_id: "project_1",
    guide_working_draft_id: "guide_draft_1",
    block_type: "paragraph",
    title: null,
    body: "Second",
    block_index: 2,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
    step: null,
  }, {
    id: "block_1",
    organization_id: "organization_1",
    project_id: "project_1",
    guide_working_draft_id: "guide_draft_1",
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
      organization_id: "organization_1",
      project_id: "project_1",
      guide_working_draft_id: "guide_draft_1",
      guide_block_id: "block_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: "asset_1",
      title: "First",
      body: null,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-07-07T00:00:00.000Z",
      updated_at: "2026-07-07T00:00:00.000Z",
      annotations: [],
    },
  }],
  source_capture_assets: [source_asset_1],
};

const demo_detail: InteractiveDemoPublishSourceDetail = {
  artifact: {
    id: "interactive_demo_1",
    organization_id: "organization_1",
    project_id: "project_1",
    created_by_id: "org_user_1",
    created_at: "2026-07-07T00:00:00.000Z",
  },
  edition: {
    id: "demo_edition_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_id: "interactive_demo_1",
    project_version_id: "version_1",
    source_capture_session_id: "capture_session_1",
    title: "Demo",
    description: null,
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  },
  working_draft: {
    id: "demo_draft_1", organization_id: "organization_1", project_id: "project_1",
    interactive_demo_edition_id: "demo_edition_1", version: 1,
    created_by_id: "org_user_1", updated_by_id: "org_user_1",
    created_at: "2026-07-07T00:00:00.000Z", updated_at: "2026-07-07T00:00:00.000Z",
  },
  demo_scenes: [{
    id: "scene_2",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_working_draft_id: "demo_draft_1",
    source_capture_session_id: "capture_session_1",
    source_capture_event_id: "event_2",
    source_capture_asset_id: "asset_2",
    scene_index: 2,
    title: "Second",
    description: null,
    background_capture_asset_id: "asset_2",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  }, {
    id: "scene_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_working_draft_id: "demo_draft_1",
    source_capture_session_id: "capture_session_1",
    source_capture_event_id: "event_1",
    source_capture_asset_id: "asset_1",
    scene_index: 1,
    title: "First",
    description: null,
    background_capture_asset_id: "asset_1",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  }, {
    id: "scene_without_asset",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_working_draft_id: "demo_draft_1",
    source_capture_session_id: null,
    source_capture_event_id: null,
    source_capture_asset_id: null,
    scene_index: 3,
    title: "Missing",
    description: null,
    background_capture_asset_id: "missing_asset",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  }],
  demo_hotspots: [{
    id: "hotspot_2",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_working_draft_id: "demo_draft_1",
    demo_scene_id: "scene_1",
    hotspot_type: "click",
    label: "Second hotspot",
    content: null,
    x: 0.2,
    y: 0.2,
    width: 0.1,
    height: 0.1,
    transition: {
      id: "transition_2", organization_id: "organization_1", project_id: "project_1",
      interactive_demo_working_draft_id: "demo_draft_1", demo_hotspot_id: "hotspot_2",
      target_scene_id: "missing_scene", created_by_id: "org_user_1", updated_by_id: "org_user_1",
      version: 1, created_at: "2026-07-07T00:00:00.000Z", updated_at: "2026-07-07T00:00:00.000Z",
    },
    hotspot_index: 2,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  }, {
    id: "hotspot_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_working_draft_id: "demo_draft_1",
    demo_scene_id: "scene_1",
    hotspot_type: "next",
    label: "First hotspot",
    content: null,
    x: 0.1,
    y: 0.1,
    width: 0.1,
    height: 0.1,
    transition: {
      id: "transition_1", organization_id: "organization_1", project_id: "project_1",
      interactive_demo_working_draft_id: "demo_draft_1", demo_hotspot_id: "hotspot_1",
      target_scene_id: "scene_2", created_by_id: "org_user_1", updated_by_id: "org_user_1",
      version: 1, created_at: "2026-07-07T00:00:00.000Z", updated_at: "2026-07-07T00:00:00.000Z",
    },
    hotspot_index: 1,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-07-07T00:00:00.000Z",
    updated_at: "2026-07-07T00:00:00.000Z",
  }],
  source_capture_assets: [source_asset_1, source_asset_2],
};

describe("publish snapshot policy", () => {
  it("builds guide snapshots in block order with public asset URLs", () => {
    const snapshot = build_published_guide_snapshot({
      guide_detail,
      version_number: 3,
      published_at: "2026-07-07T00:00:00.000Z",
      slug: "abc123",
    });

    expect(snapshot.blocks.map((block) => block.id)).toEqual(["block_1", "block_2"]);
    expect(snapshot.blocks[0]?.source_asset?.file_url)
      .toBe("/api/v1/public/publish-links/abc123/assets/asset_1/file");
    expect(snapshot.blocks[0]?.step).toEqual({
      id: "step_1",
      title: "First",
      body: null,
    });
  });

  it("builds interactive demo snapshots with ordered scenes and hotspots", () => {
    const snapshot = build_published_interactive_demo_snapshot({
      demo_detail,
      version_number: 2,
      published_at: "2026-07-07T00:00:00.000Z",
      slug: "demo123",
    });

    expect(snapshot.schema_version).toBe(1);
    expect(snapshot.scenes.map((scene) => scene.id)).toEqual(["scene_1", "scene_2"]);
    expect(snapshot.scenes[0]?.hotspots.map((hotspot) => hotspot.id)).toEqual(["hotspot_1", "hotspot_2"]);
    expect(snapshot.scenes[0]?.hotspots[0]?.target_scene_id).toBe("scene_2");
    expect(snapshot.scenes[0]?.hotspots[1]?.target_scene_id).toBeNull();
    expect(snapshot.scenes[0]?.background_asset.file_url)
      .toBe("/api/v1/public/publish-links/demo123/assets/asset_1/file");
  });

  it("rejects interactive demo snapshots without publishable scenes", () => {
    expect(() => build_published_interactive_demo_snapshot({
      demo_detail: {
        ...demo_detail,
        source_capture_assets: [],
      },
      version_number: 1,
      published_at: "2026-07-07T00:00:00.000Z",
      slug: "demo123",
    })).toThrow(InteractiveDemoHasNoPublishableScenesError);
  });
});
