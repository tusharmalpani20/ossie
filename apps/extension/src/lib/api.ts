import type {
  CaptureEventType,
  CaptureSessionSourceType,
} from "@repo/constants";
import type {
  CaptureAsset,
  CaptureAssetResponse,
  CaptureEvent,
  CaptureEventListResponse,
  CaptureEventResponse,
  CaptureSession,
  CaptureSessionResponse,
  CompleteCaptureSessionResponse,
} from "@repo/types/capture";
import type {
  AuthResponse,
  ExtensionLoginResponse,
  LoginRequest,
} from "@repo/types/auth";
import type { Project, ProjectListResponse } from "@repo/types/project";
import type { ProjectVersionListResponse } from "@repo/types/project-version";

export type {
  AuthResponse,
  CaptureAsset,
  CaptureAssetResponse,
  CaptureEvent,
  CaptureEventListResponse,
  CaptureEventResponse,
  CaptureSession,
  CaptureSessionResponse,
  CompleteCaptureSessionResponse,
  ExtensionLoginResponse as LoginResponse,
  LoginRequest,
  Project,
  ProjectListResponse,
  ProjectVersionListResponse,
};

export type CreateCaptureSessionInput = {
  name: string;
  project_version_id: string;
  description?: string | null;
  source_type: Extract<CaptureSessionSourceType, "extension">;
  start_immediately: true;
  start_url?: string | null;
  browser_name?: string | null;
  browser_version?: string | null;
  operating_system?: string | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
};

export type UploadCaptureAssetInput = {
  file: Blob;
  fileName: string;
  width?: number | null;
  height?: number | null;
  devicePixelRatio?: number | null;
  pageUrl?: string | null;
  pageTitle?: string | null;
  capturedAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type CreateCaptureEventInput = {
  event_type: Extract<CaptureEventType, "capture" | "click">;
  event_index: number;
  capture_asset_id: string;
  occurred_at?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_selector?: string | null;
  target_role?: string | null;
  target_test_id?: string | null;
  target_text?: string | null;
  client_x?: number | null;
  client_y?: number | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  input_value_redacted?: true;
  metadata?: Record<string, unknown>;
};

type ApiErrorBody = {
  error?: {
    type?: string;
    message?: string;
  };
};

export class ApiClientError extends Error {
  status: number;
  type: string | null;

  constructor(input: {
    status: number;
    message: string;
    type?: string | null;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.status = input.status;
    this.type = input.type ?? null;
  }
}

const joinApiUrl = (instanceUrl: string, path: string) =>
  `${instanceUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

const parseErrorBody = async (response: Response): Promise<ApiErrorBody> => {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return {};
  }
};

const authHeaders = (sessionToken?: string | null) => ({
  accept: "application/json",
  ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
});

const requestJson = async <Result>(
  instanceUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<Result> => {
  const response = await fetch(joinApiUrl(instanceUrl, path), {
    ...init,
    credentials: "include",
    headers: {
      ...authHeaders(),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiClientError({
      status: response.status,
      type: body.error?.type ?? null,
      message: body.error?.message ?? "Request failed",
    });
  }

  if (response.status === 204) {
    return undefined as Result;
  }

  return (await response.json()) as Result;
};

const appendOptionalFormValue = (
  formData: FormData,
  name: string,
  value: string | number | null | undefined,
) => {
  if (value === null || value === undefined) {
    return;
  }

  formData.append(name, String(value));
};

export const login = async (
  instanceUrl: string,
  data: LoginRequest,
): Promise<ExtensionLoginResponse> =>
  requestJson<ExtensionLoginResponse>(
    instanceUrl,
    "/api/v1/authentication/login",
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "content-type": "application/json",
        "x-ossie-client": "extension",
      },
      body: JSON.stringify(data),
    },
  );

export const getCurrentAuth = async (
  instanceUrl: string,
  sessionToken: string,
): Promise<AuthResponse> =>
  requestJson<AuthResponse>(instanceUrl, "/api/v1/authentication/me", {
    headers: {
      ...authHeaders(sessionToken),
      "x-ossie-client": "extension",
    },
  });

export const listProjects = async (
  instanceUrl: string,
  sessionToken: string,
): Promise<ProjectListResponse> =>
  requestJson<ProjectListResponse>(
    instanceUrl,
    "/api/v1/projects?status=active&purpose=capture",
    {
      headers: {
        ...authHeaders(sessionToken),
        "x-ossie-client": "extension",
      },
    },
  );

export const listProjectVersions = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
): Promise<ProjectVersionListResponse> =>
  requestJson<ProjectVersionListResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/versions?status=active`,
    {
      headers: {
        ...authHeaders(sessionToken),
        "x-ossie-client": "extension",
      },
    },
  );

export const getCaptureSession = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  captureSessionId: string,
): Promise<CaptureSessionResponse> =>
  requestJson<CaptureSessionResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}`,
    {
      headers: {
        ...authHeaders(sessionToken),
        "x-ossie-client": "extension",
      },
    },
  );

export const logout = async (
  instanceUrl: string,
  sessionToken: string,
): Promise<void> =>
  requestJson<void>(instanceUrl, "/api/v1/authentication/logout", {
    method: "POST",
    headers: {
      ...authHeaders(sessionToken),
      "x-ossie-client": "extension",
    },
  });

export const createCaptureSession = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  data: CreateCaptureSessionInput,
): Promise<CaptureSessionResponse> =>
  requestJson<CaptureSessionResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions`,
    {
      method: "POST",
      headers: {
        ...authHeaders(sessionToken),
        "content-type": "application/json",
        "x-ossie-client": "extension",
      },
      body: JSON.stringify({
        ...data,
        source_type: "extension",
        start_immediately: true,
      }),
    },
  );

export const uploadCaptureAsset = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  captureSessionId: string,
  data: UploadCaptureAssetInput,
): Promise<CaptureAssetResponse> => {
  const formData = new FormData();
  formData.append("file", data.file, data.fileName);
  appendOptionalFormValue(formData, "width", data.width);
  appendOptionalFormValue(formData, "height", data.height);
  appendOptionalFormValue(
    formData,
    "device_pixel_ratio",
    data.devicePixelRatio,
  );
  appendOptionalFormValue(formData, "page_url", data.pageUrl);
  appendOptionalFormValue(formData, "page_title", data.pageTitle);
  appendOptionalFormValue(formData, "captured_at", data.capturedAt);

  if (data.metadata !== undefined) {
    formData.append("metadata", JSON.stringify(data.metadata));
  }

  return requestJson<CaptureAssetResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/assets/upload`,
    {
      method: "POST",
      headers: {
        ...authHeaders(sessionToken),
        "x-ossie-client": "extension",
      },
      body: formData,
    },
  );
};

export const createCaptureEvent = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  captureSessionId: string,
  data: CreateCaptureEventInput,
): Promise<CaptureEventResponse> =>
  requestJson<CaptureEventResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events`,
    {
      method: "POST",
      headers: {
        ...authHeaders(sessionToken),
        "content-type": "application/json",
        "x-ossie-client": "extension",
      },
      body: JSON.stringify({
        ...data,
        input_value_redacted: true,
      }),
    },
  );

export const listCaptureEvents = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  captureSessionId: string,
): Promise<CaptureEventListResponse> =>
  requestJson<CaptureEventListResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events`,
    {
      headers: {
        ...authHeaders(sessionToken),
        "x-ossie-client": "extension",
      },
    },
  );

export const completeCaptureSession = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  captureSessionId: string,
): Promise<CompleteCaptureSessionResponse> =>
  requestJson<CompleteCaptureSessionResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/complete`,
    {
      method: "POST",
      headers: {
        ...authHeaders(sessionToken),
        "x-ossie-client": "extension",
      },
    },
  );
