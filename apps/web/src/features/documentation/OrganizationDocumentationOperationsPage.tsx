import { type FormEvent, useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
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

const draftFrom = (
  limits: DocumentationOperationsSummary["limits"],
): LimitDraft => ({
  sitesUnlimited: limits.active_sites_limit === null,
  pagesUnlimited: limits.active_pages_limit === null,
  sites: String(limits.active_sites_limit ?? 1),
  pages: String(limits.active_pages_limit ?? 1),
});

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
  const [status, setStatus] = useState("Loading Documentation usage…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    load()
      .then((result) => {
        if (!active) return;
        setSummary(result);
        setDraft(draftFrom(result.limits));
        setStatus("Documentation usage is up to date.");
      })
      .catch(() => {
        if (active) setStatus("Documentation usage could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!summary || !draft || !summary.permissions.can_manage_limits) return;
    setBusy(true);
    setStatus("Saving Documentation product limits…");
    try {
      const result = await update({
        active_sites_limit: draft.sitesUnlimited ? null : Number(draft.sites),
        active_pages_limit: draft.pagesUnlimited ? null : Number(draft.pages),
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
      setStatus("Documentation product limits were saved.");
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
        setStatus(
          "Limits changed elsewhere. Your proposed values are preserved; review the latest version and retry.",
        );
      } else {
        setStatus("Documentation product limits could not be saved.");
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
      <div className={styles.page} data-current-path={currentPath}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Organization administration</p>
          <h1>Documentation operations</h1>
          <p className={styles.lede}>
            Review active usage, retained storage, and Organization product
            limits.
          </p>
        </header>
        <p className={styles.status} role="status" aria-live="polite">
          {status}
        </p>
        {summary ? (
          <>
            <section
              className={styles.usageSection}
              aria-label="Documentation usage"
            >
              <div className={styles.sectionHeader}>
                <p className={styles.sectionEyebrow}>Current footprint</p>
                <h2 className={styles.sectionTitle}>Usage overview</h2>
                <p className={styles.sectionDescription}>
                  Active content and retained Documentation records for this
                  Organization.
                </p>
              </div>
              <div className={styles.grid}>
                {[
                  ["Active Sites", summary.usage.active_sites],
                  ["Active Pages", summary.usage.active_pages],
                  ["Retained revisions", summary.usage.retained_revisions],
                  [
                    "Retained publications",
                    summary.usage.retained_publications,
                  ],
                  ["Retained file bytes", summary.usage.retained_file_bytes],
                  [
                    "Ready import inspections",
                    summary.usage.active_import_inspections,
                  ],
                  ["Open review requests", summary.usage.open_review_requests],
                ].map(([label, value]) => (
                  <Card key={label}>
                    <CardHeader>
                      <h3 className={styles.cardTitle}>{label}</h3>
                    </CardHeader>
                    <CardContent>
                      <strong className={styles.metric}>
                        {Number(value).toLocaleString()}
                      </strong>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            {state("active_sites")?.state === "over_limit" ||
            state("active_pages")?.state === "over_limit" ? (
              <div className={styles.alert}>
                <Alert>
                  Existing content is retained. Archive or reduce active
                  content; only new growth is blocked while usage is over a
                  limit.
                </Alert>
              </div>
            ) : null}
            {summary.permissions.can_manage_limits && draft ? (
              <section
                className={styles.limitsSection}
                aria-label="Product limits"
              >
                <Card>
                  <CardHeader>
                    <p className={styles.sectionEyebrow}>Organization policy</p>
                    <h2 className={styles.sectionTitle}>Product limits</h2>
                    <p className={styles.sectionDescription}>
                      Set the active Site and Page quotas for this Organization.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form className={styles.form} onSubmit={submit}>
                      <div className={styles.limitGrid}>
                        <fieldset className={styles.limitFieldset}>
                          <legend>Active Documentation Sites</legend>
                          <p className={styles.fieldDescription}>
                            The number of active Documentation Sites.
                          </p>
                          <Label>
                            <input
                              type="checkbox"
                              checked={draft.sitesUnlimited}
                              onChange={(event) =>
                                setDraft({
                                  ...draft,
                                  sitesUnlimited: event.target.checked,
                                })
                              }
                            />{" "}
                            Unlimited product quota
                          </Label>
                          {!draft.sitesUnlimited ? (
                            <Input
                              aria-label="Active Site limit"
                              type="number"
                              min={1}
                              required
                              value={draft.sites}
                              onChange={(event) =>
                                setDraft({
                                  ...draft,
                                  sites: event.target.value,
                                })
                              }
                            />
                          ) : null}
                        </fieldset>
                        <fieldset className={styles.limitFieldset}>
                          <legend>Active Documentation Pages</legend>
                          <p className={styles.fieldDescription}>
                            The number of active Documentation Pages.
                          </p>
                          <Label>
                            <input
                              type="checkbox"
                              checked={draft.pagesUnlimited}
                              onChange={(event) =>
                                setDraft({
                                  ...draft,
                                  pagesUnlimited: event.target.checked,
                                })
                              }
                            />{" "}
                            Unlimited product quota
                          </Label>
                          {!draft.pagesUnlimited ? (
                            <Input
                              aria-label="Active Page limit"
                              type="number"
                              min={1}
                              required
                              value={draft.pages}
                              onChange={(event) =>
                                setDraft({
                                  ...draft,
                                  pages: event.target.value,
                                })
                              }
                            />
                          ) : null}
                        </fieldset>
                      </div>
                      <div className={styles.formActions}>
                        <Button type="submit" disabled={busy}>
                          {busy ? "Saving…" : "Save limits"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </PortalAppShell>
  );
};
