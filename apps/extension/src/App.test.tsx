import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError, type Project } from "./lib/api";
import type { ExtensionSettings } from "./lib/settings";
import {
  captureSessionResponse,
  defaultSettings,
  projects,
  renderApp,
} from "./popup/test-helpers";

describe("extension popup App orchestration", () => {
  it("starts in the unconfigured state and saves valid instance URLs", async () => {
    const dependencies = renderApp();

    expect(
      await screen.findByRole("heading", { name: "Connect instance" }),
    ).toBeInTheDocument();
    expect(document.querySelector(".brand img")).toHaveAttribute(
      "src",
      "/icons/ossie-32.png",
    );
    expect(screen.getByLabelText("Instance URL")).toHaveAttribute(
      "placeholder",
      "http://localhost:3002",
    );
    expect(screen.getByLabelText("Portal URL (optional)")).toHaveAttribute(
      "placeholder",
      "http://localhost:3000",
    );

    fireEvent.change(screen.getByLabelText("Instance URL"), {
      target: {
        value: "http://localhost:3002/",
      },
    });
    fireEvent.change(screen.getByLabelText("Portal URL (optional)"), {
      target: {
        value: "http://localhost:3000/",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() =>
      expect(dependencies.saveInstanceUrl).toHaveBeenCalledWith(
        "http://localhost:3002",
      ),
    );
    await waitFor(() =>
      expect(dependencies.savePortalUrl).toHaveBeenCalledWith(
        "http://localhost:3000",
      ),
    );
  });

  it("rejects invalid instance URLs", async () => {
    renderApp();

    expect(
      await screen.findByRole("heading", { name: "Connect instance" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Instance URL"), {
      target: {
        value: "localhost:3002",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(
      screen.getByText("Enter a valid http:// or https:// instance URL."),
    ).toBeInTheDocument();
  });

  it("rejects invalid portal URLs without saving the instance", async () => {
    const dependencies = renderApp();

    expect(
      await screen.findByRole("heading", { name: "Connect instance" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Instance URL"), {
      target: {
        value: "http://localhost:3002",
      },
    });
    fireEvent.change(screen.getByLabelText("Portal URL (optional)"), {
      target: {
        value: "localhost:3000",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(
      screen.getByText("Enter a valid http:// or https:// portal URL."),
    ).toBeInTheDocument();
    expect(dependencies.saveInstanceUrl).not.toHaveBeenCalled();
    expect(dependencies.savePortalUrl).not.toHaveBeenCalled();
  });

  it("renders signed-out form when saved token is unauthenticated", async () => {
    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "expired-token",
        selectedProjectId: null,
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
        activeCaptureEventIndex: null,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      getCurrentAuth: async () => {
        throw new ApiClientError({
          status: 401,
          type: "unauthenticated",
          message: "Authentication is required",
        });
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByText("https://demo.example.com")).toBeInTheDocument();
  });

  it("signs in and renders projects in response order", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: null,
        selectedProjectId: null,
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
        activeCaptureEventIndex: null,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: {
        value: "owner@example.com",
      },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: {
        value: "safe password",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("heading", { name: "Select project" }),
    ).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    const projectSelect = screen.getByLabelText("Project");
    expect(projectSelect).toHaveTextContent("Archived onboarding demos");
    expect(projectSelect).toHaveTextContent("Internal onboarding demos");
    expect(dependencies.login).toHaveBeenCalledWith(
      "https://demo.example.com",
      {
        email: "owner@example.com",
        password: "safe password",
      },
    );
    expect(dependencies.saveSessionToken).toHaveBeenCalledWith(
      "extension-session-token",
    );
  });

  it("persists selected project ids", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: null,
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
        activeCaptureEventIndex: null,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Select project" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Project"), {
      target: { value: "project_1" },
    });

    await waitFor(() =>
      expect(dependencies.saveSelectedProjectId).toHaveBeenCalledWith(
        "project_1",
        projects[1]!.default_project_version,
      ),
    );
  });

  it("selects an active named Project Version and starts capture in that exact Version", async () => {
    const createCaptureSession = vi.fn(async () => ({
      capture_session: {
        ...captureSessionResponse.capture_session,
        project_version_id: "version_next",
        project_version: {
          id: "version_next",
          name: "Next",
          slug: "next",
          status: "active" as const,
          position: 2,
        },
      },
    }));
    const dependencies = renderApp({
      settings: {
        ...defaultSettings,
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        selectedProjectVersionId: "version_1",
        selectedProjectVersionSlug: "main",
        selectedProjectVersionName: "Main",
      },
      createCaptureSession,
    });

    fireEvent.change(await screen.findByLabelText("Project Version"), {
      target: { value: "version_next" },
    });
    await screen.findByText("Internal onboarding demos / Next");
    fireEvent.click(
      screen.getByRole("button", { name: "Start automatic capture" }),
    );

    await waitFor(() =>
      expect(createCaptureSession).toHaveBeenCalledWith(
        "https://demo.example.com",
        "extension-session-token",
        "project_1",
        expect.objectContaining({ project_version_id: "version_next" }),
      ),
    );
    expect(dependencies.saveSelectedProjectId).toHaveBeenLastCalledWith(
      "project_1",
      expect.objectContaining({ id: "version_next", slug: "next" }),
    );
  });

  it("repairs active Version context from the authoritative Capture Session", async () => {
    const openPortalUrl = vi.fn(async () => {});
    const dependencies = renderApp({
      settings: {
        ...defaultSettings,
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureProjectVersionId: "wrong_version",
        activeCaptureProjectVersionSlug: "wrong",
        activeCaptureProjectVersionName: "Wrong",
        activeCaptureEventIndex: 0,
        activeCaptureMode: "automatic",
      },
      openPortalUrl,
    });

    expect(
      await screen.findByText("Internal onboarding demos / Current"),
    ).toBeVisible();
    expect(dependencies.saveActiveCaptureVersionContext).toHaveBeenCalledWith({
      captureSessionId: "capture_session_1",
      projectId: "project_1",
      projectVersionId: "version_1",
      projectVersionSlug: "current",
      projectVersionName: "Current",
    });

    fireEvent.click(screen.getByRole("button", { name: "Open in portal" }));
    await waitFor(() =>
      expect(openPortalUrl).toHaveBeenCalledWith(
        "https://demo.example.com/projects/project_1/versions/current/capture-sessions/capture_session_1",
      ),
    );
  });

  it("does not silently replace an unavailable remembered Project Version", async () => {
    const dependencies = renderApp({
      settings: {
        ...defaultSettings,
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        selectedProjectVersionId: "archived_version",
        selectedProjectVersionSlug: "archived",
        selectedProjectVersionName: "Archived",
      },
    });

    expect(
      await screen.findByText(
        /selected Project Version is archived or unavailable/i,
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Start automatic capture" }),
    ).toBeDisabled();
    expect(dependencies.saveSelectedProjectId).not.toHaveBeenCalled();
  });

  it("keeps archived active Capture ownership readable but blocks mutations", async () => {
    renderApp({
      settings: {
        ...defaultSettings,
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        activeCaptureSessionId: "capture_session_1",
        activeCaptureProjectId: "project_1",
        activeCaptureEventIndex: 0,
        activeCaptureMode: "automatic",
      },
      getCaptureSession: async () => ({
        capture_session: {
          ...captureSessionResponse.capture_session,
          project_version: {
            ...captureSessionResponse.capture_session.project_version,
            status: "archived",
          },
        },
      }),
    });

    expect(
      await screen.findByText(/Project Version is archived/i),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Capture screenshot" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Finish capture" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Open in portal" }),
    ).toBeEnabled();
  });

  it("clears stale selected projects that are no longer returned", async () => {
    const dependencies = renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "missing_project",
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
        activeCaptureEventIndex: null,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Select project" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(dependencies.saveSelectedProjectId).toHaveBeenCalledWith(null),
    );
  });

  it("changes instance by clearing settings", async () => {
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
    });

    expect(
      await screen.findByRole("heading", { name: "Ready to capture" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change instance" }));

    await waitFor(() => expect(dependencies.clearSettings).toHaveBeenCalled());
  });

  it("renders API errors with retry", async () => {
    const listProjects = vi
      .fn<() => Promise<{ projects: Project[] }>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ projects });

    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: null,
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
        activeCaptureEventIndex: null,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
      listProjects: async () => listProjects(),
    });

    expect(
      await screen.findByText("Could not load projects."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("heading", { name: "Select project" }),
    ).toBeInTheDocument();
  });

  it("starts automatic capture for the selected project with current tab metadata", async () => {
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
    });

    expect(
      await screen.findByRole("heading", { name: "Ready to capture" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Internal onboarding demos / Main"),
    ).toHaveLength(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Start automatic capture" }),
    );

    await waitFor(() =>
      expect(dependencies.createCaptureSession).toHaveBeenCalledWith(
        "https://demo.example.com",
        "extension-session-token",
        "project_1",
        expect.objectContaining({
          name: "Capture from Example Page",
          source_type: "extension",
          start_url: "https://example.com/path",
          metadata: expect.objectContaining({
            tab_title: "Example Page",
          }),
        }),
      ),
    );
    await waitFor(() =>
      expect(dependencies.saveActiveCapture).toHaveBeenCalledWith({
        captureSessionId: "capture_session_1",
        projectId: "project_1",
        projectVersionId: "version_1",
        projectVersionSlug: "current",
        projectVersionName: "Current",
        eventIndex: 0,
        mode: "automatic",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Automatic click capture")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pause automatic capture" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Capture screenshot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change instance" }),
    ).not.toBeDisabled();
  });

  it("keeps a server-created Capture Session in memory when local persistence fails", async () => {
    const dependencies = renderApp({
      settings: {
        ...defaultSettings,
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        selectedProjectVersionId: "version_1",
        selectedProjectVersionSlug: "main",
        selectedProjectVersionName: "Main",
      },
      saveActiveCapture: async () => {
        throw new Error("storage unavailable");
      },
    });

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Start automatic capture",
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Capture Session started, but local recovery could not be saved. Keep this popup open and finish or open the session.",
      ),
    ).toBeInTheDocument();
    expect(dependencies.createCaptureSession).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Start automatic capture" }),
    ).not.toBeInTheDocument();
  });

  it("renders background diagnostics live without reopening the popup", async () => {
    const initial = {
      ...defaultSettings,
      instanceUrl: "https://demo.example.com",
      sessionToken: "extension-session-token",
      selectedProjectId: "project_1",
      activeCaptureSessionId: "capture_session_1",
      activeCaptureProjectId: "project_1",
      activeCaptureEventIndex: 0,
      activeCaptureMode: "automatic" as const,
      activeCapturePaused: false,
    };
    let current: ExtensionSettings = initial;
    let onStorageChange: (() => void) | undefined;
    renderApp({
      getSettings: async () => current,
      subscribeToSettingsChanges: (listener) => {
        onStorageChange = listener;
        return () => {};
      },
    });
    await screen.findByRole("heading", { name: "Capture active" });

    current = {
      ...current,
      automaticCaptureDiagnostic: {
        status: "saving",
        message: "Saving automatic capture…",
        eventIndex: null,
        occurredAt: "2026-07-29T09:00:00.000Z",
      },
    };
    await act(async () => onStorageChange?.());

    expect(
      await screen.findByRole("status", {
        name: "",
      }),
    ).toHaveTextContent("Saving automatic capture…");
    expect(
      screen.getByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
  });
});
