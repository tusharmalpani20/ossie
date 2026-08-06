/**
 * @fileoverview Portal Project list with create flow and lifecycle filters.
 */
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import {
  ApiClientError,
  createProject,
  listProjects,
  type ProjectCreateResponse,
  type ProjectListResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
import type { CreateProjectInput, Project } from "./types";
import { projectRoleLabel } from "./useProjectAccess";
import styles from "./ProjectListPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; projects: Project[] }
  | { status: "unauthenticated" }
  | { status: "error" };

type ProjectListPageProps = {
  loadProjects?: (options?: {
    status?: "active" | "archived";
  }) => Promise<ProjectListResponse>;
  createProject?: (input: CreateProjectInput) => Promise<ProjectCreateResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

type CreateProjectFormState = {
  name: string;
  slug: string;
  description: string;
};

const loadStateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError && error.kind === "unauthenticated") {
    return { status: "unauthenticated" };
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

const projectUrl = (project: Project) =>
  `/projects/${encodeURIComponent(project.id)}/versions/${encodeURIComponent(project.default_project_version.slug)}`;

const optionalProjectField = (value: string) => {
  const trimmed = value.trim();

  return trimmed || null;
};

const createProjectErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to create a project.";
    }

    if (error.type === "project_name_conflict") {
      return "A project with this name already exists.";
    }

    if (error.type === "project_slug_conflict") {
      return "A project with this slug already exists.";
    }
  }

  return "Could not create project.";
};

const openProject = (project: Project, navigate?: (path: string) => void) => {
  const path = projectUrl(project);

  if (navigate) {
    navigate(path);
    return;
  }

  window.location.assign(path);
};

const emptyProjectListMessage = (statusFilter: "active" | "archived") =>
  statusFilter === "active"
    ? "No active Projects yet. Create a Project to start capturing governed product knowledge."
    : "No archived Projects. Archived Projects remain directly linkable and can be restored from settings.";

/** Renders the portal Project list and create form. */
export const ProjectListPage = ({
  loadProjects = listProjects,
  createProject: createProjectAction = createProject,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: ProjectListPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"active" | "archived">(
    "active",
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProjectFormState>({
    name: "",
    slug: "",
    description: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const createNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadProjects({ status: statusFilter })
      .then((response) => {
        if (active) {
          setState({ status: "loaded", projects: response.projects });
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
  }, [loadProjects, reloadKey, statusFilter]);

  useEffect(() => {
    if (showCreateForm) {
      createNameInputRef.current?.focus();
    }
  }, [showCreateForm]);

  const updateCreateField = (
    field: keyof CreateProjectFormState,
    value: string,
  ) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setShowCreateForm(true);
    setCreateError(null);
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setCreateError(null);
  };

  const submitCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    const name = createForm.name.trim();

    if (!name) {
      setCreateError("Project name is required.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await createProjectAction({
        name,
        slug: optionalProjectField(createForm.slug),
        description: optionalProjectField(createForm.description),
      });
      openProject(response.project, navigate);
    } catch (error: unknown) {
      setCreateError(createProjectErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  if (state.status === "loading") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading projects...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to view projects.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>
            Sign in
          </a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Could not load projects.</div>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </Button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div className={styles.headerCopy}>
          <div className={styles.eyebrow}>Portal home</div>
          <h1 className={styles.title}>Projects</h1>
        </div>
        <Button type="button" onClick={openCreateForm}>
          New Project
        </Button>
      </section>

      {showCreateForm ? (
        <Card
          className={styles.createPanel}
          aria-labelledby="create-project-heading"
        >
          <CardHeader>
            <h2 className={styles.formTitle} id="create-project-heading">
              Create project
            </h2>
          </CardHeader>
          <CardContent>
            <form className={styles.form} onSubmit={submitCreateProject}>
              {createError ? (
                <Alert variant="destructive">{createError}</Alert>
              ) : null}
              <Label className={styles.field}>
                <span>Project name</span>
                <Input
                  ref={createNameInputRef}
                  value={createForm.name}
                  onChange={(event) =>
                    updateCreateField("name", event.target.value)
                  }
                />
              </Label>
              <Label className={styles.field}>
                <span>Slug</span>
                <Input
                  value={createForm.slug}
                  onChange={(event) =>
                    updateCreateField("slug", event.target.value)
                  }
                />
              </Label>
              <Label className={styles.field}>
                <span>Description</span>
                <Textarea
                  rows={4}
                  value={createForm.description}
                  onChange={(event) =>
                    updateCreateField("description", event.target.value)
                  }
                />
              </Label>
              <div className={styles.formActions}>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating Project..." : "Create Project"}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={isCreating}
                  onClick={closeCreateForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <section className={styles.content} aria-label="Project library">
        <div className={styles.listHeader}>
          <div>
            <h2 className={styles.sectionTitle} id="projects-heading">
              {statusFilter === "active" ? "Active" : "Archived"} projects
            </h2>
            <p className={styles.listDescription}>
              Open a workspace or review archived Projects.
            </p>
          </div>
          <label className={styles.filter}>
            <span>Project status</span>
            <select
              className={styles.filterSelect}
              aria-label="Project status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "active" | "archived")
              }
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        {state.projects.length === 0 ? (
          <Card className={styles.empty}>
            {emptyProjectListMessage(statusFilter)}
          </Card>
        ) : (
          <div className={styles.projects}>
            {state.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
};

/** Wraps the Project list in the shared portal shell. */
const PortalShell = ({
  children,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <PortalAppShell
    activeSection="projects"
    currentLabel="Projects"
    performLogout={performLogout}
    navigate={navigate}
  >
    {children}
  </PortalAppShell>
);

/** Renders one Project summary card with Default Project Version entry link. */
const ProjectCard = ({ project }: { project: Project }) => (
  <article className={styles.project}>
    <div className={styles.projectBody}>
      <div className={styles.titleRow}>
        <h3 className={styles.projectTitle}>{project.name}</h3>
        <Badge variant={project.status === "active" ? "success" : "default"}>
          {project.status}
        </Badge>
        <Badge>{projectRoleLabel(project)}</Badge>
      </div>
      {project.description ? (
        <p className={styles.description}>{project.description}</p>
      ) : null}
      <div className={styles.meta}>
        <span>Default: {project.default_project_version.name}</span>
        {project.slug ? <span>{project.slug}</span> : null}
        <span>Updated {formatDateTime(project.updated_at)}</span>
        <span>Created {formatDateTime(project.created_at)}</span>
      </div>
    </div>
    <a className={styles.openLink} href={projectUrl(project)}>
      Open project {project.name}
    </a>
  </article>
);
