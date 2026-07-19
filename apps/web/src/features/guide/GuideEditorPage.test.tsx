import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { CaptureAssetWithFileUrl } from "@repo/types/capture";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { GuideEditorPage } from "./GuideEditorPage";
import type { GuideEditorPageProps } from "./GuideEditorPage";
import type {
  GuideDetail,
  GuidePublishResult,
  GuidePublishStatusResponse,
  GuideRevokePublishResult,
  GuideSourceCaptureAsset,
  UpdateGuideBlockAnnotationsInput,
} from "./types";

type GuideMarkdownExport = {
  filename: string;
  markdown: string;
};

type GuideHtmlZipExport = {
  filename: string;
  blob: Blob;
};

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
      source_capture_asset_id: "asset_2",
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: "asset_2",
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
        source_capture_asset_id: "asset_2",
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
  ],
  source_capture_assets: [
    {
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
    },
    {
      id: "asset_2",
      capture_session_id: "capture_session_1",
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 1,
      page_url: "https://example.test/departments/new",
      page_title: "New Department",
      captured_at: "2026-06-05T10:02:00.000Z",
      file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_2/file",
      file: {
        id: "file_2",
        original_name: "new-department.png",
        mime_type: "image/png",
        size_bytes: 234567,
      },
    },
    {
      id: "asset_3",
      capture_session_id: "capture_session_1",
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 1,
      page_url: "https://example.test/departments/review",
      page_title: "Review Department",
      captured_at: "2026-06-05T10:03:00.000Z",
      file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_3/file",
      file: {
        id: "file_3",
        original_name: "review-department.png",
        mime_type: "image/png",
        size_bytes: 345678,
      },
    },
  ],
};

const toProjectCaptureAsset = (asset: GuideSourceCaptureAsset): CaptureAssetWithFileUrl => ({
  ...asset,
  organization_id: guideDetail.guide.organization_id,
  project_id: guideDetail.guide.project_id,
  created_by_id: guideDetail.guide.created_by_id,
  updated_by_id: guideDetail.guide.updated_by_id,
  version: 1,
  created_at: asset.captured_at,
  updated_at: asset.captured_at,
  file: {
    ...asset.file,
    storage_provider: "local",
    checksum_sha256: null,
  },
});

const unpublishedStatus: GuidePublishStatusResponse = {
  publish_link: null,
  published_artifact: null,
};

const publishedStatus = (versionNumber = 1): GuidePublishStatusResponse => ({
  publish_link: {
    id: "publish_link_1",
    artifact_type: "guide",
    artifact_id: "guide_1",
    published_artifact_id: `published_artifact_${versionNumber}`,
    slug: "abc123",
    visibility: "public",
    expires_at: null,
    status: "active",
    published_at: "2026-06-11T00:00:00.000Z",
    revoked_at: null,
    public_url: "/p/abc123",
    password_protected: false,
  },
  published_artifact: {
    id: `published_artifact_${versionNumber}`,
    artifact_type: "guide",
    artifact_id: "guide_1",
    version_number: versionNumber,
    title: "Department guide",
    published_at: "2026-06-11T00:00:00.000Z",
  },
});

const publishResult = (versionNumber = 1): GuidePublishResult => {
  const status = publishedStatus(versionNumber);

  return {
    publish_link: status.publish_link!,
    published_artifact: status.published_artifact!,
  };
};

const revokedPublishResult = (): GuideRevokePublishResult => ({
  publish_link: {
    ...publishResult().publish_link,
    status: "revoked",
    revoked_at: "2026-06-11T01:00:00.000Z",
  },
});

const withGuideUpdatedAt = (updatedAt: string): GuideDetail => ({
  ...guideDetail,
  guide: {
    ...guideDetail.guide,
    updated_at: updatedAt,
  },
});

const renderPage = (overrides: {
  detail?: GuideDetail;
  loadDetail?: () => Promise<GuideDetail>;
  saveGuide?: GuideEditorPageProps["saveGuide"];
  saveStep?: GuideEditorPageProps["saveStep"];
  createBlock?: GuideEditorPageProps["createBlock"];
  saveBlock?: GuideEditorPageProps["saveBlock"];
  loadScreenshotAssets?: GuideEditorPageProps["loadScreenshotAssets"];
  saveBlockScreenshot?: GuideEditorPageProps["saveBlockScreenshot"];
  saveBlockAnnotations?: GuideEditorPageProps["saveBlockAnnotations"];
  uploadBlockScreenshot?: GuideEditorPageProps["uploadBlockScreenshot"];
  exportMarkdown?: GuideEditorPageProps["exportMarkdown"];
  exportHtmlZip?: GuideEditorPageProps["exportHtmlZip"];
  downloadTextFile?: GuideEditorPageProps["downloadTextFile"];
  downloadBlobFile?: GuideEditorPageProps["downloadBlobFile"];
  reorderBlocks?: GuideEditorPageProps["reorderBlocks"];
  removeBlock?: GuideEditorPageProps["removeBlock"];
  loadPublishStatus?: GuideEditorPageProps["loadPublishStatus"];
  publishCurrentGuide?: GuideEditorPageProps["publishCurrentGuide"];
  revokePublishLink?: GuideEditorPageProps["revokePublishLink"];
  updatePublishAccess?: GuideEditorPageProps["updatePublishAccess"];
  updatePublishPassword?: GuideEditorPageProps["updatePublishPassword"];
  copyText?: GuideEditorPageProps["copyText"];
} = {}) => {
  const loadDetail = overrides.loadDetail ?? vi.fn(async () => overrides.detail ?? guideDetail);
  const loadPublishStatus = overrides.loadPublishStatus ?? vi.fn(async () => unpublishedStatus);
  const saveGuide = overrides.saveGuide ?? vi.fn(async (_projectId, _guideId, data) => ({
    guide: {
      ...(overrides.detail ?? guideDetail).guide,
      ...data,
      description: data.description ?? null,
    },
  }));
  const saveStep = overrides.saveStep ?? vi.fn(async (_projectId, _guideId, stepId, data) => {
    const step = guideDetail.guide_blocks
      .map((block) => block.step)
      .find((candidate) => candidate?.id === stepId);

    if (!step) {
      throw new Error("missing step fixture");
    }

    return {
      guide_step: {
        ...step,
        ...data,
        body: data.body ?? null,
      },
    };
  });
  const createBlock = overrides.createBlock ?? vi.fn(async (_projectId, _guideId, data) => ({
    guide_blocks: [
      ...guideDetail.guide_blocks,
      {
        id: "block_tip",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: data.block_type,
        content: data.content ?? null,
        block_index: 3,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:03:00.000Z",
        updated_at: "2026-06-05T10:03:00.000Z",
        step: data.block_type === "step" ? {
          id: "step_new",
          organization_id: "organization_1",
          project_id: "project_1",
          guide_id: "guide_1",
          guide_block_id: "block_tip",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          title: data.step?.title ?? "New step",
          body: data.step?.body ?? null,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T10:03:00.000Z",
          updated_at: "2026-06-05T10:03:00.000Z",
        } : null,
      },
    ],
  }));
  const saveBlock = overrides.saveBlock ?? vi.fn(async (_projectId, _guideId, blockId, data) => ({
    guide_block: {
      id: blockId,
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "tip" as const,
      content: data.content ?? null,
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 2,
      created_at: "2026-06-05T10:03:00.000Z",
      updated_at: "2026-06-05T10:04:00.000Z",
      step: null,
    },
  }));
  const loadScreenshotAssets = overrides.loadScreenshotAssets ?? vi.fn(async () => ({
    capture_assets: guideDetail.source_capture_assets.map(toProjectCaptureAsset),
  }));
  const saveBlockScreenshot = overrides.saveBlockScreenshot ?? vi.fn(async (_projectId, _guideId, blockId, data) => {
    const block = guideDetail.guide_blocks.find((candidate) => candidate.id === blockId);

    if (!block) {
      throw new Error("missing block fixture");
    }

    return {
      guide_block: {
        ...block,
        selected_capture_asset_id: data.capture_asset_id,
        screenshot_hidden: data.capture_asset_id === null,
        display_capture_asset_id: data.capture_asset_id,
      },
    };
  });
  const saveBlockAnnotations = overrides.saveBlockAnnotations ?? vi.fn(async (_projectId, _guideId, blockId, data) => {
    const block = guideDetail.guide_blocks.find((candidate) => candidate.id === blockId);

    if (!block) {
      throw new Error("missing block fixture");
    }

    return {
      guide_block: {
        ...block,
        content: {
          ...(block.content ?? {}),
          annotations: data.annotations.map((
            annotation: UpdateGuideBlockAnnotationsInput["annotations"][number],
            index: number
          ) => ({
            id: annotation.id ?? `ann_saved_${index + 1}`,
            ...annotation,
          })),
        },
      },
    };
  });
  const uploadBlockScreenshot = overrides.uploadBlockScreenshot ?? vi.fn(async (_projectId, _guideId, blockId) => {
    const block = guideDetail.guide_blocks.find((candidate) => candidate.id === blockId);
    const capture_asset = toProjectCaptureAsset({
      id: "asset_uploaded",
      capture_session_id: "capture_session_1",
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 1,
      page_url: "https://example.test/uploaded",
      page_title: "Uploaded replacement",
      captured_at: "2026-06-05T10:04:00.000Z",
      file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_uploaded/file",
      file: {
        id: "file_uploaded",
        original_name: "replacement.png",
        mime_type: "image/png",
        size_bytes: 456789,
      },
    });

    if (!block) {
      throw new Error("missing block fixture");
    }

    return {
      guide_block: {
        ...block,
        selected_capture_asset_id: capture_asset.id,
        screenshot_hidden: false,
        display_capture_asset_id: capture_asset.id,
      },
      capture_asset,
    };
  });
  const reorderBlocks = overrides.reorderBlocks ?? vi.fn(async (
    _projectId: string,
    _guideId: string,
    blockIds: string[]
  ) => ({
    guide_blocks: blockIds.map((blockId, index) => {
      const block = guideDetail.guide_blocks.find((candidate) => candidate.id === blockId);

      if (!block) {
        throw new Error("missing block fixture");
      }

      return {
        ...block,
        block_index: index + 1,
      };
    }),
  }));
  const removeBlock = overrides.removeBlock ?? vi.fn(async () => undefined);
  const exportMarkdown = overrides.exportMarkdown ?? vi.fn(async (): Promise<GuideMarkdownExport> => ({
    filename: "department-guide.md",
    markdown: "# Department guide\n",
  }));
  const exportHtmlZip = overrides.exportHtmlZip ?? vi.fn(async (): Promise<GuideHtmlZipExport> => ({
    filename: "department-guide-html-export.zip",
    blob: new Blob(["zip-bytes"], { type: "application/zip" }),
  }));
  const downloadTextFile = overrides.downloadTextFile ?? vi.fn(async () => undefined);
  const downloadBlobFile = overrides.downloadBlobFile ?? vi.fn(async () => undefined);
  const publishCurrentGuide = overrides.publishCurrentGuide ?? vi.fn(async () => publishResult());
  const revokePublishLink = overrides.revokePublishLink ?? vi.fn(async () => revokedPublishResult());
  const updatePublishAccess = overrides.updatePublishAccess ?? vi.fn(async (_projectId, _guideId, input) => ({
    ...publishedStatus(),
    publish_link: {
      ...publishedStatus().publish_link!,
      visibility: input.visibility,
      expires_at: input.expires_at,
    },
  }));
  const updatePublishPassword = overrides.updatePublishPassword ?? vi.fn(async (_projectId, _guideId, input) => ({
    ...publishedStatus(),
    publish_link: {
      ...publishedStatus().publish_link!,
      password_protected: input.password !== null,
    },
  }));
  const copyText = overrides.copyText ?? vi.fn(async () => undefined);

  render(
    <GuideEditorPage
      projectId="project_1"
      projectVersionId="version_1"
      guideId="guide_1"
      loadDetail={loadDetail}
      loadPublishStatus={loadPublishStatus}
      saveGuide={saveGuide}
      saveStep={saveStep}
      createBlock={createBlock}
      saveBlock={saveBlock}
      loadScreenshotAssets={loadScreenshotAssets}
      saveBlockScreenshot={saveBlockScreenshot}
      saveBlockAnnotations={saveBlockAnnotations}
      uploadBlockScreenshot={uploadBlockScreenshot}
      exportMarkdown={exportMarkdown}
      exportHtmlZip={exportHtmlZip}
      downloadTextFile={downloadTextFile}
      downloadBlobFile={downloadBlobFile}
      reorderBlocks={reorderBlocks}
      removeBlock={removeBlock}
      publishCurrentGuide={publishCurrentGuide}
      revokePublishLink={revokePublishLink}
      updatePublishAccess={updatePublishAccess}
      updatePublishPassword={updatePublishPassword}
      copyText={copyText}
    />
  );

  return {
    loadDetail,
    loadPublishStatus,
    saveGuide,
    saveStep,
    createBlock,
    saveBlock,
    loadScreenshotAssets,
    saveBlockScreenshot,
    saveBlockAnnotations,
    uploadBlockScreenshot,
    exportMarkdown,
    exportHtmlZip,
    downloadTextFile,
    downloadBlobFile,
    reorderBlocks,
    removeBlock,
    publishCurrentGuide,
    revokePublishLink,
    updatePublishAccess,
    updatePublishPassword,
    copyText,
  };
};

describe("GuideEditorPage", () => {
  it("renders guide metadata and editable blocks in block order", async () => {
    const { loadDetail, loadPublishStatus } = renderPage();

    expect(screen.getByText("Loading guide...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByLabelText("Guide title")).toHaveValue("Department guide");
    expect(screen.getByLabelText("Guide description")).toHaveValue("Set up departments from the list view.");
    expect(screen.getByRole("link", { name: "Preview guide" })).toHaveAttribute(
      "href",
      "/projects/project_1/guides/guide_1/preview"
    );
    expect(screen.getAllByRole("textbox", { name: /Step title/ }).map((input) => input.getAttribute("value"))).toEqual([
      "Navigate to Department List",
      "Click Add Department",
    ]);
    expect(screen.getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file"
    );
    expect(screen.getByRole("img", { name: "New Department" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_2/file"
    );
    expect(screen.getByRole("button", { name: "Open screenshot for step 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open screenshot for step 2" })).toBeInTheDocument();
    expect(screen.queryByText("Screenshot source: asset_1")).not.toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
    expect(loadDetail).toHaveBeenCalledWith("project_1", "guide_1");
    expect(loadPublishStatus).toHaveBeenCalledWith("project_1", "guide_1");
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
  });

  it("copies and downloads guide markdown from the editor", async () => {
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

  it("downloads guide HTML ZIP from the editor", async () => {
    const blob = new Blob(["zip-bytes"], { type: "application/zip" });
    const exportHtmlZip = vi.fn(async () => ({
      filename: "department-guide-html-export.zip",
      blob,
    }));
    const downloadBlobFile = vi.fn(async () => undefined);
    renderPage({ exportHtmlZip, downloadBlobFile });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Export HTML" }));

    await waitFor(() => {
      expect(exportHtmlZip).toHaveBeenCalledWith("project_1", "guide_1");
    });
    expect(downloadBlobFile).toHaveBeenCalledWith("department-guide-html-export.zip", blob);
    expect(screen.getByText("HTML export downloaded.")).toBeInTheDocument();
  });

  it("shows editor markdown export failures without marking the draft stale", async () => {
    const exportMarkdown = vi.fn(async () => {
      throw new Error("export failed");
    });
    renderPage({ exportMarkdown, loadPublishStatus: async () => publishedStatus() });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy Markdown" }));

    expect(await screen.findByText("Could not export Markdown.")).toBeInTheDocument();
    expect(screen.queryByText("Draft has changes not yet published.")).not.toBeInTheDocument();
  });

  it("loads unpublished publish status and publishes a guide", async () => {
    const { publishCurrentGuide } = renderPage();

    expect(await screen.findByRole("heading", { name: "Publishing" })).toBeInTheDocument();
    expect(screen.getByText("This guide is not published.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publish guide" }));

    await waitFor(() => expect(publishCurrentGuide).toHaveBeenCalledWith("project_1", "guide_1"));
    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    expect(screen.getByText("/p/abc123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open public guide" })).toHaveAttribute("href", "/p/abc123");
    expect(screen.getByText("Guide published.")).toBeInTheDocument();
  });

  it("copies, republishes, and revokes an active public guide link", async () => {
    const copyText = vi.fn(async () => undefined);
    const publishCurrentGuide = vi.fn()
      .mockResolvedValueOnce(publishedStatus(2));
    const { revokePublishLink } = renderPage({
      loadPublishStatus: async () => publishedStatus(1),
      publishCurrentGuide,
      copyText,
    });

    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("http://localhost:3000/p/abc123"));
    expect(screen.getByText("Public link copied.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Republish" }));
    await waitFor(() => expect(publishCurrentGuide).toHaveBeenCalledWith("project_1", "guide_1"));
    expect(await screen.findByText("Published version 2 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    expect(screen.getByText("/p/abc123")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Revoke link" }));
    await waitFor(() => expect(revokePublishLink).toHaveBeenCalledWith("project_1", "guide_1"));
    expect(await screen.findByText("This guide is not published.")).toBeInTheDocument();
    expect(screen.getByText("Public link revoked.")).toBeInTheDocument();
  });

  it("renders clearer live and stale published states", async () => {
    renderPage({
      detail: withGuideUpdatedAt("2026-06-12T00:00:00.000Z"),
      loadPublishStatus: async () => publishedStatus(2),
    });

    expect(await screen.findByText("Public guide is live")).toBeInTheDocument();
    expect(screen.getByText("Published version 2 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    expect(screen.getByText("Draft has changes not yet published.")).toBeInTheDocument();
  });

  it("does not show stale published state when the draft timestamp is current", async () => {
    renderPage({
      detail: withGuideUpdatedAt("2026-06-11T00:00:00.000Z"),
      loadPublishStatus: async () => publishedStatus(2),
    });

    expect(await screen.findByText("Public guide is live")).toBeInTheDocument();
    expect(screen.queryByText("Draft has changes not yet published.")).not.toBeInTheDocument();
  });

  it("marks a published guide stale after editor mutations and clears it after republish", async () => {
    const saveGuide = vi.fn(async (_projectId, _guideId, data) => ({
      guide: {
        ...guideDetail.guide,
        ...data,
        description: data.description ?? null,
      },
    }));
    const publishCurrentGuide = vi.fn(async () => publishResult(2));

    renderPage({
      loadPublishStatus: async () => publishedStatus(1),
      saveGuide,
      publishCurrentGuide,
    });

    expect(await screen.findByText("Public guide is live")).toBeInTheDocument();
    expect(screen.queryByText("Draft has changes not yet published.")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Guide title"), {
      target: { value: "Updated department guide" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save guide" }));

    expect(await screen.findByText("Draft has changes not yet published.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Republish" }));

    await waitFor(() => expect(publishCurrentGuide).toHaveBeenCalledWith("project_1", "guide_1"));
    await waitFor(() => expect(screen.queryByText("Draft has changes not yet published.")).not.toBeInTheDocument());
  });

  it("adds and edits non-step guide blocks from the editor", async () => {
    const createBlock = vi.fn(async () => ({
      guide_blocks: [
        {
          ...guideDetail.guide_blocks[1]!,
          block_index: 1,
        },
        {
          id: "block_tip",
          organization_id: "organization_1",
          project_id: "project_1",
          guide_id: "guide_1",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          selected_capture_asset_id: null,
          screenshot_hidden: false,
          display_capture_asset_id: null,
          block_type: "tip" as const,
          content: {
            title: null,
            body: "Add a helpful tip.",
          },
          block_index: 2,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T10:03:00.000Z",
          updated_at: "2026-06-05T10:03:00.000Z",
          step: null,
        },
        {
          ...guideDetail.guide_blocks[0]!,
          block_index: 3,
        },
      ],
    }));
    const saveBlock = vi.fn(async (_projectId, _guideId, blockId, data) => ({
      guide_block: {
        id: blockId,
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "tip" as const,
        content: data.content ?? null,
        block_index: 2,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 2,
        created_at: "2026-06-05T10:03:00.000Z",
        updated_at: "2026-06-05T10:04:00.000Z",
        step: null,
      },
    }));

    renderPage({ createBlock, saveBlock });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add tip after block 1" }));

    await waitFor(() => expect(createBlock).toHaveBeenCalledWith("project_1", "guide_1", {
      block_type: "tip",
      position: {
        placement: "after",
        guide_block_id: "block_1",
      },
      content: {
        body: "Add a helpful tip.",
      },
    }));
    expect(await screen.findByText("Block added.")).toBeInTheDocument();
    expect(screen.getByLabelText("Tip body 2")).toHaveValue("Add a helpful tip.");

    fireEvent.change(screen.getByLabelText("Tip title 2"), {
      target: { value: "Before you continue" },
    });
    fireEvent.change(screen.getByLabelText("Tip body 2"), {
      target: { value: "Confirm the department name." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save tip 2" }));

    await waitFor(() => expect(saveBlock).toHaveBeenCalledWith("project_1", "guide_1", "block_tip", {
      content: {
        title: "Before you continue",
        body: "Confirm the department name.",
      },
    }));
    expect(screen.getByText("Block saved.")).toBeInTheDocument();
  });

  it("adds alert blocks from the visible structural block controls", async () => {
    const createBlock = vi.fn(async (_projectId, _guideId, data) => ({
      guide_blocks: [
        {
          ...guideDetail.guide_blocks[1]!,
          block_index: 1,
        },
        {
          id: "block_alert",
          organization_id: "organization_1",
          project_id: "project_1",
          guide_id: "guide_1",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          selected_capture_asset_id: null,
          screenshot_hidden: false,
          display_capture_asset_id: null,
          block_type: "alert" as const,
          content: data.content ?? null,
          block_index: 2,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T10:03:00.000Z",
          updated_at: "2026-06-05T10:03:00.000Z",
          step: null,
        },
        {
          ...guideDetail.guide_blocks[0]!,
          block_index: 3,
        },
      ],
    }));

    renderPage({ createBlock });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add alert after block 1" }));

    await waitFor(() => expect(createBlock).toHaveBeenCalledWith("project_1", "guide_1", {
      block_type: "alert",
      position: {
        placement: "after",
        guide_block_id: "block_1",
      },
      content: {
        body: "Add an important note.",
      },
    }));
    expect(await screen.findByLabelText("Alert body 2")).toHaveValue("Add an important note.");
  });

  it("adds step blocks from the visible add-block controls", async () => {
    const createBlock = vi.fn(async (_projectId, _guideId, data) => ({
      guide_blocks: [
        {
          ...guideDetail.guide_blocks[1]!,
          block_index: 1,
        },
        {
          id: "block_step_new",
          organization_id: "organization_1",
          project_id: "project_1",
          guide_id: "guide_1",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          selected_capture_asset_id: null,
          screenshot_hidden: false,
          display_capture_asset_id: null,
          block_type: "step" as const,
          content: null,
          block_index: 2,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T10:03:00.000Z",
          updated_at: "2026-06-05T10:03:00.000Z",
          step: {
            id: "step_new",
            organization_id: "organization_1",
            project_id: "project_1",
            guide_id: "guide_1",
            guide_block_id: "block_step_new",
            source_capture_session_id: null,
            source_capture_event_id: null,
            source_capture_asset_id: null,
            title: data.step?.title ?? "",
            body: data.step?.body ?? null,
            created_by_id: "org_user_1",
            updated_by_id: "org_user_1",
            version: 1,
            created_at: "2026-06-05T10:03:00.000Z",
            updated_at: "2026-06-05T10:03:00.000Z",
          },
        },
        {
          ...guideDetail.guide_blocks[0]!,
          block_index: 3,
        },
      ],
    }));

    renderPage({ createBlock });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add step after block 1" }));

    await waitFor(() => expect(createBlock).toHaveBeenCalledWith("project_1", "guide_1", {
      block_type: "step",
      position: {
        placement: "after",
        guide_block_id: "block_1",
      },
      step: {
        title: "New step",
        body: null,
      },
    }));
    expect(await screen.findByLabelText("Step title 2")).toHaveValue("New step");
    expect(screen.getByRole("button", { name: "Move step 2 down" })).toBeInTheDocument();
  });

  it("adds and edits paragraph blocks and adds divider blocks from the editor", async () => {
    const createBlock = vi.fn(async (_projectId, _guideId, data) => ({
      guide_blocks: [
        {
          ...guideDetail.guide_blocks[1]!,
          block_index: 1,
        },
        {
          id: data.block_type === "paragraph" ? "block_paragraph" : "block_divider",
          organization_id: "organization_1",
          project_id: "project_1",
          guide_id: "guide_1",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          selected_capture_asset_id: null,
          screenshot_hidden: false,
          display_capture_asset_id: null,
          block_type: data.block_type,
          content: data.content ?? null,
          block_index: 2,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T10:03:00.000Z",
          updated_at: "2026-06-05T10:03:00.000Z",
          step: null,
        },
        {
          ...guideDetail.guide_blocks[0]!,
          block_index: 3,
        },
      ],
    }));
    const saveBlock = vi.fn(async (_projectId, _guideId, blockId, data) => ({
      guide_block: {
        id: blockId,
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "paragraph" as const,
        content: data.content ?? null,
        block_index: 2,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 2,
        created_at: "2026-06-05T10:03:00.000Z",
        updated_at: "2026-06-05T10:04:00.000Z",
        step: null,
      },
    }));

    renderPage({ createBlock, saveBlock });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add paragraph after block 1" }));

    await waitFor(() => expect(createBlock).toHaveBeenCalledWith("project_1", "guide_1", {
      block_type: "paragraph",
      position: {
        placement: "after",
        guide_block_id: "block_1",
      },
      content: {
        body: "Add supporting context.",
      },
    }));
    expect(await screen.findByLabelText("Paragraph body 2")).toHaveValue("Add supporting context.");

    fireEvent.change(screen.getByLabelText("Paragraph body 2"), {
      target: { value: "Explain the setup before continuing." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save paragraph 2" }));

    await waitFor(() => expect(saveBlock).toHaveBeenCalledWith("project_1", "guide_1", "block_paragraph", {
      content: {
        body: "Explain the setup before continuing.",
      },
    }));

    fireEvent.click(screen.getByRole("button", { name: "Add divider after block 2" }));
    await waitFor(() => expect(createBlock).toHaveBeenLastCalledWith("project_1", "guide_1", {
      block_type: "divider",
      position: {
        placement: "after",
        guide_block_id: "block_paragraph",
      },
    }));
    expect(await screen.findByRole("separator", { name: "Guide section divider 2" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Divider body 2")).not.toBeInTheDocument();
  });

  it("adds structural blocks with type-specific ordering actions", async () => {
    const createBlock = vi.fn(async (_projectId, _guideId, data) => ({
      guide_blocks: [
        {
          ...guideDetail.guide_blocks[1]!,
          block_index: 1,
        },
        {
          id: `block_${data.block_type}`,
          organization_id: "organization_1",
          project_id: "project_1",
          guide_id: "guide_1",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          selected_capture_asset_id: null,
          screenshot_hidden: false,
          display_capture_asset_id: null,
          block_type: data.block_type,
          content: data.content ?? null,
          block_index: 2,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T10:03:00.000Z",
          updated_at: "2026-06-05T10:03:00.000Z",
          step: null,
        },
        {
          ...guideDetail.guide_blocks[0]!,
          block_index: 3,
        },
      ],
    }));
    const reorderBlocks = vi.fn(async (_projectId: string, _guideId: string, blockIds: string[]) => ({
      guide_blocks: blockIds.map((blockId: string, index: number) => {
        const block = blockId === "block_header"
          ? {
            id: "block_header",
            organization_id: "organization_1",
            project_id: "project_1",
            guide_id: "guide_1",
            source_capture_session_id: null,
            source_capture_event_id: null,
            source_capture_asset_id: null,
            selected_capture_asset_id: null,
            screenshot_hidden: false,
            display_capture_asset_id: null,
            block_type: "header" as const,
            content: { title: "New section" },
            block_index: index + 1,
            created_by_id: "org_user_1",
            updated_by_id: "org_user_1",
            version: 1,
            created_at: "2026-06-05T10:03:00.000Z",
            updated_at: "2026-06-05T10:03:00.000Z",
            step: null,
          }
          : guideDetail.guide_blocks.find((candidate) => candidate.id === blockId)!;

        return {
          ...block,
          block_index: index + 1,
        };
      }),
    }));

    renderPage({ createBlock, reorderBlocks });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add header after block 1" }));

    await waitFor(() => expect(createBlock).toHaveBeenCalledWith("project_1", "guide_1", {
      block_type: "header",
      position: {
        placement: "after",
        guide_block_id: "block_1",
      },
      content: {
        title: "New section",
      },
    }));
    expect(await screen.findByLabelText("Header title 2")).toHaveValue("New section");

    fireEvent.click(screen.getByRole("button", { name: "Move header 2 down" }));

    await waitFor(() => expect(reorderBlocks).toHaveBeenCalledWith("project_1", "guide_1", [
      "block_1",
      "block_2",
      "block_header",
    ]));
    expect(screen.getByRole("button", { name: "Delete header 3" })).toBeInTheDocument();
  });

  it("marks a published guide stale after inserting a block", async () => {
    renderPage({
      loadPublishStatus: async () => publishedStatus(1),
    });

    expect(await screen.findByText("Public guide is live")).toBeInTheDocument();
    expect(screen.queryByText("Draft has changes not yet published.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add header after block 1" }));

    expect(await screen.findByText("Draft has changes not yet published.")).toBeInTheDocument();
  });

  it("changes and removes a step screenshot from the editor", async () => {
    const saveBlockScreenshot = vi.fn(async (_projectId, _guideId, blockId, data) => ({
      guide_block: {
        ...guideDetail.guide_blocks.find((block) => block.id === blockId)!,
        selected_capture_asset_id: data.capture_asset_id,
        screenshot_hidden: data.capture_asset_id === null,
        display_capture_asset_id: data.capture_asset_id,
      },
    }));
    const { loadScreenshotAssets } = renderPage({
      loadPublishStatus: vi.fn(async () => publishedStatus()),
      saveBlockScreenshot,
    });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change screenshot for step 1" }));

    expect(loadScreenshotAssets).toHaveBeenCalledWith("project_1", "version_1");
    expect(await screen.findByRole("button", { name: "Select screenshot Review Department for step 1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select screenshot Review Department for step 1" }));

    await waitFor(() => {
      expect(saveBlockScreenshot).toHaveBeenCalledWith("project_1", "guide_1", "block_1", {
        capture_asset_id: "asset_3",
      });
    });
    expect(await screen.findByRole("img", { name: "Review Department" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_3/file"
    );
    expect(screen.getByText("Draft has changes not yet published.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove screenshot for step 1" }));

    await waitFor(() => {
      expect(saveBlockScreenshot).toHaveBeenLastCalledWith("project_1", "guide_1", "block_1", {
        capture_asset_id: null,
      });
    });
    expect(screen.queryByRole("img", { name: "Review Department" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Attach screenshot for step 1" })).toBeInTheDocument();
  });

  it("keeps screenshot picker open with an inline retry when choices fail to load", async () => {
    const loadScreenshotAssets = vi.fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({
        capture_assets: guideDetail.source_capture_assets.map(toProjectCaptureAsset),
      });

    renderPage({ loadScreenshotAssets });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Change screenshot for step 1" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Could not load screenshots.");
    expect(screen.getByRole("button", { name: "Retry loading screenshots for step 1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry loading screenshots for step 1" }));

    expect(await screen.findByRole("button", { name: "Select screenshot Review Department for step 1" })).toBeInTheDocument();
    expect(loadScreenshotAssets).toHaveBeenCalledTimes(2);
  });

  it("labels screenshot choices with current state and human-readable details", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Change screenshot for step 1" }));

    const currentChoice = await screen.findByRole("button", { name: "Current screenshot Department List for step 1" });
    expect(currentChoice).toBeDisabled();
    expect(within(currentChoice).getByText("Current screenshot")).toBeInTheDocument();
    expect(within(currentChoice).getByText("departments.png")).toBeInTheDocument();
    expect(within(currentChoice).getByText("Captured Jun 5, 2026, 10:01 AM UTC")).toBeInTheDocument();

    const alternateChoice = screen.getByRole("button", { name: "Select screenshot Review Department for step 1" });
    expect(alternateChoice).toBeEnabled();
    expect(within(alternateChoice).getByText("review-department.png")).toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
  });

  it("renders adds and removes screenshot highlights from the editor", async () => {
    const detail: GuideDetail = {
      ...guideDetail,
      guide_blocks: guideDetail.guide_blocks.map((block) => (
        block.id === "block_1"
          ? {
            ...block,
            content: {
              annotations: [{
                id: "ann_existing",
                type: "highlight",
                x: 0.1,
                y: 0.2,
                width: 0.3,
                height: 0.4,
              }],
            },
          }
          : block
      )),
    };
    const saveBlockAnnotations = vi.fn(async (_projectId, _guideId, blockId, data) => ({
      guide_block: {
        ...detail.guide_blocks.find((block) => block.id === blockId)!,
        content: {
          annotations: data.annotations.map((
            annotation: UpdateGuideBlockAnnotationsInput["annotations"][number],
            index: number
          ) => ({
            id: annotation.id ?? `ann_saved_${index + 1}`,
            ...annotation,
          })),
        },
      },
    }));

    renderPage({ detail, saveBlockAnnotations });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByTestId("guide-highlight-ann_existing")).toHaveStyle({
      left: "10%",
      top: "20%",
      width: "30%",
      height: "40%",
    });

    fireEvent.click(screen.getByRole("button", { name: "Add highlight for step 1" }));

    await waitFor(() => expect(saveBlockAnnotations).toHaveBeenCalledWith("project_1", "guide_1", "block_1", {
      annotations: [
        {
          id: "ann_existing",
          type: "highlight",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
        },
        {
          type: "highlight",
          x: 0.65,
          y: 0.12,
          width: 0.18,
          height: 0.08,
        },
      ],
    }));

    fireEvent.click(await screen.findByRole("button", { name: "Remove highlight 1 from step 1" }));

    await waitFor(() => expect(saveBlockAnnotations).toHaveBeenLastCalledWith("project_1", "guide_1", "block_1", {
      annotations: [{
        id: "ann_saved_2",
        type: "highlight",
        x: 0.65,
        y: 0.12,
        width: 0.18,
        height: 0.08,
      }],
    }));
  });

  it("uploads a replacement screenshot from the editor", async () => {
    const uploadBlockScreenshot = vi.fn(async (_projectId, _guideId, blockId, input) => {
      const block = guideDetail.guide_blocks.find((candidate) => candidate.id === blockId)!;
      const capture_asset = toProjectCaptureAsset({
        id: "asset_uploaded",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 1,
        page_url: "https://example.test/uploaded",
        page_title: "Uploaded replacement",
        captured_at: "2026-06-05T10:04:00.000Z",
        file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_uploaded/file",
        file: {
          id: "file_uploaded",
          original_name: input.file.name,
          mime_type: input.file.type,
          size_bytes: input.file.size,
        },
      });

      return {
        guide_block: {
          ...block,
          selected_capture_asset_id: capture_asset.id,
          screenshot_hidden: false,
          display_capture_asset_id: capture_asset.id,
        },
        capture_asset,
      };
    });
    renderPage({
      loadPublishStatus: async () => publishedStatus(),
      uploadBlockScreenshot,
    });
    const file = new File(["replacement"], "replacement.png", { type: "image/png" });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Upload screenshot for step 1"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(uploadBlockScreenshot).toHaveBeenCalledWith("project_1", "guide_1", "block_1", {
        file,
      });
    });
    expect(await screen.findByRole("img", { name: "Uploaded replacement" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_uploaded/file"
    );
    expect(screen.getByText("Screenshot uploaded.")).toBeInTheDocument();
    expect(screen.getByText("Draft has changes not yet published.")).toBeInTheDocument();
  });

  it("keeps screenshot upload recoverable after a failed attempt", async () => {
    const uploadBlockScreenshot = vi.fn()
      .mockRejectedValueOnce(new Error("upload failed"))
      .mockImplementationOnce(async (_projectId, _guideId, blockId, input) => {
        const block = guideDetail.guide_blocks.find((candidate) => candidate.id === blockId)!;
        const capture_asset = toProjectCaptureAsset({
          id: "asset_uploaded_retry",
          capture_session_id: "capture_session_1",
          asset_type: "screenshot",
          width: 1440,
          height: 900,
          device_pixel_ratio: 1,
          page_url: "https://example.test/uploaded",
          page_title: "Uploaded after retry",
          captured_at: "2026-06-05T10:05:00.000Z",
          file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_uploaded_retry/file",
          file: {
            id: "file_uploaded_retry",
            original_name: input.file.name,
            mime_type: input.file.type,
            size_bytes: input.file.size,
          },
        });

        return {
          guide_block: {
            ...block,
            selected_capture_asset_id: capture_asset.id,
            screenshot_hidden: false,
            display_capture_asset_id: capture_asset.id,
          },
          capture_asset,
        };
      });
    renderPage({ uploadBlockScreenshot });
    const file = new File(["replacement"], "replacement.png", { type: "image/png" });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Upload screenshot for step 1"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("Could not upload screenshot.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Upload screenshot for step 1"), {
      target: { files: [file] },
    });

    await waitFor(() => expect(uploadBlockScreenshot).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("img", { name: "Uploaded after retry" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_uploaded_retry/file"
    );
    expect(screen.getByText("Screenshot uploaded.")).toBeInTheDocument();
  });

  it("shows publish-panel busy labels without locking guide editing", async () => {
    const publishCurrentGuide = vi.fn(() => new Promise<GuidePublishResult>(() => undefined));

    renderPage({
      publishCurrentGuide,
    });

    expect(await screen.findByText("This guide is not published.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publish guide" }));

    expect(await screen.findByRole("button", { name: "Publishing..." })).toBeDisabled();
    expect(screen.getByLabelText("Guide title")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Save guide" })).not.toBeDisabled();
  });

  it("shows a stable notice when public link copy fails", async () => {
    const copyText = vi.fn(async () => {
      throw new Error("clipboard blocked");
    });
    renderPage({
      loadPublishStatus: async () => publishedStatus(1),
      copyText,
    });

    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() => expect(copyText).toHaveBeenCalledWith("http://localhost:3000/p/abc123"));
    expect(screen.getByText("Could not copy public link. Select the URL above.")).toBeInTheDocument();
    expect(screen.getByText("/p/abc123")).toBeInTheDocument();
  });

  it("copies public guide embed code for active public links", async () => {
    const copyText = vi.fn(async () => undefined);
    renderPage({
      detail: {
        ...guideDetail,
        guide: {
          ...guideDetail.guide,
          title: "Department \"setup\" <guide>",
        },
      },
      loadPublishStatus: async () => publishedStatus(1),
      copyText,
    });

    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy embed code" }));

    await waitFor(() => expect(copyText).toHaveBeenCalledWith(
      "<iframe src=\"http://localhost:3000/p/abc123/embed\" title=\"Department &quot;setup&quot; &lt;guide&gt;\" width=\"100%\" height=\"720\" loading=\"lazy\" style=\"border:0;\"></iframe>"
    ));
    expect(screen.getByText("Embed code copied.")).toBeInTheDocument();
  });

  it("shows selectable embed code when embed copy fails", async () => {
    const copyText = vi.fn(async () => {
      throw new Error("clipboard blocked");
    });
    renderPage({
      loadPublishStatus: async () => publishedStatus(1),
      copyText,
    });

    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy embed code" }));

    const expectedEmbedCode = "<iframe src=\"http://localhost:3000/p/abc123/embed\" title=\"Department guide\" width=\"100%\" height=\"720\" loading=\"lazy\" style=\"border:0;\"></iframe>";
    await waitFor(() => expect(copyText).toHaveBeenCalledWith(expectedEmbedCode));
    expect(screen.getByText("Could not copy embed code. Select the embed code below.")).toBeInTheDocument();
    expect(screen.getByText(expectedEmbedCode)).toBeInTheDocument();
  });

  it("hides embed copy controls for restricted expired and unpublished links", async () => {
    const { rerender } = render(
      <GuideEditorPage
        projectId="project_1"
      projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => guideDetail}
        loadPublishStatus={async () => ({
          ...publishedStatus(1),
          publish_link: {
            ...publishedStatus(1).publish_link!,
            visibility: "restricted",
          },
        })}
      />
    );

    expect(await screen.findByText("Public access is off")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy embed code" })).not.toBeInTheDocument();

    rerender(
      <GuideEditorPage
        projectId="project_1"
      projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => guideDetail}
        loadPublishStatus={async () => ({
          ...publishedStatus(1),
          publish_link: {
            ...publishedStatus(1).publish_link!,
            expires_at: "2020-01-01T00:00:00.000Z",
          },
        })}
      />
    );

    expect(await screen.findByText("Public link has expired")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy embed code" })).not.toBeInTheDocument();

    rerender(
      <GuideEditorPage
        projectId="project_1"
      projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => guideDetail}
        loadPublishStatus={async () => unpublishedStatus}
      />
    );

    expect(await screen.findByText("This guide is not published.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy embed code" })).not.toBeInTheDocument();
  });

  it("updates publish access from the editor panel", async () => {
    const updatePublishAccess = vi.fn(async (_projectId, _guideId, input) => ({
      ...publishedStatus(1),
      publish_link: {
        ...publishedStatus(1).publish_link!,
        visibility: input.visibility,
        expires_at: input.expires_at,
      },
    }));

    renderPage({
      loadPublishStatus: async () => publishedStatus(1),
      updatePublishAccess,
    });

    expect(await screen.findByText("Public access is on")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Disable public access" }));

    await waitFor(() => expect(updatePublishAccess).toHaveBeenCalledWith("project_1", "guide_1", {
      visibility: "restricted",
      expires_at: null,
    }));
    expect(await screen.findByText("Public access is off")).toBeInTheDocument();
    expect(screen.getByText("Publishing access updated.")).toBeInTheDocument();
  });

  it("sets and clears guide publish password protection", async () => {
    const updatePublishPassword = vi.fn(async (_projectId, _guideId, input) => ({
      ...publishedStatus(1),
      publish_link: {
        ...publishedStatus(1).publish_link!,
        password_protected: input.password !== null,
      },
    }));
    renderPage({
      loadPublishStatus: async () => publishedStatus(1),
      updatePublishPassword,
    });

    expect(await screen.findByText("Password protection is off.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Publish link password"), {
      target: { value: "shared password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set password" }));

    await waitFor(() => expect(updatePublishPassword).toHaveBeenCalledWith("project_1", "guide_1", {
      password: "shared password",
    }));
    expect(await screen.findByText("Password updated. Existing viewers must unlock again.")).toBeInTheDocument();
    expect(screen.getByText("Password protection is on.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear password" }));
    await waitFor(() => expect(updatePublishPassword).toHaveBeenCalledWith("project_1", "guide_1", {
      password: null,
    }));
    expect(await screen.findByText("Password protection cleared.")).toBeInTheDocument();
  });

  it("keeps the editor usable when publish status fails to load", async () => {
    const saveGuide = vi.fn(async (_projectId, _guideId, data) => ({
      guide: {
        ...guideDetail.guide,
        ...data,
        description: data.description ?? null,
      },
    }));

    renderPage({
      saveGuide,
      loadPublishStatus: async () => {
        throw new Error("status failed");
      },
    });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("Could not load publishing status.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Guide title"), {
      target: { value: "Updated department guide" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save guide" }));

    await waitFor(() => expect(saveGuide).toHaveBeenCalledWith("project_1", "guide_1", {
      title: "Updated department guide",
      description: "Set up departments from the list view.",
    }));
  });

  it("retries publish status after a load failure", async () => {
    const loadPublishStatus = vi.fn()
      .mockRejectedValueOnce(new Error("status failed"))
      .mockResolvedValueOnce(publishedStatus(1));

    renderPage({ loadPublishStatus });

    expect(await screen.findByText("Could not load publishing status.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadPublishStatus).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Published version 1 on Jun 11, 2026, 12:00 AM")).toBeInTheDocument();
  });

  it("shows publish validation errors and disables publish controls for archived guides", async () => {
    const publishCurrentGuide = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 400,
        type: "guide_has_no_publishable_blocks",
        message: "Guide has no publishable blocks",
      });
    });
    const archivedDetail = {
      ...guideDetail,
      guide: {
        ...guideDetail.guide,
        status: "archived" as const,
      },
    };
    const { rerender } = render(
      <GuideEditorPage
        projectId="project_1"
      projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => guideDetail}
        loadPublishStatus={async () => unpublishedStatus}
        publishCurrentGuide={publishCurrentGuide}
      />
    );

    expect(await screen.findByText("This guide is not published.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publish guide" }));
    expect(await screen.findByText("Guide has no publishable blocks.")).toBeInTheDocument();

    rerender(
      <GuideEditorPage
        projectId="project_1"
      projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => archivedDetail}
        loadPublishStatus={async () => unpublishedStatus}
        publishCurrentGuide={publishCurrentGuide}
      />
    );

    expect(await screen.findByText("Archived guides are read-only.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish guide" })).toBeDisabled();
  });

  it("does not render broken screenshots or raw IDs when source assets are missing", async () => {
    renderPage({
      detail: {
        ...guideDetail,
        source_capture_assets: [],
      },
    });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Department List" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open screenshot for step 1" })).not.toBeInTheDocument();
    expect(screen.queryByText("Screenshot source: asset_1")).not.toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();
  });

  it("opens and navigates screenshot viewer images from editor screenshots", async () => {
    const duplicateAssetDetail: GuideDetail = {
      ...guideDetail,
      guide_blocks: guideDetail.guide_blocks.map((block) => (
        block.id === "block_2"
          ? {
            ...block,
            source_capture_asset_id: "asset_1",
            display_capture_asset_id: "asset_1",
            step: block.step ? { ...block.step, source_capture_asset_id: "asset_1" } : null,
          }
          : block
      )),
      source_capture_assets: [guideDetail.source_capture_assets[0]!],
    };

    renderPage({ detail: duplicateAssetDetail });

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open screenshot for step 1" }));

    const firstDialog = screen.getByRole("dialog", { name: "Navigate to Department List" });
    expect(within(firstDialog).getByRole("img", { name: "Department List" })).toHaveAttribute(
      "src",
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file"
    );
    expect(within(firstDialog).getByText("1 / 2")).toBeInTheDocument();

    fireEvent.click(within(firstDialog).getByRole("button", { name: "Next screenshot" }));
    const secondDialog = screen.getByRole("dialog", { name: "Click Add Department" });
    expect(within(secondDialog).getByText("2 / 2")).toBeInTheDocument();
    expect(screen.queryByText("asset_1")).not.toBeInTheDocument();

    fireEvent.click(within(secondDialog).getByRole("button", { name: "Close screenshot viewer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders non-step blocks with block-level actions", async () => {
    renderPage({
      detail: {
        ...guideDetail,
        guide_blocks: [
          {
            ...guideDetail.guide_blocks[0]!,
            id: "block_header_1",
            block_type: "header",
            content: {
              title: "Setup section",
            },
            block_index: 1,
            source_capture_asset_id: null,
            step: null,
          },
        ],
      },
    });

    expect(await screen.findByText("header")).toBeInTheDocument();
    expect(screen.getByLabelText("Header title 1")).toHaveValue("Setup section");
    expect(screen.getByRole("button", { name: "Save header 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete header 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete step 1" })).not.toBeInTheDocument();
  });

  it("saves guide metadata and step copy", async () => {
    const { saveGuide, saveStep } = renderPage();

    await screen.findByRole("heading", { name: "Department guide" });

    fireEvent.change(screen.getByLabelText("Guide title"), {
      target: { value: "Updated department guide" },
    });
    fireEvent.change(screen.getByLabelText("Guide description"), {
      target: { value: "Updated setup notes." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save guide" }));

    await waitFor(() => expect(saveGuide).toHaveBeenCalledWith("project_1", "guide_1", {
      title: "Updated department guide",
      description: "Updated setup notes.",
    }));

    fireEvent.change(screen.getByLabelText("Step title 1"), {
      target: { value: "Open department list" },
    });
    fireEvent.change(screen.getByLabelText("Step body 1"), {
      target: { value: "Go to the Department list page." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save step 1" }));

    await waitFor(() => expect(saveStep).toHaveBeenCalledWith("project_1", "guide_1", "step_1", {
      title: "Open department list",
      body: "Go to the Department list page.",
    }));
  });

  it("reorders and deletes blocks", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { loadDetail, reorderBlocks, removeBlock } = renderPage();

    await screen.findByRole("heading", { name: "Department guide" });
    fireEvent.click(screen.getByRole("button", { name: "Move step 1 down" }));

    await waitFor(() => expect(reorderBlocks).toHaveBeenCalledWith("project_1", "guide_1", ["block_2", "block_1"]));

    fireEvent.click(screen.getByRole("button", { name: "Delete step 2" }));

    await waitFor(() => expect(removeBlock).toHaveBeenCalledWith("project_1", "guide_1", "block_1"));
    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    confirm.mockRestore();
  });

  it("renders readonly archived guides", async () => {
    renderPage({
      detail: {
        ...guideDetail,
        guide: {
          ...guideDetail.guide,
          status: "archived",
        },
      },
    });

    expect(await screen.findByText("Archived guides are read-only.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save guide" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save step 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Open screenshot for step 1" }));
    expect(screen.getByRole("dialog", { name: "Navigate to Department List" })).toBeInTheDocument();
  });

  it("closes the screenshot viewer when the active screenshot disappears after deletion", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const loadDetail = vi
      .fn()
      .mockResolvedValueOnce(guideDetail)
      .mockResolvedValueOnce({
        ...guideDetail,
        guide_blocks: [guideDetail.guide_blocks[0]!],
        source_capture_assets: [guideDetail.source_capture_assets[1]!],
      });

    renderPage({ loadDetail });

    await screen.findByRole("heading", { name: "Department guide" });
    fireEvent.click(screen.getByRole("button", { name: "Open screenshot for step 1" }));
    expect(screen.getByRole("dialog", { name: "Navigate to Department List" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete step 1" }));

    await waitFor(() => expect(loadDetail).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Department List" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "New Department" })).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("renders load and mutation error states", async () => {
    const { rerender } = render(
      <GuideEditorPage
        projectId="project_1"
      projectVersionId="version_1"
        guideId="guide_1"
        currentPath="/projects/project_1/guides/guide_1"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            message: "Authentication is required",
          });
        }}
      />
    );

    expect(await screen.findByText("Sign in to edit this guide.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fguides%2Fguide_1"
    );

    rerender(
      <GuideEditorPage
        projectId="project_1"
      projectVersionId="version_1"
        guideId="missing"
        loadDetail={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            message: "Guide was not found",
          });
        }}
      />
    );

    expect(await screen.findByText("Guide was not found.")).toBeInTheDocument();

    const saveGuide = vi.fn(async () => {
      throw new ApiClientError({
        kind: "validation",
        status: 409,
        type: "guide_not_editable",
        message: "Guide is archived",
      });
    });

    rerender(
      <GuideEditorPage
        projectId="project_1"
      projectVersionId="version_1"
        guideId="guide_1"
        loadDetail={async () => guideDetail}
        saveGuide={saveGuide}
      />
    );

    await screen.findByRole("heading", { name: "Department guide" });
    fireEvent.click(screen.getByRole("button", { name: "Save guide" }));

    expect(await screen.findByText("Archived guides are read-only.")).toBeInTheDocument();
  });
});
