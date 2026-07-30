import { useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import {
  listDocumentationPages,
  transitionDocumentationEdition,
  transitionDocumentationPage,
  type DocumentationDraftPreview,
  type DocumentationPageSummary,
} from "../../lib/documentationApi";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  title: string;
  status: "active" | "archived";
  effectiveStatus: "active" | "read_only" | "archived";
  readOnlyReason: string | null;
  editionVersion: number;
  canManage: boolean;
  transition?: typeof transitionDocumentationEdition;
  onChanged?: () => void;
};

export const DocumentationLifecycleControls = ({
  projectId,
  versionSlug,
  siteId,
  title,
  status: initialStatus,
  effectiveStatus,
  readOnlyReason,
  editionVersion: initialVersion,
  canManage,
  transition = transitionDocumentationEdition,
  onChanged,
}: Props) => {
  const [status, setStatus] = useState(initialStatus);
  const [version, setVersion] = useState(initialVersion);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const apply = async (next: "archive" | "restore") => {
    setBusy(true);
    setMessage(`${next === "archive" ? "Archiving" : "Restoring"} ${title}…`);
    try {
      const result = await transition(
        projectId,
        versionSlug,
        siteId,
        version,
        next,
      );
      setStatus(result.edition.status);
      setVersion(result.edition.version);
      setConfirming(false);
      setConfirmed(false);
      setMessage(
        `${title} was ${next === "archive" ? "archived" : "restored"}.`,
      );
      onChanged?.();
      queueMicrotask(() => triggerRef.current?.focus());
    } catch {
      setMessage("Lifecycle state changed elsewhere. Reload and retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="documentation-lifecycle-heading">
      <h2 id="documentation-lifecycle-heading">Edition lifecycle</h2>
      <p>
        Stored state: <strong>{status}</strong>. Effective state:{" "}
        <strong>{effectiveStatus}</strong>.
      </p>
      {readOnlyReason ? <p>{readOnlyReason}</p> : null}
      {canManage && status === "active" && !confirming ? (
        <Button ref={triggerRef} onClick={() => setConfirming(true)}>
          Archive Edition
        </Button>
      ) : null}
      {canManage && status === "archived" ? (
        <Button
          ref={triggerRef}
          disabled={busy}
          onClick={() => void apply("restore")}
        >
          Restore Edition
        </Button>
      ) : null}
      {confirming ? (
        <div role="group" aria-label="Confirm Edition archive">
          <p>
            Saved mutable content is retained and becomes read-only. Existing
            Publications remain available through their current Publish Links.
          </p>
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            I understand archiving does not delete or unpublish retained output.
          </label>
          <Button
            disabled={!confirmed || busy}
            onClick={() => void apply("archive")}
          >
            Confirm Archive
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setConfirming(false);
              setConfirmed(false);
              queueMicrotask(() => triggerRef.current?.focus());
            }}
          >
            Cancel
          </Button>
        </div>
      ) : null}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
};

export const DocumentationPageLifecycleControls = ({
  projectId,
  versionSlug,
  siteId,
  preview,
  canWrite,
  loadPages = listDocumentationPages,
  transitionPage = transitionDocumentationPage,
}: {
  projectId: string;
  versionSlug: string;
  siteId: string;
  preview: DocumentationDraftPreview;
  canWrite: boolean;
  loadPages?: typeof listDocumentationPages;
  transitionPage?: typeof transitionDocumentationPage;
}) => {
  const [pages, setPages] = useState<DocumentationPageSummary[]>([]);
  const [filter, setFilter] = useState<"active" | "archived" | "all">("all");
  const [draftVersion, setDraftVersion] = useState(
    preview.working_draft.version,
  );
  const [navigationVersion, setNavigationVersion] = useState(
    preview.navigation.version,
  );
  const [routingVersion, setRoutingVersion] = useState(preview.routing.version);
  const [retirement, setRetirement] = useState<
    Record<string, "none" | "gone" | "redirect">
  >({});
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void loadPages(projectId, versionSlug, siteId, filter)
      .then(({ pages: loaded }) => {
        if (active) setPages(loaded);
      })
      .catch(() => {
        if (active) setMessage("Page lifecycle state could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [filter, loadPages, projectId, siteId, versionSlug]);

  const apply = async (page: DocumentationPageSummary) => {
    const transition = page.status === "active" ? "archive" : "restore";
    const retirementMode = retirement[page.id] ?? "none";
    const retirementInput:
      | { mode: "none" }
      | { mode: "gone" }
      | { mode: "redirect"; target_page_id: string } =
      retirementMode === "redirect"
        ? { mode: "redirect", target_page_id: targets[page.id] ?? "" }
        : retirementMode === "gone"
          ? { mode: "gone" }
          : { mode: "none" };
    setMessage(`${transition === "archive" ? "Archiving" : "Restoring"} ${page.title}…`);
    try {
      const result = await transitionPage(
        projectId,
        versionSlug,
        siteId,
        page.id,
        transition === "restore"
          ? {
              transition,
              expected_page_version: page.version,
              expected_draft_version: draftVersion,
            }
          : {
              transition,
              expected_page_version: page.version,
              expected_draft_version: draftVersion,
              expected_navigation_version: navigationVersion,
              expected_routing_version: routingVersion,
              retirement: retirementInput,
              replacement_home_page_id:
                preview.working_draft.home_page_id === page.id
                  ? replacements[page.id] ?? null
                  : null,
            },
      );
      setDraftVersion(result.page.draft_version);
      setNavigationVersion(result.page.navigation_version);
      setRoutingVersion(result.page.routing_version);
      setPages((current) =>
        current.map((candidate) =>
          candidate.id === page.id
            ? { ...candidate, ...result.page }
            : candidate,
        ),
      );
      setMessage(
        `${page.title} was ${transition === "archive" ? "archived" : "restored"}. Restored Pages remain unlisted until Navigation is updated.`,
      );
    } catch {
      setMessage(
        "Page lifecycle needs updated concurrency or retirement details. Reload and retry.",
      );
    }
  };

  return (
    <section aria-labelledby="documentation-page-lifecycle-heading">
      <h2 id="documentation-page-lifecycle-heading">Page lifecycle</h2>
      <label>
        Page status
        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as "active" | "archived" | "all")
          }
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
      </label>
      <ul>
        {pages.map((page) => (
          <li key={page.id}>
            <strong>{page.title}</strong> · {page.status}
            {canWrite && page.status === "active" ? (
              <>
                <label>
                  Public retirement
                  <select
                    value={retirement[page.id] ?? "none"}
                    onChange={(event) =>
                      setRetirement((current) => ({
                        ...current,
                        [page.id]: event.target.value as
                          | "none"
                          | "gone"
                          | "redirect",
                      }))
                    }
                  >
                    <option value="none">Never published / none</option>
                    <option value="gone">Gone</option>
                    <option value="redirect">Redirect</option>
                  </select>
                </label>
                {retirement[page.id] === "redirect" ? (
                  <label>
                    Redirect target
                    <select
                      value={targets[page.id] ?? ""}
                      onChange={(event) =>
                        setTargets((current) => ({
                          ...current,
                          [page.id]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Choose an active Page</option>
                      {pages
                        .filter(
                          (candidate) =>
                            candidate.status === "active" &&
                            candidate.id !== page.id,
                        )
                        .map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.title}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : null}
                {preview.working_draft.home_page_id === page.id ? (
                  <label>
                    Replacement Home Page
                    <select
                      value={replacements[page.id] ?? ""}
                      onChange={(event) =>
                        setReplacements((current) => ({
                          ...current,
                          [page.id]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Choose a replacement</option>
                      {pages
                        .filter(
                          (candidate) =>
                            candidate.status === "active" &&
                            candidate.id !== page.id,
                        )
                        .map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.title}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : null}
              </>
            ) : null}
            {canWrite ? (
              <Button onClick={() => void apply(page)}>
                {page.status === "active" ? "Archive Page" : "Restore Page"}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
};
