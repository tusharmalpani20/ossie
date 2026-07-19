export type NormalizedInstanceUrlResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

const invalid_url_message = "Enter a valid http:// or https:// instance URL.";

export const normalizeInstanceUrl = (value: string): NormalizedInstanceUrlResult => {
  const trimmed = value.trim();

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return { ok: false, error: invalid_url_message };
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: invalid_url_message };
    }

    return {
      ok: true,
      value: url.toString().replace(/\/+$/, ""),
    };
  } catch {
    return { ok: false, error: invalid_url_message };
  }
};

const buildFallbackCaptureSessionPath = (
  projectId: string,
  versionSlug: string,
  captureSessionId: string
) => (
  `/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/capture-sessions/${encodeURIComponent(captureSessionId)}`
);

const safeRedirectPath = (
  redirectPath: string | null | undefined
) => {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return null;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(redirectPath)) {
    return null;
  }

  return redirectPath;
};

export const buildPortalCaptureSessionUrl = (
  instanceUrl: string,
  portalUrl: string | null | undefined,
  redirectPath: string | null | undefined,
  projectId: string,
  versionSlug: string,
  captureSessionId: string
) => {
  const origin = (portalUrl ?? instanceUrl).replace(/\/+$/, "");
  const safe = safeRedirectPath(redirectPath);
  const path = safe?.includes("/versions/") ? safe
    : buildFallbackCaptureSessionPath(projectId, versionSlug, captureSessionId);

  return `${origin}${path}`;
};
