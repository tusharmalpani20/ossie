import { useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Card } from "@repo/ui/card";
import type { InteractiveDemoRevisionDetail } from "@repo/types";
import { getArtifactRevision } from "../../lib/api";
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
  }, [artifactId, projectId, projectVersionId, revisionNumber]);

  if (failed) {
    return (
      <Alert variant="destructive">
        Revision was not found or could not be loaded.
      </Alert>
    );
  }
  if (!value) return <p>Loading immutable Revision…</p>;
  const assets = new Map(
    value.capture_assets.map((asset) => [asset.id, asset]),
  );

  return (
    <article className={styles.page}>
      <Alert>
        Immutable Revision {value.revision.revision_number} · Working Draft
        changes do not affect this preview.
      </Alert>
      <h1>{value.revision.title}</h1>
      {value.revision.description ? <p>{value.revision.description}</p> : null}
      {value.demo_scenes.map((scene) => {
        const title = scene.title ?? `Scene ${scene.scene_index}`;
        const asset = scene.background_capture_asset_id
          ? assets.get(scene.background_capture_asset_id)
          : null;
        return (
          <Card className={styles.card} key={scene.id}>
            <h2>{title}</h2>
            {scene.description ? <p>{scene.description}</p> : null}
            {asset ? (
              <div className={styles.assetPreview}>
                <img
                  alt={title}
                  src={asset.file_url}
                  width={asset.width ?? undefined}
                  height={asset.height ?? undefined}
                />
                {scene.hotspots.map((hotspot) => (
                  <span
                    aria-label={
                      hotspot.label ?? `Hotspot ${hotspot.hotspot_index}`
                    }
                    className={styles.hotspot}
                    key={hotspot.id}
                    style={{
                      left: `${hotspot.x * 100}%`,
                      top: `${hotspot.y * 100}%`,
                      width: `${hotspot.width * 100}%`,
                      height: `${hotspot.height * 100}%`,
                    }}
                  />
                ))}
              </div>
            ) : null}
            <small>
              {scene.hotspots.length} hotspot
              {scene.hotspots.length === 1 ? "" : "s"}
            </small>
          </Card>
        );
      })}
      <a href={historyHref}>Back to Revision history</a>
    </article>
  );
};
