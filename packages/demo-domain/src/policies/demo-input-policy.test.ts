import { describe, expect, it } from "vitest";
import {
  EmptyDemoSceneUpdateError,
  EmptyInteractiveDemoUpdateError,
  normalize_create_demo_input,
  normalize_create_scene_input,
  normalize_update_demo_input,
  normalize_update_scene_input,
} from "./demo-input-policy";

describe("demo input policy", () => {
  it("normalizes create and update demo input", () => {
    expect(normalize_create_demo_input({
      title: " Demo ",
      description: " ",
      project_version_id: "version_1",
      source_capture_session_id: " session_1 ",
    })).toEqual({
      project_version_id: "version_1",
      title: "Demo",
      description: null,
      source_capture_session_id: "session_1",
    });

    expect(normalize_update_demo_input({
      title: " Updated ",
      description: " ",
      expected_edition_version: 1,
    })).toEqual({
      title: "Updated",
      description: null,
    });

    expect(() => normalize_update_demo_input({
      expected_edition_version: 1,
    })).toThrow(EmptyInteractiveDemoUpdateError);
  });

  it("normalizes create and update scene input", () => {
    expect(normalize_create_scene_input({
      title: " ",
      description: " Details ",
      background_capture_asset_id: " asset_1 ",
      source_capture_session_id: " session_1 ",
      source_capture_event_id: " event_1 ",
      source_capture_asset_id: " asset_1 ",
      expected_working_draft_version: 1,
    })).toEqual({
      title: null,
      description: "Details",
      background_capture_asset_id: "asset_1",
      source_capture_session_id: "session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
    });

    expect(normalize_update_scene_input({
      title: " ",
      background_capture_asset_id: " ",
      expected_working_draft_version: 1,
    })).toEqual({
      title: null,
      background_capture_asset_id: null,
    });

    expect(() => normalize_update_scene_input({
      expected_working_draft_version: 1,
    })).toThrow(EmptyDemoSceneUpdateError);
  });
});
