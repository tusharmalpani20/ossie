import type { AutomaticCaptureDiagnostic } from "./settings";

export type PageClickCapturePayload = {
  page_url: string | null;
  page_title: string | null;
  target_text: string | null;
  target_role: string | null;
  target_test_id: string | null;
  target_selector: string | null;
  client_x: number;
  client_y: number;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
};

export type PageClickCaptureMessage = {
  type: "ossie:page_click";
  payload: PageClickCapturePayload;
};

export type ClickCaptureState = {
  instanceUrl: string | null;
  sessionToken: string | null;
  activeCaptureSessionId: string | null;
  activeCaptureProjectId: string | null;
  activeCaptureMode: "manual" | "automatic" | null;
  activeCapturePaused: boolean;
};

const sensitive_field_selector = [
  "input",
  "textarea",
  "select",
  "[contenteditable]",
].join(",");

const state_keys = {
  instanceUrl: "instanceUrl",
  sessionToken: "sessionToken",
  activeCaptureSessionId: "activeCaptureSessionId",
  activeCaptureProjectId: "activeCaptureProjectId",
  activeCaptureMode: "activeCaptureMode",
  activeCapturePaused: "activeCapturePaused",
} as const;

type StorageArea = {
  get: (keys?: string[]) => Promise<Record<string, unknown>>;
  set?: (items: Record<string, unknown>) => Promise<void>;
};

const stringOrNull = (value: unknown) => (
  typeof value === "string" && value.trim() ? value : null
);

const activeCaptureModeOrNull = (value: unknown) => (
  value === "manual" || value === "automatic" ? value : null
);

const booleanOrFalse = (value: unknown) => value === true;

const chromeLocalStorage = (): StorageArea => (
  (globalThis as {
    chrome?: {
      storage?: {
        local?: StorageArea;
      };
    };
  }).chrome?.storage?.local ?? {
    get: async () => ({}),
  }
);

const getClickCaptureState = async (
  storage: StorageArea = chromeLocalStorage()
): Promise<ClickCaptureState> => {
  const stored = await storage.get(Object.values(state_keys));

  return {
    instanceUrl: stringOrNull(stored[state_keys.instanceUrl]),
    sessionToken: stringOrNull(stored[state_keys.sessionToken]),
    activeCaptureSessionId: stringOrNull(stored[state_keys.activeCaptureSessionId]),
    activeCaptureProjectId: stringOrNull(stored[state_keys.activeCaptureProjectId]),
    activeCaptureMode: activeCaptureModeOrNull(stored[state_keys.activeCaptureMode]),
    activeCapturePaused: booleanOrFalse(stored[state_keys.activeCapturePaused]),
  };
};

const isAutomaticClickCaptureActive = (settings: ClickCaptureState) => (
  Boolean(
    settings.instanceUrl
    && settings.sessionToken
    && settings.activeCaptureProjectId
    && settings.activeCaptureSessionId
    && settings.activeCaptureMode === "automatic"
    && !settings.activeCapturePaused
  )
);

const automatic_capture_diagnostic_key = "automaticCaptureDiagnostic";

const saveAutomaticCaptureDiagnostic = async (
  diagnostic: AutomaticCaptureDiagnostic,
  storage: StorageArea = chromeLocalStorage()
) => {
  await storage.set?.({ [automatic_capture_diagnostic_key]: diagnostic });
};

const errorMessage = (error: unknown) => (
  error instanceof Error ? error.message : "Automatic capture message delivery failed."
);

const defaultSendMessage = (message: PageClickCaptureMessage) => new Promise<void>((resolve, reject) => {
  const runtime = (globalThis as {
    chrome?: {
      runtime?: {
        lastError?: { message?: string };
        sendMessage?: (
          payload: PageClickCaptureMessage,
          callback?: (response?: { ok?: boolean; reason?: string; message?: string }) => void
        ) => void;
      };
    };
  }).chrome?.runtime;

  if (!runtime?.sendMessage) {
    reject(new Error("Extension message delivery is unavailable."));
    return;
  }

  runtime.sendMessage(message, (response) => {
    const lastError = runtime.lastError;
    if (lastError) {
      reject(new Error(lastError.message ?? "Extension message delivery failed."));
      return;
    }

    if (
      response?.ok === false &&
      response.reason !== "automatic_capture_inactive"
    ) {
      reject(new Error(response.message ?? "Automatic capture failed."));
      return;
    }

    resolve();
  });
});

const cssEscape = (value: string) => (
  typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(value)
    : value.replaceAll(/["\\]/g, "\\$&")
);

const numberOrNull = (value: number | undefined) => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);

const findElement = (target: EventTarget | null) => (
  target instanceof Element ? target : null
);

const roleForElement = (element: Element) => {
  const explicitRole = element.getAttribute("role")?.trim();
  if (explicitRole) {
    return explicitRole;
  }

  const tagName = element.tagName.toLowerCase();
  if (tagName === "button") {
    return "button";
  }
  if (tagName === "a") {
    return "link";
  }

  return null;
};

export const truncateSafeText = (value: string | null | undefined) => {
  const trimmed = value?.replaceAll(/\s+/g, " ").trim() ?? "";
  return trimmed ? trimmed.slice(0, 120) : null;
};

const testIdForElement = (element: Element) => (
  element.getAttribute("data-testid")?.trim()
  || element.getAttribute("data-test-id")?.trim()
  || null
);

const selectorForElement = (element: Element) => {
  const testId = testIdForElement(element);
  const tagName = element.tagName.toLowerCase();

  if (testId) {
    return `${tagName}[data-testid="${cssEscape(testId)}"]`;
  }

  if (element.id) {
    return `${tagName}#${cssEscape(element.id)}`;
  }

  return tagName;
};

const boundingBoxForElement = (element: Element) => {
  const rect = element.getBoundingClientRect();
  if (
    !Number.isFinite(rect.x)
    || !Number.isFinite(rect.y)
    || !Number.isFinite(rect.width)
    || !Number.isFinite(rect.height)
  ) {
    return null;
  }

  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
};

export const shouldCaptureClick = (event: MouseEvent) => {
  if (!event.isTrusted || event.button !== 0) {
    return false;
  }

  const element = findElement(event.target);
  if (!element) {
    return false;
  }

  return !element.closest(sensitive_field_selector);
};

export const buildClickCaptureMessage = (event: MouseEvent): PageClickCaptureMessage | null => {
  if (!shouldCaptureClick(event)) {
    return null;
  }

  const element = findElement(event.target);
  if (!element) {
    return null;
  }

  return {
    type: "ossie:page_click",
    payload: {
      page_url: location.href || null,
      page_title: truncateSafeText(document.title),
      target_text: truncateSafeText(element.textContent),
      target_role: roleForElement(element),
      target_test_id: testIdForElement(element),
      target_selector: selectorForElement(element),
      client_x: event.clientX,
      client_y: event.clientY,
      viewport_width: numberOrNull(window.innerWidth),
      viewport_height: numberOrNull(window.innerHeight),
      device_pixel_ratio: numberOrNull(window.devicePixelRatio),
      bounding_box: boundingBoxForElement(element),
    },
  };
};

export const installClickCaptureListener = (
  sendMessage: (message: PageClickCaptureMessage) => void | Promise<void> = defaultSendMessage,
  getCaptureState: () => Promise<ClickCaptureState> = getClickCaptureState,
  saveDiagnostic: (diagnostic: AutomaticCaptureDiagnostic) => Promise<void> = saveAutomaticCaptureDiagnostic
) => {
  const handleClick = (event: MouseEvent) => {
    if (!shouldCaptureClick(event)) {
      return;
    }

    void getCaptureState()
      .then((settings) => {
        if (!isAutomaticClickCaptureActive(settings)) {
          return;
        }

        const message = buildClickCaptureMessage(event);
        if (message) {
          void Promise.resolve(sendMessage(message)).catch((error: unknown) => {
            void saveDiagnostic({
              status: "failed",
              message: errorMessage(error),
              eventIndex: null,
              occurredAt: new Date().toISOString(),
            }).catch(() => {});
          });
        }
      })
      .catch(() => {});
  };

  document.addEventListener("click", handleClick, true);

  return () => {
    document.removeEventListener("click", handleClick, true);
  };
};
