import { describe, expect, it, vi } from "vitest";
import {
  createCaptureController,
  handleManualCapture,
} from "./capture-controller";
import type { AutomaticClickMessage } from "./automatic-capture";
import { ApiClientError } from "./api";

const click: AutomaticClickMessage = {
  type: "ossie:page_click",
  payload: {
    page_url: "https://example.com",
    page_title: "Example",
    target_text: "Continue",
    target_selector: "button",
    target_role: "button",
    target_test_id: null,
    client_x: 10,
    client_y: 20,
    viewport_width: 1280,
    viewport_height: 720,
    device_pixel_ratio: 1,
    bounding_box: null,
  },
};

const dependencies = () => ({
  runAutomatic: vi.fn(async () => ({ ok: true as const, event_index: 2 })),
  runManual: vi.fn(async () => ({ ok: true as const, event_index: 3 })),
  getTab: vi.fn(async () => ({ id: 8, windowId: 4, active: true })),
  getSettings: vi.fn(async () => ({
    activeCaptureMode: "automatic" as const,
    activeCapturePaused: false,
  })),
  saveActiveCaptureMode: vi.fn(async () => {}),
});

describe("background capture controller", () => {
  it("serializes automatic and manual screenshot commands", async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const deps = dependencies();
    deps.runAutomatic = vi.fn(async () => {
      await pending;
      return { ok: true, event_index: 2 };
    });
    const controller = createCaptureController(deps);

    const automatic = controller.handle(click, {
      tab: { id: 8, windowId: 4 },
    });
    await expect(
      controller.handle({
        type: "ossie:capture_command",
        action: "capture_manual",
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "capture_busy",
      message: "A capture is still saving. Wait for it to finish, then retry.",
    });

    release?.();
    await expect(automatic).resolves.toEqual({ ok: true, event_index: 2 });
    expect(deps.runManual).not.toHaveBeenCalled();
  });

  it("blocks lifecycle transitions while saving and pauses before quiescing", async () => {
    let release: (() => void) | undefined;
    const deps = dependencies();
    deps.runManual = vi.fn(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: true, event_index: 3 });
        }),
    );
    const controller = createCaptureController(deps);
    const manual = controller.handle({
      type: "ossie:capture_command",
      action: "capture_manual",
    });

    await expect(
      controller.handle({
        type: "ossie:capture_command",
        action: "quiesce",
        transition: "finish",
      }),
    ).resolves.toMatchObject({ ok: false, reason: "capture_busy" });
    expect(deps.saveActiveCaptureMode).not.toHaveBeenCalled();

    release?.();
    await manual;
    await expect(
      controller.handle({
        type: "ossie:capture_command",
        action: "quiesce",
        transition: "finish",
      }),
    ).resolves.toEqual({ ok: true });
    expect(deps.saveActiveCaptureMode).toHaveBeenCalledWith({
      mode: "automatic",
      paused: true,
    });
  });

  it("rejects stale automatic sender tabs before capture", async () => {
    const deps = dependencies();
    deps.getTab.mockResolvedValue({ id: 8, windowId: 4, active: false });
    const controller = createCaptureController(deps);

    await expect(
      controller.handle(click, { tab: { id: 8, windowId: 4 } }),
    ).resolves.toMatchObject({
      ok: false,
      reason: "capture_context_unavailable",
    });
    expect(deps.runAutomatic).not.toHaveBeenCalled();
  });

  it("passes the validated sender window to automatic screenshot capture", async () => {
    const deps = dependencies();
    const controller = createCaptureController(deps);

    await controller.handle(click, { tab: { id: 8, windowId: 4 } });

    expect(deps.runAutomatic).toHaveBeenCalledWith(click, 4);
  });

  it("allocates manual screenshot Events from fresh storage with privacy defaults", async () => {
    const saveManualCaptureDiagnostic = vi.fn(async () => {});
    const saveActiveCaptureEventIndex = vi.fn(async () => {});
    const createCaptureEvent = vi.fn(
      async () =>
        ({
          capture_event: { event_index: 8 },
        }) as never,
    );
    const deps = {
      getSettings: vi.fn(async () => ({
        instanceUrl: "https://api.example.com",
        sessionToken: "token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 7,
        activeCaptureMode: "automatic" as const,
        activeCapturePaused: true,
      })),
      getActiveTab: vi.fn(async () => ({
        id: 1,
        windowId: 12,
        active: true,
        url: "https://example.com/page",
        title: "Example",
      })),
      captureVisibleTabScreenshot: vi.fn(async () => ({
        blob: new Blob(["png"], { type: "image/png" }),
        mimeType: "image/png" as const,
        width: 320,
        height: 200,
        devicePixelRatio: 2,
        capturedAt: "2026-07-29T09:00:00.000Z",
      })),
      uploadCaptureAsset: vi.fn(
        async () =>
          ({
            capture_asset: { id: "asset_1" },
          }) as never,
      ),
      createCaptureEvent,
      listCaptureEvents: vi.fn(async () => ({ capture_events: [] })),
      saveActiveCaptureEventIndex,
      saveManualCaptureDiagnostic,
    };

    await expect(handleManualCapture(deps)).resolves.toEqual({
      ok: true,
      event_index: 8,
    });
    expect(deps.captureVisibleTabScreenshot).toHaveBeenCalledWith(12);
    expect(createCaptureEvent).toHaveBeenCalledWith(
      "https://api.example.com",
      "token",
      "project_1",
      "session_1",
      expect.objectContaining({
        event_type: "capture",
        event_index: 8,
        input_value_redacted: true,
      }),
    );
    expect(saveActiveCaptureEventIndex).toHaveBeenCalledWith(8);
    expect(saveManualCaptureDiagnostic).toHaveBeenNthCalledWith(1, {
      status: "saving",
      message: "Saving manual screenshot…",
      eventIndex: null,
      occurredAt: expect.any(String),
    });
  });

  it("blocks manual capture until a missing Event index is reconciled", async () => {
    const deps = {
      getSettings: vi.fn(async () => ({
        instanceUrl: "https://api.example.com",
        sessionToken: "token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: null,
        activeCaptureMode: "manual" as const,
        activeCapturePaused: false,
      })),
      getActiveTab: vi.fn(),
      captureVisibleTabScreenshot: vi.fn(),
      uploadCaptureAsset: vi.fn(),
      createCaptureEvent: vi.fn(),
      listCaptureEvents: vi.fn(),
      saveActiveCaptureEventIndex: vi.fn(),
      saveManualCaptureDiagnostic: vi.fn(async () => {}),
    };

    await expect(handleManualCapture(deps)).resolves.toEqual({
      ok: false,
      reason: "capture_reconciliation_failed",
      message:
        "Capture steps must be reconciled before another screenshot can be saved. Reopen or retry the extension.",
    });
    expect(deps.getActiveTab).not.toHaveBeenCalled();
  });

  it("marks the Event index unreconciled when conflict recovery fails", async () => {
    const deps = {
      getSettings: vi.fn(async () => ({
        instanceUrl: "https://api.example.com",
        sessionToken: "token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 7,
        activeCaptureMode: "manual" as const,
        activeCapturePaused: false,
      })),
      getActiveTab: vi.fn(async () => ({
        id: 1,
        windowId: 12,
        active: true,
        url: "https://example.com/page",
        title: "Example",
      })),
      captureVisibleTabScreenshot: vi.fn(async () => ({
        blob: new Blob(["png"], { type: "image/png" }),
        mimeType: "image/png" as const,
        width: 320,
        height: 200,
        devicePixelRatio: 2,
        capturedAt: "2026-07-29T09:00:00.000Z",
      })),
      uploadCaptureAsset: vi.fn(
        async () =>
          ({
            capture_asset: { id: "asset_1" },
          }) as never,
      ),
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
      saveActiveCaptureEventIndex: vi.fn(async () => {}),
      saveManualCaptureDiagnostic: vi.fn(async () => {}),
    };

    await expect(handleManualCapture(deps)).resolves.toEqual({
      ok: false,
      reason: "capture_reconciliation_failed",
      message:
        "Capture steps could not be reconciled. Reopen or retry the extension before capturing again.",
    });
    expect(deps.saveActiveCaptureEventIndex).toHaveBeenCalledWith(null);
  });

  it("blocks later capture commands until restored state acknowledges reconciliation", async () => {
    const deps = dependencies();
    deps.runManual
      .mockResolvedValueOnce({
        ok: false,
        reason: "capture_reconciliation_failed",
        message: "Capture steps could not be reconciled.",
      } as never)
      .mockResolvedValueOnce({ ok: true, event_index: 8 });
    const controller = createCaptureController(deps);
    const manualCommand = {
      type: "ossie:capture_command" as const,
      action: "capture_manual" as const,
    };

    await expect(controller.handle(manualCommand)).resolves.toMatchObject({
      ok: false,
      reason: "capture_reconciliation_failed",
    });
    await expect(controller.handle(manualCommand)).resolves.toMatchObject({
      ok: false,
      reason: "capture_reconciliation_failed",
    });
    expect(deps.runManual).toHaveBeenCalledTimes(1);

    await expect(
      controller.handle({
        type: "ossie:capture_command",
        action: "acknowledge_reconciliation",
      }),
    ).resolves.toEqual({ ok: true });
    await expect(controller.handle(manualCommand)).resolves.toEqual({
      ok: true,
      event_index: 8,
    });
  });
});
