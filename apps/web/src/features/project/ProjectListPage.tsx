/**
 * @fileoverview Portal Project list with create flow and lifecycle filters.
 */
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { AuthContext, AuthResponse } from "@repo/types/auth";
import { ArrowRight, Plus } from "lucide-react";
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
  getCurrentAuth,
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
  | { status: "redirecting" }
  | { status: "error" };

type ProjectListPageProps = {
  loadProjects?: (options?: {
    status?: "active" | "archived";
  }) => Promise<ProjectListResponse>;
  createProject?: (input: CreateProjectInput) => Promise<ProjectCreateResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  loadAuth?: () => Promise<AuthResponse>;
};

type CreateProjectFormState = {
  name: string;
  slug: string;
  description: string;
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

/** Renders the portal Project list and create form. */
export const ProjectListPage = ({
  loadProjects = listProjects,
  createProject: createProjectAction = createProject,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
  loadAuth = getCurrentAuth,
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
  const [account, setAccount] = useState<AuthContext | null>(null);
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
        if (!active) return;

        if (
          error instanceof ApiClientError &&
          error.kind === "unauthenticated"
        ) {
          const path = signInUrl(currentPath);
          setState({ status: "redirecting" });
          if (navigate) {
            navigate(path);
          } else {
            window.location.assign(path);
          }
          return;
        }

        setState({ status: "error" });
      });

    return () => {
      active = false;
    };
  }, [currentPath, loadProjects, navigate, reloadKey, statusFilter]);

  useEffect(() => {
    let active = true;

    loadAuth()
      .then((response) => {
        if (active) setAccount(response.auth);
      })
      .catch(() => {
        if (active) setAccount(null);
      });

    return () => {
      active = false;
    };
  }, [loadAuth]);

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
      <PortalShell
        account={account}
        performLogout={performLogout}
        navigate={navigate}
      >
        <div className={styles.state}>Loading projects...</div>
      </PortalShell>
    );
  }

  if (state.status === "redirecting") {
    return null;
  }

  if (state.status === "error") {
    return (
      <PortalShell
        account={account}
        performLogout={performLogout}
        navigate={navigate}
      >
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
    <PortalShell
      account={account}
      performLogout={performLogout}
      navigate={navigate}
    >
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>
            Organize your product knowledge and open the work your team needs.
          </p>
        </div>
        <Button
          className={styles.createButton}
          size="icon"
          type="button"
          aria-label="Create a new Project"
          title="Create a new Project"
          onClick={openCreateForm}
        >
          <Plus aria-hidden="true" size={19} />
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

      {!showCreateForm ? (
        <section className={styles.content} aria-label="Project library">
          <div
            className={styles.tabs}
            role="tablist"
            aria-label="Project status"
          >
            <button
              className={
                statusFilter === "active" ? styles.tabActive : styles.tab
              }
              type="button"
              role="tab"
              aria-selected={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </button>
            <button
              className={
                statusFilter === "archived" ? styles.tabActive : styles.tab
              }
              type="button"
              role="tab"
              aria-selected={statusFilter === "archived"}
              onClick={() => setStatusFilter("archived")}
            >
              Archived
            </button>
          </div>
          {state.projects.length === 0 ? (
            <div className={styles.empty}>
              <img
                className={styles.emptyIllustration}
                src="/illustrations/ossie-projects-empty.png"
                alt=""
                aria-hidden="true"
                width="320"
                height="210"
              />
              <h2 className={styles.emptyTitle}>
                {statusFilter === "active"
                  ? "No Projects yet"
                  : "No archived Projects"}
              </h2>
              <p className={styles.emptyDescription}>
                {statusFilter === "active"
                  ? "Projects organize your Captures, Guides, Interactive Demos, and Documentation."
                  : "Projects you archive will appear here."}
              </p>
              {statusFilter === "active" ? (
                <Button type="button" onClick={openCreateForm}>
                  Create your first Project
                  <ArrowRight aria-hidden="true" size={17} />
                </Button>
              ) : null}
            </div>
          ) : (
            <div className={styles.projects}>
              {state.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </PortalShell>
  );
};

/** Wraps the Project list in the shared portal shell. */
const PortalShell = ({
  children,
  account,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  account?: AuthContext | null;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <PortalAppShell
    activeSection="projects"
    currentLabel="Projects"
    account={account}
    projectLibrary
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
