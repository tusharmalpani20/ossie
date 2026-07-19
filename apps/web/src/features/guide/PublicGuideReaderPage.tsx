import { useEffect, useMemo, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  ApiClientError,
  createPublicPublishViewerSession,
  getPublicPublishLink,
  resolveApiAssetUrl,
} from "../../lib/api";
import {
  GuideScreenshotViewer,
  type GuideScreenshotViewerImage,
} from "./GuideScreenshotViewer";
import type {
  GuideScreenshotAnnotation,
  PublishedGuideSnapshot,
  PublishedGuideSnapshotAsset,
  PublishedGuideSnapshotBlock,
  PublicPublishLinkResponse,
} from "./types";
import styles from "./PublicGuideReaderPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; response: PublicPublishLinkResponse; snapshot: PublishedGuideSnapshot }
  | { status: "not_found" }
  | { status: "restricted" }
  | { status: "expired" }
  | { status: "password_required" }
  | { status: "malformed" }
  | { status: "error" };

export type PublicGuideReaderPageProps = {
  slug: string;
  mode?: "page" | "embed";
  loadPublishLink?: (slug: string, surface?: "reader" | "embed") => Promise<PublicPublishLinkResponse>;
  createViewerSession?: (slug: string, input: { password: string }, surface?: "reader" | "embed") => Promise<void>;
};

const is_record = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === "object" && !Array.isArray(value)
);

const nullable_string = (value: unknown): string | null => (
  typeof value === "string" ? value : null
);

const valid_annotation_number = (value: unknown): value is number => (
  typeof value === "number" && Number.isFinite(value)
);

const parse_annotations = (value: unknown): GuideScreenshotAnnotation[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.flatMap((annotation): GuideScreenshotAnnotation[] => {
    if (!is_record(annotation)) {
      return [];
    }

    const { id, type, x, y, width, height } = annotation;

    if (
      typeof id !== "string"
      || id.length === 0
      || type !== "highlight"
      || !valid_annotation_number(x)
      || !valid_annotation_number(y)
      || !valid_annotation_number(width)
      || !valid_annotation_number(height)
      || x < 0
      || y < 0
      || width <= 0
      || height <= 0
      || x + width > 1
      || y + height > 1
    ) {
      return [];
    }

    return [{
      id,
      type,
      x,
      y,
      width,
      height,
    }];
  });
};

const parse_block_content = (value: unknown) => {
  if (!is_record(value)) {
    return null;
  }

  return {
    title: nullable_string(value.title),
    body: nullable_string(value.body),
    annotations: parse_annotations(value.annotations),
  };
};

const number_or_zero = (value: unknown) => (
  typeof value === "number" && Number.isFinite(value) ? value : 0
);

const optional_number = (value: unknown): number | null => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);

const parse_source_asset = (value: unknown): PublishedGuideSnapshotAsset | null => {
  if (!is_record(value) || typeof value.file_url !== "string" || value.file_url.length === 0) {
    return null;
  }

  const file = is_record(value.file) ? value.file : {};

  return {
    id: typeof value.id === "string" ? value.id : "",
    asset_type: value.asset_type === "screenshot"
      || value.asset_type === "html_snapshot"
      || value.asset_type === "thumbnail"
      || value.asset_type === "redacted_screenshot"
      ? value.asset_type
      : "screenshot",
    width: optional_number(value.width),
    height: optional_number(value.height),
    page_title: nullable_string(value.page_title),
    page_url: nullable_string(value.page_url),
    file_url: value.file_url,
    file: {
      id: typeof file.id === "string" ? file.id : "",
      original_name: nullable_string(file.original_name),
      mime_type: typeof file.mime_type === "string" ? file.mime_type : "application/octet-stream",
      size_bytes: number_or_zero(file.size_bytes),
    },
  };
};

const parse_block = (value: unknown): PublishedGuideSnapshotBlock | null => {
  if (!is_record(value) || typeof value.id !== "string" || typeof value.block_type !== "string") {
    return null;
  }

  const step = is_record(value.step) && typeof value.step.id === "string" && typeof value.step.title === "string"
    ? {
      id: value.step.id,
      title: value.step.title,
      body: nullable_string(value.step.body),
    }
    : null;

  return {
    id: value.id,
    block_type: value.block_type as PublishedGuideSnapshotBlock["block_type"],
    block_index: number_or_zero(value.block_index),
    content: parse_block_content(value.content),
    step,
    source_asset: parse_source_asset(value.source_asset),
  };
};

const parse_published_guide_snapshot = (value: unknown): PublishedGuideSnapshot | null => {
  if (!is_record(value) || value.artifact_type !== "guide" || !is_record(value.guide)) {
    return null;
  }

  const guide = value.guide;
  if (typeof guide.id !== "string" || typeof guide.title !== "string") {
    return null;
  }

  const blocks = Array.isArray(value.blocks)
    ? value.blocks.flatMap((block) => {
      const parsed = parse_block(block);
      return parsed ? [parsed] : [];
    })
    : [];

  return {
    artifact_type: "guide",
    guide: {
      id: guide.id,
      title: guide.title,
      description: nullable_string(guide.description),
      source_capture_session_id: nullable_string(guide.source_capture_session_id),
      published_version: number_or_zero(guide.published_version),
      published_at: typeof guide.published_at === "string" ? guide.published_at : "",
    },
    blocks,
  };
};

const loadStateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError && error.kind === "not_found") {
    return { status: "not_found" };
  }

  if (error instanceof ApiClientError && error.type === "publish_link_not_public") {
    return { status: "restricted" };
  }

  if (error instanceof ApiClientError && error.type === "publish_link_expired") {
    return { status: "expired" };
  }

  if (error instanceof ApiClientError && error.type === "publish_link_password_required") {
    return { status: "password_required" };
  }

  return { status: "error" };
};

const sort_blocks = (blocks: PublishedGuideSnapshotBlock[]) => (
  [...blocks].sort((left, right) => left.block_index - right.block_index)
);

const format_published_at = (value: string) => {
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

const asset_alt_text = (asset: PublishedGuideSnapshotAsset, stepNumber: number) => (
  asset.page_title ?? asset.file.original_name ?? `Step ${stepNumber} screenshot`
);

const screenshot_viewer_image_id = (block: PublishedGuideSnapshotBlock, asset: PublishedGuideSnapshotAsset) => (
  `${block.id}:${asset.id}`
);

const annotations_from_block = (block: PublishedGuideSnapshotBlock): GuideScreenshotAnnotation[] => (
  block.content?.annotations ?? []
);

const annotation_percent = (value: number) => `${Number((value * 100).toFixed(4))}%`;

export const PublicGuideReaderPage = ({
  slug,
  mode = "page",
  loadPublishLink = getPublicPublishLink,
  createViewerSession = createPublicPublishViewerSession,
}: PublicGuideReaderPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadPublishLink(slug, mode === "embed" ? "embed" : "reader")
      .then((response) => {
        if (!active) {
          return;
        }

        const snapshot = parse_published_guide_snapshot(response.published_artifact.snapshot);

        if (response.published_artifact.artifact_type !== "guide" || !snapshot) {
          setState({ status: "malformed" });
          return;
        }

        setState({ status: "loaded", response, snapshot });
      })
      .catch((error: unknown) => {
        if (active) {
          setState(loadStateFromError(error));
        }
      });

    return () => {
      active = false;
    };
  }, [loadPublishLink, mode, reloadKey, slug]);

  if (state.status === "loading") {
    return <PublicState message="Loading published guide..." mode={mode} />;
  }

  if (state.status === "not_found") {
    return <PublicState message="Published guide was not found." mode={mode} />;
  }

  if (state.status === "restricted") {
    return <PublicState message="This guide is not publicly accessible." mode={mode} />;
  }

  if (state.status === "expired") {
    return <PublicState message="This guide link has expired." mode={mode} />;
  }

  if (state.status === "password_required") {
    return (
      <PublicPasswordGate
        slug={slug}
        mode={mode}
        createViewerSession={createViewerSession}
        onUnlocked={() => setReloadKey((key) => key + 1)}
      />
    );
  }

  if (state.status === "malformed") {
    return <PublicState message="Published artifact cannot be displayed." mode={mode} />;
  }

  if (state.status === "error") {
    return <PublicState message="Could not load published guide." mode={mode} />;
  }

  return (
    <PublicGuideReaderView
      response={state.response}
      snapshot={state.snapshot}
      mode={mode}
    />
  );
};

const PublicState = ({
  message,
  mode,
}: {
  message: string;
  mode: "page" | "embed";
}) => (
  <div className={`${styles.page} ${mode === "embed" ? styles.embedPage : ""}`}>
    <main
      className={`${styles.main} ${mode === "embed" ? styles.embedMain : ""}`}
      role="main"
    >
      <div className={styles.state}>{message}</div>
    </main>
  </div>
);

const PublicPasswordGate = ({
  slug,
  mode,
  createViewerSession,
  onUnlocked,
}: {
  slug: string;
  mode: "page" | "embed";
  createViewerSession: (slug: string, input: { password: string }, surface?: "reader" | "embed") => Promise<void>;
  onUnlocked: () => void;
}) => {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const compact = mode === "embed";

  const unlock = async () => {
    setBusy(true);
    setError(null);

    try {
      await createViewerSession(slug, { password }, mode === "embed" ? "embed" : "reader");
      onUnlocked();
    } catch {
      setError("Password is incorrect.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.page} ${compact ? styles.embedPage : ""}`}>
      <main
        className={`${styles.main} ${compact ? styles.embedMain : ""}`}
        role="main"
      >
        <section className={styles.state} aria-label="Password protected guide">
          <h1 className={styles.passwordTitle}>
            {compact ? "Password required" : "This guide is password protected."}
          </h1>
          <Label className={styles.passwordField}>
            <span>Password</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Label>
          {error ? <div className={styles.passwordError}>{error}</div> : null}
          <Button
            className={styles.unlockButton}
            disabled={busy || password.length === 0}
            onClick={unlock}
          >
            {busy ? "Unlocking..." : compact ? "Unlock" : "Unlock guide"}
          </Button>
        </section>
      </main>
    </div>
  );
};

const PublicGuideReaderView = ({
  response,
  snapshot,
  mode,
}: {
  response: PublicPublishLinkResponse;
  snapshot: PublishedGuideSnapshot;
  mode: "page" | "embed";
}) => {
  const sortedBlocks = useMemo(() => sort_blocks(snapshot.blocks), [snapshot.blocks]);
  const [activeScreenshotId, setActiveScreenshotId] = useState<string | null>(null);
  const screenshotImages = useMemo(() => screenshot_images_from_blocks(sortedBlocks), [sortedBlocks]);
  const publishedAt = format_published_at(snapshot.guide.published_at);
  const version = snapshot.guide.published_version || response.published_artifact.version_number;

  useEffect(() => {
    if (
      activeScreenshotId
      && !screenshotImages.some((image) => image.id === activeScreenshotId)
    ) {
      setActiveScreenshotId(null);
    }
  }, [activeScreenshotId, screenshotImages]);

  return (
    <div className={`${styles.page} ${mode === "embed" ? styles.embedPage : ""}`}>
      <main
        className={`${styles.main} ${mode === "embed" ? styles.embedMain : ""}`}
        role="main"
        aria-label={mode === "embed" ? "Embedded published guide" : undefined}
      >
        <section className={`${styles.header} ${mode === "embed" ? styles.embedHeader : ""}`}>
          {mode === "page" ? <div className={styles.eyebrow}>Published guide</div> : null}
          <h1 className={styles.title}>{snapshot.guide.title}</h1>
          {snapshot.guide.description ? <p className={styles.description}>{snapshot.guide.description}</p> : null}
          {mode === "page" ? (
            <div className={styles.metadata}>
              {version ? <span>Published version {version}</span> : null}
              {publishedAt ? <span>Published {publishedAt}</span> : null}
            </div>
          ) : null}
        </section>

        <section className={styles.document} aria-label="Published guide steps">
          {sortedBlocks.length === 0 ? (
            <div className={styles.empty}>This published guide does not have any blocks yet.</div>
          ) : (
            sortedBlocks.map((block) => (
              <PublicGuideBlock
                key={block.id}
                block={block}
                stepNumber={step_number_for_block(sortedBlocks, block)}
                onOpenScreenshot={setActiveScreenshotId}
              />
            ))
          )}
        </section>
      </main>
      <GuideScreenshotViewer
        images={screenshotImages}
        activeImageId={activeScreenshotId}
        onActiveImageChange={setActiveScreenshotId}
        onClose={() => setActiveScreenshotId(null)}
      />
    </div>
  );
};

const screenshot_images_from_blocks = (
  blocks: PublishedGuideSnapshotBlock[]
): GuideScreenshotViewerImage[] => blocks.flatMap((block) => {
  const asset = block.source_asset;

  if (block.block_type !== "step" || !block.step || !asset) {
    return [];
  }

  const stepNumber = step_number_for_block(blocks, block);

  return [{
    id: screenshot_viewer_image_id(block, asset),
    sourceAssetId: asset.id,
    src: resolveApiAssetUrl(asset.file_url),
    alt: asset_alt_text(asset, stepNumber),
    title: block.step.title || asset.page_title || asset.file.original_name || `Step ${stepNumber} screenshot`,
  }];
});

const PublicGuideBlock = ({
  block,
  stepNumber,
  onOpenScreenshot,
}: {
  block: PublishedGuideSnapshotBlock;
  stepNumber: number;
  onOpenScreenshot: (imageId: string) => void;
}) => {
  const asset = block.source_asset;

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
              onClick={() => onOpenScreenshot(screenshot_viewer_image_id(block, asset))}
            >
              <img
                className={styles.screenshot}
                src={resolveApiAssetUrl(asset.file_url)}
                alt={asset_alt_text(asset, stepNumber)}
              />
              <ScreenshotAnnotationOverlay annotations={annotations_from_block(block)} />
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
            left: annotation_percent(annotation.x),
            top: annotation_percent(annotation.y),
            width: annotation_percent(annotation.width),
            height: annotation_percent(annotation.height),
          }}
        />
      ))}
    </span>
  );
};

const step_number_for_block = (blocks: PublishedGuideSnapshotBlock[], target: PublishedGuideSnapshotBlock) => (
  blocks
    .filter((block) => block.block_type === "step" && block.block_index <= target.block_index)
    .length
);
