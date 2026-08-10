import { useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { StatusPanel } from "@repo/ui/status-panel";
import type { InteractiveDemoRevisionDetail } from "@repo/types";
import { getArtifactRevision } from "../../lib/api";
import { InteractiveDemoRenderer } from "../interactive-demo/InteractiveDemoRenderer";
import styles from "./ArtifactRevisionPreview.module.css";

export const InteractiveDemoRevisionPreviewPage = ({
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
  const [value, setValue] = useState<InteractiveDemoRevisionDetail | null>(
    null,
  );
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
      artifactType: "interactive_demo",
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
  return (
    <article className={styles.page}>
      <Alert>
        Immutable Revision {value.revision.revision_number} · Working Draft
        changes do not affect this preview.
      </Alert>
      <InteractiveDemoRenderer
        title={value.revision.title}
        description={value.revision.description}
        scenes={value.demo_scenes.map((scene) => ({
          id: scene.id,
          sceneIndex: scene.scene_index,
          title: scene.title,
          description: scene.description,
          backgroundAssetId: scene.background_capture_asset_id,
          hotspots: scene.hotspots.map((hotspot) => ({
            id: hotspot.id,
            type: hotspot.hotspot_type,
            label: hotspot.label,
            content: hotspot.content,
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            targetSceneId:
              hotspot.transition?.target_demo_revision_scene_id ?? null,
          })),
        }))}
        assets={value.capture_assets.map((asset) => ({
          id: asset.id,
          fileUrl: asset.file_url,
          width: asset.width,
          height: asset.height,
        }))}
      />
      <a href={historyHref}>Back to Revision history</a>
    </article>
  );
};
