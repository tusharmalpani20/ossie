import { describe, expect, it } from "vitest";
import {
  EmptyDemoHotspotOrderError,
  EmptyDemoHotspotUpdateError,
  InvalidDemoHotspotCoordinatesError,
  InvalidDemoHotspotOrderError,
  InvalidDemoHotspotTargetError,
  assert_demo_hotspot_order_result,
  assert_hotspot_target_scene_exists,
  assert_valid_hotspot_box,
  normalize_create_hotspot_input,
  normalize_demo_hotspot_ids,
  normalize_update_hotspot_input,
} from "./demo-hotspot-policy";

describe("demo hotspot policy", () => {
  it("normalizes hotspot create and update input", () => {
    expect(normalize_create_hotspot_input({
      hotspot_type: " click ",
      label: " Continue ",
      content: " ",
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.1,
      transition: { target_scene_id: " scene_2 " },
      expected_working_draft_version: 1,
    })).toEqual({
      hotspot_type: "click",
      label: "Continue",
      content: null,
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.1,
      transition: { target_scene_id: "scene_2" },
    });

    expect(normalize_update_hotspot_input({
      label: " ",
      transition: null,
      expected_working_draft_version: 1,
    })).toEqual({
      label: null,
      transition: null,
    });

    expect(() => normalize_update_hotspot_input({
      expected_working_draft_version: 1,
    })).toThrow(EmptyDemoHotspotUpdateError);
    expect(() => normalize_create_hotspot_input({
      hotspot_type: "bad",
      x: 0,
      y: 0,
      width: 0.1,
      height: 0.1,
      expected_working_draft_version: 1,
    })).toThrow(InvalidDemoHotspotTargetError);
  });

  it("validates hotspot boxes with current normalized coordinate rules", () => {
    expect(() => assert_valid_hotspot_box({ x: 0, y: 0, width: 1, height: 1 })).not.toThrow();
    expect(() => assert_valid_hotspot_box({ x: -0.1, y: 0, width: 0.1, height: 0.1 }))
      .toThrow(InvalidDemoHotspotCoordinatesError);
    expect(() => assert_valid_hotspot_box({ x: 0.9, y: 0, width: 0.2, height: 0.1 }))
      .toThrow(InvalidDemoHotspotCoordinatesError);
    expect(() => assert_valid_hotspot_box({ x: 0, y: 0, width: 0, height: 0.1 }))
      .toThrow(InvalidDemoHotspotCoordinatesError);
    expect(() => assert_valid_hotspot_box({ x: Number.NaN, y: 0, width: 0.1, height: 0.1 }))
      .toThrow(InvalidDemoHotspotCoordinatesError);
  });

  it("normalizes hotspot order and validates repository results", () => {
    expect(normalize_demo_hotspot_ids([" hotspot_2 ", "hotspot_1"])).toEqual(["hotspot_2", "hotspot_1"]);
    expect(() => normalize_demo_hotspot_ids([])).toThrow(EmptyDemoHotspotOrderError);
    expect(() => normalize_demo_hotspot_ids(["hotspot_1", " hotspot_1 "])).toThrow(InvalidDemoHotspotOrderError);

    expect(() => assert_demo_hotspot_order_result(["hotspot_1", "hotspot_2"], [{ id: "hotspot_1" }]))
      .toThrow(InvalidDemoHotspotOrderError);
  });

  it("validates target-scene transition decisions without owning repository access", () => {
    expect(() => assert_hotspot_target_scene_exists(null, false)).not.toThrow();
    expect(() => assert_hotspot_target_scene_exists("scene_2", true)).not.toThrow();
    expect(() => assert_hotspot_target_scene_exists("scene_missing", false))
      .toThrow(InvalidDemoHotspotTargetError);
  });
});
