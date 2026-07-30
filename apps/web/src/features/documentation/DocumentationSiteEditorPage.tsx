import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import {
  createDocumentationRevision,
  getDocumentationPreview,
  type DocumentationDraftPreview,
} from "../../lib/documentationApi";
import { DocumentationOpenApiPanel } from "./DocumentationOpenApiPanel";
import { DocumentationPublishingPanel } from "./DocumentationPublishingPanel";

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
  const [preview, setPreview] = useState<DocumentationDraftPreview | null>(null);
  const [status, setStatus] = useState("Loading saved draft…");
  const [checkpointCount, setCheckpointCount] = useState(0);

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
      setStatus("Revision could not be created. The live publication was not changed.");
    }
  };

  if (!preview) return <p role="status">{status}</p>;
  const base = `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/${encodeURIComponent(siteId)}`;
  return (
    <main id="main-content">
      <header>
        <p>Documentation workbench</p>
        <h1>{preview.site.name}</h1>
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
    </main>
  );
};
