import {
  ApiClientError,
  createCaptureEvent,
  listCaptureEvents,
  uploadCaptureAsset,
  type CaptureAssetResponse,
  type CaptureEventResponse,
} from "./api";
import {
  captureVisibleTabScreenshot,
  type ScreenshotCapture,
} from "./screenshot";
import {
  chromeLocalStorage,
  getSettings,
  saveActiveCaptureEventIndex,
  saveAutomaticCaptureDiagnostic,
  type ExtensionSettings,
  type AutomaticCaptureDiagnostic,
} from "./settings";
import type { PageClickCaptureMessage } from "./content-click-capture";

export type AutomaticClickMessage = PageClickCaptureMessage;

export type AutomaticCaptureResult =
  | { ok: true; event_index: number }
  | {
      ok: false;
      reason:
        | "automatic_capture_inactive"
        | "automatic_capture_failed"
        | "automatic_capture_busy"
        | "capture_context_unavailable"
        | "capture_reconciled"
        | "capture_reconciliation_failed";
      message?: string;
      reconciled_event_index?: number;
    };

type AutomaticCaptureDependencies = {
  getSettings: () => Promise<ExtensionSettings>;
  captureVisibleTabScreenshot: (
    windowId?: number,
  ) => Promise<ScreenshotCapture>;
  uploadCaptureAsset: typeof uploadCaptureAsset;
  createCaptureEvent: typeof createCaptureEvent;
  listCaptureEvents: typeof listCaptureEvents;
  saveActiveCaptureEventIndex: (eventIndex: number | null) => Promise<void>;
  saveAutomaticCaptureDiagnostic: (
    diagnostic: AutomaticCaptureDiagnostic | null,
  ) => Promise<void>;
};

const screenshotFileName = (capturedAt: string) =>
  `screenshot-${capturedAt.replace(/[:.]/g, "-")}.png`;

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Automatic capture failed";

const activeAutomaticCapture = (settings: ExtensionSettings) =>
  Boolean(
    settings.instanceUrl &&
    settings.sessionToken &&
    settings.activeCaptureProjectId &&
    settings.activeCaptureSessionId &&
    settings.activeCaptureMode === "automatic" &&
    !settings.activeCapturePaused,
  );

export const buildAutomaticCaptureDependencies =
  (): AutomaticCaptureDependencies => {
    const storage = chromeLocalStorage();

    return {
      getSettings: () => getSettings(storage),
      captureVisibleTabScreenshot,
      uploadCaptureAsset,
      createCaptureEvent,
      listCaptureEvents,
      saveActiveCaptureEventIndex: (eventIndex) =>
        saveActiveCaptureEventIndex(storage, eventIndex),
      saveAutomaticCaptureDiagnostic: (diagnostic) =>
        saveAutomaticCaptureDiagnostic(storage, diagnostic),
    };
  };

const persistAutomaticCaptureDiagnostic = async (
  dependencies: AutomaticCaptureDependencies,
  diagnostic: AutomaticCaptureDiagnostic,
) => {
  try {
    await dependencies.saveAutomaticCaptureDiagnostic(diagnostic);
  } catch {
    // Capture success/failure should not be hidden by diagnostic persistence failure.
  }
};

export const handleAutomaticClickCapture = async (
  message: AutomaticClickMessage,
  dependencies: AutomaticCaptureDependencies = buildAutomaticCaptureDependencies(),
  windowId?: number,
): Promise<AutomaticCaptureResult> => {
  const settings = await dependencies.getSettings();

  if (!activeAutomaticCapture(settings)) {
    return {
      ok: false,
      reason: "automatic_capture_inactive",
    };
  }
  if (settings.activeCaptureEventIndex === null) {
    return {
      ok: false,
      reason: "capture_reconciliation_failed",
      message:
        "Capture steps must be reconciled before another click can be saved. Reopen or retry the extension.",
    };
  }

  const {
    instanceUrl,
    sessionToken,
    activeCaptureProjectId,
    activeCaptureSessionId,
  } = settings;
  const nextEventIndex = (settings.activeCaptureEventIndex ?? 0) + 1;

  await persistAutomaticCaptureDiagnostic(dependencies, {
    status: "saving",
    message: "Saving automatic capture…",
    eventIndex: null,
    occurredAt: new Date().toISOString(),
  });

  try {
    const screenshot = await dependencies.captureVisibleTabScreenshot(windowId);
    const asset: CaptureAssetResponse = await dependencies.uploadCaptureAsset(
      instanceUrl ?? "",
      sessionToken ?? "",
      activeCaptureProjectId ?? "",
      activeCaptureSessionId ?? "",
      {
        file: screenshot.blob,
        fileName: screenshotFileName(screenshot.capturedAt),
        width: screenshot.width,
        height: screenshot.height,
        devicePixelRatio: screenshot.devicePixelRatio,
        pageUrl: message.payload.page_url,
        pageTitle: message.payload.page_title,
        capturedAt: screenshot.capturedAt,
        metadata: {
          extension_version: "0.1.0",
          capture_source: "extension_auto_click",
          click: {
            target_selector: message.payload.target_selector,
            bounding_box: message.payload.bounding_box,
          },
        },
      },
    );
    const event: CaptureEventResponse = await dependencies.createCaptureEvent(
      instanceUrl ?? "",
      sessionToken ?? "",
      activeCaptureProjectId ?? "",
      activeCaptureSessionId ?? "",
      {
        event_type: "click",
        event_index: nextEventIndex,
        capture_asset_id: asset.capture_asset.id,
        occurred_at: screenshot.capturedAt,
        page_url: message.payload.page_url,
        page_title: message.payload.page_title,
        target_text: message.payload.target_text,
        target_selector: message.payload.target_selector,
        target_role: message.payload.target_role,
        target_test_id: message.payload.target_test_id,
        client_x: message.payload.client_x,
        client_y: message.payload.client_y,
        viewport_width: message.payload.viewport_width,
        viewport_height: message.payload.viewport_height,
        device_pixel_ratio: message.payload.device_pixel_ratio,
        input_value_redacted: true,
        metadata: {
          extension_version: "0.1.0",
          capture_source: "extension_auto_click",
          asset_type: "screenshot",
          bounding_box: message.payload.bounding_box,
        },
      },
    );

    await dependencies.saveActiveCaptureEventIndex(
      event.capture_event.event_index,
    );
    await persistAutomaticCaptureDiagnostic(dependencies, {
      status: "success",
      message: null,
      eventIndex: event.capture_event.event_index,
      occurredAt: screenshot.capturedAt,
    });

    return {
      ok: true,
      event_index: event.capture_event.event_index,
    };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      error.type === "capture_event_index_conflict"
    ) {
      try {
        const response = await dependencies.listCaptureEvents(
          instanceUrl ?? "",
          sessionToken ?? "",
          activeCaptureProjectId ?? "",
          activeCaptureSessionId ?? "",
        );
        const highestIndex = response.capture_events.reduce(
          (highest, event) => Math.max(highest, event.event_index),
          0,
        );
        await dependencies.saveActiveCaptureEventIndex(highestIndex);
        const reconciledMessage =
          "Capture steps were reconciled. Retry the click as a new action.";
        await persistAutomaticCaptureDiagnostic(dependencies, {
          status: "failed",
          message: reconciledMessage,
          eventIndex: highestIndex,
          occurredAt: new Date().toISOString(),
        });
        return {
          ok: false,
          reason: "capture_reconciled",
          message: reconciledMessage,
          reconciled_event_index: highestIndex,
        };
      } catch {
        try {
          await dependencies.saveActiveCaptureEventIndex(null);
        } catch {
          // The current command still fails closed if storage is unavailable.
        }
        const reconciliationMessage =
          "Capture steps could not be reconciled. Reopen or retry the extension before capturing again.";
        await persistAutomaticCaptureDiagnostic(dependencies, {
          status: "failed",
          message: reconciliationMessage,
          eventIndex: null,
          occurredAt: new Date().toISOString(),
        });
        return {
          ok: false,
          reason: "capture_reconciliation_failed",
          message: reconciliationMessage,
        };
      }
    }

    const messageText = errorMessage(error);
    await persistAutomaticCaptureDiagnostic(dependencies, {
      status: "failed",
      message: messageText,
      eventIndex: null,
      occurredAt: new Date().toISOString(),
    });

    return {
      ok: false,
      reason: "automatic_capture_failed",
      message: messageText,
    };
  }
};

export const createAutomaticCaptureController = (
  dependencies: AutomaticCaptureDependencies = buildAutomaticCaptureDependencies(),
) => {
  let captureInFlight = false;

  return async (
    message: AutomaticClickMessage,
  ): Promise<AutomaticCaptureResult> => {
    if (captureInFlight) {
      return {
        ok: false,
        reason: "automatic_capture_busy",
      };
    }

    captureInFlight = true;

    try {
      return await handleAutomaticClickCapture(message, dependencies);
    } finally {
      captureInFlight = false;
    }
  };
};
