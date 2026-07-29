import { useState } from "react";
import { Button } from "@repo/ui/button";
import type {
  AuthResponse,
  CaptureSessionResponse,
  Project,
  ProjectVersionListResponse,
} from "../lib/api";
import type { ExtensionSettings } from "../lib/settings";
import { errorMessage, projectContextLabel } from "./helpers";
import { LocalCaptureRecovery } from "./LocalCaptureRecovery";
import { CaptureContextPanel } from "./CaptureContextPanel";
import { CaptureStatusPanel } from "./CaptureStatusPanel";

export const CaptureWorkspace = ({
  auth,
  projects,
  projectVersions,
  selectedProjectId,
  selectedProjectVersionId,
  activeCaptureSessionId,
  activeCaptureProjectId,
  activeCaptureProjectVersionName,
  activeCaptureProjectVersionSlug,
  activeCaptureContextAvailable,
  activeCaptureProjectVersionStatus,
  activeCaptureSessionStatus,
  activeCaptureIndexReconciled,
  activeCaptureMode,
  activeCapturePaused,
  completionRecoveryPending,
  localRecoveryMessage,
  automaticCaptureDiagnostic,
  manualCaptureDiagnostic,
  onSelect,
  onSelectVersion,
  onStartCapture,
  onSetActiveCaptureMode,
  onDiscardActiveCapture,
  onCaptureScreenshot,
  onFinishCapture,
  onOpenActiveCapture,
  onChangeInstance,
  onSignOut,
}: {
  auth: AuthResponse["auth"];
  projects: Project[];
  projectVersions: ProjectVersionListResponse["project_versions"];
  selectedProjectId: string | null;
  selectedProjectVersionId: string | null;
  activeCaptureSessionId: string | null;
  activeCaptureProjectId: string | null;
  activeCaptureProjectVersionName: string | null;
  activeCaptureProjectVersionSlug: string | null;
  activeCaptureContextAvailable: boolean;
  activeCaptureProjectVersionStatus: "active" | "archived" | null;
  activeCaptureSessionStatus:
    | CaptureSessionResponse["capture_session"]["status"]
    | null;
  activeCaptureIndexReconciled: boolean;
  activeCaptureMode: "manual" | "automatic" | null;
  activeCapturePaused: boolean;
  completionRecoveryPending: boolean;
  localRecoveryMessage: string | null;
  automaticCaptureDiagnostic: ExtensionSettings["automaticCaptureDiagnostic"];
  manualCaptureDiagnostic: ExtensionSettings["manualCaptureDiagnostic"];
  onSelect: (projectId: string) => Promise<void>;
  onSelectVersion: (projectVersionId: string) => Promise<void>;
  onStartCapture: (projectId: string) => Promise<void>;
  onSetActiveCaptureMode: (input: {
    mode: "manual" | "automatic";
    paused: boolean;
  }) => Promise<void>;
  onDiscardActiveCapture: () => Promise<void>;
  onCaptureScreenshot: (input: {
    projectId: string;
    captureSessionId: string;
  }) => Promise<{ event_index: number }>;
  onFinishCapture: (input: {
    projectId: string;
    captureSessionId: string;
  }) => Promise<void>;
  onOpenActiveCapture: (input: {
    projectId: string;
    captureSessionId: string;
  }) => Promise<void>;
  onChangeInstance: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) => {
  const [starting, setStarting] = useState(false);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [changingCaptureMode, setChangingCaptureMode] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [portalOpenError, setPortalOpenError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [lastCaptureEventIndex, setLastCaptureEventIndex] = useState<
    number | null
  >(null);
  const selectedProject = selectedProjectId
    ? (projects.find((project) => project.id === selectedProjectId) ?? null)
    : null;
  const activeProject = activeCaptureProjectId
    ? (projects.find((project) => project.id === activeCaptureProjectId) ??
      null)
    : null;
  const selectedProjectVersion = selectedProjectVersionId
    ? (projectVersions.find(
        (version) => version.id === selectedProjectVersionId,
      ) ?? null)
    : null;
  const hasActiveCapture = Boolean(
    activeCaptureSessionId && activeCaptureProjectId,
  );
  const resolvedCaptureMode = activeCaptureMode ?? "manual";
  const isAutomaticCapture = resolvedCaptureMode === "automatic";
  const activeCaptureWritable =
    activeCaptureContextAvailable &&
    activeCaptureIndexReconciled &&
    Boolean(activeProject) &&
    activeCaptureProjectVersionStatus !== "archived" &&
    (activeCaptureSessionStatus === "draft" ||
      activeCaptureSessionStatus === "capturing" ||
      activeCaptureSessionStatus === null);
  const captureSaving =
    automaticCaptureDiagnostic?.status === "saving" ||
    manualCaptureDiagnostic?.status === "saving";
  const busy =
    starting ||
    capturingScreenshot ||
    finishing ||
    openingPortal ||
    changingCaptureMode ||
    captureSaving;
  const automaticCaptureDiagnosticMessage =
    automaticCaptureDiagnostic?.status === "failed"
      ? `Automatic click capture failed: ${automaticCaptureDiagnostic.message ?? "Check extension permissions and supported pages."}`
      : null;
  const automaticCaptureSuccessMessage =
    automaticCaptureDiagnostic?.status === "success" &&
    automaticCaptureDiagnostic.eventIndex
      ? `Automatic capture event recorded: step ${automaticCaptureDiagnostic.eventIndex}`
      : null;
  const manualCaptureDiagnosticMessage =
    manualCaptureDiagnostic?.status === "failed"
      ? `Manual screenshot failed: ${manualCaptureDiagnostic.message ?? "Could not capture screenshot."}`
      : null;
  const manualCaptureSuccessMessage =
    manualCaptureDiagnostic?.status === "success" &&
    manualCaptureDiagnostic.eventIndex
      ? `Manual screenshot recorded: step ${manualCaptureDiagnostic.eventIndex}`
      : null;
  const savingMessage =
    manualCaptureDiagnostic?.status === "saving"
      ? (manualCaptureDiagnostic.message ?? "Saving manual screenshot…")
      : automaticCaptureDiagnostic?.status === "saving"
        ? (automaticCaptureDiagnostic.message ?? "Saving automatic capture…")
        : null;

  const heading = hasActiveCapture
    ? "Capture active"
    : selectedProject
      ? "Ready to capture"
      : "Select project";

  const handleStartCapture = async () => {
    if (!selectedProject || !selectedProjectVersion || busy) {
      return;
    }

    setStarting(true);
    setStartError(null);

    try {
      await onStartCapture(selectedProject.id);
      setStarting(false);
    } catch (error: unknown) {
      setStartError(errorMessage(error, "Could not start capture."));
      setStarting(false);
    }
  };

  const handleCaptureScreenshot = async () => {
    if (!activeCaptureProjectId || !activeCaptureSessionId || busy) {
      return;
    }

    setCapturingScreenshot(true);
    setScreenshotError(null);
    setFinishError(null);
    setPortalOpenError(null);
    setLastCaptureEventIndex(null);

    try {
      const result = await onCaptureScreenshot({
        projectId: activeCaptureProjectId,
        captureSessionId: activeCaptureSessionId,
      });
      setLastCaptureEventIndex(result.event_index);
      setCapturingScreenshot(false);
    } catch (error: unknown) {
      setScreenshotError(errorMessage(error, "Could not capture screenshot."));
      setCapturingScreenshot(false);
    }
  };

  const handleFinishCapture = async () => {
    if (!activeCaptureProjectId || !activeCaptureSessionId || busy) {
      return;
    }

    setFinishing(true);
    setScreenshotError(null);
    setFinishError(null);
    setPortalOpenError(null);

    try {
      await onFinishCapture({
        projectId: activeCaptureProjectId,
        captureSessionId: activeCaptureSessionId,
      });
      setFinishing(false);
    } catch (error: unknown) {
      setFinishError(errorMessage(error, "Could not finish capture."));
      setFinishing(false);
    }
  };

  const handleOpenActiveCapture = async () => {
    if (!activeCaptureProjectId || !activeCaptureSessionId || busy) {
      return;
    }

    setOpeningPortal(true);
    setScreenshotError(null);
    setFinishError(null);
    setPortalOpenError(null);

    try {
      await onOpenActiveCapture({
        projectId: activeCaptureProjectId,
        captureSessionId: activeCaptureSessionId,
      });
      setOpeningPortal(false);
    } catch (error: unknown) {
      setPortalOpenError(
        errorMessage(error, "Could not open capture in portal."),
      );
      setOpeningPortal(false);
    }
  };

  const handleSetAutomaticPaused = async (paused: boolean) => {
    if (busy) {
      return;
    }

    setChangingCaptureMode(true);
    setScreenshotError(null);
    setFinishError(null);
    setPortalOpenError(null);

    try {
      await onSetActiveCaptureMode({
        mode: "automatic",
        paused,
      });
      setChangingCaptureMode(false);
    } catch (error: unknown) {
      setScreenshotError(
        errorMessage(error, "Could not update automatic capture state."),
      );
      setChangingCaptureMode(false);
    }
  };

  const handleSelectProject = async (projectId: string) => {
    if (busy) return;
    setSelectionError(null);
    try {
      await onSelect(projectId);
    } catch (error: unknown) {
      setSelectionError(
        errorMessage(error, "Could not load Project Versions."),
      );
    }
  };

  const handleSelectVersion = async (projectVersionId: string) => {
    if (busy) return;
    setSelectionError(null);
    try {
      await onSelectVersion(projectVersionId);
    } catch (error: unknown) {
      setSelectionError(
        errorMessage(error, "Could not select Project Version."),
      );
    }
  };

  const handleAccountAction = async (
    action: () => Promise<void>,
    fallback: string,
  ) => {
    setAccountError(null);
    try {
      await action();
    } catch (error: unknown) {
      setAccountError(errorMessage(error, fallback));
    }
  };

  return (
    <section className="panel" aria-labelledby="project-heading">
      <div className="toolbar">
        <div>
          <h1 id="project-heading">{heading}</h1>
          <p className="identity">{auth.user.email}</p>
          <p className="instance">{auth.organization.name}</p>
        </div>
        <div className="toolbarActions">
          <Button
            variant="secondary"
            className="secondary"
            disabled={busy}
            onClick={() =>
              void handleAccountAction(
                onChangeInstance,
                "Could not change instance.",
              )
            }
          >
            Change instance
          </Button>
          <Button
            variant="secondary"
            className="secondary"
            disabled={busy}
            onClick={() =>
              void handleAccountAction(onSignOut, "Could not sign out.")
            }
          >
            Sign out
          </Button>
        </div>
      </div>
      {accountError ? (
        <div className="error" role="alert">
          {accountError}
        </div>
      ) : null}

      {hasActiveCapture ? (
        <CaptureContextPanel>
          <p className="captureMode">
            {isAutomaticCapture
              ? "Automatic click capture"
              : "Manual screenshot capture"}
          </p>
          <p className="captureHelp">
            {isAutomaticCapture
              ? activeCapturePaused
                ? "Automatic click capture is paused. Manual screenshots still work."
                : "Clicks on supported pages create ordered screenshot-backed steps."
              : "Capture one screenshot for each step you want in the guide."}
          </p>
          <p className="captureProject">
            {activeProject
              ? projectContextLabel(activeProject, {
                  name:
                    activeCaptureProjectVersionName ?? "Unavailable Version",
                })
              : "Project unavailable"}
          </p>
          {!activeCaptureContextAvailable ? (
            <div className="error" role="alert">
              The active Capture Session is no longer available. Discard local
              capture state or retry after access is restored.
            </div>
          ) : null}
          {activeCaptureContextAvailable && !activeProject ? (
            <div className="error" role="alert">
              You no longer have capture access to this Project. The Capture
              Session remains visible, but capture and finish actions are
              read-only.
            </div>
          ) : null}
          {activeCaptureProjectVersionStatus === "archived" ? (
            <div className="error" role="alert">
              This Project Version is archived. Restore it before recording or
              finishing the Capture Session.
            </div>
          ) : null}
          {activeCaptureSessionStatus &&
          activeCaptureSessionStatus !== "draft" &&
          activeCaptureSessionStatus !== "capturing" ? (
            <div className="error" role="alert">
              This Capture Session is {activeCaptureSessionStatus} and is
              read-only.
            </div>
          ) : null}
          {!activeCaptureIndexReconciled ? (
            <div className="error" role="alert">
              Capture steps could not be reconciled. Reopen or retry the
              extension before capturing or finishing.
            </div>
          ) : null}
          <CaptureStatusPanel>
            <p className="captureSession">Session {activeCaptureSessionId}</p>
            {localRecoveryMessage ? (
              <div className="error" role="alert">
                {localRecoveryMessage}
              </div>
            ) : null}
            {savingMessage ? (
              <p className="status" role="status" aria-live="polite">
                {savingMessage}
              </p>
            ) : null}
            {screenshotError ? (
              <div className="error" role="alert">
                {screenshotError}
              </div>
            ) : null}
            {automaticCaptureDiagnosticMessage ? (
              <div className="error" role="alert">
                {automaticCaptureDiagnosticMessage}
              </div>
            ) : null}
            {manualCaptureDiagnosticMessage ? (
              <div className="error" role="alert">
                {manualCaptureDiagnosticMessage}
              </div>
            ) : null}
            {finishError ? (
              <div className="error" role="alert">
                {finishError}
              </div>
            ) : null}
            {portalOpenError ? (
              <div className="error" role="alert">
                {portalOpenError}
              </div>
            ) : null}
            {automaticCaptureSuccessMessage ? (
              <p className="success" role="status">
                {automaticCaptureSuccessMessage}
              </p>
            ) : null}
            {manualCaptureSuccessMessage && !lastCaptureEventIndex ? (
              <p className="success" role="status">
                {manualCaptureSuccessMessage}
              </p>
            ) : null}
            {lastCaptureEventIndex ? (
              <p className="success" role="status">
                Capture event recorded: step {lastCaptureEventIndex}
              </p>
            ) : null}
          </CaptureStatusPanel>
          <div className="actions">
            {isAutomaticCapture ? (
              <Button
                className="secondary"
                variant="secondary"
                disabled={busy || !activeCaptureWritable}
                onClick={() =>
                  void handleSetAutomaticPaused(!activeCapturePaused)
                }
              >
                {activeCapturePaused
                  ? "Resume automatic capture"
                  : "Pause automatic capture"}
              </Button>
            ) : null}
            <Button
              disabled={busy || !activeCaptureWritable}
              onClick={() => void handleCaptureScreenshot()}
            >
              {capturingScreenshot ? "Capturing..." : "Capture screenshot"}
            </Button>
            <Button
              variant="secondary"
              className="secondary"
              disabled={
                busy ||
                !activeCaptureContextAvailable ||
                !activeCaptureProjectVersionSlug
              }
              onClick={() => void handleOpenActiveCapture()}
            >
              {openingPortal ? "Opening..." : "Open in portal"}
            </Button>
            <Button
              disabled={busy || !activeCaptureWritable}
              onClick={() => void handleFinishCapture()}
            >
              {finishing
                ? "Finishing..."
                : completionRecoveryPending
                  ? "Retry completion recovery"
                  : "Finish capture"}
            </Button>
            <LocalCaptureRecovery
              busy={busy}
              onClear={onDiscardActiveCapture}
            />
          </div>
        </CaptureContextPanel>
      ) : null}

      {!hasActiveCapture && selectedProject ? (
        <CaptureContextPanel>
          <p className="captureMode">Automatic click capture</p>
          <p className="captureHelp">
            Clicks on supported pages create ordered screenshot-backed steps.
          </p>
          <p className="captureHelp">
            Manual screenshots remain available after capture starts.
          </p>
          <p className="captureProject">
            {selectedProjectVersion
              ? projectContextLabel(selectedProject, selectedProjectVersion)
              : `${selectedProject.name} / Version unavailable`}
          </p>
          {!selectedProjectVersion ? (
            <div className="error">
              The selected Project Version is archived or unavailable. Select an
              active Version before starting.
            </div>
          ) : null}
          {startError ? <div className="error">{startError}</div> : null}
          {finishError ? <div className="error">{finishError}</div> : null}
          <Button
            disabled={busy || !selectedProjectVersion}
            onClick={() => void handleStartCapture()}
          >
            {starting ? "Starting..." : "Start automatic capture"}
          </Button>
        </CaptureContextPanel>
      ) : null}

      {!hasActiveCapture && projects.length === 0 ? (
        <div className="state">No projects yet.</div>
      ) : null}

      {!hasActiveCapture && projects.length > 0 ? (
        <div className="projects">
          {selectionError ? (
            <div className="error">{selectionError}</div>
          ) : null}
          <label className="field" htmlFor="project-select">
            <span>Project</span>
            <select
              id="project-select"
              value={selectedProjectId ?? ""}
              disabled={busy}
              onChange={(event) => void handleSelectProject(event.target.value)}
            >
              <option value="" disabled>
                Select a Project
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          {selectedProject ? (
            <label className="field" htmlFor="project-version-select">
              <span>Project Version</span>
              <select
                id="project-version-select"
                value={selectedProjectVersionId ?? ""}
                disabled={busy || projectVersions.length === 0}
                onChange={(event) =>
                  void handleSelectVersion(event.target.value)
                }
              >
                <option value="" disabled>
                  Select a Project Version
                </option>
                {projectVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name}
                    {version.is_default ? " — Default" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
