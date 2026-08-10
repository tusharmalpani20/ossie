import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Alert } from "@repo/ui/alert";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { StatusPanel } from "@repo/ui/status-panel";
import {
  createDocumentationSite,
  listDocumentationSites,
  type DocumentationSiteSummary,
} from "../../lib/documentationApi";
import styles from "./ProjectDocumentationSiteListPage.module.css";
import { DocumentationPortabilityPanel } from "./DocumentationPortabilityPanel";
import { listDocumentationReviewInbox } from "../../lib/documentationReviewApi";

type Props = {
  projectId: string;
  versionSlug: string;
  canManage: boolean;
  canCarry?: boolean;
  importUnavailableReason?: string;
  loadSites?: typeof listDocumentationSites;
  createSite?: typeof createDocumentationSite;
  loadReviewInbox?: typeof listDocumentationReviewInbox;
};

export const ProjectDocumentationSiteListPage = ({
  projectId,
  versionSlug,
  canManage,
  canCarry = false,
  importUnavailableReason,
  loadSites = listDocumentationSites,
  createSite = createDocumentationSite,
  loadReviewInbox = listDocumentationReviewInbox,
}: Props) => {
  const [sites, setSites] = useState<DocumentationSiteSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [reviewUnreadCount, setReviewUnreadCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    loadSites(projectId, versionSlug)
      .then((result) => {
        if (active) {
          setSites(result.documentation_sites);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [loadSites, projectId, reloadKey, versionSlug]);

  useEffect(() => {
    let active = true;
    loadReviewInbox(projectId, versionSlug)
      .then((inbox) => {
        if (active) setReviewUnreadCount(inbox.unread_count);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [loadReviewInbox, projectId, versionSlug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    try {
      const created = await createSite(projectId, versionSlug, {
        name,
        description: null,
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      });
      setSites((current) => [
        ...current,
        {
          id: created.site.id,
          name: created.site.name,
          description: created.site.description ?? null,
          edition_id: created.edition.id,
          primary_language: created.edition.primary_language,
          version: 1,
          edition_version: 1,
          status: "active",
          effective_status: "active",
          read_only_reason: null,
          updated_at: new Date().toISOString(),
        },
      ]);
      setCreating(false);
    } catch {
      setCreateError("Could not create Documentation Site.");
    }
  };

  if (status === "loading")
    return (
      <StatusPanel
        className={styles.state}
        tone="loading"
        title="Documentation Sites"
        description="Loading Documentation Sites…"
        titleAs="h1"
      />
    );
  if (status === "error")
    return (
      <StatusPanel
        className={styles.state}
        tone="error"
        title="Documentation Sites"
        description="Documentation Sites could not be loaded."
        action={
          <Button type="button" onClick={() => setReloadKey((current) => current + 1)}>
            Try again
          </Button>
        }
        titleAs="h1"
      />
    );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Project Version Documentation</p>
          <h1>Documentation Sites</h1>
        </div>
        {canManage && !creating ? (
          <div>
            <Button onClick={() => setCreating(true)}>Create Site</Button>
          </div>
        ) : null}
        {canCarry ? (
          <a
            href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/carry-forward`}
          >
            Carry Forward Sites
          </a>
        ) : null}
        <a
          href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/reviews`}
        >
          Review inbox
          {reviewUnreadCount ? ` (${reviewUnreadCount} unread)` : ""}
        </a>
      </header>
      {creating ? (
        <form className={styles.form} onSubmit={submit}>
          {createError ? (
            <Alert
              variant="destructive"
              role="alert"
              aria-label="Documentation Site creation failed"
            >
              {createError}
            </Alert>
          ) : null}
          <Label htmlFor="documentation-site-name">Site name</Label>
          <Input
            id="documentation-site-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={200}
          />
          <Button type="submit">Create Documentation Site</Button>
        </form>
      ) : null}
      {!canManage && importUnavailableReason ? (
        <p role="note">{importUnavailableReason}</p>
      ) : null}
      {sites.length === 0 ? (
        <StatusPanel
          className={styles.empty}
          tone="empty"
          title="No Documentation Sites yet"
          description={
            canManage
              ? "Create a version-aware Site for product and API knowledge."
              : "No writable Documentation Site is available in this Project Version."
          }
          titleAs="h2"
        />
      ) : (
        <ul className={styles.list}>
          {sites.map((site) => (
            <li key={site.id}>
              <a
                href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/${encodeURIComponent(site.id)}`}
              >
                <strong>{site.name}</strong>
                <span>{site.primary_language}</span>
                {site.status === "archived" ? <span>Archived</span> : null}
              </a>
            </li>
          ))}
        </ul>
      )}
      <DocumentationPortabilityPanel
        projectId={projectId}
        versionSlug={versionSlug}
        kind="site_package"
        mode="create_site"
        canImport={canManage}
        headingLevel={2}
        onApplied={(siteId) => {
          window.location.assign(
            `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/${encodeURIComponent(siteId)}`,
          );
        }}
      />
    </div>
  );
};
