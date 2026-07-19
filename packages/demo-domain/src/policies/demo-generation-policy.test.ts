import { describe, expect, it } from "vitest";
import {
  NoUsableCaptureEventsError,
  build_demo_from_capture_source,
  demo_redirect_path,
  normalize_create_demo_from_capture_source,
  title_for_demo_scene_source_event,
} from "./demo-generation-policy";

const source_events = [
  {
    id: "event_1",
    event_type: "click" as const,
    event_index: 1,
    capture_asset_id: "asset_1",
    page_title: "Department List",
    target_label: null,
    target_text: "Add Department",
    note: null,
  },
  {
    id: "event_2",
    event_type: "note" as const,
    event_index: 2,
    capture_asset_id: null,
    page_title: null,
    target_label: null,
    target_text: null,
    note: "No screenshot",
  },
  {
    id: "event_3",
    event_type: "capture" as const,
    event_index: 3,
    capture_asset_id: "asset_2",
    page_title: "New Department",
    target_label: null,
    target_text: null,
    note: null,
  },
];

describe("demo generation policy", () => {
  it("normalizes create-from-capture data from capture session source", () => {
    expect(normalize_create_demo_from_capture_source({
      id: "session_1",
      name: " Department setup ",
      description: " ",
    })).toEqual({
      title: "Department setup",
      description: null,
    });
  });

  it("derives scene titles from source events using current fallback order", () => {
    expect(title_for_demo_scene_source_event(source_events[0]!)).toBe("Click Add Department");
    expect(title_for_demo_scene_source_event({
      ...source_events[0]!,
      target_text: " ",
      target_label: "Save",
    })).toBe("Click Save");
    expect(title_for_demo_scene_source_event({
      ...source_events[0]!,
      target_text: null,
      target_label: null,
    })).toBe("Department List");
    expect(title_for_demo_scene_source_event({
      ...source_events[1]!,
      note: "Read this",
    })).toBe("Read this");
    expect(title_for_demo_scene_source_event({
      ...source_events[1]!,
      note: null,
    })).toBe("Step 2");
  });

  it("builds contiguous scenes from screenshot-backed capture events", () => {
    expect(build_demo_from_capture_source({
      source_events,
      screenshot_capture_asset_ids: new Set(["asset_1", "asset_2"]),
    })).toEqual([{
      scene_index: 1,
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      background_capture_asset_id: "asset_1",
      title: "Click Add Department",
      description: null,
    }, {
      scene_index: 2,
      source_capture_event_id: "event_3",
      source_capture_asset_id: "asset_2",
      background_capture_asset_id: "asset_2",
      title: "New Department",
      description: null,
    }]);
  });

  it("rejects capture source material with no usable screenshot events", () => {
    expect(() => build_demo_from_capture_source({
      source_events,
      screenshot_capture_asset_ids: new Set(["asset_missing"]),
    })).toThrow(NoUsableCaptureEventsError);
  });

  it("builds the current encoded editor redirect path", () => {
    expect(demo_redirect_path("project / 1", "version / 1", "demo / 1"))
      .toBe("/projects/project%20%2F%201/versions/version%20%2F%201/interactive-demos/demo%20%2F%201");
  });
});
