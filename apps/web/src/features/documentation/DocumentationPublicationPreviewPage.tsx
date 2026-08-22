import { useEffect, useState } from "react";
import {
  getDocumentationRevision,
  listDocumentationPublications,
  type DocumentationPublicationSummary,
  type DocumentationRevisionSnapshot,
} from "../../lib/documentationApi";
import { DocumentationBlockRenderer } from "./DocumentationBlockRenderer";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  publicationSequence: number;
  loadPublications?: typeof listDocumentationPublications;
  loadRevision?: typeof getDocumentationRevision;
};

type LoadedPublication = {
  publication: DocumentationPublicationSummary;
  revision: DocumentationRevisionSnapshot;
};

export const DocumentationPublicationPreviewPage = ({
  projectId,
  versionSlug,
  siteId,
  publicationSequence,
  loadPublications = listDocumentationPublications,
  loadRevision = getDocumentationRevision,
}: Props) => {
  const [loaded, setLoaded] = useState<LoadedPublication | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(null);
    setFailed(false);

    loadPublications(projectId, versionSlug, siteId)
      .then(({ publications }) =>
        publications.find(
          (publication) =>
            publication.publication_sequence === publicationSequence,
        ),
      )
      .then((publication) => {
        if (!publication)
          throw new Error("Documentation Publication not found");
        return loadRevision(
          projectId,
          versionSlug,
          siteId,
          publication.revision_number,
        ).then(({ revision }) => ({ publication, revision }));
      })
      .then((result) => {
        if (active) setLoaded(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [
    loadPublications,
    loadRevision,
    projectId,
    publicationSequence,
    siteId,
    versionSlug,
  ]);

  if (failed)
    return (
      <p role="alert">
        The immutable Documentation Publication is unavailable.
      </p>
    );
  if (!loaded)
    return <p role="status">Loading immutable Documentation Publication…</p>;

  const { publication, revision } = loaded;
  return (
    <section aria-labelledby="documentation-publication-heading">
      <header>
        <p>Read-only snapshot. Draft changes are not included.</p>
        <h1 id="documentation-publication-heading">
          {revision.site.name} — immutable Publication{" "}
          {publication.publication_sequence}
        </h1>
        <p>
          Published {publication.published_at} from Revision{" "}
          {publication.revision_number}.
        </p>
      </header>
      {(revision.pages ?? []).map((page) => (
        <article key={page.id}>
          <h2>{page.title}</h2>
          <DocumentationBlockRenderer
            blocks={page.blocks}
            snippets={revision.snippets ?? []}
            pageUrl={(pageId, targetBlockId) => {
              const target = revision.pages?.find(
                (candidate) => candidate.id === pageId,
              );
              return target
                ? `${target.canonical_path}${targetBlockId ? `#documentation-block-${targetBlockId}` : ""}`
                : undefined;
            }}
          />
        </article>
      ))}
    </section>
  );
};
