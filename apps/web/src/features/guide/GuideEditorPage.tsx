import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import {
  ApiClientError,
  archiveGuide,
  createGuideBlock,
  deleteGuideBlock,
  exportGuideHtmlZip,
  exportGuideMarkdown,
  getGuideDetail,
  listProjectScreenshotAssets,
  reorderGuideBlocks,
  restoreGuide,
  updateGuide,
  updateGuideBlock,
  updateGuideBlockAnnotations,
  updateGuideBlockScreenshot,
  uploadGuideBlockScreenshot,
  updateGuideStep,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { GuideEditorWorkbench, type GuideDraft } from "./GuideEditorWorkbench";
import {
  blockContentDraftsFromBlocks,
  defaultBlockInput,
  mergeAssetIntoDetail,
  sortBlocks,
  stepDraftsFromBlocks,
  updateBlockInBlocks,
  updateStepInBlocks,
  type BlockContentDraft,
  type StepDraft,
} from "./guideEditorHelpers";
import type {
  GuideBlock,
  GuideDetail,
  GuideMarkdownExport,
  GuideSourceCaptureAsset,
  GuideStep,
  UpdateGuideBlockAnnotationsInput,
} from "./types";
import styles from "./GuideEditorPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; detail: GuideDetail }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type VersionBound<T> = T extends (
  ...args: [...infer Args, string]
) => infer Result
  ? (...args: Args) => Result
  : never;

export type GuideEditorPageProps = {
  projectId: string;
  guideId: string;
  loadDetail?: (projectId: string, guideId: string) => Promise<GuideDetail>;
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
  changeEditionStatus?: (
    command: "archive" | "restore",
    projectId: string,
    guideId: string,
    projectVersionId: string,
    expectedEditionVersion: number,
  ) => Promise<{ edition: GuideDetail["edition"] }>;
};

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

export const GuideEditorPage = ({
  projectId,
  guideId,
  projectVersionId,
  loadDetail = (id, artifactId) =>
    getGuideDetail(id, artifactId, projectVersionId),
  copyText = defaultCopyText,
  exportMarkdown = (id, artifactId) =>
    exportGuideMarkdown(id, artifactId, projectVersionId),
  exportHtmlZip = (id, artifactId) =>
    exportGuideHtmlZip(id, artifactId, projectVersionId),
  downloadTextFile = defaultDownloadTextFile,
  downloadBlobFile = defaultDownloadBlobFile,
  saveGuide = (id, artifactId, data) =>
    updateGuide(id, artifactId, data, projectVersionId),
  saveStep = (id, artifactId, stepId, data) =>
    updateGuideStep(id, artifactId, stepId, data, projectVersionId),
  createBlock = (id, artifactId, data) =>
    createGuideBlock(id, artifactId, data, projectVersionId),
  saveBlock = (id, artifactId, blockId, data) =>
    updateGuideBlock(id, artifactId, blockId, data, projectVersionId),
  loadScreenshotAssets = listProjectScreenshotAssets,
  saveBlockScreenshot = (id, artifactId, blockId, data) =>
    updateGuideBlockScreenshot(id, artifactId, blockId, data, projectVersionId),
  saveBlockAnnotations = (id, artifactId, blockId, data) =>
    updateGuideBlockAnnotations(
      id,
      artifactId,
      blockId,
      data,
      projectVersionId,
    ),
  uploadBlockScreenshot = (id, artifactId, blockId, input, expected) =>
    uploadGuideBlockScreenshot(
      id,
      artifactId,
      blockId,
      input,
      expected,
      projectVersionId,
    ),
  reorderBlocks = (id, artifactId, blockIds, expected) =>
    reorderGuideBlocks(id, artifactId, blockIds, expected, projectVersionId),
  removeBlock = (id, artifactId, blockId, expected) =>
    deleteGuideBlock(id, artifactId, blockId, expected, projectVersionId),
  currentPath = currentBrowserPath(),
  versionSlug,
  changeEditionStatus = (command, id, artifactId, versionId, expected) =>
    command === "archive"
      ? archiveGuide(id, artifactId, versionId, expected)
      : restoreGuide(id, artifactId, versionId, expected),
}: GuideEditorPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [guideDraft, setGuideDraft] = useState<GuideDraft>({
    title: "",
    description: "",
  });
  const [stepDrafts, setStepDrafts] = useState<Record<string, StepDraft>>({});
  const [blockContentDrafts, setBlockContentDrafts] = useState<
    Record<string, BlockContentDraft>
  >({});
  const [notice, setNotice] = useState<string | null>(null);
  const [conflict, setConflict] = useState<
    "edition_conflict" | "working_draft_conflict" | null
  >(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const aggregateMutationRef = useRef(false);
  const [screenshotAssets, setScreenshotAssets] = useState<
    GuideSourceCaptureAsset[]
  >([]);
  const [screenshotAssetsError, setScreenshotAssetsError] = useState(false);
  const [activeScreenshotPickerBlockId, setActiveScreenshotPickerBlockId] =
    useState<string | null>(null);
  const currentWorkingDraftVersion =
    state.status === "loaded" ? state.detail.working_draft.version : 0;
  const hasUnsavedChanges = useMemo(() => {
    if (state.status !== "loaded") return false;
    if (
      guideDraft.title !== state.detail.edition.title ||
      guideDraft.description !== (state.detail.edition.description ?? "")
    ) {
      return true;
    }
    return state.detail.guide_blocks.some((block) => {
      if (block.step) {
        const draft = stepDrafts[block.step.id];
        return Boolean(
          draft &&
          (draft.title !== block.step.title ||
            draft.body !== (block.step.body ?? "")),
        );
      }
      const draft = blockContentDrafts[block.id];
      return Boolean(
        draft &&
        (draft.title !== (block.title ?? "") ||
          draft.body !== (block.body ?? "")),
      );
    });
  }, [blockContentDrafts, guideDraft, state, stepDrafts]);

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
    setScreenshotAssets([]);
    setActiveScreenshotPickerBlockId(null);
  }, [projectId, guideId]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const reload = () => setReloadKey((key) => key + 1);

  const markNotEditable = () => {
    setNotice("Archived guides are read-only.");
    reload();
  };

  const handleMutationError = (error: unknown, fallback: string) => {
    if (isGuideNotEditable(error)) {
      markNotEditable();
      return;
    }

    if (
      error instanceof ApiClientError &&
      (error.type === "edition_conflict" ||
        error.type === "working_draft_conflict" ||
        error.type === "row_version_conflict")
    ) {
      const nextConflict =
        error.type === "edition_conflict"
          ? "edition_conflict"
          : "working_draft_conflict";
      setConflict(nextConflict);
      setNotice(
        nextConflict === "edition_conflict"
          ? "This Guide Edition changed elsewhere. Your local changes are still here."
          : "This Working Draft changed elsewhere. Your local changes are still here.",
      );
      return;
    }

    setNotice(fallback);
  };

  const reloadLatest = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "Reload the latest Guide and discard the unsaved local changes shown here?",
      )
    ) {
      return;
    }
    setConflict(null);
    setNotice(null);
    reload();
  };

  const runAggregateMutation = async <Result,>(
    _command: "publication",
    operation: () => Promise<Result>,
  ) => {
    if (aggregateMutationRef.current || busyAction !== null) {
      throw new Error("Another Guide change is still in progress");
    }
    aggregateMutationRef.current = true;
    setBusyAction("publication");
    try {
      return await operation();
    } finally {
      aggregateMutationRef.current = false;
      setBusyAction(null);
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
    setConflict(null);

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
    const previousStepDrafts =
      state.status === "loaded"
        ? stepDraftsFromBlocks(state.detail.guide_blocks)
        : {};
    const previousBlockDrafts =
      state.status === "loaded"
        ? blockContentDraftsFromBlocks(state.detail.guide_blocks)
        : {};
    setBusyAction(`create:${afterBlock?.id ?? "end"}:${blockType}`);
    setNotice(null);

    try {
      const response = await createBlock(projectId, guideId, {
        ...defaultBlockInput(
          blockType,
          afterBlock
            ? {
                placement: "after",
                guide_block_id: afterBlock.id,
              }
            : undefined,
        ),
        expected_working_draft_version:
          state.status === "loaded" ? state.detail.working_draft.version : 1,
      });
      patchDetail((detail) => ({
        ...detail,
        working_draft: response.working_draft,
        guide_blocks: response.guide_blocks,
      }));
      const nextStepDrafts = stepDraftsFromBlocks(response.guide_blocks);
      const nextBlockDrafts = blockContentDraftsFromBlocks(
        response.guide_blocks,
      );
      setStepDrafts((current) =>
        Object.fromEntries(
          Object.entries(nextStepDrafts).map(([id, nextDraft]) => {
            const currentDraft = current[id];
            const previousDraft = previousStepDrafts[id];
            const isDirty =
              currentDraft !== undefined &&
              previousDraft !== undefined &&
              (currentDraft.title !== previousDraft.title ||
                currentDraft.body !== previousDraft.body);
            return [id, isDirty ? currentDraft : nextDraft];
          }),
        ),
      );
      setBlockContentDrafts((current) =>
        Object.fromEntries(
          Object.entries(nextBlockDrafts).map(([id, nextDraft]) => {
            const currentDraft = current[id];
            const previousDraft = previousBlockDrafts[id];
            const isDirty =
              currentDraft !== undefined &&
              previousDraft !== undefined &&
              (currentDraft.title !== previousDraft.title ||
                currentDraft.body !== previousDraft.body);
            return [id, isDirty ? currentDraft : nextDraft];
          }),
        ),
      );
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
        {
          annotations,
          expected_working_draft_version: currentWorkingDraftVersion,
        },
      );
      patchDetail((detail) => ({
        ...detail,
        working_draft: response.working_draft,
        guide_blocks: updateBlockInBlocks(
          detail.guide_blocks,
          response.guide_block,
        ),
      }));
      setNotice("Highlights saved.");
    } catch (error: unknown) {
      handleMutationError(error, "Could not save highlights.");
    } finally {
      setBusyAction(null);
    }
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
      const response = await reorderBlocks(
        projectId,
        guideId,
        nextBlockIds,
        state.detail.working_draft.version,
      );
      patchDetail((detail) => ({
        ...detail,
        working_draft: response.working_draft,
        guide_blocks: response.guide_blocks,
      }));
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
      await removeBlock(
        projectId,
        guideId,
        block.id,
        currentWorkingDraftVersion,
      );
      reload();
    } catch (error: unknown) {
      handleMutationError(error, "Could not delete block.");
    } finally {
      setBusyAction(null);
    }
  };

  const changeLifecycle = async () => {
    if (state.status !== "loaded") return;
    const command =
      state.detail.edition.status === "draft" ? "archive" : "restore";
    if (command === "archive" && !window.confirm("Archive this guide edition?"))
      return;
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
    return <div className={styles.state}>Loading guide...</div>;
  }

  if (state.status === "unauthenticated") {
    return (
      <div className={styles.state}>
        <div>Sign in to edit this guide.</div>
        <a className={styles.stateLink} href={signInUrl(currentPath)}>
          Sign in
        </a>
      </div>
    );
  }

  if (state.status === "not_found") {
    return <div className={styles.state}>Guide was not found.</div>;
  }

  if (state.status === "error") {
    return (
      <div className={styles.state}>
        <div>Could not load guide.</div>
        <Button variant="secondary" onClick={reload}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <GuideEditorWorkbench
      detail={state.detail}
      guideDraft={guideDraft}
      stepDrafts={stepDrafts}
      blockContentDrafts={blockContentDrafts}
      notice={notice}
      conflict={conflict}
      hasUnsavedChanges={hasUnsavedChanges}
      busyAction={busyAction}
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
      onSaveAnnotations={saveAnnotations}
      onAddBlock={addBlock}
      onMoveBlock={moveBlock}
      onDeleteBlock={deleteBlock}
      onCopyMarkdown={copyMarkdown}
      onDownloadMarkdown={downloadMarkdown}
      onDownloadHtmlZip={downloadHtmlZip}
      onChangeLifecycle={changeLifecycle}
      onReloadLatest={reloadLatest}
      runAggregateMutation={runAggregateMutation}
      versionSlug={versionSlug}
    />
  );
};
