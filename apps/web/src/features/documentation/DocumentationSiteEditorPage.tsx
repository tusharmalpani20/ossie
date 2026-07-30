import { useEffect, useState } from "react";
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
  loadPreview?: typeof getDocumentationPreview;
  createRevision?: typeof createDocumentationRevision;
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
  loadPreview = getDocumentationPreview,
  createRevision = createDocumentationRevision,
}: Props) => {
  const [preview, setPreview] = useState<DocumentationDraftPreview | null>(
    null,
  );
  const [status, setStatus] = useState("Loading saved draft…");
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

  const checkpoint = async () => {
    if (!preview) return;
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

  if (!preview) return <p role="status">{status}</p>;
  const base = `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/${encodeURIComponent(siteId)}`;
  const editionEffectiveStatus =
    preview.edition?.effective_status ?? preview.edition?.status ?? "active";
  const effectiveCanWrite = canWrite && editionEffectiveStatus === "active";
  const effectiveCanPublish = canPublish && editionEffectiveStatus === "active";
  return (
    <section aria-labelledby="documentation-site-heading">
      <header>
        <p>Documentation workbench</p>
        <h1 id="documentation-site-heading">{preview.site.name}</h1>
        {preview.site.description ? <p>{preview.site.description}</p> : null}
      </header>
      <nav aria-label="Documentation Pages">
        <h2>Pages</h2>
        {preview.pages.length ? (
          <ul>
            {preview.pages.map((page) => (
              <li key={page.id}>
                <a href={`${base}/pages/${encodeURIComponent(page.id)}`}>
                  {page.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No Pages yet.</p>
        )}
      </nav>
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
      <DocumentationReviewPanel
        projectId={projectId}
        versionSlug={versionSlug}
        siteId={siteId}
        latestRevision={revisions[0] ?? null}
        canRequest={canRequestReview && editionEffectiveStatus === "active"}
        canManagePolicy={canManageReview && editionEffectiveStatus === "active"}
        canDecide={canDecideReview && editionEffectiveStatus === "active"}
      />
      <DocumentationStructurePanel
        projectId={projectId}
        versionSlug={versionSlug}
        siteId={siteId}
        canWrite={effectiveCanWrite}
        preview={preview}
      />
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
      <section aria-labelledby="documentation-portability-heading">
        <h2 id="documentation-portability-heading">Import and export</h2>
        <p>
          Site packages preserve typed content and protected media. Imports
          never overwrite a non-empty Site.
        </p>
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
                    {
                      source: "revision",
                      revision_number: revision.revision_number,
                    },
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
                    {
                      source: "revision",
                      revision_number: revision.revision_number,
                    },
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
                    {
                      source: "publication",
                      site_publication_id: publication.id,
                    },
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
                    {
                      source: "publication",
                      site_publication_id: publication.id,
                    },
                  )}
                  download
                >
                  Export exact OpenAPI source when available
                </a>
              </li>
            ))}
          </ul>
        ) : null}
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
      <section aria-labelledby="checkpoint-heading">
        <h2 id="checkpoint-heading">Publish</h2>
        <p>
          Preview reflects server-saved content at draft version{" "}
          {preview.working_draft.version}.
        </p>
        <a href={`${base}/preview`}>Preview saved draft</a>
        {effectiveCanWrite && effectiveCanPublish ? (
          <Button onClick={() => void checkpoint()}>Create revision</Button>
        ) : (
          <p>Read-only access</p>
        )}
      </section>
      <DocumentationOpenApiPanel
        projectId={projectId}
        versionSlug={versionSlug}
        siteId={siteId}
        canWrite={effectiveCanWrite}
      />
      <DocumentationPublishingPanel
        key={checkpointCount}
        projectId={projectId}
        versionSlug={versionSlug}
        siteId={siteId}
        canPublish={effectiveCanPublish}
        canOverrideReview={canManageReview}
      />
      <p role="status">{status}</p>
    </section>
  );
};
