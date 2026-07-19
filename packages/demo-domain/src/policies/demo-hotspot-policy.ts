import type { DemoHotspotType } from "@repo/constants";
import type {
  CreateDemoHotspotInput,
  UpdateDemoHotspotInput,
} from "@repo/types/demo";
import {
  EmptyDemoHotspotOrderError,
  EmptyDemoHotspotUpdateError,
  InvalidDemoHotspotCoordinatesError,
  InvalidDemoHotspotOrderError,
  InvalidDemoHotspotTargetError,
} from "../errors/demo-domain-error";
import type {
  NormalizedCreateDemoHotspotInput,
  NormalizedUpdateDemoHotspotInput,
} from "../types/demo-domain";
import { compact_optional_string } from "./demo-input-policy";

export {
  EmptyDemoHotspotOrderError,
  EmptyDemoHotspotUpdateError,
  InvalidDemoHotspotCoordinatesError,
  InvalidDemoHotspotOrderError,
  InvalidDemoHotspotTargetError,
};

const normalize_hotspot_type = (value: string): DemoHotspotType => {
  const normalized = value.trim();
  if (normalized === "click" || normalized === "info" || normalized === "next") {
    return normalized;
  }

  throw new InvalidDemoHotspotTargetError();
};

export const normalize_create_hotspot_input = (
  input: CreateDemoHotspotInput
): NormalizedCreateDemoHotspotInput => ({
  hotspot_type: normalize_hotspot_type(input.hotspot_type),
  label: compact_optional_string(input.label) ?? null,
  content: compact_optional_string(input.content) ?? null,
  x: input.x,
  y: input.y,
  width: input.width,
  height: input.height,
  transition: input.transition
    ? { target_scene_id: compact_optional_string(input.transition.target_scene_id) ?? "" }
    : null,
});

export const normalize_update_hotspot_input = (
  input: UpdateDemoHotspotInput
): NormalizedUpdateDemoHotspotInput => {
  const normalized: NormalizedUpdateDemoHotspotInput = {};

  if (input.hotspot_type !== undefined) {
    normalized.hotspot_type = normalize_hotspot_type(input.hotspot_type);
  }
  if (input.label !== undefined) {
    normalized.label = compact_optional_string(input.label) ?? null;
  }
  if (input.content !== undefined) {
    normalized.content = compact_optional_string(input.content) ?? null;
  }
  if (input.x !== undefined) {
    normalized.x = input.x;
  }
  if (input.y !== undefined) {
    normalized.y = input.y;
  }
  if (input.width !== undefined) {
    normalized.width = input.width;
  }
  if (input.height !== undefined) {
    normalized.height = input.height;
  }
  if (input.transition !== undefined) {
    normalized.transition = input.transition
      ? { target_scene_id: compact_optional_string(input.transition.target_scene_id) ?? "" }
      : null;
  }

  if (Object.keys(normalized).length === 0) {
    throw new EmptyDemoHotspotUpdateError();
  }

  return normalized;
};

const assert_valid_coordinate = (value: number) => {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new InvalidDemoHotspotCoordinatesError();
  }
};

export const assert_valid_hotspot_box = (input: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) => {
  if (input.x !== undefined) assert_valid_coordinate(input.x);
  if (input.y !== undefined) assert_valid_coordinate(input.y);
  if (input.width !== undefined) assert_valid_coordinate(input.width);
  if (input.height !== undefined) assert_valid_coordinate(input.height);

  if (input.width !== undefined && input.width <= 0) {
    throw new InvalidDemoHotspotCoordinatesError();
  }
  if (input.height !== undefined && input.height <= 0) {
    throw new InvalidDemoHotspotCoordinatesError();
  }
  if (
    input.x !== undefined &&
    input.width !== undefined &&
    input.x + input.width > 1
  ) {
    throw new InvalidDemoHotspotCoordinatesError();
  }
  if (
    input.y !== undefined &&
    input.height !== undefined &&
    input.y + input.height > 1
  ) {
    throw new InvalidDemoHotspotCoordinatesError();
  }
};

export const normalize_demo_hotspot_ids = (hotspot_ids: string[]) => {
  const normalized = hotspot_ids.map((id) => id.trim());

  if (normalized.length === 0) {
    throw new EmptyDemoHotspotOrderError();
  }

  if (new Set(normalized).size !== normalized.length) {
    throw new InvalidDemoHotspotOrderError();
  }

  return normalized;
};

export const assert_demo_hotspot_order_result = (
  hotspot_ids: string[],
  hotspots: Array<{ id: string }>
) => {
  if (hotspots.length !== hotspot_ids.length) {
    throw new InvalidDemoHotspotOrderError();
  }
};

export const assert_hotspot_target_scene_exists = (
  target_scene_id: string | null | undefined,
  exists: boolean
) => {
  if (target_scene_id && !exists) {
    throw new InvalidDemoHotspotTargetError();
  }
};
