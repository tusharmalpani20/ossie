import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import {
  createDocumentationRevision,
  getDocumentationPreview,
  type DocumentationDraftPreview,
  documentationPackageExportUrl,
  documentationFrozenPackageExportUrl,
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

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canWrite: boolean;
  canPublish: boolean;
  loadPreview?: typeof getDocumentationPreview;
  createRevision?: typeof createDocumentationRevision;
};

export const DocumentationSiteEditorPage = ({
  projectId,
  versionSlug,
  siteId,
  canWrite,
  canPublish,
  loadPreview = getDocumentationPreview,
  createRevision = createDocumentationRevision,
}: Props) => {
  const [preview, setPreview] = useState<DocumentationDraftPreview | null>(
    null,
  );
  const [status, setStatus] = useState("Loading saved draft…");
  const [checkpointCount, setCheckpointCount] = useState(0);
  const [revisions, setRevisions] = useState<DocumentationRevisionSummary[]>([]);
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
  }, [loadPreview, projectId, siteId, versionSlug]);

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
      <DocumentationStructurePanel
        projectId={projectId}
        versionSlug={versionSlug}
        siteId={siteId}
        canWrite={canWrite}
        preview={preview}
      />
      <DocumentationSnippetPanel
        canWrite={canWrite}
        projectId={projectId}
        siteId={siteId}
        versionSlug={versionSlug}
      />
      <DocumentationAssetLibrary
        canWrite={canWrite}
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
          canImport={canWrite}
        />
        <DocumentationPortabilityPanel
          projectId={projectId}
          versionSlug={versionSlug}
          kind="page_markdown"
          mode="page"
          siteId={siteId}
          draftVersion={preview.working_draft.version}
          canImport={canWrite}
        />
      </section>
      <section aria-labelledby="checkpoint-heading">
        <h2 id="checkpoint-heading">Publish</h2>
        <p>
          Preview reflects server-saved content at draft version{" "}
          {preview.working_draft.version}.
        </p>
        <a href={`${base}/preview`}>Preview saved draft</a>
        {canWrite && canPublish ? (
          <Button onClick={() => void checkpoint()}>Create revision</Button>
        ) : (
          <p>Read-only access</p>
        )}
      </section>
      <DocumentationOpenApiPanel
        projectId={projectId}
        versionSlug={versionSlug}
        siteId={siteId}
        canWrite={canWrite}
      />
      <DocumentationPublishingPanel
        key={checkpointCount}
        projectId={projectId}
        versionSlug={versionSlug}
        siteId={siteId}
        canPublish={canPublish}
      />
      <p role="status">{status}</p>
    </section>
  );
};
