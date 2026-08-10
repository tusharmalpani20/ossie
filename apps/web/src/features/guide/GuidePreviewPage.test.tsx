import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GuideDetail } from "@repo/types/guide";
import { GuidePreviewPage } from "./GuidePreviewPage";

const now = "2026-07-19T10:00:00.000Z";
const detail: GuideDetail = {
  artifact: { id: "guide_1", organization_id: "org_1", project_id: "project_1", created_by_id: "user_1", created_at: now },
  edition: { id: "edition_1", organization_id: "org_1", project_id: "project_1", guide_id: "guide_1", project_version_id: "version_2", source_capture_session_id: null, title: "Relational preview", description: null, status: "draft", created_by_id: "user_1", updated_by_id: "user_1", version: 2, created_at: now, updated_at: now },
  working_draft: { id: "draft_1", organization_id: "org_1", project_id: "project_1", guide_edition_id: "edition_1", created_by_id: "user_1", updated_by_id: "user_1", version: 5, created_at: now, updated_at: now },
  authored_updated_at: now,
  guide_blocks: [{ id: "block_1", organization_id: "org_1", project_id: "project_1", guide_working_draft_id: "draft_1", block_type: "paragraph", title: null, body: "Relational body", block_index: 1, created_by_id: "user_1", updated_by_id: "user_1", version: 1, created_at: now, updated_at: now, step: null }],
  source_capture_assets: [],
};

describe("GuidePreviewPage", () => {
  it("renders relational block columns for the selected Edition", async () => {
    const loadDetail = vi.fn().mockResolvedValue(detail);
    render(<GuidePreviewPage projectId="project_1" projectVersionId="version_2" guideId="guide_1" loadDetail={loadDetail} />);
    expect(await screen.findByRole("heading", { name: "Relational preview" })).toBeInTheDocument();
    expect(screen.getByText("Relational body")).toBeInTheDocument();
    expect(loadDetail).toHaveBeenCalledWith("project_1", "guide_1");
  });

  it("keeps a failed preview actionable without losing the route context", async () => {
    const loadDetail = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(detail);
    render(
      <GuidePreviewPage
        projectId="project_1"
        projectVersionId="version_2"
        guideId="guide_1"
        loadDetail={loadDetail}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Guide preview unavailable" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Relational preview" })).toBeInTheDocument();
  });
});
