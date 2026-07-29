import {
  ApiClientError,
  type AuthResponse,
  type CaptureEventListResponse,
  type CaptureSessionResponse,
  type Project,
  type ProjectListResponse,
  type ProjectVersionListResponse,
} from "./api";
import type {
  AutomaticCaptureDiagnostic,
  ExtensionSettings,
  ManualCaptureDiagnostic,
} from "./settings";

type BootstrapDependencies = {
  getCurrentAuth: (
    instanceUrl: string,
    sessionToken: string,
  ) => Promise<AuthResponse>;
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
  saveSelectedProjectId: (
    projectId: string | null,
    version?: { id: string; slug: string; name: string } | null,
  ) => Promise<void>;
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
};

export type SignedInBootstrapResult = {
  settings: ExtensionSettings;
  auth: AuthResponse["auth"];
  projects: Project[];
  projectVersions: ProjectVersionListResponse["project_versions"];
  activeCaptureContextAvailable: boolean;
  activeCaptureProjectVersionStatus: "active" | "archived" | null;
  activeCaptureSessionStatus:
    | CaptureSessionResponse["capture_session"]["status"]
    | null;
  activeCaptureIndexReconciled: boolean;
};

const interruptedDiagnostic = (
  kind: "automatic capture" | "manual screenshot",
  eventIndex: number,
) => ({
  status: "failed" as const,
  message: `The previous ${kind} was interrupted. Capture steps were reconciled; retry as a new action.`,
  eventIndex,
  occurredAt: new Date().toISOString(),
});

export const loadSignedInBootstrap = async (
  settings: ExtensionSettings & {
    instanceUrl: string;
    sessionToken: string;
  },
  dependencies: BootstrapDependencies,
): Promise<SignedInBootstrapResult> => {
  const [authResponse, projectResponse] = await Promise.all([
    dependencies.getCurrentAuth(settings.instanceUrl, settings.sessionToken),
    dependencies.listProjects(settings.instanceUrl, settings.sessionToken),
  ]);
  const selectedProjectExists = settings.selectedProjectId
    ? projectResponse.projects.some(
        (project) => project.id === settings.selectedProjectId,
      )
    : true;
  let nextSettings: ExtensionSettings = selectedProjectExists
    ? settings
    : {
        ...settings,
        selectedProjectId: null,
        selectedProjectVersionId: null,
        selectedProjectVersionSlug: null,
        selectedProjectVersionName: null,
      };
  let projectVersions: ProjectVersionListResponse["project_versions"] = [];
  let activeCaptureContextAvailable = !(
    settings.activeCaptureSessionId && settings.activeCaptureProjectId
  );
  let activeCaptureProjectVersionStatus: "active" | "archived" | null = null;
  let activeCaptureSessionStatus:
    | CaptureSessionResponse["capture_session"]["status"]
    | null = null;
  let activeCaptureIndexReconciled = true;

  if (!selectedProjectExists) {
    await dependencies.saveSelectedProjectId(null);
  }

  const selectedProject = nextSettings.selectedProjectId
    ? projectResponse.projects.find(
        (project) => project.id === nextSettings.selectedProjectId,
      )
    : null;
  if (selectedProject) {
    const versionResponse = await dependencies.listProjectVersions(
      settings.instanceUrl,
      settings.sessionToken,
      selectedProject.id,
    );
    projectVersions = versionResponse.project_versions;
    const selectedVersion = nextSettings.selectedProjectVersionId
      ? projectVersions.find(
          (version) => version.id === nextSettings.selectedProjectVersionId,
        )
      : projectVersions.find(
          (version) =>
            version.id === selectedProject.default_project_version.id,
        );

    if (selectedVersion) {
      nextSettings = {
        ...nextSettings,
        selectedProjectVersionId: selectedVersion.id,
        selectedProjectVersionSlug: selectedVersion.slug,
        selectedProjectVersionName: selectedVersion.name,
      };
      await dependencies.saveSelectedProjectId(selectedProject.id, {
        id: selectedVersion.id,
        slug: selectedVersion.slug,
        name: selectedVersion.name,
      });
    }
  }

  if (settings.activeCaptureSessionId && settings.activeCaptureProjectId) {
    try {
      const response = await dependencies.getCaptureSession(
        settings.instanceUrl,
        settings.sessionToken,
        settings.activeCaptureProjectId,
        settings.activeCaptureSessionId,
      );
      const session = response.capture_session;
      let highestEventIndex = settings.activeCaptureEventIndex ?? 0;
      try {
        const eventResponse = await dependencies.listCaptureEvents(
          settings.instanceUrl,
          settings.sessionToken,
          settings.activeCaptureProjectId,
          settings.activeCaptureSessionId,
        );
        highestEventIndex = eventResponse.capture_events.reduce(
          (highest, event) => Math.max(highest, event.event_index),
          0,
        );
      } catch (error: unknown) {
        if (
          error instanceof ApiClientError &&
          error.type === "unauthenticated"
        ) {
          throw error;
        }
        activeCaptureIndexReconciled = false;
      }
      activeCaptureContextAvailable = true;
      activeCaptureProjectVersionStatus = session.project_version.status;
      activeCaptureSessionStatus = session.status;
      nextSettings = {
        ...nextSettings,
        activeCaptureProjectId: session.project_id,
        activeCaptureProjectVersionId: session.project_version.id,
        activeCaptureProjectVersionSlug: session.project_version.slug,
        activeCaptureProjectVersionName: session.project_version.name,
        activeCaptureEventIndex: highestEventIndex,
      };
      await dependencies.saveActiveCaptureVersionContext({
        captureSessionId: session.id,
        projectId: session.project_id,
        projectVersionId: session.project_version.id,
        projectVersionSlug: session.project_version.slug,
        projectVersionName: session.project_version.name,
      });
      if (activeCaptureIndexReconciled) {
        try {
          await dependencies.saveActiveCaptureEventIndex(highestEventIndex);
        } catch {
          activeCaptureIndexReconciled = false;
        }
      }
      if (!activeCaptureIndexReconciled) {
        nextSettings = { ...nextSettings, activeCaptureEventIndex: null };
        try {
          await dependencies.saveActiveCaptureEventIndex(null);
        } catch {
          // The popup remains read-only even if storage is unavailable.
        }
      } else {
        if (nextSettings.automaticCaptureDiagnostic?.status === "saving") {
          const diagnostic = interruptedDiagnostic(
            "automatic capture",
            highestEventIndex,
          );
          await dependencies.saveAutomaticCaptureDiagnostic(diagnostic);
          nextSettings = {
            ...nextSettings,
            automaticCaptureDiagnostic: diagnostic,
          };
        }
        if (nextSettings.manualCaptureDiagnostic?.status === "saving") {
          const diagnostic = interruptedDiagnostic(
            "manual screenshot",
            highestEventIndex,
          );
          await dependencies.saveManualCaptureDiagnostic(diagnostic);
          nextSettings = {
            ...nextSettings,
            manualCaptureDiagnostic: diagnostic,
          };
        }
      }
    } catch (error: unknown) {
      if (
        error instanceof ApiClientError &&
        (error.status === 403 || error.status === 404)
      ) {
        activeCaptureContextAvailable = false;
      } else {
        throw error;
      }
    }
  }

  return {
    settings: nextSettings,
    auth: authResponse.auth,
    projects: projectResponse.projects,
    projectVersions,
    activeCaptureContextAvailable,
    activeCaptureProjectVersionStatus,
    activeCaptureSessionStatus,
    activeCaptureIndexReconciled,
  };
};
