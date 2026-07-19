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

  return (
    <article className={styles.page}>
      <Alert>
        Immutable Revision {value.revision.revision_number} · Working Draft
        changes do not affect this preview.
      </Alert>
      <h1>{value.revision.title}</h1>
      {value.revision.description ? <p>{value.revision.description}</p> : null}
      {value.demo_scenes.map((scene) => (
        <Card className={styles.card} key={scene.id}>
          <h2>{scene.title ?? `Scene ${scene.scene_index}`}</h2>
          {scene.description ? <p>{scene.description}</p> : null}
          <small>
            {scene.hotspots.length} hotspot
            {scene.hotspots.length === 1 ? "" : "s"}
          </small>
        </Card>
      ))}
      <a href={historyHref}>Back to Revision history</a>
    </article>
  );
};
