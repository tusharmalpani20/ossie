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
import { PortalSettingsPanel } from "./PortalSettingsPanel";
import { PopupSelect } from "./PopupSelect";

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
  activeCaptureEventIndex,
  portalUrl,
  completionRecoveryPending,
  localRecoveryMessage,
  automaticCaptureDiagnostic,
  manualCaptureDiagnostic,
  onSelect,
  onSelectVersion,
  onStartCapture,
  onRetryActiveCaptureSave,
  onRetryActiveCapture,
  onSetActiveCaptureMode,
  onDiscardActiveCapture,
  onCaptureScreenshot,
  onFinishCapture,
  onOpenActiveCapture,
  onChangeInstance,
  onSignOut,
  onClearLocalSession,
  onSavePortalUrl,
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
  activeCaptureEventIndex: number | null;
  portalUrl: string | null;
  completionRecoveryPending: boolean;
  localRecoveryMessage: string | null;
  automaticCaptureDiagnostic: ExtensionSettings["automaticCaptureDiagnostic"];
  manualCaptureDiagnostic: ExtensionSettings["manualCaptureDiagnostic"];
  onSelect: (projectId: string) => Promise<void>;
  onSelectVersion: (projectVersionId: string) => Promise<void>;
  onStartCapture: (projectId: string) => Promise<void>;
  onRetryActiveCaptureSave: () => Promise<void>;
  onRetryActiveCapture: () => void;
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
  onClearLocalSession: () => Promise<void>;
  onSavePortalUrl: (portalUrl: string | null) => Promise<void>;
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
  const [remoteSignOutUnknown, setRemoteSignOutUnknown] = useState(false);
  const [confirmingInstanceChange, setConfirmingInstanceChange] =
    useState(false);
  const [editingPortalUrl, setEditingPortalUrl] = useState(false);
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
  const captureMutationAllowed =
    activeCaptureWritable &&
    !completionRecoveryPending &&
    !localRecoveryMessage;
  const finishAllowed = completionRecoveryPending || activeCaptureWritable;
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

  const handleSignOut = async () => {
    setAccountError(null);
    setRemoteSignOutUnknown(false);
    try {
      await onSignOut();
    } catch (error: unknown) {
      setAccountError(errorMessage(error, "Could not sign out."));
      setRemoteSignOutUnknown(true);
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
            onClick={() => setEditingPortalUrl(true)}
          >
            Portal settings
          </Button>
          <Button
            variant="secondary"
            className="secondary"
            disabled={busy}
            onClick={() => {
              if (hasActiveCapture) {
                setConfirmingInstanceChange(true);
                return;
              }
              void handleAccountAction(
                onChangeInstance,
                "Could not change instance.",
              );
            }}
          >
            Change instance
          </Button>
          <Button
            variant="secondary"
            className="secondary"
            disabled={busy}
            onClick={() => void handleSignOut()}
          >
            Sign out
          </Button>
        </div>
      </div>
      {editingPortalUrl ? (
        <PortalSettingsPanel
          portalUrl={portalUrl}
          onCancel={() => setEditingPortalUrl(false)}
          onSave={async (nextPortalUrl) => {
            await onSavePortalUrl(nextPortalUrl);
            setEditingPortalUrl(false);
          }}
        />
      ) : null}
      {accountError ? (
        <div className="error" role="alert">
          {accountError}
        </div>
      ) : null}
      {remoteSignOutUnknown ? (
        <Button
          variant="secondary"
          className="secondary"
          disabled={busy}
          onClick={() =>
            void handleAccountAction(
              onClearLocalSession,
              "Could not clear the local session.",
            )
          }
        >
          Clear local session
        </Button>
      ) : null}
      {confirmingInstanceChange ? (
        <div
          className="confirmation"
          role="group"
          aria-label="Confirm instance change"
        >
          <p>
            Changing instance signs out and clears local capture context. The
            server Capture Session is not completed or deleted.
          </p>
          <Button
            variant="secondary"
            className="secondary"
            onClick={() => setConfirmingInstanceChange(false)}
          >
            Keep current instance
          </Button>
          <Button
            autoFocus
            onClick={() =>
              void handleAccountAction(
                onChangeInstance,
                "Could not change instance.",
              )
            }
          >
            Change instance anyway
          </Button>
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
              This Project Version is archived. Restore it before capturing or
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
            <>
              <div className="error" role="alert">
                Capture steps could not be reconciled. Reopen or retry the
                extension before capturing or finishing.
              </div>
              <Button
                variant="secondary"
                className="secondary"
                disabled={busy}
                onClick={onRetryActiveCapture}
              >
                Retry reconciliation
              </Button>
            </>
          ) : null}
          <CaptureStatusPanel>
            <p className="captureSession">Session {activeCaptureSessionId}</p>
            <p className="captureSession">
              {activeCaptureEventIndex ?? 0} captured{" "}
              {(activeCaptureEventIndex ?? 0) === 1 ? "step" : "steps"}
            </p>
            {activeCaptureSessionStatus ? (
              <p className="captureSession">
                Capture Session status:{" "}
                {activeCaptureSessionStatus[0]?.toUpperCase()}
                {activeCaptureSessionStatus.slice(1)}
              </p>
            ) : null}
            {localRecoveryMessage ? (
              <div className="error" role="alert">
                {localRecoveryMessage}
              </div>
            ) : null}
            {localRecoveryMessage ? (
              <Button
                variant="secondary"
                className="secondary"
                disabled={busy}
                onClick={() =>
                  void handleAccountAction(
                    onRetryActiveCaptureSave,
                    "Could not save local recovery.",
                  )
                }
              >
                Retry saving local recovery
              </Button>
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
                disabled={busy || !captureMutationAllowed}
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
              disabled={busy || !captureMutationAllowed}
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
              disabled={busy || !finishAllowed}
              onClick={() => void handleFinishCapture()}
            >
              {finishing
                ? "Finishing..."
                : completionRecoveryPending
                  ? "Retry completion recovery"
                  : "Finish and open portal"}
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
              active Project Version before starting.
            </div>
          ) : null}
          {startError ? <div className="error">{startError}</div> : null}
          {finishError ? <div className="error">{finishError}</div> : null}
          <Button
            disabled={busy || !selectedProjectVersion}
            onClick={() => void handleStartCapture()}
          >
            {starting ? "Starting..." : "Start capture"}
          </Button>
        </CaptureContextPanel>
      ) : null}

      {!hasActiveCapture && projects.length === 0 ? (
        <div className="state">No capture-capable Projects are available.</div>
      ) : null}

      {!hasActiveCapture && projects.length > 0 ? (
        <div className="projects">
          {selectionError ? (
            <div className="error">{selectionError}</div>
          ) : null}
          <PopupSelect
            label="Project"
            listboxLabel="Projects"
            groupLabel="Projects"
            placeholder="Select a Project"
            value={selectedProjectId}
            options={projects.map((project) => ({
              value: project.id,
              label: project.name,
            }))}
            disabled={busy}
            onChange={(projectId) => void handleSelectProject(projectId)}
          />
          {selectedProject ? (
            <PopupSelect
              label="Project Version"
              listboxLabel="Project Versions"
              groupLabel="Active versions"
              placeholder="Select a Project Version"
              value={selectedProjectVersionId}
              options={projectVersions.map((version) => ({
                value: version.id,
                label: version.name,
                ...(version.is_default
                  ? { secondaryLabel: "Default" }
                  : {}),
              }))}
              disabled={busy || projectVersions.length === 0}
              onChange={(projectVersionId) =>
                void handleSelectVersion(projectVersionId)
              }
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
