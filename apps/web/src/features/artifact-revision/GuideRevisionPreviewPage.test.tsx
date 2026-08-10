import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuideRevisionPreviewPage } from "./GuideRevisionPreviewPage";

const getArtifactRevision = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", async (original) => ({
  ...(await original()),
  getArtifactRevision,
}));

describe("GuideRevisionPreviewPage", () => {
  beforeEach(() => getArtifactRevision.mockReset());

  it("offers retry when the immutable Revision cannot be loaded", async () => {
    getArtifactRevision
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        revision: {
          id: "revision",
          edition_id: "edition",
          revision_number: 3,
          trigger: "manual_checkpoint",
          title: "Recovered guide",
          description: null,
          source_working_draft_version: 7,
          created_by_id: "user",
          created_at: "2026-07-19T12:00:00.000Z",
        },
        guide_blocks: [],
        capture_assets: [],
      });

    render(
      <GuideRevisionPreviewPage
        projectId="project_1"
        projectVersionId="version_1"
        artifactId="guide_1"
        revisionNumber={3}
        historyHref="/history"
      />,
    );

    expect(await screen.findByRole("heading", { name: "Revision unavailable" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Recovered guide" })).toBeInTheDocument();
    expect(getArtifactRevision).toHaveBeenCalledTimes(2);
  });

  it("renders only the immutable Revision response", async () => {
    getArtifactRevision.mockResolvedValue({
      revision: {
        id: "01J00000000000000000000001",
        edition_id: "01J00000000000000000000002",
        revision_number: 3,
        trigger: "manual_checkpoint",
        title: "Immutable guide",
        description: "Checkpoint content",
        source_working_draft_version: 7,
        created_by_id: "01J00000000000000000000003",
        created_at: "2026-07-19T12:00:00.000Z",
      },
      guide_blocks: [
        {
          id: "01J00000000000000000000004",
          block_type: "heading",
          title: "Frozen section",
          body: "Frozen body",
          block_index: 1,
          step: null,
        },
        {
          id: "01J00000000000000000000005",
          block_type: "step",
          title: null,
          body: null,
          block_index: 2,
          step: {
            id: "01J00000000000000000000006",
            display_capture_asset_id: "01J00000000000000000000007",
            screenshot_hidden: false,
            title: "Frozen screenshot",
            body: null,
            annotations: [
              {
                id: "01J00000000000000000000008",
                annotation_type: "highlight",
                annotation_index: 1,
                x: 0.1,
                y: 0.2,
                width: 0.3,
                height: 0.2,
              },
            ],
          },
        },
      ],
      capture_assets: [
        {
          id: "01J00000000000000000000007",
          status: "archived",
          file_url: "/api/revision-asset.png",
          mime_type: "image/png",
          width: 1200,
          height: 800,
        },
      ],
    });

    render(
      <GuideRevisionPreviewPage
        projectId="project_1"
        projectVersionId="version_1"
        artifactId="guide_1"
        revisionNumber={3}
        historyHref="/history"
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Immutable guide" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Frozen body")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Frozen screenshot" }),
    ).toHaveAttribute("src", "/api/revision-asset.png");
    expect(screen.getByLabelText("Highlight 1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Revision history" }),
    ).toHaveAttribute("href", "/history");
    expect(getArtifactRevision).toHaveBeenCalledWith({
      projectId: "project_1",
      projectVersionId: "version_1",
      artifactId: "guide_1",
      revisionNumber: 3,
      artifactType: "guide",
    });
  });
});
