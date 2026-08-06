import { useEffect, useState } from "react";
import {
  getDocumentationPublication,
  type DocumentationPublicationSummary,
  type DocumentationRevisionSnapshot,
} from "../../lib/documentationApi";
import { DocumentationBlockRenderer } from "./DocumentationBlockRenderer";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  publicationSequence: number;
  loadPublication?: typeof getDocumentationPublication;
};

/** Renders the frozen Revision named by one immutable Site Publication. */
export const DocumentationPublicationPreviewPage = ({
  projectId,
  versionSlug,
  siteId,
  publicationSequence,
  loadPublication = getDocumentationPublication,
}: Props) => {
  const [publication, setPublication] =
    useState<DocumentationPublicationSummary | null>(null);
  const [revision, setRevision] =
    useState<DocumentationRevisionSnapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setPublication(null);
    setRevision(null);
    loadPublication(projectId, versionSlug, siteId, publicationSequence)
      .then((loaded) => {
        if (!active) return;
        setPublication(loaded.publication);
        setRevision(loaded.revision);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [
    loadPublication,
    projectId,
    publicationSequence,
    siteId,
    versionSlug,
  ]);

  if (failed)
    return (
      <p role="alert">The immutable Documentation Publication is unavailable.</p>
    );
  if (!publication || !revision)
    return <p role="status">Loading immutable Documentation Publication…</p>;

  const pages = revision.pages ?? [];
  const snippets = revision.snippets ?? [];
  const pageUrl = (pageId: string, targetBlockId?: string | null) => {
    const page = pages.find((candidate) => candidate.id === pageId);
    if (!page) return undefined;
    return `#documentation-page-${encodeURIComponent(page.id)}${
      targetBlockId
        ? `-block-${encodeURIComponent(targetBlockId)}`
        : ""
    }`;
  };
  const assetUrl = (source: { kind: "documentation_asset" | "capture_asset"; id: string }) =>
    `/api/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation-sites/${encodeURIComponent(siteId)}/assets/${source.kind === "capture_asset" ? "capture/" : ""}${encodeURIComponent(source.id)}/file`;

  return (
    <section aria-labelledby="documentation-publication-preview-heading">
      <header>
        <p>Read-only snapshot. Draft changes are not included.</p>
        <h1 id="documentation-publication-preview-heading">
          {revision.site.name} — immutable Publication {publication.publication_sequence}
        </h1>
        <p>
          Published {publication.published_at} · immutable Revision {" "}
          {revision.revision.revision_number}
        </p>
      </header>
      {pages.length > 0 ? (
        pages.map((page) => (
          <article
            id={`documentation-page-${encodeURIComponent(page.id)}`}
            key={page.id}
          >
            <h2>{page.title}</h2>
            {page.description ? <p>{page.description}</p> : null}
            <DocumentationBlockRenderer
              assetUrl={assetUrl}
              blocks={page.blocks}
              operationLabel={(operationKey) => {
                const operation = revision.openapi_operations.find(
                  (candidate) => candidate.destination_key === operationKey,
                );
                return operation
                  ? {
                      method: operation.method,
                      label: operation.summary ?? operation.path,
                      path: operation.path,
                    }
                  : undefined;
              }}
              operationUrl={(operationKey) =>
                `#documentation-operation-${encodeURIComponent(operationKey)}`
              }
              pageUrl={pageUrl}
              snippets={snippets}
            />
          </article>
        ))
      ) : (
        <p role="status">This Publication contains no Documentation Pages.</p>
      )}
    </section>
  );
};
