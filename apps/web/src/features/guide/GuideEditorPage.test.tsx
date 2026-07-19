import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GuideDetail } from "@repo/types/guide";
import { GuideEditorPage } from "./GuideEditorPage";

const now = "2026-07-19T10:00:00.000Z";
const detail: GuideDetail = {
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
    project_version_id: "version_1",
    source_capture_session_id: null,
    title: "Relational guide",
    description: "Edition metadata",
    status: "draft",
    created_by_id: "user_1",
    updated_by_id: "user_1",
    version: 4,
    created_at: now,
    updated_at: now,
  },
  working_draft: {
    id: "draft_1",
    organization_id: "org_1",
    project_id: "project_1",
    guide_edition_id: "edition_1",
    created_by_id: "user_1",
    updated_by_id: "user_1",
    version: 7,
    created_at: now,
    updated_at: now,
  },
  authored_updated_at: now,
  guide_blocks: [],
  source_capture_assets: [],
};

describe("GuideEditorPage", () => {
  it("loads the Edition selected by the Project Version route", async () => {
    const loadDetail = vi.fn().mockResolvedValue(detail);
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={loadDetail}
        loadPublishStatus={async () => ({
          publish_link: null,
          published_artifact: null,
        })}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Relational guide" }),
    ).toBeInTheDocument();
    expect(loadDetail).toHaveBeenCalledWith("project_1", "guide_1");
  });

  it("sends the current Edition Row Version when saving metadata", async () => {
    const saveGuide = vi
      .fn()
      .mockResolvedValue({
        edition: { ...detail.edition, title: "Changed", version: 5 },
      });
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => detail}
        loadPublishStatus={async () => ({
          publish_link: null,
          published_artifact: null,
        })}
        saveGuide={saveGuide}
      />,
    );
    await screen.findByRole("heading", { name: "Relational guide" });
    screen.getByRole("button", { name: "Save guide" }).click();
    expect(saveGuide).toHaveBeenCalledWith(
      "project_1",
      "guide_1",
      expect.objectContaining({ expected_edition_version: 4 }),
    );
  });

  it("allows publishing from a named Project Version", async () => {
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        isDefaultVersion={false}
        loadDetail={async () => detail}
        loadPublishStatus={async () => ({
          publish_link: null,
          published_artifact: null,
        })}
      />,
    );
    expect(
      await screen.findByRole("button", { name: "Publish this draft" }),
    ).toBeEnabled();
  });

  it("archives with the current Edition Row Version", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const changeEditionStatus = vi
      .fn()
      .mockResolvedValue({
        edition: { ...detail.edition, status: "archived", version: 5 },
      });
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => detail}
        loadPublishStatus={async () => ({
          publish_link: null,
          published_artifact: null,
        })}
        changeEditionStatus={changeEditionStatus}
      />,
    );
    (await screen.findByRole("button", { name: "Archive guide" })).click();
    expect(changeEditionStatus).toHaveBeenCalledWith(
      "archive",
      "project_1",
      "guide_1",
      "version_1",
      4,
    );
    expect(
      await screen.findByRole("button", { name: "Restore guide" }),
    ).toBeInTheDocument();
  });
});
