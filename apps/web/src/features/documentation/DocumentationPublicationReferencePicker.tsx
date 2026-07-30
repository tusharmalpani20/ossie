import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import {
  listDocumentationArtifactPublications,
  type DocumentationArtifactPublication,
} from "../../lib/documentationApi";

export const DocumentationPublicationReferencePicker = ({
  projectId,
  versionSlug,
  siteId,
  artifactType,
  onSelect,
  listPublications = listDocumentationArtifactPublications,
}: {
  projectId: string;
  versionSlug: string;
  siteId: string;
  artifactType: "guide" | "interactive_demo";
  onSelect: (publishedArtifactId: string) => void;
  listPublications?: typeof listDocumentationArtifactPublications;
}) => {
  const [publications, setPublications] = useState<
    DocumentationArtifactPublication[]
  >([]);
  const [status, setStatus] = useState("Loading exact Publications…");

  useEffect(() => {
    let active = true;
    listPublications(projectId, versionSlug, siteId, artifactType)
      .then(({ publications: loaded }) => {
        if (!active) return;
        setPublications(loaded);
        setStatus(
          loaded.length ? "Exact Publications loaded." : "No Publications.",
        );
      })
      .catch(() => {
        if (active) setStatus("Publications could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [artifactType, listPublications, projectId, siteId, versionSlug]);

  return (
    <section aria-label={`${artifactType.replaceAll("_", " ")} Publications`}>
      <ul>
        {publications.map((publication) => {
          const label = `${publication.title}, ${publication.project_version_name}, revision ${publication.revision_number}, publication ${publication.publication_sequence}`;
          return (
            <li key={publication.published_artifact_id}>
              <strong>{publication.title}</strong>
              <p>
                {publication.project_version_name} · Revision{" "}
                {publication.revision_number} · Publication{" "}
                {publication.publication_sequence}
              </p>
              <Button
                aria-label={`Select ${label}`}
                onClick={() => onSelect(publication.published_artifact_id)}
              >
                Select exact Publication
              </Button>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" role="status">
        {status}
      </p>
    </section>
  );
};
