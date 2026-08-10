import { useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { StatusPanel } from "@repo/ui/status-panel";
import type { GuideRevisionDetail } from "@repo/types";
import { getArtifactRevision } from "../../lib/api";
import styles from "./ArtifactRevisionPreview.module.css";

export const GuideRevisionPreviewPage = ({
  projectId,
  projectVersionId,
  artifactId,
  revisionNumber,
  historyHref,
}: {
  projectId: string;
  projectVersionId: string;
  artifactId: string;
  revisionNumber: number;
  historyHref: string;
}) => {
  const [value, setValue] = useState<GuideRevisionDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    setFailed(false);
    setValue(null);
    void getArtifactRevision({
      projectId,
      projectVersionId,
      artifactId,
      revisionNumber,
      artifactType: "guide",
    })
      .then(setValue)
      .catch(() => setFailed(true));
  }, [artifactId, projectId, projectVersionId, retryAttempt, revisionNumber]);

  if (failed) {
    return (
      <StatusPanel
        tone="error"
        title="Revision unavailable"
        description="Revision was not found or could not be loaded."
        action={
          <Button type="button" onClick={() => setRetryAttempt((value) => value + 1)}>
            Try again
          </Button>
        }
        titleAs="h1"
      />
    );
  }
  if (!value)
    return (
      <StatusPanel
        tone="loading"
        title="Loading immutable Revision"
        description="Resolving the exact published authoring snapshot."
        titleAs="h1"
      />
    );
  const assets = new Map(
    value.capture_assets.map((asset) => [asset.id, asset]),
  );

  return (
    <article
      className={styles.page}
      role="region"
      aria-label="Guide Revision preview"
    >
      <Alert>
        Immutable Revision {value.revision.revision_number} · Working Draft
        changes do not affect this preview.
      </Alert>
      <h1>{value.revision.title}</h1>
      {value.revision.description ? <p>{value.revision.description}</p> : null}
      {value.guide_blocks.map((block) => {
        const title = block.title ?? block.step?.title ?? block.block_type;
        const asset = block.step?.display_capture_asset_id
          ? assets.get(block.step.display_capture_asset_id)
          : null;
        return (
          <Card className={styles.card} key={block.id}>
            <h2>{title}</h2>
            {(block.body ?? block.step?.body) ? (
              <p>{block.body ?? block.step?.body}</p>
            ) : null}
            {asset && block.step && !block.step.screenshot_hidden ? (
              <div className={styles.assetPreview}>
                <img
                  alt={title}
                  src={asset.file_url}
                  width={asset.width ?? undefined}
                  height={asset.height ?? undefined}
                />
                {block.step.annotations.map((annotation) => (
                  <span
                    aria-label={`Highlight ${annotation.annotation_index}`}
                    className={styles.highlight}
                    key={annotation.id}
                    style={{
                      left: `${annotation.x * 100}%`,
                      top: `${annotation.y * 100}%`,
                      width: `${annotation.width * 100}%`,
                      height: `${annotation.height * 100}%`,
                    }}
                  />
                ))}
              </div>
            ) : null}
          </Card>
        );
      })}
      <a href={historyHref}>Back to Revision history</a>
    </article>
  );
};
