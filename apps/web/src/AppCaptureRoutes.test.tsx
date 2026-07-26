/**
 * @fileoverview App Capture route behavior tests.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const readyInstanceStatus = {
  deployment_mode: "self_hosted",
  onboarding_mode: "first_run_setup",
  setup_required: false,
  signup_enabled: false,
};

const archivedVersion = {
  id: "version_archived",
  organization_id: "organization_1",
  project_id: "project_1",
  name: "Archived release",
  description: null,
  slug: "archived-release",
  release_date: null,
  position: 2,
  status: "archived",
  is_default: false,
  version: 3,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  created_at: "2026-07-19T10:00:00.000Z",
  updated_at: "2026-07-19T10:00:00.000Z",
  aliases: [],
};

const activeProjectResponse = {
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

describe("App Capture routes", () => {
  it("keeps Capture Session list read-only for archived Project Versions", async () => {
    window.history.pushState(
      {},
      "",
      "/projects/project_1/versions/archived-release/capture-sessions",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.endsWith("/api/v1/public/instance")) {
          return jsonResponse(readyInstanceStatus);
        }

        if (url.endsWith("/api/v1/projects/project_1")) {
          return jsonResponse(activeProjectResponse);
        }

        if (url.endsWith("/versions/resolve/archived-release")) {
          return jsonResponse({
            resolution: "canonical",
            project_version: archivedVersion,
          });
        }

        if (url.endsWith("/versions")) {
          return jsonResponse({ project_versions: [archivedVersion] });
        }

        if (
          url.includes(
            "/api/v1/projects/project_1/capture-sessions?project_version_id=version_archived",
          )
        ) {
          return jsonResponse({ capture_sessions: [] });
        }

        return jsonResponse(
          { error: { message: `Unexpected URL: ${url}` } },
          404,
        );
      }),
    );

    render(<App />);

    expect(
      await screen.findByText(/Archived Project Version/),
    ).toBeInTheDocument();
    expect(await screen.findByText("Read only")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New Capture Session" }),
    ).not.toBeInTheDocument();
  });
});
