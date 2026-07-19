import type {
  CaptureAssetStatus,
  CaptureAssetType,
  FileStorageProvider,
} from "@repo/constants";

export type CaptureAssetLifecycleCommand = "archive" | "restore";
export type { CaptureAssetStatus };

export type CreateCaptureAssetInput = {
  asset_type: CaptureAssetType;
  width?: number | null;
  height?: number | null;
  device_pixel_ratio?: number | null;
  page_url?: string | null;
  page_title?: string | null;
  captured_at?: string | null;
  metadata?: unknown;
  file: {
    storage_provider?: FileStorageProvider;
    storage_key: string;
    mime_type: string;
    size_bytes: number;
    original_name?: string | null;
    checksum_sha256?: string | null;
    metadata?: unknown;
  };
};

export type UploadCaptureAssetInput = {
  width?: number | null;
  height?: number | null;
  device_pixel_ratio?: number | null;
  page_url?: string | null;
  page_title?: string | null;
  captured_at?: string | null;
  metadata?: unknown;
};

export type NormalizedCreateCaptureAssetInput = {
  asset_type: "screenshot";
  width?: number | null;
  height?: number | null;
  device_pixel_ratio?: number | null;
  page_url?: string | null;
  page_title?: string | null;
  captured_at?: string | null;
  metadata?: unknown;
  file: {
    storage_provider: FileStorageProvider;
    storage_key: string;
    mime_type: string;
    size_bytes: number;
    original_name?: string | null;
    checksum_sha256?: string | null;
    metadata?: unknown;
  };
};
