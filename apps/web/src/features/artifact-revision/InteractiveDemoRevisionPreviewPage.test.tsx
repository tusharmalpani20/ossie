import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InteractiveDemoRevisionPreviewPage } from "./InteractiveDemoRevisionPreviewPage";

const getArtifactRevision = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", async (original) => ({
  ...(await original()),
  getArtifactRevision,
}));

describe("InteractiveDemoRevisionPreviewPage", () => {
  it("renders the immutable scene graph returned for the Revision", async () => {
    getArtifactRevision.mockResolvedValue({
      revision: {
        id: "01J00000000000000000000001",
        edition_id: "01J00000000000000000000002",
        revision_number: 4,
        trigger: "carry_forward",
        title: "Immutable demo",
        description: null,
        source_working_draft_version: 8,
        created_by_id: "01J00000000000000000000003",
        created_at: "2026-07-19T12:00:00.000Z",
      },
      demo_scenes: [
        {
          id: "01J00000000000000000000004",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          background_capture_asset_id: null,
          scene_index: 1,
          title: "Frozen scene",
          description: "Immutable scene body",
          hotspots: [],
        },
      ],
      capture_assets: [],
    });

    render(
      <InteractiveDemoRevisionPreviewPage
        projectId="project_1"
        projectVersionId="version_1"
        artifactId="demo_1"
        revisionNumber={4}
        historyHref="/history"
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Immutable demo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Immutable scene body")).toBeInTheDocument();
    expect(screen.getByText("0 hotspots")).toBeInTheDocument();
    expect(getArtifactRevision).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactType: "interactive_demo",
        revisionNumber: 4,
      }),
    );
  });
});
