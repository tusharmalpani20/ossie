import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json",
  },
});

const readyInstanceStatus = {
  deployment_mode: "self_hosted",
  onboarding_mode: "first_run_setup",
  setup_required: false,
  signup_enabled: false,
};

describe("App", () => {
  it("renders project list home routes", async () => {
    window.history.pushState({}, "", "/projects");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.endsWith("/api/v1/public/instance")) {
        return jsonResponse(readyInstanceStatus);
      }

      if (url.endsWith("/api/v1/projects")) {
        return jsonResponse({
          projects: [{
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
          }],
        });
      }

      return jsonResponse({ error: { message: `Unexpected URL: ${url}` } }, 404);
    }));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Internal onboarding demos" })).toBeInTheDocument();
  });

  it("renders the root route as project list home", async () => {
    window.history.pushState({}, "", "/");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      projects: [],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByText("No projects yet.")).toBeInTheDocument();
  });

  it("renders login routes", () => {
    window.history.pushState({}, "", "/login?next=/projects/project_1");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("routes login to setup when first-run setup is required", async () => {
    window.history.pushState({}, "", "/login");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      deployment_mode: "self_hosted",
      onboarding_mode: "first_run_setup",
      setup_required: true,
      signup_enabled: false,
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Set up Ossie" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/setup");
  });

  it("renders setup routes", async () => {
    window.history.pushState({}, "", "/setup");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      deployment_mode: "self_hosted",
      onboarding_mode: "first_run_setup",
      setup_required: true,
      signup_enabled: false,
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Set up Ossie" })).toBeInTheDocument();
    expect(screen.getByLabelText("Owner email")).toBeInTheDocument();
  });

  it("routes private portal pages to setup when first-run setup is required", async () => {
    window.history.pushState({}, "", "/projects");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      deployment_mode: "self_hosted",
      onboarding_mode: "first_run_setup",
      setup_required: true,
      signup_enabled: false,
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Set up Ossie" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/setup");
  });

  it("shows a stable error on private routes when setup status cannot load", async () => {
    window.history.pushState({}, "", "/projects");
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network unavailable");
    }));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Setup status unavailable" })).toBeInTheDocument();
    expect(screen.getByText("Could not load instance setup status.")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/projects");
  });

  it("renders project workspace routes", async () => {
    window.history.pushState({}, "", "/projects/project_1");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      project: {
        id: "project_1",
        organization_id: "organization_1",
        name: "Internal onboarding demos",
        description: "Reusable captures and guides for internal teams.",
        slug: "internal-onboarding-demos",
        color: "#2563eb",
        icon: "folder",
        status: "active",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:05:00.000Z",
      },
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Internal onboarding demos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open capture sessions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open guides" })).toBeInTheDocument();
  });

  it("renders project settings routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/settings?tab=lifecycle");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      project: {
        id: "project_1",
        organization_id: "organization_1",
        name: "Internal onboarding demos",
        description: "Reusable captures and guides for internal teams.",
        slug: "internal-onboarding-demos",
        color: "#2563eb",
        icon: "folder",
        status: "active",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:05:00.000Z",
      },
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Project settings" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Internal onboarding demos")).toBeInTheDocument();
  });

  it("renders capture session detail routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/capture-sessions/capture_session_1");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      capture_session: {
        id: "capture_session_1",
        organization_id: "organization_1",
        project_id: "project_1",
        name: "Create department workflow",
        description: null,
        status: "draft",
        source_type: "extension",
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
        user_agent: null,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:00:00.000Z",
      },
      capture_events: [],
      capture_assets: [],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Create department workflow" })).toBeInTheDocument();
  });

  it("renders project capture session list routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/capture-sessions");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      capture_sessions: [{
        id: "capture_session_1",
        organization_id: "organization_1",
        project_id: "project_1",
        name: "Create department workflow",
        description: null,
        status: "completed",
        source_type: "extension",
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
        user_agent: null,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:00:00.000Z",
      }],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Capture sessions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create department workflow" })).toBeInTheDocument();
  });

  it("renders guide editor routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/guides/guide_1");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      guide: {
        id: "guide_1",
        organization_id: "organization_1",
        project_id: "project_1",
        source_capture_session_id: null,
        title: "Department guide",
        description: "Set up departments from the list view.",
        status: "draft",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:00:00.000Z",
      },
      guide_blocks: [],
      source_capture_assets: [],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("This guide does not have any blocks yet.")).toBeInTheDocument();
  });

  it("renders guide preview routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/guides/guide_1/preview");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      guide: {
        id: "guide_1",
        organization_id: "organization_1",
        project_id: "project_1",
        source_capture_session_id: null,
        title: "Department guide",
        description: "Set up departments from the list view.",
        status: "draft",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:00:00.000Z",
      },
      guide_blocks: [],
      source_capture_assets: [],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit guide" })).toHaveAttribute("href", "/projects/project_1/guides/guide_1");
  });

  it("renders project guide list routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/guides");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      guides: [{
        id: "guide_1",
        organization_id: "organization_1",
        project_id: "project_1",
        source_capture_session_id: "capture_session_1",
        title: "Department guide",
        description: null,
        status: "draft",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:00:00.000Z",
      }],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Guides" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Department guide" })).toBeInTheDocument();
  });

  it("renders project interactive demo list routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/interactive-demos");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.endsWith("/api/v1/public/instance")) {
        return jsonResponse(readyInstanceStatus);
      }

      if (url.endsWith("/api/v1/projects/project_1/interactive-demos")) {
        return jsonResponse({
          interactive_demos: [{
            id: "interactive_demo_1",
            organization_id: "organization_1",
            project_id: "project_1",
            source_capture_session_id: "capture_session_1",
            title: "Department setup demo",
            description: null,
            status: "draft",
            created_by_id: "org_user_1",
            updated_by_id: "org_user_1",
            version: 1,
            created_at: "2026-06-05T10:00:00.000Z",
            updated_at: "2026-06-05T10:00:00.000Z",
          }],
        });
      }

      return jsonResponse({ error: { message: `Unexpected URL: ${url}` } }, 404);
    }));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Interactive demos" })).toBeInTheDocument();
    expect(screen.getByText("Department setup demo")).toBeInTheDocument();
  });

  it("renders interactive demo editor routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/interactive-demos/interactive_demo_1");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.endsWith("/api/v1/public/instance")) {
        return jsonResponse(readyInstanceStatus);
      }

      if (url.endsWith("/api/v1/projects/project_1/interactive-demos/interactive_demo_1")) {
        return jsonResponse({
          interactive_demo: {
            id: "interactive_demo_1",
            organization_id: "organization_1",
            project_id: "project_1",
            source_capture_session_id: "capture_session_1",
            title: "Department setup demo",
            description: "Shows how to add a department.",
            status: "draft",
            created_by_id: "org_user_1",
            updated_by_id: "org_user_1",
            version: 1,
            created_at: "2026-06-05T10:00:00.000Z",
            updated_at: "2026-06-05T10:00:00.000Z",
          },
        });
      }

      if (url.endsWith("/api/v1/projects/project_1/interactive-demos/interactive_demo_1/scenes")) {
        return jsonResponse({
          demo_scenes: [],
        });
      }

      return jsonResponse({ error: { message: `Unexpected URL: ${url}` } }, 404);
    }));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Department setup demo" })).toBeInTheDocument();
    expect(screen.getByText("No scenes yet.")).toBeInTheDocument();
  });

  it("renders the setup-guarded compliance timeline route", async () => {
    window.history.pushState({}, "", "/organization/compliance");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/v1/public/instance")) return jsonResponse(readyInstanceStatus);
      if (url.endsWith("/api/v1/organization/compliance/events")) return jsonResponse({
        events: [],
        page: { next_cursor: null, has_more: false },
        totals: {
          audit_events: 0,
          audit_change_items: 0,
          access_events: 0,
          oldest_occurred_at: null,
          newest_occurred_at: null,
        },
      });
      return jsonResponse({ error: { message: `Unexpected URL: ${url}` } }, 404);
    }));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Compliance timeline" })).toBeInTheDocument();
    expect(await screen.findByText("No retained evidence matches this filter.")).toBeInTheDocument();
  });

  it("renders public guide reader routes without portal navigation", async () => {
    window.history.pushState({}, "", "/p/abc123");
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      publish_link: {
        slug: "abc123",
        artifact_type: "guide",
        visibility: "public",
        expires_at: null,
        status: "active",
        password_protected: false,
      },
      published_artifact: {
        id: "published_artifact_1",
        artifact_type: "guide",
        artifact_id: "guide_1",
        version_number: 1,
        title: "Department guide",
        published_at: "2026-06-10T00:00:00.000Z",
        snapshot: {
          artifact_type: "guide",
          guide: {
            id: "guide_1",
            title: "Department guide",
            description: "Set up departments from the list view.",
            source_capture_session_id: "capture_session_1",
            published_version: 1,
            published_at: "2026-06-10T00:00:00.000Z",
          },
          blocks: [],
        },
      },
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }));
    vi.stubGlobal("fetch", fetch);

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("This published guide does not have any blocks yet.")).toBeInTheDocument();
    expect(screen.queryByText("Ossie portal")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/public/publish-links/abc123",
      {
        credentials: "include",
        headers: {
          "X-Ossie-Access-Surface": "reader",
          accept: "application/json",
        },
      }
    );
  });

  it("renders public guide embed routes without portal navigation", async () => {
    window.history.pushState({}, "", "/p/abc123/embed");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      publish_link: {
        slug: "abc123",
        artifact_type: "guide",
        visibility: "public",
        expires_at: null,
        status: "active",
        password_protected: false,
      },
      published_artifact: {
        id: "published_artifact_1",
        artifact_type: "guide",
        artifact_id: "guide_1",
        version_number: 1,
        title: "Department guide",
        published_at: "2026-06-10T00:00:00.000Z",
        snapshot: {
          artifact_type: "guide",
          guide: {
            id: "guide_1",
            title: "Department guide",
            description: "Set up departments from the list view.",
            source_capture_session_id: "capture_session_1",
            published_version: 1,
            published_at: "2026-06-10T00:00:00.000Z",
          },
          blocks: [],
        },
      },
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("main", { name: "Embedded published guide" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.queryByText("Ossie portal")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
  });

  it("renders an unsupported route state", () => {
    window.history.pushState({}, "", "/unknown");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Ossie portal" })).toBeInTheDocument();
    expect(screen.getByText("Open the project list, a project workspace, capture session list, capture session, guide list, guide link, or interactive demo link to continue.")).toBeInTheDocument();
  });
});
