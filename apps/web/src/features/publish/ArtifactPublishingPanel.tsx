import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  aggregateMutationPending = false,
  runAggregateMutation,
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
  aggregateMutationPending?: boolean;
  runAggregateMutation?: <Result>(
    command: "publication",
    operation: () => Promise<Result>,
  ) => Promise<Result>;
}) => {
  const [publications, setPublications] = useState<PublishedArtifact[]>([]),
    [links, setLinks] = useState<PublishLink[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [name, setName] = useState("Public link"),
    [newLinkWithPublish, setNewLinkWithPublish] = useState(false),
    [newVisibility, setNewVisibility] = useState<"public" | "restricted">(
      "public",
    ),
    [newExpiry, setNewExpiry] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [settings, setSettings] = useState<{
      link: PublishLink;
      name: string;
      visibility: "public" | "restricted";
      expiry: string;
      password: string;
      clearPassword: boolean;
    } | null>(null),
    [rollback, setRollback] = useState<{
      link: PublishLink;
      entryId: string;
      current: PublishedArtifact;
      target: PublishedArtifact;
    } | null>(null),
    [rollbackReason, setRollbackReason] = useState(""),
    [restoreRollbackFocusAfterLoad, setRestoreRollbackFocusAfterLoad] =
      useState(false);
  const publishingPanelRef = useRef<HTMLElement>(null);
  const rollbackDialogRef = useRef<HTMLDialogElement>(null);
  const rollbackReasonRef = useRef<HTMLTextAreaElement>(null);
  const rollbackTriggerRef = useRef<HTMLButtonElement>(null);
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
    setSelected([]);
  }, [projectId, projectVersionId, artifactType, artifactId]);
  useEffect(() => {
    void load().catch(() => setMessage("Could not load publishing."));
  }, [load]);
  const closeRollback = useCallback(() => {
    const dialog = rollbackDialogRef.current;
    if (dialog?.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
    setRollback(null);
    setRollbackReason("");
    rollbackTriggerRef.current?.focus();
  }, []);
  useEffect(() => {
    if (!restoreRollbackFocusAfterLoad) return;
    const trigger = rollbackTriggerRef.current;
    if (trigger?.isConnected) {
      trigger.focus();
    } else {
      publishingPanelRef.current?.focus();
    }
    setRestoreRollbackFocusAfterLoad(false);
  }, [restoreRollbackFocusAfterLoad]);
  useEffect(() => {
    if (!rollback) return;
    const dialog = rollbackDialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }
    rollbackReasonRef.current?.focus();
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        closeRollback();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [
        ...(rollbackDialogRef.current?.querySelectorAll<HTMLElement>(
          "textarea, button:not(:disabled)",
        ) ?? []),
      ];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKey);
    return () => document.removeEventListener("keydown", handleDialogKey);
  }, [busy, closeRollback, rollback]);
  const publish = async () => {
    setBusy(true);
    setMessage("");
    try {
      const operation = () =>
        publishArtifact(
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
            ...(newLinkWithPublish
              ? {
                  create_publish_link: {
                    name: name.trim(),
                    visibility: newVisibility,
                    expires_at: newExpiry
                      ? new Date(newExpiry).toISOString()
                      : null,
                    password: newPassword || null,
                  },
                }
              : {}),
          },
        );
      const result = runAggregateMutation
        ? await runAggregateMutation("publication", operation)
        : await operation();
      await load();
      setNewLinkWithPublish(false);
      setMessage(
        `Publication ${result.published_artifact.publication_sequence} created from Revision ${result.published_artifact.revision_number}${result.revision_reused ? " (reused)" : ""}. ${result.updated_publish_links.length + (result.created_publish_link ? 1 : 0)} Publish Link${result.updated_publish_links.length + (result.created_publish_link ? 1 : 0) === 1 ? "" : "s"} updated.`,
      );
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
          visibility: newVisibility,
          expires_at: newExpiry ? new Date(newExpiry).toISOString() : null,
          password: newPassword || null,
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
  const saveSettings = async () => {
    if (!settings) return;
    setBusy(true);
    setMessage("");
    try {
      await updateArtifactPublishLink(
        projectId,
        artifactType,
        artifactId,
        projectVersionId,
        settings.link.id,
        {
          expected_link_version: settings.link.version,
          name: settings.name.trim(),
          visibility: settings.visibility,
          expires_at: settings.expiry
            ? new Date(settings.expiry).toISOString()
            : null,
          ...(settings.password
            ? { password: settings.password }
            : settings.clearPassword
              ? { password: null }
              : {}),
        },
      );
      setSettings(null);
      await load();
      setMessage("Publish Link settings updated.");
    } catch {
      setMessage("Could not update settings. Reload and try again.");
    } finally {
      setBusy(false);
    }
  };
  const confirmRollback = async () => {
    if (!rollback) return;
    setBusy(true);
    setMessage("");
    const reason = rollbackReason.trim();
    try {
      await rollbackArtifactPublishLinkEntry(
        projectId,
        artifactType,
        artifactId,
        projectVersionId,
        rollback.link.id,
        rollback.entryId,
        {
          expected_link_version: rollback.link.version,
          target_published_artifact_id: rollback.target.id,
          ...(reason ? { reason } : {}),
        },
      );
    } catch {
      setMessage("Could not roll back. Reload and try again.");
      setBusy(false);
      return;
    }

    setRollback(null);
    setRollbackReason("");
    try {
      await load();
      setMessage("Publish Link entry rolled back. No Publication was created.");
    } catch {
      setMessage(
        "Rollback succeeded, but publishing could not be refreshed. Reload and try again.",
      );
    } finally {
      setRestoreRollbackFocusAfterLoad(true);
      setBusy(false);
    }
  };
  const revokeLink = async (link: PublishLink) => {
    if (
      !window.confirm(
        "Revoke this Publish Link? Existing URLs will stop working.",
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await revokeArtifactPublishLink(
        projectId,
        artifactType,
        artifactId,
        projectVersionId,
        link.id,
        link.version,
      );
      await load();
      setMessage("Publish Link revoked.");
    } catch {
      setMessage("Could not revoke. Reload and try again.");
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
    <section
      ref={publishingPanelRef}
      className={styles.panel}
      aria-labelledby="publishing-heading"
      tabIndex={-1}
    >
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
            disabled={publicationReadOnly || busy || aggregateMutationPending}
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
                <a href={link.public_url} target="_blank" rel="noreferrer">
                  Open {link.name}
                </a>
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
                            if (
                              !window.confirm(
                                `Remove ${entry.project_version.name} from this Publish Link? The Publication will remain in history.`,
                              )
                            )
                              return;
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
                            item.publication_sequence <
                              entry.published_artifact.publication_sequence,
                        ) && (
                          <button
                            disabled={linkManagementReadOnly || busy}
                            onClick={(event) => {
                              rollbackTriggerRef.current = event.currentTarget;
                              const target = publications.find(
                                (item) =>
                                  item.edition_id ===
                                    entry.published_artifact.edition_id &&
                                  item.publication_sequence <
                                    entry.published_artifact
                                      .publication_sequence,
                              )!;
                              setRollback({
                                link,
                                entryId: entry.id,
                                current: entry.published_artifact,
                                target,
                              });
                              setRollbackReason("");
                            }}
                          >
                            Roll back
                          </button>
                        )}
                    </li>
                  ))}
                </ol>
                {showMutationControls &&
                  publications[0] &&
                  !link.entries.some(
                    (entry) => entry.project_version.id === projectVersionId,
                  ) && (
                    <button
                      disabled={
                        linkManagementReadOnly ||
                        busy ||
                        link.entries.length >= 50
                      }
                      onClick={() =>
                        void replaceManifest(
                          link,
                          [
                            ...link.entries.map(
                              (entry) => entry.published_artifact.id,
                            ),
                            publications[0]!.id,
                          ],
                          link.entries.find((entry) => entry.is_default)!
                            .published_artifact.id,
                        )
                      }
                    >
                      Add current Project Version
                    </button>
                  )}
                {showMutationControls && (
                  <button
                    disabled={linkManagementReadOnly || busy}
                    onClick={() =>
                      setSettings({
                        link,
                        name: link.name,
                        visibility: link.visibility,
                        expiry: link.expires_at
                          ? link.expires_at.slice(0, 16)
                          : "",
                        password: "",
                        clearPassword: false,
                      })
                    }
                  >
                    Edit settings
                  </button>
                )}
                {showMutationControls && (
                  <button
                    className={styles.danger}
                    disabled={linkManagementReadOnly || busy}
                    onClick={() => void revokeLink(link)}
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
          {!publicationReadOnly && (
            <label>
              <input
                type="checkbox"
                checked={newLinkWithPublish}
                disabled={busy}
                onChange={(event) =>
                  setNewLinkWithPublish(event.target.checked)
                }
              />
              Create a Publish Link with this Publication
            </label>
          )}
          <label>
            New link name
            <input
              value={name}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            New link visibility
            <select
              value={newVisibility}
              onChange={(event) =>
                setNewVisibility(event.target.value as "public" | "restricted")
              }
            >
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
            </select>
          </label>
          <label>
            New link expiry (optional)
            <input
              type="datetime-local"
              value={newExpiry}
              onChange={(event) => setNewExpiry(event.target.value)}
            />
          </label>
          <label>
            New link password (optional)
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
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
      {settings && (
        <div
          className={styles.editor}
          aria-label={`${settings.link.name} settings`}
        >
          <h4>Edit Publish Link settings</h4>
          <label>
            Link name
            <input
              maxLength={120}
              value={settings.name}
              onChange={(event) =>
                setSettings({ ...settings, name: event.target.value })
              }
            />
          </label>
          <label>
            Visibility
            <select
              value={settings.visibility}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  visibility: event.target.value as "public" | "restricted",
                })
              }
            >
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
            </select>
          </label>
          <label>
            Expiry (optional)
            <input
              type="datetime-local"
              value={settings.expiry}
              onChange={(event) =>
                setSettings({ ...settings, expiry: event.target.value })
              }
            />
          </label>
          <label>
            New password (optional)
            <input
              type="password"
              value={settings.password}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  password: event.target.value,
                  clearPassword: false,
                })
              }
            />
          </label>
          {settings.link.password_protected && (
            <label>
              <input
                type="checkbox"
                checked={settings.clearPassword}
                disabled={Boolean(settings.password)}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    clearPassword: event.target.checked,
                  })
                }
              />
              Clear current password
            </label>
          )}
          <button
            disabled={busy || !settings.name.trim()}
            onClick={() => void saveSettings()}
          >
            Save settings
          </button>
          <button disabled={busy} onClick={() => setSettings(null)}>
            Cancel
          </button>
        </div>
      )}
      {rollback && (
        <dialog
          ref={rollbackDialogRef}
          className={styles.dialog}
          aria-labelledby="rollback-heading"
        >
          <h4 id="rollback-heading">Confirm rollback</h4>
          <p>
            Current: Publication {rollback.current.publication_sequence} ·{" "}
            {new Date(rollback.current.published_at).toLocaleString()} ·{" "}
            {rollback.current.publisher.display_name}
          </p>
          <p>
            Target: Publication {rollback.target.publication_sequence} ·{" "}
            {new Date(rollback.target.published_at).toLocaleString()} ·{" "}
            {rollback.target.publisher.display_name}
          </p>
          <p>
            This changes the link entry only. It does not create a Publication.
          </p>
          <label>
            Rollback reason (optional)
            <textarea
              ref={rollbackReasonRef}
              maxLength={500}
              value={rollbackReason}
              onChange={(event) => setRollbackReason(event.target.value)}
            />
          </label>
          <button disabled={busy} onClick={() => void confirmRollback()}>
            Confirm rollback
          </button>
          <button disabled={busy} onClick={closeRollback}>
            Cancel
          </button>
        </dialog>
      )}
    </section>
  );
};
