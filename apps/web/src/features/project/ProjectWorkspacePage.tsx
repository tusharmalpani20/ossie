import { useEffect, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { ApiClientError, getProject, type ProjectDetailResponse } from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import type { Project } from "./types";
import { projectRoleLabel } from "./useProjectAccess";
import styles from "./ProjectWorkspacePage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; project: Project }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type ProjectWorkspacePageProps = {
  projectId: string;
  loadProject?: (projectId: string) => Promise<ProjectDetailResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
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

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const captureSessionsUrl = (projectId: string) => (
  `/projects/${encodeURIComponent(projectId)}/capture-sessions`
);

const guidesUrl = (projectId: string) => (
  `/projects/${encodeURIComponent(projectId)}/guides`
);

const interactiveDemosUrl = (projectId: string) => (
  `/projects/${encodeURIComponent(projectId)}/interactive-demos`
);

const settingsUrl = (projectId: string) => (
  `/projects/${encodeURIComponent(projectId)}/settings`
);
const complianceUrl = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/compliance`;
const activityUrl = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/activity`;

export const ProjectWorkspacePage = ({
  projectId,
  loadProject = getProject,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: ProjectWorkspacePageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadProject(projectId)
      .then((response) => {
        if (active) {
          setState({ status: "loaded", project: response.project });
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
  }, [projectId, loadProject, reloadKey]);

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading project...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to view this project.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>Sign in</a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Project was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Could not load project.</div>
          <Button variant="secondary" size="sm" type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Project workspace</div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{state.project.name}</h1>
            <Badge variant={state.project.status === "active" ? "success" : "default"}>{state.project.status}</Badge>
            <Badge>{projectRoleLabel(state.project)}</Badge>
            {state.project.access.source === "organization_owner" ? <span>Organization owner</span> : null}
          </div>
          {state.project.description ? (
            <p className={styles.description}>{state.project.description}</p>
          ) : null}
          <div className={styles.meta}>
            {state.project.slug ? <span>{state.project.slug}</span> : null}
            <span>Updated {formatDateTime(state.project.updated_at)}</span>
            <span>Created {formatDateTime(state.project.created_at)}</span>
          </div>
        </div>
        {state.project.access.role === "project_admin" ? <div>
          <a className={styles.settingsLink} href={settingsUrl(projectId)}>Project settings</a>
          <a className={styles.settingsLink} href={complianceUrl(projectId)}>Compliance</a>
        </div> : null}
      </section>

      <section className={styles.content} aria-labelledby="workspace-heading">
        <h2 className={styles.sectionTitle} id="workspace-heading">Workspace</h2>
        <div className={styles.actions}>
          <WorkspaceAction
            title="Capture sessions"
            description="Open source captures for this project."
            href={captureSessionsUrl(projectId)}
            linkLabel="Open capture sessions"
          />
          {state.project.access.role !== "viewer" ? <WorkspaceAction
            title="Activity"
            description="Review curated Project changes without raw security evidence."
            href={activityUrl(projectId)}
            linkLabel="Open activity"
          /> : null}
          <WorkspaceAction
            title="Guides"
            description="Open prepared docs and demos for this project."
            href={guidesUrl(projectId)}
            linkLabel="Open guides"
          />
          <WorkspaceAction
            title="Interactive demos"
            description="Open screenshot-first product walkthrough demos."
            href={interactiveDemosUrl(projectId)}
            linkLabel="Open interactive demos"
          />
        </div>
      </section>
    </PortalShell>
  );
};

const PortalShell = ({
  children,
  projectId,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  projectId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <div className={styles.page}>
    <PortalTopbar context={projectId} performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);

const WorkspaceAction = ({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) => (
  <Card className={styles.action} role="article">
    <div className={styles.actionBody}>
      <h3 className={styles.actionTitle}>{title}</h3>
      <p className={styles.actionDescription}>{description}</p>
    </div>
    <a className={styles.openLink} href={href}>
      {linkLabel}
    </a>
  </Card>
);
