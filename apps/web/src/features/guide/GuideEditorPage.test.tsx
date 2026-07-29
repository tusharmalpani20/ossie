import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GuideDetail } from "@repo/types/guide";
import { GuideEditorPage } from "./GuideEditorPage";
import { ApiClientError } from "../../lib/api";

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
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Relational guide" }),
    ).toBeInTheDocument();
    expect(loadDetail).toHaveBeenCalledWith("project_1", "guide_1");
  });

  it("lets the shared publishing panel own the only publication requests", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return new Response(
        JSON.stringify(
          url.includes("/publications")
            ? { publications: [], next_before_publication_sequence: null }
            : { publish_links: [], next_cursor: null },
        ),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetch);

    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => detail}
      />,
    );

    await screen.findByRole("heading", { name: "Relational guide" });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("sends the current Edition Row Version when saving metadata", async () => {
    const saveGuide = vi.fn().mockResolvedValue({
      edition: { ...detail.edition, title: "Changed", version: 5 },
    });
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => detail}
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
        loadDetail={async () => detail}
      />,
    );
    expect(
      await screen.findByRole("button", { name: "Publish this draft" }),
    ).toBeEnabled();
  });

  it("archives with the current Edition Row Version", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const changeEditionStatus = vi.fn().mockResolvedValue({
      edition: { ...detail.edition, status: "archived", version: 5 },
    });
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => detail}
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

  it("warns only while metadata changes are unsaved", async () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => detail}
      />,
    );

    const title = await screen.findByLabelText("Guide title");
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    fireEvent.change(title, { target: { value: "Local title" } });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(addEventListener).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );

    fireEvent.change(title, { target: { value: detail.edition.title } });
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    expect(removeEventListener).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );
  });

  it("preserves local metadata and offers reload after a Row Version conflict", async () => {
    const saveGuide = vi.fn().mockRejectedValue(
      new ApiClientError({
        kind: "unknown",
        status: 409,
        type: "edition_conflict",
        message: "Guide Edition changed; reload and retry",
      }),
    );
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => detail}
        saveGuide={saveGuide}
      />,
    );

    const title = await screen.findByLabelText("Guide title");
    fireEvent.change(title, { target: { value: "Keep my local title" } });
    fireEvent.click(screen.getByRole("button", { name: "Save guide" }));

    expect(
      await screen.findByText(
        "This Guide Edition changed elsewhere. Your local changes are still here.",
      ),
    ).toBeInTheDocument();
    expect(title).toHaveValue("Keep my local title");
    expect(
      screen.getByRole("button", { name: "Reload latest" }),
    ).toBeInTheDocument();
    expect(saveGuide).toHaveBeenCalledOnce();
  });

  it("creates the first structural block from an empty Guide", async () => {
    const createBlock = vi.fn().mockResolvedValue({
      working_draft: { ...detail.working_draft, version: 8 },
      guide_blocks: [
        {
          id: "block_1",
          guide_working_draft_id: "draft_1",
          block_type: "paragraph",
          block_index: 1,
          title: null,
          body: "Add content",
          created_by_id: "user_1",
          updated_by_id: "user_1",
          created_at: now,
          updated_at: now,
          step: null,
        },
      ],
    });
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => detail}
        createBlock={createBlock}
      />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Add paragraph" }),
    );
    expect(createBlock).toHaveBeenCalledWith(
      "project_1",
      "guide_1",
      expect.objectContaining({
        block_type: "paragraph",
        expected_working_draft_version: 7,
      }),
    );
    expect(
      await screen.findByLabelText("Paragraph body 1"),
    ).toBeInTheDocument();
  });

  it("uses the outline to edit one selected block without rendering every form", async () => {
    const twoBlockDetail: GuideDetail = {
      ...detail,
      guide_blocks: [
        {
          id: "block_1",
          organization_id: "org_1",
          project_id: "project_1",
          guide_working_draft_id: "draft_1",
          block_type: "paragraph",
          block_index: 1,
          title: null,
          body: "First paragraph",
          created_by_id: "user_1",
          updated_by_id: "user_1",
          version: 1,
          created_at: now,
          updated_at: now,
          step: null,
        },
        {
          id: "block_2",
          organization_id: "org_1",
          project_id: "project_1",
          guide_working_draft_id: "draft_1",
          block_type: "paragraph",
          block_index: 2,
          title: null,
          body: "Second paragraph",
          created_by_id: "user_1",
          updated_by_id: "user_1",
          version: 1,
          created_at: now,
          updated_at: now,
          step: null,
        },
      ],
    };

    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => twoBlockDetail}
      />,
    );

    expect(
      await screen.findByLabelText("Paragraph body 1"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Paragraph body 2")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit Paragraph 2" }));

    expect(screen.getByLabelText("Paragraph body 2")).toHaveValue(
      "Second paragraph",
    );
    expect(screen.queryByLabelText("Paragraph body 1")).not.toBeInTheDocument();
  });

  it("does not overlap metadata and structural Working Draft commands", async () => {
    let finishSave: ((value: unknown) => void) | undefined;
    const saveGuide = vi.fn(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
    const createBlock = vi.fn();
    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => detail}
        saveGuide={saveGuide as never}
        createBlock={createBlock}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Save guide" }));
    const addParagraph = screen.getByRole("button", {
      name: "Add paragraph",
    });
    expect(addParagraph).toBeDisabled();
    fireEvent.click(addParagraph);
    expect(createBlock).not.toHaveBeenCalled();

    finishSave?.({
      edition: { ...detail.edition, version: 5 },
    });
  });

  it("preserves an unrelated dirty block draft after inserting a block", async () => {
    const paragraph = {
      id: "block_1",
      organization_id: "org_1",
      project_id: "project_1",
      guide_working_draft_id: "draft_1",
      block_type: "paragraph" as const,
      block_index: 1,
      title: null,
      body: "Server paragraph",
      created_by_id: "user_1",
      updated_by_id: "user_1",
      version: 1,
      created_at: now,
      updated_at: now,
      step: null,
    };
    const inserted = {
      ...paragraph,
      id: "block_2",
      block_type: "header" as const,
      block_index: 2,
      title: "New section",
      body: null,
    };
    const createBlock = vi.fn().mockResolvedValue({
      working_draft: { ...detail.working_draft, version: 8 },
      guide_blocks: [paragraph, inserted],
    });

    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => ({ ...detail, guide_blocks: [paragraph] })}
        createBlock={createBlock}
      />,
    );

    const body = await screen.findByLabelText("Paragraph body 1");
    fireEvent.change(body, { target: { value: "Keep this local draft" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Add header after block 1" }),
    );

    await screen.findByRole("button", { name: "Edit Header 2" });
    expect(screen.getByLabelText("Paragraph body 1")).toHaveValue(
      "Keep this local draft",
    );
  });

  it("disables highlight editing when the selected screenshot cannot load", async () => {
    const screenshotDetail = {
      ...detail,
      guide_blocks: [
        {
          id: "block_1",
          organization_id: "org_1",
          project_id: "project_1",
          guide_working_draft_id: "draft_1",
          block_type: "step",
          block_index: 1,
          title: null,
          body: null,
          created_by_id: "user_1",
          updated_by_id: "user_1",
          version: 1,
          created_at: now,
          updated_at: now,
          step: {
            id: "step_1",
            organization_id: "org_1",
            project_id: "project_1",
            guide_working_draft_id: "draft_1",
            guide_block_id: "block_1",
            source_capture_event_id: null,
            source_capture_asset_id: null,
            selected_capture_asset_id: "asset_1",
            display_capture_asset_id: "asset_1",
            title: "Broken media",
            body: null,
            screenshot_hidden: false,
            annotations: [],
            created_by_id: "user_1",
            updated_by_id: "user_1",
            version: 1,
            created_at: now,
            updated_at: now,
          },
        },
      ],
      source_capture_assets: [
        {
          id: "asset_1",
          page_title: "Missing screenshot",
          file_url: "/api/v1/missing.png",
          file: { original_name: "missing.png" },
        },
      ],
    } as unknown as GuideDetail;

    render(
      <GuideEditorPage
        projectId="project_1"
        projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => screenshotDetail}
      />,
    );

    fireEvent.error(
      await screen.findByRole("img", { name: "Missing screenshot" }),
    );

    expect(
      screen.getByText(
        "This screenshot could not be loaded. Highlight editing is unavailable.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Highlights for step 1" }),
    ).not.toBeInTheDocument();
  });
});
