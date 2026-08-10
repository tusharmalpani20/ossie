import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Alert } from "@repo/ui/alert";
import { StatusPanel } from "@repo/ui/status-panel";
import {
  listDocumentationReviewInbox,
  markDocumentationReviewNotificationRead,
} from "../../lib/documentationReviewApi";
import styles from "./DocumentationReview.module.css";

type Inbox = Awaited<ReturnType<typeof listDocumentationReviewInbox>>;
type Props = {
  projectId: string;
  versionSlug: string;
  loadInbox?: typeof listDocumentationReviewInbox;
  markRead?: typeof markDocumentationReviewNotificationRead;
};

export const DocumentationReviewInboxPage = ({
  projectId,
  versionSlug,
  loadInbox = listDocumentationReviewInbox,
  markRead = markDocumentationReviewNotificationRead,
}: Props) => {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [filter, setFilter] = useState<"unread" | "read" | "all">("unread");
  const [status, setStatus] = useState("Loading review inbox…");
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const refresh = () =>
    loadInbox(projectId, versionSlug, filter).then((loaded) => {
      setInbox(loaded);
      setError(false);
      setStatus(`${loaded.unread_count} unread review notifications.`);
    });
  useEffect(() => {
    setError(false);
    void refresh().catch(() => {
      setError(true);
      setStatus("Review inbox could not be loaded.");
    });
    // Route scope owns refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, projectId, retry, versionSlug]);
  if (error)
    return (
      <StatusPanel
        tone="error"
        title="Documentation review inbox"
        description={status}
        action={
          <Button type="button" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </Button>
        }
        titleAs="h1"
      />
    );
  if (!inbox)
    return (
      <StatusPanel
        tone="loading"
        title="Loading Documentation review inbox"
        description="Checking review notifications for this Project Version."
        titleAs="h1"
      />
    );
  const markNotificationRead = async (notificationId: string, version: number) => {
    setMutationError(null);
    setMarkingId(notificationId);
    try {
      await markRead(projectId, versionSlug, notificationId, version);
      await refresh();
    } catch {
      setMutationError("Review notification could not be marked as read.");
    } finally {
      setMarkingId(null);
    }
  };
  return (
    <section
      className={styles.panel}
      aria-labelledby="documentation-review-inbox-heading"
    >
      <h1 id="documentation-review-inbox-heading">
        Documentation review inbox
      </h1>
      <p role="status" aria-live="polite">
        {status}
      </p>
      {mutationError ? (
        <Alert variant="destructive" role="alert">
          {mutationError}
        </Alert>
      ) : null}
      <fieldset>
        <legend>Inbox status</legend>
        {(["unread", "read", "all"] as const).map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="documentation-review-inbox-filter"
              checked={filter === value}
              onChange={() => setFilter(value)}
            />
            {value}
          </label>
        ))}
      </fieldset>
      <ul className={styles.inboxList}>
        {inbox?.items.map(({ notification, display_context }) => (
          <li key={notification.id}>
            <a
              href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/${encodeURIComponent(notification.site_id)}`}
            >
              {display_context.site_name}: Revision{" "}
              {display_context.revision_number}, Request{" "}
              {display_context.request_number}
            </a>
            {" — "}
            {notification.type}
            {notification.status === "unread" ? (
              <Button
                disabled={markingId === notification.id}
                onClick={() =>
                  void markNotificationRead(notification.id, notification.version)
                }
              >
                {markingId === notification.id ? "Marking read…" : "Mark read"}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {inbox?.next_cursor ? (
        <Button
          disabled={loadingMore}
          onClick={() => {
            setMutationError(null);
            setLoadingMore(true);
            setStatus("Loading more review notifications…");
            void loadInbox(
              projectId,
              versionSlug,
              filter,
              inbox.next_cursor ?? undefined,
            )
              .then((loaded) => {
                setInbox({
                  ...loaded,
                  items: [...inbox.items, ...loaded.items],
                });
                setStatus(
                  `${loaded.unread_count} unread review notifications.`,
                );
              })
              .catch(() => {
                setStatus("More review notifications could not be loaded.");
                setMutationError("More review notifications could not be loaded.");
              })
              .finally(() => setLoadingMore(false));
          }}
        >
          {loadingMore ? "Loading more…" : "Load more notifications"}
        </Button>
      ) : null}
    </section>
  );
};
