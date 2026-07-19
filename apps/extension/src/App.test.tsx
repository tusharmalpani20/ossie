import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  type AuthResponse,
  type CaptureAssetResponse,
  type CaptureEventResponse,
  type CompleteCaptureSessionResponse,
  type CreateCaptureEventInput,
  type LoginRequest,
  type LoginResponse,
  type Project,
} from "./lib/api";
import { App } from "./App";
import type { ExtensionSettings } from "./lib/settings";
import type { ScreenshotCapture } from "./lib/screenshot";

const auth: AuthResponse["auth"] = {
  user: {
    id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_1",
    role: "owner",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-05T00:00:00.000Z",
  },
};

const projects: Project[] = [
  {
    id: "project_2",
    organization_id: "organization_1",
    name: "Archived onboarding demos",
    description: null,
    slug: null,
    color: null,
    icon: null,
    status: "archived",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 2,
    created_at: "2026-06-05T09:00:00.000Z",
    updated_at: "2026-06-05T09:30:00.000Z",
    access: { role: "project_admin", source: "organization_owner" },
    default_project_version: {
      id: "version_2",
      name: "Main",
      slug: "main",
      status: "active",
      position: 1,
    },
  },
  {
    id: "project_1",
    organization_id: "organization_1",
    name: "Internal onboarding demos",
    description: null,
    slug: null,
    color: null,
    icon: null,
    status: "active",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
    access: { role: "editor", source: "project_membership" },
    default_project_version: {
      id: "version_1",
      name: "Main",
      slug: "main",
      status: "active",
      position: 1,
    },
  },
];

const defaultSettings: ExtensionSettings = {
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

const captureSessionResponse = {
  capture_session: {
    id: "capture_session_1",
    organization_id: "organization_1",
    project_id: "project_1",
    project_version_id: "version_1",
    project_version: {
      id: "version_1",
      name: "Current",
      slug: "current",
      status: "active" as const,
      position: 1,
    },
    name: "Capture from Example Page",
    description: null,
    source_type: "extension" as const,
    status: "draft" as const,
    started_at: null,
    completed_at: null,
    canceled_at: null,
    start_url: "https://example.com/path",
    browser_name: "Chrome",
    browser_version: null,
    operating_system: null,
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 2,
    user_agent: null,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
};

const screenshotCapture: ScreenshotCapture = {
  blob: new Blob(["fake png bytes"], { type: "image/png" }),
  mimeType: "image/png",
  width: 1440,
  height: 900,
  devicePixelRatio: 2,
  capturedAt: "2026-06-05T10:00:00.000Z",
};

const captureAssetResponse: CaptureAssetResponse = {
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

const captureEventResponse: CaptureEventResponse = {
  capture_event: {
    id: "capture_event_1",
    organization_id: "organization_1",
    project_id: "project_1",
    capture_session_id: "capture_session_1",
    capture_asset_id: "capture_asset_1",
    event_type: "capture",
    event_index: 1,
    occurred_at: "2026-06-05T10:00:00.000Z",
    page_url: "https://example.com/path",
    page_title: "Example Page",
    target_label: null,
    target_selector: null,
    target_role: null,
    target_test_id: null,
    target_text: null,
    client_x: null,
    client_y: null,
    viewport_width: null,
    viewport_height: null,
    device_pixel_ratio: null,
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

const completeCaptureSessionResponse: CompleteCaptureSessionResponse = {
  capture_session: {
    id: "capture_session_1",
    organization_id: "organization_1",
    project_id: "project_1",
    project_version_id: "version_1",
    project_version: {
      id: "version_1",
      name: "Current",
      slug: "current",
      status: "active",
      position: 1,
    },
    name: "Capture from Example Page",
    description: null,
    source_type: "extension",
    status: "completed",
    started_at: null,
    completed_at: "2026-06-05T10:05:00.000Z",
    canceled_at: null,
    start_url: "https://example.com/path",
    browser_name: "Chrome",
    browser_version: null,
    operating_system: null,
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 2,
    user_agent: null,
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 2,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
  },
  redirect: {
    path: "/projects/project_1/capture-sessions/capture_session_1",
    reason: "capture_session_completed",
  },
};

const renderApp = (
  overrides: {
    settings?: ExtensionSettings;
    getCurrentAuth?: (
      instanceUrl: string,
      sessionToken: string,
    ) => Promise<AuthResponse>;
    listProjects?: (
      instanceUrl: string,
      sessionToken: string,
    ) => Promise<{ projects: Project[] }>;
    login?: (instanceUrl: string, data: LoginRequest) => Promise<LoginResponse>;
    createCaptureSession?: (
      instanceUrl: string,
      sessionToken: string,
      projectId: string,
      data: {
        name: string;
        source_type: "extension";
        start_url?: string | null;
        metadata?: Record<string, unknown>;
      },
    ) => Promise<typeof captureSessionResponse>;
    getCurrentTabSnapshot?: () => Promise<{
      url: string | null;
      title: string | null;
    }>;
    captureVisibleTabScreenshot?: () => Promise<ScreenshotCapture>;
    uploadCaptureAsset?: (
      instanceUrl: string,
      sessionToken: string,
      projectId: string,
      captureSessionId: string,
      data: {
        file: Blob;
        fileName: string;
        width?: number | null;
        height?: number | null;
        devicePixelRatio?: number | null;
        pageUrl?: string | null;
        pageTitle?: string | null;
        capturedAt?: string | null;
        metadata?: Record<string, unknown>;
      },
    ) => Promise<CaptureAssetResponse>;
    createCaptureEvent?: (
      instanceUrl: string,
      sessionToken: string,
      projectId: string,
      captureSessionId: string,
      data: CreateCaptureEventInput,
    ) => Promise<CaptureEventResponse>;
    completeCaptureSession?: (
      instanceUrl: string,
      sessionToken: string,
      projectId: string,
      captureSessionId: string,
    ) => Promise<CompleteCaptureSessionResponse>;
    openPortalUrl?: (url: string) => Promise<void>;
    saveInstanceUrl?: (instanceUrl: string) => Promise<void>;
    savePortalUrl?: (portalUrl: string | null) => Promise<void>;
    saveSessionToken?: (sessionToken: string | null) => Promise<void>;
    saveSelectedProjectId?: (projectId: string | null) => Promise<void>;
    saveActiveCapture?: (input: {
      captureSessionId: string;
      projectId: string;
      eventIndex?: number;
      mode?: "manual" | "automatic";
    }) => Promise<void>;
    saveActiveCaptureMode?: (input: {
      mode: "manual" | "automatic";
      paused: boolean;
    }) => Promise<void>;
    saveActiveCaptureEventIndex?: (eventIndex: number) => Promise<void>;
    saveManualCaptureDiagnostic?: (
      diagnostic: {
        status: "success" | "failed";
        message: string | null;
        eventIndex: number | null;
        occurredAt: string;
      } | null,
    ) => Promise<void>;
    clearActiveCapture?: () => Promise<void>;
    clearSettings?: () => Promise<void>;
    logout?: (instanceUrl: string, sessionToken: string) => Promise<void>;
  } = {},
) => {
  const dependencies = {
    getSettings: vi.fn(async () => overrides.settings ?? defaultSettings),
    saveInstanceUrl: vi.fn(overrides.saveInstanceUrl ?? (async () => {})),
    savePortalUrl: vi.fn(overrides.savePortalUrl ?? (async () => {})),
    saveSessionToken: vi.fn(overrides.saveSessionToken ?? (async () => {})),
    saveSelectedProjectId: vi.fn(
      overrides.saveSelectedProjectId ?? (async () => {}),
    ),
    clearSettings: vi.fn(overrides.clearSettings ?? (async () => {})),
    getCurrentAuth: vi.fn(overrides.getCurrentAuth ?? (async () => ({ auth }))),
    login: vi.fn(
      overrides.login ??
        (async () => ({ auth, session_token: "extension-session-token" })),
    ),
    listProjects: vi.fn(overrides.listProjects ?? (async () => ({ projects }))),
    createCaptureSession: vi.fn(
      overrides.createCaptureSession ?? (async () => captureSessionResponse),
    ),
    getCurrentTabSnapshot: vi.fn(
      overrides.getCurrentTabSnapshot ??
        (async () => ({
          url: "https://example.com/path",
          title: "Example Page",
        })),
    ),
    captureVisibleTabScreenshot: vi.fn(
      overrides.captureVisibleTabScreenshot ?? (async () => screenshotCapture),
    ),
    uploadCaptureAsset: vi.fn(
      overrides.uploadCaptureAsset ?? (async () => captureAssetResponse),
    ),
    createCaptureEvent: vi.fn(
      overrides.createCaptureEvent ?? (async () => captureEventResponse),
    ),
    completeCaptureSession: vi.fn(
      overrides.completeCaptureSession ??
        (async () => completeCaptureSessionResponse),
    ),
    openPortalUrl: vi.fn(overrides.openPortalUrl ?? (async () => {})),
    saveActiveCapture: vi.fn(overrides.saveActiveCapture ?? (async () => {})),
    saveActiveCaptureMode: vi.fn(
      overrides.saveActiveCaptureMode ?? (async () => {}),
    ),
    saveActiveCaptureEventIndex: vi.fn(
      overrides.saveActiveCaptureEventIndex ?? (async () => {}),
    ),
    saveManualCaptureDiagnostic: vi.fn(
      overrides.saveManualCaptureDiagnostic ?? (async () => {}),
    ),
    clearActiveCapture: vi.fn(overrides.clearActiveCapture ?? (async () => {})),
    logout: vi.fn(overrides.logout ?? (async () => {})),
  };

  render(<App dependencies={dependencies} />);

  return dependencies;
};

describe("extension popup App", () => {
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
    const projectButtons = screen.getAllByRole("button", { name: /Use / });
    expect(projectButtons).toHaveLength(2);
    expect(
      within(projectButtons[0]!).getByText("Archived onboarding demos / Main"),
    ).toBeInTheDocument();
    expect(
      within(projectButtons[1]!).getByText("Internal onboarding demos / Main"),
    ).toBeInTheDocument();
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
    fireEvent.click(
      screen.getByRole("button", { name: /Use Internal onboarding demos/ }),
    );

    await waitFor(() =>
      expect(dependencies.saveSelectedProjectId).toHaveBeenCalledWith(
        "project_1",
        projects[1]!.default_project_version,
      ),
    );
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
    ).toHaveLength(2);

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
      screen.getByText("Internal onboarding demos / Main"),
    ).toBeInTheDocument();
    expect(screen.getByText(/capture_session_1/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start automatic capture" }),
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
      expect(dependencies.saveActiveCaptureMode).toHaveBeenCalledWith({
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
      expect(dependencies.saveActiveCaptureMode).toHaveBeenLastCalledWith({
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
        "https://demo.example.com/projects/project_1/versions/main/capture-sessions/capture_session_1",
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
        "http://localhost:3000/projects/project_1/versions/main/capture-sessions/capture_session_1",
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
      screen.getByRole("button", { name: "Discard local capture state" }),
    );

    await waitFor(() =>
      expect(dependencies.clearActiveCapture).toHaveBeenCalled(),
    );
    expect(dependencies.completeCaptureSession).not.toHaveBeenCalled();
  });

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
      expect(dependencies.uploadCaptureAsset).toHaveBeenCalledWith(
        "https://demo.example.com",
        "extension-session-token",
        "project_1",
        "capture_session_1",
        expect.objectContaining({
          file: screenshotCapture.blob,
          fileName: "screenshot-2026-06-05T10-00-00-000Z.png",
          width: 1440,
          height: 900,
          devicePixelRatio: 2,
          pageUrl: "https://example.com/path",
          pageTitle: "Example Page",
          capturedAt: "2026-06-05T10:00:00.000Z",
          metadata: expect.objectContaining({
            extension_version: "0.1.0",
            capture_source: "extension_popup",
          }),
        }),
      ),
    );
    await waitFor(() =>
      expect(dependencies.createCaptureEvent).toHaveBeenCalledWith(
        "https://demo.example.com",
        "extension-session-token",
        "project_1",
        "capture_session_1",
        {
          event_type: "capture",
          event_index: 1,
          capture_asset_id: "capture_asset_1",
          occurred_at: "2026-06-05T10:00:00.000Z",
          page_url: "https://example.com/path",
          page_title: "Example Page",
          input_value_redacted: true,
          metadata: {
            extension_version: "0.1.0",
            capture_source: "extension_popup",
            asset_type: "screenshot",
          },
        },
      ),
    );
    await waitFor(() =>
      expect(dependencies.saveActiveCaptureEventIndex).toHaveBeenCalledWith(1),
    );
    await waitFor(() =>
      expect(dependencies.saveManualCaptureDiagnostic).toHaveBeenCalledWith({
        status: "success",
        message: null,
        eventIndex: 1,
        occurredAt: "2026-06-05T10:00:00.000Z",
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
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture screenshot" }));

    await waitFor(() =>
      expect(dependencies.createCaptureEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        "project_1",
        "capture_session_1",
        expect.objectContaining({
          event_type: "capture",
          event_index: 4,
        }),
      ),
    );
    await waitFor(() =>
      expect(dependencies.saveActiveCaptureEventIndex).toHaveBeenCalledWith(4),
    );
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
      uploadCaptureAsset: async () => {
        throw new ApiClientError({
          status: 413,
          type: "capture_asset_too_large",
          message: "Capture asset upload is too large",
        });
      },
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
    expect(dependencies.createCaptureEvent).not.toHaveBeenCalled();
    expect(dependencies.saveActiveCaptureEventIndex).not.toHaveBeenCalled();
    expect(dependencies.saveManualCaptureDiagnostic).toHaveBeenCalledWith({
      status: "failed",
      message: "Capture asset upload is too large",
      eventIndex: null,
      occurredAt: expect.any(String),
    });
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
      uploadCaptureAsset: async () => {
        throw new ApiClientError({
          status: 413,
          type: "capture_asset_too_large",
          message: "Capture asset upload is too large",
        });
      },
      saveManualCaptureDiagnostic: async () => {
        throw new Error("storage unavailable");
      },
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
      createCaptureEvent: async () => {
        throw new ApiClientError({
          status: 409,
          type: "capture_event_index_conflict",
          message: "A capture event with this index already exists",
        });
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture screenshot" }));

    expect(
      await screen.findByText("A capture event with this index already exists"),
    ).toBeInTheDocument();
    expect(dependencies.uploadCaptureAsset).toHaveBeenCalled();
    expect(dependencies.saveActiveCaptureEventIndex).not.toHaveBeenCalled();
    expect(dependencies.saveManualCaptureDiagnostic).toHaveBeenCalledWith({
      status: "failed",
      message: "A capture event with this index already exists",
      eventIndex: null,
      occurredAt: expect.any(String),
    });
    expect(dependencies.clearActiveCapture).not.toHaveBeenCalled();
  });

  it("disables active capture actions while a screenshot is uploading", async () => {
    let resolveEvent: (value: CaptureEventResponse) => void = () => {};
    const eventPromise = new Promise<CaptureEventResponse>((resolve) => {
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
      createCaptureEvent: async () => eventPromise,
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture screenshot" }));

    expect(
      await screen.findByRole("button", { name: "Capturing..." }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Discard local capture state" }),
    ).toBeDisabled();

    resolveEvent(captureEventResponse);

    expect(
      await screen.findByText("Capture event recorded: step 1"),
    ).toBeInTheDocument();
    expect(dependencies.uploadCaptureAsset).toHaveBeenCalledTimes(1);
    expect(dependencies.createCaptureEvent).toHaveBeenCalledTimes(1);
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
        "https://demo.example.com/projects/project_1/versions/main/capture-sessions/capture_session_1",
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
    ).toHaveLength(2);
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
        "http://localhost:3000/projects/project_1/versions/main/capture-sessions/capture_session_1",
      ),
    );
    await waitFor(() =>
      expect(dependencies.clearActiveCapture).toHaveBeenCalled(),
    );
  });

  it("falls back to encoded portal route when completion redirect is unsafe", async () => {
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
    });

    expect(
      await screen.findByRole("heading", { name: "Capture active" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finish capture" }));

    await screen.findByText("Project Version context is unavailable.");
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
      screen.getByRole("button", { name: "Discard local capture state" }),
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
      await screen.findByText("Could not finish capture."),
    ).toBeInTheDocument();
    expect(dependencies.completeCaptureSession).toHaveBeenCalled();
    expect(dependencies.openPortalUrl).not.toHaveBeenCalled();
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
      await screen.findByText("Could not open portal after finishing capture."),
    ).toBeInTheDocument();
    expect(dependencies.clearActiveCapture).toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Capture active" }),
    ).not.toBeInTheDocument();
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
