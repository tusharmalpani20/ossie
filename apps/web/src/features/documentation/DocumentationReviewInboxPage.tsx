import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
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
  const refresh = () =>
    loadInbox(projectId, versionSlug, filter).then((loaded) => {
      setInbox(loaded);
      setStatus(`${loaded.unread_count} unread review notifications.`);
    });
  useEffect(() => {
    void refresh().catch(() => setStatus("Review inbox could not be loaded."));
    // Route scope owns refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, projectId, versionSlug]);
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
                onClick={() =>
                  void markRead(
                    projectId,
                    versionSlug,
                    notification.id,
                    notification.version,
                  ).then(refresh)
                }
              >
                Mark read
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {inbox?.next_cursor ? (
        <Button
          onClick={() => {
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
              .catch(() =>
                setStatus("More review notifications could not be loaded."),
              );
          }}
        >
          Load more notifications
        </Button>
      ) : null}
    </section>
  );
};
