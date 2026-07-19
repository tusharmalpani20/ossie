import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSettings,
  getSettings,
  saveActiveCaptureMode,
  saveActiveCapture,
  saveActiveCaptureVersionContext,
  saveActiveCaptureEventIndex,
  saveAutomaticCaptureDiagnostic,
  saveManualCaptureDiagnostic,
  saveInstanceUrl,
  savePortalUrl,
  saveSelectedProjectId,
  saveSessionToken,
  clearActiveCapture,
  type ExtensionStorageArea,
} from "./settings";

const createStorage = (): ExtensionStorageArea & {
  values: Record<string, unknown>;
} => {
  const values: Record<string, unknown> = {};

  return {
    values,
    get: async (keys) => {
      if (Array.isArray(keys)) {
        return Object.fromEntries(keys.map((key) => [key, values[key]]));
      }

      return { ...values };
    },
    set: async (items) => {
      Object.assign(values, items);
    },
    remove: async (keys) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        delete values[key];
      }
    },
  };
};

let storage: ReturnType<typeof createStorage>;

beforeEach(() => {
  storage = createStorage();
});

describe("extension settings", () => {
  it("returns null defaults when no settings are stored", async () => {
    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: null,
      portalUrl: null,
      sessionToken: null,
      selectedProjectId: null,
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: null,
      activeCaptureMode: null,
      activeCapturePaused: false,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: null,
    });
  });

  it("saves portal URL without clearing auth or active capture state", async () => {
    await saveInstanceUrl(storage, "http://localhost:4021");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
      mode: "automatic",
    });

    await savePortalUrl(storage, "http://localhost:3000");

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "http://localhost:4021",
      portalUrl: "http://localhost:3000",
      sessionToken: "session-token",
      selectedProjectId: "project_1",
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: "capture_session_1",
      activeCaptureProjectId: "project_1",
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: 0,
      activeCaptureMode: "automatic",
      activeCapturePaused: false,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: null,
    });
  });

  it("saves automatic capture diagnostics without clearing split-origin or active capture state", async () => {
    await saveInstanceUrl(storage, "http://localhost:4021");
    await savePortalUrl(storage, "http://localhost:3000");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
      mode: "automatic",
    });

    await saveAutomaticCaptureDiagnostic(storage, {
      status: "failed",
      message: "Screenshot capture is unavailable.",
      eventIndex: null,
      occurredAt: "2026-06-30T10:00:00.000Z",
    });

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "http://localhost:4021",
      portalUrl: "http://localhost:3000",
      sessionToken: "session-token",
      selectedProjectId: "project_1",
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: "capture_session_1",
      activeCaptureProjectId: "project_1",
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: 0,
      activeCaptureMode: "automatic",
      activeCapturePaused: false,
      automaticCaptureDiagnostic: {
        status: "failed",
        message: "Screenshot capture is unavailable.",
        eventIndex: null,
        occurredAt: "2026-06-30T10:00:00.000Z",
      },
      manualCaptureDiagnostic: null,
    });
  });

  it("saves manual capture diagnostics without clearing split-origin or active capture state", async () => {
    await saveInstanceUrl(storage, "http://localhost:4021");
    await savePortalUrl(storage, "http://localhost:3000");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
      mode: "automatic",
    });

    await saveManualCaptureDiagnostic(storage, {
      status: "failed",
      message: "Capture asset upload is too large",
      eventIndex: null,
      occurredAt: "2026-06-30T10:05:00.000Z",
    });

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "http://localhost:4021",
      portalUrl: "http://localhost:3000",
      sessionToken: "session-token",
      selectedProjectId: "project_1",
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: "capture_session_1",
      activeCaptureProjectId: "project_1",
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: 0,
      activeCaptureMode: "automatic",
      activeCapturePaused: false,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: {
        status: "failed",
        message: "Capture asset upload is too large",
        eventIndex: null,
        occurredAt: "2026-06-30T10:05:00.000Z",
      },
    });
  });

  it("saves instance URL and clears session/project state", async () => {
    await saveSessionToken(storage, "token_1");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
    });
    await savePortalUrl(storage, "http://localhost:3000");

    await saveInstanceUrl(storage, "https://demo.example.com");

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      portalUrl: null,
      sessionToken: null,
      selectedProjectId: null,
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: null,
      activeCaptureMode: null,
      activeCapturePaused: false,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: null,
    });
  });

  it("clears active capture when the session token is cleared", async () => {
    await saveInstanceUrl(storage, "https://demo.example.com");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
    });

    await saveSessionToken(storage, null);

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      portalUrl: null,
      sessionToken: null,
      selectedProjectId: "project_1",
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: null,
      activeCaptureMode: null,
      activeCapturePaused: false,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: null,
    });
  });

  it("saves automatic active capture mode and pause state without clearing selected project", async () => {
    await saveInstanceUrl(storage, "https://demo.example.com");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
      mode: "automatic",
    });

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      portalUrl: null,
      sessionToken: "session-token",
      selectedProjectId: "project_1",
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: "capture_session_1",
      activeCaptureProjectId: "project_1",
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: 0,
      activeCaptureMode: "automatic",
      activeCapturePaused: false,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: null,
    });

    await saveActiveCaptureMode(storage, {
      mode: "automatic",
      paused: true,
    });

    await saveActiveCaptureEventIndex(storage, 3);

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      portalUrl: null,
      sessionToken: "session-token",
      selectedProjectId: "project_1",
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: "capture_session_1",
      activeCaptureProjectId: "project_1",
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: 3,
      activeCaptureMode: "automatic",
      activeCapturePaused: true,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: null,
    });

    await clearActiveCapture(storage);

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      portalUrl: null,
      sessionToken: "session-token",
      selectedProjectId: "project_1",
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: null,
      activeCaptureMode: null,
      activeCapturePaused: false,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: null,
    });
  });

  it("repairs only the authoritative active Capture Version context", async () => {
    await storage.set({ activeCaptureMode: "automatic" });

    await saveActiveCaptureVersionContext(storage, {
      captureSessionId: "capture_1",
      projectId: "project_1",
      projectVersionId: "version_next",
      projectVersionSlug: "next",
      projectVersionName: "Next",
    });

    expect(storage.values).toMatchObject({
      activeCaptureSessionId: "capture_1",
      activeCaptureProjectId: "project_1",
      activeCaptureProjectVersionId: "version_next",
      activeCaptureProjectVersionSlug: "next",
      activeCaptureProjectVersionName: "Next",
      activeCaptureMode: "automatic",
    });
  });

  it("clears all stored settings", async () => {
    await saveInstanceUrl(storage, "https://demo.example.com");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
    });

    await clearSettings(storage);

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: null,
      portalUrl: null,
      sessionToken: null,
      selectedProjectId: null,
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: null,
      activeCaptureMode: null,
      activeCapturePaused: false,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: null,
    });
  });

  it("ignores invalid stored active capture event indexes", async () => {
    storage.values.activeCaptureEventIndex = -1;

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: null,
      portalUrl: null,
      sessionToken: null,
      selectedProjectId: null,
      selectedProjectVersionId: null,
      selectedProjectVersionSlug: null,
      selectedProjectVersionName: null,
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureProjectVersionId: null,
      activeCaptureProjectVersionSlug: null,
      activeCaptureProjectVersionName: null,
      activeCaptureEventIndex: null,
      activeCaptureMode: null,
      activeCapturePaused: false,
      automaticCaptureDiagnostic: null,
      manualCaptureDiagnostic: null,
    });
  });

  it("rejects invalid active capture event indexes when saving", async () => {
    await expect(saveActiveCaptureEventIndex(storage, -1)).rejects.toThrow(
      "Active capture event index must be a non-negative integer.",
    );
    await expect(saveActiveCaptureEventIndex(storage, 1.5)).rejects.toThrow(
      "Active capture event index must be a non-negative integer.",
    );
  });

  it("rejects invalid active capture event indexes when starting capture", async () => {
    await expect(
      saveActiveCapture(storage, {
        captureSessionId: "capture_session_1",
        projectId: "project_1",
        eventIndex: -1,
      }),
    ).rejects.toThrow(
      "Active capture event index must be a non-negative integer.",
    );
  });

  it("rejects invalid active capture modes", async () => {
    await expect(
      saveActiveCapture(storage, {
        captureSessionId: "capture_session_1",
        projectId: "project_1",
        mode: "invalid" as "automatic",
      }),
    ).rejects.toThrow("Active capture mode is invalid.");

    await expect(
      saveActiveCaptureMode(storage, {
        mode: "invalid" as "automatic",
        paused: false,
      }),
    ).rejects.toThrow("Active capture mode is invalid.");
  });
});
