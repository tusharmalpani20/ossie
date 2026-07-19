import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { GuidePreviewPage } from "./GuidePreviewPage";
import type { GuideDetail, GuideMarkdownExport } from "./types";

const guideDetail: GuideDetail = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: "Set up departments from the list view.",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:00:00.000Z",
  },
  guide_blocks: [
    {
      id: "block_2",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_2",
      source_capture_asset_id: "asset_missing",
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: "asset_missing",
      block_type: "step",
      content: null,
      block_index: 2,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:02:00.000Z",
      updated_at: "2026-06-05T10:02:00.000Z",
      step: {
        id: "step_2",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_2",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_2",
        source_capture_asset_id: "asset_missing",
        title: "Click Add Department",
        body: "Use the primary action in the list view.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:02:00.000Z",
        updated_at: "2026-06-05T10:02:00.000Z",
      },
    },
    {
      id: "block_1",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: "asset_1",
      block_type: "step",
      content: null,
      block_index: 1,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:01:00.000Z",
      updated_at: "2026-06-05T10:01:00.000Z",
      step: {
        id: "step_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        title: "Navigate to Department List",
        body: "Open the Department module.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:01:00.000Z",
        updated_at: "2026-06-05T10:01:00.000Z",
      },
    },
    {
      id: "block_3",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "header",
      content: {
        title: "Department fields",
      },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:03:00.000Z",
      updated_at: "2026-06-05T10:03:00.000Z",
      step: null,
    },
    {
      id: "block_4",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_4",
      source_capture_asset_id: "asset_1",
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: "asset_1",
      block_type: "step",
      content: null,
      block_index: 4,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:04:00.000Z",
      updated_at: "2026-06-05T10:04:00.000Z",
      step: {
        id: "step_4",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_4",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_4",
        source_capture_asset_id: "asset_1",
        title: "Confirm Department List",
        body: "Review the updated list.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:04:00.000Z",
        updated_at: "2026-06-05T10:04:00.000Z",
      },
    },
    {
      id: "block_5",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "paragraph",
      content: {
        body: "Choose the right department settings before saving.",
      },
      block_index: 5,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:05:00.000Z",
      updated_at: "2026-06-05T10:05:00.000Z",
      step: null,
    },
    {
      id: "block_6",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "divider",
      content: null,
      block_index: 6,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T10:06:00.000Z",
      updated_at: "2026-06-05T10:06:00.000Z",
      step: null,
    },
  ],
  source_capture_assets: [{
    id: "asset_1",
    capture_session_id: "capture_session_1",
    asset_type: "screenshot",
    width: 1440,
    height: 900,
    device_pixel_ratio: 1,
    page_url: "https://example.test/departments",
    page_title: "Department List",
    captured_at: "2026-06-05T10:01:00.000Z",
    file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
    file: {
      id: "file_1",
      original_name: "departments.png",
      mime_type: "image/png",
      size_bytes: 123456,
    },
  }],
};

const renderPage = (overrides: {
  detail?: GuideDetail;
  loadDetail?: () => Promise<GuideDetail>;
  exportMarkdown?: (projectId: string, guideId: string) => Promise<GuideMarkdownExport>;
  copyText?: (text: string) => Promise<void>;
  downloadTextFile?: (filename: string, contents: string, mimeType: string) => Promise<void>;
  currentPath?: string;
  canWrite?: boolean;
} = {}) => {
  const loadDetail = overrides.loadDetail ?? vi.fn(async () => overrides.detail ?? guideDetail);
  const exportMarkdown = overrides.exportMarkdown ?? vi.fn(async () => ({
    filename: "department-guide.md",
    markdown: "# Department guide\n",
  }));
  const copyText = overrides.copyText ?? vi.fn(async () => undefined);
  const downloadTextFile = overrides.downloadTextFile ?? vi.fn(async () => undefined);

  render(
    <GuidePreviewPage
      projectId="project_1"
      guideId="guide_1"
      currentPath={overrides.currentPath}
      loadDetail={loadDetail}
      exportMarkdown={exportMarkdown}
      copyText={copyText}
      downloadTextFile={downloadTextFile}
      canWrite={overrides.canWrite}
    />
  );

  return { loadDetail, exportMarkdown, copyText, downloadTextFile };
};

describe("GuidePreviewPage", () => {
  it("keeps previews readable without exposing the editor link", async () => {
    renderPage({ canWrite: false });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("Read only")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit guide" })).not.toBeInTheDocument();
  });

  it("renders ordered guide steps and screenshots", async () => {
    const { loadDetail } = renderPage();

    expect(screen.getByText("Loading guide preview...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("Set up departments from the list view.")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit guide" })).toHaveAttribute("href", "/projects/project_1/guides/guide_1");
    expect(screen.getByRole("link", { name: "Back to guides" })).toHaveAttribute("href", "/projects/project_1/guides");
    expect(screen.getAllByText(/^[123]$/).map((node) => node.textContent)).toEqual(["1", "2", "3"]);
    expect(screen.getByRole("heading", { name: "Navigate to Department List" })).toBeInTheDocument();
    expect(screen.getByText("Open the Department module.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Click Add Department" })).toBeInTheDocument();
    expect(screen.getByText("Choose the right department settings before saving.")).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Guide section divider" })).toBeInTheDocument();
    expect(screen.getByText("Use the primary action in the list view.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Department fields" })).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Department List" })[0]).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file"
    );
    expect(screen.getByRole("button", { name: "Open screenshot for step 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open screenshot for step 3" })).toBeInTheDocument();
    expect(screen.queryByText("asset_missing")).not.toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
    expect(loadDetail).toHaveBeenCalledWith("project_1", "guide_1");
  });

  it("opens and navigates screenshot viewer images from guide preview", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open screenshot for step 1" }));

    const firstDialog = screen.getByRole("dialog", { name: "Navigate to Department List" });
    expect(within(firstDialog).getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file"
    );
    expect(within(firstDialog).getByText("1 / 2")).toBeInTheDocument();

    fireEvent.click(within(firstDialog).getByRole("button", { name: "Next screenshot" }));
    const secondDialog = screen.getByRole("dialog", { name: "Confirm Department List" });
    expect(within(secondDialog).getByText("2 / 2")).toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();

    fireEvent.click(within(secondDialog).getByRole("button", { name: "Close screenshot viewer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Department guide" })).toBeInTheDocument();
  });

  it("renders screenshot highlights in the guide preview", async () => {
    renderPage({
      detail: {
        ...guideDetail,
        guide_blocks: guideDetail.guide_blocks.map((block) => (
          block.id === "block_1"
            ? {
              ...block,
              content: {
                annotations: [{
                  id: "ann_preview",
                  type: "highlight",
                  x: 0.2,
                  y: 0.15,
                  width: 0.25,
                  height: 0.1,
                }],
              },
            }
            : block
        )),
      },
    });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByTestId("guide-highlight-ann_preview")).toHaveStyle({
      left: "20%",
      top: "15%",
      width: "25%",
      height: "10%",
    });
  });

  it("copies and downloads guide markdown from preview", async () => {
    const exportMarkdown = vi.fn(async () => ({
      filename: "department-guide.md",
      markdown: "# Department guide\n",
    }));
    const copyText = vi.fn(async () => undefined);
    const downloadTextFile = vi.fn(async () => undefined);
    renderPage({ exportMarkdown, copyText, downloadTextFile });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy Markdown" }));

    await waitFor(() => {
      expect(exportMarkdown).toHaveBeenCalledWith("project_1", "guide_1");
    });
    expect(copyText).toHaveBeenCalledWith("# Department guide\n");
    expect(screen.getByText("Markdown copied.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Download Markdown" }));

    await waitFor(() => {
      expect(downloadTextFile).toHaveBeenCalledWith(
        "department-guide.md",
        "# Department guide\n",
        "text/markdown;charset=utf-8"
      );
    });
    expect(exportMarkdown).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Markdown downloaded.")).toBeInTheDocument();
  });

  it("shows markdown export failures in preview", async () => {
    renderPage({
      exportMarkdown: async () => {
        throw new Error("export failed");
      },
    });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy Markdown" }));

    expect(await screen.findByText("Could not export Markdown.")).toBeInTheDocument();
  });

  it("renders empty guides", async () => {
    renderPage({
      detail: {
        ...guideDetail,
        guide_blocks: [],
        source_capture_assets: [],
      },
    });

    expect(await screen.findByText("This guide does not have any blocks yet.")).toBeInTheDocument();
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <GuidePreviewPage
        projectId="project_1"
        guideId="guide_1"
        currentPath="/projects/project_1/guides/guide_1/preview"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "unauthenticated",
            message: "Authentication is required",
          });
        }}
      />
    );

    expect(await screen.findByText("Sign in to preview this guide.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fguides%2Fguide_1%2Fpreview"
    );

    rerender(
      <GuidePreviewPage
        projectId="project_1"
        guideId="missing"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            type: "guide_not_found",
            message: "Guide was not found",
          });
        }}
      />
    );

    expect(await screen.findByText("Guide was not found.")).toBeInTheDocument();
  });
});
