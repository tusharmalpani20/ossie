import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  createDocumentationPublication,
  listDocumentationRevisions,
  type DocumentationRevisionSummary,
} from "../../lib/documentationApi";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canPublish: boolean;
  loadRevisions?: typeof listDocumentationRevisions;
  publish?: typeof createDocumentationPublication;
};

export const DocumentationPublishingPanel = ({
  projectId,
  versionSlug,
  siteId,
  canPublish,
  loadRevisions = listDocumentationRevisions,
  publish = createDocumentationPublication,
}: Props) => {
  const [revisions, setRevisions] = useState<DocumentationRevisionSummary[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading Revision history…");

  useEffect(() => {
    let active = true;
    loadRevisions(projectId, versionSlug, siteId)
      .then(({ revisions: loaded }) => {
        if (!active) return;
        setRevisions(loaded);
        setStatus(
          loaded.length
            ? "Select the latest exact Revision to publish."
            : "Create a Revision before publishing.",
        );
      })
      .catch(() => {
        if (active) setStatus("Revision history could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [loadRevisions, projectId, siteId, versionSlug]);

  const publishRevision = async () => {
    const revision = revisions[0];
    if (!revision || !name.trim() || !slug.trim()) return;
    setStatus("Preparing the exact Publication; the live link is unchanged until success…");
    try {
      const result = await publish(
        projectId,
        versionSlug,
        siteId,
        revision.id,
        {
          mode: "create",
          name: name.trim(),
          slug: slug.trim(),
          visibility: "public",
        },
      );
      setPublishedSlug(result.link.slug);
      setStatus(
        `Publication ${result.publication.publication_sequence} is live.`,
      );
    } catch {
      setStatus("Publication failed. The live link was not changed.");
    }
  };

  return (
    <section aria-labelledby="documentation-publishing-heading">
      <h2 id="documentation-publishing-heading">Revision history and publication</h2>
      {revisions.length ? (
        <ol>
          {revisions.map((revision) => (
            <li key={revision.id}>Revision {revision.revision_number}</li>
          ))}
        </ol>
      ) : (
        <p>No Revisions yet.</p>
      )}
      {canPublish && revisions.length ? (
        <>
          <Label htmlFor="documentation-link-name">Public link name</Label>
          <Input
            id="documentation-link-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Label htmlFor="documentation-link-slug">Public link slug</Label>
          <Input
            id="documentation-link-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
          <Button onClick={() => void publishRevision()}>
            Publish revision
          </Button>
        </>
      ) : null}
      {publishedSlug ? (
        <a href={`/docs/${encodeURIComponent(publishedSlug)}`}>
          Open published Documentation
        </a>
      ) : null}
      <p role="status">{status}</p>
    </section>
  );
};
