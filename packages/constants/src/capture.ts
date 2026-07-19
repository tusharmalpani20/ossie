export const CAPTURE_SESSION_STATUSES = [
  "draft",
  "capturing",
  "completed",
  "canceled",
  "archived",
] as const;
export type CaptureSessionStatus = (typeof CAPTURE_SESSION_STATUSES)[number];

export const CAPTURE_SESSION_SOURCE_TYPES = [
  "manual",
  "extension",
  "import",
] as const;
export type CaptureSessionSourceType =
  (typeof CAPTURE_SESSION_SOURCE_TYPES)[number];

export const CAPTURE_EVENT_TYPES = [
  "navigation",
  "click",
  "input",
  "capture",
  "note",
] as const;
export type CaptureEventType = (typeof CAPTURE_EVENT_TYPES)[number];

export const CAPTURE_ASSET_STATUSES = ["active", "archived"] as const;
export type CaptureAssetStatus = (typeof CAPTURE_ASSET_STATUSES)[number];

export const CAPTURE_ASSET_PURGE_OPERATION_STATUSES = [
  "pending",
  "failed",
  "completed",
] as const;
export type CaptureAssetPurgeOperationStatus =
  (typeof CAPTURE_ASSET_PURGE_OPERATION_STATUSES)[number];
