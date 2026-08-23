import { type FormEvent, useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  DocumentationApiError,
  getDocumentationOperations,
  updateDocumentationLimits,
  type DocumentationOperationsSummary,
} from "../../lib/documentationApi";
import { PortalAppShell } from "../portal/PortalAppShell";
import styles from "./OrganizationDocumentationOperationsPage.module.css";

type LimitDraft = {
  sitesUnlimited: boolean;
  pagesUnlimited: boolean;
  sites: string;
  pages: string;
};

type LoadState = "loading" | "loaded" | "error";

const draftFrom = (
  limits: DocumentationOperationsSummary["limits"],
): LimitDraft => ({
  sitesUnlimited: limits.active_sites_limit === null,
  pagesUnlimited: limits.active_pages_limit === null,
  sites: String(limits.active_sites_limit ?? 1),
  pages: String(limits.active_pages_limit ?? 1),
});

const formatCount = (value: number) => value.toLocaleString();

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes.toLocaleString()} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: value < 10 ? 1 : 0,
  })} ${units[unit]}`;
};

const limitValue = (unlimited: boolean, value: string) =>
  unlimited ? null : Number(value);

export const OrganizationDocumentationOperationsPage = ({
  currentPath = window.location.pathname,
  load = getDocumentationOperations,
  update = updateDocumentationLimits,
}: {
  currentPath?: string;
  load?: typeof getDocumentationOperations;
  update?: typeof updateDocumentationLimits;
}) => {
  const [summary, setSummary] = useState<DocumentationOperationsSummary | null>(
    null,
  );
  const [draft, setDraft] = useState<LimitDraft | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadState("loading");
    setMessage("");
    load()
      .then((result) => {
        if (!active) return;
        setSummary(result);
        setDraft(draftFrom(result.limits));
        setLoadState("loaded");
      })
      .catch(() => {
        if (active) setLoadState("error");
      });
    return () => {
      active = false;
    };
  }, [load, reloadKey]);

  const proposedLimits = draft
    ? {
        active_sites_limit: limitValue(draft.sitesUnlimited, draft.sites),
        active_pages_limit: limitValue(draft.pagesUnlimited, draft.pages),
      }
    : null;
  const isValid = Boolean(
    draft &&
    (draft.sitesUnlimited || Number(draft.sites) >= 1) &&
    (draft.pagesUnlimited || Number(draft.pages) >= 1),
  );
  const isDirty = Boolean(
    summary &&
    proposedLimits &&
    (proposedLimits.active_sites_limit !== summary.limits.active_sites_limit ||
      proposedLimits.active_pages_limit !== summary.limits.active_pages_limit),
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !summary ||
      !draft ||
      !proposedLimits ||
      !summary.permissions.can_manage_limits ||
      !isDirty ||
      !isValid
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const result = await update({
        ...proposedLimits,
        expected_version: summary.limits.version,
      });
      setSummary((current) =>
        current
          ? {
              ...current,
              ...result,
              generated_at: new Date().toISOString(),
            }
          : current,
      );
      setDraft(draftFrom(result.limits));
      setMessage("Documentation limits saved.");
    } catch (error) {
      if (
        error instanceof DocumentationApiError &&
        error.type === "documentation_row_version_conflict"
      ) {
        const latest = error.details as
          | DocumentationOperationsSummary["limits"]
          | undefined;
        if (latest)
          setSummary((current) =>
            current ? { ...current, limits: latest } : current,
          );
        setMessage(
          "Limits changed elsewhere. Your values are preserved; review the latest limits and try again.",
        );
      } else {
        setMessage("Documentation limits could not be saved. Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const state = (dimension: "active_sites" | "active_pages") =>
    summary?.states.find((candidate) => candidate.dimension === dimension);

  return (
    <PortalAppShell
      activeSection="organization_documentation"
      currentLabel="Documentation operations"
    >
      <main className={styles.page} data-current-path={currentPath}>
        <section className={styles.header}>
          <div>
            <h1 className={styles.title}>Documentation</h1>
            <p className={styles.subtitle}>
              Monitor Documentation usage and manage Organization limits.
            </p>
          </div>
        </section>

        {loadState === "loading" ? (
          <section className={styles.state} aria-live="polite">
            Loading Documentation usage…
          </section>
        ) : loadState === "error" ? (
          <section className={styles.state}>
            <p>Could not load Documentation usage.</p>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Retry
            </Button>
          </section>
        ) : summary ? (
          <>
            <section
              className={styles.section}
              aria-labelledby="documentation-usage-heading"
            >
              <div className={styles.sectionHeader}>
                <div>
                  <h2 id="documentation-usage-heading">Usage overview</h2>
                  <p>Current active content and retained file storage.</p>
                </div>
              </div>
              <div className={styles.summary}>
                {[
                  ["Active Sites", formatCount(summary.usage.active_sites)],
                  ["Active Pages", formatCount(summary.usage.active_pages)],
                  [
                    "Stored files",
                    formatBytes(summary.usage.retained_file_bytes),
                  ],
                ].map(([label, value]) => (
                  <div className={styles.summaryItem} key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </section>

            {state("active_sites")?.state === "over_limit" ||
            state("active_pages")?.state === "over_limit" ? (
              <Alert>
                Existing content is retained. Archive or reduce active content;
                only new growth is blocked while usage is over a limit.
              </Alert>
            ) : null}

            <div className={styles.secondaryGrid}>
              <section
                className={styles.panel}
                aria-labelledby="documentation-attention-heading"
              >
                <div className={styles.panelHeader}>
                  <h2 id="documentation-attention-heading">
                    Work requiring attention
                  </h2>
                  <p>Documentation work waiting for review.</p>
                </div>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Imports ready for review</dt>
                    <dd>
                      {formatCount(summary.usage.active_import_inspections)}
                    </dd>
                  </div>
                  <div>
                    <dt>Open review requests</dt>
                    <dd>{formatCount(summary.usage.open_review_requests)}</dd>
                  </div>
                </dl>
                {summary.usage.active_import_inspections === 0 &&
                summary.usage.open_review_requests === 0 ? (
                  <p className={styles.clearState}>
                    Nothing needs your attention.
                  </p>
                ) : null}
              </section>

              <section
                className={styles.panel}
                aria-labelledby="retained-content-heading"
              >
                <div className={styles.panelHeader}>
                  <h2 id="retained-content-heading">Retained content</h2>
                  <p>Preserved Documentation history.</p>
                </div>
                <dl className={styles.detailList}>
                  <div>
                    <dt>Revisions</dt>
                    <dd>{formatCount(summary.usage.retained_revisions)}</dd>
                  </div>
                  <div>
                    <dt>Publications</dt>
                    <dd>{formatCount(summary.usage.retained_publications)}</dd>
                  </div>
                </dl>
              </section>
            </div>

            {summary.permissions.can_manage_limits && draft ? (
              <section
                className={styles.limitsSection}
                aria-labelledby="documentation-limits-heading"
              >
                <div className={styles.panelHeader}>
                  <h2 id="documentation-limits-heading">
                    Documentation limits
                  </h2>
                  <p>
                    Control how many Sites and Pages can remain active. Existing
                    content is never removed automatically.
                  </p>
                </div>
                <form className={styles.form} onSubmit={submit}>
                  <div
                    className={styles.limitRow}
                    role="group"
                    aria-labelledby="active-sites-limit-heading"
                  >
                    <div className={styles.limitDescription}>
                      <h3 id="active-sites-limit-heading">Active Sites</h3>
                      <p>Maximum active Documentation Sites.</p>
                    </div>
                    <div className={styles.limitControls}>
                      <label className={styles.unlimitedControl}>
                        <input
                          type="checkbox"
                          checked={draft.sitesUnlimited}
                          onChange={(event) => {
                            setMessage("");
                            setDraft({
                              ...draft,
                              sitesUnlimited: event.target.checked,
                            });
                          }}
                        />
                        Unlimited
                      </label>
                      {!draft.sitesUnlimited ? (
                        <Input
                          className={styles.limitInput}
                          aria-label="Active Site limit"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          required
                          value={draft.sites}
                          onChange={(event) => {
                            setMessage("");
                            setDraft({ ...draft, sites: event.target.value });
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                  <div
                    className={styles.limitRow}
                    role="group"
                    aria-labelledby="active-pages-limit-heading"
                  >
                    <div className={styles.limitDescription}>
                      <h3 id="active-pages-limit-heading">Active Pages</h3>
                      <p>
                        Maximum active Pages across all Documentation Sites.
                      </p>
                    </div>
                    <div className={styles.limitControls}>
                      <label className={styles.unlimitedControl}>
                        <input
                          type="checkbox"
                          checked={draft.pagesUnlimited}
                          onChange={(event) => {
                            setMessage("");
                            setDraft({
                              ...draft,
                              pagesUnlimited: event.target.checked,
                            });
                          }}
                        />
                        Unlimited
                      </label>
                      {!draft.pagesUnlimited ? (
                        <Input
                          className={styles.limitInput}
                          aria-label="Active Page limit"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          required
                          value={draft.pages}
                          onChange={(event) => {
                            setMessage("");
                            setDraft({ ...draft, pages: event.target.value });
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <p
                      className={styles.formStatus}
                      role="status"
                      aria-live="polite"
                    >
                      {message}
                    </p>
                    <Button
                      type="submit"
                      disabled={busy || !isDirty || !isValid}
                    >
                      {busy ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </form>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </PortalAppShell>
  );
};
