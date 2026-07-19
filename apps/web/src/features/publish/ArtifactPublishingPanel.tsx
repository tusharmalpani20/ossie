import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublishLink, PublishedArtifact } from "@repo/types/publish";
import {
  createArtifactPublishLink,
  listArtifactPublications,
  listArtifactPublishLinks,
  publishArtifact,
  replaceArtifactPublishLinkManifest,
  rollbackArtifactPublishLinkEntry,
  revokeArtifactPublishLink,
  updateArtifactPublishLink,
} from "../../lib/api";
import styles from "./ArtifactPublishingPanel.module.css";
export const ArtifactPublishingPanel = ({
  projectId,
  projectVersionId,
  artifactType,
  artifactId,
  editionVersion,
  workingDraftVersion,
  publicationReadOnly = false,
  linkManagementReadOnly = false,
  showMutationControls = true,
}: {
  projectId: string;
  projectVersionId: string;
  artifactType: "guide" | "interactive_demo";
  artifactId: string;
  editionVersion: number;
  workingDraftVersion: number;
  publicationReadOnly?: boolean;
  linkManagementReadOnly?: boolean;
  showMutationControls?: boolean;
}) => {
  const [publications, setPublications] = useState<PublishedArtifact[]>([]),
    [links, setLinks] = useState<PublishLink[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [name, setName] = useState("Public link");
  const active = useMemo(
    () => links.filter((link) => link.status === "active"),
    [links],
  );
  const load = useCallback(async () => {
    const [history, linkList] = await Promise.all([
      listArtifactPublications(
        projectId,
        artifactType,
        artifactId,
        projectVersionId,
      ),
      listArtifactPublishLinks(
        projectId,
        artifactType,
        artifactId,
        projectVersionId,
      ),
    ]);
    setPublications(history.publications);
    setLinks(linkList.publish_links);
    setSelected(
      linkList.publish_links
        .filter((link) => link.status === "active")
        .map((link) => link.id),
    );
  }, [projectId, projectVersionId, artifactType, artifactId]);
  useEffect(() => {
    void load().catch(() => setMessage("Could not load publishing."));
  }, [load]);
  const publish = async () => {
    setBusy(true);
    setMessage("");
    try {
      await publishArtifact(
        projectId,
        artifactType,
        artifactId,
        projectVersionId,
        {
          expected_edition_version: editionVersion,
          expected_working_draft_version: workingDraftVersion,
          update_publish_links: active
            .filter((link) => selected.includes(link.id))
            .map((link) => ({
              publish_link_id: link.id,
              expected_link_version: link.version,
            })),
        },
      );
      await load();
      setMessage("Publication created.");
    } catch {
      setMessage("Could not publish. Reload and try again.");
    } finally {
      setBusy(false);
    }
  };
  const create = async () => {
    const latest = publications[0];
    if (!latest)
      return setMessage("Publish this Project Version before creating a link.");
    setBusy(true);
    try {
      await createArtifactPublishLink(
        projectId,
        artifactType,
        artifactId,
        projectVersionId,
        {
          name,
          visibility: "public",
          expires_at: null,
          password: null,
          published_artifact_ids: [latest.id],
          default_published_artifact_id: latest.id,
        },
      );
      await load();
      setMessage("Publish Link created.");
    } catch {
      setMessage("Could not create Publish Link.");
    } finally {
      setBusy(false);
    }
  };
  const replaceManifest = async (
    link: PublishLink,
    ids: string[],
    defaultId: string,
  ) => {
    if (ids.length === 0)
      return setMessage("A Publish Link must keep at least one version.");
    setBusy(true);
    try {
      await replaceArtifactPublishLinkManifest(
        projectId,
        artifactType,
        artifactId,
        projectVersionId,
        link.id,
        {
          expected_link_version: link.version,
          published_artifact_ids: ids,
          default_published_artifact_id: defaultId,
        },
      );
      await load();
      setMessage("Publish Link versions updated.");
    } catch {
      setMessage("Could not update versions. Reload and try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className={styles.panel} aria-labelledby="publishing-heading">
      <header>
        <div>
          <h2 id="publishing-heading">Publishing</h2>
          <p>
            Immutable Publications can be rolled out to any selected Publish
            Link.
          </p>
        </div>
        {showMutationControls && (
          <button
            disabled={publicationReadOnly || busy}
            onClick={() => void publish()}
          >
            {busy ? "Working…" : "Publish this draft"}
          </button>
        )}
      </header>
      {message && <p role="status">{message}</p>}
      <div className={styles.history}>
        <strong>Project Version history</strong>
        {publications.length ? (
          <ol>
            {publications.map((item) => (
              <li key={item.id}>
                Publication {item.publication_sequence} · Revision{" "}
                {item.revision_number}
              </li>
            ))}
          </ol>
        ) : (
          <p>No Publications yet.</p>
        )}
      </div>
      <div className={styles.links}>
        <h3>Publish Links</h3>
        {links.map((link) => (
          <article key={link.id}>
            <label>
              {showMutationControls && (
                <input
                  type="checkbox"
                  checked={selected.includes(link.id)}
                  disabled={link.status === "revoked"}
                  onChange={(event) =>
                    setSelected((value) =>
                      event.target.checked
                        ? [...value, link.id]
                        : value.filter((id) => id !== link.id),
                    )
                  }
                />
              )}
              <span>
                <strong>{link.name}</strong>
                <small>
                  {link.status} · {link.entries.length} version
                  {link.entries.length === 1 ? "" : "s"}
                </small>
              </span>
            </label>
            {link.status === "active" && (
              <div>
                <ol aria-label={`${link.name} versions`}>
                  {link.entries.map((entry, index) => (
                    <li key={entry.id}>
                      <span>
                        {entry.project_version.name}
                        {entry.is_default ? " · default" : ""}
                      </span>
                      {showMutationControls && (
                        <button
                          disabled={
                            linkManagementReadOnly || busy || entry.is_default
                          }
                          onClick={() =>
                            void replaceManifest(
                              link,
                              link.entries.map(
                                (item) => item.published_artifact.id,
                              ),
                              entry.published_artifact.id,
                            )
                          }
                        >
                          Make default
                        </button>
                      )}
                      {showMutationControls && (
                        <button
                          disabled={
                            linkManagementReadOnly ||
                            busy ||
                            link.entries.length === 1
                          }
                          onClick={() => {
                            const remaining = link.entries.filter(
                              (item) => item.id !== entry.id,
                            );
                            void replaceManifest(
                              link,
                              remaining.map(
                                (item) => item.published_artifact.id,
                              ),
                              (remaining.find((item) => item.is_default) ??
                                remaining[0])!.published_artifact.id,
                            );
                          }}
                        >
                          Remove
                        </button>
                      )}
                      {showMutationControls && index > 0 && (
                        <button
                          disabled={linkManagementReadOnly || busy}
                          onClick={() => {
                            const ids = link.entries.map(
                              (item) => item.published_artifact.id,
                            );
                            [ids[index - 1], ids[index]] = [
                              ids[index]!,
                              ids[index - 1]!,
                            ];
                            void replaceManifest(
                              link,
                              ids,
                              link.entries.find((item) => item.is_default)!
                                .published_artifact.id,
                            );
                          }}
                        >
                          Move up
                        </button>
                      )}
                      {showMutationControls &&
                        entry.project_version.id === projectVersionId &&
                        publications.find(
                          (item) =>
                            item.edition_id ===
                              entry.published_artifact.edition_id &&
                            item.id !== entry.published_artifact.id,
                        ) && (
                          <button
                            disabled={linkManagementReadOnly || busy}
                            onClick={() => {
                              const target = publications.find(
                                (item) =>
                                  item.edition_id ===
                                    entry.published_artifact.edition_id &&
                                  item.id !== entry.published_artifact.id,
                              )!;
                              void rollbackArtifactPublishLinkEntry(
                                projectId,
                                artifactType,
                                artifactId,
                                projectVersionId,
                                link.id,
                                entry.id,
                                {
                                  expected_link_version: link.version,
                                  target_published_artifact_id: target.id,
                                  reason: "Portal rollback",
                                },
                              ).then(load);
                            }}
                          >
                            Roll back
                          </button>
                        )}
                    </li>
                  ))}
                </ol>
                {showMutationControls && (
                  <button
                    disabled={linkManagementReadOnly || busy}
                    onClick={() =>
                      void updateArtifactPublishLink(
                        projectId,
                        artifactType,
                        artifactId,
                        projectVersionId,
                        link.id,
                        {
                          expected_link_version: link.version,
                          visibility:
                            link.visibility === "public"
                              ? "restricted"
                              : "public",
                        },
                      ).then(load)
                    }
                  >
                    Set {link.visibility === "public" ? "restricted" : "public"}
                  </button>
                )}
                {showMutationControls && (
                  <button
                    className={styles.danger}
                    disabled={linkManagementReadOnly || busy}
                    onClick={() =>
                      window.confirm(
                        "Revoke this Publish Link? Existing URLs will stop working.",
                      ) &&
                      void revokeArtifactPublishLink(
                        projectId,
                        artifactType,
                        artifactId,
                        projectVersionId,
                        link.id,
                        link.version,
                      ).then(load)
                    }
                  >
                    Revoke
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
      {showMutationControls && (
        <div className={styles.create}>
          <label>
            New link name
            <input
              value={name}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <button
            disabled={linkManagementReadOnly || busy || !name.trim()}
            onClick={() => void create()}
          >
            Create from latest Publication
          </button>
        </div>
      )}
    </section>
  );
};
