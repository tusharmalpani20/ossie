/**
 * @fileoverview Project workspace page for library entry points.
 */

import { useEffect, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { StatusPanel } from "@repo/ui/status-panel";
import {
  ApiClientError,
  getProject,
  type ProjectDetailResponse,
} from "../../lib/api";
import { projectVersionWorkspaceUrl } from "../../lib/portalNavigation";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
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

const projectVersionRouteUrl = (project: Project, suffix: string) =>
  `${projectVersionWorkspaceUrl(project.id, project.default_project_version.slug)}${suffix}`;

const captureSessionsUrl = (project: Project) =>
  projectVersionRouteUrl(project, "/capture-sessions");

const guidesUrl = (project: Project) =>
  projectVersionRouteUrl(project, "/guides");

const interactiveDemosUrl = (project: Project) =>
  projectVersionRouteUrl(project, "/interactive-demos");

/** Builds the canonical Project settings route. */
const settingsUrl = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}/settings`;
const complianceUrl = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}/compliance`;
const activityUrl = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}/activity`;

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
      <PortalShell
        project={projectId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <StatusPanel
          className={styles.state}
          description="Loading project..."
          title="Projects"
          titleAs="h1"
          tone="loading"
        />
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell
        project={projectId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <StatusPanel
          action={
            <a className={styles.stateLink} href={signInUrl(currentPath)}>
              Sign in
            </a>
          }
          className={styles.state}
          description="Sign in to view this project."
          title="Projects"
          titleAs="h1"
          tone="forbidden"
        />
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell
        project={projectId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <StatusPanel
          className={styles.state}
          description="Project was not found."
          title="Projects"
          titleAs="h1"
          tone="not-found"
        />
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell
        project={projectId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <StatusPanel
          action={
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Retry
            </Button>
          }
          className={styles.state}
          description="Could not load project."
          title="Projects"
          titleAs="h1"
          tone="error"
        />
      </PortalShell>
    );
  }

  return (
    <PortalShell
      project={state.project}
      performLogout={performLogout}
      navigate={navigate}
    >
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Project workspace</div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{state.project.name}</h1>
            <Badge
              variant={
                state.project.status === "active" ? "success" : "default"
              }
            >
              {state.project.status}
            </Badge>
            <Badge>{projectRoleLabel(state.project)}</Badge>
            {state.project.access.source === "organization_owner" ? (
              <span>Organization owner</span>
            ) : null}
          </div>
          {state.project.description ? (
            <p className={styles.description}>{state.project.description}</p>
          ) : null}
          <div className={styles.meta}>
            <span>
              Default Project Version:{" "}
              {state.project.default_project_version.name}
            </span>
            {state.project.slug ? <span>{state.project.slug}</span> : null}
            <span>Updated {formatDateTime(state.project.updated_at)}</span>
            <span>Created {formatDateTime(state.project.created_at)}</span>
          </div>
        </div>
        {state.project.access.role === "project_admin" ? (
          <div className={styles.headerActions}>
            <a className={styles.settingsLink} href={settingsUrl(projectId)}>
              Project settings
            </a>
            <a className={styles.settingsLink} href={complianceUrl(projectId)}>
              Compliance
            </a>
          </div>
        ) : null}
      </section>

      <section className={styles.content} aria-labelledby="workspace-heading">
        <h2 className={styles.sectionTitle} id="workspace-heading">
          Workspace
        </h2>
        <div className={styles.actions}>
          <WorkspaceAction
            title="Capture sessions"
            description="Open source captures for this project."
            href={captureSessionsUrl(state.project)}
            linkLabel="Open capture sessions"
          />
          {state.project.access.role !== "viewer" ? (
            <WorkspaceAction
              title="Activity"
              description="Review curated Project changes without raw security evidence."
              href={activityUrl(projectId)}
              linkLabel="Open activity"
            />
          ) : null}
          <WorkspaceAction
            title="Guides"
            description="Open prepared docs and demos for this project."
            href={guidesUrl(state.project)}
            linkLabel="Open guides"
          />
          <WorkspaceAction
            title="Interactive demos"
            description="Open screenshot-first product walkthrough demos."
            href={interactiveDemosUrl(state.project)}
            linkLabel="Open interactive demos"
          />
        </div>
      </section>
    </PortalShell>
  );
};

/** Wraps Project workspace states in the shared portal shell. */
const PortalShell = ({
  children,
  project,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  project: Project | string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
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
      activeSection="project_workspace"
      currentLabel="Project workspace"
      project={projectContext}
      performLogout={performLogout}
      navigate={navigate}
    >
      {children}
    </PortalAppShell>
  );
};

/** Renders one real library entry point for a Project. */
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
