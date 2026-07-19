import { type FormEvent, useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import {
  ApiClientError,
  getProject,
  updateProject as updateProjectRequest,
  type ProjectDetailResponse,
  type ProjectUpdateResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import type { Project, UpdateProjectInput } from "./types";
import { ProjectMembershipSection } from "./ProjectMembershipSection";
import { projectRoleLabel } from "./useProjectAccess";
import styles from "./ProjectSettingsPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; project: Project }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type ProjectSettingsPageProps = {
  projectId: string;
  loadProject?: (projectId: string) => Promise<ProjectDetailResponse>;
  updateProject?: (projectId: string, input: UpdateProjectInput) => Promise<ProjectUpdateResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

type ProjectSettingsForm = {
  name: string;
  description: string;
  slug: string;
};

type SubmitState = "idle" | "saving" | "updating_status";

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

const workspaceUrl = (projectId: string) => `/projects/${encodeURIComponent(projectId)}`;

const formFromProject = (project: Project): ProjectSettingsForm => ({
  name: project.name,
  description: project.description ?? "",
  slug: project.slug ?? "",
});

const optionalProjectField = (value: string) => {
  const trimmed = value.trim();

  return trimmed || null;
};

const sameForm = (left: ProjectSettingsForm, right: ProjectSettingsForm) => (
  left.name === right.name
  && left.description === right.description
  && left.slug === right.slug
);

const updateErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to manage this project.";
    }

    if (error.type === "project_name_conflict") {
      return "A project with this name already exists.";
    }

    if (error.type === "project_slug_conflict") {
      return "A project with this slug already exists.";
    }

    if (error.type === "empty_project_update") {
      return "Change at least one project field before saving.";
    }

    if (error.kind === "validation") {
      return "Project settings are invalid.";
    }
  }

  return "Could not update project.";
};

export const ProjectSettingsPage = ({
  projectId,
  loadProject = getProject,
  updateProject = updateProjectRequest,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: ProjectSettingsPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState<ProjectSettingsForm>({ name: "", description: "", slug: "" });
  const [savedForm, setSavedForm] = useState<ProjectSettingsForm>({ name: "", description: "", slug: "" });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    setMessage(null);
    setError(null);

    loadProject(projectId)
      .then((response) => {
        if (!active) {
          return;
        }

        const nextForm = formFromProject(response.project);
        setState({ status: "loaded", project: response.project });
        setForm(nextForm);
        setSavedForm(nextForm);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setState(loadStateFromError(loadError));
        }
      });

    return () => {
      active = false;
    };
  }, [projectId, loadProject, reloadKey]);

  const updateField = (field: keyof ProjectSettingsForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setError(null);
  };

  const applyProject = (project: Project) => {
    const nextForm = formFromProject(project);
    setState({ status: "loaded", project });
    setForm(nextForm);
    setSavedForm(nextForm);
  };

  const saveDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (state.status !== "loaded" || submitState !== "idle") {
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError("Project name is required.");
      setMessage(null);
      return;
    }

    if (sameForm(form, savedForm)) {
      setError("Change at least one project field before saving.");
      setMessage(null);
      return;
    }

    setSubmitState("saving");
    setError(null);
    setMessage(null);

    try {
      const response = await updateProject(projectId, {
        name,
        description: optionalProjectField(form.description),
        slug: optionalProjectField(form.slug),
      });
      applyProject(response.project);
      setMessage("Project settings saved.");
    } catch (saveError: unknown) {
      setError(updateErrorMessage(saveError));
    } finally {
      setSubmitState("idle");
    }
  };

  const updateStatus = async () => {
    if (state.status !== "loaded" || submitState !== "idle") {
      return;
    }

    const nextStatus = state.project.status === "archived" ? "active" : "archived";

    setSubmitState("updating_status");
    setError(null);
    setMessage(null);

    try {
      const response = await updateProject(projectId, { status: nextStatus });
      applyProject(response.project);
      setMessage(nextStatus === "archived" ? "Project archived." : "Project unarchived.");
    } catch (statusError: unknown) {
      setError(updateErrorMessage(statusError));
    } finally {
      setSubmitState("idle");
    }
  };

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading project settings...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to manage this project.</div>
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
          <div>Could not load project settings.</div>
          <Button variant="secondary" size="sm" type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      </PortalShell>
    );
  }

  const project = state.project;
  if (project.access.role !== "project_admin") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <section className={styles.header}>
          <div><div className={styles.eyebrow}>Project settings</div><h1 className={styles.title}>Settings unavailable</h1></div>
          <a className={styles.backLink} href={workspaceUrl(projectId)}>Back to workspace</a>
        </section>
        <div className={styles.state}>Your {projectRoleLabel(project)} role can view Project content but cannot manage settings.</div>
      </PortalShell>
    );
  }
  const detailsDirty = !sameForm(form, savedForm);
  const isSaving = submitState === "saving";
  const isUpdatingStatus = submitState === "updating_status";
  const isBusy = submitState !== "idle";
  const lifecycleButtonText = project.status === "archived" ? "Unarchive project" : "Archive project";

  return (
    <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Project settings</div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Project settings</h1>
            <Badge variant={project.status === "active" ? "success" : "default"}>{project.status}</Badge>
          </div>
          <p className={styles.description}>{project.name}</p>
          <div className={styles.meta}>
            <span>Updated {formatDateTime(project.updated_at)}</span>
            <span>Created {formatDateTime(project.created_at)}</span>
          </div>
        </div>
        <a className={styles.backLink} href={workspaceUrl(projectId)}>
          Back to workspace
        </a>
      </section>

      <div className={styles.content}>
        <Card className={styles.panel} aria-labelledby="project-details-heading">
          <CardHeader>
            <h2 className={styles.sectionTitle} id="project-details-heading">Details</h2>
          </CardHeader>
          <CardContent>
            {message ? <Alert variant="success">{message}</Alert> : null}
            {error ? <Alert variant="destructive">{error}</Alert> : null}
            <form className={styles.form} onSubmit={saveDetails}>
              <Label className={styles.field}>
                <span>Project name</span>
                <Input
                  value={form.name}
                  disabled={isBusy}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </Label>
              <Label className={styles.field}>
                <span>Description</span>
                <Textarea
                  rows={4}
                  value={form.description}
                  disabled={isBusy}
                  onChange={(event) => updateField("description", event.target.value)}
                />
              </Label>
              <Label className={styles.field}>
                <span>Slug</span>
                <Input
                  value={form.slug}
                  disabled={isBusy}
                  onChange={(event) => updateField("slug", event.target.value)}
                />
              </Label>
              <div className={styles.formActions}>
                <Button type="submit" disabled={isBusy || !detailsDirty}>
                  {isSaving ? "Saving changes..." : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className={styles.panel} aria-labelledby="project-lifecycle-heading">
          <CardHeader>
            <h2 className={styles.sectionTitle} id="project-lifecycle-heading">Lifecycle</h2>
          </CardHeader>
          <CardContent>
            <p className={styles.panelText}>
              {project.status === "archived"
                ? "Return this project to the active project list."
                : "Archived projects are hidden from the active project list but can still be opened directly and restored later."}
            </p>
            <Button variant="secondary" type="button" disabled={isBusy} onClick={updateStatus}>
              {isUpdatingStatus ? "Updating project..." : lifecycleButtonText}
            </Button>
          </CardContent>
        </Card>
        <ProjectMembershipSection projectId={projectId} />
      </div>
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
