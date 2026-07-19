import { useEffect, useMemo, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button, buttonVariants } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import {
  ApiClientError,
  archiveGuide,
  createGuideBlock,
  deleteGuideBlock,
  exportGuideHtmlZip,
  exportGuideMarkdown,
  getGuideDetail,
  getGuidePublishStatus,
  listProjectScreenshotAssets,
  publishGuide,
  reorderGuideBlocks,
  resolveApiAssetUrl,
  restoreGuide,
  revokeGuidePublishLink,
  updateGuidePublishPassword,
  updateGuidePublishAccess,
  updateGuide,
  updateGuideBlock,
  updateGuideBlockAnnotations,
  updateGuideBlockScreenshot,
  uploadGuideBlockScreenshot,
  updateGuideStep,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import {
  GuideScreenshotViewer,
  type GuideScreenshotViewerImage,
} from "./GuideScreenshotViewer";
import {
  annotationPercent,
  annotationsFromBlock,
  assetAltText,
  assetDisplayName,
  assetForBlock,
  blockContentDraftsFromBlocks,
  defaultBlockInput,
  defaultHighlightAnnotation,
  formatCapturedAt,
  mergeAssetIntoDetail,
  screenshotViewerImageId,
  sortBlocks,
  stepDraftsFromBlocks,
  updateBlockInBlocks,
  updateStepInBlocks,
  type BlockContentDraft,
  type StepDraft,
} from "./guideEditorHelpers";
import { publicGuideEmbedCode, publicGuideUrl } from "./publishLinks";
import type {
  GuideBlock,
  GuideDetail,
  GuideMarkdownExport,
  GuidePublishResult,
  GuidePublishStatusResponse,
  GuideRevokePublishResult,
  GuideScreenshotAnnotation,
  GuideSourceCaptureAsset,
  GuideStep,
  UpdateGuideBlockAnnotationsInput,
  UpdateGuidePublishAccessInput,
  UpdateGuidePublishPasswordInput,
} from "./types";
import styles from "./GuideEditorPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; detail: GuideDetail }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type GuideDraft = {
  title: string;
  description: string;
};

type PublishState =
  | { status: "loading" }
  | { status: "loaded"; response: GuidePublishStatusResponse }
  | { status: "error" };

type VersionBound<T> = T extends (...args: [...infer Args, string]) => infer Result
  ? (...args: Args) => Result
  : never;

export type GuideEditorPageProps = {
  projectId: string;
  guideId: string;
  loadDetail?: (projectId: string, guideId: string) => Promise<GuideDetail>;
  loadPublishStatus?: (
    projectId: string,
    guideId: string,
  ) => Promise<GuidePublishStatusResponse>;
  publishCurrentGuide?: (
    projectId: string,
    guideId: string,
  ) => Promise<GuidePublishResult>;
  revokePublishLink?: (
    projectId: string,
    guideId: string,
  ) => Promise<GuideRevokePublishResult>;
  updatePublishAccess?: (
    projectId: string,
    guideId: string,
    input: UpdateGuidePublishAccessInput,
  ) => Promise<GuidePublishStatusResponse>;
  updatePublishPassword?: (
    projectId: string,
    guideId: string,
    input: UpdateGuidePublishPasswordInput,
  ) => Promise<GuidePublishStatusResponse>;
  copyText?: (text: string) => Promise<void>;
  exportMarkdown?: VersionBound<typeof exportGuideMarkdown>;
  exportHtmlZip?: VersionBound<typeof exportGuideHtmlZip>;
  downloadTextFile?: (
    filename: string,
    contents: string,
    mimeType: string,
  ) => Promise<void>;
  downloadBlobFile?: (filename: string, blob: Blob) => Promise<void>;
  saveGuide?: VersionBound<typeof updateGuide>;
  saveStep?: VersionBound<typeof updateGuideStep>;
  createBlock?: VersionBound<typeof createGuideBlock>;
  saveBlock?: VersionBound<typeof updateGuideBlock>;
  loadScreenshotAssets?: typeof listProjectScreenshotAssets;
  saveBlockScreenshot?: VersionBound<typeof updateGuideBlockScreenshot>;
  saveBlockAnnotations?: VersionBound<typeof updateGuideBlockAnnotations>;
  uploadBlockScreenshot?: VersionBound<typeof uploadGuideBlockScreenshot>;
  reorderBlocks?: VersionBound<typeof reorderGuideBlocks>;
  removeBlock?: VersionBound<typeof deleteGuideBlock>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  versionSlug?: string;
  projectVersionId: string;
  isDefaultVersion?: boolean;
  changeEditionStatus?: (
    command: "archive" | "restore",
    projectId: string,
    guideId: string,
    projectVersionId: string,
    expectedEditionVersion: number,
  ) => Promise<{ edition: GuideDetail["edition"] }>;
};

const guidePreviewUrl = (
  projectId: string,
  guideId: string,
  versionSlug?: string,
) =>
  `/projects/${encodeURIComponent(projectId)}${versionSlug ? `/versions/${encodeURIComponent(versionSlug)}` : ""}/guides/${encodeURIComponent(guideId)}/preview`;

const loadStateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    if (error.kind === "not_found") {
      return { status: "not_found" };
    }
  }

  return { status: "error" };
};

const isGuideNotEditable = (error: unknown) =>
  error instanceof ApiClientError && error.type === "guide_not_editable";

const defaultCopyText = async (text: string) => {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable");
  }

  await navigator.clipboard.writeText(text);
};

const defaultDownloadTextFile = async (
  filename: string,
  contents: string,
  mimeType: string,
) => {
  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const defaultDownloadBlobFile = async (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const isDateAfter = (left: string, right: string) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  if (
    !Number.isFinite(leftDate.getTime()) ||
    !Number.isFinite(rightDate.getTime())
  ) {
    return false;
  }

  return leftDate.getTime() > rightDate.getTime();
};

const publishErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiClientError) {
    if (error.type === "guide_not_publishable") {
      return "Guide is not publishable.";
    }

    if (error.type === "guide_has_no_publishable_blocks") {
      return "Guide has no publishable blocks.";
    }
  }

  return fallback;
};

export const GuideEditorPage = ({
  projectId,
  guideId,
  projectVersionId,
  loadDetail = (id, artifactId) => getGuideDetail(id, artifactId, projectVersionId),
  loadPublishStatus = (id, artifactId) => getGuidePublishStatus(id, artifactId, projectVersionId),
  publishCurrentGuide = (id, artifactId) => publishGuide(id, artifactId, projectVersionId),
  revokePublishLink = (id, artifactId) => revokeGuidePublishLink(id, artifactId, projectVersionId),
  updatePublishAccess = (id, artifactId, input) => updateGuidePublishAccess(id, artifactId, input, projectVersionId),
  updatePublishPassword = (id, artifactId, input) => updateGuidePublishPassword(id, artifactId, input, projectVersionId),
  copyText = defaultCopyText,
  exportMarkdown = (id, artifactId) => exportGuideMarkdown(id, artifactId, projectVersionId),
  exportHtmlZip = (id, artifactId) => exportGuideHtmlZip(id, artifactId, projectVersionId),
  downloadTextFile = defaultDownloadTextFile,
  downloadBlobFile = defaultDownloadBlobFile,
  saveGuide = (id, artifactId, data) => updateGuide(id, artifactId, data, projectVersionId),
  saveStep = (id, artifactId, stepId, data) => updateGuideStep(id, artifactId, stepId, data, projectVersionId),
  createBlock = (id, artifactId, data) => createGuideBlock(id, artifactId, data, projectVersionId),
  saveBlock = (id, artifactId, blockId, data) => updateGuideBlock(id, artifactId, blockId, data, projectVersionId),
  loadScreenshotAssets = listProjectScreenshotAssets,
  saveBlockScreenshot = (id, artifactId, blockId, data) => updateGuideBlockScreenshot(id, artifactId, blockId, data, projectVersionId),
  saveBlockAnnotations = (id, artifactId, blockId, data) => updateGuideBlockAnnotations(id, artifactId, blockId, data, projectVersionId),
  uploadBlockScreenshot = (id, artifactId, blockId, input, expected) => uploadGuideBlockScreenshot(id, artifactId, blockId, input, expected, projectVersionId),
  reorderBlocks = (id, artifactId, blockIds, expected) => reorderGuideBlocks(id, artifactId, blockIds, expected, projectVersionId),
  removeBlock = (id, artifactId, blockId, expected) => deleteGuideBlock(id, artifactId, blockId, expected, projectVersionId),
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
  versionSlug,
  isDefaultVersion = true,
  changeEditionStatus = (command, id, artifactId, versionId, expected) =>
    command === "archive"
      ? archiveGuide(id, artifactId, versionId, expected)
      : restoreGuide(id, artifactId, versionId, expected),
}: GuideEditorPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [publishState, setPublishState] = useState<PublishState>({
    status: "loading",
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [publishReloadKey, setPublishReloadKey] = useState(0);
  const [guideDraft, setGuideDraft] = useState<GuideDraft>({
    title: "",
    description: "",
  });
  const [stepDrafts, setStepDrafts] = useState<Record<string, StepDraft>>({});
  const [blockContentDrafts, setBlockContentDrafts] = useState<
    Record<string, BlockContentDraft>
  >({});
  const [notice, setNotice] = useState<string | null>(null);
  const [embedCopyFallback, setEmbedCopyFallback] = useState<string | null>(
    null,
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [publishBusyAction, setPublishBusyAction] = useState<string | null>(
    null,
  );
  const [locallyStalePublish, setLocallyStalePublish] = useState(false);
  const [screenshotAssets, setScreenshotAssets] = useState<
    GuideSourceCaptureAsset[]
  >([]);
  const [screenshotAssetsError, setScreenshotAssetsError] = useState(false);
  const [activeScreenshotPickerBlockId, setActiveScreenshotPickerBlockId] =
    useState<string | null>(null);
  const currentWorkingDraftVersion = state.status === "loaded"
    ? state.detail.working_draft.version
    : 0;

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadDetail(projectId, guideId)
      .then((detail) => {
        if (active) {
          setState({ status: "loaded", detail });
          setGuideDraft({
            title: detail.edition.title,
            description: detail.edition.description ?? "",
          });
          setStepDrafts(stepDraftsFromBlocks(detail.guide_blocks));
          setBlockContentDrafts(
            blockContentDraftsFromBlocks(detail.guide_blocks),
          );
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState(loadStateFromError(error));
        }
      });

    return () => {
      active = false;
    };
  // Route identity and reloadKey intentionally control refetching; injected loaders may be inline test adapters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectVersionId, guideId, reloadKey]);

  useEffect(() => {
    let active = true;
    setPublishState({ status: "loading" });

    loadPublishStatus(projectId, guideId)
      .then((response) => {
        if (active) {
          setPublishState({ status: "loaded", response });
        }
      })
      .catch(() => {
        if (active) {
          setPublishState({ status: "error" });
        }
      });

    return () => {
      active = false;
    };
  // Route identity and publishReloadKey intentionally control refetching; injected loaders may be inline adapters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectVersionId, guideId, publishReloadKey]);

  useEffect(() => {
    setLocallyStalePublish(false);
    setScreenshotAssets([]);
    setActiveScreenshotPickerBlockId(null);
  }, [projectId, guideId]);

  const reload = () => setReloadKey((key) => key + 1);
  const reloadPublishStatus = () => setPublishReloadKey((key) => key + 1);

  const markNotEditable = () => {
    setNotice("Archived guides are read-only.");
    reload();
  };

  const handleMutationError = (error: unknown, fallback: string) => {
    if (isGuideNotEditable(error)) {
      markNotEditable();
      return;
    }

    setNotice(fallback);
  };

  const hasActivePublish = () =>
    publishState.status === "loaded" &&
    publishState.response.publish_link?.status === "active" &&
    Boolean(publishState.response.published_artifact);

  const markPublishedDraftStale = () => {
    if (hasActivePublish()) {
      setLocallyStalePublish(true);
    }
  };

  const publishCurrent = async () => {
    setPublishBusyAction("publish");
    setNotice(null);
    setEmbedCopyFallback(null);

    try {
      const response = await publishCurrentGuide(projectId, guideId);
      setPublishState({ status: "loaded", response });
      setLocallyStalePublish(false);
      setNotice("Guide published.");
    } catch (error: unknown) {
      setNotice(publishErrorMessage(error, "Could not publish guide."));
    } finally {
      setPublishBusyAction(null);
    }
  };

  const revokeCurrent = async () => {
    setPublishBusyAction("revoke");
    setNotice(null);
    setEmbedCopyFallback(null);

    try {
      await revokePublishLink(projectId, guideId);
      setPublishState({
        status: "loaded",
        response: {
          publish_link: null,
          published_artifact: null,
        },
      });
      setLocallyStalePublish(false);
      setNotice("Public link revoked.");
    } catch (error: unknown) {
      setNotice(publishErrorMessage(error, "Could not revoke public link."));
    } finally {
      setPublishBusyAction(null);
    }
  };

  const copyCurrent = async (publicUrl: string) => {
    setPublishBusyAction("copy");
    setNotice(null);
    setEmbedCopyFallback(null);

    try {
      await copyText(publicGuideUrl(publicUrl));
      setNotice("Public link copied.");
    } catch {
      setNotice("Could not copy public link. Select the URL above.");
    } finally {
      setPublishBusyAction(null);
    }
  };

  const copyCurrentEmbed = async (publicUrl: string, title: string) => {
    const embedCode = publicGuideEmbedCode({ publicUrl, title });
    setPublishBusyAction("copy_embed");
    setNotice(null);
    setEmbedCopyFallback(null);

    try {
      await copyText(embedCode);
      setNotice("Embed code copied.");
    } catch {
      setEmbedCopyFallback(embedCode);
      setNotice("Could not copy embed code. Select the embed code below.");
    } finally {
      setPublishBusyAction(null);
    }
  };

  const updateCurrentPublishAccess = async (
    input: UpdateGuidePublishAccessInput,
  ) => {
    setPublishBusyAction("access");
    setNotice(null);
    setEmbedCopyFallback(null);

    try {
      const response = await updatePublishAccess(projectId, guideId, input);
      setPublishState({ status: "loaded", response });
      setNotice("Publishing access updated.");
    } catch (error: unknown) {
      setNotice(
        publishErrorMessage(error, "Could not update publishing access."),
      );
    } finally {
      setPublishBusyAction(null);
    }
  };

  const updateCurrentPublishPassword = async (
    input: UpdateGuidePublishPasswordInput,
  ) => {
    setPublishBusyAction("password");
    setNotice(null);
    setEmbedCopyFallback(null);

    try {
      const response = await updatePublishPassword(projectId, guideId, input);
      setPublishState({ status: "loaded", response });
      setNotice(
        input.password === null
          ? "Password protection cleared."
          : "Password updated. Existing viewers must unlock again.",
      );
    } catch (error: unknown) {
      setNotice(
        publishErrorMessage(error, "Could not update password protection."),
      );
    } finally {
      setPublishBusyAction(null);
    }
  };

  const exportCurrentMarkdown = async (): Promise<GuideMarkdownExport> =>
    exportMarkdown(projectId, guideId);

  const copyMarkdown = async () => {
    setBusyAction("export-copy");
    setNotice(null);

    try {
      const response = await exportCurrentMarkdown();
      await copyText(response.markdown);
      setNotice("Markdown copied.");
    } catch {
      setNotice("Could not export Markdown.");
    } finally {
      setBusyAction(null);
    }
  };

  const downloadMarkdown = async () => {
    setBusyAction("export-download");
    setNotice(null);

    try {
      const response = await exportCurrentMarkdown();
      await downloadTextFile(
        response.filename,
        response.markdown,
        "text/markdown;charset=utf-8",
      );
      setNotice("Markdown downloaded.");
    } catch {
      setNotice("Could not export Markdown.");
    } finally {
      setBusyAction(null);
    }
  };

  const downloadHtmlZip = async () => {
    setBusyAction("export-html");
    setNotice(null);

    try {
      const response = await exportHtmlZip(projectId, guideId);
      await downloadBlobFile(response.filename, response.blob);
      setNotice("HTML export downloaded.");
    } catch {
      setNotice("Could not export HTML.");
    } finally {
      setBusyAction(null);
    }
  };

  const patchDetail = (patch: (detail: GuideDetail) => GuideDetail) => {
    setState((current) =>
      current.status === "loaded"
        ? { status: "loaded", detail: patch(current.detail) }
        : current,
    );
  };

  const saveGuideDraft = async () => {
    if (state.status !== "loaded") {
      return;
    }

    setBusyAction("guide");
    setNotice(null);

    try {
      const response = await saveGuide(projectId, guideId, {
        title: guideDraft.title,
        description: guideDraft.description || null,
        expected_edition_version: state.detail.edition.version,
      });

      patchDetail((detail) => ({
        ...detail,
        edition: response.edition,
      }));
      setGuideDraft({
        title: response.edition.title,
        description: response.edition.description ?? "",
      });
      markPublishedDraftStale();
    } catch (error: unknown) {
      handleMutationError(error, "Could not save changes.");
    } finally {
      setBusyAction(null);
    }
  };

  const saveStepDraft = async (step: GuideStep) => {
    const draft = stepDrafts[step.id];

    if (!draft) {
      return;
    }

    setBusyAction(`step:${step.id}`);
    setNotice(null);

    try {
      const response = await saveStep(projectId, guideId, step.id, {
        title: draft.title,
        body: draft.body || null,
        expected_working_draft_version: currentWorkingDraftVersion,
      });

      patchDetail((detail) => ({
        ...detail,
        working_draft: response.working_draft,
        guide_blocks: updateStepInBlocks(
          detail.guide_blocks,
          response.guide_step,
        ),
      }));
      setStepDrafts((current) => ({
        ...current,
        [response.guide_step.id]: {
          title: response.guide_step.title,
          body: response.guide_step.body ?? "",
        },
      }));
      markPublishedDraftStale();
    } catch (error: unknown) {
      handleMutationError(error, "Could not save changes.");
    } finally {
      setBusyAction(null);
    }
  };

  const addBlock = async (
    blockType: "step" | "header" | "paragraph" | "tip" | "alert" | "divider",
    afterBlock?: GuideBlock,
  ) => {
    setBusyAction(`create:${afterBlock?.id ?? "end"}:${blockType}`);
    setNotice(null);

    try {
      const response = await createBlock(
        projectId,
        guideId,
        {
          ...defaultBlockInput(
            blockType,
            afterBlock
              ? {
                  placement: "after",
                  guide_block_id: afterBlock.id,
                }
              : undefined,
          ),
          expected_working_draft_version: state.status === "loaded"
            ? state.detail.working_draft.version
            : 1,
        },
      );
      patchDetail((detail) => ({
        ...detail,
        working_draft: response.working_draft,
        guide_blocks: response.guide_blocks,
      }));
      setStepDrafts(stepDraftsFromBlocks(response.guide_blocks));
      setBlockContentDrafts(
        blockContentDraftsFromBlocks(response.guide_blocks),
      );
      markPublishedDraftStale();
      setNotice("Block added.");
    } catch (error: unknown) {
      handleMutationError(error, "Could not add block.");
    } finally {
      setBusyAction(null);
    }
  };

  const saveBlockDraft = async (block: GuideBlock) => {
    const draft = blockContentDrafts[block.id];

    if (!draft) {
      return;
    }

    setBusyAction(`block:${block.id}`);
    setNotice(null);

    try {
      const response = await saveBlock(projectId, guideId, block.id, {
        title: block.block_type === "paragraph" ? null : draft.title || null,
        body: block.block_type === "header" ? null : draft.body || null,
        expected_working_draft_version: currentWorkingDraftVersion,
      });
      patchDetail((detail) => ({
        ...detail,
        working_draft: response.working_draft,
        guide_blocks: updateBlockInBlocks(
          detail.guide_blocks,
          response.guide_block,
        ),
      }));
      setBlockContentDrafts((current) => ({
        ...current,
        [response.guide_block.id]: {
          title: response.guide_block.title ?? "",
          body: response.guide_block.body ?? "",
        },
      }));
      markPublishedDraftStale();
      setNotice("Block saved.");
    } catch (error: unknown) {
      handleMutationError(error, "Could not save block.");
    } finally {
      setBusyAction(null);
    }
  };

  const openScreenshotPicker = async (block: GuideBlock) => {
    setActiveScreenshotPickerBlockId(block.id);

    if (screenshotAssets.length > 0) {
      return;
    }

    setBusyAction(`screenshots:${block.id}`);
    setNotice(null);
    setScreenshotAssetsError(false);

    try {
      if (!projectVersionId)
        throw new Error("Project Version context is required");
      const response = await loadScreenshotAssets(projectId, projectVersionId);
      setScreenshotAssets(response.capture_assets);
    } catch {
      setScreenshotAssetsError(true);
      setNotice("Could not load screenshots.");
    } finally {
      setBusyAction(null);
    }
  };

  const saveScreenshot = async (
    block: GuideBlock,
    captureAssetId: string | null,
  ) => {
    setBusyAction(`screenshot:${block.id}`);
    setNotice(null);

    try {
      const response = await saveBlockScreenshot(projectId, guideId, block.id, {
        capture_asset_id: captureAssetId,
        expected_working_draft_version: currentWorkingDraftVersion,
      });
      const selectedAsset = captureAssetId
        ? screenshotAssets.find((asset) => asset.id === captureAssetId)
        : undefined;

      patchDetail((detail) => {
        const withAsset = mergeAssetIntoDetail(detail, selectedAsset);
        return {
          ...withAsset,
          working_draft: response.working_draft,
          guide_blocks: updateBlockInBlocks(
            withAsset.guide_blocks,
            response.guide_block,
          ),
        };
      });
      setActiveScreenshotPickerBlockId(null);
      markPublishedDraftStale();
      setNotice(captureAssetId ? "Screenshot updated." : "Screenshot removed.");
    } catch (error: unknown) {
      handleMutationError(error, "Could not update screenshot.");
    } finally {
      setBusyAction(null);
    }
  };

  const uploadScreenshot = async (block: GuideBlock, file: File) => {
    setBusyAction(`upload-screenshot:${block.id}`);
    setNotice(null);

    try {
      const response = await uploadBlockScreenshot(
        projectId,
        guideId,
        block.id,
        { file },
        currentWorkingDraftVersion,
      );
      patchDetail((detail) => {
        const withAsset = mergeAssetIntoDetail(detail, response.capture_asset);
        return {
          ...withAsset,
          working_draft: response.working_draft,
          guide_blocks: updateBlockInBlocks(
            withAsset.guide_blocks,
            response.guide_block,
          ),
        };
      });
      setScreenshotAssets((current) =>
        current.some((asset) => asset.id === response.capture_asset.id)
          ? current
          : [...current, response.capture_asset],
      );
      setScreenshotAssetsError(false);
      setActiveScreenshotPickerBlockId(null);
      markPublishedDraftStale();
      setNotice("Screenshot uploaded.");
    } catch (error: unknown) {
      handleMutationError(error, "Could not upload screenshot.");
    } finally {
      setBusyAction(null);
    }
  };

  const saveAnnotations = async (
    block: GuideBlock,
    annotations: UpdateGuideBlockAnnotationsInput["annotations"],
  ) => {
    setBusyAction(`annotations:${block.id}`);
    setNotice(null);

    try {
      const response = await saveBlockAnnotations(
        projectId,
        guideId,
        block.id,
        { annotations, expected_working_draft_version: currentWorkingDraftVersion },
      );
      patchDetail((detail) => ({
        ...detail,
        working_draft: response.working_draft,
        guide_blocks: updateBlockInBlocks(
          detail.guide_blocks,
          response.guide_block,
        ),
      }));
      markPublishedDraftStale();
      setNotice("Highlights saved.");
    } catch (error: unknown) {
      handleMutationError(error, "Could not save highlights.");
    } finally {
      setBusyAction(null);
    }
  };

  const addHighlight = (block: GuideBlock) => {
    void saveAnnotations(block, [
      ...annotationsFromBlock(block),
      defaultHighlightAnnotation(),
    ]);
  };

  const removeHighlight = (block: GuideBlock, annotationIndex: number) => {
    void saveAnnotations(
      block,
      annotationsFromBlock(block).filter(
        (_, index) => index !== annotationIndex,
      ),
    );
  };

  const moveBlock = async (blockId: string, direction: -1 | 1) => {
    if (state.status !== "loaded") {
      return;
    }

    const blocks = sortBlocks(state.detail.guide_blocks);
    const currentIndex = blocks.findIndex((block) => block.id === blockId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    const nextBlockIds = blocks.map((block) => block.id);
    const currentBlockId = nextBlockIds[currentIndex];
    const nextBlockId = nextBlockIds[nextIndex];

    if (!currentBlockId || !nextBlockId) {
      return;
    }

    nextBlockIds[currentIndex] = nextBlockId;
    nextBlockIds[nextIndex] = currentBlockId;

    setBusyAction(`reorder:${blockId}`);
    setNotice(null);

    try {
      const response = await reorderBlocks(projectId, guideId, nextBlockIds, state.detail.working_draft.version);
      patchDetail((detail) => ({
        ...detail,
        working_draft: response.working_draft,
        guide_blocks: response.guide_blocks,
      }));
      markPublishedDraftStale();
    } catch (error: unknown) {
      handleMutationError(error, "Could not reorder blocks.");
    } finally {
      setBusyAction(null);
    }
  };

  const deleteBlock = async (block: GuideBlock) => {
    if (!window.confirm("Delete this guide block?")) {
      return;
    }

    setBusyAction(`delete:${block.id}`);
    setNotice(null);

    try {
      await removeBlock(projectId, guideId, block.id, currentWorkingDraftVersion);
      markPublishedDraftStale();
      reload();
    } catch (error: unknown) {
      handleMutationError(error, "Could not delete block.");
    } finally {
      setBusyAction(null);
    }
  };

  const changeLifecycle = async () => {
    if (state.status !== "loaded") return;
    const command = state.detail.edition.status === "draft" ? "archive" : "restore";
    if (command === "archive" && !window.confirm("Archive this guide edition?")) return;
    setBusyAction("lifecycle");
    setNotice(null);
    try {
      const response = await changeEditionStatus(
        command,
        projectId,
        guideId,
        projectVersionId,
        state.detail.edition.version,
      );
      patchDetail((detail) => ({ ...detail, edition: response.edition }));
      setNotice(command === "archive" ? "Guide archived." : "Guide restored.");
    } catch (error: unknown) {
      handleMutationError(error, `Could not ${command} guide.`);
    } finally {
      setBusyAction(null);
    }
  };

  if (state.status === "loading") {
    return (
      <PortalShell
        projectId={projectId}
        guideId={guideId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <div className={styles.state}>Loading guide...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell
        projectId={projectId}
        guideId={guideId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <div className={styles.state}>
          <div>Sign in to edit this guide.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>
            Sign in
          </a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell
        projectId={projectId}
        guideId={guideId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <div className={styles.state}>Guide was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell
        projectId={projectId}
        guideId={guideId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <div className={styles.state}>
          <div>Could not load guide.</div>
          <Button variant="secondary" onClick={reload}>
            Retry
          </Button>
        </div>
      </PortalShell>
    );
  }

  return (
    <GuideEditorView
      detail={state.detail}
      guideDraft={guideDraft}
      stepDrafts={stepDrafts}
      blockContentDrafts={blockContentDrafts}
      publishState={publishState}
      locallyStalePublish={locallyStalePublish}
      notice={notice}
      embedCopyFallback={embedCopyFallback}
      busyAction={busyAction}
      publishBusyAction={publishBusyAction}
      projectId={projectId}
      guideId={guideId}
      onGuideDraftChange={setGuideDraft}
      onStepDraftChange={(stepId, draft) =>
        setStepDrafts((current) => ({ ...current, [stepId]: draft }))
      }
      onBlockContentDraftChange={(blockId, draft) =>
        setBlockContentDrafts((current) => ({ ...current, [blockId]: draft }))
      }
      onSaveGuide={saveGuideDraft}
      onSaveStep={saveStepDraft}
      onSaveBlock={saveBlockDraft}
      screenshotAssets={screenshotAssets}
      screenshotAssetsError={screenshotAssetsError}
      activeScreenshotPickerBlockId={activeScreenshotPickerBlockId}
      onOpenScreenshotPicker={openScreenshotPicker}
      onCloseScreenshotPicker={() => setActiveScreenshotPickerBlockId(null)}
      onSaveScreenshot={saveScreenshot}
      onUploadScreenshot={uploadScreenshot}
      onAddHighlight={addHighlight}
      onRemoveHighlight={removeHighlight}
      onAddBlock={addBlock}
      onMoveBlock={moveBlock}
      onDeleteBlock={deleteBlock}
      onPublish={publishCurrent}
      onRevokePublish={revokeCurrent}
      onUpdatePublishAccess={updateCurrentPublishAccess}
      onUpdatePublishPassword={updateCurrentPublishPassword}
      onCopyPublicLink={copyCurrent}
      onCopyEmbedCode={(publicUrl) =>
        copyCurrentEmbed(publicUrl, state.detail.edition.title)
      }
      onCopyMarkdown={copyMarkdown}
      onDownloadMarkdown={downloadMarkdown}
      onDownloadHtmlZip={downloadHtmlZip}
      onRetryPublishStatus={reloadPublishStatus}
      onChangeLifecycle={changeLifecycle}
      isDefaultVersion={isDefaultVersion}
      performLogout={performLogout}
      navigate={navigate}
      versionSlug={versionSlug}
    />
  );
};

const PortalShell = ({
  children,
  projectId,
  guideId,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  projectId: string;
  guideId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <div className={styles.page}>
    <PortalTopbar
      context={`${projectId} / ${guideId}`}
      performLogout={performLogout}
      navigate={navigate}
    />
    <main className={styles.main}>{children}</main>
  </div>
);

const GuideEditorView = ({
  detail,
  guideDraft,
  stepDrafts,
  blockContentDrafts,
  publishState,
  locallyStalePublish,
  notice,
  embedCopyFallback,
  busyAction,
  publishBusyAction,
  projectId,
  guideId,
  onGuideDraftChange,
  onStepDraftChange,
  onBlockContentDraftChange,
  onSaveGuide,
  onSaveStep,
  onSaveBlock,
  screenshotAssets,
  screenshotAssetsError,
  activeScreenshotPickerBlockId,
  onOpenScreenshotPicker,
  onCloseScreenshotPicker,
  onSaveScreenshot,
  onUploadScreenshot,
  onAddHighlight,
  onRemoveHighlight,
  onAddBlock,
  onMoveBlock,
  onDeleteBlock,
  onPublish,
  onRevokePublish,
  onUpdatePublishAccess,
  onUpdatePublishPassword,
  onCopyPublicLink,
  onCopyEmbedCode,
  onCopyMarkdown,
  onDownloadMarkdown,
  onDownloadHtmlZip,
  onRetryPublishStatus,
  onChangeLifecycle,
  isDefaultVersion,
  performLogout,
  navigate,
  versionSlug,
}: {
  detail: GuideDetail;
  guideDraft: GuideDraft;
  stepDrafts: Record<string, StepDraft>;
  blockContentDrafts: Record<string, BlockContentDraft>;
  publishState: PublishState;
  locallyStalePublish: boolean;
  notice: string | null;
  embedCopyFallback: string | null;
  busyAction: string | null;
  publishBusyAction: string | null;
  projectId: string;
  guideId: string;
  onGuideDraftChange: (draft: GuideDraft) => void;
  onStepDraftChange: (stepId: string, draft: StepDraft) => void;
  onBlockContentDraftChange: (
    blockId: string,
    draft: BlockContentDraft,
  ) => void;
  onSaveGuide: () => void;
  onSaveStep: (step: GuideStep) => void;
  onSaveBlock: (block: GuideBlock) => void;
  screenshotAssets: GuideSourceCaptureAsset[];
  screenshotAssetsError: boolean;
  activeScreenshotPickerBlockId: string | null;
  onOpenScreenshotPicker: (block: GuideBlock) => void;
  onCloseScreenshotPicker: () => void;
  onSaveScreenshot: (block: GuideBlock, captureAssetId: string | null) => void;
  onUploadScreenshot: (block: GuideBlock, file: File) => void;
  onAddHighlight: (block: GuideBlock) => void;
  onRemoveHighlight: (block: GuideBlock, annotationIndex: number) => void;
  onAddBlock: (
    blockType: "step" | "header" | "paragraph" | "tip" | "alert" | "divider",
    afterBlock?: GuideBlock,
  ) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (block: GuideBlock) => void;
  onPublish: () => void;
  onRevokePublish: () => void;
  onUpdatePublishAccess: (input: UpdateGuidePublishAccessInput) => void;
  onUpdatePublishPassword: (input: UpdateGuidePublishPasswordInput) => void;
  onCopyPublicLink: (publicUrl: string) => void;
  onCopyEmbedCode: (publicUrl: string) => void;
  onCopyMarkdown: () => void;
  onDownloadMarkdown: () => void;
  onDownloadHtmlZip: () => void;
  onRetryPublishStatus: () => void;
  onChangeLifecycle: () => void;
  isDefaultVersion: boolean;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  versionSlug?: string;
}) => {
  const sortedBlocks = useMemo(
    () => sortBlocks(detail.guide_blocks),
    [detail.guide_blocks],
  );
  const [activeScreenshotId, setActiveScreenshotId] = useState<string | null>(
    null,
  );
  const readOnly = detail.edition.status !== "draft";
  const assetsById = useMemo(
    () =>
      new Map(detail.source_capture_assets.map((asset) => [asset.id, asset])),
    [detail.source_capture_assets],
  );
  const screenshotImages = useMemo(
    () => screenshotImagesFromBlocks(sortedBlocks, assetsById, stepDrafts),
    [assetsById, sortedBlocks, stepDrafts],
  );

  useEffect(() => {
    if (
      activeScreenshotId &&
      !screenshotImages.some((image) => image.id === activeScreenshotId)
    ) {
      setActiveScreenshotId(null);
    }
  }, [activeScreenshotId, screenshotImages]);

  return (
    <PortalShell
      projectId={projectId}
      guideId={guideId}
      performLogout={performLogout}
      navigate={navigate}
    >
      <section className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.eyebrow}>Guide editor</div>
            <h1 className={styles.title}>{detail.edition.title}</h1>
            {detail.edition.description ? (
              <p className={styles.description}>{detail.edition.description}</p>
            ) : null}
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              disabled={
                busyAction === "export-copy" ||
                busyAction === "export-download" ||
                busyAction === "export-html"
              }
              onClick={onCopyMarkdown}
            >
              {busyAction === "export-copy"
                ? "Copying Markdown..."
                : "Copy Markdown"}
            </Button>
            <Button
              variant="secondary"
              disabled={
                busyAction === "export-copy" ||
                busyAction === "export-download" ||
                busyAction === "export-html"
              }
              onClick={onDownloadMarkdown}
            >
              {busyAction === "export-download"
                ? "Downloading Markdown..."
                : "Download Markdown"}
            </Button>
            <Button
              variant="secondary"
              disabled={
                busyAction === "export-copy" ||
                busyAction === "export-download" ||
                busyAction === "export-html"
              }
              onClick={onDownloadHtmlZip}
            >
              {busyAction === "export-html"
                ? "Exporting HTML..."
                : "Export HTML"}
            </Button>
            <a
              className={`${buttonVariants({ variant: "secondary" })} ${styles.previewLink}`}
              href={guidePreviewUrl(projectId, guideId, versionSlug)}
            >
              Preview guide
            </a>
            <Badge
              variant={detail.edition.status === "draft" ? "warning" : "success"}
            >
              {detail.edition.status}
            </Badge>
            <Button
              variant={readOnly ? "secondary" : "destructive"}
              disabled={busyAction === "lifecycle"}
              onClick={onChangeLifecycle}
            >
              {readOnly ? "Restore guide" : "Archive guide"}
            </Button>
          </div>
        </div>
        {readOnly ? (
          <div className={styles.notice}>Archived guides are read-only.</div>
        ) : null}
        {notice ? <div className={styles.notice}>{notice}</div> : null}
      </section>

      <div className={styles.content}>
        <div className={styles.panelStack}>
          <PublishPanel
            state={publishState}
            readOnly={readOnly}
            publishingDeferred={!isDefaultVersion && publishState.status === "loaded" && !publishState.response.publish_link}
            canPublish={isDefaultVersion}
            busyAction={publishBusyAction}
            guideUpdatedAt={detail.edition.updated_at}
            locallyStale={locallyStalePublish}
            onPublish={onPublish}
            onRevoke={onRevokePublish}
            onUpdateAccess={onUpdatePublishAccess}
            onUpdatePassword={onUpdatePublishPassword}
            onCopyPublicLink={onCopyPublicLink}
            onCopyEmbedCode={onCopyEmbedCode}
            embedCopyFallback={embedCopyFallback}
            onRetry={onRetryPublishStatus}
          />
          <section className={styles.panel} aria-labelledby="metadata-heading">
            <h2 className={styles.sectionTitle} id="metadata-heading">
              Guide metadata
            </h2>
            <Label className={styles.field}>
              <span>Guide title</span>
              <Input
                value={guideDraft.title}
                disabled={readOnly || busyAction === "guide"}
                onChange={(event) =>
                  onGuideDraftChange({
                    ...guideDraft,
                    title: event.target.value,
                  })
                }
              />
            </Label>
            <Label className={styles.field}>
              <span>Guide description</span>
              <Textarea
                value={guideDraft.description}
                disabled={readOnly || busyAction === "guide"}
                rows={5}
                onChange={(event) =>
                  onGuideDraftChange({
                    ...guideDraft,
                    description: event.target.value,
                  })
                }
              />
            </Label>
            <Button
              disabled={readOnly || busyAction === "guide"}
              onClick={onSaveGuide}
            >
              Save guide
            </Button>
          </section>
        </div>

        <section className={styles.panel} aria-labelledby="blocks-heading">
          <h2 className={styles.sectionTitle} id="blocks-heading">
            Guide blocks
          </h2>
          {sortedBlocks.length === 0 ? (
            <div className={styles.empty}>
              This guide does not have any blocks yet.
            </div>
          ) : (
            <div className={styles.blocks}>
              {sortedBlocks.map((block, index) => (
                <GuideBlockEditor
                  key={block.id}
                  block={block}
                  blockNumber={index + 1}
                  isFirst={index === 0}
                  isLast={index === sortedBlocks.length - 1}
                  readOnly={readOnly}
                  busyAction={busyAction}
                  draft={block.step ? stepDrafts[block.step.id] : undefined}
                  contentDraft={blockContentDrafts[block.id]}
                  sourceAsset={assetForBlock(block, assetsById)}
                  screenshotAssets={screenshotAssets}
                  screenshotAssetsError={screenshotAssetsError}
                  screenshotPickerOpen={
                    activeScreenshotPickerBlockId === block.id
                  }
                  onDraftChange={onStepDraftChange}
                  onContentDraftChange={onBlockContentDraftChange}
                  onSaveStep={onSaveStep}
                  onSaveBlock={onSaveBlock}
                  onOpenScreenshotPicker={onOpenScreenshotPicker}
                  onCloseScreenshotPicker={onCloseScreenshotPicker}
                  onSaveScreenshot={onSaveScreenshot}
                  onUploadScreenshot={onUploadScreenshot}
                  onAddHighlight={onAddHighlight}
                  onRemoveHighlight={onRemoveHighlight}
                  onAddBlock={onAddBlock}
                  onMoveBlock={onMoveBlock}
                  onDeleteBlock={onDeleteBlock}
                  onOpenScreenshot={setActiveScreenshotId}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      <GuideScreenshotViewer
        images={screenshotImages}
        activeImageId={activeScreenshotId}
        onActiveImageChange={setActiveScreenshotId}
        onClose={() => setActiveScreenshotId(null)}
      />
    </PortalShell>
  );
};

const formatPublishedAt = (value: string) => {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
};

const isExpiredPublishLink = (expiresAt: string | null) => {
  if (!expiresAt) {
    return false;
  }

  const timestamp = new Date(expiresAt).getTime();
  return Number.isFinite(timestamp) && timestamp <= Date.now();
};

const formatExpiryInputValue = (expiresAt: string | null) => {
  if (!expiresAt) {
    return "";
  }

  const date = new Date(expiresAt);
  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
};

const expiryInputToIso = (value: string) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const PublishPanel = ({
  state,
  readOnly,
  publishingDeferred,
  canPublish,
  busyAction,
  guideUpdatedAt,
  locallyStale,
  onPublish,
  onRevoke,
  onUpdateAccess,
  onUpdatePassword,
  onCopyPublicLink,
  onCopyEmbedCode,
  embedCopyFallback,
  onRetry,
}: {
  state: PublishState;
  readOnly: boolean;
  publishingDeferred: boolean;
  canPublish: boolean;
  busyAction: string | null;
  guideUpdatedAt: string;
  locallyStale: boolean;
  onPublish: () => void;
  onRevoke: () => void;
  onUpdateAccess: (input: UpdateGuidePublishAccessInput) => void;
  onUpdatePassword: (input: UpdateGuidePublishPasswordInput) => void;
  onCopyPublicLink: (publicUrl: string) => void;
  onCopyEmbedCode: (publicUrl: string) => void;
  embedCopyFallback: string | null;
  onRetry: () => void;
}) => {
  const [expiryInput, setExpiryInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const isBusy = busyAction !== null;
  const activeLink =
    state.status === "loaded" &&
    state.response.publish_link?.status === "active"
      ? state.response.publish_link
      : null;
  const publishedArtifact =
    state.status === "loaded" ? state.response.published_artifact : null;
  const publishedAt = publishedArtifact
    ? formatPublishedAt(publishedArtifact.published_at)
    : null;
  const stale = Boolean(
    activeLink &&
    publishedArtifact &&
    (locallyStale ||
      isDateAfter(guideUpdatedAt, publishedArtifact.published_at)),
  );
  const publishLabel =
    isBusy && busyAction === "publish" ? "Publishing..." : "Publish guide";
  const republishLabel =
    isBusy && busyAction === "publish" ? "Republishing..." : "Republish";
  const revokeLabel =
    isBusy && busyAction === "revoke" ? "Revoking..." : "Revoke link";
  const copyLabel =
    isBusy && busyAction === "copy" ? "Copying..." : "Copy link";
  const copyEmbedLabel =
    isBusy && busyAction === "copy_embed" ? "Copying..." : "Copy embed code";
  const accessLabel = isBusy && busyAction === "access" ? "Updating..." : null;
  const passwordLabel =
    isBusy && busyAction === "password"
      ? "Updating..."
      : activeLink?.password_protected
        ? "Update password"
        : "Set password";
  const expired = activeLink
    ? isExpiredPublishLink(activeLink.expires_at)
    : false;
  const canCopyEmbed = Boolean(
    activeLink && activeLink.visibility === "public" && !expired,
  );
  const accessText =
    activeLink?.visibility === "restricted"
      ? "Public access is off"
      : expired
        ? "Public link has expired"
        : "Public access is on";
  const expiryDisplay = activeLink?.expires_at
    ? formatPublishedAt(activeLink.expires_at)
    : null;

  return (
    <section className={styles.panel} aria-labelledby="publishing-heading">
      <h2 className={styles.sectionTitle} id="publishing-heading">
        Publishing
      </h2>
      {state.status === "loading" ? (
        <div className={styles.publishText}>Loading publishing status...</div>
      ) : null}
      {state.status === "error" ? (
        <div className={styles.publishStack}>
          <div className={styles.publishText}>
            Could not load publishing status.
          </div>
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
      {state.status === "loaded" && !activeLink ? (
        <div className={styles.publishStack}>
          <div className={styles.publishText}>This guide is not published.</div>
          {publishingDeferred ? (
            <p className={styles.publishNote}>
              Publishing from a named Project Version is deferred until publication sequencing is available.
            </p>
          ) : (
            <>
              <p className={styles.publishNote}>
                Publishing creates a public read-only snapshot.
              </p>
              <Button disabled={readOnly || isBusy || !canPublish} onClick={onPublish}>
                {publishLabel}
              </Button>
            </>
          )}
        </div>
      ) : null}
      {activeLink && publishedArtifact ? (
        <div className={styles.publishStack}>
          <div className={styles.publishText}>Public guide is live</div>
          {publishedAt ? (
            <div className={styles.publishNote}>
              Published version {publishedArtifact.version_number} on{" "}
              {publishedAt}
            </div>
          ) : (
            <div className={styles.publishNote}>
              Published version {publishedArtifact.version_number}
            </div>
          )}
          {stale ? (
            <div className={styles.staleNotice}>
              Draft has changes not yet published.
            </div>
          ) : null}
          <div className={styles.accessPanel}>
            <div>
              <div className={styles.publishText}>{accessText}</div>
              <p className={styles.publishNote}>
                {expiryDisplay
                  ? `Expires on ${expiryDisplay}`
                  : "No expiry is set."}
              </p>
            </div>
            <div className={styles.publishActions}>
              {activeLink.visibility === "public" ? (
                <Button
                  variant="secondary"
                  disabled={readOnly || isBusy}
                  onClick={() =>
                    onUpdateAccess({
                      visibility: "restricted",
                      expires_at: null,
                    })
                  }
                >
                  {accessLabel ?? "Disable public access"}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled={readOnly || isBusy}
                  onClick={() =>
                    onUpdateAccess({ visibility: "public", expires_at: null })
                  }
                >
                  {accessLabel ?? "Enable public access"}
                </Button>
              )}
            </div>
            <Label className={styles.compactField}>
              <span>Expiry</span>
              <Input
                type="datetime-local"
                value={
                  expiryInput || formatExpiryInputValue(activeLink.expires_at)
                }
                disabled={readOnly || isBusy}
                onChange={(event) => setExpiryInput(event.target.value)}
              />
            </Label>
            <div className={styles.publishActions}>
              <Button
                variant="secondary"
                disabled={
                  readOnly || isBusy || !(expiryInput || activeLink.expires_at)
                }
                onClick={() => {
                  onUpdateAccess({
                    visibility: activeLink.visibility,
                    expires_at: expiryInputToIso(
                      expiryInput ||
                        formatExpiryInputValue(activeLink.expires_at),
                    ),
                  });
                  setExpiryInput("");
                }}
              >
                {accessLabel ?? "Set expiry"}
              </Button>
              <Button
                variant="secondary"
                disabled={readOnly || isBusy || !activeLink.expires_at}
                onClick={() => {
                  onUpdateAccess({
                    visibility: activeLink.visibility,
                    expires_at: null,
                  });
                  setExpiryInput("");
                }}
              >
                Clear expiry
              </Button>
            </div>
          </div>
          <div className={styles.accessPanel}>
            <div>
              <div className={styles.publishText}>
                {activeLink.password_protected
                  ? "Password protection is on."
                  : "Password protection is off."}
              </div>
              <p className={styles.publishNote}>
                Updating the password requires existing viewers to unlock again.
              </p>
            </div>
            <Label className={styles.compactField}>
              <span>Publish link password</span>
              <Input
                type="password"
                value={passwordInput}
                disabled={readOnly || isBusy}
                onChange={(event) => setPasswordInput(event.target.value)}
              />
            </Label>
            <div className={styles.publishActions}>
              <Button
                variant="secondary"
                disabled={readOnly || isBusy || passwordInput.length === 0}
                onClick={() => {
                  onUpdatePassword({ password: passwordInput });
                  setPasswordInput("");
                }}
              >
                {passwordLabel}
              </Button>
              {activeLink.password_protected ? (
                <Button
                  variant="secondary"
                  disabled={readOnly || isBusy}
                  onClick={() => {
                    onUpdatePassword({ password: null });
                    setPasswordInput("");
                  }}
                >
                  Clear password
                </Button>
              ) : null}
            </div>
          </div>
          <div className={styles.publicUrl}>{activeLink.public_url}</div>
          <div className={styles.publishActions}>
            <Button
              variant="secondary"
              disabled={isBusy}
              onClick={() => onCopyPublicLink(activeLink.public_url)}
            >
              {copyLabel}
            </Button>
            {canCopyEmbed ? (
              <Button
                variant="secondary"
                disabled={isBusy}
                onClick={() => onCopyEmbedCode(activeLink.public_url)}
              >
                {copyEmbedLabel}
              </Button>
            ) : null}
            <a
              className={`${buttonVariants({ variant: "secondary" })} ${styles.previewLink}`}
              href={activeLink.public_url}
              target="_blank"
              rel="noreferrer"
            >
              Open public guide
            </a>
            {canPublish ? (
              <Button disabled={readOnly || isBusy} onClick={onPublish}>
                {republishLabel}
              </Button>
            ) : null}
            <Button variant="destructive" disabled={isBusy} onClick={onRevoke}>
              {revokeLabel}
            </Button>
          </div>
          {embedCopyFallback ? (
            <div className={styles.publicUrl}>{embedCopyFallback}</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

const screenshotImagesFromBlocks = (
  blocks: GuideBlock[],
  assetsById: Map<string, GuideSourceCaptureAsset>,
  stepDrafts: Record<string, StepDraft>,
): GuideScreenshotViewerImage[] =>
  blocks.flatMap((block, index) => {
    const asset = assetForBlock(block, assetsById);

    if (block.block_type !== "step" || !block.step || !asset) {
      return [];
    }

    const stepNumber = index + 1;
    const draftTitle = stepDrafts[block.step.id]?.title;

    return [
      {
        id: screenshotViewerImageId(block, asset),
        sourceAssetId: asset.id,
        src: resolveApiAssetUrl(asset.file_url),
        alt: assetAltText(asset, stepNumber),
        title:
          draftTitle ||
          block.step.title ||
          asset.page_title ||
          asset.file.original_name ||
          `Step ${stepNumber} screenshot`,
      },
    ];
  });

const GuideBlockEditor = ({
  block,
  blockNumber,
  isFirst,
  isLast,
  readOnly,
  busyAction,
  draft,
  contentDraft,
  sourceAsset,
  screenshotAssets,
  screenshotAssetsError,
  screenshotPickerOpen,
  onDraftChange,
  onContentDraftChange,
  onSaveStep,
  onSaveBlock,
  onOpenScreenshotPicker,
  onCloseScreenshotPicker,
  onSaveScreenshot,
  onUploadScreenshot,
  onAddHighlight,
  onRemoveHighlight,
  onAddBlock,
  onMoveBlock,
  onDeleteBlock,
  onOpenScreenshot,
}: {
  block: GuideBlock;
  blockNumber: number;
  isFirst: boolean;
  isLast: boolean;
  readOnly: boolean;
  busyAction: string | null;
  draft?: StepDraft;
  contentDraft?: BlockContentDraft;
  sourceAsset?: GuideSourceCaptureAsset;
  screenshotAssets: GuideSourceCaptureAsset[];
  screenshotAssetsError: boolean;
  screenshotPickerOpen: boolean;
  onDraftChange: (stepId: string, draft: StepDraft) => void;
  onContentDraftChange: (blockId: string, draft: BlockContentDraft) => void;
  onSaveStep: (step: GuideStep) => void;
  onSaveBlock: (block: GuideBlock) => void;
  onOpenScreenshotPicker: (block: GuideBlock) => void;
  onCloseScreenshotPicker: () => void;
  onSaveScreenshot: (block: GuideBlock, captureAssetId: string | null) => void;
  onUploadScreenshot: (block: GuideBlock, file: File) => void;
  onAddHighlight: (block: GuideBlock) => void;
  onRemoveHighlight: (block: GuideBlock, annotationIndex: number) => void;
  onAddBlock: (
    blockType: "step" | "header" | "paragraph" | "tip" | "alert" | "divider",
    afterBlock?: GuideBlock,
  ) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (block: GuideBlock) => void;
  onOpenScreenshot: (imageId: string) => void;
}) => {
  const step = block.step;
  const actionLabel = step
    ? "step"
    : labelForBlockType(block.block_type).toLowerCase();
  const actionBusy = busyAction !== null;
  const uploadBusy = busyAction === `upload-screenshot:${block.id}`;
  const pickerLoading = busyAction === `screenshots:${block.id}`;
  const annotationsBusy = busyAction === `annotations:${block.id}`;
  const annotations = annotationsFromBlock(block);
  const editableContentBlock =
    block.block_type === "header" ||
    block.block_type === "paragraph" ||
    block.block_type === "tip" ||
    block.block_type === "alert";

  return (
    <article className={styles.block}>
      <div className={styles.blockHeader}>
        <div className={styles.blockIndex}>{blockNumber}</div>
        <div>
          <div className={styles.blockType}>{block.block_type}</div>
          {sourceAsset ? (
            <div className={styles.blockMeta}>
              {sourceAsset.page_title ??
                sourceAsset.file.original_name ??
                "Source screenshot"}
            </div>
          ) : null}
        </div>
        <div className={styles.blockActions}>
          <Button
            variant="secondary"
            size="icon"
            aria-label={`Move ${actionLabel} ${blockNumber} up`}
            disabled={readOnly || actionBusy || isFirst}
            onClick={() => onMoveBlock(block.id, -1)}
          >
            <ArrowUp aria-hidden="true" size={16} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={`Move ${actionLabel} ${blockNumber} down`}
            disabled={readOnly || actionBusy || isLast}
            onClick={() => onMoveBlock(block.id, 1)}
          >
            <ArrowDown aria-hidden="true" size={16} />
          </Button>
          <Button
            variant="destructive"
            disabled={readOnly || actionBusy}
            onClick={() => onDeleteBlock(block)}
          >
            Delete {actionLabel} {blockNumber}
          </Button>
        </div>
      </div>

      {step && draft ? (
        <div className={styles.stepForm}>
          <Label className={styles.field}>
            <span>Step title</span>
            <Input
              aria-label={`Step title ${blockNumber}`}
              value={draft.title}
              disabled={readOnly || busyAction === `step:${step.id}`}
              onChange={(event) =>
                onDraftChange(step.id, {
                  ...draft,
                  title: event.target.value,
                })
              }
            />
          </Label>
          <Label className={styles.field}>
            <span>Step body</span>
            <Textarea
              aria-label={`Step body ${blockNumber}`}
              value={draft.body}
              disabled={readOnly || busyAction === `step:${step.id}`}
              rows={4}
              onChange={(event) =>
                onDraftChange(step.id, {
                  ...draft,
                  body: event.target.value,
                })
              }
            />
          </Label>
          <Button
            variant="secondary"
            disabled={readOnly || busyAction === `step:${step.id}`}
            onClick={() => onSaveStep(step)}
          >
            Save step {blockNumber}
          </Button>
          {sourceAsset ? (
            <div className={styles.media}>
              <button
                className={styles.mediaButton}
                type="button"
                aria-label={`Open screenshot for step ${blockNumber}`}
                onClick={() =>
                  onOpenScreenshot(screenshotViewerImageId(block, sourceAsset))
                }
              >
                <span className={styles.annotationFrame}>
                  <img
                    className={styles.screenshot}
                    src={resolveApiAssetUrl(sourceAsset.file_url)}
                    alt={assetAltText(sourceAsset, blockNumber)}
                  />
                  <ScreenshotAnnotationOverlay annotations={annotations} />
                </span>
              </button>
            </div>
          ) : null}
          <div className={styles.mediaActions}>
            <Label
              className={`${buttonVariants({ variant: "secondary" })} ${styles.uploadButton}`}
            >
              {uploadBusy
                ? `Uploading screenshot for step ${blockNumber}`
                : `Upload screenshot for step ${blockNumber}`}
              <input
                aria-label={`Upload screenshot for step ${blockNumber}`}
                className={styles.fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={readOnly || actionBusy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";

                  if (file) {
                    onUploadScreenshot(block, file);
                  }
                }}
              />
            </Label>
            <Button
              variant="secondary"
              disabled={readOnly || actionBusy}
              onClick={() => onOpenScreenshotPicker(block)}
            >
              {sourceAsset
                ? `Change screenshot for step ${blockNumber}`
                : `Attach screenshot for step ${blockNumber}`}
            </Button>
            {sourceAsset ? (
              <Button
                variant="secondary"
                disabled={readOnly || actionBusy}
                onClick={() => onSaveScreenshot(block, null)}
              >
                Remove screenshot for step {blockNumber}
              </Button>
            ) : null}
            {sourceAsset ? (
              <Button
                variant="secondary"
                disabled={
                  readOnly ||
                  actionBusy ||
                  annotationsBusy ||
                  annotations.length >= 10
                }
                onClick={() => onAddHighlight(block)}
              >
                Add highlight for step {blockNumber}
              </Button>
            ) : null}
            {sourceAsset
              ? annotations.map((annotation, index) => (
                  <Button
                    variant="secondary"
                    key={annotation.id}
                    disabled={readOnly || actionBusy || annotationsBusy}
                    onClick={() => onRemoveHighlight(block, index)}
                  >
                    Remove highlight {index + 1} from step {blockNumber}
                  </Button>
                ))
              : null}
          </div>
          {screenshotPickerOpen ? (
            <div
              className={styles.screenshotPicker}
              aria-label={`Screenshot choices for step ${blockNumber}`}
            >
              <div className={styles.screenshotPickerHeader}>
                <span>Choose screenshot</span>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={`Close screenshot choices for step ${blockNumber}`}
                  onClick={onCloseScreenshotPicker}
                >
                  <X aria-hidden="true" size={16} />
                </Button>
              </div>
              {screenshotAssets.length === 0 ? (
                screenshotAssetsError ? (
                  <div className={styles.pickerState} role="status">
                    <span>Could not load screenshots.</span>
                    <Button
                      variant="secondary"
                      disabled={readOnly || actionBusy}
                      onClick={() => onOpenScreenshotPicker(block)}
                    >
                      Retry loading screenshots for step {blockNumber}
                    </Button>
                  </div>
                ) : pickerLoading ? (
                  <div className={styles.pickerState} role="status">
                    Loading screenshots...
                  </div>
                ) : (
                  <div className={styles.empty}>No screenshots available.</div>
                )
              ) : (
                <div className={styles.screenshotChoices}>
                  {screenshotAssets.map((asset) => {
                    const displayName = assetDisplayName(asset);
                    const capturedAt = formatCapturedAt(asset.captured_at);
                    const current = asset.id === block.step?.display_capture_asset_id;
                    const fileName =
                      asset.file.original_name &&
                      asset.file.original_name !== displayName
                        ? asset.file.original_name
                        : null;

                    return (
                      <button
                        className={styles.screenshotChoice}
                        type="button"
                        key={asset.id}
                        aria-label={`${current ? "Current screenshot" : "Select screenshot"} ${displayName} for step ${blockNumber}`}
                        disabled={readOnly || actionBusy || current}
                        onClick={() => onSaveScreenshot(block, asset.id)}
                      >
                        <img
                          src={resolveApiAssetUrl(asset.file_url)}
                          alt=""
                          aria-hidden="true"
                        />
                        <span className={styles.screenshotChoiceTitle}>
                          {displayName}
                        </span>
                        {fileName ? (
                          <span className={styles.screenshotChoiceMeta}>
                            {fileName}
                          </span>
                        ) : null}
                        {capturedAt ? (
                          <span className={styles.screenshotChoiceMeta}>
                            Captured {capturedAt}
                          </span>
                        ) : null}
                        {current ? (
                          <span className={styles.currentBadge}>
                            Current screenshot
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : editableContentBlock && contentDraft ? (
        <div className={styles.stepForm}>
          {block.block_type !== "paragraph" ? (
            <Label className={styles.field}>
              <span>
                {block.block_type === "header"
                  ? "Header title"
                  : `${block.block_type} title`}
              </span>
              <Input
                aria-label={`${labelForBlockType(block.block_type)} title ${blockNumber}`}
                value={contentDraft.title}
                disabled={readOnly || busyAction === `block:${block.id}`}
                onChange={(event) =>
                  onContentDraftChange(block.id, {
                    ...contentDraft,
                    title: event.target.value,
                  })
                }
              />
            </Label>
          ) : null}
          {block.block_type !== "header" ? (
            <Label className={styles.field}>
              <span>{labelForBlockType(block.block_type)} body</span>
              <Textarea
                aria-label={`${labelForBlockType(block.block_type)} body ${blockNumber}`}
                value={contentDraft.body}
                disabled={readOnly || busyAction === `block:${block.id}`}
                rows={4}
                onChange={(event) =>
                  onContentDraftChange(block.id, {
                    ...contentDraft,
                    body: event.target.value,
                  })
                }
              />
            </Label>
          ) : null}
          <Button
            variant="secondary"
            disabled={readOnly || busyAction === `block:${block.id}`}
            onClick={() => onSaveBlock(block)}
          >
            Save {block.block_type} {blockNumber}
          </Button>
        </div>
      ) : block.block_type === "divider" ? (
        <div className={styles.dividerBlock}>
          <hr aria-label={`Guide section divider ${blockNumber}`} />
        </div>
      ) : (
        <div className={styles.empty}>This block is not editable yet.</div>
      )}
      {!readOnly ? (
        <BlockInsertControls
          blockNumber={blockNumber}
          disabled={actionBusy}
          onAdd={(blockType) => onAddBlock(blockType, block)}
        />
      ) : null}
    </article>
  );
};

const ScreenshotAnnotationOverlay = ({
  annotations,
}: {
  annotations: GuideScreenshotAnnotation[];
}) => {
  if (annotations.length === 0) {
    return null;
  }

  return (
    <span className={styles.annotationOverlay} aria-hidden="true">
      {annotations.map((annotation) => (
        <span
          className={styles.annotationHighlight}
          data-testid={`guide-highlight-${annotation.id}`}
          key={annotation.id}
          style={{
            left: annotationPercent(annotation.x),
            top: annotationPercent(annotation.y),
            width: annotationPercent(annotation.width),
            height: annotationPercent(annotation.height),
          }}
        />
      ))}
    </span>
  );
};

const labelForBlockType = (blockType: GuideBlock["block_type"]) => {
  switch (blockType) {
    case "header":
      return "Header";
    case "tip":
      return "Tip";
    case "alert":
      return "Alert";
    case "step":
      return "Step";
    case "paragraph":
      return "Paragraph";
    case "capture":
      return "Capture";
    case "divider":
      return "Divider";
    case "gif":
      return "GIF";
  }
};

const BlockInsertControls = ({
  blockNumber,
  disabled,
  onAdd,
}: {
  blockNumber: number;
  disabled: boolean;
  onAdd: (
    blockType: "step" | "header" | "paragraph" | "tip" | "alert" | "divider",
  ) => void;
}) => (
  <div
    className={styles.insertControls}
    aria-label={`Add block after block ${blockNumber}`}
  >
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("step")}
    >
      Add step after block {blockNumber}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("header")}
    >
      Add header after block {blockNumber}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("paragraph")}
    >
      Add paragraph after block {blockNumber}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("tip")}
    >
      Add tip after block {blockNumber}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("alert")}
    >
      Add alert after block {blockNumber}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("divider")}
    >
      Add divider after block {blockNumber}
    </Button>
  </div>
);
