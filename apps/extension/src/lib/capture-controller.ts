import type {
  AutomaticClickMessage,
  AutomaticCaptureResult,
} from "./automatic-capture";
import {
  buildAutomaticCaptureDependencies,
  handleAutomaticClickCapture,
} from "./automatic-capture";
import {
  ApiClientError,
  createCaptureEvent,
  listCaptureEvents,
  uploadCaptureAsset,
} from "./api";
import type {
  CaptureCommand,
  CaptureCommandResult,
} from "./capture-command";
import { captureVisibleTabScreenshot } from "./screenshot";
import {
  chromeLocalStorage,
  getSettings,
  saveActiveCaptureEventIndex,
  saveActiveCaptureMode,
  saveManualCaptureDiagnostic,
  type ExtensionSettings,
  type ManualCaptureDiagnostic,
} from "./settings";

export type CaptureMessage = AutomaticClickMessage | CaptureCommand;

export type CaptureMessageSender = {
  tab?: {
    id?: number;
    windowId?: number;
  };
};

type CaptureTab = {
  id?: number;
  windowId?: number;
  active?: boolean;
};

type CaptureControllerDependencies = {
  runAutomatic: (
    message: AutomaticClickMessage,
    windowId: number,
  ) => Promise<AutomaticCaptureResult>;
  runManual: () => Promise<CaptureCommandResult>;
  getTab: (tabId: number) => Promise<CaptureTab>;
  getSettings: () => Promise<{
    activeCaptureMode?: "manual" | "automatic" | null;
    activeCapturePaused?: boolean;
  }>;
  saveActiveCaptureMode: (input: {
    mode: "manual" | "automatic";
    paused: boolean;
  }) => Promise<void>;
};

type ActiveTab = CaptureTab & {
  url?: string;
  title?: string;
};

type ManualCaptureDependencies = {
  getSettings: () => Promise<ExtensionSettings>;
  getActiveTab: () => Promise<ActiveTab | null>;
  captureVisibleTabScreenshot: typeof captureVisibleTabScreenshot;
  uploadCaptureAsset: typeof uploadCaptureAsset;
  createCaptureEvent: typeof createCaptureEvent;
  listCaptureEvents: typeof listCaptureEvents;
  saveActiveCaptureEventIndex: (eventIndex: number) => Promise<void>;
  saveManualCaptureDiagnostic: (
    diagnostic: ManualCaptureDiagnostic | null,
  ) => Promise<void>;
};

const busyResult = (): CaptureCommandResult => ({
  ok: false,
  reason: "capture_busy",
  message: "A capture is still saving. Wait for it to finish, then retry.",
});

const isAutomaticMessage = (
  message: CaptureMessage,
): message is AutomaticClickMessage => message.type === "ossie:page_click";

const safePageUrl = (value: string | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
};

const persistManualDiagnostic = async (
  dependencies: ManualCaptureDependencies,
  diagnostic: ManualCaptureDiagnostic,
) => {
  try {
    await dependencies.saveManualCaptureDiagnostic(diagnostic);
  } catch {
    // Diagnostic persistence must not obscure the authoritative API outcome.
  }
};

const reconcileEventIndex = async (
  dependencies: ManualCaptureDependencies,
  settings: ExtensionSettings,
) => {
  const response = await dependencies.listCaptureEvents(
    settings.instanceUrl ?? "",
    settings.sessionToken ?? "",
    settings.activeCaptureProjectId ?? "",
    settings.activeCaptureSessionId ?? "",
  );
  const highestIndex = response.capture_events.reduce(
    (highest, event) => Math.max(highest, event.event_index),
    0,
  );
  await dependencies.saveActiveCaptureEventIndex(highestIndex);
  return highestIndex;
};

export const handleManualCapture = async (
  dependencies: ManualCaptureDependencies,
): Promise<CaptureCommandResult> => {
  const settings = await dependencies.getSettings();
  if (
    !settings.instanceUrl ||
    !settings.sessionToken ||
    !settings.activeCaptureProjectId ||
    !settings.activeCaptureSessionId
  ) {
    return {
      ok: false,
      reason: "capture_inactive",
      message: "No active Capture Session is available.",
    };
  }

  await persistManualDiagnostic(dependencies, {
    status: "saving",
    message: "Saving manual screenshot…",
    eventIndex: null,
    occurredAt: new Date().toISOString(),
  });

  try {
    const tab = await dependencies.getActiveTab();
    if (
      !tab ||
      tab.active !== true ||
      typeof tab.windowId !== "number"
    ) {
      throw new Error(
        "The active tab changed. Return to the page and retry the screenshot.",
      );
    }
    const screenshot = await dependencies.captureVisibleTabScreenshot(
      tab.windowId,
    );
    const pageUrl = safePageUrl(tab.url);
    const pageTitle = tab.title?.trim() || null;
    const asset = await dependencies.uploadCaptureAsset(
      settings.instanceUrl,
      settings.sessionToken,
      settings.activeCaptureProjectId,
      settings.activeCaptureSessionId,
      {
        file: screenshot.blob,
        fileName: `screenshot-${screenshot.capturedAt.replace(/[:.]/g, "-")}.png`,
        width: screenshot.width,
        height: screenshot.height,
        devicePixelRatio: screenshot.devicePixelRatio,
        pageUrl,
        pageTitle,
        capturedAt: screenshot.capturedAt,
        metadata: {
          extension_version: "0.1.0",
          capture_source: "extension_popup",
        },
      },
    );
    const requestedIndex = (settings.activeCaptureEventIndex ?? 0) + 1;
    const event = await dependencies.createCaptureEvent(
      settings.instanceUrl,
      settings.sessionToken,
      settings.activeCaptureProjectId,
      settings.activeCaptureSessionId,
      {
        event_type: "capture",
        event_index: requestedIndex,
        capture_asset_id: asset.capture_asset.id,
        occurred_at: screenshot.capturedAt,
        page_url: pageUrl,
        page_title: pageTitle,
        input_value_redacted: true,
        metadata: {
          extension_version: "0.1.0",
          capture_source: "extension_popup",
          asset_type: "screenshot",
        },
      },
    );
    const eventIndex = event.capture_event.event_index;
    await dependencies.saveActiveCaptureEventIndex(eventIndex);
    await persistManualDiagnostic(dependencies, {
      status: "success",
      message: null,
      eventIndex,
      occurredAt: screenshot.capturedAt,
    });
    return { ok: true, event_index: eventIndex };
  } catch (error: unknown) {
    if (
      error instanceof ApiClientError &&
      error.type === "capture_event_index_conflict"
    ) {
      try {
        const highestIndex = await reconcileEventIndex(dependencies, settings);
        const message =
          "Capture steps were reconciled. Retry the screenshot as a new action; the uploaded image may remain unlinked.";
        await persistManualDiagnostic(dependencies, {
          status: "failed",
          message,
          eventIndex: highestIndex,
          occurredAt: new Date().toISOString(),
        });
        return {
          ok: false,
          reason: "capture_reconciled",
          message,
          reconciled_event_index: highestIndex,
        };
      } catch {
        // Fall through to a safe failure without repeating the upload/Event.
      }
    }

    const message =
      error instanceof Error ? error.message : "Could not capture screenshot.";
    await persistManualDiagnostic(dependencies, {
      status: "failed",
      message,
      eventIndex: null,
      occurredAt: new Date().toISOString(),
    });
    return { ok: false, reason: "capture_failed", message };
  }
};

export const createCaptureController = (
  dependencies: CaptureControllerDependencies,
) => {
  let captureInFlight = false;

  const withCaptureLock = async (
    operation: () => Promise<AutomaticCaptureResult | CaptureCommandResult>,
  ) => {
    if (captureInFlight) return busyResult();
    captureInFlight = true;
    try {
      return await operation();
    } finally {
      captureInFlight = false;
    }
  };

  return {
    handle: async (
      message: CaptureMessage,
      sender: CaptureMessageSender = {},
    ): Promise<AutomaticCaptureResult | CaptureCommandResult> => {
      if (isAutomaticMessage(message)) {
        return withCaptureLock(async () => {
          const senderTabId = sender.tab?.id;
          const senderWindowId = sender.tab?.windowId;
          if (
            typeof senderTabId !== "number" ||
            typeof senderWindowId !== "number"
          ) {
            return {
              ok: false,
              reason: "capture_context_unavailable",
              message:
                "The clicked tab is no longer active. Return to it and retry.",
            };
          }

          const currentTab = await dependencies.getTab(senderTabId);
          if (
            currentTab.id !== senderTabId ||
            currentTab.windowId !== senderWindowId ||
            currentTab.active !== true
          ) {
            return {
              ok: false,
              reason: "capture_context_unavailable",
              message:
                "The clicked tab is no longer active. Return to it and retry.",
            };
          }

          return dependencies.runAutomatic(message, senderWindowId);
        });
      }

      if (message.action === "capture_manual") {
        return withCaptureLock(dependencies.runManual);
      }

      if (message.action === "set_mode") {
        return withCaptureLock(async () => {
          await dependencies.saveActiveCaptureMode({
            mode: message.mode,
            paused: message.paused,
          });
          return { ok: true };
        });
      }

      return withCaptureLock(async () => {
        const settings = await dependencies.getSettings();
        if (settings.activeCaptureMode) {
          await dependencies.saveActiveCaptureMode({
            mode: settings.activeCaptureMode,
            paused: true,
          });
        }
        return { ok: true };
      });
    },
  };
};

type ChromeTabs = {
  get?: (tabId: number) => Promise<ActiveTab>;
  query?: (query: {
    active: boolean;
    currentWindow: boolean;
  }) => Promise<ActiveTab[]>;
};

const chromeTabs = (): ChromeTabs =>
  (globalThis as { chrome?: { tabs?: ChromeTabs } }).chrome?.tabs ?? {};

export const buildCaptureController = () => {
  const storage = chromeLocalStorage();
  const automaticDependencies = buildAutomaticCaptureDependencies();
  const tabs = chromeTabs();
  const manualDependencies: ManualCaptureDependencies = {
    getSettings: () => getSettings(storage),
    getActiveTab: async () => {
      const [tab] =
        (await tabs.query?.({ active: true, currentWindow: true })) ?? [];
      return tab ?? null;
    },
    captureVisibleTabScreenshot,
    uploadCaptureAsset,
    createCaptureEvent,
    listCaptureEvents,
    saveActiveCaptureEventIndex: (eventIndex) =>
      saveActiveCaptureEventIndex(storage, eventIndex),
    saveManualCaptureDiagnostic: (diagnostic) =>
      saveManualCaptureDiagnostic(storage, diagnostic),
  };

  return createCaptureController({
    runAutomatic: (message, windowId) =>
      handleAutomaticClickCapture(
        message,
        automaticDependencies,
        windowId,
      ),
    runManual: () => handleManualCapture(manualDependencies),
    getTab: async (tabId) => {
      if (!tabs.get) return {};
      return tabs.get(tabId);
    },
    getSettings: () => getSettings(storage),
    saveActiveCaptureMode: (input) => saveActiveCaptureMode(storage, input),
  });
};
