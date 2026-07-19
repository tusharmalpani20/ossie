import type { CaptureAssetType } from "@repo/constants";
import {
  InvalidFileMetadataError,
  UnsupportedScreenshotUploadMimeTypeError,
  UploadTooLargeError as FileDomainUploadTooLargeError,
  compact_optional_string,
  normalize_file_metadata,
} from "@repo/file-domain";
import {
  InvalidCaptureAssetInputError,
  UnsupportedCaptureAssetTypeError,
  UnsupportedCaptureAssetUploadTypeError,
  UploadTooLargeError,
} from "../errors/capture-domain-error";
import type {
  CaptureAssetLifecycleCommand,
  CaptureAssetStatus,
  CreateCaptureAssetInput,
  NormalizedCreateCaptureAssetInput,
  UploadCaptureAssetInput,
} from "../types/capture-asset";
import { CaptureAssetLifecycleConflictError } from "../errors/capture-domain-error";

export {
  CaptureAssetLifecycleConflictError,
  InvalidCaptureAssetInputError,
  UnsupportedCaptureAssetTypeError,
  UnsupportedCaptureAssetUploadTypeError,
  UploadTooLargeError,
};

export const assert_capture_asset_transition = (
  current: CaptureAssetStatus,
  command: CaptureAssetLifecycleCommand,
): CaptureAssetStatus => {
  if (current === "active" && command === "archive") return "archived";
  if (current === "archived" && command === "restore") return "active";
  throw new CaptureAssetLifecycleConflictError();
};

export const normalize_create_capture_asset = (
  input: CreateCaptureAssetInput,
): NormalizedCreateCaptureAssetInput => {
  if (input.asset_type !== "screenshot") {
    throw new UnsupportedCaptureAssetTypeError();
  }

  if (!input.file) {
    throw new InvalidCaptureAssetInputError();
  }

  try {
    return {
      asset_type: "screenshot",
      width: input.width,
      height: input.height,
      device_pixel_ratio: input.device_pixel_ratio,
      page_url: compact_optional_string(input.page_url),
      page_title: compact_optional_string(input.page_title),
      captured_at: compact_optional_string(input.captured_at),
      metadata: input.metadata,
      file: normalize_file_metadata(input.file),
    };
  } catch (error) {
    if (error instanceof InvalidFileMetadataError) {
      throw new InvalidCaptureAssetInputError();
    }

    throw error;
  }
};

export const normalize_upload_capture_asset = (
  input: UploadCaptureAssetInput,
): UploadCaptureAssetInput => ({
  width: input.width,
  height: input.height,
  device_pixel_ratio: input.device_pixel_ratio,
  page_url: compact_optional_string(input.page_url),
  page_title: compact_optional_string(input.page_title),
  captured_at: compact_optional_string(input.captured_at),
  metadata: input.metadata,
});

const project_screenshot_picker_asset_types = new Set<CaptureAssetType>([
  "screenshot",
  "redacted_screenshot",
]);

export const assert_supported_capture_asset_type = (
  asset_type: CaptureAssetType,
) => {
  if (asset_type !== "screenshot") {
    throw new UnsupportedCaptureAssetTypeError();
  }

  return asset_type;
};

export const assert_project_screenshot_picker_asset_type = (
  asset_type?: CaptureAssetType,
) => {
  const normalized_asset_type = asset_type ?? "screenshot";

  if (!project_screenshot_picker_asset_types.has(normalized_asset_type)) {
    throw new UnsupportedCaptureAssetTypeError();
  }

  return normalized_asset_type;
};

export const map_file_domain_upload_policy_error = (error: unknown) => {
  if (error instanceof UnsupportedScreenshotUploadMimeTypeError) {
    return new UnsupportedCaptureAssetUploadTypeError();
  }

  if (error instanceof FileDomainUploadTooLargeError) {
    return new UploadTooLargeError();
  }

  return null;
};
