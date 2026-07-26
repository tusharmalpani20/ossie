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
  | { status: "loading" | "not_found" | "error" }
  | ({ status: "loaded" } & Loaded);
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
      .catch((error: unknown) =>
        setState({
          status:
            error instanceof ApiClientError && error.kind === "not_found"
              ? "not_found"
              : "error",
        }),
      );
    return () => {
      active = false;
    };
  }, [projectId, versionSlug, reload, replace]);
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
          <div className={styles.state}>Loading Project Version...</div>
        ) : state.status === "not_found" ? (
          <div className={styles.state}>Project Version was not found.</div>
        ) : (
          <div className={styles.state}>
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
      <ProjectVersionContextBar {...state} navigate={navigate} />
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

const VersionWorkspace = ({ project, selected }: Loaded) => (
  <section className={styles.workspace}>
    <div>
      <p className={styles.eyebrow}>Project Version workspace</p>
      <h1>{selected.name}</h1>
      {selected.description ? (
        <p>{selected.description}</p>
      ) : (
        <p>No description yet.</p>
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
const WorkspaceLink = ({ title, href }: { title: string; href: string }) => (
  <Card className={styles.linkCard}>
    <h2>{title}</h2>
    <a href={href}>Open {title.toLowerCase()}</a>
  </Card>
);
