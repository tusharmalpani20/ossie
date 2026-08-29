import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Forward, Inbox, Plus } from "lucide-react";
import {
  createDocumentationSite,
  listDocumentationSites,
  type DocumentationSiteSummary,
} from "../../lib/documentationApi";
import styles from "./ProjectDocumentationSiteListPage.module.css";
import { DocumentationPortabilityPanel } from "./DocumentationPortabilityPanel";
import { listDocumentationReviewInbox } from "../../lib/documentationReviewApi";
import { ProjectVersionEmptyState } from "../project-version/ProjectVersionEmptyState";
import { ProjectVersionSectionHeader } from "../project-version/ProjectVersionSectionHeader";

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
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [reviewUnreadCount, setReviewUnreadCount] = useState(0);

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
  }, [loadSites, projectId, versionSlug]);

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
  };

  if (status === "loading")
    return <p role="status">Loading Documentation Sites…</p>;
  if (status === "error")
    return <p role="alert">Documentation Sites could not be loaded.</p>;

  return (
    <div className={styles.page}>
      <ProjectVersionSectionHeader
        title="Documentation"
        description="Create and manage product and API knowledge for this Project Version."
        actions={
          <>
            {canManage && !creating ? (
              <Button
                size="icon"
                aria-label="Create Site"
                title="Create Site"
                onClick={() => setCreating(true)}
              >
                <Plus aria-hidden="true" size={19} />
              </Button>
            ) : null}
            {canCarry ? (
              <a
                className={styles.headerIconLink}
                href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/carry-forward`}
                aria-label="Carry Forward Sites"
                title="Carry Forward Sites"
              >
                <Forward aria-hidden="true" size={18} />
              </a>
            ) : null}
            <a
              className={styles.headerIconLink}
              href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/reviews`}
              aria-label={
                reviewUnreadCount
                  ? `Review inbox (${reviewUnreadCount} unread)`
                  : "Review inbox"
              }
              title="Review inbox"
            >
              <Inbox aria-hidden="true" size={18} />
              {reviewUnreadCount ? (
                <span className={styles.notificationBadge} aria-hidden="true">
                  {reviewUnreadCount}
                </span>
              ) : null}
            </a>
          </>
        }
      />
      {creating ? (
        <form className={styles.form} onSubmit={submit}>
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
        <ProjectVersionEmptyState
          imageSrc="/illustrations/documentation-sites.png"
          imageAlt="Ossie mascot organizing documentation"
          title="No Documentation Sites yet"
          description={
            canManage
              ? "Create a version-aware Site for product and API knowledge."
              : "No writable Documentation Site is available in this Project Version."
          }
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
