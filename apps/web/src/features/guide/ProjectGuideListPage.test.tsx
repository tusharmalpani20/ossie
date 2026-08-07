import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ProjectGuideListPage } from "./ProjectGuideListPage";

const now = "2026-07-19T10:00:00.000Z";
describe("ProjectGuideListPage", () => {
  it("announces the loading state with a page heading and status", () => {
    render(
      <ProjectGuideListPage
        projectId="project_1"
        projectVersionId="version_2"
        versionSlug="q3"
        renderShell={false}
        loadGuides={() => new Promise(() => undefined)}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Guides", level: 1 }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Loading guides...");
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
      "Sign in to view guides.",
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
    ["generic error", new Error("Network failed"), "Could not load guides."],
  ])("names the %s state and preserves its message", async (_, error, message) => {
    render(
      <ProjectGuideListPage
        projectId="project_1"
        projectVersionId="version_2"
        versionSlug="q3"
        renderShell={false}
        loadGuides={async () => {
          throw error;
        }}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Guides", level: 1 }),
    ).toBeVisible();
    const messageNode =
      error instanceof Error && !(error instanceof ApiClientError)
        ? screen.getByRole("alert")
        : screen.getByText(message);
    expect(messageNode).toHaveTextContent(message);
  });

  it("names the Guides workspace as one region", async () => {
    render(
      <ProjectGuideListPage
        projectId="project_1"
        projectVersionId="version_2"
        versionSlug="q3"
        renderShell={false}
        loadGuides={async () => ({ guide_editions: [] })}
        loadPublishLinks={async () => ({
          publish_links: [],
          next_cursor: null,
        })}
      />,
    );

    expect(
      await screen.findByRole("region", { name: "Guides workspace" }),
    ).toBeInTheDocument();
  });

  it("renders only Edition summaries returned for the selected Project Version", async () => {
    const loadGuides = vi.fn().mockResolvedValue({
      guide_editions: [
        {
          artifact: {
            id: "guide_1",
            organization_id: "org_1",
            project_id: "project_1",
            created_by_id: "user_1",
            created_at: now,
          },
          edition: {
            id: "edition_1",
            organization_id: "org_1",
            project_id: "project_1",
            guide_id: "guide_1",
            project_version_id: "version_2",
            source_capture_session_id: null,
            title: "Named Edition",
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
      <ProjectGuideListPage
        projectId="project_1"
        projectVersionId="version_2"
        versionSlug="q3"
        loadGuides={loadGuides}
        loadPublishLinks={async () => ({
          publish_links: [],
          next_cursor: null,
        })}
      />,
    );
    expect(await screen.findByText("Named Edition")).toBeInTheDocument();
    expect(loadGuides).toHaveBeenCalledWith("project_1");
    expect(screen.getByRole("link", { name: /open guide/i })).toHaveAttribute(
      "href",
      "/projects/project_1/versions/q3/guides/guide_1",
    );
  });

  it("can render content without its own shell inside Project Version routes", async () => {
    render(
      <ProjectGuideListPage
        projectId="project_1"
        projectVersionId="version_2"
        versionSlug="q3"
        renderShell={false}
        loadGuides={async () => ({ guide_editions: [] })}
        loadPublishLinks={async () => ({
          publish_links: [],
          next_cursor: null,
        })}
      />,
    );

    expect(await screen.findByText("No guides yet.")).toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });
});
