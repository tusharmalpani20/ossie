import {
  ApiClientError,
  type CreateCaptureSessionInput,
  type Project,
} from "../lib/api";
import type { CurrentTabSnapshot } from "../lib/current-tab";
import type { ManualCaptureDiagnostic } from "../lib/settings";

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError ? error.message : fallback;

export const projectContextLabel = (project: Project) =>
  `${project.name} / ${project.default_project_version.name}`;

export const persistManualCaptureDiagnostic = async (
  saveManualCaptureDiagnostic: (
    diagnostic: ManualCaptureDiagnostic | null,
  ) => Promise<void>,
  diagnostic: ManualCaptureDiagnostic,
) => {
  try {
    await saveManualCaptureDiagnostic(diagnostic);
  } catch {
    // Manual capture success/failure should not be hidden by diagnostic persistence failure.
  }
};

export const buildCaptureName = (input: {
  project: Project | null;
  tab: CurrentTabSnapshot;
}) => {
  const tabTitle = input.tab.title?.trim();

  if (tabTitle) {
    return `Capture from ${tabTitle}`;
  }

  const projectName = input.project?.name.trim();

  if (projectName) {
    return `Capture from ${projectName}`;
  }

  return "Extension capture";
};

export const browserNameFromUserAgent = (userAgent: string | null) => {
  if (!userAgent) {
    return null;
  }

  return userAgent.includes("Chrome") ? "Chrome" : null;
};

export const buildCaptureSessionInput = (input: {
  project: Project | null;
  tab: CurrentTabSnapshot;
  userAgent?: string | null;
}): Omit<CreateCaptureSessionInput, "project_version_id"> => {
  const userAgent = Object.hasOwn(input, "userAgent")
    ? (input.userAgent ?? null)
    : typeof navigator === "undefined"
      ? null
      : navigator.userAgent;

  return {
    name: buildCaptureName(input),
    source_type: "extension",
    start_url: input.tab.url,
    browser_name: browserNameFromUserAgent(userAgent),
    user_agent: userAgent,
    metadata: {
      extension_version: "0.1.0",
      tab_title: input.tab.title,
    },
  };
};

export const screenshotFileName = (capturedAt: string) =>
  `screenshot-${capturedAt.replace(/[:.]/g, "-")}.png`;
