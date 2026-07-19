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

type RequestState = "loading" | "ready" | "saving" | "error";

const choiceKey = (choice: Pick<Choice, "artifact_type" | "artifact_id">) =>
  `${choice.artifact_type}:${choice.artifact_id}`;

export const ProjectCarryForwardPage = ({
  projectId,
  source,
  versions,
  canWrite,
}: {
  projectId: string;
  source: ProjectVersion;
  versions: ProjectVersion[];
  canWrite: boolean;
}) => {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [state, setState] = useState<RequestState>("loading");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const retryIdentity = useRef<{ fingerprint: string; key: string } | null>(
    null,
  );

  useEffect(() => {
    setState("loading");
    setErrorMessage("");
    void Promise.all([
      listProjectGuides(projectId, source.id),
      listProjectInteractiveDemos(projectId, source.id),
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
  }, [projectId, source.id]);

  const targets = useMemo(
    () =>
      versions.filter(
        (value) => value.id !== source.id && value.status === "active",
      ),
    [source.id, versions],
  );

  const submit = async () => {
    const artifacts = choices
      .filter((choice) => selected.includes(choiceKey(choice)))
      .map(({ artifact_type, artifact_id }) => ({
        artifact_type,
        artifact_id,
      }));
    const fingerprint = JSON.stringify({ target, artifacts });
    const idempotencyKey =
      retryIdentity.current?.fingerprint === fingerprint
        ? retryIdentity.current.key
        : crypto.randomUUID();
    retryIdentity.current = { fingerprint, key: idempotencyKey };

    setState("saving");
    setMessage("");
    setErrorMessage("");
    try {
      const result = await carryForwardArtifactEditions(
        projectId,
        {
          source_project_version_id: source.id,
          target_project_version_id: target,
          artifacts,
        },
        idempotencyKey,
      );
      setMessage(
        `${result.items.length} Edition${result.items.length === 1 ? "" : "s"} carried forward${result.replayed ? " (replayed safely)" : ""}.`,
      );
      setState("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Carry-Forward could not be completed. Resolve conflicts and retry.",
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
          This source remains readable, but your role cannot carry Editions
          forward.
        </Alert>
      ) : null}
      {message ? <Alert>{message}</Alert> : null}
      {errorMessage ? (
        <Alert variant="destructive">{errorMessage}</Alert>
      ) : null}

      <label>
        Target Project Version
        <select
          value={target}
          disabled={!canWrite || state === "saving"}
          onChange={(event) => setTarget(event.target.value)}
        >
          <option value="">Choose a target…</option>
          {targets.map((value) => (
            <option key={value.id} value={value.id}>
              {value.name}
            </option>
          ))}
        </select>
      </label>

      {state === "loading" ? <p>Loading source Editions…</p> : null}
      {state !== "loading" && choices.length === 0 ? (
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
      <Button
        disabled={
          !canWrite || !target || selected.length === 0 || state === "saving"
        }
        onClick={() => void submit()}
      >
        {state === "saving" ? "Carrying forward…" : "Carry forward selected"}
      </Button>
    </section>
  );
};
