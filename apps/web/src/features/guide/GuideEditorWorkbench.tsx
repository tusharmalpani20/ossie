import { useEffect, useMemo, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button, buttonVariants } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { resolveApiAssetUrl } from "../../lib/api";
import { ArtifactPublishingPanel } from "../publish/ArtifactPublishingPanel";
import { GuideAnnotationEditor } from "./GuideAnnotationEditor";
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
  formatCapturedAt,
  screenshotViewerImageId,
  sortBlocks,
  type BlockContentDraft,
  type StepDraft,
} from "./guideEditorHelpers";
import type {
  GuideBlock,
  GuideDetail,
  GuideScreenshotAnnotation,
  GuideSourceCaptureAsset,
  GuideStep,
  UpdateGuideBlockAnnotationsInput,
} from "./types";
import styles from "./GuideEditorPage.module.css";

export type GuideDraft = {
  title: string;
  description: string;
};

const guidePreviewUrl = (
  projectId: string,
  guideId: string,
  versionSlug?: string,
) =>
  `/projects/${encodeURIComponent(projectId)}${versionSlug ? `/versions/${encodeURIComponent(versionSlug)}` : ""}/guides/${encodeURIComponent(guideId)}/preview`;

export const GuideEditorWorkbench = ({
  detail,
  guideDraft,
  stepDrafts,
  blockContentDrafts,
  notice,
  conflict,
  hasUnsavedChanges,
  busyAction,
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
  onSaveAnnotations,
  onAddBlock,
  onMoveBlock,
  onDeleteBlock,
  onCopyMarkdown,
  onDownloadMarkdown,
  onDownloadHtmlZip,
  onChangeLifecycle,
  onReloadLatest,
  runAggregateMutation,
  versionSlug,
}: {
  detail: GuideDetail;
  guideDraft: GuideDraft;
  stepDrafts: Record<string, StepDraft>;
  blockContentDrafts: Record<string, BlockContentDraft>;
  notice: string | null;
  conflict: "edition_conflict" | "working_draft_conflict" | null;
  hasUnsavedChanges: boolean;
  busyAction: string | null;
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
  onSaveAnnotations: (
    block: GuideBlock,
    annotations: UpdateGuideBlockAnnotationsInput["annotations"],
  ) => void;
  onAddBlock: (
    blockType: "step" | "header" | "paragraph" | "tip" | "alert" | "divider",
    afterBlock?: GuideBlock,
  ) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (block: GuideBlock) => void;
  onCopyMarkdown: () => void;
  onDownloadMarkdown: () => void;
  onDownloadHtmlZip: () => void;
  onChangeLifecycle: () => void;
  onReloadLatest: () => void;
  runAggregateMutation: <Result>(
    command: "publication",
    operation: () => Promise<Result>,
  ) => Promise<Result>;
  versionSlug?: string;
}) => {
  const sortedBlocks = useMemo(
    () => sortBlocks(detail.guide_blocks),
    [detail.guide_blocks],
  );
  const [activeScreenshotId, setActiveScreenshotId] = useState<string | null>(
    null,
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    sortedBlocks[0]?.id ?? null,
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

  useEffect(() => {
    if (
      selectedBlockId === null ||
      !sortedBlocks.some((block) => block.id === selectedBlockId)
    ) {
      setSelectedBlockId(sortedBlocks[0]?.id ?? null);
    }
  }, [selectedBlockId, sortedBlocks]);

  const selectedBlock =
    sortedBlocks.find((block) => block.id === selectedBlockId) ?? null;
  const selectedBlockIndex = selectedBlock
    ? sortedBlocks.findIndex((block) => block.id === selectedBlock.id)
    : -1;

  return (
    <div className={styles.main}>
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
            {versionSlug ? (
              <a
                className={`${buttonVariants({ variant: "secondary" })} ${styles.previewLink}`}
                href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/guides/${encodeURIComponent(guideId)}/revisions`}
              >
                Revision history
              </a>
            ) : null}
            <Badge
              variant={
                detail.edition.status === "draft" ? "warning" : "success"
              }
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
        {hasUnsavedChanges ? (
          <div className={styles.notice} role="status">
            Unsaved changes
          </div>
        ) : null}
        {notice ? (
          <div className={styles.notice} role="status">
            {notice}
            {conflict ? (
              <Button variant="secondary" onClick={onReloadLatest}>
                Reload latest
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className={styles.content}>
        <nav className={styles.outline} aria-labelledby="guide-outline-heading">
          <h2 className={styles.sectionTitle} id="guide-outline-heading">
            Guide outline
          </h2>
          {sortedBlocks.length === 0 ? (
            <p className={styles.outlineEmpty}>No blocks yet.</p>
          ) : (
            <ol className={styles.outlineList}>
              {sortedBlocks.map((block, index) => (
                <li key={block.id}>
                  <button
                    aria-label={`Edit ${labelForBlockType(block.block_type)} ${index + 1}`}
                    aria-current={
                      selectedBlockId === block.id ? "true" : undefined
                    }
                    className={styles.outlineButton}
                    type="button"
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <span>{index + 1}</span>
                    <span>
                      Edit {labelForBlockType(block.block_type)} {index + 1}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </nav>

        <section
          className={`${styles.panel} ${styles.documentCanvas}`}
          aria-labelledby="blocks-heading"
        >
          <h2 className={styles.sectionTitle} id="blocks-heading">
            Guide block
          </h2>
          {selectedBlock === null ? (
            <div className={styles.empty}>
              <p>This guide does not have any blocks yet.</p>
              {!readOnly ? (
                <BlockInsertControls
                  disabled={busyAction !== null}
                  onAdd={(blockType) => onAddBlock(blockType)}
                />
              ) : null}
            </div>
          ) : (
            <GuideBlockEditor
              block={selectedBlock}
              blockNumber={selectedBlockIndex + 1}
              isFirst={selectedBlockIndex === 0}
              isLast={selectedBlockIndex === sortedBlocks.length - 1}
              readOnly={readOnly}
              busyAction={busyAction}
              draft={
                selectedBlock.step
                  ? stepDrafts[selectedBlock.step.id]
                  : undefined
              }
              contentDraft={blockContentDrafts[selectedBlock.id]}
              sourceAsset={assetForBlock(selectedBlock, assetsById)}
              screenshotAssets={screenshotAssets}
              screenshotAssetsError={screenshotAssetsError}
              screenshotPickerOpen={
                activeScreenshotPickerBlockId === selectedBlock.id
              }
              onDraftChange={onStepDraftChange}
              onContentDraftChange={onBlockContentDraftChange}
              onSaveStep={onSaveStep}
              onSaveBlock={onSaveBlock}
              onOpenScreenshotPicker={onOpenScreenshotPicker}
              onCloseScreenshotPicker={onCloseScreenshotPicker}
              onSaveScreenshot={onSaveScreenshot}
              onUploadScreenshot={onUploadScreenshot}
              onSaveAnnotations={onSaveAnnotations}
              onAddBlock={onAddBlock}
              onMoveBlock={onMoveBlock}
              onDeleteBlock={onDeleteBlock}
              onOpenScreenshot={setActiveScreenshotId}
            />
          )}
        </section>

        <div className={styles.panelStack}>
          <ArtifactPublishingPanel
            projectId={projectId}
            projectVersionId={detail.edition.project_version_id}
            artifactType="guide"
            artifactId={guideId}
            editionVersion={detail.edition.version}
            workingDraftVersion={detail.working_draft.version}
            publicationReadOnly={readOnly}
            aggregateMutationPending={busyAction !== null}
            runAggregateMutation={runAggregateMutation}
          />
          <section className={styles.panel} aria-labelledby="metadata-heading">
            <h2 className={styles.sectionTitle} id="metadata-heading">
              Guide metadata
            </h2>
            <Label className={styles.field}>
              <span>Guide title</span>
              <Input
                value={guideDraft.title}
                disabled={readOnly || busyAction !== null}
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
                disabled={readOnly || busyAction !== null}
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
              disabled={readOnly || busyAction !== null}
              onClick={onSaveGuide}
            >
              Save guide
            </Button>
          </section>
        </div>
      </div>
      <GuideScreenshotViewer
        images={screenshotImages}
        activeImageId={activeScreenshotId}
        onActiveImageChange={setActiveScreenshotId}
        onClose={() => setActiveScreenshotId(null)}
      />
    </div>
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
  onSaveAnnotations,
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
  onSaveAnnotations: (
    block: GuideBlock,
    annotations: UpdateGuideBlockAnnotationsInput["annotations"],
  ) => void;
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
  const [mediaFailed, setMediaFailed] = useState(false);
  const editableContentBlock =
    block.block_type === "header" ||
    block.block_type === "paragraph" ||
    block.block_type === "tip" ||
    block.block_type === "alert";

  useEffect(() => {
    setMediaFailed(false);
  }, [sourceAsset?.id]);

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
                disabled={mediaFailed}
                onClick={() =>
                  onOpenScreenshot(screenshotViewerImageId(block, sourceAsset))
                }
              >
                <span className={styles.annotationFrame}>
                  <img
                    className={styles.screenshot}
                    src={resolveApiAssetUrl(sourceAsset.file_url)}
                    alt={assetAltText(sourceAsset, blockNumber)}
                    onLoad={() => setMediaFailed(false)}
                    onError={() => setMediaFailed(true)}
                  />
                  <ScreenshotAnnotationOverlay annotations={annotations} />
                </span>
              </button>
            </div>
          ) : null}
          {mediaFailed ? (
            <div className={styles.mediaError} role="status">
              This screenshot could not be loaded. Highlight editing is
              unavailable.
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
          </div>
          {sourceAsset && !mediaFailed ? (
            <GuideAnnotationEditor
              stepNumber={blockNumber}
              annotations={annotations}
              disabled={readOnly || actionBusy}
              pending={annotationsBusy}
              onSave={(nextAnnotations) =>
                onSaveAnnotations(block, nextAnnotations)
              }
            />
          ) : null}
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
                    const current =
                      asset.id === block.step?.display_capture_asset_id;
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
  blockNumber?: number;
  disabled: boolean;
  onAdd: (
    blockType: "step" | "header" | "paragraph" | "tip" | "alert" | "divider",
  ) => void;
}) => (
  <div
    className={styles.insertControls}
    aria-label={
      blockNumber === undefined
        ? "Add first block"
        : `Add block after block ${blockNumber}`
    }
  >
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("step")}
    >
      {blockNumber === undefined
        ? "Add step"
        : `Add step after block ${blockNumber}`}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("header")}
    >
      {blockNumber === undefined
        ? "Add header"
        : `Add header after block ${blockNumber}`}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("paragraph")}
    >
      {blockNumber === undefined
        ? "Add paragraph"
        : `Add paragraph after block ${blockNumber}`}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("tip")}
    >
      {blockNumber === undefined
        ? "Add tip"
        : `Add tip after block ${blockNumber}`}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("alert")}
    >
      {blockNumber === undefined
        ? "Add alert"
        : `Add alert after block ${blockNumber}`}
    </Button>
    <Button
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => onAdd("divider")}
    >
      {blockNumber === undefined
        ? "Add divider"
        : `Add divider after block ${blockNumber}`}
    </Button>
  </div>
);
