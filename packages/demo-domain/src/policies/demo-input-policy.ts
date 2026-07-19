import type {
  CreateDemoSceneInput,
  CreateInteractiveDemoInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
} from "@repo/types/demo";
import {
  EmptyDemoSceneUpdateError,
  EmptyInteractiveDemoUpdateError,
} from "../errors/demo-domain-error";
import type {
  NormalizedCreateDemoSceneInput,
  NormalizedCreateInteractiveDemoInput,
  NormalizedUpdateDemoSceneInput,
  NormalizedUpdateInteractiveDemoInput,
} from "../types/demo-domain";

export {
  EmptyDemoSceneUpdateError,
  EmptyInteractiveDemoUpdateError,
};

export const compact_optional_string = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

export const normalize_create_demo_input = (
  input: CreateInteractiveDemoInput
): NormalizedCreateInteractiveDemoInput => ({
  project_version_id: input.project_version_id.trim(),
  title: input.title.trim(),
  description: compact_optional_string(input.description) ?? null,
  source_capture_session_id: compact_optional_string(input.source_capture_session_id) ?? null,
});

export const normalize_update_demo_input = (
  input: UpdateInteractiveDemoInput
): NormalizedUpdateInteractiveDemoInput => {
  const normalized: NormalizedUpdateInteractiveDemoInput = {};

  if (input.title !== undefined) {
    normalized.title = input.title.trim();
  }
  if (input.description !== undefined) {
    normalized.description = compact_optional_string(input.description) ?? null;
  }
  if (Object.keys(normalized).length === 0) {
    throw new EmptyInteractiveDemoUpdateError();
  }

  return normalized;
};

export const normalize_create_scene_input = (
  input: CreateDemoSceneInput
): NormalizedCreateDemoSceneInput => ({
  title: compact_optional_string(input.title) ?? null,
  description: compact_optional_string(input.description) ?? null,
  background_capture_asset_id: compact_optional_string(input.background_capture_asset_id) ?? null,
  source_capture_session_id: compact_optional_string(input.source_capture_session_id) ?? null,
  source_capture_event_id: compact_optional_string(input.source_capture_event_id) ?? null,
  source_capture_asset_id: compact_optional_string(input.source_capture_asset_id) ?? null,
});

export const normalize_update_scene_input = (
  input: UpdateDemoSceneInput
): NormalizedUpdateDemoSceneInput => {
  const normalized: NormalizedUpdateDemoSceneInput = {};

  if (input.title !== undefined) {
    normalized.title = compact_optional_string(input.title) ?? null;
  }
  if (input.description !== undefined) {
    normalized.description = compact_optional_string(input.description) ?? null;
  }
  if (input.background_capture_asset_id !== undefined) {
    normalized.background_capture_asset_id = compact_optional_string(input.background_capture_asset_id) ?? null;
  }

  if (Object.keys(normalized).length === 0) {
    throw new EmptyDemoSceneUpdateError();
  }

  return normalized;
};
