import { type ReactNode, useEffect, useState } from "react";
import type { ProjectActivityResponse } from "@repo/types/project-activity";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { StatusPanel, type StatusPanelTone } from "@repo/ui/status-panel";
import { ApiClientError, listProjectActivity } from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
import styles from "./ProjectActivityTimelinePage.module.css";

type State =
  | { status: "loading" }
  | { status: "loaded"; response: ProjectActivityResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "error" };
type Props = {
  projectId: string;
  loadActivity?: (
    projectId: string,
    input?: { cursor?: string; limit?: number },
  ) => Promise<ProjectActivityResponse>;
  currentPath?: string;
};

export const ProjectActivityTimelinePage = ({
  projectId,
  loadActivity = listProjectActivity,
  currentPath = currentBrowserPath(),
}: Props) => {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reload, setReload] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState(false);
  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    loadActivity(projectId)
      .then((response) => active && setState({ status: "loaded", response }))
      .catch((error: unknown) => {
        if (!active) return;
        const status = error instanceof ApiClientError ? error.kind : "error";
        setState({
          status:
            status === "validation" || status === "unknown" ? "error" : status,
        });
      });
    return () => {
      active = false;
    };
  }, [loadActivity, projectId, reload]);

  const loadMore = async () => {
    if (state.status !== "loaded" || !state.response.page.next_cursor) return;
    setLoadingMore(true);
    setPageError(false);
    try {
      const next = await loadActivity(projectId, {
        cursor: state.response.page.next_cursor,
      });
      setState({
        status: "loaded",
        response: {
          ...next,
          events: [...state.response.events, ...next.events],
        },
      });
    } catch {
      setPageError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Shell projectId={projectId}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Curated Project history</div>
          <h1>Activity</h1>
        </div>
        <a href={`/projects/${encodeURIComponent(projectId)}`}>
          Project workspace
        </a>
      </header>
      {state.status === "loading" ? (
        <Message
          tone="loading"
          title="Loading Project activity"
          description="Retrieving curated history for this Project."
        />
      ) : state.status === "unauthenticated" ? (
        <Message
          tone="forbidden"
          title="Sign in to view Project activity"
          description={
            <>
              Your session is required to view this Project’s history.{" "}
              <a href={signInUrl(currentPath)}>Sign in</a>
            </>
          }
        />
      ) : state.status === "forbidden" ? (
        <Message
          tone="forbidden"
          title="Activity is unavailable"
          description="Your Project role cannot view Activity."
        />
      ) : state.status === "not_found" ? (
        <Message tone="not-found" title="Project was not found." />
      ) : state.status === "error" ? (
        <Message
          tone="error"
          title="Could not load Project activity"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setReload((value) => value + 1)}
            >
              Retry
            </Button>
          }
        />
      ) : (
        <>
          {state.response.events.length === 0 ? (
            <Message
              tone="empty"
              title="No Project activity yet"
              description="Curated history will appear here as Project work is recorded."
            />
          ) : (
            <ol className={styles.timeline} aria-label="Project activity">
              {state.response.events.map((event) => (
                <li key={event.id}>
                  <Card>
                    <CardContent>
                      <div className={styles.meta}>
                        <Badge>{event.category}</Badge>
                        <time dateTime={event.occurred_at}>
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(event.occurred_at))}
                        </time>
                      </div>
                      <h2>{event.summary}</h2>
                      <p>
                        {event.actor_label} · {event.source_type}
                      </p>
                      {event.grouped_event_count > 1 ? (
                        <p>{event.grouped_event_count} grouped events</p>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          )}
          {state.response.page.has_more ? (
            <div>
              {pageError ? (
                <span role="alert">Could not load more Activity.</span>
              ) : null}
              <Button
                variant="secondary"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Shell>
  );
};
const Message = ({
  tone,
  title,
  description,
  action,
}: {
  tone: StatusPanelTone;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) => (
  <StatusPanel
    className={styles.state}
    tone={tone}
    title={title}
    description={description}
    action={action}
    titleAs="h2"
  />
);
const Shell = ({
  children,
  projectId,
}: {
  children: ReactNode;
  projectId: string;
}) => (
  <PortalAppShell
    activeSection="project_activity"
    currentLabel="Activity"
    project={{ id: projectId }}
  >
    {children}
  </PortalAppShell>
);
