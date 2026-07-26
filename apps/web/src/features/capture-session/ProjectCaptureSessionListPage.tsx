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
  createProjectCaptureSession,
  listProjectCaptureSessions,
  type CaptureSessionCreateResponse,
  type ProjectCaptureSessionListResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
import {
  projectIsWritable,
  useProjectAccess,
} from "../project/useProjectAccess";
import type { CaptureSession, CreateCaptureSessionInput } from "./types";
import styles from "./ProjectCaptureSessionListPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; captureSessions: CaptureSession[] }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type ProjectCaptureSessionListPageProps = {
  projectId: string;
  loadCaptureSessions?: (
    projectId: string,
    options: { project_version_id: string },
  ) => Promise<ProjectCaptureSessionListResponse>;
  createCaptureSession?: (
    projectId: string,
    input: CreateCaptureSessionInput,
  ) => Promise<CaptureSessionCreateResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  canWrite?: boolean;
  versionSlug?: string;
  projectVersionId: string;
  renderShell?: boolean;
};

type CreateCaptureSessionFormState = {
  name: string;
  start_url: string;
  description: string;
};

const emptyCreateCaptureSessionForm = (): CreateCaptureSessionFormState => ({
  name: "",
  start_url: "",
  description: "",
});

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

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const captureSessionUrl = (
  projectId: string,
  captureSessionId: string,
  versionSlug?: string,
) =>
  `/projects/${encodeURIComponent(projectId)}${versionSlug ? `/versions/${encodeURIComponent(versionSlug)}` : ""}/capture-sessions/${encodeURIComponent(captureSessionId)}`;

const optionalCaptureSessionField = (value: string) => {
  const trimmed = value.trim();

  return trimmed || null;
};

const createCaptureSessionErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to create a capture session.";
    }

    if (error.type === "project_not_found") {
      return "Project was not found.";
    }

    if (error.type === "invalid_capture_session") {
      return "Capture session input is invalid.";
    }
  }

  return "Could not create capture session.";
};

const openCaptureSession = (
  projectId: string,
  captureSessionId: string,
  versionSlug?: string,
  navigate?: (path: string) => void,
) => {
  const path = captureSessionUrl(projectId, captureSessionId, versionSlug);

  if (navigate) {
    navigate(path);
    return;
  }

  window.location.assign(path);
};

const startUrlLabel = (value: string | null) => {
  if (!value) {
    return "No start URL";
  }

  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
};

const browserLabel = (session: CaptureSession) =>
  [session.browser_name, session.browser_version].filter(Boolean).join(" ");

const viewportLabel = (session: CaptureSession) =>
  session.viewport_width && session.viewport_height
    ? `${session.viewport_width} x ${session.viewport_height}`
    : null;

export const ProjectCaptureSessionListPage = ({
  projectId,
  loadCaptureSessions = listProjectCaptureSessions,
  createCaptureSession:
    createCaptureSessionAction = createProjectCaptureSession,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
  canWrite,
  versionSlug,
  projectVersionId,
  renderShell = true,
}: ProjectCaptureSessionListPageProps) => {
  const projectAccess = useProjectAccess(projectId).state;
  const writable =
    canWrite ??
    (projectAccess.status === "loaded" &&
      Boolean(projectAccess.project) &&
      projectIsWritable(projectAccess.project));
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCaptureSessionFormState>(
    emptyCreateCaptureSessionForm,
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const createNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadCaptureSessions(projectId, { project_version_id: projectVersionId })
      .then((response) => {
        if (active) {
          setState({
            status: "loaded",
            captureSessions: response.capture_sessions,
          });
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
  }, [projectId, projectVersionId, loadCaptureSessions, reloadKey]);

  useEffect(() => {
    if (showCreateForm) {
      createNameInputRef.current?.focus();
    }
  }, [showCreateForm]);

  const updateCreateField = (
    field: keyof CreateCaptureSessionFormState,
    value: string,
  ) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setCreateForm(emptyCreateCaptureSessionForm());
    setShowCreateForm(true);
    setCreateError(null);
  };

  const closeCreateForm = () => {
    setCreateForm(emptyCreateCaptureSessionForm());
    setShowCreateForm(false);
    setCreateError(null);
  };

  const submitCreateCaptureSession = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    const name = createForm.name.trim();

    if (!name) {
      setCreateError("Capture session name is required.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await createCaptureSessionAction(projectId, {
        name,
        project_version_id: projectVersionId,
        description: optionalCaptureSessionField(createForm.description),
        source_type: "manual",
        start_url: optionalCaptureSessionField(createForm.start_url),
      });
      openCaptureSession(
        projectId,
        response.capture_session.id,
        versionSlug,
        navigate,
      );
    } catch (error: unknown) {
      setCreateError(createCaptureSessionErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  if (state.status === "loading") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
        renderShell={renderShell}
      >
        <div className={styles.state}>Loading capture sessions...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
        renderShell={renderShell}
      >
        <div className={styles.state}>
          <div>Sign in to view capture sessions.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>
            Sign in
          </a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
        renderShell={renderShell}
      >
        <div className={styles.state}>Project was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell
        projectId={projectId}
        performLogout={performLogout}
        navigate={navigate}
        versionSlug={versionSlug}
        renderShell={renderShell}
      >
        <div className={styles.state}>
          <div>Could not load capture sessions.</div>
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
      projectId={projectId}
      performLogout={performLogout}
      navigate={navigate}
      versionSlug={versionSlug}
      renderShell={renderShell}
    >
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Project</div>
          <h1 className={styles.title}>Capture sessions</h1>
          <p className={styles.description}>{projectId}</p>
        </div>
        {writable ? (
          <Button type="button" onClick={openCreateForm}>
            New Capture Session
          </Button>
        ) : (
          <Badge>Read only</Badge>
        )}
      </section>

      {showCreateForm ? (
        <Card
          className={styles.createPanel}
          aria-labelledby="create-capture-session-heading"
        >
          <CardHeader>
            <h2
              className={styles.formTitle}
              id="create-capture-session-heading"
            >
              Create capture session
            </h2>
          </CardHeader>
          <CardContent>
            <form className={styles.form} onSubmit={submitCreateCaptureSession}>
              {createError ? (
                <Alert variant="destructive">{createError}</Alert>
              ) : null}
              <Label className={styles.field}>
                <span>Name</span>
                <Input
                  ref={createNameInputRef}
                  value={createForm.name}
                  onChange={(event) =>
                    updateCreateField("name", event.target.value)
                  }
                />
              </Label>
              <Label className={styles.field}>
                <span>Start URL</span>
                <Input
                  value={createForm.start_url}
                  onChange={(event) =>
                    updateCreateField("start_url", event.target.value)
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
                  {isCreating
                    ? "Creating Capture Session..."
                    : "Create Capture Session"}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={closeCreateForm}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <section
        className={styles.content}
        aria-labelledby="capture-sessions-heading"
      >
        <h2 className={styles.sectionTitle} id="capture-sessions-heading">
          Project capture sessions
        </h2>
        {state.captureSessions.length === 0 ? (
          <Card className={styles.empty}>No capture sessions yet.</Card>
        ) : (
          <div className={styles.list}>
            {state.captureSessions.map((captureSession) => (
              <CaptureSessionRow
                key={captureSession.id}
                captureSession={captureSession}
                projectId={projectId}
                versionSlug={versionSlug}
              />
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
};

const PortalShell = ({
  children,
  projectId,
  performLogout,
  navigate,
  versionSlug,
  renderShell,
}: {
  children: React.ReactNode;
  projectId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  versionSlug?: string;
  renderShell: boolean;
}) =>
  renderShell ? (
    <PortalAppShell
      activeSection="capture_sessions"
      currentLabel="Capture sessions"
      project={{ id: projectId }}
      projectVersion={versionSlug ? { slug: versionSlug } : undefined}
      performLogout={performLogout}
      navigate={navigate}
    >
      {children}
    </PortalAppShell>
  ) : (
    <>{children}</>
  );

const CaptureSessionRow = ({
  captureSession,
  projectId,
  versionSlug,
}: {
  captureSession: CaptureSession;
  projectId: string;
  versionSlug?: string;
}) => {
  const browser = browserLabel(captureSession);
  const viewport = viewportLabel(captureSession);

  return (
    <Card className={styles.captureSession} role="article">
      <div className={styles.captureSessionBody}>
        <div className={styles.captureSessionHeader}>
          <h3 className={styles.captureSessionTitle}>{captureSession.name}</h3>
          <Badge
            variant={
              captureSession.status === "completed" ? "success" : "default"
            }
          >
            {captureSession.status}
          </Badge>
          <Badge>{captureSession.source_type}</Badge>
        </div>
        {captureSession.description ? (
          <p className={styles.captureSessionDescription}>
            {captureSession.description}
          </p>
        ) : null}
        <div className={styles.meta}>
          <span>{startUrlLabel(captureSession.start_url)}</span>
          <span>Started {formatDateTime(captureSession.started_at)}</span>
          <span>Completed {formatDateTime(captureSession.completed_at)}</span>
          {captureSession.canceled_at ? (
            <span>Canceled {formatDateTime(captureSession.canceled_at)}</span>
          ) : null}
          <span>Updated {formatDateTime(captureSession.updated_at)}</span>
          {browser ? <span>{browser}</span> : null}
          {captureSession.operating_system ? (
            <span>{captureSession.operating_system}</span>
          ) : null}
          {viewport ? <span>{viewport}</span> : null}
        </div>
      </div>
      <a
        className={styles.openLink}
        href={captureSessionUrl(projectId, captureSession.id, versionSlug)}
      >
        Open capture session {captureSession.name}
      </a>
    </Card>
  );
};
