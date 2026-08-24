/**
 * @fileoverview Portal Project list with create flow and lifecycle filters.
 */
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { AuthContext, AuthResponse } from "@repo/types/auth";
import { ArrowRight, ChevronRight, Plus, X } from "lucide-react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
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

type CreateProjectFieldErrors = {
  name?: string;
  slug?: string;
};

const emptyCreateProjectForm = (): CreateProjectFormState => ({
  name: "",
  slug: "",
  description: "",
});

const projectUrlSegment = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

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

const projectInitial = (name: string) =>
  name.match(/[\p{L}\p{N}]/u)?.[0]?.toLocaleUpperCase() ?? "P";

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
      return "That Project URL is already in use.";
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
  const [createForm, setCreateForm] = useState<CreateProjectFormState>(
    emptyCreateProjectForm,
  );
  const [createFieldErrors, setCreateFieldErrors] =
    useState<CreateProjectFieldErrors>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [account, setAccount] = useState<AuthContext | null>(null);
  const createDialogRef = useRef<HTMLDialogElement | null>(null);
  const createNameInputRef = useRef<HTMLInputElement | null>(null);
  const createTriggerRef = useRef<HTMLButtonElement | null>(null);
  const projectUrlEditedRef = useRef(false);

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
    if (!showCreateForm) return;

    const dialog = createDialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }
    createNameInputRef.current?.focus();
  }, [showCreateForm]);

  const updateCreateField = (
    field: keyof CreateProjectFormState,
    value: string,
  ) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
    if (field === "name" || field === "slug") {
      setCreateFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const updateProjectName = (value: string) => {
    setCreateForm((current) => ({
      ...current,
      name: value,
      slug: projectUrlEditedRef.current
        ? current.slug
        : projectUrlSegment(value),
    }));
    setCreateFieldErrors((current) => ({
      ...current,
      name: undefined,
      slug: projectUrlEditedRef.current ? current.slug : undefined,
    }));
  };

  const updateProjectUrl = (value: string) => {
    projectUrlEditedRef.current = true;
    updateCreateField("slug", projectUrlSegment(value));
  };

  const openCreateForm = (trigger: HTMLButtonElement) => {
    createTriggerRef.current = trigger;
    setShowCreateForm(true);
    setCreateError(null);
    setCreateFieldErrors({});
  };

  const closeCreateForm = () => {
    const dialog = createDialogRef.current;
    if (dialog?.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
    setShowCreateForm(false);
    setCreateError(null);
    setCreateFieldErrors({});
    setCreateForm(emptyCreateProjectForm());
    projectUrlEditedRef.current = false;
    createTriggerRef.current?.focus();
  };

  const requestCloseCreateForm = () => {
    if (isCreating) return;

    const hasEnteredDetails = Object.values(createForm).some((value) =>
      Boolean(value.trim()),
    );
    if (
      hasEnteredDetails &&
      !window.confirm("Discard the Project details you entered?")
    ) {
      return;
    }

    closeCreateForm();
  };

  const submitCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    const name = createForm.name.trim();
    const slug = createForm.slug.trim();
    const fieldErrors: CreateProjectFieldErrors = {};

    if (!name) {
      fieldErrors.name = "Project name is required.";
    }
    if (!slug) {
      fieldErrors.slug = "Project URL is required.";
    }
    if (fieldErrors.name || fieldErrors.slug) {
      setCreateFieldErrors(fieldErrors);
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await createProjectAction({
        name,
        slug,
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
            Organize your project knowledge and access the work your team needs.
          </p>
        </div>
        <Button
          className={styles.createButton}
          size="icon"
          type="button"
          aria-label="Create a new Project"
          title="Create a new Project"
          onClick={(event) => openCreateForm(event.currentTarget)}
        >
          <Plus aria-hidden="true" size={19} />
        </Button>
      </section>

      {!showCreateForm ? null : (
        <dialog
          ref={createDialogRef}
          className={styles.createDialog}
          aria-labelledby="create-project-heading"
          aria-modal="true"
          onCancel={(event) => {
            event.preventDefault();
            requestCloseCreateForm();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) requestCloseCreateForm();
          }}
        >
          <div className={styles.createModal}>
            <header className={styles.createModalHeader}>
              <div>
                <h2 className={styles.formTitle} id="create-project-heading">
                  Create a Project
                </h2>
              </div>
              <Button
                className={styles.closeButton}
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Close create Project"
                title="Close"
                disabled={isCreating}
                onClick={requestCloseCreateForm}
              >
                <X aria-hidden="true" size={19} />
              </Button>
            </header>
            <form
              className={styles.form}
              noValidate
              onSubmit={submitCreateProject}
            >
              {createError ? (
                <Alert variant="destructive">{createError}</Alert>
              ) : null}
              <div className={styles.field}>
                <Label htmlFor="create-project-name">
                  Project name <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="create-project-name"
                  ref={createNameInputRef}
                  name="name"
                  required
                  aria-invalid={Boolean(createFieldErrors.name)}
                  aria-describedby={
                    createFieldErrors.name
                      ? "create-project-name-error"
                      : undefined
                  }
                  value={createForm.name}
                  placeholder="e.g. Oswald’s tomato garden"
                  onChange={(event) => updateProjectName(event.target.value)}
                />
                {createFieldErrors.name ? (
                  <span
                    className={styles.fieldError}
                    id="create-project-name-error"
                  >
                    {createFieldErrors.name}
                  </span>
                ) : null}
              </div>
              <div className={styles.field}>
                <Label htmlFor="create-project-url">
                  Project URL <span aria-hidden="true">*</span>
                </Label>
                <div className={styles.projectUrlControl}>
                  <span aria-hidden="true">/projects/</span>
                  <Input
                    id="create-project-url"
                    name="slug"
                    required
                    aria-invalid={Boolean(createFieldErrors.slug)}
                    aria-describedby={
                      createFieldErrors.slug
                        ? "create-project-url-help create-project-url-error"
                        : "create-project-url-help"
                    }
                    value={createForm.slug}
                    placeholder="oswalds-tomato-garden"
                    onChange={(event) => updateProjectUrl(event.target.value)}
                  />
                </div>
                <span className={styles.fieldHelp} id="create-project-url-help">
                  Generated from the Project name. You can change it.
                </span>
                {createFieldErrors.slug ? (
                  <span
                    className={styles.fieldError}
                    id="create-project-url-error"
                  >
                    {createFieldErrors.slug}
                  </span>
                ) : null}
              </div>
              <div className={styles.field}>
                <Label htmlFor="create-project-description">
                  Description (optional)
                </Label>
                <Textarea
                  id="create-project-description"
                  name="description"
                  rows={3}
                  value={createForm.description}
                  placeholder="Captures, guides, and notes for growing Big City’s happiest tomato garden."
                  onChange={(event) =>
                    updateCreateField("description", event.target.value)
                  }
                />
              </div>
              <div className={styles.formActions}>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={isCreating}
                  onClick={requestCloseCreateForm}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating Project..." : "Create Project"}
                </Button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      <section className={styles.content} aria-label="Project library">
        <div className={styles.tabs} role="tablist" aria-label="Project status">
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
              className={`${styles.emptyIllustration} ${
                statusFilter === "archived"
                  ? styles.emptyIllustrationArchived
                  : ""
              }`}
              src={
                statusFilter === "active"
                  ? "/illustrations/ossie-projects-empty.png"
                  : "/illustrations/ossie-projects-archived-empty.png"
              }
              alt=""
              aria-hidden="true"
              width="320"
              height="213"
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
              <Button
                type="button"
                onClick={(event) => openCreateForm(event.currentTarget)}
              >
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
    <div className={styles.projectIdentity} aria-hidden="true">
      {projectInitial(project.name)}
    </div>
    <div className={styles.projectBody}>
      <h3 className={styles.projectTitle}>{project.name}</h3>
      {project.description ? (
        <p className={styles.description}>{project.description}</p>
      ) : null}
      <div className={styles.meta}>
        <span>{project.default_project_version.name}</span>
        <span>{projectRoleLabel(project)}</span>
        <span>Updated {formatDateTime(project.updated_at)}</span>
      </div>
    </div>
    <a
      className={styles.openLink}
      href={projectUrl(project)}
      aria-label={`Open project ${project.name}`}
      title={`Open project ${project.name}`}
    >
      <ChevronRight aria-hidden="true" size={20} />
    </a>
  </article>
);
