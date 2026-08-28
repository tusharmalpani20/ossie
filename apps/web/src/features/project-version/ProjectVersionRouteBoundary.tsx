/**
 * @fileoverview Project Version route boundary and workspace fallback.
 */

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  Camera,
  FileText,
  Forward,
  MousePointer2,
  type LucideIcon,
} from "lucide-react";
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
  currentLabel = "Workspace",
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
        <VersionWorkspace {...state} navigate={navigate} />
      )}
    </PortalAppShell>
  );
};

/** Renders the Project Version workspace when no child route owns content. */
const formatDate = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not set";

const VersionWorkspace = ({
  project,
  selected,
  navigate,
}: Loaded & { navigate?: (path: string) => void }) => {
  const workspacePath = projectVersionWorkspaceUrl(project.id, selected.slug);

  return (
    <section className={styles.workspace}>
      <header className={styles.workspaceHeader}>
        <div>
          <p className={styles.eyebrow}>Project workspace</p>
          <h1>Workspace</h1>
          <p className={styles.intro}>
            Keep the work for this Project Version in one clear place.
          </p>
        </div>
        <div className={styles.versionSummary}>
          <span>{selected.name}</span>
          <span className={styles.statusDot} aria-hidden="true" />
          <span>{selected.status === "active" ? "Active" : "Archived"}</span>
        </div>
      </header>
      <dl className={styles.metadata}>
        <div>
          <dt>Version</dt>
          <dd>{selected.name}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{selected.status === "active" ? "Active" : "Archived"}</dd>
        </div>
        <div>
          <dt>Released</dt>
          <dd>{formatDate(selected.release_date)}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDate(selected.updated_at)}</dd>
        </div>
      </dl>
      <div className={styles.cards}>
        <WorkspaceLink
          title="Capture sessions"
          description="Record and review browser workflows."
          icon={Camera}
          href={`${workspacePath}/capture-sessions`}
          navigate={navigate}
        />
        {project.status === "active" &&
        selected.status === "active" &&
        project.access.role !== "viewer" ? (
          <WorkspaceLink
            title="Carry Forward Editions"
            description="Start a draft from another Version."
            icon={Forward}
            href={`${workspacePath}/carry-forward`}
            navigate={navigate}
          />
        ) : null}
        <WorkspaceLink
          title="Guides"
          description="Turn captured steps into governed instructions."
          icon={BookOpenText}
          href={`${workspacePath}/guides`}
          navigate={navigate}
        />
        <WorkspaceLink
          title="Interactive demos"
          description="Share guided, interactive product walkthroughs."
          icon={MousePointer2}
          href={`${workspacePath}/interactive-demos`}
          navigate={navigate}
        />
        <WorkspaceLink
          title="Documentation"
          description="Publish the product knowledge your team trusts."
          icon={FileText}
          href={`${workspacePath}/documentation`}
          navigate={navigate}
        />
      </div>
      {!selected.is_default ? (
        <Card className={styles.empty}>
          Guides and Interactive Demos belong to this Project Version. Use
          Carry Forward Editions to create independent drafts from another
          Version.
        </Card>
      ) : null}
    </section>
  );
};
/** Renders one Project Version workspace link. */
const WorkspaceLink = ({
  title,
  description,
  icon: Icon,
  href,
  navigate,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  navigate?: (path: string) => void;
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      !navigate ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };

  return (
    <a
      className={styles.linkCard}
      href={href}
      aria-label={`Open ${title.toLowerCase()}`}
      onClick={handleClick}
    >
      <span className={styles.linkIcon} aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className={styles.linkCopy}>
        <strong>{title}</strong>
        <span>{description}</span>
        <span className={styles.linkAction}>
          Open {title.toLowerCase()}
          <ArrowRight aria-hidden="true" size={16} />
        </span>
      </span>
    </a>
  );
};
