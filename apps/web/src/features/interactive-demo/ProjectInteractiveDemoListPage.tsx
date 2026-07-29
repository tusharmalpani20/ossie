import { useEffect, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button, buttonVariants } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  ApiClientError,
  listProjectInteractiveDemos,
  type ProjectInteractiveDemoListResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
import styles from "./ProjectInteractiveDemoListPage.module.css";

type InteractiveDemoListItem =
  ProjectInteractiveDemoListResponse["interactive_demo_editions"][number];

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; demos: InteractiveDemoListItem[] }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

export type ProjectInteractiveDemoListPageProps = {
  projectId: string;
  projectVersionId: string;
  loadDemos?: (
    projectId: string,
  ) => Promise<ProjectInteractiveDemoListResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  versionSlug?: string;
  canWrite?: boolean;
  renderShell?: boolean;
};

const loadStateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    if (error.kind === "not_found") {
      return { status: "not_found" };
    }
  }

  return { status: "error" };
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const demoUrl = (projectId: string, demoId: string, versionSlug?: string) =>
  `/projects/${encodeURIComponent(projectId)}${versionSlug ? `/versions/${encodeURIComponent(versionSlug)}` : ""}/interactive-demos/${encodeURIComponent(demoId)}`;

const captureSessionsUrl = (projectId: string, versionSlug?: string) =>
  `/projects/${encodeURIComponent(projectId)}${versionSlug ? `/versions/${encodeURIComponent(versionSlug)}` : ""}/capture-sessions`;

export const ProjectInteractiveDemoListPage = ({
  projectId,
  projectVersionId,
  loadDemos = (id) => listProjectInteractiveDemos(id, projectVersionId),
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
  versionSlug,
  canWrite = true,
  renderShell = true,
}: ProjectInteractiveDemoListPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadDemos(projectId)
      .then((response) => {
        if (active) {
          setState({
            status: "loaded",
            demos: response.interactive_demo_editions,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState(loadStateFromError(error));
        }
      });

    return () => {
      active = false;
    };
    // Route identity and reloadKey intentionally control refetching; the injected loader may be an inline adapter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectVersionId, reloadKey]);

  if (state.status === "loading") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
        renderShell={renderShell}
      >
        <div className={styles.state}>Loading interactive demos...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
        renderShell={renderShell}
      >
        <div className={styles.state}>
          <div>Sign in to view interactive demos.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>
            Sign in
          </a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
        renderShell={renderShell}
      >
        <div className={styles.state}>Project was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
        renderShell={renderShell}
      >
        <div className={styles.state}>
          <div>Could not load interactive demos.</div>
          <Button
            variant="secondary"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </Button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      projectId={projectId}
      performLogout={performLogout}
      navigate={navigate}
      versionSlug={versionSlug}
      renderShell={renderShell}
    >
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Project</div>
          <h1 className={styles.title}>Interactive demos</h1>
          <p className={styles.description}>{projectId}</p>
        </div>
      </section>

      <section
        className={styles.content}
        aria-labelledby="interactive-demos-heading"
      >
        <h2 className={styles.sectionTitle} id="interactive-demos-heading">
          Project interactive demos
        </h2>
        {state.demos.length === 0 ? (
          <Card className={styles.empty}>
            <div>No interactive demos yet.</div>
            {canWrite ? (
              <a
                className={styles.stateLink}
                href={captureSessionsUrl(projectId, versionSlug)}
              >
                Open capture sessions
              </a>
            ) : null}
          </Card>
        ) : (
          <div className={styles.list}>
            {state.demos.map((demo) => (
              <DemoRow
                key={demo.artifact.id}
                item={demo}
                projectId={projectId}
                versionSlug={versionSlug}
              />
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
};

const PortalShell = ({
  children,
  projectId,
  performLogout,
  navigate,
  versionSlug,
  renderShell,
}: {
  children: React.ReactNode;
  projectId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  versionSlug?: string;
  renderShell: boolean;
}) =>
  renderShell ? (
    <PortalAppShell
      activeSection="interactive_demos"
      currentLabel="Interactive demos"
      project={{ id: projectId }}
      projectVersion={versionSlug ? { slug: versionSlug } : undefined}
      performLogout={performLogout}
      navigate={navigate}
    >
      {children}
    </PortalAppShell>
  ) : (
    <>{children}</>
  );

const DemoRow = ({
  item,
  projectId,
  versionSlug,
}: {
  item: InteractiveDemoListItem;
  projectId: string;
  versionSlug?: string;
}) => {
  const { edition: demo } = item;
  return (
    <article className={styles.demo}>
      <div className={styles.demoBody}>
        <div className={styles.demoHeader}>
          <h3 className={styles.demoTitle}>{demo.title}</h3>
          <Badge variant={demo.status === "draft" ? "warning" : "success"}>
            {demo.status}
          </Badge>
        </div>
        {demo.description ? (
          <p className={styles.demoDescription}>{demo.description}</p>
        ) : null}
        <div className={styles.meta}>
          {demo.source_capture_session_id ? (
            <a
              href={`${captureSessionsUrl(projectId, versionSlug)}/${encodeURIComponent(demo.source_capture_session_id)}`}
            >
              Open source Capture
            </a>
          ) : (
            <span>Created without a source Capture</span>
          )}
          <span>Authored {formatDateTime(item.authored_updated_at)}</span>
        </div>
      </div>
      <a
        className={`${buttonVariants({ variant: "secondary" })} ${styles.openLink}`}
        href={demoUrl(projectId, item.artifact.id, versionSlug)}
      >
        Open demo {demo.title}
      </a>
    </article>
  );
};
