import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  createDocumentationPublication,
  listDocumentationPublications,
  listDocumentationPublishLinks,
  listDocumentationRevisions,
  rollbackDocumentationPublication,
  revokeDocumentationPublishLink,
  type DocumentationPublicationSummary,
  type DocumentationPublishLinkSummary,
  type DocumentationRevisionSummary,
} from "../../lib/documentationApi";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canPublish: boolean;
  loadRevisions?: typeof listDocumentationRevisions;
  loadPublications?: typeof listDocumentationPublications;
  loadPublishLinks?: typeof listDocumentationPublishLinks;
  publish?: typeof createDocumentationPublication;
  rollback?: typeof rollbackDocumentationPublication;
  revoke?: typeof revokeDocumentationPublishLink;
};

export const DocumentationPublishingPanel = ({
  projectId,
  versionSlug,
  siteId,
  canPublish,
  loadRevisions = listDocumentationRevisions,
  loadPublications = listDocumentationPublications,
  loadPublishLinks = listDocumentationPublishLinks,
  publish = createDocumentationPublication,
  rollback = rollbackDocumentationPublication,
  revoke = revokeDocumentationPublishLink,
}: Props) => {
  const [revisions, setRevisions] = useState<DocumentationRevisionSummary[]>([]);
  const [publications, setPublications] = useState<
    DocumentationPublicationSummary[]
  >([]);
  const [publishLinks, setPublishLinks] = useState<
    DocumentationPublishLinkSummary[]
  >([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [visibility, setVisibility] = useState<"public" | "restricted">(
    "public",
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [password, setPassword] = useState("");
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading Revision history…");

  useEffect(() => {
    let active = true;
    Promise.all([
      loadRevisions(projectId, versionSlug, siteId),
      loadPublications(projectId, versionSlug, siteId),
      loadPublishLinks(projectId, versionSlug, siteId),
    ])
      .then(([revisionResult, publicationResult, linkResult]) => {
        if (!active) return;
        setRevisions(revisionResult.revisions);
        setPublications(publicationResult.publications);
        setPublishLinks(linkResult.publish_links);
        setStatus(
          revisionResult.revisions.length
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
  }, [
    loadPublishLinks,
    loadPublications,
    loadRevisions,
    projectId,
    siteId,
    versionSlug,
  ]);

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
          visibility,
          expires_at: expiresAt
            ? new Date(expiresAt).toISOString()
            : null,
          password: password || null,
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

  const publishToExisting = async () => {
    const revision = revisions[0];
    const link = publishLinks[0];
    const entry = link?.entries[0];
    if (!revision || !link || !entry) return;
    setStatus("Preparing the exact Publication; the live link is unchanged until success…");
    try {
      const result = await publish(
        projectId,
        versionSlug,
        siteId,
        revision.id,
        {
          mode: "existing",
          link_id: link.id,
          entry_id: entry.id,
          expected_entry_version: entry.version,
        },
      );
      setPublishedSlug(result.link.slug);
      setPublishLinks((current) =>
        current.map((candidate) =>
          candidate.id === link.id
            ? {
                ...candidate,
                entries: candidate.entries.map((candidateEntry) =>
                  candidateEntry.id === entry.id
                    ? {
                        ...candidateEntry,
                        version: result.entry.version,
                        site_publication_id: result.publication.id,
                      }
                    : candidateEntry,
                ),
              }
            : candidate,
        ),
      );
      setStatus(
        `Publication ${result.publication.publication_sequence} is live.`,
      );
    } catch {
      setStatus("Publication failed. The live link was not changed.");
    }
  };

  const rollBackTo = async (publication: DocumentationPublicationSummary) => {
    const link = publishLinks[0];
    const entry = link?.entries[0];
    if (!link || !entry) return;
    setStatus(`Rolling back to exact Publication ${publication.publication_sequence}…`);
    try {
      const result = await rollback(
        projectId,
        versionSlug,
        siteId,
        link.id,
        entry.id,
        publication.id,
        entry.version,
      );
      setPublishLinks((current) =>
        current.map((candidate) =>
          candidate.id === link.id
            ? {
                ...candidate,
                entries: candidate.entries.map((candidateEntry) =>
                  candidateEntry.id === entry.id
                    ? { ...candidateEntry, ...result.entry }
                    : candidateEntry,
                ),
              }
            : candidate,
        ),
      );
      setStatus(
        `Link now serves exact Publication ${publication.publication_sequence}.`,
      );
    } catch {
      setStatus("Rollback failed. The live link was not changed.");
    }
  };

  const revokeLink = async () => {
    const link = publishLinks[0];
    if (!link || link.status !== "active") return;
    setStatus("Revoking Publish Link…");
    try {
      const result = await revoke(
        projectId,
        versionSlug,
        siteId,
        link.id,
        link.version,
      );
      setPublishLinks((current) =>
        current.map((candidate) =>
          candidate.id === link.id ? result.publish_link : candidate,
        ),
      );
      setStatus("Publish Link revoked.");
    } catch {
      setStatus("Publish Link could not be revoked. Reload and retry.");
    }
  };

  const existingLink = publishLinks[0];
  const existingEntry = existingLink?.entries[0];
  const livePublication = publications.find(
    (publication) => publication.id === existingEntry?.site_publication_id,
  );

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
      {existingLink && existingEntry ? (
        <section aria-labelledby="documentation-live-link-heading">
          <h3 id="documentation-live-link-heading">{existingLink.name}</h3>
          <p>
            Live: Publication{" "}
            {livePublication?.publication_sequence ?? "not in this history"}
          </p>
          {canPublish && existingLink.status === "active" ? (
            <Button onClick={() => void revokeLink()}>Revoke link</Button>
          ) : null}
          {canPublish && revisions[0] ? (
            <Button onClick={() => void publishToExisting()}>
              Publish Revision {revisions[0].revision_number} to existing link
            </Button>
          ) : null}
          <ul>
            {publications.map((publication) => (
              <li key={publication.id}>
                Publication {publication.publication_sequence} (Revision{" "}
                {publication.revision_number})
                {canPublish &&
                publication.id !== existingEntry.site_publication_id ? (
                  <Button onClick={() => void rollBackTo(publication)}>
                    Roll back to Publication {publication.publication_sequence}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {canPublish && revisions.length && !existingLink ? (
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
          <Label htmlFor="documentation-link-visibility">Link access</Label>
          <select
            id="documentation-link-visibility"
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as "public" | "restricted")
            }
          >
            <option value="public">Public</option>
            <option value="restricted">Restricted</option>
          </select>
          <Label htmlFor="documentation-link-expires">
            Link expiry (optional)
          </Label>
          <Input
            id="documentation-link-expires"
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
          <Label htmlFor="documentation-link-password">
            Public link password (optional)
          </Label>
          <Input
            id="documentation-link-password"
            type="password"
            value={password}
            minLength={8}
            maxLength={128}
            disabled={visibility === "restricted"}
            onChange={(event) => setPassword(event.target.value)}
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
