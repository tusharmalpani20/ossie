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
          background_capture_asset_id: "01J00000000000000000000005",
          scene_index: 1,
          title: "Frozen scene",
          description: "Immutable scene body",
          hotspots: [
            {
              id: "01J00000000000000000000006",
              hotspot_type: "info",
              label: "Open details",
              content: null,
              x: 0.1,
              y: 0.2,
              width: 0.2,
              height: 0.1,
              hotspot_index: 1,
              transition: null,
            },
          ],
        },
      ],
      capture_assets: [
        {
          id: "01J00000000000000000000005",
          status: "archived",
          file_url: "/api/demo-revision-asset.png",
          mime_type: "image/png",
          width: 1200,
          height: 800,
        },
      ],
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
    expect(screen.getByRole("img", { name: "Frozen scene" })).toHaveAttribute(
      "src",
      "/api/demo-revision-asset.png",
    );
    expect(screen.getByLabelText("Open details")).toBeInTheDocument();
    expect(screen.getByText("1 hotspot")).toBeInTheDocument();
    expect(getArtifactRevision).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactType: "interactive_demo",
        revisionNumber: 4,
      }),
    );
  });
});
