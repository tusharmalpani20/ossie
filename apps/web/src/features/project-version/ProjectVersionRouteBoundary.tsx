/**
 * @fileoverview Project Version route boundary and workspace fallback.
 */

import { useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import type { Project } from "@repo/types/project";
import type {
  ProjectVersion,
  ProjectVersionDetail,
} from "@repo/types/project-version";
import {
  ApiClientError,
  getProject,
  listProjectVersions,
  resolveProjectVersion,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { portalProjectVersionFromDetail } from "../../lib/portalNavigation";
import type { PortalRouteSection } from "../../lib/portalRouteMetadata";
import { PortalAppShell } from "../portal/PortalAppShell";
import {
  ProjectVersionContextBar,
  projectVersionWorkspaceUrl,
} from "./ProjectVersionContextBar";
import styles from "./ProjectVersionRouteBoundary.module.css";

type Loaded = {
  project: Project;
  selected: ProjectVersionDetail;
  versions: ProjectVersion[];
};
type State =
  | { status: "loading" | "unauthenticated" | "not_found" | "error" }
  | ({ status: "loaded" } & Loaded);

const routeSuffixBySection: Partial<
  Record<
    PortalRouteSection,
    "/capture-sessions" | "/guides" | "/interactive-demos"
  >
> = {
  capture_sessions: "/capture-sessions",
  guides: "/guides",
  interactive_demos: "/interactive-demos",
};

/** Resolves Project Version context before rendering version-owned content. */
export const ProjectVersionRouteBoundary = ({
  projectId,
  versionSlug,
  children,
  navigate,
  replace,
  allowVersionOwnedContent = false,
  activeSection = "project_workspace",
  currentLabel = "Project Version workspace",
}: {
  projectId: string;
  versionSlug: string;
  children?: (context: Loaded) => React.ReactNode;
  navigate?: (path: string) => void;
  replace?: (path: string) => void;
  allowVersionOwnedContent?: boolean;
  activeSection?: PortalRouteSection;
  currentLabel?: string;
}) => {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    Promise.all([
      getProject(projectId),
      resolveProjectVersion(projectId, versionSlug),
      listProjectVersions(projectId),
    ])
      .then(([project, resolved, list]) => {
        if (!active) return;
        const canonical = resolved.project_version.slug;
        if (canonical !== versionSlug) {
          const encoded = `/versions/${encodeURIComponent(versionSlug)}`;
          const replacement = `/versions/${encodeURIComponent(canonical)}`;
          const path = `${window.location.pathname.replace(encoded, replacement)}${window.location.search}${window.location.hash}`;
          if (replace) replace(path);
          else window.history.replaceState({}, "", path);
        }
        setState({
          status: "loaded",
          project: project.project,
          selected: resolved.project_version,
          versions: list.project_versions,
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status:
            error instanceof ApiClientError && error.kind === "unauthenticated"
              ? "unauthenticated"
              : error instanceof ApiClientError && error.kind === "not_found"
                ? "not_found"
                : "error",
        });
      });
    return () => {
      active = false;
    };
  }, [projectId, versionSlug, reload, replace]);
  if (state.status === "unauthenticated")
    return (
      <main className={styles.state}>
        <h1>Sign in to view this Project Version.</h1>
        <a href={signInUrl(currentBrowserPath())}>Sign in</a>
      </main>
    );
  if (state.status !== "loaded")
    return (
      <PortalAppShell
        activeSection={activeSection}
        currentLabel={currentLabel}
        project={{ id: projectId }}
        projectVersion={{ slug: versionSlug }}
        navigate={navigate}
      >
        {state.status === "loading" ? (
          <div className={styles.state}>
            <h1>Loading Project Version...</h1>
          </div>
        ) : state.status === "not_found" ? (
          <div className={styles.state}>
            <h1>Project Version was not found.</h1>
          </div>
        ) : (
          <div className={styles.state}>
            <h1>Could not load this Project Version.</h1>
            <Alert variant="destructive">
              Could not load this Project Version.
            </Alert>
            <Button onClick={() => setReload((value) => value + 1)}>
              Retry
            </Button>
          </div>
        )}
      </PortalAppShell>
    );
  const legacyContentAvailable =
    state.project.status === "active" &&
    state.selected.status === "active" &&
    state.selected.is_default;
  return (
    <PortalAppShell
      activeSection={activeSection}
      currentLabel={currentLabel}
      project={{
        id: state.project.id,
        name: state.project.name,
        access: state.project.access,
        defaultProjectVersionSlug: state.project.default_project_version.slug,
      }}
      projectVersion={portalProjectVersionFromDetail(state.selected)}
      navigate={navigate}
    >
      <ProjectVersionContextBar
        {...state}
        navigate={navigate}
        routeSuffix={routeSuffixBySection[activeSection] ?? ""}
      />
      {state.project.status === "archived" ? (
        <Alert>Project archived — all content is read-only.</Alert>
      ) : null}
      {state.selected.status === "archived" ? (
        <Alert>
          Archived Project Version — metadata remains available, but this
          Version is read-only.
        </Alert>
      ) : null}
      {children && (legacyContentAvailable || allowVersionOwnedContent) ? (
        children(state)
      ) : (
        <VersionWorkspace {...state} />
      )}
    </PortalAppShell>
  );
};

/** Renders the Project Version workspace when no child route owns content. */
const VersionWorkspace = ({ project, selected }: Loaded) => (
  <section
    className={styles.workspace}
    role="region"
    aria-label="Project Version workspace"
  >
    <div className={styles.intro}>
      <p className={styles.eyebrow}>Project Version workspace</p>
      <h1 id="project-version-workspace-heading">{selected.name}</h1>
      {selected.description ? (
        <p className={styles.description}>{selected.description}</p>
      ) : (
        <p className={styles.description}>No description yet.</p>
      )}
      <dl className={styles.metadata}>
        <div>
          <dt>Canonical slug</dt>
          <dd>{selected.slug}</dd>
        </div>
        <div>
          <dt>Release date</dt>
          <dd>{selected.release_date ?? "Not set"}</dd>
        </div>
        <div>
          <dt>Lifecycle</dt>
          <dd>{selected.status}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{new Date(selected.updated_at).toLocaleString()}</dd>
        </div>
      </dl>
    </div>
    <div className={styles.cards}>
      <WorkspaceLink
        title="Capture sessions"
        href={`${projectVersionWorkspaceUrl(project.id, selected.slug)}/capture-sessions`}
      />
      {project.status === "active" &&
      selected.status === "active" &&
      project.access.role !== "viewer" ? (
        <WorkspaceLink
          title="Carry Forward Editions"
          href={`${projectVersionWorkspaceUrl(project.id, selected.slug)}/carry-forward`}
        />
      ) : null}
      <WorkspaceLink
        title="Guides"
        href={`${projectVersionWorkspaceUrl(project.id, selected.slug)}/guides`}
      />
      <WorkspaceLink
        title="Interactive demos"
        href={`${projectVersionWorkspaceUrl(project.id, selected.slug)}/interactive-demos`}
      />
    </div>
    {!selected.is_default ? (
      <Card className={styles.empty}>
        Guides and Interactive Demos belong to this Project Version. Use Carry
        Forward Editions to create independent drafts from another Version.
      </Card>
    ) : null}
  </section>
);
/** Renders one Project Version workspace link. */
const WorkspaceLink = ({ title, href }: { title: string; href: string }) => (
  <Card className={styles.linkCard}>
    <h2>{title}</h2>
    <a href={href}>Open {title.toLowerCase()}</a>
  </Card>
);
