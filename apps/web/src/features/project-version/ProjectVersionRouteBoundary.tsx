/**
 * @fileoverview Project Version route boundary and workspace fallback.
 */

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Camera,
  ChevronRight,
  FileText,
  Forward,
  PlaySquare,
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
import { navigateWithinApp } from "../../lib/clientNavigation";
import { LoginPage } from "../auth/LoginPage";
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
  const shellCurrentLabel =
    activeSection === "project_workspace" ? "" : currentLabel;
  useEffect(() => {
    if (state.status !== "unauthenticated") return;
    (navigate ?? navigateWithinApp)(signInUrl(currentBrowserPath()));
  }, [navigate, state.status]);
  if (state.status === "unauthenticated") {
    return <LoginPage nextPath={currentBrowserPath()} navigate={navigate} />;
  }
  if (state.status !== "loaded")
    return (
      <PortalAppShell
        activeSection={activeSection}
        currentLabel={shellCurrentLabel}
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
      currentLabel={shellCurrentLabel}
      project={{
        id: state.project.id,
        name: state.project.name,
        access: state.project.access,
        defaultProjectVersionSlug: state.project.default_project_version.slug,
      }}
      projectVersion={portalProjectVersionFromDetail(state.selected)}
      navigate={navigate}
    >
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
        <>
          <ProjectVersionContextBar
            {...state}
            navigate={navigate}
            routeSuffix={routeSuffixBySection[activeSection] ?? ""}
          />
          {children(state)}
        </>
      ) : (
        <VersionWorkspace {...state} navigate={navigate} />
      )}
    </PortalAppShell>
  );
};

/** Renders the Project Version workspace when no child route owns content. */
const VersionWorkspace = ({
  project,
  selected,
  versions,
  navigate,
}: Loaded & { navigate?: (path: string) => void }) => {
  const workspacePath = projectVersionWorkspaceUrl(project.id, selected.slug);
  const projectInitial = project.name.trim().charAt(0).toUpperCase() || "P";
  const openProjects = (event: React.MouseEvent<HTMLAnchorElement>) => {
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
    navigate("/projects");
  };

  return (
    <section className={styles.workspace}>
      <header className={styles.projectHeader}>
        <a className={styles.backLink} href="/projects" onClick={openProjects}>
          <ArrowLeft aria-hidden="true" size={16} />
          All projects
        </a>
        <div className={styles.projectIdentityRow}>
          <span
            className={styles.projectIdentity}
            aria-label="Project identity"
          >
            {projectInitial}
          </span>
          <div>
            <h1>{project.name}</h1>
            {project.description ? (
              <p className={styles.projectDescription}>{project.description}</p>
            ) : null}
          </div>
        </div>
      </header>

      <ProjectVersionContextBar
        project={project}
        selected={selected}
        versions={versions}
        navigate={navigate}
      />

      <div className={styles.creationFlow}>
        <section
          className={styles.captureCallout}
          aria-labelledby="capture-heading"
        >
          <span className={styles.captureIcon} aria-hidden="true">
            <Camera size={24} />
          </span>
          <div className={styles.captureCopy}>
            <span className={styles.eyebrow}>Recommended next step</span>
            <h2 id="capture-heading">Start a capture</h2>
            <p>
              Record a browser workflow, then turn it into a guide, interactive
              demo, or documentation.
            </p>
          </div>
          <WorkspaceLink
            title="Start a capture"
            href={`${workspacePath}/capture-sessions`}
            navigate={navigate}
            variant="primary"
          />
        </section>

        <section
          className={styles.buildSection}
          aria-labelledby="build-heading"
        >
          <header className={styles.sectionHeader}>
            <h2 id="build-heading">Quick access</h2>
            <p>Continue working with this Project Version.</p>
          </header>
          <div className={styles.cards}>
            <WorkspaceLink
              title="Guides"
              description="Create clear, step-by-step instructions."
              icon={BookOpenText}
              href={`${workspacePath}/guides`}
              navigate={navigate}
            />
            <WorkspaceLink
              title="Interactive demos"
              description="Turn a workflow into a guided walkthrough."
              icon={PlaySquare}
              href={`${workspacePath}/interactive-demos`}
              navigate={navigate}
            />
            <WorkspaceLink
              title="Documentation"
              description="Organize and publish lasting project knowledge."
              icon={FileText}
              href={`${workspacePath}/documentation`}
              navigate={navigate}
            />
          </div>
        </section>
      </div>

      {project.status === "active" &&
      selected.status === "active" &&
      project.access.role !== "viewer" ? (
        <details className={styles.versionActions}>
          <summary role="button" aria-label="More version actions">
            <span>
              <strong>More version actions</strong>
              <span>Advanced tools for this version</span>
            </span>
            <ChevronRight aria-hidden="true" size={18} />
          </summary>
          <div className={styles.versionActionsBody}>
            <WorkspaceLink
              variant="tool"
              title="Carry forward edits"
              description="Start a draft in this version using edits from another version."
              icon={Forward}
              href={`${workspacePath}/carry-forward`}
              navigate={navigate}
            />
          </div>
        </details>
      ) : null}
      {!selected.is_default ? (
        <Card className={styles.notice}>
          Guides and Interactive Demos belong to this Project Version. Use carry
          forward edits to create an independent draft from another Version.
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
  variant = "card",
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  href: string;
  navigate?: (path: string) => void;
  variant?: "card" | "tool" | "primary";
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
      className={
        variant === "tool"
          ? styles.toolLink
          : variant === "primary"
            ? styles.primaryLink
            : styles.linkCard
      }
      href={href}
      aria-label={variant === "primary" ? title : `Open ${title.toLowerCase()}`}
      onClick={handleClick}
    >
      {Icon ? (
        <span className={styles.linkIcon} aria-hidden="true">
          <Icon size={20} />
        </span>
      ) : null}
      {variant === "primary" ? (
        <>
          <span>{title}</span>
          <ArrowRight aria-hidden="true" size={18} />
        </>
      ) : (
        <span className={styles.linkCopy}>
          <strong>{title}</strong>
          {description ? <span>{description}</span> : null}
          <span className={styles.linkAction} aria-hidden="true">
            <ArrowRight size={18} />
          </span>
        </span>
      )}
    </a>
  );
};
