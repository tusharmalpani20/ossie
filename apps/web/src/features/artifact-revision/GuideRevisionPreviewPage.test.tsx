import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GuideRevisionPreviewPage } from "./GuideRevisionPreviewPage";

const getArtifactRevision = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", async (original) => ({
  ...(await original()),
  getArtifactRevision,
}));

describe("GuideRevisionPreviewPage", () => {
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
      ],
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

    expect(
      await screen.findByRole("heading", { name: "Immutable guide" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Frozen body")).toBeInTheDocument();
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
