import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactRevisionHistoryPage } from "./ArtifactRevisionHistoryPage";

const api = vi.hoisted(() => ({
  listArtifactRevisions: vi.fn(),
  getGuideDetail: vi.fn(),
  getInteractiveDemo: vi.fn(),
  checkpointArtifactRevision: vi.fn(),
  restoreArtifactRevision: vi.fn(),
}));

vi.mock("../../lib/api", async (original) => ({
  ...(await original()),
  ...api,
}));

const revision = {
  id: "01J00000000000000000000001",
  edition_id: "01J00000000000000000000002",
  revision_number: 2,
  trigger: "manual_checkpoint" as const,
  title: "Account setup",
  description: null,
  source_working_draft_version: 4,
  created_by_id: "01J00000000000000000000003",
  created_at: "2026-07-19T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  api.listArtifactRevisions.mockResolvedValue({
    revisions: [revision],
    next_before_revision_number: null,
  });
  api.getGuideDetail.mockResolvedValue({
    edition: { version: 3 },
    working_draft: { version: 4 },
  });
});

describe("ArtifactRevisionHistoryPage", () => {
  it("shows immutable history to a Viewer without writer controls", async () => {
    render(
      <ArtifactRevisionHistoryPage
        projectId="project_1"
        projectVersionId="version_1"
        versionSlug="main"
        artifactType="guide"
        artifactId="guide_1"
        canWrite={false}
      />,
    );

    expect(await screen.findByText("Revision 2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restore" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Open immutable preview" }),
    ).toHaveAttribute(
      "href",
      "/projects/project_1/versions/main/guides/guide_1/revisions/2",
    );
  });

  it("creates a checkpoint with current Edition and Working Draft versions", async () => {
    api.checkpointArtifactRevision.mockResolvedValue({
      revision: { ...revision, revision_number: 3 },
      reused: false,
    });
    render(
      <ArtifactRevisionHistoryPage
        projectId="project_1"
        projectVersionId="version_1"
        versionSlug="main"
        artifactType="guide"
        artifactId="guide_1"
        canWrite
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Create checkpoint" }),
    );
    await waitFor(() =>
      expect(api.checkpointArtifactRevision).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            expected_edition_version: 3,
            expected_working_draft_version: 4,
          },
        }),
      ),
    );
  });
});
