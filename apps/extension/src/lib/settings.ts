export type AutomaticCaptureDiagnostic = {
  status: "saving" | "success" | "failed";
  message: string | null;
  eventIndex: number | null;
  occurredAt: string;
};

export type ManualCaptureDiagnostic = {
  status: "saving" | "success" | "failed";
  message: string | null;
  eventIndex: number | null;
  occurredAt: string;
};

export type ExtensionSettings = {
  instanceUrl: string | null;
  portalUrl?: string | null;
  sessionToken: string | null;
  selectedProjectId: string | null;
  selectedProjectVersionId?: string | null;
  selectedProjectVersionSlug?: string | null;
  selectedProjectVersionName?: string | null;
  activeCaptureSessionId: string | null;
  activeCaptureProjectId: string | null;
  activeCaptureProjectVersionId?: string | null;
  activeCaptureProjectVersionSlug?: string | null;
  activeCaptureProjectVersionName?: string | null;
  activeCaptureEventIndex: number | null;
  activeCaptureMode: "manual" | "automatic" | null;
  activeCapturePaused: boolean;
  automaticCaptureDiagnostic?: AutomaticCaptureDiagnostic | null;
  manualCaptureDiagnostic?: ManualCaptureDiagnostic | null;
};

export type ExtensionStorageArea = {
  get: (
    keys?: string | string[] | Record<string, unknown> | null,
  ) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
};

const keys = {
  instanceUrl: "instanceUrl",
  portalUrl: "portalUrl",
  sessionToken: "sessionToken",
  selectedProjectId: "selectedProjectId",
  selectedProjectVersionId: "selectedProjectVersionId",
  selectedProjectVersionSlug: "selectedProjectVersionSlug",
  selectedProjectVersionName: "selectedProjectVersionName",
  activeCaptureSessionId: "activeCaptureSessionId",
  activeCaptureProjectId: "activeCaptureProjectId",
  activeCaptureProjectVersionId: "activeCaptureProjectVersionId",
  activeCaptureProjectVersionSlug: "activeCaptureProjectVersionSlug",
  activeCaptureProjectVersionName: "activeCaptureProjectVersionName",
  activeCaptureEventIndex: "activeCaptureEventIndex",
  activeCaptureMode: "activeCaptureMode",
  activeCapturePaused: "activeCapturePaused",
  automaticCaptureDiagnostic: "automaticCaptureDiagnostic",
  manualCaptureDiagnostic: "manualCaptureDiagnostic",
} as const;

const default_settings: ExtensionSettings = {
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

const stringOrNull = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : null;

const nonNegativeIntegerOrNull = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;

const activeCaptureModeOrNull = (value: unknown) =>
  value === "manual" || value === "automatic" ? value : null;

const booleanOrFalse = (value: unknown) => value === true;

const automaticCaptureDiagnosticOrNull = (
  value: unknown,
): AutomaticCaptureDiagnostic | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const diagnostic = value as Partial<AutomaticCaptureDiagnostic>;
  const status = diagnostic.status;
  const occurredAt = stringOrNull(diagnostic.occurredAt);

  if (
    status !== "saving" &&
    status !== "success" &&
    status !== "failed"
  ) {
    return null;
  }
  if (!occurredAt) {
    return null;
  }

  return {
    status,
    message: stringOrNull(diagnostic.message),
    eventIndex: nonNegativeIntegerOrNull(diagnostic.eventIndex),
    occurredAt,
  };
};

const manualCaptureDiagnosticOrNull = (
  value: unknown,
): ManualCaptureDiagnostic | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const diagnostic = value as Partial<ManualCaptureDiagnostic>;
  const status = diagnostic.status;
  const occurredAt = stringOrNull(diagnostic.occurredAt);

  if (
    status !== "saving" &&
    status !== "success" &&
    status !== "failed"
  ) {
    return null;
  }
  if (!occurredAt) {
    return null;
  }

  return {
    status,
    message: stringOrNull(diagnostic.message),
    eventIndex: nonNegativeIntegerOrNull(diagnostic.eventIndex),
    occurredAt,
  };
};

const assertNonNegativeInteger = (value: number) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      "Active capture event index must be a non-negative integer.",
    );
  }
};

const assertActiveCaptureMode = (value: "manual" | "automatic") => {
  if (value !== "manual" && value !== "automatic") {
    throw new Error("Active capture mode is invalid.");
  }
};

export const chromeLocalStorage = (): ExtensionStorageArea => {
  const chromeStorage = (
    globalThis as {
      chrome?: {
        storage?: {
          local?: ExtensionStorageArea;
        };
      };
    }
  ).chrome?.storage?.local;

  if (!chromeStorage) {
    return {
      get: async () => ({}),
      set: async () => {},
      remove: async () => {},
    };
  }

  return chromeStorage;
};

type StorageChange = {
  oldValue?: unknown;
  newValue?: unknown;
};

export type ExtensionStorageChangeEvent = {
  addListener: (
    listener: (
      changes: Record<string, StorageChange>,
      areaName: string,
    ) => void,
  ) => void;
  removeListener: (
    listener: (
      changes: Record<string, StorageChange>,
      areaName: string,
    ) => void,
  ) => void;
};

const relevantLiveSettingKeys = new Set<string>([
  keys.activeCaptureSessionId,
  keys.activeCaptureProjectId,
  keys.activeCaptureProjectVersionId,
  keys.activeCaptureProjectVersionSlug,
  keys.activeCaptureProjectVersionName,
  keys.activeCaptureEventIndex,
  keys.activeCaptureMode,
  keys.activeCapturePaused,
  keys.automaticCaptureDiagnostic,
  keys.manualCaptureDiagnostic,
]);

const chromeStorageChangeEvent = (): ExtensionStorageChangeEvent | null =>
  (
    globalThis as {
      chrome?: { storage?: { onChanged?: ExtensionStorageChangeEvent } };
    }
  ).chrome?.storage?.onChanged ?? null;

export const subscribeToSettingsChanges = (
  onChange: () => void,
  event: ExtensionStorageChangeEvent | null = chromeStorageChangeEvent(),
) => {
  if (!event) {
    return () => {};
  }

  const listener = (
    changes: Record<string, StorageChange>,
    areaName: string,
  ) => {
    if (
      areaName === "local" &&
      Object.keys(changes).some((key) => relevantLiveSettingKeys.has(key))
    ) {
      onChange();
    }
  };

  event.addListener(listener);
  return () => event.removeListener(listener);
};

export const getSettings = async (
  storage: ExtensionStorageArea = chromeLocalStorage(),
): Promise<ExtensionSettings> => {
  const stored = await storage.get(Object.values(keys));

  return {
    instanceUrl: stringOrNull(stored[keys.instanceUrl]),
    portalUrl: stringOrNull(stored[keys.portalUrl]),
    sessionToken: stringOrNull(stored[keys.sessionToken]),
    selectedProjectId: stringOrNull(stored[keys.selectedProjectId]),
    selectedProjectVersionId: stringOrNull(
      stored[keys.selectedProjectVersionId],
    ),
    selectedProjectVersionSlug: stringOrNull(
      stored[keys.selectedProjectVersionSlug],
    ),
    selectedProjectVersionName: stringOrNull(
      stored[keys.selectedProjectVersionName],
    ),
    activeCaptureSessionId: stringOrNull(stored[keys.activeCaptureSessionId]),
    activeCaptureProjectId: stringOrNull(stored[keys.activeCaptureProjectId]),
    activeCaptureProjectVersionId: stringOrNull(
      stored[keys.activeCaptureProjectVersionId],
    ),
    activeCaptureProjectVersionSlug: stringOrNull(
      stored[keys.activeCaptureProjectVersionSlug],
    ),
    activeCaptureProjectVersionName: stringOrNull(
      stored[keys.activeCaptureProjectVersionName],
    ),
    activeCaptureEventIndex: nonNegativeIntegerOrNull(
      stored[keys.activeCaptureEventIndex],
    ),
    activeCaptureMode: activeCaptureModeOrNull(stored[keys.activeCaptureMode]),
    activeCapturePaused: booleanOrFalse(stored[keys.activeCapturePaused]),
    automaticCaptureDiagnostic: automaticCaptureDiagnosticOrNull(
      stored[keys.automaticCaptureDiagnostic],
    ),
    manualCaptureDiagnostic: manualCaptureDiagnosticOrNull(
      stored[keys.manualCaptureDiagnostic],
    ),
  };
};

export const saveInstanceUrl = async (
  storage: ExtensionStorageArea,
  instanceUrl: string,
) => {
  await storage.set({
    [keys.instanceUrl]: instanceUrl,
    [keys.portalUrl]: null,
    [keys.sessionToken]: null,
    [keys.selectedProjectId]: null,
    [keys.selectedProjectVersionId]: null,
    [keys.selectedProjectVersionSlug]: null,
    [keys.selectedProjectVersionName]: null,
    [keys.activeCaptureSessionId]: null,
    [keys.activeCaptureProjectId]: null,
    [keys.activeCaptureProjectVersionId]: null,
    [keys.activeCaptureProjectVersionSlug]: null,
    [keys.activeCaptureProjectVersionName]: null,
    [keys.activeCaptureEventIndex]: null,
    [keys.activeCaptureMode]: null,
    [keys.activeCapturePaused]: false,
    [keys.automaticCaptureDiagnostic]: null,
    [keys.manualCaptureDiagnostic]: null,
  });
};

export const savePortalUrl = async (
  storage: ExtensionStorageArea,
  portalUrl: string | null,
) => {
  await storage.set({ [keys.portalUrl]: portalUrl });
};

export const saveSessionToken = async (
  storage: ExtensionStorageArea,
  sessionToken: string | null,
) => {
  await storage.set({
    [keys.sessionToken]: sessionToken,
    ...(sessionToken === null
      ? {
          [keys.activeCaptureSessionId]: null,
          [keys.activeCaptureProjectId]: null,
          [keys.activeCaptureProjectVersionId]: null,
          [keys.activeCaptureProjectVersionSlug]: null,
          [keys.activeCaptureProjectVersionName]: null,
          [keys.activeCaptureEventIndex]: null,
          [keys.activeCaptureMode]: null,
          [keys.activeCapturePaused]: false,
          [keys.automaticCaptureDiagnostic]: null,
          [keys.manualCaptureDiagnostic]: null,
        }
      : {}),
  });
};

export const saveSelectedProjectId = async (
  storage: ExtensionStorageArea,
  selectedProjectId: string | null,
  version?: { id: string; slug: string; name: string } | null,
) => {
  await storage.set({
    [keys.selectedProjectId]: selectedProjectId,
    [keys.selectedProjectVersionId]: version?.id ?? null,
    [keys.selectedProjectVersionSlug]: version?.slug ?? null,
    [keys.selectedProjectVersionName]: version?.name ?? null,
  });
};

export const saveActiveCapture = async (
  storage: ExtensionStorageArea,
  input: {
    captureSessionId: string;
    projectId: string;
    projectVersionId?: string;
    projectVersionSlug?: string;
    projectVersionName?: string;
    eventIndex?: number;
    mode?: "manual" | "automatic";
  },
) => {
  const eventIndex = input.eventIndex ?? 0;
  const mode = input.mode ?? "manual";
  assertNonNegativeInteger(eventIndex);
  assertActiveCaptureMode(mode);

  await storage.set({
    [keys.activeCaptureSessionId]: input.captureSessionId,
    [keys.activeCaptureProjectId]: input.projectId,
    [keys.activeCaptureProjectVersionId]: input.projectVersionId ?? null,
    [keys.activeCaptureProjectVersionSlug]: input.projectVersionSlug ?? null,
    [keys.activeCaptureProjectVersionName]: input.projectVersionName ?? null,
    [keys.activeCaptureEventIndex]: eventIndex,
    [keys.activeCaptureMode]: mode,
    [keys.activeCapturePaused]: false,
    [keys.automaticCaptureDiagnostic]: null,
    [keys.manualCaptureDiagnostic]: null,
  });
};

export const saveActiveCaptureVersionContext = async (
  storage: ExtensionStorageArea,
  input: {
    captureSessionId: string;
    projectId: string;
    projectVersionId: string;
    projectVersionSlug: string;
    projectVersionName: string;
  },
) => {
  await storage.set({
    [keys.activeCaptureSessionId]: input.captureSessionId,
    [keys.activeCaptureProjectId]: input.projectId,
    [keys.activeCaptureProjectVersionId]: input.projectVersionId,
    [keys.activeCaptureProjectVersionSlug]: input.projectVersionSlug,
    [keys.activeCaptureProjectVersionName]: input.projectVersionName,
  });
};

export const saveAutomaticCaptureDiagnostic = async (
  storage: ExtensionStorageArea,
  diagnostic: AutomaticCaptureDiagnostic | null,
) => {
  await storage.set({ [keys.automaticCaptureDiagnostic]: diagnostic });
};

export const saveManualCaptureDiagnostic = async (
  storage: ExtensionStorageArea,
  diagnostic: ManualCaptureDiagnostic | null,
) => {
  await storage.set({ [keys.manualCaptureDiagnostic]: diagnostic });
};

export const saveActiveCaptureEventIndex = async (
  storage: ExtensionStorageArea,
  eventIndex: number,
) => {
  assertNonNegativeInteger(eventIndex);
  await storage.set({ [keys.activeCaptureEventIndex]: eventIndex });
};

export const saveActiveCaptureMode = async (
  storage: ExtensionStorageArea,
  input: {
    mode: "manual" | "automatic";
    paused: boolean;
  },
) => {
  assertActiveCaptureMode(input.mode);
  await storage.set({
    [keys.activeCaptureMode]: input.mode,
    [keys.activeCapturePaused]: input.paused,
  });
};

export const clearActiveCapture = async (
  storage: ExtensionStorageArea = chromeLocalStorage(),
) => {
  await storage.set({
    [keys.activeCaptureSessionId]: null,
    [keys.activeCaptureProjectId]: null,
    [keys.activeCaptureProjectVersionId]: null,
    [keys.activeCaptureProjectVersionSlug]: null,
    [keys.activeCaptureProjectVersionName]: null,
    [keys.activeCaptureEventIndex]: null,
    [keys.activeCaptureMode]: null,
    [keys.activeCapturePaused]: false,
    [keys.automaticCaptureDiagnostic]: null,
    [keys.manualCaptureDiagnostic]: null,
  });
};

export const clearSettings = async (
  storage: ExtensionStorageArea = chromeLocalStorage(),
) => {
  await storage.remove(Object.values(keys));
};

export const emptySettings = () => ({ ...default_settings });
