import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ProjectCaptureSessionListPage } from "./ProjectCaptureSessionListPage";
import type { CaptureSession } from "./types";

const captureSessions: CaptureSession[] = [
  {
    id: "capture_session_2",
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
    name: "Archived onboarding capture",
    description: null,
    status: "archived",
    source_type: "manual",
    started_at: null,
    completed_at: null,
    canceled_at: null,
    start_url: null,
    browser_name: null,
    browser_version: null,
    operating_system: null,
    viewport_width: null,
    viewport_height: null,
    device_pixel_ratio: null,
    user_agent: "private user agent",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 3,
    created_at: "2026-06-05T09:00:00.000Z",
    updated_at: "2026-06-05T11:00:00.000Z",
  },
  {
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
    name: "Create department workflow",
    description: "Source capture for the department setup guide",
    status: "completed",
    source_type: "extension",
    started_at: "2026-06-05T10:00:00.000Z",
    completed_at: "2026-06-05T10:05:00.000Z",
    canceled_at: null,
    start_url: "https://example.internal/app/department",
    browser_name: "Chrome",
    browser_version: "126",
    operating_system: "Linux",
    viewport_width: 1440,
    viewport_height: 900,
    device_pixel_ratio: 1,
    user_agent: "Mozilla/5.0",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:05:00.000Z",
  },
];

const renderPage = (
  overrides: {
    projectId?: string;
    loadCaptureSessions?: () => Promise<{ capture_sessions: CaptureSession[] }>;
    createCaptureSession?: (
      projectId: string,
      input: {
        name: string;
        description?: string | null;
        source_type?: "manual" | "extension" | "import";
        start_url?: string | null;
      },
    ) => Promise<{ capture_session: CaptureSession }>;
    currentPath?: string;
    performLogout?: () => Promise<void>;
    navigate?: (path: string) => void;
    renderShell?: boolean;
  } = {},
) => {
  const loadCaptureSessions =
    overrides.loadCaptureSessions ??
    vi.fn(async () => ({
      capture_sessions: captureSessions,
    }));
  const createCaptureSession =
    overrides.createCaptureSession ??
    vi.fn(async () => ({
      capture_session: captureSessions[0]!,
    }));

  render(
    <ProjectCaptureSessionListPage
      projectId={overrides.projectId ?? "project_1"}
      projectVersionId="version_1"
      canWrite
      loadCaptureSessions={loadCaptureSessions}
      createCaptureSession={createCaptureSession}
      currentPath={overrides.currentPath}
      performLogout={overrides.performLogout}
      navigate={overrides.navigate}
      renderShell={overrides.renderShell}
    />,
  );

  return { loadCaptureSessions, createCaptureSession };
};

describe("ProjectCaptureSessionListPage", () => {
  it("names the Capture sessions workspace as one region", async () => {
    renderPage();

    expect(
      await screen.findByRole("region", {
        name: "Capture sessions workspace",
      }),
    ).toBeInTheDocument();
  });

  it("renders capture sessions in response order with detail links", async () => {
    const { loadCaptureSessions } = renderPage();

    expect(screen.getByText("Loading capture sessions...")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();

    const rows = screen.getAllByRole("article");
    expect(
      within(rows[0]!).getByRole("heading", {
        name: "Archived onboarding capture",
      }),
    ).toBeInTheDocument();
    expect(
      within(rows[1]!).getByRole("heading", {
        name: "Create department workflow",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("archived")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("manual")).toBeInTheDocument();
    expect(screen.getByText("extension")).toBeInTheDocument();
    expect(
      screen.getByText("Source capture for the department setup guide"),
    ).toBeInTheDocument();
    expect(screen.getByText("No start URL")).toBeInTheDocument();
    expect(screen.getByText("example.internal")).toBeInTheDocument();
    expect(screen.getByText("Chrome 126")).toBeInTheDocument();
    expect(screen.getByText("Linux")).toBeInTheDocument();
    expect(screen.getByText("1440 x 900")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Open capture session Create department workflow",
      }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/capture-sessions/capture_session_1",
    );
    expect(loadCaptureSessions).toHaveBeenCalledWith("project_1", {
      project_version_id: "version_1",
    });
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
    expect(screen.queryByText("org_user_1")).not.toBeInTheDocument();
    expect(screen.queryByText("Mozilla/5.0")).not.toBeInTheDocument();
    expect(screen.queryByText("version")).not.toBeInTheDocument();
  });

  it("URL-encodes project and capture session IDs in detail links", async () => {
    renderPage({
      projectId: "project 1",
      loadCaptureSessions: async () => ({
        capture_sessions: [
          {
            ...captureSessions[0]!,
            id: "capture / 1",
            name: "Encoded capture",
          },
        ],
      }),
    });

    expect(
      await screen.findByRole("link", {
        name: "Open capture session Encoded capture",
      }),
    ).toHaveAttribute(
      "href",
      "/projects/project%201/capture-sessions/capture%20%2F%201",
    );
  });

  it("renders canceled sessions and invalid start URLs without private browser data", async () => {
    renderPage({
      loadCaptureSessions: async () => ({
        capture_sessions: [
          {
            ...captureSessions[0]!,
            id: "capture_session_canceled",
            name: "Canceled import capture",
            status: "canceled",
            source_type: "import",
            start_url: "not a url",
            canceled_at: "2026-06-05T11:30:00.000Z",
            user_agent: "private canceled user agent",
          },
        ],
      }),
    });

    expect(
      await screen.findByRole("heading", { name: "Canceled import capture" }),
    ).toBeInTheDocument();
    expect(screen.getByText("canceled")).toBeInTheDocument();
    expect(screen.getByText("import")).toBeInTheDocument();
    expect(screen.getByText("not a url")).toBeInTheDocument();
    expect(
      screen.getByText(
        (content, element) =>
          element?.tagName.toLowerCase() === "span" &&
          content.startsWith("Canceled "),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("private canceled user agent"),
    ).not.toBeInTheDocument();
  });

  it("renders empty capture session lists", async () => {
    renderPage({
      loadCaptureSessions: async () => ({ capture_sessions: [] }),
    });

    expect(
      await screen.findByText("No capture sessions yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Capture Session" }),
    ).toBeInTheDocument();
  });

  it("can render content without its own shell inside Project Version routes", async () => {
    renderPage({
      renderShell: false,
      loadCaptureSessions: async () => ({ capture_sessions: [] }),
    });

    expect(
      await screen.findByText("No capture sessions yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("opens and cancels the capture session creation form", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );

    expect(
      screen.getByRole("heading", { name: "Create capture session" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveFocus();
    expect(screen.getByLabelText("Start URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("heading", { name: "Create capture session" }),
    ).not.toBeInTheDocument();
  });

  it("resets capture session creation form values when reopened", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Manual capture" },
    });
    fireEvent.change(screen.getByLabelText("Start URL"), {
      target: { value: "https://example.internal/app" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Portal screenshots." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Start URL")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
  });

  it("validates capture session names before creating capture sessions", async () => {
    const { createCaptureSession } = renderPage();

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "   " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Capture Session" }),
    );

    expect(
      screen.getByText("Capture session name is required."),
    ).toBeInTheDocument();
    expect(createCaptureSession).not.toHaveBeenCalled();
  });

  it("creates manual capture sessions from normalized form data and opens detail", async () => {
    const createCaptureSession = vi.fn(async () => ({
      capture_session: {
        ...captureSessions[0]!,
        id: "capture_created",
        name: "Manual capture",
      },
    }));
    const navigate = vi.fn();
    renderPage({ createCaptureSession, navigate });

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: " Manual capture " },
    });
    fireEvent.change(screen.getByLabelText("Start URL"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "   " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Capture Session" }),
    );

    await waitFor(() =>
      expect(createCaptureSession).toHaveBeenCalledWith("project_1", {
        name: "Manual capture",
        project_version_id: "version_1",
        description: null,
        source_type: "manual",
        start_url: null,
      }),
    );
    expect(navigate).toHaveBeenCalledWith(
      "/projects/project_1/capture-sessions/capture_created",
    );
  });

  it("keeps capture session creation form values when creation fails", async () => {
    renderPage({
      createCaptureSession: async () => {
        throw new Error("Network failed");
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Manual capture" },
    });
    fireEvent.change(screen.getByLabelText("Start URL"), {
      target: { value: "https://example.internal/app" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Portal screenshots." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Capture Session" }),
    );

    expect(
      await screen.findByText("Could not create capture session."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Manual capture");
    expect(screen.getByLabelText("Start URL")).toHaveValue(
      "https://example.internal/app",
    );
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Portal screenshots.",
    );
  });

  it("renders capture session creation domain errors as form messages", async () => {
    renderPage({
      createCaptureSession: async () => {
        throw new ApiClientError({
          kind: "validation",
          status: 400,
          type: "invalid_capture_session",
          message: "Capture session input is invalid",
        });
      },
    });

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Manual capture" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Capture Session" }),
    );

    expect(
      await screen.findByText("Capture session input is invalid."),
    ).toBeInTheDocument();
  });

  it("renders capture session creation authentication and project errors as form messages", async () => {
    const { rerender } = render(
      <ProjectCaptureSessionListPage
        projectId="project_1"
        projectVersionId="version_1"
        canWrite
        loadCaptureSessions={async () => ({
          capture_sessions: captureSessions,
        })}
        createCaptureSession={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "unauthenticated",
            message: "Authentication is required",
          });
        }}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Manual capture" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Capture Session" }),
    );

    expect(
      await screen.findByText("Sign in to create a capture session."),
    ).toBeInTheDocument();

    rerender(
      <ProjectCaptureSessionListPage
        projectId="missing"
        projectVersionId="version_1"
        canWrite
        loadCaptureSessions={async () => ({
          capture_sessions: captureSessions,
        })}
        createCaptureSession={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            type: "project_not_found",
            message: "Project was not found",
          });
        }}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Manual capture" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Capture Session" }),
    );

    expect(
      await screen.findByText("Project was not found."),
    ).toBeInTheDocument();
  });

  it("disables capture session creation submit while the request is pending", async () => {
    let resolveCreate:
      | ((value: { capture_session: CaptureSession }) => void)
      | undefined;
    const createCaptureSession = vi.fn(
      () =>
        new Promise<{ capture_session: CaptureSession }>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const navigate = vi.fn();
    renderPage({ createCaptureSession, navigate });

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "New Capture Session" }),
    );
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Manual capture" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Capture Session" }),
    );

    expect(
      screen.getByRole("button", { name: "Creating Capture Session..." }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Creating Capture Session..." }),
    );
    expect(createCaptureSession).toHaveBeenCalledTimes(1);

    resolveCreate?.({ capture_session: captureSessions[0]! });
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "/projects/project_1/capture-sessions/capture_session_2",
      ),
    );
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <ProjectCaptureSessionListPage
        projectId="project_1"
        projectVersionId="version_1"
        currentPath="/projects/project_1/capture-sessions"
        loadCaptureSessions={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "unauthenticated",
            message: "Authentication is required",
          });
        }}
      />,
    );

    expect(
      await screen.findByText("Sign in to view capture sessions."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fcapture-sessions",
    );

    rerender(
      <ProjectCaptureSessionListPage
        projectId="missing"
        projectVersionId="version_1"
        loadCaptureSessions={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            type: "project_not_found",
            message: "Project was not found",
          });
        }}
      />,
    );

    expect(
      await screen.findByText("Project was not found."),
    ).toBeInTheDocument();
  });

  it("renders generic errors and supports retry", async () => {
    const loadCaptureSessions = vi
      .fn<() => Promise<{ capture_sessions: CaptureSession[] }>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ capture_sessions: captureSessions });

    renderPage({ loadCaptureSessions });

    expect(
      await screen.findByText("Could not load capture sessions."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadCaptureSessions).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole("heading", {
        name: "Archived onboarding capture",
      }),
    ).toBeInTheDocument();
  });
});
