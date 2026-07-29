import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import {
  ApiClientError,
  completeCaptureSession,
  createCaptureSession,
  getCaptureSession,
  getCurrentAuth,
  listProjectVersions,
  listProjects,
  listCaptureEvents,
  login,
  logout,
  type AuthResponse,
  type CaptureEventListResponse,
  type CaptureSessionResponse,
  type CompleteCaptureSessionResponse,
  type CreateCaptureSessionInput,
  type LoginResponse,
  type Project,
  type ProjectListResponse,
  type ProjectVersionListResponse,
} from "./lib/api";
import {
  getCurrentTabSnapshot,
  type CurrentTabSnapshot,
} from "./lib/current-tab";
import { openPortalUrl } from "./lib/navigation";
import {
  chromeLocalStorage,
  clearActiveCapture,
  clearSettings,
  emptySettings,
  getSettings,
  saveActiveCapture,
  saveActiveCaptureVersionContext,
  saveActiveCaptureEventIndex,
  saveAutomaticCaptureDiagnostic,
  saveInstanceUrl,
  saveManualCaptureDiagnostic,
  savePortalUrl,
  saveSelectedProjectId,
  saveSessionToken,
  subscribeToSettingsChanges,
  type AutomaticCaptureDiagnostic,
  type ExtensionSettings,
  type ExtensionStorageArea,
  type ManualCaptureDiagnostic,
} from "./lib/settings";
import { buildPortalCaptureSessionUrl } from "./lib/url";
import {
  sendCaptureCommand,
  type CaptureCommand,
  type CaptureCommandResult,
} from "./lib/capture-command";
import { loadSignedInBootstrap } from "./lib/popup-bootstrap";
import { buildCaptureSessionInput, errorMessage } from "./popup/helpers";
import { CaptureWorkspace } from "./popup/CaptureWorkspace";
import { ConnectInstancePanel } from "./popup/ConnectInstancePanel";
import { PopupShell } from "./popup/PopupShell";
import { SignInPanel } from "./popup/SignInPanel";
import "./index.css";

type Dependencies = {
  getSettings: () => Promise<ExtensionSettings>;
  subscribeToSettingsChanges: (onChange: () => void) => () => void;
  saveInstanceUrl: (instanceUrl: string) => Promise<void>;
  savePortalUrl: (portalUrl: string | null) => Promise<void>;
  saveSessionToken: (sessionToken: string | null) => Promise<void>;
  saveSelectedProjectId: (
    projectId: string | null,
    version?: {
      id: string;
      slug: string;
      name: string;
      status?: "active" | "archived";
      position?: number;
    } | null,
  ) => Promise<void>;
  saveActiveCapture: (input: {
    captureSessionId: string;
    projectId: string;
    projectVersionId: string;
    projectVersionSlug: string;
    projectVersionName: string;
    eventIndex?: number;
    mode?: "manual" | "automatic";
  }) => Promise<void>;
  saveActiveCaptureVersionContext: (input: {
    captureSessionId: string;
    projectId: string;
    projectVersionId: string;
    projectVersionSlug: string;
    projectVersionName: string;
  }) => Promise<void>;
  saveActiveCaptureEventIndex: (eventIndex: number | null) => Promise<void>;
  saveAutomaticCaptureDiagnostic: (
    diagnostic: AutomaticCaptureDiagnostic | null,
  ) => Promise<void>;
  saveManualCaptureDiagnostic: (
    diagnostic: ManualCaptureDiagnostic | null,
  ) => Promise<void>;
  clearActiveCapture: () => Promise<void>;
  clearSettings: () => Promise<void>;
  getCurrentAuth: (
    instanceUrl: string,
    sessionToken: string,
  ) => Promise<AuthResponse>;
  login: (
    instanceUrl: string,
    data: { email: string; password: string },
  ) => Promise<LoginResponse>;
  listProjects: (
    instanceUrl: string,
    sessionToken: string,
  ) => Promise<ProjectListResponse>;
  listProjectVersions: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
  ) => Promise<ProjectVersionListResponse>;
  getCaptureSession: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
    captureSessionId: string,
  ) => Promise<CaptureSessionResponse>;
  listCaptureEvents: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
    captureSessionId: string,
  ) => Promise<CaptureEventListResponse>;
  sendCaptureCommand: (
    command: CaptureCommand,
  ) => Promise<CaptureCommandResult>;
  createCaptureSession: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
    data: CreateCaptureSessionInput,
  ) => Promise<CaptureSessionResponse>;
  getCurrentTabSnapshot: () => Promise<CurrentTabSnapshot>;
  completeCaptureSession: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
    captureSessionId: string,
  ) => Promise<CompleteCaptureSessionResponse>;
  openPortalUrl: (url: string) => Promise<void>;
  logout: (instanceUrl: string, sessionToken: string) => Promise<void>;
};

type AppProps = {
  dependencies?: Partial<Dependencies>;
};

type ViewState =
  | { status: "loading" }
  | { status: "unconfigured"; settings: ExtensionSettings }
  | { status: "signed_out"; settings: ExtensionSettings }
  | {
      status: "signed_in";
      settings: ExtensionSettings & {
        instanceUrl: string;
        sessionToken: string;
      };
      auth: AuthResponse["auth"];
      projects: Project[];
      projectVersions: ProjectVersionListResponse["project_versions"];
      activeCaptureContextAvailable: boolean;
      activeCaptureProjectVersionStatus: "active" | "archived" | null;
      activeCaptureSessionStatus:
        | CaptureSessionResponse["capture_session"]["status"]
        | null;
      activeCaptureIndexReconciled: boolean;
    }
  | { status: "error"; settings: ExtensionSettings; message: string };

const buildDefaultDependencies = (): Dependencies => {
  const storage: ExtensionStorageArea = chromeLocalStorage();

  return {
    getSettings: () => getSettings(storage),
    subscribeToSettingsChanges,
    saveInstanceUrl: (instanceUrl) => saveInstanceUrl(storage, instanceUrl),
    savePortalUrl: (portalUrl) => savePortalUrl(storage, portalUrl),
    saveSessionToken: (sessionToken) => saveSessionToken(storage, sessionToken),
    saveSelectedProjectId: (projectId, version) =>
      saveSelectedProjectId(storage, projectId, version),
    saveActiveCapture: (input) => saveActiveCapture(storage, input),
    saveActiveCaptureVersionContext: (input) =>
      saveActiveCaptureVersionContext(storage, input),
    saveActiveCaptureEventIndex: (eventIndex) =>
      saveActiveCaptureEventIndex(storage, eventIndex),
    saveAutomaticCaptureDiagnostic: (diagnostic) =>
      saveAutomaticCaptureDiagnostic(storage, diagnostic ?? null),
    saveManualCaptureDiagnostic: (diagnostic) =>
      saveManualCaptureDiagnostic(storage, diagnostic ?? null),
    clearActiveCapture: () => clearActiveCapture(storage),
    clearSettings: () => clearSettings(storage),
    getCurrentAuth,
    login,
    listProjects,
    listProjectVersions,
    getCaptureSession,
    listCaptureEvents,
    sendCaptureCommand,
    createCaptureSession,
    getCurrentTabSnapshot,
    completeCaptureSession,
    openPortalUrl,
    logout,
  };
};

export const App = ({ dependencies: dependencyOverrides }: AppProps) => {
  const dependencies = useMemo<Dependencies>(
    () => ({
      ...buildDefaultDependencies(),
      ...(dependencyOverrides ?? {}),
    }),
    [dependencyOverrides],
  );
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [completedHandoff, setCompletedHandoff] = useState<{
    captureSessionId: string;
    portalUrl: string;
  } | null>(null);
  const [localRecoveryMessage, setLocalRecoveryMessage] = useState<
    string | null
  >(null);
  const [pendingActiveCaptureSave, setPendingActiveCaptureSave] = useState<
    Parameters<Dependencies["saveActiveCapture"]>[0] | null
  >(null);
  const preserveInMemoryCaptureRef = useRef(false);

  useEffect(
    () =>
      dependencies.subscribeToSettingsChanges(() => {
        void dependencies
          .getSettings()
          .then((settings) => {
            setState((current) => {
              if (
                current.status !== "signed_in" ||
                settings.instanceUrl !== current.settings.instanceUrl ||
                settings.sessionToken !== current.settings.sessionToken
              ) {
                setReloadKey((key) => key + 1);
                return current;
              }

              return {
                ...current,
                activeCaptureIndexReconciled:
                  preserveInMemoryCaptureRef.current ||
                  !settings.activeCaptureSessionId ||
                  settings.activeCaptureEventIndex !== null,
                settings: {
                  ...current.settings,
                  ...(preserveInMemoryCaptureRef.current
                    ? {}
                    : {
                        activeCaptureSessionId: settings.activeCaptureSessionId,
                        activeCaptureProjectId: settings.activeCaptureProjectId,
                        activeCaptureProjectVersionId:
                          settings.activeCaptureProjectVersionId,
                        activeCaptureProjectVersionSlug:
                          settings.activeCaptureProjectVersionSlug,
                        activeCaptureProjectVersionName:
                          settings.activeCaptureProjectVersionName,
                        activeCaptureEventIndex:
                          settings.activeCaptureEventIndex,
                        activeCaptureMode: settings.activeCaptureMode,
                        activeCapturePaused: settings.activeCapturePaused,
                      }),
                  automaticCaptureDiagnostic:
                    settings.automaticCaptureDiagnostic,
                  manualCaptureDiagnostic: settings.manualCaptureDiagnostic,
                },
              };
            });
          })
          .catch(() => {
            // A later storage event or popup reopen will retry live settings.
          });
      }),
    [dependencies],
  );

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    const load = async () => {
      const settings = await dependencies.getSettings();

      if (!settings.instanceUrl) {
        if (active) {
          setState({ status: "unconfigured", settings });
        }
        return;
      }

      if (!settings.sessionToken) {
        if (active) {
          setState({ status: "signed_out", settings });
        }
        return;
      }

      try {
        const needsReconciliationAcknowledgement = Boolean(
          settings.activeCaptureSessionId &&
          settings.activeCaptureProjectId &&
          settings.activeCaptureEventIndex === null,
        );
        const bootstrap = await loadSignedInBootstrap(
          {
            ...settings,
            instanceUrl: settings.instanceUrl,
            sessionToken: settings.sessionToken,
          },
          dependencies,
        );
        if (
          needsReconciliationAcknowledgement &&
          bootstrap.activeCaptureIndexReconciled
        ) {
          const acknowledgement = await dependencies.sendCaptureCommand({
            type: "ossie:capture_command",
            action: "acknowledge_reconciliation",
          });
          if (!acknowledgement.ok) {
            bootstrap.activeCaptureIndexReconciled = false;
          }
        }

        if (active) {
          setState({
            status: "signed_in",
            settings: {
              ...bootstrap.settings,
              instanceUrl: settings.instanceUrl,
              sessionToken: settings.sessionToken,
            },
            auth: bootstrap.auth,
            projects: bootstrap.projects,
            projectVersions: bootstrap.projectVersions,
            activeCaptureContextAvailable:
              bootstrap.activeCaptureContextAvailable,
            activeCaptureProjectVersionStatus:
              bootstrap.activeCaptureProjectVersionStatus,
            activeCaptureSessionStatus: bootstrap.activeCaptureSessionStatus,
            activeCaptureIndexReconciled:
              bootstrap.activeCaptureIndexReconciled,
          });
        }
      } catch (error: unknown) {
        if (
          error instanceof ApiClientError &&
          error.type === "unauthenticated"
        ) {
          await dependencies.saveSessionToken(null);

          if (active) {
            setState({
              status: "signed_out",
              settings: {
                ...settings,
                sessionToken: null,
                activeCaptureSessionId: null,
                activeCaptureProjectId: null,
                activeCaptureEventIndex: null,
                activeCaptureMode: null,
                activeCapturePaused: false,
              },
            });
          }
          return;
        }

        if (active) {
          setState({
            status: "error",
            settings,
            message: errorMessage(error, "Could not load projects."),
          });
        }
      }
    };

    load().catch((error: unknown) => {
      if (active) {
        setState({
          status: "error",
          settings: emptySettings(),
          message: errorMessage(error, "Could not load extension settings."),
        });
      }
    });

    return () => {
      active = false;
    };
  }, [dependencies, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);
  const requireCaptureCommand = async (command: CaptureCommand) => {
    const result = await dependencies.sendCaptureCommand(command);
    if (!result.ok) {
      throw new ApiClientError({
        status: 0,
        type: result.reason,
        message: result.message,
      });
    }
    return result;
  };
  const restoreCaptureMode = async (settings: ExtensionSettings) => {
    if (!settings.activeCaptureMode) return;
    try {
      await requireCaptureCommand({
        type: "ossie:capture_command",
        action: "set_mode",
        mode: settings.activeCaptureMode,
        paused: settings.activeCapturePaused,
      });
    } catch {
      // Keep the original transition failure as the actionable error.
    }
  };

  if (state.status === "loading") {
    return (
      <PopupShell>
        <div className="state" role="status" aria-live="polite">
          Loading extension
        </div>
      </PopupShell>
    );
  }

  if (state.status === "unconfigured") {
    return (
      <PopupShell>
        <ConnectInstancePanel
          onSave={async (instanceUrl) => {
            await dependencies.saveInstanceUrl(instanceUrl.instanceUrl);
            if (instanceUrl.portalUrl) {
              await dependencies.savePortalUrl(instanceUrl.portalUrl);
            }
            reload();
          }}
        />
      </PopupShell>
    );
  }

  if (state.status === "signed_out") {
    return (
      <PopupShell>
        <SignInPanel
          instanceUrl={state.settings.instanceUrl ?? ""}
          onChangeInstance={async () => {
            await dependencies.clearSettings();
            reload();
          }}
          onSignIn={async (data) => {
            const result = await dependencies.login(
              state.settings.instanceUrl ?? "",
              data,
            );
            await dependencies.saveSessionToken(result.session_token);
            const projectResponse = await dependencies.listProjects(
              state.settings.instanceUrl ?? "",
              result.session_token,
            );
            setState({
              status: "signed_in",
              settings: {
                instanceUrl: state.settings.instanceUrl ?? "",
                portalUrl: state.settings.portalUrl ?? null,
                sessionToken: result.session_token,
                selectedProjectId: null,
                activeCaptureSessionId: null,
                activeCaptureProjectId: null,
                activeCaptureEventIndex: null,
                activeCaptureMode: null,
                activeCapturePaused: false,
              },
              auth: result.auth,
              projects: projectResponse.projects,
              projectVersions: [],
              activeCaptureContextAvailable: true,
              activeCaptureProjectVersionStatus: null,
              activeCaptureSessionStatus: null,
              activeCaptureIndexReconciled: true,
            });
          }}
        />
      </PopupShell>
    );
  }

  if (state.status === "error") {
    return (
      <PopupShell>
        <div className="panel">
          <h1>Connection issue</h1>
          <p className="error">{state.message}</p>
          <div className="actions">
            <Button onClick={reload}>Retry</Button>
            <Button
              className="secondary"
              variant="secondary"
              onClick={async () => {
                await dependencies.clearSettings();
                reload();
              }}
            >
              Change instance
            </Button>
          </div>
        </div>
      </PopupShell>
    );
  }

  return (
    <PopupShell>
      <CaptureWorkspace
        auth={state.auth}
        projects={state.projects}
        projectVersions={state.projectVersions}
        selectedProjectId={state.settings.selectedProjectId}
        selectedProjectVersionId={
          state.settings.selectedProjectVersionId ?? null
        }
        activeCaptureSessionId={state.settings.activeCaptureSessionId}
        activeCaptureProjectId={state.settings.activeCaptureProjectId}
        activeCaptureProjectVersionName={
          state.settings.activeCaptureProjectVersionName ?? null
        }
        activeCaptureProjectVersionSlug={
          state.settings.activeCaptureProjectVersionSlug ?? null
        }
        activeCaptureContextAvailable={state.activeCaptureContextAvailable}
        activeCaptureProjectVersionStatus={
          state.activeCaptureProjectVersionStatus
        }
        activeCaptureSessionStatus={state.activeCaptureSessionStatus}
        activeCaptureIndexReconciled={state.activeCaptureIndexReconciled}
        activeCaptureMode={state.settings.activeCaptureMode}
        activeCapturePaused={state.settings.activeCapturePaused}
        activeCaptureEventIndex={state.settings.activeCaptureEventIndex}
        portalUrl={state.settings.portalUrl ?? null}
        completionRecoveryPending={Boolean(completedHandoff)}
        localRecoveryMessage={localRecoveryMessage}
        automaticCaptureDiagnostic={
          state.settings.automaticCaptureDiagnostic ?? null
        }
        manualCaptureDiagnostic={state.settings.manualCaptureDiagnostic ?? null}
        onSelect={async (projectId) => {
          const selected = state.projects.find(
            (project) => project.id === projectId,
          );
          if (!selected) return;
          const response = await dependencies.listProjectVersions(
            state.settings.instanceUrl,
            state.settings.sessionToken,
            projectId,
          );
          const selectedVersion = response.project_versions.find(
            (version) => version.id === selected.default_project_version.id,
          );
          if (!selectedVersion) {
            throw new ApiClientError({
              status: 409,
              type: "project_version_conflict",
              message:
                "The Default Project Version is not available for capture.",
            });
          }
          await dependencies.saveSelectedProjectId(projectId, {
            id: selectedVersion.id,
            name: selectedVersion.name,
            slug: selectedVersion.slug,
            status: selectedVersion.status,
            position: selectedVersion.position,
          });
          setState({
            ...state,
            projectVersions: response.project_versions,
            settings: {
              ...state.settings,
              selectedProjectId: projectId,
              selectedProjectVersionId: selectedVersion.id,
              selectedProjectVersionSlug: selectedVersion.slug,
              selectedProjectVersionName: selectedVersion.name,
            },
          });
        }}
        onSelectVersion={async (projectVersionId) => {
          const selectedVersion = state.projectVersions.find(
            (version) => version.id === projectVersionId,
          );
          if (!state.settings.selectedProjectId || !selectedVersion) return;
          await dependencies.saveSelectedProjectId(
            state.settings.selectedProjectId,
            {
              id: selectedVersion.id,
              name: selectedVersion.name,
              slug: selectedVersion.slug,
              status: selectedVersion.status,
              position: selectedVersion.position,
            },
          );
          setState({
            ...state,
            settings: {
              ...state.settings,
              selectedProjectVersionId: selectedVersion.id,
              selectedProjectVersionSlug: selectedVersion.slug,
              selectedProjectVersionName: selectedVersion.name,
            },
          });
        }}
        onStartCapture={async (projectId) => {
          const selectedProject =
            state.projects.find((project) => project.id === projectId) ?? null;
          if (!selectedProject)
            throw new Error("Select an available project before capturing.");
          const selectedVersionId =
            state.settings.selectedProjectId === projectId
              ? state.settings.selectedProjectVersionId
              : null;
          if (!selectedVersionId)
            throw new Error(
              "Select an active Project Version before capturing.",
            );
          const tab = await dependencies.getCurrentTabSnapshot();
          const result = await dependencies.createCaptureSession(
            state.settings.instanceUrl,
            state.settings.sessionToken,
            projectId,
            {
              ...buildCaptureSessionInput({ project: selectedProject, tab }),
              project_version_id: selectedVersionId,
            },
          );
          const activeSettings = {
            ...state.settings,
            activeCaptureSessionId: result.capture_session.id,
            activeCaptureProjectId: projectId,
            activeCaptureProjectVersionId:
              result.capture_session.project_version.id,
            activeCaptureProjectVersionSlug:
              result.capture_session.project_version.slug,
            activeCaptureProjectVersionName:
              result.capture_session.project_version.name,
            activeCaptureEventIndex: 0,
            activeCaptureMode: "automatic" as const,
            activeCapturePaused: false,
          };
          const pendingSave = {
            captureSessionId: result.capture_session.id,
            projectId,
            projectVersionId: result.capture_session.project_version.id,
            projectVersionSlug: result.capture_session.project_version.slug,
            projectVersionName: result.capture_session.project_version.name,
            eventIndex: 0,
            mode: "automatic" as const,
          };
          setState({
            ...state,
            settings: activeSettings,
            activeCaptureContextAvailable: true,
            activeCaptureProjectVersionStatus:
              result.capture_session.project_version.status,
            activeCaptureSessionStatus: result.capture_session.status,
            activeCaptureIndexReconciled: true,
          });
          setLocalRecoveryMessage(null);
          setPendingActiveCaptureSave(null);

          try {
            await dependencies.saveActiveCapture(pendingSave);
            preserveInMemoryCaptureRef.current = false;
          } catch {
            preserveInMemoryCaptureRef.current = true;
            setPendingActiveCaptureSave(pendingSave);
            setLocalRecoveryMessage(
              "The Capture Session started, but local recovery could not be saved. Keep this popup open and finish or open the session.",
            );
            setState({
              ...state,
              settings: activeSettings,
              activeCaptureContextAvailable: true,
              activeCaptureProjectVersionStatus:
                result.capture_session.project_version.status,
              activeCaptureSessionStatus: result.capture_session.status,
              activeCaptureIndexReconciled: true,
            });
          }
        }}
        onRetryActiveCaptureSave={async () => {
          if (!pendingActiveCaptureSave) return;
          await dependencies.saveActiveCapture(pendingActiveCaptureSave);
          preserveInMemoryCaptureRef.current = false;
          setPendingActiveCaptureSave(null);
          setLocalRecoveryMessage(null);
        }}
        onRetryActiveCapture={reload}
        onSetActiveCaptureMode={async (input) => {
          await requireCaptureCommand({
            type: "ossie:capture_command",
            action: "set_mode",
            ...input,
          });
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureMode: input.mode,
              activeCapturePaused: input.paused,
            },
          });
        }}
        onDiscardActiveCapture={async () => {
          await requireCaptureCommand({
            type: "ossie:capture_command",
            action: "quiesce",
            transition: "clear",
          });
          try {
            await dependencies.clearActiveCapture();
          } catch (error: unknown) {
            await restoreCaptureMode(state.settings);
            throw error;
          }
          preserveInMemoryCaptureRef.current = false;
          setCompletedHandoff(null);
          setPendingActiveCaptureSave(null);
          setLocalRecoveryMessage(null);
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureSessionId: null,
              activeCaptureProjectId: null,
              activeCaptureEventIndex: null,
              activeCaptureMode: null,
              activeCapturePaused: false,
            },
          });
        }}
        onCaptureScreenshot={async () => {
          const result = await dependencies.sendCaptureCommand({
            type: "ossie:capture_command",
            action: "capture_manual",
          });
          if (!result.ok) {
            throw new ApiClientError({
              status: 0,
              type: result.reason,
              message: result.message,
            });
          }
          if (result.event_index === undefined) {
            throw new ApiClientError({
              status: 0,
              type: "capture_failed",
              message: "The Capture Event was not confirmed. Retry manually.",
            });
          }
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureEventIndex: result.event_index,
            },
          });
          return { event_index: result.event_index };
        }}
        onFinishCapture={async (input) => {
          await requireCaptureCommand({
            type: "ossie:capture_command",
            action: "quiesce",
            transition: "finish",
          });
          const activeVersionSlug =
            state.settings.activeCaptureProjectVersionSlug;
          if (!activeVersionSlug)
            throw new ApiClientError({
              status: 409,
              type: "project_version_context_unavailable",
              message: "Project Version context is unavailable.",
            });
          let portalUrl =
            completedHandoff?.captureSessionId === input.captureSessionId
              ? completedHandoff.portalUrl
              : null;
          if (!portalUrl) {
            let result: CompleteCaptureSessionResponse;
            try {
              result = await dependencies.completeCaptureSession(
                state.settings.instanceUrl,
                state.settings.sessionToken,
                input.projectId,
                input.captureSessionId,
              );
            } catch (error: unknown) {
              await restoreCaptureMode(state.settings);
              throw error;
            }
            portalUrl = buildPortalCaptureSessionUrl(
              state.settings.instanceUrl,
              state.settings.portalUrl,
              result.redirect.path,
              input.projectId,
              activeVersionSlug,
              input.captureSessionId,
            );
            const handoff = {
              captureSessionId: input.captureSessionId,
              portalUrl,
            };
            preserveInMemoryCaptureRef.current = true;
            setCompletedHandoff(handoff);
          }

          try {
            await dependencies.clearActiveCapture();
          } catch {
            throw new ApiClientError({
              status: 0,
              type: "local_capture_clear_failed",
              message:
                "Capture completed, but local recovery could not be cleared. Retry to clear and open it; completion will not repeat.",
            });
          }
          try {
            await dependencies.openPortalUrl(portalUrl);
          } catch {
            throw new ApiClientError({
              status: 0,
              type: "portal_open_failed",
              message:
                "Capture completed, but the portal could not open. Retry to open it; completion will not repeat.",
            });
          }
          preserveInMemoryCaptureRef.current = false;
          setCompletedHandoff(null);
          setLocalRecoveryMessage(null);
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureSessionId: null,
              activeCaptureProjectId: null,
              activeCaptureEventIndex: null,
              activeCaptureMode: null,
              activeCapturePaused: false,
            },
          });
        }}
        onOpenActiveCapture={async (input) => {
          const activeVersionSlug =
            state.settings.activeCaptureProjectVersionSlug;
          if (!activeVersionSlug)
            throw new ApiClientError({
              status: 409,
              type: "project_version_context_unavailable",
              message: "Project Version context is unavailable.",
            });
          const portalUrl = buildPortalCaptureSessionUrl(
            state.settings.instanceUrl,
            state.settings.portalUrl,
            null,
            input.projectId,
            activeVersionSlug,
            input.captureSessionId,
          );

          try {
            await dependencies.openPortalUrl(portalUrl);
          } catch {
            throw new ApiClientError({
              status: 0,
              type: "portal_open_failed",
              message: "Could not open capture in portal.",
            });
          }
        }}
        onChangeInstance={async () => {
          await requireCaptureCommand({
            type: "ossie:capture_command",
            action: "quiesce",
            transition: "change_instance",
          });
          try {
            await dependencies.clearSettings();
          } catch (error: unknown) {
            await restoreCaptureMode(state.settings);
            throw error;
          }
          preserveInMemoryCaptureRef.current = false;
          setCompletedHandoff(null);
          setPendingActiveCaptureSave(null);
          setLocalRecoveryMessage(null);
          reload();
        }}
        onSignOut={async () => {
          await requireCaptureCommand({
            type: "ossie:capture_command",
            action: "quiesce",
            transition: "logout",
          });
          try {
            await dependencies.logout(
              state.settings.instanceUrl,
              state.settings.sessionToken,
            );
          } catch (error: unknown) {
            if (
              !(
                error instanceof ApiClientError &&
                (error.status === 401 || error.type === "unauthenticated")
              )
            ) {
              await restoreCaptureMode(state.settings);
              throw new ApiClientError({
                status: 0,
                type: "logout_remote_state_unknown",
                message:
                  "Could not confirm remote sign out. The remote session may still be active. Retry, or clear only this extension's local session.",
              });
            }
          }

          await dependencies.saveSessionToken(null);
          preserveInMemoryCaptureRef.current = false;
          setCompletedHandoff(null);
          setPendingActiveCaptureSave(null);
          setLocalRecoveryMessage(null);
          reload();
        }}
        onClearLocalSession={async () => {
          await requireCaptureCommand({
            type: "ossie:capture_command",
            action: "quiesce",
            transition: "logout",
          });
          await dependencies.saveSessionToken(null);
          preserveInMemoryCaptureRef.current = false;
          setCompletedHandoff(null);
          setPendingActiveCaptureSave(null);
          setLocalRecoveryMessage(null);
          reload();
        }}
        onSavePortalUrl={async (portalUrl) => {
          await dependencies.savePortalUrl(portalUrl);
          setState({
            ...state,
            settings: {
              ...state.settings,
              portalUrl,
            },
          });
        }}
      />
    </PopupShell>
  );
};
