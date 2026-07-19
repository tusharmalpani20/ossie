import { useEffect, useMemo, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button, buttonVariants } from "@repo/ui/button";
import {
  ApiClientError,
  exportGuideMarkdown,
  getGuideDetail,
  resolveApiAssetUrl,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import {
  GuideScreenshotViewer,
  type GuideScreenshotViewerImage,
} from "./GuideScreenshotViewer";
import type {
  GuideBlock,
  GuideDetail,
  GuideMarkdownExport,
  GuideScreenshotAnnotation,
  GuideSourceCaptureAsset,
} from "./types";
import styles from "./GuidePreviewPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; detail: GuideDetail }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

export type GuidePreviewPageProps = {
  projectId: string;
  guideId: string;
  loadDetail?: (projectId: string, guideId: string) => Promise<GuideDetail>;
  exportMarkdown?: typeof exportGuideMarkdown;
  copyText?: (text: string) => Promise<void>;
  downloadTextFile?: (filename: string, contents: string, mimeType: string) => Promise<void>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  canWrite?: boolean;
  versionSlug?: string;
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

const sortBlocks = (blocks: GuideBlock[]) => (
  [...blocks].sort((a, b) => a.block_index - b.block_index)
);

const guideUrl = (projectId: string, guideId: string, versionSlug?: string) => (
  `/projects/${encodeURIComponent(projectId)}${versionSlug ? `/versions/${encodeURIComponent(versionSlug)}` : ""}/guides/${encodeURIComponent(guideId)}`
);

const guidePreviewListUrl = (projectId: string, versionSlug?: string) => (
  `/projects/${encodeURIComponent(projectId)}${versionSlug ? `/versions/${encodeURIComponent(versionSlug)}` : ""}/guides`
);

const assetAltText = (asset: GuideSourceCaptureAsset, stepNumber: number) => (
  asset.page_title ?? asset.file.original_name ?? `Step ${stepNumber} screenshot`
);

const screenshotViewerImageId = (block: GuideBlock, asset: GuideSourceCaptureAsset) => (
  `${block.id}:${asset.id}`
);

const defaultCopyText = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

const defaultDownloadTextFile = async (
  filename: string,
  contents: string,
  mimeType: string
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

export const GuidePreviewPage = ({
  projectId,
  guideId,
  loadDetail = getGuideDetail,
  exportMarkdown = exportGuideMarkdown,
  copyText = defaultCopyText,
  downloadTextFile = defaultDownloadTextFile,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
  canWrite = true,
  versionSlug,
}: GuidePreviewPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadDetail(projectId, guideId)
      .then((detail) => {
        if (active) {
          setState({ status: "loaded", detail });
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
  }, [projectId, guideId, loadDetail]);

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading guide preview...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to preview this guide.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>Sign in</a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Guide was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Could not load guide preview.</div>
      </PortalShell>
    );
  }

  return (
    <GuidePreviewView
      detail={state.detail}
      projectId={projectId}
      guideId={guideId}
      exportMarkdown={exportMarkdown}
      copyText={copyText}
      downloadTextFile={downloadTextFile}
      performLogout={performLogout}
      navigate={navigate}
      canWrite={canWrite}
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
    <PortalTopbar context={`${projectId} / ${guideId} / preview`} performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);

const GuidePreviewView = ({
  detail,
  projectId,
  guideId,
  exportMarkdown,
  copyText,
  downloadTextFile,
  performLogout,
  navigate,
  canWrite,
  versionSlug,
}: {
  detail: GuideDetail;
  projectId: string;
  guideId: string;
  exportMarkdown: typeof exportGuideMarkdown;
  copyText: (text: string) => Promise<void>;
  downloadTextFile: (filename: string, contents: string, mimeType: string) => Promise<void>;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  canWrite: boolean;
  versionSlug?: string;
}) => {
  const sortedBlocks = useMemo(() => sortBlocks(detail.guide_blocks), [detail.guide_blocks]);
  const [activeScreenshotId, setActiveScreenshotId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"copy-markdown" | "download-markdown" | null>(null);
  const assetsById = useMemo(() => new Map(
    detail.source_capture_assets.map((asset) => [asset.id, asset])
  ), [detail.source_capture_assets]);
  const screenshotImages = useMemo(() => screenshotImagesFromBlocks(sortedBlocks, assetsById), [assetsById, sortedBlocks]);

  useEffect(() => {
    if (
      activeScreenshotId
      && !screenshotImages.some((image) => image.id === activeScreenshotId)
    ) {
      setActiveScreenshotId(null);
    }
  }, [activeScreenshotId, screenshotImages]);

  const exportCurrentMarkdown = async (): Promise<GuideMarkdownExport> => (
    exportMarkdown(projectId, guideId)
  );

  const copyMarkdown = async () => {
    setBusyAction("copy-markdown");
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
    setBusyAction("download-markdown");
    setNotice(null);

    try {
      const response = await exportCurrentMarkdown();
      await downloadTextFile(response.filename, response.markdown, "text/markdown;charset=utf-8");
      setNotice("Markdown downloaded.");
    } catch {
      setNotice("Could not export Markdown.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Guide preview</div>
          <h1 className={styles.title}>{detail.guide.title}</h1>
          {detail.guide.description ? <p className={styles.description}>{detail.guide.description}</p> : null}
          <Badge variant={detail.guide.status === "draft" ? "warning" : "success"}>{detail.guide.status}</Badge>
          {notice ? <div className={styles.notice}>{notice}</div> : null}
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            disabled={busyAction !== null}
            onClick={copyMarkdown}
          >
            {busyAction === "copy-markdown" ? "Copying Markdown..." : "Copy Markdown"}
          </Button>
          <Button
            variant="secondary"
            disabled={busyAction !== null}
            onClick={downloadMarkdown}
          >
            {busyAction === "download-markdown" ? "Downloading Markdown..." : "Download Markdown"}
          </Button>
          <a className={`${buttonVariants({ variant: "secondary" })} ${styles.actionLink}`} href={guidePreviewListUrl(projectId, versionSlug)}>Back to guides</a>
          {canWrite ? <a className={`${buttonVariants({ variant: "primary" })} ${styles.actionLink}`} href={guideUrl(projectId, guideId, versionSlug)}>Edit guide</a> : <Badge>Read only</Badge>}
        </div>
      </section>

      <section className={styles.document} aria-label="Guide steps">
        {sortedBlocks.length === 0 ? (
          <div className={styles.empty}>This guide does not have any blocks yet.</div>
        ) : (
          sortedBlocks.map((block) => (
            <GuidePreviewBlock
              key={block.id}
              block={block}
              stepNumber={stepNumberForBlock(sortedBlocks, block)}
              asset={assetForBlock(block, assetsById)}
              onOpenScreenshot={setActiveScreenshotId}
            />
          ))
        )}
      </section>
      <GuideScreenshotViewer
        images={screenshotImages}
        activeImageId={activeScreenshotId}
        onActiveImageChange={setActiveScreenshotId}
        onClose={() => setActiveScreenshotId(null)}
      />
    </PortalShell>
  );
};

const assetForBlock = (
  block: GuideBlock,
  assetsById: Map<string, GuideSourceCaptureAsset>
) => {
  const source_capture_asset_id = block.display_capture_asset_id;
  return source_capture_asset_id ? assetsById.get(source_capture_asset_id) : undefined;
};

const annotationsFromBlock = (block: GuideBlock): GuideScreenshotAnnotation[] => (
  block.content?.annotations ?? []
);

const annotationPercent = (value: number) => `${Number((value * 100).toFixed(4))}%`;

const screenshotImagesFromBlocks = (
  blocks: GuideBlock[],
  assetsById: Map<string, GuideSourceCaptureAsset>
): GuideScreenshotViewerImage[] => blocks.flatMap((block) => {
  const asset = assetForBlock(block, assetsById);

  if (block.block_type !== "step" || !block.step || !asset) {
    return [];
  }

  const stepNumber = stepNumberForBlock(blocks, block);

  return [{
    id: screenshotViewerImageId(block, asset),
    sourceAssetId: asset.id,
    src: resolveApiAssetUrl(asset.file_url),
    alt: assetAltText(asset, stepNumber),
    title: block.step.title || asset.page_title || asset.file.original_name || `Step ${stepNumber} screenshot`,
  }];
});

const GuidePreviewBlock = ({
  block,
  stepNumber,
  asset,
  onOpenScreenshot,
}: {
  block: GuideBlock;
  stepNumber: number;
  asset?: GuideSourceCaptureAsset;
  onOpenScreenshot: (imageId: string) => void;
}) => {
  if (block.block_type === "header" && block.content?.title) {
    return (
      <section className={styles.callout}>
        <h2 className={styles.calloutTitle}>{block.content.title}</h2>
      </section>
    );
  }

  if ((block.block_type === "tip" || block.block_type === "alert") && block.content) {
    return (
      <aside className={block.block_type === "alert" ? styles.alert : styles.tip}>
        {block.content.title ? <h3 className={styles.calloutTitle}>{block.content.title}</h3> : null}
        {block.content.body ? <p className={styles.stepBody}>{block.content.body}</p> : null}
      </aside>
    );
  }

  if (block.block_type === "paragraph" && block.content?.body) {
    return (
      <section className={styles.callout}>
        <p className={styles.stepBody}>{block.content.body}</p>
      </section>
    );
  }

  if (block.block_type === "divider") {
    return <hr aria-label="Guide section divider" />;
  }

  if (block.block_type !== "step" || !block.step) {
    return (
      <article className={styles.step}>
        <div className={styles.stepNumber}>{stepNumber}</div>
        <div className={styles.stepContent}>
          <div className={styles.unsupported}>Unsupported guide block: {block.block_type}</div>
        </div>
      </article>
    );
  }

  return (
    <article className={styles.step}>
      <div className={styles.stepNumber}>{stepNumber}</div>
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>{block.step.title}</h2>
        {block.step.body ? <p className={styles.stepBody}>{block.step.body}</p> : null}
        {asset ? (
          <div className={styles.media}>
            <button
              className={styles.mediaButton}
              type="button"
              aria-label={`Open screenshot for step ${stepNumber}`}
              onClick={() => onOpenScreenshot(screenshotViewerImageId(block, asset))}
            >
              <img
                className={styles.screenshot}
                src={resolveApiAssetUrl(asset.file_url)}
                alt={assetAltText(asset, stepNumber)}
              />
              <ScreenshotAnnotationOverlay annotations={annotationsFromBlock(block)} />
            </button>
          </div>
        ) : null}
      </div>
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

const stepNumberForBlock = (blocks: GuideBlock[], target: GuideBlock) => (
  blocks
    .filter((block) => block.block_type === "step" && block.block_index <= target.block_index)
    .length
);
