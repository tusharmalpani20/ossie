import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  createDocumentationPublication,
  getDocumentationOperations,
  getDocumentationDiscoveryPolicy,
  listDocumentationPublications,
  listDocumentationPublishLinks,
  listDocumentationRevisions,
  rollbackDocumentationPublication,
  rebuildDocumentationProjection,
  revokeDocumentationPublishLink,
  updateDocumentationDiscoveryPolicy,
  type DocumentationPublicationSummary,
  type DocumentationPublishLinkSummary,
  type DocumentationRevisionSummary,
} from "../../lib/documentationApi";
import { getDocumentationReviewGate } from "../../lib/documentationReviewApi";
import {
  getDocumentationPublishLinkTryItPolicy,
  patchDocumentationPublishLinkTryItPolicy,
} from "../../lib/documentationTryItApi";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canPublish: boolean;
  canOverrideReview?: boolean;
  canManageDiscovery?: boolean;
  canRebuildProjections?: boolean;
  loadOperations?: typeof getDocumentationOperations;
  loadRevisions?: typeof listDocumentationRevisions;
  loadPublications?: typeof listDocumentationPublications;
  loadPublishLinks?: typeof listDocumentationPublishLinks;
  publish?: typeof createDocumentationPublication;
  rollback?: typeof rollbackDocumentationPublication;
  revoke?: typeof revokeDocumentationPublishLink;
  loadReviewGate?: typeof getDocumentationReviewGate;
  rebuildProjection?: typeof rebuildDocumentationProjection;
};

export const DocumentationPublishingPanel = ({
  projectId,
  versionSlug,
  siteId,
  canPublish,
  canOverrideReview = false,
  canManageDiscovery = false,
  canRebuildProjections,
  loadOperations = getDocumentationOperations,
  loadRevisions = listDocumentationRevisions,
  loadPublications = listDocumentationPublications,
  loadPublishLinks = listDocumentationPublishLinks,
  publish = createDocumentationPublication,
  rollback = rollbackDocumentationPublication,
  revoke = revokeDocumentationPublishLink,
  loadReviewGate = getDocumentationReviewGate,
  rebuildProjection = rebuildDocumentationProjection,
}: Props) => {
  const [revisions, setRevisions] = useState<DocumentationRevisionSummary[]>(
    [],
  );
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
  const [selectedRevisionId, setSelectedRevisionId] = useState("");
  const [reviewGate, setReviewGate] = useState<Awaited<
    ReturnType<typeof getDocumentationReviewGate>
  > | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [linkTryItPolicy, setLinkTryItPolicy] = useState<Awaited<
    ReturnType<typeof getDocumentationPublishLinkTryItPolicy>
  > | null>(null);
  const [discoveryPolicy, setDiscoveryPolicy] = useState<Awaited<
    ReturnType<typeof getDocumentationDiscoveryPolicy>
  > | null>(null);
  const [ownerCanRebuild, setOwnerCanRebuild] = useState(
    canRebuildProjections ?? false,
  );

  useEffect(() => {
    if (canRebuildProjections !== undefined) {
      setOwnerCanRebuild(canRebuildProjections);
      return;
    }
    let active = true;
    loadOperations()
      .then((result) => {
        if (active) setOwnerCanRebuild(result.permissions.can_manage_limits);
      })
      .catch(() => {
        if (active) setOwnerCanRebuild(false);
      });
    return () => {
      active = false;
    };
  }, [canRebuildProjections, loadOperations]);

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
        setSelectedRevisionId(
          (current) => current || revisionResult.revisions[0]?.id || "",
        );
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

  useEffect(() => {
    if (!selectedRevisionId) return;
    let active = true;
    const refreshGate = () =>
      loadReviewGate(projectId, versionSlug, siteId, selectedRevisionId)
        .then((gate) => {
          if (active) setReviewGate(gate);
        })
        .catch(() => {
          if (active) setReviewGate(null);
        });
    void refreshGate();
    const handleGateChange = (event: Event) => {
      const selected = event as CustomEvent<{ siteId?: string }>;
      if (!selected.detail?.siteId || selected.detail.siteId === siteId)
        void refreshGate();
    };
    window.addEventListener(
      "documentation-review-gate-changed",
      handleGateChange,
    );
    return () => {
      active = false;
      window.removeEventListener(
        "documentation-review-gate-changed",
        handleGateChange,
      );
    };
  }, [loadReviewGate, projectId, selectedRevisionId, siteId, versionSlug]);

  useEffect(() => {
    const link = publishLinks[0];
    if (!link) {
      setLinkTryItPolicy(null);
      return;
    }
    let active = true;
    getDocumentationPublishLinkTryItPolicy(
      projectId,
      versionSlug,
      siteId,
      link.id,
    )
      .then((policy) => {
        if (active) setLinkTryItPolicy(policy);
      })
      .catch(() => {
        if (active) setLinkTryItPolicy(null);
      });
    return () => {
      active = false;
    };
  }, [projectId, publishLinks, siteId, versionSlug]);

  useEffect(() => {
    const link = publishLinks[0];
    if (!link) {
      setDiscoveryPolicy(null);
      return;
    }
    let active = true;
    getDocumentationDiscoveryPolicy(projectId, versionSlug, siteId, link.id)
      .then((policy) => {
        if (active) setDiscoveryPolicy(policy);
      })
      .catch(() => {
        if (active) setDiscoveryPolicy(null);
      });
    return () => {
      active = false;
    };
  }, [projectId, publishLinks, siteId, versionSlug]);

  const selectedRevision =
    revisions.find((revision) => revision.id === selectedRevisionId) ?? null;
  const gateBlocked =
    reviewGate?.outcome === "approval_missing" ||
    reviewGate?.outcome === "approval_pending" ||
    reviewGate?.outcome === "invalidated";
  const reviewOverride =
    gateBlocked &&
    canOverrideReview &&
    overrideConfirmed &&
    overrideReason.trim().length >= 20
      ? {
          expected_policy_version: reviewGate!.policy_version,
          reason: overrideReason.trim(),
        }
      : null;

  const publishRevision = async () => {
    const revision = selectedRevision;
    if (!revision || !name.trim() || !slug.trim()) return;
    setStatus(
      "Preparing the exact Publication; the live link is unchanged until success…",
    );
    try {
      const args = [
        projectId,
        versionSlug,
        siteId,
        revision.id,
        {
          mode: "create",
          name: name.trim(),
          slug: slug.trim(),
          visibility,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          password: password || null,
        },
      ] as const;
      const result = reviewOverride
        ? await publish(...args, reviewOverride)
        : await publish(...args);
      setPublishedSlug(result.link.slug);
      setOverrideReason("");
      setOverrideConfirmed(false);
      window.dispatchEvent(
        new CustomEvent("documentation-review-gate-changed", {
          detail: { siteId, source: "publishing" },
        }),
      );
      setStatus(
        `Publication ${result.publication.publication_sequence} is live.`,
      );
    } catch {
      setStatus("Publication failed. The live link was not changed.");
    }
  };

  const publishToExisting = async () => {
    const revision = selectedRevision;
    const link = publishLinks[0];
    const entry = link?.entries[0];
    if (!revision || !link || !entry) return;
    setStatus(
      "Preparing the exact Publication; the live link is unchanged until success…",
    );
    try {
      const args = [
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
      ] as const;
      const result = reviewOverride
        ? await publish(...args, reviewOverride)
        : await publish(...args);
      setPublishedSlug(result.link.slug);
      setOverrideReason("");
      setOverrideConfirmed(false);
      window.dispatchEvent(
        new CustomEvent("documentation-review-gate-changed", {
          detail: { siteId, source: "publishing" },
        }),
      );
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
    const targetRevision = revisions.find(
      (revision) => revision.revision_number === publication.revision_number,
    );
    if (!targetRevision) {
      setStatus("The rollback Revision is not available in Revision history.");
      return;
    }
    if (selectedRevisionId !== targetRevision.id) {
      setSelectedRevisionId(targetRevision.id);
      setOverrideReason("");
      setOverrideConfirmed(false);
      window.dispatchEvent(
        new CustomEvent("documentation-review-gate-changed", {
          detail: { siteId, source: "publishing" },
        }),
      );
      setStatus(
        `Review gate loaded for rollback Publication ${publication.publication_sequence}. Confirm the rollback again.`,
      );
      return;
    }
    setStatus(
      `Rolling back to exact Publication ${publication.publication_sequence}…`,
    );
    try {
      const args = [
        projectId,
        versionSlug,
        siteId,
        link.id,
        entry.id,
        publication.id,
        entry.version,
      ] as const;
      const result = reviewOverride
        ? await rollback(...args, reviewOverride)
        : await rollback(...args);
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
      setOverrideReason("");
      setOverrideConfirmed(false);
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

  const setLinkTryItEnabled = async (enabled: boolean) => {
    const link = publishLinks[0];
    if (!link) return;
    if (
      enabled &&
      !window.confirm(
        `Enable browser-direct Try It for ${link.name}? Link access does not grant target API access.`,
      )
    )
      return;
    setStatus(`${enabled ? "Enabling" : "Disabling"} Try It for this link…`);
    try {
      await patchDocumentationPublishLinkTryItPolicy(
        projectId,
        versionSlug,
        siteId,
        link.id,
        {
          expected_policy_version: linkTryItPolicy?.policy?.version ?? null,
          expected_link_version: link.version,
          enabled,
        },
      );
      const refreshed = await getDocumentationPublishLinkTryItPolicy(
        projectId,
        versionSlug,
        siteId,
        link.id,
      );
      setLinkTryItPolicy(refreshed);
      setStatus(
        enabled
          ? "Try It enabled for compatible current entries."
          : "Try It disabled for this Publish Link.",
      );
    } catch {
      setStatus(
        "Try It link policy was not changed. Reload the current link state.",
      );
    }
  };

  const makePrimaryDiscoveryLink = async () => {
    const link = publishLinks[0];
    if (
      !link ||
      !discoveryPolicy ||
      typeof discoveryPolicy.effective_reason !== "string"
    )
      return;
    if (
      !window.confirm(
        `Make ${link.name} the primary canonical, indexable Documentation link? Other links serving duplicate content will become noindex.`,
      )
    )
      return;
    setStatus("Updating the primary Documentation discovery link…");
    try {
      const policy = await updateDocumentationDiscoveryPolicy(
        projectId,
        versionSlug,
        siteId,
        link.id,
        {
          expected_version: discoveryPolicy.version,
          indexing_enabled: true,
          is_primary_canonical: true,
        },
      );
      setDiscoveryPolicy(policy);
      setStatus("Primary Documentation discovery link updated.");
    } catch {
      setStatus(
        "Discovery policy was not changed. Reload the current link state.",
      );
    }
  };

  const rebuildProjectionTarget = async (
    target:
      | { projection: "draft_search" }
      | { projection: "publication_search"; publication_id: string },
    label: string,
  ) => {
    if (
      !window.confirm(
        `Rebuild the ${label} search projection from its exact immutable source? The current valid projection remains available if rebuilding fails.`,
      )
    )
      return;
    setStatus(`Rebuilding the ${label} search projection…`);
    try {
      const receipt = await rebuildProjection(
        projectId,
        versionSlug,
        siteId,
        target,
      );
      setStatus(
        `${label} search projection ${receipt.outcome}; ${receipt.documents} documents verified.`,
      );
    } catch {
      setStatus(
        `${label} search projection rebuild failed. The prior valid projection remains selected.`,
      );
    }
  };

  const existingLink = publishLinks[0];
  const existingEntry = existingLink?.entries[0];
  const effectiveDiscoveryPolicy =
    discoveryPolicy && typeof discoveryPolicy.effective_reason === "string"
      ? discoveryPolicy
      : null;
  const livePublication = publications.find(
    (publication) => publication.id === existingEntry?.site_publication_id,
  );

  return (
    <section aria-labelledby="documentation-publishing-heading">
      <h2 id="documentation-publishing-heading">
        Revision history and publication
      </h2>
      {revisions.length ? (
        <>
          <Label htmlFor="documentation-publication-revision">
            Exact Revision
          </Label>
          <select
            id="documentation-publication-revision"
            value={selectedRevisionId}
            onChange={(event) => {
              setSelectedRevisionId(event.target.value);
              setOverrideReason("");
              setOverrideConfirmed(false);
            }}
          >
            {revisions.map((revision) => (
              <option key={revision.id} value={revision.id}>
                Revision {revision.revision_number}
              </option>
            ))}
          </select>
          <p>
            Review gate:{" "}
            {reviewGate
              ? reviewGate.outcome.replaceAll("_", " ")
              : "Loading gate status"}
          </p>
          {gateBlocked && canOverrideReview ? (
            <>
              <Label htmlFor="documentation-review-override-reason">
                Admin override reason (at least 20 characters)
              </Label>
              <textarea
                id="documentation-review-override-reason"
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                maxLength={1000}
              />
              <label>
                <input
                  type="checkbox"
                  checked={overrideConfirmed}
                  onChange={(event) =>
                    setOverrideConfirmed(event.target.checked)
                  }
                />
                I confirm this Admin override for the selected exact Revision
              </label>
            </>
          ) : null}
        </>
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
          {effectiveDiscoveryPolicy ? (
            <section aria-labelledby="documentation-discovery-heading">
              <h4 id="documentation-discovery-heading">Search discovery</h4>
              <p>
                {effectiveDiscoveryPolicy.is_primary_canonical
                  ? "Primary canonical link."
                  : "Not the primary canonical link."}{" "}
                Effective indexing:{" "}
                {effectiveDiscoveryPolicy.effective_indexing
                  ? "enabled"
                  : `disabled (${effectiveDiscoveryPolicy.effective_reason.replaceAll("_", " ")})`}
                .
              </p>
              {!effectiveDiscoveryPolicy.is_primary_canonical &&
              canManageDiscovery &&
              existingLink.status === "active" &&
              existingLink.visibility === "public" ? (
                <Button onClick={() => void makePrimaryDiscoveryLink()}>
                  Make primary and indexable
                </Button>
              ) : null}
            </section>
          ) : null}
          {linkTryItPolicy ? (
            <section aria-labelledby="documentation-link-try-it-heading">
              <h4 id="documentation-link-try-it-heading">Published Try It</h4>
              <p>
                Status: {linkTryItPolicy.effective_status.replaceAll("_", " ")}
              </p>
              <p>
                Publish Link access does not grant access to the target API.
                Readers must provide their own target authorization.
              </p>
              <ul>
                {linkTryItPolicy.entries.map((entry) => (
                  <li key={entry.entry_id}>
                    {entry.project_version_label}: {entry.effective_status}
                  </li>
                ))}
              </ul>
              {canOverrideReview && existingLink.status === "active" ? (
                <Button
                  onClick={() =>
                    void setLinkTryItEnabled(
                      !(linkTryItPolicy.policy?.enabled ?? false),
                    )
                  }
                >
                  {linkTryItPolicy.policy?.enabled
                    ? "Disable published Try It"
                    : "Enable published Try It"}
                </Button>
              ) : null}
            </section>
          ) : null}
          {canPublish && selectedRevision ? (
            <Button
              disabled={gateBlocked && !reviewOverride}
              onClick={() => void publishToExisting()}
            >
              Publish Revision {selectedRevision.revision_number} to existing
              link
            </Button>
          ) : null}
          <ul>
            {publications.map((publication) => (
              <li key={publication.id}>
                Publication {publication.publication_sequence} (Revision{" "}
                {publication.revision_number})
                {canPublish &&
                publication.id !== existingEntry.site_publication_id ? (
                  <Button
                    disabled={
                      revisions.find(
                        (revision) =>
                          revision.revision_number ===
                          publication.revision_number,
                      )?.id === selectedRevisionId &&
                      gateBlocked &&
                      !reviewOverride
                    }
                    onClick={() => void rollBackTo(publication)}
                  >
                    Roll back to Publication {publication.publication_sequence}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {ownerCanRebuild ? (
        <section aria-labelledby="documentation-projection-rebuild-heading">
          <h3 id="documentation-projection-rebuild-heading">
            Search projection recovery
          </h3>
          <p>
            Owner-only corrective action. Rebuilds are derived from the exact
            saved draft or immutable Publication and do not alter live-link
            selection.
          </p>
          <Button
            onClick={() =>
              void rebuildProjectionTarget(
                { projection: "draft_search" },
                "draft",
              )
            }
          >
            Rebuild draft search
          </Button>
          {publications.map((publication) => (
            <Button
              key={`rebuild-${publication.id}`}
              onClick={() =>
                void rebuildProjectionTarget(
                  {
                    projection: "publication_search",
                    publication_id: publication.id,
                  },
                  `Publication ${publication.publication_sequence}`,
                )
              }
            >
              Rebuild Publication {publication.publication_sequence} search
            </Button>
          ))}
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
          <Button
            disabled={gateBlocked && !reviewOverride}
            onClick={() => void publishRevision()}
          >
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
