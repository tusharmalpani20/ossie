import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import type { ProjectVersion } from "@repo/types/project-version";
import {
  ApiClientError,
  carryForwardArtifactEditions,
  listProjectGuides,
  listProjectInteractiveDemos,
} from "../../lib/api";
import styles from "./ProjectCarryForwardPage.module.css";

type Choice = {
  artifact_type: "guide" | "interactive_demo";
  artifact_id: string;
  title: string;
};
type CarriedItem = {
  artifact_type: "guide" | "interactive_demo";
  artifact_id: string;
  target_edition_id: string;
};

type RequestState = "idle" | "loading" | "ready" | "saving" | "error";

const choiceKey = (choice: Pick<Choice, "artifact_type" | "artifact_id">) =>
  `${choice.artifact_type}:${choice.artifact_id}`;

export const ProjectCarryForwardPage = ({
  projectId,
  target,
  versions,
  canWrite,
}: {
  projectId: string;
  target: ProjectVersion;
  versions: ProjectVersion[];
  canWrite: boolean;
}) => {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [blockers, setBlockers] = useState<
    Array<{ artifact_type: string; artifact_id: string }>
  >([]);
  const [carriedItems, setCarriedItems] = useState<CarriedItem[]>([]);
  const retryIdentity = useRef<{ fingerprint: string; key: string } | null>(
    null,
  );

  useEffect(() => {
    setChoices([]);
    setSelected([]);
    setMessage("");
    setErrorMessage("");
    setBlockers([]);
    setCarriedItems([]);
    retryIdentity.current = null;
    if (!sourceId) {
      setState("idle");
      return;
    }
    setState("loading");
    setErrorMessage("");
    void Promise.all([
      listProjectGuides(projectId, sourceId),
      listProjectInteractiveDemos(projectId, sourceId),
    ])
      .then(([guides, demos]) => {
        setChoices([
          ...guides.guide_editions.map((value) => ({
            artifact_type: "guide" as const,
            artifact_id: value.artifact.id,
            title: value.edition.title,
          })),
          ...demos.interactive_demo_editions.map((value) => ({
            artifact_type: "interactive_demo" as const,
            artifact_id: value.artifact.id,
            title: value.edition.title,
          })),
        ]);
        setState("ready");
      })
      .catch(() => {
        setErrorMessage("Could not load Editions from this Project Version.");
        setState("error");
      });
  }, [projectId, sourceId]);

  const sources = useMemo(
    () => versions.filter((value) => value.id !== target.id),
    [target.id, versions],
  );

  const submit = async () => {
    const artifacts = choices
      .filter((choice) => selected.includes(choiceKey(choice)))
      .map(({ artifact_type, artifact_id }) => ({
        artifact_type,
        artifact_id,
      }));
    const fingerprint = JSON.stringify({
      sourceId,
      target: target.id,
      artifacts,
    });
    const idempotencyKey =
      retryIdentity.current?.fingerprint === fingerprint
        ? retryIdentity.current.key
        : crypto.randomUUID();
    retryIdentity.current = { fingerprint, key: idempotencyKey };

    setState("saving");
    setMessage("");
    setErrorMessage("");
    setBlockers([]);
    setCarriedItems([]);
    try {
      const result = await carryForwardArtifactEditions(
        projectId,
        {
          source_project_version_id: sourceId,
          target_project_version_id: target.id,
          artifacts,
        },
        idempotencyKey,
      );
      setMessage(
        `${result.items.length} Edition${result.items.length === 1 ? "" : "s"} carried forward${result.replayed ? " (replayed safely)" : ""}.`,
      );
      setCarriedItems(result.items);
      setState("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Carry-Forward could not be completed. Resolve conflicts and retry.",
      );
      const details =
        error instanceof ApiClientError &&
        error.details &&
        typeof error.details === "object"
          ? (error.details as { blockers?: unknown }).blockers
          : null;
      if (Array.isArray(details))
        setBlockers(
          details.filter(
            (value): value is { artifact_type: string; artifact_id: string } =>
              Boolean(
                value &&
                typeof value === "object" &&
                typeof (value as { artifact_type?: unknown }).artifact_type ===
                  "string" &&
                typeof (value as { artifact_id?: unknown }).artifact_id ===
                  "string",
              ),
          ),
        );
      setState("error");
    }
  };

  return (
    <section className={styles.page}>
      <div>
        <p>Copy immutable authored state into another Project Version</p>
        <h1>Carry Forward Editions</h1>
      </div>
      {!canWrite ? (
        <Alert>
          This target remains readable, but it is not writable by your role or
          in its current lifecycle state.
        </Alert>
      ) : null}
      {message ? <Alert>{message}</Alert> : null}
      {errorMessage ? (
        <Alert variant="destructive">
          {errorMessage}
          {blockers.length ? (
            <ul>
              {blockers.map((blocker) => {
                const choice = choices.find(
                  (value) =>
                    value.artifact_type === blocker.artifact_type &&
                    value.artifact_id === blocker.artifact_id,
                );
                return (
                  <li key={`${blocker.artifact_type}:${blocker.artifact_id}`}>
                    {blocker.artifact_type === "interactive_demo"
                      ? "Interactive Demo"
                      : "Guide"}
                    : {choice?.title ?? "Existing Edition"}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Alert>
      ) : null}

      <p>
        <strong>Target Project Version:</strong> {target.name}
      </p>
      <label>
        Source Project Version
        <select
          value={sourceId}
          disabled={!canWrite || state === "saving"}
          onChange={(event) => setSourceId(event.target.value)}
        >
          <option value="">Choose a source…</option>
          <optgroup label="Active sources">
            {sources
              .filter((value) => value.status === "active")
              .map((value) => (
                <option key={value.id} value={value.id}>
                  {value.name}
                </option>
              ))}
          </optgroup>
          {sources.some((value) => value.status === "archived") ? (
            <optgroup label="Archived sources">
              {sources
                .filter((value) => value.status === "archived")
                .map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.name} (archived)
                  </option>
                ))}
            </optgroup>
          ) : null}
        </select>
      </label>

      {state === "loading" ? <p>Loading source Editions…</p> : null}
      {sourceId && state !== "loading" && choices.length === 0 ? (
        <Card className={styles.choice}>
          This Project Version has no Guide or Interactive Demo Editions to
          carry forward.
        </Card>
      ) : null}
      <div className={styles.list}>
        {choices.map((choice) => {
          const key = choiceKey(choice);
          return (
            <Card className={styles.choice} key={key}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(key)}
                  disabled={!canWrite || state === "saving"}
                  onChange={(event) =>
                    setSelected((values) =>
                      event.target.checked
                        ? [...values, key]
                        : values.filter((value) => value !== key),
                    )
                  }
                />
                <span>
                  <strong>{choice.title}</strong>
                  <small>
                    {choice.artifact_type === "guide"
                      ? "Guide"
                      : "Interactive Demo"}
                  </small>
                </span>
              </label>
            </Card>
          );
        })}
      </div>
      {carriedItems.length ? (
        <Card className={styles.choice}>
          <h2>Created target Editions</h2>
          <ul>
            {carriedItems.map((item) => {
              const choice = choices.find(
                (value) =>
                  value.artifact_type === item.artifact_type &&
                  value.artifact_id === item.artifact_id,
              );
              const segment =
                item.artifact_type === "guide" ? "guides" : "interactive-demos";
              return (
                <li key={`${item.artifact_type}:${item.artifact_id}`}>
                  <a
                    href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(target.slug)}/${segment}/${encodeURIComponent(item.artifact_id)}`}
                  >
                    Open {choice?.title ?? item.artifact_id}
                  </a>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
      <Button
        disabled={
          !canWrite || !sourceId || selected.length === 0 || state === "saving"
        }
        onClick={() => void submit()}
      >
        {state === "saving" ? "Carrying forward…" : "Carry forward selected"}
      </Button>
    </section>
  );
};
