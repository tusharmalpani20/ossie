import { useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Card } from "@repo/ui/card";
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
      {value.guide_blocks.map((block) => (
        <Card className={styles.card} key={block.id}>
          <h2>{block.title ?? block.step?.title ?? block.block_type}</h2>
          {(block.body ?? block.step?.body) ? (
            <p>{block.body ?? block.step?.body}</p>
          ) : null}
        </Card>
      ))}
      <a href={historyHref}>Back to Revision history</a>
    </article>
  );
};
