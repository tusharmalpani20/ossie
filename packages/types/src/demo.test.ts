import { describe, expect, it } from "vitest";
import {
  CreateDemoHotspotRequestSchema,
  CreateInteractiveDemoFromCaptureRequestSchema,
  CreateInteractiveDemoFromCaptureResponseSchema,
  DemoTransitionSchema,
  DemoHotspotSchema,
  DemoSceneSchema,
  InteractiveDemoArtifactSchema,
  InteractiveDemoEditionSchema,
  InteractiveDemoWorkingDraftSchema,
  InteractiveDemoWorkingDraftMutationResponseSchema,
  ReorderDemoHotspotsRequestSchema,
  ReorderDemoScenesRequestSchema,
  UpdateDemoHotspotRequestSchema,
  UpdateDemoSceneRequestSchema,
} from "./demo";

const artifact = {
  id: "interactive_demo_1",
  organization_id: "org_1",
  project_id: "project_1",
  created_by_id: "org_user_1",
  created_at: "2026-07-07T00:00:00.000Z",
};

const edition = {
  id: "interactive_demo_edition_1",
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_id: "interactive_demo_1",
  project_version_id: "project_version_1",
  source_capture_session_id: "capture_session_1",
  title: "Department setup",
  description: null,
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const working_draft = {
  id: "interactive_demo_working_draft_1",
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_edition_id: "interactive_demo_edition_1",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const demo_scene = {
  id: "demo_scene_1",
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_working_draft_id: "interactive_demo_working_draft_1",
  source_capture_session_id: "capture_session_1",
  source_capture_event_id: "event_1",
  source_capture_asset_id: "asset_1",
  scene_index: 1,
  title: "Click Add Department",
  description: null,
  background_capture_asset_id: "asset_1",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const transition = {
  id: "transition_1",
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_working_draft_id: "interactive_demo_working_draft_1",
  demo_hotspot_id: "demo_hotspot_1",
  target_scene_id: "demo_scene_2",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const demo_hotspot = {
  id: "demo_hotspot_1",
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_working_draft_id: "interactive_demo_working_draft_1",
  demo_scene_id: "demo_scene_1",
  hotspot_type: "click",
  label: "Continue",
  content: null,
  x: 0.1,
  y: 0.2,
  width: 0.3,
  height: 0.1,
  transition,
  hotspot_index: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

describe("interactive demo shared contracts", () => {
  it("parses identity, edition, working draft, scene, hotspot, and transition DTOs", () => {
    expect(InteractiveDemoArtifactSchema.parse(artifact)).toMatchObject({
      id: "interactive_demo_1",
    });
    expect(InteractiveDemoEditionSchema.parse(edition)).toMatchObject({
      status: "draft",
    });
    expect(InteractiveDemoWorkingDraftSchema.parse(working_draft)).toMatchObject({ version: 1 });
    expect(DemoSceneSchema.parse(demo_scene)).toMatchObject({
      id: "demo_scene_1",
      background_capture_asset_id: "asset_1",
    });
    expect(DemoHotspotSchema.parse(demo_hotspot)).toMatchObject({
      id: "demo_hotspot_1",
      hotspot_type: "click",
      transition: { target_scene_id: "demo_scene_2" },
    });
    expect(DemoTransitionSchema.parse(transition)).toEqual(transition);
  });

  it("uses strict requests with aggregate concurrency", () => {
    expect(() => CreateInteractiveDemoFromCaptureRequestSchema.parse({
      title: " Demo ",
      description: null,
      ignored_client_field: true,
    })).toThrow();

    expect(UpdateDemoSceneRequestSchema.parse({
      title: "Scene",
      background_capture_asset_id: " asset_1 ",
      expected_working_draft_version: 1,
    })).toMatchObject({
      title: "Scene",
      background_capture_asset_id: "asset_1",
      expected_working_draft_version: 1,
    });

    expect(ReorderDemoScenesRequestSchema.parse({
      scene_ids: [" scene_1 "],
      expected_working_draft_version: 1,
    })).toMatchObject({
      scene_ids: ["scene_1"],
      expected_working_draft_version: 1,
    });

    expect(ReorderDemoHotspotsRequestSchema.parse({
      hotspot_ids: [" hotspot_1 "],
      expected_working_draft_version: 1,
    })).toEqual({ hotspot_ids: ["hotspot_1"], expected_working_draft_version: 1 });
  });

  it("keeps semantic hotspot box validation in the domain layer", () => {
    expect(CreateDemoHotspotRequestSchema.parse({
      hotspot_type: "click",
      x: 2,
      y: 0.2,
      width: 0,
      height: 0.1,
      transition: { target_scene_id: " scene_2 " },
      expected_working_draft_version: 1,
    })).toMatchObject({
      hotspot_type: "click",
      x: 2,
      width: 0,
      transition: { target_scene_id: "scene_2" },
    });

    expect(UpdateDemoHotspotRequestSchema.parse({
      x: Number.POSITIVE_INFINITY,
      expected_working_draft_version: 1,
    })).toEqual({ x: Number.POSITIVE_INFINITY, expected_working_draft_version: 1 });
  });

  it("parses create-from-capture response envelopes", () => {
    expect(InteractiveDemoWorkingDraftMutationResponseSchema.parse({
      working_draft,
    })).toEqual({ working_draft });
    expect(() => InteractiveDemoWorkingDraftMutationResponseSchema.parse({
      working_draft,
      version: 2,
    })).toThrow();

    expect(CreateInteractiveDemoFromCaptureResponseSchema.parse({
      artifact,
      edition,
      working_draft,
      authored_updated_at: edition.updated_at,
      demo_scenes: [demo_scene],
      redirect_path: "/projects/project_1/interactive-demos/interactive_demo_1",
    })).toMatchObject({
      artifact: { id: "interactive_demo_1" },
      edition: { id: "interactive_demo_edition_1" },
      working_draft: { id: "interactive_demo_working_draft_1" },
      demo_scenes: [{ id: "demo_scene_1" }],
      redirect_path: "/projects/project_1/interactive-demos/interactive_demo_1",
    });
  });
});
