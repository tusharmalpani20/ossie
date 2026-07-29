import { render } from "@testing-library/react";
import { vi } from "vitest";
import {
  type AuthResponse,
  type CaptureAssetResponse,
  type CaptureEventResponse,
  type CaptureSessionResponse,
  type CompleteCaptureSessionResponse,
  type CreateCaptureEventInput,
  type LoginRequest,
  type LoginResponse,
  type Project,
} from "../lib/api";
import type {
  CaptureCommand,
  CaptureCommandResult,
} from "../lib/capture-command";
import { App } from "../App";
import type { ExtensionSettings } from "../lib/settings";
import type { ScreenshotCapture } from "../lib/screenshot";

export const auth: AuthResponse["auth"] = {
  user: {
    id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_1",
    role: "owner",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-05T00:00:00.000Z",
  },
};

export const projects: Project[] = [
  {
    id: "project_2",
    organization_id: "organization_1",
    name: "Archived onboarding demos",
    description: null,
    slug: null,
    color: null,
    icon: null,
    status: "archived",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 2,
    created_at: "2026-06-05T09:00:00.000Z",
    updated_at: "2026-06-05T09:30:00.000Z",
    access: { role: "project_admin", source: "organization_owner" },
    default_project_version: {
      id: "version_2",
      name: "Main",
      slug: "main",
      status: "active",
      position: 1,
    },
  },
  {
    id: "project_1",
    organization_id: "organization_1",
    name: "Internal onboarding demos",
    description: null,
    slug: null,
    color: null,
    icon: null,
    status: "active",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
    access: { role: "editor", source: "project_membership" },
    default_project_version: {
      id: "version_1",
      name: "Main",
      slug: "main",
      status: "active",
      position: 1,
    },
  },
];

export const projectVersions = [
  {
    id: "version_1",
    organization_id: "organization_1",
    project_id: "project_1",
    name: "Main",
    description: null,
    slug: "main",
    release_date: null,
    position: 1,
    status: "active" as const,
    is_default: true,
    version: 1,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  {
    id: "version_next",
    organization_id: "organization_1",
    project_id: "project_1",
    name: "Next",
    description: null,
    slug: "next",
    release_date: null,
    position: 2,
    status: "active" as const,
    is_default: false,
    version: 1,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
];

export const defaultSettings: ExtensionSettings = {
  instanceUrl: null,
  portalUrl: null,
  sessionToken: null,
  selectedProjectId: null,
  activeCaptureSessionId: null,
  activeCaptureProjectId: null,
  activeCaptureEventIndex: null,
  activeCaptureMode: null,
  activeCapturePaused: false,
  automaticCaptureDiagnostic: null,
  manualCaptureDiagnostic: null,
};

export const captureSessionResponse: CaptureSessionResponse = {
  capture_session: {
    id: "capture_session_1",
    organization_id: "organization_1",
    project_id: "project_1",
    project_version_id: "version_1",
    project_version: {
      id: "version_1",
      name: "Current",
      slug: "current",
      status: "active" as const,
      position: 1,
    },
    name: "Capture from Example Page",
    description: null,
    source_type: "extension" as const,
    status: "draft" as const,
    started_at: null,
    completed_at: null,
    canceled_at: null,
    start_url: "https://example.com/path",
    browser_name: "Chrome",
    browser_version: null,
    operating_system: null,
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 2,
    user_agent: null,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
};

export const screenshotCapture: ScreenshotCapture = {
  blob: new Blob(["fake png bytes"], { type: "image/png" }),
  mimeType: "image/png",
  width: 1440,
  height: 900,
  devicePixelRatio: 2,
  capturedAt: "2026-06-05T10:00:00.000Z",
};

export const captureAssetResponse: CaptureAssetResponse = {
  capture_asset: {
    id: "capture_asset_1",
    organization_id: "organization_1",
    project_id: "project_1",
    capture_session_id: "capture_session_1",
    file: {
      id: "file_1",
      storage_provider: "local",
      mime_type: "image/png",
      size_bytes: 1024,
      original_name: "screenshot-2026-06-05T10-00-00-000Z.png",
      checksum_sha256: null,
    },
    asset_type: "screenshot",
    status: "active",
    width: 1440,
    height: 900,
    device_pixel_ratio: 2,
    page_url: "https://example.com/path",
    page_title: "Example Page",
    captured_at: "2026-06-05T10:00:00.000Z",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
};

export const captureEventResponse: CaptureEventResponse = {
  capture_event: {
    id: "capture_event_1",
    organization_id: "organization_1",
    project_id: "project_1",
    capture_session_id: "capture_session_1",
    capture_asset_id: "capture_asset_1",
    event_type: "capture",
    event_index: 1,
    occurred_at: "2026-06-05T10:00:00.000Z",
    page_url: "https://example.com/path",
    page_title: "Example Page",
    target_label: null,
    target_selector: null,
    target_role: null,
    target_test_id: null,
    target_text: null,
    client_x: null,
    client_y: null,
    viewport_width: null,
    viewport_height: null,
    device_pixel_ratio: null,
    input_intent: null,
    input_value_redacted: true,
    note: null,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
};

export const completeCaptureSessionResponse: CompleteCaptureSessionResponse = {
  capture_session: {
    id: "capture_session_1",
    organization_id: "organization_1",
    project_id: "project_1",
    project_version_id: "version_1",
    project_version: {
      id: "version_1",
      name: "Current",
      slug: "current",
      status: "active",
      position: 1,
    },
    name: "Capture from Example Page",
    description: null,
    source_type: "extension",
    status: "completed",
    started_at: null,
    completed_at: "2026-06-05T10:05:00.000Z",
    canceled_at: null,
    start_url: "https://example.com/path",
    browser_name: "Chrome",
    browser_version: null,
    operating_system: null,
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 2,
    user_agent: null,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 2,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
  },
  redirect: {
    path: "/projects/project_1/capture-sessions/capture_session_1",
    reason: "capture_session_completed",
  },
};

export const renderApp = (
  overrides: {
    settings?: ExtensionSettings;
    getSettings?: () => Promise<ExtensionSettings>;
    getCurrentAuth?: (
      instanceUrl: string,
      sessionToken: string,
    ) => Promise<AuthResponse>;
    listProjects?: (
      instanceUrl: string,
      sessionToken: string,
    ) => Promise<{ projects: Project[] }>;
    listProjectVersions?: () => Promise<{
      project_versions: typeof projectVersions;
    }>;
    getCaptureSession?: () => Promise<typeof captureSessionResponse>;
    listCaptureEvents?: () => Promise<{
      capture_events: CaptureEventResponse["capture_event"][];
    }>;
    subscribeToSettingsChanges?: (onChange: () => void) => () => void;
    sendCaptureCommand?: (
      command: CaptureCommand,
    ) => Promise<CaptureCommandResult>;
    login?: (instanceUrl: string, data: LoginRequest) => Promise<LoginResponse>;
    createCaptureSession?: (
      instanceUrl: string,
      sessionToken: string,
      projectId: string,
      data: {
        name: string;
        source_type: "extension";
        start_immediately: true;
        start_url?: string | null;
        metadata?: Record<string, unknown>;
      },
    ) => Promise<typeof captureSessionResponse>;
    getCurrentTabSnapshot?: () => Promise<{
      url: string | null;
      title: string | null;
    }>;
    captureVisibleTabScreenshot?: () => Promise<ScreenshotCapture>;
    uploadCaptureAsset?: (
      instanceUrl: string,
      sessionToken: string,
      projectId: string,
      captureSessionId: string,
      data: {
        file: Blob;
        fileName: string;
        width?: number | null;
        height?: number | null;
        devicePixelRatio?: number | null;
        pageUrl?: string | null;
        pageTitle?: string | null;
        capturedAt?: string | null;
        metadata?: Record<string, unknown>;
      },
    ) => Promise<CaptureAssetResponse>;
    createCaptureEvent?: (
      instanceUrl: string,
      sessionToken: string,
      projectId: string,
      captureSessionId: string,
      data: CreateCaptureEventInput,
    ) => Promise<CaptureEventResponse>;
    completeCaptureSession?: (
      instanceUrl: string,
      sessionToken: string,
      projectId: string,
      captureSessionId: string,
    ) => Promise<CompleteCaptureSessionResponse>;
    openPortalUrl?: (url: string) => Promise<void>;
    saveInstanceUrl?: (instanceUrl: string) => Promise<void>;
    savePortalUrl?: (portalUrl: string | null) => Promise<void>;
    saveSessionToken?: (sessionToken: string | null) => Promise<void>;
    saveSelectedProjectId?: (projectId: string | null) => Promise<void>;
    saveActiveCaptureVersionContext?: (input: {
      captureSessionId: string;
      projectId: string;
      projectVersionId: string;
      projectVersionSlug: string;
      projectVersionName: string;
    }) => Promise<void>;
    saveActiveCapture?: (input: {
      captureSessionId: string;
      projectId: string;
      eventIndex?: number;
      mode?: "manual" | "automatic";
    }) => Promise<void>;
    saveActiveCaptureMode?: (input: {
      mode: "manual" | "automatic";
      paused: boolean;
    }) => Promise<void>;
    saveActiveCaptureEventIndex?: (eventIndex: number | null) => Promise<void>;
    saveManualCaptureDiagnostic?: (
      diagnostic: {
        status: "saving" | "success" | "failed";
        message: string | null;
        eventIndex: number | null;
        occurredAt: string;
      } | null,
    ) => Promise<void>;
    saveAutomaticCaptureDiagnostic?: (
      diagnostic: {
        status: "saving" | "success" | "failed";
        message: string | null;
        eventIndex: number | null;
        occurredAt: string;
      } | null,
    ) => Promise<void>;
    clearActiveCapture?: () => Promise<void>;
    clearSettings?: () => Promise<void>;
    logout?: (instanceUrl: string, sessionToken: string) => Promise<void>;
  } = {},
) => {
  const dependencies = {
    getSettings: vi.fn(
      overrides.getSettings ??
        (async () => overrides.settings ?? defaultSettings),
    ),
    subscribeToSettingsChanges: vi.fn(
      overrides.subscribeToSettingsChanges ?? (() => () => {}),
    ),
    saveInstanceUrl: vi.fn(overrides.saveInstanceUrl ?? (async () => {})),
    savePortalUrl: vi.fn(overrides.savePortalUrl ?? (async () => {})),
    saveSessionToken: vi.fn(overrides.saveSessionToken ?? (async () => {})),
    saveSelectedProjectId: vi.fn(
      overrides.saveSelectedProjectId ?? (async () => {}),
    ),
    clearSettings: vi.fn(overrides.clearSettings ?? (async () => {})),
    getCurrentAuth: vi.fn(overrides.getCurrentAuth ?? (async () => ({ auth }))),
    login: vi.fn(
      overrides.login ??
        (async () => ({ auth, session_token: "extension-session-token" })),
    ),
    listProjects: vi.fn(overrides.listProjects ?? (async () => ({ projects }))),
    listProjectVersions: vi.fn(
      overrides.listProjectVersions ??
        (async () => ({ project_versions: projectVersions })),
    ),
    getCaptureSession: vi.fn(
      overrides.getCaptureSession ?? (async () => captureSessionResponse),
    ),
    listCaptureEvents: vi.fn(
      overrides.listCaptureEvents ?? (async () => ({ capture_events: [] })),
    ),
    sendCaptureCommand: vi.fn(
      overrides.sendCaptureCommand ??
        (async () => ({
          ok: true as const,
          event_index: captureEventResponse.capture_event.event_index,
        })),
    ),
    createCaptureSession: vi.fn(
      overrides.createCaptureSession ?? (async () => captureSessionResponse),
    ),
    getCurrentTabSnapshot: vi.fn(
      overrides.getCurrentTabSnapshot ??
        (async () => ({
          url: "https://example.com/path",
          title: "Example Page",
        })),
    ),
    captureVisibleTabScreenshot: vi.fn(
      overrides.captureVisibleTabScreenshot ?? (async () => screenshotCapture),
    ),
    uploadCaptureAsset: vi.fn(
      overrides.uploadCaptureAsset ?? (async () => captureAssetResponse),
    ),
    createCaptureEvent: vi.fn(
      overrides.createCaptureEvent ?? (async () => captureEventResponse),
    ),
    completeCaptureSession: vi.fn(
      overrides.completeCaptureSession ??
        (async () => completeCaptureSessionResponse),
    ),
    openPortalUrl: vi.fn(overrides.openPortalUrl ?? (async () => {})),
    saveActiveCapture: vi.fn(overrides.saveActiveCapture ?? (async () => {})),
    saveActiveCaptureVersionContext: vi.fn(
      overrides.saveActiveCaptureVersionContext ?? (async () => {}),
    ),
    saveActiveCaptureMode: vi.fn(
      overrides.saveActiveCaptureMode ?? (async () => {}),
    ),
    saveActiveCaptureEventIndex: vi.fn(
      overrides.saveActiveCaptureEventIndex ?? (async () => {}),
    ),
    saveManualCaptureDiagnostic: vi.fn(
      overrides.saveManualCaptureDiagnostic ?? (async () => {}),
    ),
    saveAutomaticCaptureDiagnostic: vi.fn(
      overrides.saveAutomaticCaptureDiagnostic ?? (async () => {}),
    ),
    clearActiveCapture: vi.fn(overrides.clearActiveCapture ?? (async () => {})),
    logout: vi.fn(overrides.logout ?? (async () => {})),
  };

  render(<App dependencies={dependencies} />);

  return dependencies;
};
