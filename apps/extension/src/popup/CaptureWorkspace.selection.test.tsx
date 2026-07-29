import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiClientError } from "../lib/api";
import { captureSessionResponse, renderApp } from "./test-helpers";

describe("CaptureWorkspace active selection and recovery", () => {
  it("positions the active flow as automatic click capture with a manual screenshot fallback", async () => {
    renderApp({
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
    });

    expect(
      await screen.findByRole("heading", { name: "Ready to capture" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Automatic click capture")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Clicks on supported pages create ordered screenshot-backed steps.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manual screenshots remain available after capture starts.",
      ),
    ).toBeInTheDocument();
  });

  it("restores active capture state and prevents another start", async () => {
    renderApp({
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
    expect(
      screen.getByText("Internal onboarding demos / Current"),
    ).toBeInTheDocument();
    expect(screen.getByText(/capture_session_1/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start capture" }),
    ).not.toBeInTheDocument();
  });

  it("shows the latest automatic capture failure diagnostic with manual fallback available", async () => {
    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: "automatic",
        activeCapturePaused: false,
        automaticCaptureDiagnostic: {
          status: "failed",
          message: "Screenshot capture is unavailable.",
          eventIndex: null,
          occurredAt: "2026-06-30T10:00:00.000Z",
        },
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Automatic click capture failed: Screenshot capture is unavailable.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Capture screenshot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pause automatic capture" }),
    ).toBeInTheDocument();
  });

  it("shows the latest manual screenshot failure diagnostic with retry available", async () => {
    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
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
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manual screenshot failed: Capture asset upload is too large",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Capture screenshot" }),
    ).toBeInTheDocument();
  });

  it("pauses and resumes automatic capture without clearing active capture state", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: "automatic",
        activeCapturePaused: false,
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Pause automatic capture" }),
    );

    await waitFor(() =>
      expect(dependencies.sendCaptureCommand).toHaveBeenCalledWith({
        type: "ossie:capture_command",
        action: "set_mode",
        mode: "automatic",
        paused: true,
      }),
    );
    expect(
      await screen.findByRole("button", { name: "Resume automatic capture" }),
    ).toBeInTheDocument();
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Resume automatic capture" }),
    );

    await waitFor(() =>
      expect(dependencies.sendCaptureCommand).toHaveBeenLastCalledWith({
        type: "ossie:capture_command",
        action: "set_mode",
        mode: "automatic",
        paused: false,
      }),
    );
    expect(
      await screen.findByRole("button", { name: "Pause automatic capture" }),
    ).toBeInTheDocument();
  });

  it("opens active captures in the portal without finishing or clearing local state", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Open in portal" }));

    await waitFor(() =>
      expect(dependencies.openPortalUrl).toHaveBeenCalledWith(
        "https://demo.example.com/projects/project_1/versions/current/capture-sessions/capture_session_1",
      ),
    );
    expect(dependencies.completeCaptureSession).not.toHaveBeenCalled();
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
  });

  it("opens active captures with the configured portal URL in split API and web deployments", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Open in portal" }));

    await waitFor(() =>
      expect(dependencies.openPortalUrl).toHaveBeenCalledWith(
        "http://localhost:3000/projects/project_1/versions/current/capture-sessions/capture_session_1",
      ),
    );
    expect(dependencies.completeCaptureSession).not.toHaveBeenCalled();
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
  });

  it("keeps active capture state when opening active capture in portal fails", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 2,
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
    fireEvent.click(screen.getByRole("button", { name: "Open in portal" }));

    expect(
      await screen.findByText("Could not open capture in portal."),
    ).toBeInTheDocument();
    expect(dependencies.completeCaptureSession).not.toHaveBeenCalled();
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
  });

  it("keeps unresolved active capture state when the active project is missing", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "missing_project",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "missing_project",
        activeCaptureEventIndex: 0,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
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
    expect(screen.getByText("Project unavailable")).toBeInTheDocument();
    expect(dependencies.saveSelectedProjectId).toHaveBeenCalledWith(null);
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
  });

  it("discards local active capture state", async () => {
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
    fireEvent.click(
      screen.getByRole("button", { name: "Clear local capture state" }),
    );
    expect(
      screen.getByText(
        "This only clears extension state. It does not cancel or delete the server Capture Session.",
      ),
    ).toBeInTheDocument();
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Clear local state" }));

    await waitFor(() =>
      expect(dependencies.clearActiveCapture).toHaveBeenCalled(),
    );
    expect(dependencies.completeCaptureSession).not.toHaveBeenCalled();
  });

  it("keeps active context visible but read-only when Event reconciliation fails", async () => {
    let attempts = 0;
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 4,
        activeCaptureMode: "automatic",
        activeCapturePaused: false,
      },
      listCaptureEvents: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("network unavailable");
        }
        return { capture_events: [] };
      },
    });

    expect(
      await screen.findByText(
        "Capture steps could not be reconciled. Reopen or retry the extension before capturing or finishing.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Capture screenshot" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Finish and open portal" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry reconciliation" }),
    );
    await waitFor(() =>
      expect(dependencies.listCaptureEvents).toHaveBeenCalledTimes(2),
    );
    expect(
      await screen.findByRole("button", { name: "Capture screenshot" }),
    ).toBeEnabled();
  });

  it("restores completed Capture Sessions as read-only", async () => {
    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 1,
        activeCaptureMode: "automatic",
        activeCapturePaused: false,
      },
      getCaptureSession: async () => ({
        capture_session: {
          ...captureSessionResponse.capture_session,
          status: "completed",
          completed_at: "2026-07-29T09:00:00.000Z",
        },
      }),
    });

    expect(
      await screen.findByText(
        "This Capture Session is completed and is read-only.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Capture screenshot" }),
    ).toBeDisabled();
  });
});
