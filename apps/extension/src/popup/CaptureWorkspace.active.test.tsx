import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ApiClientError,
  type CompleteCaptureSessionResponse,
} from "../lib/api";
import type { CaptureCommandResult } from "../lib/capture-command";
import {
  captureEventResponse,
  completeCaptureSessionResponse,
  renderApp,
} from "./test-helpers";

describe("CaptureWorkspace capture and handoff", () => {
  it("uploads a screenshot and records a capture event for the active capture session", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture screenshot" }));

    await waitFor(() =>
      expect(dependencies.sendCaptureCommand).toHaveBeenCalledWith({
        type: "ossie:capture_command",
        action: "capture_manual",
      }),
    );
    expect(
      await screen.findByText("Capture event recorded: step 1"),
    ).toBeInTheDocument();
  });

  it("records the next capture event index from restored active capture state", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 3,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      listCaptureEvents: async () => ({
        capture_events: [
          {
            ...captureEventResponse.capture_event,
            event_index: 3,
          },
        ],
      }),
      sendCaptureCommand: async () => ({ ok: true, event_index: 4 }),
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture screenshot" }));

    await waitFor(() =>
      expect(dependencies.sendCaptureCommand).toHaveBeenCalledWith({
        type: "ossie:capture_command",
        action: "capture_manual",
      }),
    );
    expect(
      await screen.findByText("Capture event recorded: step 4"),
    ).toBeInTheDocument();
  });

  it("renders screenshot upload errors without clearing active capture", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      sendCaptureCommand: async () => ({
        ok: false,
        reason: "capture_failed",
        message: "Capture asset upload is too large",
      }),
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture screenshot" }));

    expect(
      await screen.findByText("Capture asset upload is too large"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    expect(dependencies.sendCaptureCommand).toHaveBeenCalledTimes(1);
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
  });

  it("does not hide manual screenshot upload errors when diagnostic persistence fails", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      sendCaptureCommand: async () => ({
        ok: false,
        reason: "capture_failed",
        message: "Capture asset upload is too large",
      }),
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture screenshot" }));

    expect(
      await screen.findByText("Capture asset upload is too large"),
    ).toBeInTheDocument();
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
  });

  it("keeps active capture state and index when event recording fails", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      sendCaptureCommand: async () => ({
        ok: false,
        reason: "capture_reconciled",
        message:
          "Capture steps were reconciled. Retry the screenshot as a new action.",
        reconciled_event_index: 2,
      }),
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture screenshot" }));

    expect(
      await screen.findByText(
        "Capture steps were reconciled. Retry the screenshot as a new action.",
      ),
    ).toBeInTheDocument();
    expect(dependencies.sendCaptureCommand).toHaveBeenCalledTimes(1);
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
  });

  it("disables active capture actions while a screenshot is uploading", async () => {
    let resolveEvent: (value: CaptureCommandResult) => void = () => {};
    const eventPromise = new Promise<CaptureCommandResult>((resolve) => {
      resolveEvent = resolve;
    });
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      sendCaptureCommand: async () => eventPromise,
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture screenshot" }));

    expect(
      await screen.findByRole("button", { name: "Capturing..." }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Clear local capture state" }),
    ).toBeDisabled();

    resolveEvent({ ok: true, event_index: 1 });

    expect(
      await screen.findByText("Capture event recorded: step 1"),
    ).toBeInTheDocument();
    expect(dependencies.sendCaptureCommand).toHaveBeenCalledTimes(1);
  });

  it("finishes active captures, clears local state, and opens the portal detail page", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        portalUrl: null,
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 2,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish capture" }));

    await waitFor(() =>
      expect(dependencies.completeCaptureSession).toHaveBeenCalledWith(
        "https://demo.example.com",
        "extension-session-token",
        "project_1",
        "capture_session_1",
      ),
    );
    await waitFor(() =>
      expect(dependencies.clearActiveCapture).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(dependencies.openPortalUrl).toHaveBeenCalledWith(
        "https://demo.example.com/projects/project_1/versions/current/capture-sessions/capture_session_1",
      ),
    );
    expect(
      screen.queryByRole("heading", { name: "Capture active" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ready to capture" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Internal onboarding demos / Main"),
    ).toHaveLength(1);
  });

  it("opens finished captures with the configured portal URL in split API and web deployments", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "http://localhost:4021",
        portalUrl: "http://localhost:3000",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 2,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish capture" }));

    await waitFor(() =>
      expect(dependencies.completeCaptureSession).toHaveBeenCalledWith(
        "http://localhost:4021",
        "extension-session-token",
        "project_1",
        "capture_session_1",
      ),
    );
    await waitFor(() =>
      expect(dependencies.openPortalUrl).toHaveBeenCalledWith(
        "http://localhost:3000/projects/project_1/versions/current/capture-sessions/capture_session_1",
      ),
    );
    await waitFor(() =>
      expect(dependencies.clearActiveCapture).toHaveBeenCalled(),
    );
  });

  it("blocks completion when authoritative active Capture context is unavailable", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project 1",
        activeCaptureSessionId: "capture/session",
        activeCaptureProjectId: "project 1",
        activeCaptureEventIndex: 2,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      completeCaptureSession: async () => ({
        ...completeCaptureSessionResponse,
        redirect: {
          path: "https://evil.example/projects/project_1",
          reason: "capture_session_completed",
        },
      }),
      getCaptureSession: async () => {
        throw new ApiClientError({
          status: 404,
          type: "capture_session_not_found",
          message: "Capture session was not found",
        });
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    await screen.findByText(/active Capture Session is no longer available/i);
    expect(
      screen.getByRole("button", { name: "Finish capture" }),
    ).toBeDisabled();
    expect(dependencies.completeCaptureSession).not.toHaveBeenCalled();
    expect(dependencies.openPortalUrl).not.toHaveBeenCalled();
  });

  it("disables active capture actions while finishing", async () => {
    let resolveComplete: (
      value: CompleteCaptureSessionResponse,
    ) => void = () => {};
    const completePromise = new Promise<CompleteCaptureSessionResponse>(
      (resolve) => {
        resolveComplete = resolve;
      },
    );
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      completeCaptureSession: async () => completePromise,
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish capture" }));

    expect(
      await screen.findByRole("button", { name: "Finishing..." }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Capture screenshot" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Clear local capture state" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Change instance" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeDisabled();

    resolveComplete(completeCaptureSessionResponse);

    await waitFor(() => expect(dependencies.openPortalUrl).toHaveBeenCalled());
  });

  it("keeps active capture state when completion fails", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      completeCaptureSession: async () => {
        throw new ApiClientError({
          status: 400,
          type: "capture_session_not_completable",
          message:
            "Capture session cannot be completed from its current status",
        });
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish capture" }));

    expect(
      await screen.findByText(
        "Capture session cannot be completed from its current status",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
    expect(dependencies.openPortalUrl).not.toHaveBeenCalled();
  });

  it("does not open the portal when local active capture clearing fails", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      clearActiveCapture: async () => {
        throw new Error("Storage failed");
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish capture" }));

    expect(
      await screen.findByText(
        "Capture completed, but local recovery could not be cleared. Retry to clear and open it; completion will not repeat.",
      ),
    ).toBeInTheDocument();
    expect(dependencies.completeCaptureSession).toHaveBeenCalled();
    expect(dependencies.openPortalUrl).not.toHaveBeenCalled();

    dependencies.clearActiveCapture.mockResolvedValueOnce(undefined);
    fireEvent.click(
      screen.getByRole("button", { name: "Retry completion recovery" }),
    );
    await waitFor(() =>
      expect(dependencies.openPortalUrl).toHaveBeenCalledTimes(1),
    );
    expect(dependencies.completeCaptureSession).toHaveBeenCalledTimes(1);
  });

  it("shows an error when portal opening fails after completion", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      openPortalUrl: async () => {
        throw new Error("No browser navigation available");
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish capture" }));

    expect(
      await screen.findByText(
        "Capture completed, but the portal could not open. Retry to open it; completion will not repeat.",
      ),
    ).toBeInTheDocument();
    expect(dependencies.clearActiveCapture).toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry completion recovery" }),
    ).toBeInTheDocument();

    dependencies.openPortalUrl.mockResolvedValueOnce(undefined);
    fireEvent.click(
      screen.getByRole("button", { name: "Retry completion recovery" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Capture active" }),
      ).not.toBeInTheDocument(),
    );
    expect(dependencies.completeCaptureSession).toHaveBeenCalledTimes(1);
    expect(dependencies.openPortalUrl).toHaveBeenCalledTimes(2);
  });

  it("clears the local session when sign out cannot reach the server", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      logout: async () => {
        throw new Error("Network failed");
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(dependencies.saveSessionToken).toHaveBeenCalledWith(null),
    );
  });

  it("renders capture start errors without clearing the selected project", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
        activeCaptureEventIndex: null,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      createCaptureSession: async () => {
        throw new ApiClientError({
          status: 404,
          type: "project_not_found",
          message: "Project was not found",
        });
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Ready to capture" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Start automatic capture" }),
    );

    expect(
      await screen.findByText("Project was not found"),
    ).toBeInTheDocument();
    expect(dependencies.saveSelectedProjectId).not.toHaveBeenCalledWith(null);
    expect(dependencies.saveActiveCapture).not.toHaveBeenCalled();
  });
});
