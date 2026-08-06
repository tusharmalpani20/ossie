import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@repo/ui/button";
import {
  createDocumentationRevision,
  getDocumentationPreview,
  type DocumentationDraftPreview,
  documentationPackageExportUrl,
  documentationFrozenPackageExportUrl,
  documentationFrozenOpenApiExportUrl,
  listDocumentationPublications,
  listDocumentationRevisions,
  type DocumentationPublicationSummary,
  type DocumentationRevisionSummary,
} from "../../lib/documentationApi";
import { DocumentationOpenApiPanel } from "./DocumentationOpenApiPanel";
import { DocumentationAssetLibrary } from "./DocumentationAssetLibrary";
import { DocumentationPublishingPanel } from "./DocumentationPublishingPanel";
import { DocumentationSnippetPanel } from "./DocumentationSnippetPanel";
import { DocumentationStructurePanel } from "./DocumentationStructurePanel";
import { DocumentationPortabilityPanel } from "./DocumentationPortabilityPanel";
import {
  DocumentationLifecycleControls,
  DocumentationPageLifecycleControls,
} from "./DocumentationLifecycleControls";
import { DocumentationReviewPanel } from "./DocumentationReviewPanel";
import styles from "./DocumentationSiteEditorPage.module.css";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canWrite: boolean;
  canPublish: boolean;
  canManageEdition?: boolean;
  canRequestReview?: boolean;
  canManageReview?: boolean;
  canDecideReview?: boolean;
  canRebuildProjections?: boolean;
  loadPreview?: typeof getDocumentationPreview;
  createRevision?: typeof createDocumentationRevision;
};

type WorkbenchTask =
  | "author"
  | "site"
  | "review"
  | "content"
  | "portability"
  | "publish";

const tasks: Array<{ id: WorkbenchTask; label: string; description: string }> =
  [
    {
      id: "author",
      label: "Author",
      description: "Organize the Site and open a Page canvas.",
    },
    {
      id: "site",
      label: "Site settings",
      description: "Manage lifecycle and Page availability.",
    },
    {
      id: "review",
      label: "Review",
      description: "Configure approval and inspect review requests.",
    },
    {
      id: "content",
      label: "Content",
      description: "Manage reusable content, assets, and API references.",
    },
    {
      id: "portability",
      label: "Import / export",
      description: "Inspect and move typed Site or Page packages.",
    },
    {
      id: "publish",
      label: "Publish",
      description: "Create Revisions and manage immutable Publications.",
    },
  ];

const taskById = (task: WorkbenchTask) =>
  tasks.find((candidate) => candidate.id === task) ?? tasks[0]!;

type NavigatorProps = {
  base: string;
  pages: DocumentationDraftPreview["pages"];
  homePageId: string | null | undefined;
};

const DocumentationNavigator = ({
  base,
  pages,
  homePageId,
}: NavigatorProps) => (
  <nav className={styles.navigator} aria-label="Documentation Pages">
    <div className={styles.navigatorHeader}>
      <p className={styles.eyebrow}>Navigator</p>
      <h2>Pages</h2>
      <p className={styles.muted}>
        {pages.length ? `${pages.length} Page${pages.length === 1 ? "" : "s"}` : "No Pages yet"}
      </p>
    </div>
    {pages.length ? (
      <ul className={styles.pageList}>
        {pages.map((page) => (
          <li key={page.id}>
            <a
              className={page.id === homePageId ? styles.homePageLink : undefined}
              href={`${base}/pages/${encodeURIComponent(page.id)}`}
              aria-label={page.title}
            >
              <span>{page.title}</span>
              {page.id === homePageId ? (
                <span className={styles.pageMeta}>Home</span>
              ) : null}
              <span className={styles.pagePath}>/{page.canonical_path}</span>
            </a>
          </li>
        ))}
      </ul>
    ) : (
      <p className={styles.emptyState}>No Pages yet.</p>
    )}
    <p className={styles.navigatorHint}>
      Page blocks, metadata, comments, and conflict recovery live in the
      dedicated Page canvas.
    </p>
  </nav>
);

type ContextInspectorProps = {
  preview: DocumentationDraftPreview;
  activeTask: WorkbenchTask;
  base: string;
};

const DocumentationContextInspector = ({
  preview,
  activeTask,
  base,
}: ContextInspectorProps) => {
  const editionStatus =
    preview.edition?.effective_status ?? preview.edition?.status ?? "active";
  const task = taskById(activeTask);

  return (
    <aside className={styles.inspector} aria-label="Documentation context">
      <p className={styles.eyebrow}>Context</p>
      <h2>Site status</h2>
      <dl className={styles.contextList}>
        <div>
          <dt>Edition</dt>
          <dd>{editionStatus}</dd>
        </div>
        <div>
          <dt>Working Draft</dt>
          <dd>v{preview.working_draft.version}</dd>
        </div>
        <div>
          <dt>Pages</dt>
          <dd>{preview.pages.length}</dd>
        </div>
      </dl>
      {preview.edition?.read_only_reason ? (
        <p className={styles.readOnlyNote}>{preview.edition.read_only_reason}</p>
      ) : null}
      <div className={styles.inspectorTask}>
        <p className={styles.eyebrow}>Current task</p>
        <strong>{task.label}</strong>
        <p>{task.description}</p>
      </div>
      <a className={styles.secondaryLink} href={`${base}/preview`}>
        Preview saved draft
      </a>
    </aside>
  );
};

type TaskTabsProps = {
  activeTask: WorkbenchTask;
  onChange: (task: WorkbenchTask) => void;
};

const DocumentationTaskTabs = ({ activeTask, onChange }: TaskTabsProps) => {
  const selectRelativeTask = (currentIndex: number, offset: number) => {
    const nextIndex = (currentIndex + offset + tasks.length) % tasks.length;
    const nextTask = tasks[nextIndex]!;
    onChange(nextTask.id);
    window.setTimeout(() => {
      document.getElementById(`documentation-task-${nextTask.id}`)?.focus();
    });
  };

  return (
    <nav className={styles.taskNavigation} aria-label="Documentation workbench tasks">
      <div className={styles.taskNavigationHeader}>
        <div>
          <p className={styles.eyebrow}>Workbench</p>
          <h2>Choose a task</h2>
        </div>
        <p className={styles.muted}>One task at a time keeps blockers in view.</p>
      </div>
      <div className={styles.taskList} role="tablist" aria-label="Documentation workbench tasks">
        {tasks.map((task, index) => {
          const selected = task.id === activeTask;
          return (
            <button
              key={task.id}
              id={`documentation-task-${task.id}`}
              className={selected ? styles.taskButtonSelected : styles.taskButton}
              type="button"
              role="tab"
              aria-label={task.label}
              aria-selected={selected}
              aria-controls={`documentation-task-panel-${task.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(task.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  selectRelativeTask(index, 1);
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  selectRelativeTask(index, -1);
                }
              }}
            >
              <span>{task.label}</span>
              <small>{task.description}</small>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

type SiteEditorProps = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canManageEdition: boolean;
  canRequestReview: boolean;
  canManageReview: boolean;
  canDecideReview: boolean;
  canRebuildProjections?: boolean;
  preview: DocumentationDraftPreview;
  activeTask: WorkbenchTask;
  checkpointCount: number;
  effectiveCanWrite: boolean;
  effectiveCanPublish: boolean;
  revisions: DocumentationRevisionSummary[];
  publications: DocumentationPublicationSummary[];
  setPreviewRefreshCount: Dispatch<SetStateAction<number>>;
  setCheckpointCount: Dispatch<SetStateAction<number>>;
  setStatus: Dispatch<SetStateAction<string>>;
  createRevision: typeof createDocumentationRevision;
};

const DocumentationTaskPanel = ({
  projectId,
  versionSlug,
  siteId,
  canManageEdition,
  canRequestReview,
  canManageReview,
  canDecideReview,
  canRebuildProjections,
  preview,
  activeTask,
  checkpointCount,
  effectiveCanWrite,
  effectiveCanPublish,
  revisions,
  publications,
  setPreviewRefreshCount,
  setCheckpointCount,
  setStatus,
  createRevision,
}: SiteEditorProps) => {
  const base = `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/${encodeURIComponent(siteId)}`;
  const editionEffectiveStatus =
    preview.edition?.effective_status ?? preview.edition?.status ?? "active";

  const checkpoint = async () => {
    setStatus("Creating revision…");
    try {
      const { revision } = await createRevision(
        projectId,
        versionSlug,
        siteId,
        preview.edition?.version ?? 1,
        preview.working_draft.version,
      );
      setCheckpointCount((current) => current + 1);
      setStatus(`Revision ${revision.revision_number} is ready.`);
    } catch {
      setStatus(
        "Revision could not be created. The live publication was not changed.",
      );
    }
  };

  if (activeTask === "author") {
    return (
      <section
        id="documentation-task-panel-author"
        className={styles.canvas}
        role="tabpanel"
        aria-labelledby="documentation-task-author"
        tabIndex={-1}
      >
        <div className={styles.canvasHeader}>
          <p className={styles.eyebrow}>Content canvas</p>
          <h2>Organize the Site, then open a Page</h2>
          <p>
            Choose a Page in the navigator to edit its blocks, metadata,
            comments, and recovery state in the dedicated Page canvas.
          </p>
        </div>
        <DocumentationStructurePanel
          projectId={projectId}
          versionSlug={versionSlug}
          siteId={siteId}
          canWrite={effectiveCanWrite}
          preview={preview}
        />
      </section>
    );
  }

  if (activeTask === "site") {
    return (
      <section
        id="documentation-task-panel-site"
        className={styles.canvas}
        role="tabpanel"
        aria-labelledby="documentation-task-site"
        tabIndex={-1}
      >
        <div className={styles.canvasHeader}>
          <p className={styles.eyebrow}>Administrative task</p>
          <h2>Site and Page settings</h2>
          <p>Lifecycle changes are explicit and remain guarded by the current Edition state.</p>
        </div>
        <DocumentationLifecycleControls
          projectId={projectId}
          versionSlug={versionSlug}
          siteId={siteId}
          title={preview.edition?.title ?? preview.site.name}
          status={preview.edition?.status ?? "active"}
          effectiveStatus={editionEffectiveStatus}
          readOnlyReason={preview.edition?.read_only_reason ?? null}
          editionVersion={preview.edition?.version ?? 1}
          canManage={canManageEdition}
          onChanged={() => setPreviewRefreshCount((current) => current + 1)}
        />
        <DocumentationPageLifecycleControls
          projectId={projectId}
          versionSlug={versionSlug}
          siteId={siteId}
          preview={preview}
          canWrite={effectiveCanWrite}
        />
      </section>
    );
  }

  if (activeTask === "review") {
    return (
      <section
        id="documentation-task-panel-review"
        className={styles.canvas}
        role="tabpanel"
        aria-labelledby="documentation-task-review"
        tabIndex={-1}
      >
        <div className={styles.canvasHeader}>
          <p className={styles.eyebrow}>Administrative task</p>
          <h2>Review and approval</h2>
          <p>Review targets stay tied to an exact immutable Revision.</p>
        </div>
        <DocumentationReviewPanel
          projectId={projectId}
          versionSlug={versionSlug}
          siteId={siteId}
          latestRevision={revisions[0] ?? null}
          canRequest={canRequestReview && editionEffectiveStatus === "active"}
          canManagePolicy={canManageReview && editionEffectiveStatus === "active"}
          canDecide={canDecideReview && editionEffectiveStatus === "active"}
        />
      </section>
    );
  }

  if (activeTask === "content") {
    return (
      <section
        id="documentation-task-panel-content"
        className={styles.canvas}
        role="tabpanel"
        aria-labelledby="documentation-task-content"
        tabIndex={-1}
      >
        <div className={styles.canvasHeader}>
          <p className={styles.eyebrow}>Contextual content</p>
          <h2>Content, assets, and API references</h2>
          <p>Reusable content and browser-direct API policy are managed here, outside the Page writing canvas.</p>
        </div>
        <DocumentationSnippetPanel
          canWrite={effectiveCanWrite}
          projectId={projectId}
          siteId={siteId}
          versionSlug={versionSlug}
        />
        <DocumentationAssetLibrary
          canWrite={effectiveCanWrite}
          projectId={projectId}
          siteId={siteId}
          versionSlug={versionSlug}
        />
        <DocumentationOpenApiPanel
          projectId={projectId}
          versionSlug={versionSlug}
          siteId={siteId}
          canWrite={effectiveCanWrite}
          canManageTryIt={canManageEdition}
        />
      </section>
    );
  }

  if (activeTask === "portability") {
    return (
      <section
        id="documentation-task-panel-portability"
        className={styles.canvas}
        role="tabpanel"
        aria-labelledby="documentation-task-portability"
        tabIndex={-1}
      >
        <div className={styles.canvasHeader}>
          <p className={styles.eyebrow}>Dedicated task</p>
          <h2>Import and export</h2>
          <p>Inspect before applying. Site packages preserve typed content and protected media.</p>
        </div>
        <section aria-labelledby="documentation-portability-heading">
          <h3 id="documentation-portability-heading">Saved artifacts</h3>
          <p>Imports never overwrite a non-empty Site.</p>
          <a
            href={documentationPackageExportUrl(
              projectId,
              versionSlug,
              siteId,
              preview.site.version ?? 1,
              preview.working_draft.version,
            )}
            download
          >
            Export saved draft ZIP
          </a>
          {revisions.length ? (
            <ul>
              {revisions.map((revision) => (
                <li key={revision.id}>
                  <a
                    href={documentationFrozenPackageExportUrl(
                      projectId,
                      versionSlug,
                      siteId,
                      { source: "revision", revision_number: revision.revision_number },
                    )}
                    download
                  >
                    Export Revision {revision.revision_number} ZIP
                  </a>
                  {" · "}
                  <a
                    href={documentationFrozenOpenApiExportUrl(
                      projectId,
                      versionSlug,
                      siteId,
                      { source: "revision", revision_number: revision.revision_number },
                    )}
                    download
                  >
                    Export exact OpenAPI source when available
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {publications.length ? (
            <ul>
              {publications.map((publication) => (
                <li key={publication.id}>
                  <a
                    href={documentationFrozenPackageExportUrl(
                      projectId,
                      versionSlug,
                      siteId,
                      { source: "publication", site_publication_id: publication.id },
                    )}
                    download
                  >
                    Export Publication {publication.publication_sequence} ZIP
                  </a>
                  {" · "}
                  <a
                    href={documentationFrozenOpenApiExportUrl(
                      projectId,
                      versionSlug,
                      siteId,
                      { source: "publication", site_publication_id: publication.id },
                    )}
                    download
                  >
                    Export exact OpenAPI source when available
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
        <DocumentationPortabilityPanel
          projectId={projectId}
          versionSlug={versionSlug}
          kind="site_package"
          mode="empty_site"
          siteId={siteId}
          siteVersion={preview.site.version ?? 1}
          draftVersion={preview.working_draft.version}
          canImport={effectiveCanWrite}
          onApplied={() => setPreviewRefreshCount((current) => current + 1)}
        />
        <DocumentationPortabilityPanel
          projectId={projectId}
          versionSlug={versionSlug}
          kind="page_markdown"
          mode="page"
          siteId={siteId}
          draftVersion={preview.working_draft.version}
          canImport={effectiveCanWrite}
          onApplied={() => setPreviewRefreshCount((current) => current + 1)}
        />
      </section>
    );
  }

  return (
    <section
      id="documentation-task-panel-publish"
      className={styles.canvas}
      role="tabpanel"
      aria-labelledby="documentation-task-publish"
      tabIndex={-1}
    >
      <div className={styles.canvasHeader}>
        <p className={styles.eyebrow}>Administrative task</p>
        <h2>Publish</h2>
        <p>Only an exact Revision can become an immutable Publication.</p>
      </div>
      <section aria-labelledby="checkpoint-heading">
        <h3 id="checkpoint-heading">Create a Revision</h3>
        <p>
          Preview reflects server-saved content at draft version {preview.working_draft.version}.
        </p>
        <a href={`${base}/preview`}>Preview saved draft</a>
        {effectiveCanWrite && effectiveCanPublish ? (
          <Button onClick={() => void checkpoint()}>Create revision</Button>
        ) : (
          <p>Read-only access</p>
        )}
      </section>
      <DocumentationPublishingPanel
        key={checkpointCount}
        projectId={projectId}
        versionSlug={versionSlug}
        siteId={siteId}
        canPublish={effectiveCanPublish}
        canOverrideReview={canManageReview}
        canManageDiscovery={canManageEdition}
        canRebuildProjections={canRebuildProjections}
      />
    </section>
  );
};

export const DocumentationSiteEditorPage = ({
  projectId,
  versionSlug,
  siteId,
  canWrite,
  canPublish,
  canManageEdition = false,
  canRequestReview = false,
  canManageReview = false,
  canDecideReview = false,
  canRebuildProjections,
  loadPreview = getDocumentationPreview,
  createRevision = createDocumentationRevision,
}: Props) => {
  const [preview, setPreview] = useState<DocumentationDraftPreview | null>(
    null,
  );
  const [status, setStatus] = useState("Loading saved draft…");
  const [activeTask, setActiveTask] = useState<WorkbenchTask>("author");
  const [checkpointCount, setCheckpointCount] = useState(0);
  const [previewRefreshCount, setPreviewRefreshCount] = useState(0);
  const [revisions, setRevisions] = useState<DocumentationRevisionSummary[]>(
    [],
  );
  const [publications, setPublications] = useState<
    DocumentationPublicationSummary[]
  >([]);

  useEffect(() => {
    let active = true;
    loadPreview(projectId, versionSlug, siteId)
      .then(({ preview: loaded }) => {
        if (!active) return;
        setPreview(loaded);
        setStatus("Saved draft loaded.");
      })
      .catch(() => {
        if (active) setStatus("Documentation Site could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [loadPreview, previewRefreshCount, projectId, siteId, versionSlug]);

  useEffect(() => {
    let active = true;
    Promise.all([
      listDocumentationRevisions(projectId, versionSlug, siteId),
      listDocumentationPublications(projectId, versionSlug, siteId),
    ])
      .then(([revisionResult, publicationResult]) => {
        if (!active) return;
        setRevisions(revisionResult.revisions);
        setPublications(publicationResult.publications);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [checkpointCount, projectId, siteId, versionSlug]);

  if (!preview) return <p role="status">{status}</p>;

  const base = `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/${encodeURIComponent(siteId)}`;
  const editionEffectiveStatus =
    preview.edition?.effective_status ?? preview.edition?.status ?? "active";
  const effectiveCanWrite = canWrite && editionEffectiveStatus === "active";
  const effectiveCanPublish = canPublish && editionEffectiveStatus === "active";
  const currentTask = taskById(activeTask);

  return (
    <section className={styles.workbench} aria-labelledby="documentation-site-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Documentation workbench</p>
          <h1 id="documentation-site-heading">{preview.site.name}</h1>
          {preview.site.description ? <p>{preview.site.description}</p> : null}
        </div>
        <div className={styles.headerMeta} role="group" aria-label="Draft status">
          <span className={styles.statusPill}>{editionEffectiveStatus}</span>
          <span>Working Draft v{preview.working_draft.version}</span>
        </div>
      </header>

      <DocumentationTaskTabs activeTask={activeTask} onChange={setActiveTask} />

      <div className={styles.workspaceGrid}>
        <DocumentationNavigator
          base={base}
          pages={preview.pages}
          homePageId={preview.working_draft.home_page_id}
        />
        <DocumentationTaskPanel
          projectId={projectId}
          versionSlug={versionSlug}
          siteId={siteId}
          canManageEdition={canManageEdition}
          canRequestReview={canRequestReview}
          canManageReview={canManageReview}
          canDecideReview={canDecideReview}
          canRebuildProjections={canRebuildProjections}
          preview={preview}
          activeTask={activeTask}
          checkpointCount={checkpointCount}
          effectiveCanWrite={effectiveCanWrite}
          effectiveCanPublish={effectiveCanPublish}
          revisions={revisions}
          publications={publications}
          setPreviewRefreshCount={setPreviewRefreshCount}
          setCheckpointCount={setCheckpointCount}
          setStatus={setStatus}
          createRevision={createRevision}
        />
        <DocumentationContextInspector
          preview={preview}
          activeTask={activeTask}
          base={base}
        />
      </div>

      <p
        className={styles.statusBar}
        role="status"
        aria-label="Documentation workbench status"
      >
        <strong>{currentTask.label}</strong>
        <span>{status}</span>
      </p>
    </section>
  );
};
