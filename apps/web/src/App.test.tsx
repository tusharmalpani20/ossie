/**
 * @fileoverview App route smoke tests.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
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

const writableProjectResponse = {
  project: {
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
    access: { role: "project_admin", source: "organization_owner" },
    default_project_version: {
      id: "version_1",
      name: "Main",
      slug: "main",
      status: "active",
      position: 1,
    },
  },
};

const mainProjectVersion = {
  id: "version_1",
  organization_id: "organization_1",
  project_id: "project_1",
  name: "Main",
  description: null,
  slug: "main",
  release_date: null,
  position: 1,
  status: "active",
  is_default: true,
  version: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  created_at: "2026-07-19T10:00:00.000Z",
  updated_at: "2026-07-19T10:00:00.000Z",
  aliases: [],
};

const artifactCreatedAt = "2026-06-05T10:00:00.000Z";
const guideDetailResponse = {
  artifact: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    created_by_id: "org_user_1",
    created_at: artifactCreatedAt,
  },
  edition: {
    id: "guide_edition_1",
    organization_id: "organization_1",
    project_id: "project_1",
    guide_id: "guide_1",
    project_version_id: "version_1",
    source_capture_session_id: null,
    title: "Department guide",
    description: "Set up departments from the list view.",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: artifactCreatedAt,
    updated_at: artifactCreatedAt,
  },
  working_draft: {
    id: "guide_draft_1",
    organization_id: "organization_1",
    project_id: "project_1",
    guide_edition_id: "guide_edition_1",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: artifactCreatedAt,
    updated_at: artifactCreatedAt,
  },
  authored_updated_at: artifactCreatedAt,
  guide_blocks: [],
  source_capture_assets: [],
};
const demoDetailResponse = {
  artifact: {
    id: "interactive_demo_1",
    organization_id: "organization_1",
    project_id: "project_1",
    created_by_id: "org_user_1",
    created_at: artifactCreatedAt,
  },
  edition: {
    id: "demo_edition_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_id: "interactive_demo_1",
    project_version_id: "version_1",
    source_capture_session_id: "capture_session_1",
    title: "Department setup demo",
    description: "Shows how to add a department.",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: artifactCreatedAt,
    updated_at: artifactCreatedAt,
  },
  working_draft: {
    id: "demo_draft_1",
    organization_id: "organization_1",
    project_id: "project_1",
    interactive_demo_edition_id: "demo_edition_1",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: artifactCreatedAt,
    updated_at: artifactCreatedAt,
  },
  authored_updated_at: artifactCreatedAt,
};

describe("App", () => {
  it("renders project list home routes", async () => {
    window.history.pushState({}, "", "/projects");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.endsWith("/api/v1/public/instance")) {
          return jsonResponse(readyInstanceStatus);
        }

        if (url.includes("/api/v1/projects?status=active")) {
          return jsonResponse({
            projects: [
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
                access: { role: "project_admin", source: "organization_owner" },
                default_project_version: {
                  id: "version_1",
                  name: "Main",
                  slug: "main",
                  status: "active",
                  position: 1,
                },
              },
            ],
          });
        }

        return jsonResponse(
          { error: { message: `Unexpected URL: ${url}` } },
          404,
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Internal onboarding demos" }),
    ).toBeInTheDocument();
  });

  it("renders the root route as project list home", async () => {
    window.history.pushState({}, "", "/");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              projects: [],
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
      ),
    );

    render(<App />);

    expect(
      await screen.findByText(
        "No active Projects yet. Create a Project to start capturing governed product knowledge.",
      ),
    ).toBeInTheDocument();
  });

  it("renders login routes", () => {
    window.history.pushState({}, "", "/login?next=/projects/project_1");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("routes login to setup when first-run setup is required", async () => {
    window.history.pushState({}, "", "/login");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              deployment_mode: "self_hosted",
              onboarding_mode: "first_run_setup",
              setup_required: true,
              signup_enabled: false,
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
      ),
    );

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Set up Ossie" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/setup");
  });

  it("renders setup routes", async () => {
    window.history.pushState({}, "", "/setup");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              deployment_mode: "self_hosted",
              onboarding_mode: "first_run_setup",
              setup_required: true,
              signup_enabled: false,
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
      ),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Set up Ossie" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Owner email")).toBeInTheDocument();
  });

  it("routes private portal pages to setup when first-run setup is required", async () => {
    window.history.pushState({}, "", "/projects");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              deployment_mode: "self_hosted",
              onboarding_mode: "first_run_setup",
              setup_required: true,
              signup_enabled: false,
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
      ),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Set up Ossie" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/setup");
  });

  it("shows a stable error on private routes when setup status cannot load", async () => {
    window.history.pushState({}, "", "/projects");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network unavailable");
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Setup status unavailable" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Could not load instance setup status."),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/projects");
  });

  it("renders project workspace routes", async () => {
    window.history.pushState({}, "", "/projects/project_1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        if (url.endsWith("/api/v1/public/instance"))
          return jsonResponse(readyInstanceStatus);
        if (url.endsWith("/versions/resolve/main"))
          return jsonResponse({
            resolution: "canonical",
            project_version: mainProjectVersion,
          });
        if (url.endsWith("/versions"))
          return jsonResponse({ project_versions: [mainProjectVersion] });
        if (url.endsWith("/versions"))
          return jsonResponse({ project_versions: [mainProjectVersion] });
        return jsonResponse(writableProjectResponse);
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Main" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/projects/project_1/versions/main");
    expect(
      screen.getByRole("link", { name: "Open capture sessions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open guides" }),
    ).toBeInTheDocument();
  });

  it("renders project settings routes", async () => {
    window.history.pushState(
      {},
      "",
      "/projects/project_1/settings?tab=lifecycle",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (input: RequestInfo | URL) =>
          new Response(
            JSON.stringify(
              input.toString().endsWith("/memberships")
                ? { members: [] }
                : {
                    project: {
                      id: "project_1",
                      organization_id: "organization_1",
                      name: "Internal onboarding demos",
                      description:
                        "Reusable captures and guides for internal teams.",
                      slug: "internal-onboarding-demos",
                      color: "#2563eb",
                      icon: "folder",
                      status: "active",
                      created_by_id: "org_user_1",
                      updated_by_id: "org_user_1",
                      version: 1,
                      created_at: "2026-06-05T10:00:00.000Z",
                      updated_at: "2026-06-05T10:05:00.000Z",
                      access: {
                        role: "project_admin",
                        source: "organization_owner",
                      },
                      default_project_version: {
                        id: "version_1",
                        name: "Main",
                        slug: "main",
                        status: "active",
                        position: 1,
                      },
                    },
                  },
            ),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
      ),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Project settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Internal onboarding demos"),
    ).toBeInTheDocument();
  });

  it("renders capture session detail routes", async () => {
    window.history.pushState(
      {},
      "",
      "/projects/project_1/capture-sessions/capture_session_1",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (input.toString().endsWith("/api/v1/projects/project_1")) {
          return jsonResponse(writableProjectResponse);
        }
        return new Response(
          JSON.stringify({
            capture_session: {
              id: "capture_session_1",
              organization_id: "organization_1",
              project_id: "project_1",
              project_version_id: "version_1",
              project_version: {
                id: "version_1",
                name: "Main",
                slug: "main",
                status: "active",
                position: 1,
              },
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
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", {
        name: "Create department workflow",
      }),
    ).toBeInTheDocument();
  });

  it("renders project capture session list routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/capture-sessions");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (input.toString().endsWith("/api/v1/projects/project_1")) {
          return jsonResponse(writableProjectResponse);
        }
        return new Response(
          JSON.stringify({
            capture_sessions: [
              {
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
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Capture sessions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Create department workflow" }),
    ).toBeInTheDocument();
  });

  it("renders guide editor routes", async () => {
    window.history.pushState(
      {},
      "",
      "/projects/project_1/versions/main/guides/guide_1",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        if (url.endsWith("/api/v1/public/instance"))
          return jsonResponse(readyInstanceStatus);
        if (url.endsWith("/versions/resolve/main"))
          return jsonResponse({
            resolution: "canonical",
            project_version: mainProjectVersion,
          });
        if (url.endsWith("/versions"))
          return jsonResponse({ project_versions: [mainProjectVersion] });
        if (url.endsWith("/api/v1/projects/project_1")) {
          return jsonResponse(writableProjectResponse);
        }
        if (url.includes("/guides/guide_1?project_version_id=version_1"))
          return jsonResponse(guideDetailResponse);
        if (url.includes("/publish-status?project_version_id=version_1"))
          return jsonResponse({ publish_link: null, published_artifact: null });
        return jsonResponse(
          { error: { message: `Unexpected URL: ${url}` } },
          404,
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Department guide" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This guide does not have any blocks yet."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(1);
  });

  it("renders guide preview routes", async () => {
    window.history.pushState(
      {},
      "",
      "/projects/project_1/versions/main/guides/guide_1/preview",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        if (url.endsWith("/api/v1/public/instance"))
          return jsonResponse(readyInstanceStatus);
        if (url.endsWith("/versions/resolve/main"))
          return jsonResponse({
            resolution: "canonical",
            project_version: mainProjectVersion,
          });
        if (url.endsWith("/versions"))
          return jsonResponse({ project_versions: [mainProjectVersion] });
        if (url.endsWith("/api/v1/projects/project_1")) {
          return jsonResponse(writableProjectResponse);
        }
        if (url.includes("/guides/guide_1?project_version_id=version_1"))
          return jsonResponse(guideDetailResponse);
        return jsonResponse(
          { error: { message: `Unexpected URL: ${url}` } },
          404,
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Department guide" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit guide" })).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/guides/guide_1",
    );
    expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(1);
  });

  it("renders project guide list routes", async () => {
    window.history.pushState(
      {},
      "",
      "/projects/project_1/versions/main/guides",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        if (url.endsWith("/api/v1/public/instance"))
          return jsonResponse(readyInstanceStatus);
        if (url.endsWith("/versions/resolve/main"))
          return jsonResponse({
            resolution: "canonical",
            project_version: mainProjectVersion,
          });
        if (url.endsWith("/versions"))
          return jsonResponse({ project_versions: [mainProjectVersion] });
        if (url.endsWith("/api/v1/projects/project_1"))
          return jsonResponse(writableProjectResponse);
        if (url.includes("/guides?project_version_id=version_1"))
          return jsonResponse({
            guide_editions: [
              {
                artifact: guideDetailResponse.artifact,
                edition: guideDetailResponse.edition,
                authored_updated_at: artifactCreatedAt,
              },
            ],
          });
        return jsonResponse(
          { error: { message: `Unexpected URL: ${url}` } },
          404,
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Guides" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Department guide" }),
    ).toBeInTheDocument();
  });

  it("renders project interactive demo list routes", async () => {
    window.history.pushState(
      {},
      "",
      "/projects/project_1/versions/main/interactive-demos",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.endsWith("/api/v1/public/instance")) {
          return jsonResponse(readyInstanceStatus);
        }

        if (url.endsWith("/api/v1/projects/project_1")) {
          return jsonResponse(writableProjectResponse);
        }

        if (url.endsWith("/versions/resolve/main"))
          return jsonResponse({
            resolution: "canonical",
            project_version: mainProjectVersion,
          });
        if (url.endsWith("/versions"))
          return jsonResponse({ project_versions: [mainProjectVersion] });

        if (
          url.includes(
            "/api/v1/projects/project_1/interactive-demos?project_version_id=version_1",
          )
        ) {
          return jsonResponse({
            interactive_demo_editions: [
              {
                artifact: demoDetailResponse.artifact,
                edition: demoDetailResponse.edition,
                authored_updated_at: artifactCreatedAt,
              },
            ],
          });
        }

        return jsonResponse(
          { error: { message: `Unexpected URL: ${url}` } },
          404,
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Interactive demos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Department setup demo")).toBeInTheDocument();
  });

  it("renders interactive demo editor routes", async () => {
    window.history.pushState(
      {},
      "",
      "/projects/project_1/versions/main/interactive-demos/interactive_demo_1",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.endsWith("/api/v1/public/instance")) {
          return jsonResponse(readyInstanceStatus);
        }

        if (url.endsWith("/api/v1/projects/project_1")) {
          return jsonResponse(writableProjectResponse);
        }

        if (url.endsWith("/versions/resolve/main"))
          return jsonResponse({
            resolution: "canonical",
            project_version: mainProjectVersion,
          });
        if (url.endsWith("/versions"))
          return jsonResponse({ project_versions: [mainProjectVersion] });

        if (
          url.includes(
            "/interactive-demos/interactive_demo_1?project_version_id=version_1",
          )
        ) {
          return jsonResponse(demoDetailResponse);
        }

        if (
          url.includes(
            "/interactive-demos/interactive_demo_1/scenes?project_version_id=version_1",
          )
        ) {
          return jsonResponse({
            demo_scenes: [],
            working_draft: demoDetailResponse.working_draft,
          });
        }

        if (url.includes("/publish-status?project_version_id=version_1"))
          return jsonResponse({ publish_link: null, published_artifact: null });

        return jsonResponse(
          { error: { message: `Unexpected URL: ${url}` } },
          404,
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Department setup demo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No scenes yet.")).toBeInTheDocument();
  });

  it("renders the setup-guarded compliance timeline route", async () => {
    window.history.pushState({}, "", "/organization/compliance");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();
        if (url.endsWith("/api/v1/public/instance"))
          return jsonResponse(readyInstanceStatus);
        if (url.endsWith("/api/v1/organization/compliance/events"))
          return jsonResponse({
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
        return jsonResponse(
          { error: { message: `Unexpected URL: ${url}` } },
          404,
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Compliance timeline" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("No retained evidence matches this filter."),
    ).toBeInTheDocument();
  });

  it("renders an unsupported route state", () => {
    window.history.pushState({}, "", "/unknown");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Ossie portal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Open the project list, a project workspace, capture session list, capture session, guide list, guide link, or interactive demo link to continue.",
      ),
    ).toBeInTheDocument();
  });
});
