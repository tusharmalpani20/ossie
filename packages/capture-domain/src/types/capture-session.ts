import type {
  CaptureSessionSourceType,
  CaptureSessionStatus,
} from "@repo/constants";

export type CreateCaptureSessionInput = {
  name: string;
  project_version_id: string;
  start_immediately?: boolean;
  description?: string | null;
  source_type?: CaptureSessionSourceType;
  start_url?: string | null;
  browser_name?: string | null;
  browser_version?: string | null;
  operating_system?: string | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  user_agent?: string | null;
  metadata?: unknown;
  status?: CaptureSessionStatus;
  started_at?: unknown;
  completed_at?: unknown;
  canceled_at?: unknown;
};

export type UpdateCaptureSessionInput = Partial<{
  name: string;
  description: string | null;
  status: CaptureSessionStatus;
  start_url: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  user_agent: string | null;
  metadata: unknown;
  started_at: unknown;
  completed_at: unknown;
  canceled_at: unknown;
}>;

export type NormalizedCreateCaptureSessionInput = {
  name: string;
  project_version_id: string;
  start_immediately?: boolean;
  description?: string | null;
  source_type?: CaptureSessionSourceType;
  start_url?: string | null;
  browser_name?: string | null;
  browser_version?: string | null;
  operating_system?: string | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  user_agent?: string | null;
  metadata?: unknown;
};

export type NormalizedUpdateCaptureSessionInput = Partial<{
  name: string;
  description: string | null;
  status: CaptureSessionStatus;
  start_url: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  user_agent: string | null;
  metadata: unknown;
}>;

export type CaptureSessionCompletionTarget = {
  id: string;
  project_id: string;
  project_version: { slug: string };
};

export type CaptureSessionAssetFileTarget = {
  id: string;
  project_id: string;
  capture_session_id: string;
};
