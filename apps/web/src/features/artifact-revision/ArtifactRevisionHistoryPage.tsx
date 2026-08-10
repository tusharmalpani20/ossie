import { useCallback, useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { StatusPanel } from "@repo/ui/status-panel";
import type { ArtifactRevisionSummary } from "@repo/types";
import {
  checkpointArtifactRevision,
  getGuideDetail,
  getInteractiveDemo,
  listArtifactRevisions,
  restoreArtifactRevision,
} from "../../lib/api";
import styles from "./ArtifactRevisionHistoryPage.module.css";

type ArtifactRevisionHistoryPageProps = {
  projectId: string;
  projectVersionId: string;
  versionSlug: string;
  artifactType: "guide" | "interactive_demo";
  artifactId: string;
  canWrite: boolean;
};

type RequestState = "loading" | "ready" | "saving" | "error";

export const ArtifactRevisionHistoryPage = ({
  projectId,
  projectVersionId,
  versionSlug,
  artifactType,
  artifactId,
  canWrite,
}: ArtifactRevisionHistoryPageProps) => {
  const [items, setItems] = useState<ArtifactRevisionSummary[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [state, setState] = useState<RequestState>("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(
    async (beforeRevisionNumber?: number) => {
      setState("loading");
      try {
        const response = await listArtifactRevisions({
          projectId,
          projectVersionId,
          artifactType,
          artifactId,
          query: {
            limit: 50,
            ...(beforeRevisionNumber
              ? { before_revision_number: beforeRevisionNumber }
              : {}),
          },
        });
        setItems((current) =>
          beforeRevisionNumber
            ? [...current, ...response.revisions]
            : response.revisions,
        );
        setNextBefore(response.next_before_revision_number);
        setState("ready");
      } catch {
        setState("error");
      }
    },
    [artifactId, artifactType, projectId, projectVersionId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const currentVersions = async () => {
    if (artifactType === "guide") {
      const value = await getGuideDetail(
        projectId,
        artifactId,
        projectVersionId,
      );
      return {
        expected_edition_version: value.edition.version,
        expected_working_draft_version: value.working_draft.version,
      };
    }

    const value = await getInteractiveDemo(
      projectId,
      artifactId,
      projectVersionId,
    );
    return {
      expected_edition_version: value.edition.version,
      expected_working_draft_version: value.working_draft.version,
    };
  };

  const checkpoint = async () => {
    setState("saving");
    setMessage("");
    try {
      const result = await checkpointArtifactRevision({
        projectId,
        projectVersionId,
        artifactType,
        artifactId,
        data: await currentVersions(),
      });
      setMessage(
        result.reused
          ? "Latest Revision already matches the Working Draft."
          : `Revision ${result.revision.revision_number} created.`,
      );
      await load();
    } catch {
      setState("error");
    }
  };

  const restore = async (item: ArtifactRevisionSummary) => {
    if (
      !window.confirm(
        `Restore Revision ${item.revision_number}? Current authored content will be replaced.`,
      )
    ) {
      return;
    }

    setState("saving");
    setMessage("");
    try {
      const result = await restoreArtifactRevision({
        projectId,
        projectVersionId,
        artifactType,
        artifactId,
        revisionNumber: item.revision_number,
        data: await currentVersions(),
      });
      setMessage(
        result.restored
          ? `Revision ${item.revision_number} restored.`
          : "Working Draft already matches this Revision.",
      );
      await load();
    } catch {
      setState("error");
    }
  };

  const artifactSegment =
    artifactType === "guide" ? "guides" : "interactive-demos";
  const base = `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/${artifactSegment}/${encodeURIComponent(artifactId)}`;

  return (
    <section
      className={styles.page}
      role="region"
      aria-label={
        artifactType === "guide"
          ? "Guide Revision history"
          : "Interactive Demo Revision history"
      }
    >
      <div className={styles.heading}>
        <div>
          <p>Immutable authoring history</p>
          <h1>Revisions</h1>
        </div>
        {canWrite ? (
          <Button
            disabled={state === "saving"}
            onClick={() => void checkpoint()}
          >
            {state === "saving" ? "Saving…" : "Create checkpoint"}
          </Button>
        ) : null}
      </div>

      {message ? <Alert>{message}</Alert> : null}
      {state === "error" ? (
        <Alert variant="destructive">
          Could not complete the Revision request. Reload and try again.
        </Alert>
      ) : null}
      {state === "loading" && items.length === 0 ? (
        <StatusPanel
          className={styles.state}
          tone="loading"
          title="Loading Revision history"
          description="Retrieving immutable authoring history."
          titleAs="h2"
        />
      ) : state === "error" && items.length === 0 ? (
        <StatusPanel
          className={styles.state}
          tone="error"
          title="Revision history unavailable"
          description="Could not load the Revision history. Reload and try again."
          action={
            <Button variant="secondary" onClick={() => void load()}>
              Try again
            </Button>
          }
          titleAs="h2"
        />
      ) : items.length === 0 ? (
        <StatusPanel
          className={styles.empty}
          tone="empty"
          title="No Revisions yet."
          description="Create a checkpoint to preserve the current Working Draft."
          titleAs="h2"
        />
      ) : (
        <ol className={styles.list}>
          {items.map((item) => (
            <li key={item.id}>
              <Card className={styles.card}>
                <div>
                  <strong>Revision {item.revision_number}</strong>
                  <span>
                    {item.trigger.replaceAll("_", " ")} ·{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <a href={`${base}/revisions/${item.revision_number}`}>
                    Open immutable preview
                  </a>
                  {canWrite ? (
                    <Button
                      variant="secondary"
                      disabled={state === "saving"}
                      onClick={() => void restore(item)}
                    >
                      Restore
                    </Button>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
      {nextBefore ? (
        <Button
          variant="secondary"
          disabled={state === "loading"}
          onClick={() => void load(nextBefore)}
        >
          Load older Revisions
        </Button>
      ) : null}
      <a href={base}>Back to Working Draft</a>
    </section>
  );
};
