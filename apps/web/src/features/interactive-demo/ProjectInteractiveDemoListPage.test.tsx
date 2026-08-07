import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ProjectInteractiveDemoListPage } from "./ProjectInteractiveDemoListPage";

const now = "2026-07-19T10:00:00.000Z";
describe("ProjectInteractiveDemoListPage", () => {
  it("announces the loading state with a page heading and status", () => {
    render(
      <ProjectInteractiveDemoListPage
        projectId="project_1"
        projectVersionId="version_2"
        versionSlug="q3"
        renderShell={false}
        loadDemos={() => new Promise(() => undefined)}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Interactive demos",
        level: 1,
      }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading interactive demos...",
    );
  });

  it.each([
    [
      "unauthenticated",
      new ApiClientError({
        kind: "unauthenticated",
        status: 401,
        type: "unauthenticated",
        message: "Authentication is required",
      }),
      "Sign in to view interactive demos.",
    ],
    [
      "not found",
      new ApiClientError({
        kind: "not_found",
        status: 404,
        type: "project_not_found",
        message: "Project was not found",
      }),
      "Project was not found.",
    ],
    [
      "generic error",
      new Error("Network failed"),
      "Could not load interactive demos.",
    ],
  ])(
    "names the %s state and preserves its message",
    async (_, error, message) => {
      render(
        <ProjectInteractiveDemoListPage
          projectId="project_1"
          projectVersionId="version_2"
          versionSlug="q3"
          renderShell={false}
          loadDemos={async () => {
            throw error;
          }}
        />,
      );

      expect(
        await screen.findByRole("heading", {
          name: "Interactive demos",
          level: 1,
        }),
      ).toBeVisible();
      const messageNode =
        error instanceof Error && !(error instanceof ApiClientError)
          ? screen.getByRole("alert")
          : screen.getByText(message);
      expect(messageNode).toHaveTextContent(message);
    },
  );

  it("renders Edition summaries for the selected Project Version", async () => {
    const loadDemos = vi.fn().mockResolvedValue({
      interactive_demo_editions: [
        {
          artifact: {
            id: "demo_1",
            organization_id: "org_1",
            project_id: "project_1",
            created_by_id: "user_1",
            created_at: now,
          },
          edition: {
            id: "edition_1",
            organization_id: "org_1",
            project_id: "project_1",
            interactive_demo_id: "demo_1",
            project_version_id: "version_2",
            source_capture_session_id: null,
            title: "Named Demo",
            description: null,
            status: "draft",
            created_by_id: "user_1",
            updated_by_id: "user_1",
            version: 1,
            created_at: now,
            updated_at: now,
          },
          authored_updated_at: now,
        },
      ],
    });
    render(
      <ProjectInteractiveDemoListPage
        projectId="project_1"
        projectVersionId="version_2"
        versionSlug="q3"
        loadDemos={loadDemos}
      />,
    );
    expect(await screen.findByText("Named Demo")).toBeInTheDocument();
    expect(loadDemos).toHaveBeenCalledWith("project_1");
    expect(screen.getByRole("link", { name: /open demo/i })).toHaveAttribute(
      "href",
      "/projects/project_1/versions/q3/interactive-demos/demo_1",
    );
    expect(screen.getByText(/Authored/)).toBeVisible();
  });

  it("uses the qualified source Capture route without exposing its raw ID", async () => {
    render(
      <ProjectInteractiveDemoListPage
        projectId="project_1"
        projectVersionId="version_2"
        versionSlug="q3"
        loadDemos={async () =>
          ({
            interactive_demo_editions: [
              {
                artifact: { id: "demo_1" },
                edition: {
                  id: "edition_1",
                  interactive_demo_id: "demo_1",
                  project_version_id: "version_2",
                  source_capture_session_id: "capture_secret_id",
                  title: "Captured demo",
                  description: null,
                  status: "draft",
                  created_at: now,
                  updated_at: now,
                },
                authored_updated_at: now,
              },
            ],
          }) as never
        }
      />,
    );

    expect(
      await screen.findByRole("link", { name: "Open source Capture" }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/versions/q3/capture-sessions/capture_secret_id",
    );
    expect(screen.queryByText(/capture_secret_id/)).not.toBeInTheDocument();
  });

  it("can render content without its own shell inside Project Version routes", async () => {
    render(
      <ProjectInteractiveDemoListPage
        projectId="project_1"
        projectVersionId="version_2"
        versionSlug="q3"
        renderShell={false}
        loadDemos={async () => ({ interactive_demo_editions: [] })}
      />,
    );

    expect(
      await screen.findByText("No interactive demos yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });
});
