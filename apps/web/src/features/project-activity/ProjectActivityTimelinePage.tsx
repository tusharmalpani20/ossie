import { type ReactNode, useEffect, useState } from "react";
import type { ProjectActivityResponse } from "@repo/types/project-activity";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { ArrowLeft } from "lucide-react";
import { ApiClientError, listProjectActivity } from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
import { useProjectAccess } from "../project/useProjectAccess";
import type { Project } from "../project/types";
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
  const projectAccess = useProjectAccess(projectId);
  const project =
    projectAccess.state.status === "loaded"
      ? projectAccess.state.project
      : projectId;
  const workspaceHref =
    typeof project === "string"
      ? `/projects/${encodeURIComponent(projectId)}`
      : `/projects/${encodeURIComponent(project.id)}/versions/${encodeURIComponent(project.default_project_version.slug)}`;
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
    <Shell project={project}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Activity</h1>
          <p className={styles.subtitle}>
            Review important changes across this Project.
          </p>
        </div>
        <a className={styles.workspaceLink} href={workspaceHref}>
          <ArrowLeft aria-hidden="true" size={17} />
          Back to workspace
        </a>
      </header>
      {state.status === "loading" ? (
        <Message>Loading Project activity…</Message>
      ) : state.status === "unauthenticated" ? (
        <Message>
          Sign in to view Project activity.{" "}
          <a href={signInUrl(currentPath)}>Sign in</a>
        </Message>
      ) : state.status === "forbidden" ? (
        <Message>Your Project role cannot view Activity.</Message>
      ) : state.status === "not_found" ? (
        <Message>Project was not found.</Message>
      ) : state.status === "error" ? (
        <Message>
          Could not load Project activity.{" "}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setReload((value) => value + 1)}
          >
            Retry
          </Button>
        </Message>
      ) : (
        <>
          {state.response.events.length === 0 ? (
            <Message>No Project activity yet.</Message>
          ) : (
            <Card className={styles.tableSurface}>
              <CardContent className={styles.tableContent}>
                <table className={styles.table} aria-label="Project activity">
                  <thead>
                    <tr>
                      <th scope="col">Activity</th>
                      <th scope="col">Performed by</th>
                      <th scope="col">Source</th>
                      <th scope="col">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.response.events.map((event) => (
                      <tr key={event.id}>
                        <td
                          className={styles.activityCell}
                          data-label="Activity"
                        >
                          <strong>{event.summary}</strong>
                          {event.grouped_event_count > 1 ? (
                            <span>
                              {event.grouped_event_count} grouped events
                            </span>
                          ) : null}
                        </td>
                        <td data-label="Performed by">{event.actor_label}</td>
                        <td className={styles.sourceCell} data-label="Source">
                          <Badge>{event.category}</Badge>
                          <span>{event.source_type}</span>
                        </td>
                        <td data-label="Date">
                          <time dateTime={event.occurred_at}>
                            {formatActivityDate(event.occurred_at)}
                          </time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
          {state.response.page.has_more ? (
            <div className={styles.pagination}>
              {pageError ? <span>Could not load more Activity.</span> : null}
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
const Message = ({ children }: { children: ReactNode }) => (
  <div className={styles.state}>{children}</div>
);

const formatActivityDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const Shell = ({
  children,
  project,
}: {
  children: ReactNode;
  project: Project | string;
}) => {
  const projectContext =
    typeof project === "string"
      ? { id: project }
      : {
          id: project.id,
          name: project.name,
          access: project.access,
          defaultProjectVersionSlug: project.default_project_version.slug,
        };

  return (
    <PortalAppShell
      activeSection="project_activity"
      currentLabel=""
      project={projectContext}
    >
      {children}
    </PortalAppShell>
  );
};
