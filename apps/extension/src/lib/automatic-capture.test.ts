import { describe, expect, it, vi } from "vitest";
import {
  createAutomaticCaptureController,
  handleAutomaticClickCapture,
  type AutomaticClickMessage,
} from "./automatic-capture";
import {
  ApiClientError,
  type CaptureAssetResponse,
  type CaptureEventResponse,
} from "./api";
import type { ScreenshotCapture } from "./screenshot";
import type { ExtensionSettings } from "./settings";

const settings: ExtensionSettings = {
  instanceUrl: "https://demo.example.com",
  sessionToken: "extension-session-token",
  selectedProjectId: "project_1",
  activeCaptureSessionId: "capture_session_1",
  activeCaptureProjectId: "project_1",
  activeCaptureEventIndex: 1,
  activeCaptureMode: "automatic",
  activeCapturePaused: false,
};

const screenshot: ScreenshotCapture = {
  blob: new Blob(["fake png bytes"], { type: "image/png" }),
  mimeType: "image/png",
  width: 1440,
  height: 900,
  devicePixelRatio: 2,
  capturedAt: "2026-06-05T10:00:00.000Z",
};

const capture_asset_response: CaptureAssetResponse = {
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

const capture_event_response: CaptureEventResponse = {
  capture_event: {
    id: "capture_event_1",
    organization_id: "organization_1",
    project_id: "project_1",
    capture_session_id: "capture_session_1",
    capture_asset_id: "capture_asset_1",
    event_type: "click",
    event_index: 2,
    occurred_at: "2026-06-05T10:00:00.000Z",
    page_url: "https://example.com/path",
    page_title: "Example Page",
    target_label: null,
    target_selector: 'button[data-testid="add-department"]',
    target_role: "button",
    target_test_id: "add-department",
    target_text: "Add Department",
    client_x: 240,
    client_y: 80,
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 2,
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

const click_message: AutomaticClickMessage = {
  type: "ossie:page_click",
  payload: {
    page_url: "https://example.com/path",
    page_title: "Example Page",
    target_text: "Add Department",
    target_selector: 'button[data-testid="add-department"]',
    target_role: "button",
    target_test_id: "add-department",
    client_x: 240,
    client_y: 80,
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 2,
    bounding_box: {
      x: 200,
      y: 60,
      width: 160,
      height: 44,
    },
  },
};

const build_dependencies = (
  overrides: Partial<Parameters<typeof handleAutomaticClickCapture>[1]> = {},
) => ({
  getSettings: vi.fn(async () => settings),
  captureVisibleTabScreenshot: vi.fn(async () => screenshot),
  uploadCaptureAsset: vi.fn(async () => capture_asset_response),
  createCaptureEvent: vi.fn(async () => capture_event_response),
  listCaptureEvents: vi.fn(async () => ({
    capture_events: [capture_event_response.capture_event],
  })),
  saveActiveCaptureEventIndex: vi.fn(async () => {}),
  saveAutomaticCaptureDiagnostic: vi.fn(async () => {}),
  ...overrides,
});

describe("automatic capture orchestration", () => {
  it("uploads a screenshot and records one ordered click event", async () => {
    const dependencies = build_dependencies();

    await expect(
      handleAutomaticClickCapture(click_message, dependencies),
    ).resolves.toEqual({
      ok: true,
      event_index: 2,
    });

    expect(dependencies.uploadCaptureAsset).toHaveBeenCalledWith(
      "https://demo.example.com",
      "extension-session-token",
      "project_1",
      "capture_session_1",
      expect.objectContaining({
        file: screenshot.blob,
        fileName: "screenshot-2026-06-05T10-00-00-000Z.png",
        pageUrl: "https://example.com/path",
        pageTitle: "Example Page",
        metadata: expect.objectContaining({
          capture_source: "extension_auto_click",
        }),
      }),
    );
    expect(dependencies.createCaptureEvent).toHaveBeenCalledWith(
      "https://demo.example.com",
      "extension-session-token",
      "project_1",
      "capture_session_1",
      expect.objectContaining({
        event_type: "click",
        event_index: 2,
        capture_asset_id: "capture_asset_1",
        target_text: "Add Department",
        target_selector: 'button[data-testid="add-department"]',
        target_role: "button",
        target_test_id: "add-department",
        client_x: 240,
        client_y: 80,
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 2,
        input_value_redacted: true,
      }),
    );
    expect(dependencies.saveActiveCaptureEventIndex).toHaveBeenCalledWith(2);
    expect(dependencies.saveAutomaticCaptureDiagnostic).toHaveBeenNthCalledWith(
      1,
      {
        status: "saving",
        message: "Saving automatic capture…",
        eventIndex: null,
        occurredAt: expect.any(String),
      },
    );
    expect(dependencies.saveAutomaticCaptureDiagnostic).toHaveBeenCalledWith({
      status: "success",
      message: null,
      eventIndex: 2,
      occurredAt: "2026-06-05T10:00:00.000Z",
    });
  });

  it("skips capture when automatic capture is paused or unavailable", async () => {
    const dependencies = build_dependencies({
      getSettings: vi.fn(async () => ({
        ...settings,
        activeCapturePaused: true,
      })),
    });

    await expect(
      handleAutomaticClickCapture(click_message, dependencies),
    ).resolves.toEqual({
      ok: false,
      reason: "automatic_capture_inactive",
    });

    expect(dependencies.captureVisibleTabScreenshot).not.toHaveBeenCalled();
    expect(dependencies.uploadCaptureAsset).not.toHaveBeenCalled();
    expect(dependencies.createCaptureEvent).not.toHaveBeenCalled();
    expect(dependencies.saveAutomaticCaptureDiagnostic).not.toHaveBeenCalled();
  });

  it("does not advance the local event index when upload fails", async () => {
    const dependencies = build_dependencies({
      uploadCaptureAsset: vi.fn(async () => {
        throw new Error("Upload failed");
      }),
    });

    await expect(
      handleAutomaticClickCapture(click_message, dependencies),
    ).resolves.toEqual({
      ok: false,
      reason: "automatic_capture_failed",
      message: "Upload failed",
    });

    expect(dependencies.createCaptureEvent).not.toHaveBeenCalled();
    expect(dependencies.saveActiveCaptureEventIndex).not.toHaveBeenCalled();
    expect(dependencies.saveAutomaticCaptureDiagnostic).toHaveBeenCalledWith({
      status: "failed",
      message: "Upload failed",
      eventIndex: null,
      occurredAt: expect.any(String),
    });
  });

  it("skips duplicate click messages while one automatic capture is still running", async () => {
    let resolveScreenshot: (value: ScreenshotCapture) => void = () => {};
    const screenshotPromise = new Promise<ScreenshotCapture>((resolve) => {
      resolveScreenshot = resolve;
    });
    const dependencies = build_dependencies({
      captureVisibleTabScreenshot: vi.fn(async () => screenshotPromise),
    });
    const controller = createAutomaticCaptureController(dependencies);

    const firstResult = controller(click_message);
    await expect(controller(click_message)).resolves.toEqual({
      ok: false,
      reason: "automatic_capture_busy",
    });

    resolveScreenshot(screenshot);
    await expect(firstResult).resolves.toEqual({
      ok: true,
      event_index: 2,
    });
    expect(dependencies.uploadCaptureAsset).toHaveBeenCalledTimes(1);
    expect(dependencies.createCaptureEvent).toHaveBeenCalledTimes(1);
  });

  it("reconciles an index conflict without repeating the ambiguous Event", async () => {
    const dependencies = build_dependencies({
      createCaptureEvent: vi.fn(async () => {
        throw new ApiClientError({
          status: 409,
          type: "capture_event_index_conflict",
          message: "Event index already exists",
        });
      }),
      listCaptureEvents: vi.fn(async () => ({
        capture_events: [
          {
            ...capture_event_response.capture_event,
            event_index: 5,
          },
        ],
      })),
    });

    await expect(
      handleAutomaticClickCapture(click_message, dependencies, 12),
    ).resolves.toEqual({
      ok: false,
      reason: "capture_reconciled",
      message:
        "Capture steps were reconciled. Retry the click as a new action.",
      reconciled_event_index: 5,
    });

    expect(dependencies.captureVisibleTabScreenshot).toHaveBeenCalledWith(12);
    expect(dependencies.uploadCaptureAsset).toHaveBeenCalledTimes(1);
    expect(dependencies.createCaptureEvent).toHaveBeenCalledTimes(1);
    expect(dependencies.listCaptureEvents).toHaveBeenCalledTimes(1);
    expect(dependencies.saveActiveCaptureEventIndex).toHaveBeenCalledWith(5);
  });

  it("blocks automatic capture until a missing Event index is reconciled", async () => {
    const dependencies = build_dependencies({
      getSettings: vi.fn(async () => ({
        ...settings,
        activeCaptureEventIndex: null,
      })),
    });

    await expect(
      handleAutomaticClickCapture(click_message, dependencies, 12),
    ).resolves.toEqual({
      ok: false,
      reason: "capture_reconciliation_failed",
      message:
        "Capture steps must be reconciled before another click can be saved. Reopen or retry the extension.",
    });
    expect(dependencies.captureVisibleTabScreenshot).not.toHaveBeenCalled();
  });

  it("marks the Event index unreconciled when conflict recovery fails", async () => {
    const dependencies = build_dependencies({
      createCaptureEvent: vi.fn(async () => {
        throw new ApiClientError({
          status: 409,
          type: "capture_event_index_conflict",
          message: "Event index already exists",
        });
      }),
      listCaptureEvents: vi.fn(async () => {
        throw new Error("Event list unavailable");
      }),
    });

    await expect(
      handleAutomaticClickCapture(click_message, dependencies, 12),
    ).resolves.toEqual({
      ok: false,
      reason: "capture_reconciliation_failed",
      message:
        "Capture steps could not be reconciled. Reopen or retry the extension before capturing again.",
    });
    expect(dependencies.saveActiveCaptureEventIndex).toHaveBeenCalledWith(null);
  });
});
