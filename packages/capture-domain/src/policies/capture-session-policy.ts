import {
  EmptyCaptureSessionUpdateError,
  InvalidCaptureSessionCompletionError,
  InvalidCaptureSessionInputError,
} from "../errors/capture-domain-error";
import type {
  CaptureSessionAssetFileTarget,
  CaptureSessionCompletionTarget,
  CreateCaptureSessionInput,
  NormalizedCreateCaptureSessionInput,
  NormalizedUpdateCaptureSessionInput,
  UpdateCaptureSessionInput,
} from "../types/capture-session";

export {
  EmptyCaptureSessionUpdateError,
  InvalidCaptureSessionCompletionError,
  InvalidCaptureSessionInputError,
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

export const normalize_create_capture_session = (
  input: CreateCaptureSessionInput,
): NormalizedCreateCaptureSessionInput => ({
  name: input.name.trim(),
  project_version_id: input.project_version_id.trim(),
  start_immediately: input.start_immediately,
  description: compact_optional_string(input.description),
  source_type: input.source_type,
  start_url: compact_optional_string(input.start_url),
  browser_name: compact_optional_string(input.browser_name),
  browser_version: compact_optional_string(input.browser_version),
  operating_system: compact_optional_string(input.operating_system),
  viewport_width: input.viewport_width,
  viewport_height: input.viewport_height,
  device_pixel_ratio: input.device_pixel_ratio,
  user_agent: compact_optional_string(input.user_agent),
  metadata: input.metadata,
});

export const normalize_update_capture_session = (
  input: UpdateCaptureSessionInput,
): NormalizedUpdateCaptureSessionInput => {
  const normalized: NormalizedUpdateCaptureSessionInput = {};

  if (input.name !== undefined) {
    normalized.name = input.name.trim();
  }
  if (input.description !== undefined) {
    normalized.description = compact_optional_string(input.description) ?? null;
  }
  if (input.status !== undefined) {
    normalized.status = input.status;
  }
  if (input.start_url !== undefined) {
    normalized.start_url = compact_optional_string(input.start_url) ?? null;
  }
  if (input.browser_name !== undefined) {
    normalized.browser_name =
      compact_optional_string(input.browser_name) ?? null;
  }
  if (input.browser_version !== undefined) {
    normalized.browser_version =
      compact_optional_string(input.browser_version) ?? null;
  }
  if (input.operating_system !== undefined) {
    normalized.operating_system =
      compact_optional_string(input.operating_system) ?? null;
  }
  if (input.viewport_width !== undefined) {
    normalized.viewport_width = input.viewport_width;
  }
  if (input.viewport_height !== undefined) {
    normalized.viewport_height = input.viewport_height;
  }
  if (input.device_pixel_ratio !== undefined) {
    normalized.device_pixel_ratio = input.device_pixel_ratio;
  }
  if (input.user_agent !== undefined) {
    normalized.user_agent = compact_optional_string(input.user_agent) ?? null;
  }
  if (input.metadata !== undefined) {
    normalized.metadata = input.metadata;
  }

  return normalized;
};

export const assert_non_empty_capture_session_update = (
  input: NormalizedUpdateCaptureSessionInput,
) => {
  if (Object.keys(input).length === 0) {
    throw new EmptyCaptureSessionUpdateError();
  }
};

export const assert_no_client_lifecycle_timestamp_input = (
  input: UpdateCaptureSessionInput,
) => {
  if (
    input.started_at !== undefined ||
    input.completed_at !== undefined ||
    input.canceled_at !== undefined
  ) {
    throw new InvalidCaptureSessionInputError();
  }
};

export const is_valid_capture_session_completion_body = (body: unknown) =>
  body === undefined ||
  (body !== null &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    Object.keys(body).length === 0);

export const assert_valid_capture_session_completion_body = (body: unknown) => {
  if (!is_valid_capture_session_completion_body(body)) {
    throw new InvalidCaptureSessionCompletionError();
  }
};

export const build_capture_session_completion_redirect = (
  capture_session: CaptureSessionCompletionTarget,
) => ({
  path: `/projects/${encodeURIComponent(capture_session.project_id)}/versions/${encodeURIComponent(capture_session.project_version.slug)}/capture-sessions/${encodeURIComponent(capture_session.id)}`,
  reason: "capture_session_completed" as const,
});

export const build_capture_session_asset_file_url = (
  asset: CaptureSessionAssetFileTarget,
) =>
  `/api/v1/projects/${asset.project_id}/capture-sessions/${asset.capture_session_id}/assets/${asset.id}/file`;
