import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import type { ProjectVersion } from "@repo/types/project-version";
import {
  carryForwardDocumentationSites,
  DocumentationApiError,
  listDocumentationCarryForwardOptions,
  type DocumentationCarryForwardOption,
} from "../../lib/documentationApi";
import styles from "./DocumentationCarryForwardPage.module.css";

type Props = {
  projectId: string;
  target: ProjectVersion;
  versions: ProjectVersion[];
  canCarry: boolean;
  loadOptions?: typeof listDocumentationCarryForwardOptions;
  carry?: typeof carryForwardDocumentationSites;
};

export const DocumentationCarryForwardPage = ({
  projectId,
  target,
  versions,
  canCarry,
  loadOptions = listDocumentationCarryForwardOptions,
  carry = carryForwardDocumentationSites,
}: Props) => {
  const [sourceId, setSourceId] = useState("");
  const [options, setOptions] = useState<DocumentationCarryForwardOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<
    "idle" | "loading" | "ready" | "saving" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof carryForwardDocumentationSites>>["items"] | null
  >(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const sources = useMemo(
    () => versions.filter((version) => version.id !== target.id),
    [target.id, versions],
  );

  useEffect(() => {
    if (state === "error") errorRef.current?.focus();
  }, [state]);

  useEffect(() => {
    setOptions([]);
    setSelected([]);
    setConfirmed(false);
    setMessage("");
    setResult(null);
    retry.current = null;
    if (!sourceId) {
      setState("idle");
      return;
    }
    setState("loading");
    void loadOptions(projectId, target.slug, sourceId)
      .then(({ sites }) => {
        setOptions(sites);
        setState("ready");
      })
      .catch(() => {
        setMessage("Source Documentation Sites could not be loaded.");
        setState("error");
      });
  }, [loadOptions, projectId, sourceId, target.slug]);

  const submit = async () => {
    const selections = options
      .filter((option) => selected.includes(option.site_id))
      .map((option) => ({
        site_id: option.site_id,
        expected_source_edition_version: option.source_edition_version,
        expected_source_draft_version: option.source_draft_version,
      }));
    const fingerprint = JSON.stringify({
      sourceId,
      targetId: target.id,
      selections,
    });
    const key =
      retry.current?.fingerprint === fingerprint
        ? retry.current.key
        : crypto.randomUUID();
    retry.current = { fingerprint, key };
    setState("saving");
    setMessage("");
    setResult(null);
    try {
      const response = await carry(
        projectId,
        target.slug,
        {
          source_project_version_id: sourceId,
          target_project_version_id: target.id,
          selections,
        },
        key,
      );
      setResult(response.items);
      setState("ready");
      setMessage(
        `${response.items.length} Site${
          response.items.length === 1 ? "" : "s"
        } carried forward${response.replayed ? " (replayed safely)" : ""}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof DocumentationApiError
          ? error.message
          : "Carry-Forward could not be completed. Resolve the conflict and retry.",
      );
      setState("error");
    }
  };

  return (
    <section
      className={styles.page}
      aria-labelledby="documentation-carry-heading"
    >
      <header>
        <p>Documentation lifecycle</p>
        <h1 id="documentation-carry-heading">
          Carry Forward Documentation Sites
        </h1>
        <p>
          Target Project Version: <strong>{target.name}</strong>. Each selected
          Site is checkpointed exactly, then receives an independent mutable
          Edition in this target.
        </p>
      </header>
      {!canCarry ? (
        <p role="note">
          Carry-Forward is unavailable for this role or target lifecycle state.
        </p>
      ) : null}
      {state === "error" ? (
        <div ref={errorRef} role="alert" tabIndex={-1} className={styles.error}>
          <h2>Carry-Forward needs attention</h2>
          <p>{message}</p>
        </div>
      ) : message ? (
        <p role="status">{message}</p>
      ) : null}
      <label>
        Source Project Version
        <select
          value={sourceId}
          disabled={!canCarry || state === "saving"}
          onChange={(event) => setSourceId(event.target.value)}
        >
          <option value="">Choose a source…</option>
          <optgroup label="Active sources">
            {sources
              .filter(({ status }) => status === "active")
              .map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name}
                </option>
              ))}
          </optgroup>
          {sources.some(({ status }) => status === "archived") ? (
            <optgroup label="Archived sources">
              {sources
                .filter(({ status }) => status === "archived")
                .map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name} (archived)
                  </option>
                ))}
            </optgroup>
          ) : null}
        </select>
      </label>
      {state === "loading" ? <p role="status">Loading source Sites…</p> : null}
      {sourceId && state !== "loading" && options.length === 0 ? (
        <Card>
          No Documentation Sites are available in this source Version.
        </Card>
      ) : null}
      <div className={styles.grid}>
        {options.map((option) => {
          const blocked = option.target_has_edition || !canCarry;
          return (
            <Card key={option.site_id} className={styles.card}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(option.site_id)}
                  disabled={blocked || state === "saving"}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, option.site_id]
                        : current.filter((id) => id !== option.site_id),
                    )
                  }
                />
                <span>
                  <strong>{option.title}</strong>
                  <small>
                    {option.primary_language} · saved draft version{" "}
                    {option.source_draft_version}
                  </small>
                </span>
              </label>
              <p>
                {option.latest_revision
                  ? `Latest Revision ${option.latest_revision.revision_number}${
                      option.latest_revision.created_at
                        ? ` · ${new Date(
                            option.latest_revision.created_at,
                          ).toLocaleString()}`
                        : ""
                    }`
                  : "No Revision yet; success will create the exact source Revision."}
              </p>
              {option.status === "archived" ? (
                <p>Archived source Edition</p>
              ) : null}
              {option.target_has_edition ? (
                <p>Already present in the target Version.</p>
              ) : null}
            </Card>
          );
        })}
      </div>
      <p role="status" aria-live="polite">
        {selected.length} Site{selected.length === 1 ? "" : "s"} selected
      </p>
      <label className={styles.confirm}>
        <input
          type="checkbox"
          checked={confirmed}
          disabled={!selected.length || state === "saving"}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        I understand the target receives independent mutable copies from exact
        source Revisions.
      </label>
      <Button
        disabled={
          !canCarry || !selected.length || !confirmed || state === "saving"
        }
        onClick={() => void submit()}
      >
        {state === "saving" ? "Carrying Forward…" : "Carry Forward Sites"}
      </Button>
      {result ? (
        <section aria-labelledby="documentation-carry-result">
          <h2 id="documentation-carry-result">Target workbenches</h2>
          <ul>
            {result.map((item) => {
              const option = options.find(
                (candidate) => candidate.site_id === item.site_id,
              );
              return (
                <li key={item.site_id}>
                  Revision {item.source_revision_number}{" "}
                  {item.source_revision_reused ? "(reused)" : "(created)"} ·{" "}
                  <a
                    href={`/projects/${encodeURIComponent(
                      projectId,
                    )}/versions/${encodeURIComponent(
                      target.slug,
                    )}/documentation/${encodeURIComponent(item.site_id)}`}
                  >
                    Open {option?.title ?? "target Site"}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </section>
  );
};
