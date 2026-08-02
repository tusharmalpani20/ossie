import type {
  CaptureSessionStatus,
  ProjectRole,
  ProjectStatus,
} from "@repo/constants";
import type { AuthResponse, LoginRequest } from "@repo/types/auth";
import type {
  CaptureSessionCreateResponse,
  CaptureSessionDetail,
  CreateCaptureEventInput,
  CreateCaptureEventResponse,
  CreateCaptureSessionInput,
  ProjectCaptureSessionListResponse,
  ReorderCaptureEventsInput,
  ReorderCaptureEventsResponse,
  UpdateCaptureEventInput,
  UpdateCaptureEventResponse,
  CaptureAsset,
  CaptureAssetProtectionResponse,
  CaptureAssetPurgeResponse,
} from "@repo/types/capture";
import type {
  CreateDemoHotspotInput,
  CreateDemoSceneInput,
  CreateInteractiveDemoFromCaptureResponse,
  InteractiveDemoDetailResponse,
  InteractiveDemoEdition,
  InteractiveDemoHotspotCreateResponse,
  InteractiveDemoHotspotListResponse,
  InteractiveDemoHotspotReorderResponse,
  InteractiveDemoHotspotUpdateResponse,
  InteractiveDemoSceneListResponse,
  InteractiveDemoSceneResponse,
  InteractiveDemoSceneReorderResponse,
  InteractiveDemoSceneUpdateResponse,
  InteractiveDemoWorkingDraftMutationResponse,
  ProjectInteractiveDemoListResponse,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
} from "@repo/types/demo";
import type {
  CreateGuideBlockInput,
  GuideEdition,
  GuideBlockResponse,
  GuideBlocksResponse,
  GuideDetail,
  GuideMarkdownExport,
  GuideWorkingDraftMutationResponse,
  ProjectGuideListResponse,
  UpdateGuideBlockAnnotationsInput,
  UpdateGuideBlockInput,
  UpdateGuideBlockScreenshotInput,
  UpdateGuideResponse,
  UpdateGuideStepResponse,
  UploadGuideBlockScreenshotResponse,
} from "@repo/types/guide";
import type { PublicInstanceStatus } from "@repo/types/instance";
import type {
  AcceptOrganizationInviteInput,
  OrganizationInviteCreateInput,
  OrganizationInviteCreateResponse,
  OrganizationInviteListResponse,
  OrganizationInviteUpdateResponse,
  OrganizationMemberListResponse,
  PublicOrganizationInviteResponse,
} from "@repo/types/organization";
import type {
  CreatePublishLinkRequest,
  PublicationHistoryResponse,
  PublishArtifactRequest,
  PublishArtifactResponse,
  PublishLink,
  PublicPublishLinkResponse,
  ReplacePublishLinkManifestRequest,
  RollbackPublishLinkEntryRequest,
  UpdatePublishLinkSettingsRequest,
} from "@repo/types/publish";
import type {
  CreateProjectInput,
  ProjectCreateResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  ProjectUpdateResponse,
  UpdateProjectInput,
} from "@repo/types/project";
import type {
  FirstRunSetupInput,
  FirstRunSetupResponse,
} from "@repo/types/setup";
import type {
  ComplianceAuditEventDetailResponse,
  ComplianceEventsResponse,
  ComplianceKind,
} from "@repo/types/compliance";
import type { ProjectActivityResponse } from "@repo/types/project-activity";
import type {
  ProjectMembershipListResponse,
  ProjectMembershipResponse,
} from "@repo/types/project-membership";
import type {
  CreateProjectVersionRequest,
  ProjectVersionListQuery,
  ProjectVersionListResponse,
  ProjectVersionResolutionResponse,
  ProjectVersionResponse,
  ReorderProjectVersionsRequest,
  SetDefaultProjectVersionRequest,
  UpdateProjectVersionRequest,
} from "@repo/types/project-version";
import type {
  ArtifactCarryForwardRequest,
  ArtifactCarryForwardResponse,
  ArtifactRevisionListQuery,
  ArtifactRevisionSummary,
  ArtifactRevisionWriteRequest,
  GuideRevisionDetail,
  GuideRevisionRestoreResponse,
  InteractiveDemoRevisionDetail,
  InteractiveDemoRevisionRestoreResponse,
} from "@repo/types";
import type {
  UploadCaptureAssetInput,
  UploadCaptureAssetResponse,
} from "../features/capture-session/types";
import type {
  ProjectScreenshotAssetListResponse,
  UploadGuideBlockScreenshotInput,
} from "../features/guide/types";

export type {
  InteractiveDemoDetailResponse,
  InteractiveDemoHotspotCreateResponse,
  InteractiveDemoHotspotListResponse,
  InteractiveDemoHotspotReorderResponse,
  InteractiveDemoHotspotUpdateResponse,
  InteractiveDemoSceneListResponse,
  InteractiveDemoSceneReorderResponse,
  InteractiveDemoSceneUpdateResponse,
  InteractiveDemoWorkingDraftMutationResponse,
  ProjectInteractiveDemoListResponse,
} from "@repo/types/demo";
export type {
  CaptureSessionCreateResponse,
  ProjectCaptureSessionListResponse,
} from "@repo/types/capture";
export type { ProjectGuideListResponse } from "@repo/types/guide";
export type {
  ProjectCreateResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  ProjectUpdateResponse,
} from "@repo/types/project";
export type { PublicInstanceStatus } from "@repo/types/instance";
export type {
  ProjectVersionDetail,
  ProjectVersionListResponse,
  ProjectVersionResolutionResponse,
  ProjectVersionResponse,
} from "@repo/types/project-version";

export type ApiClientErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "unknown";

const revisionPath = (
  projectId: string,
  type: "guides" | "interactive-demos",
  artifactId: string,
  projectVersionId: string,
) =>
  `/api/v1/projects/${encodeURIComponent(projectId)}/${type}/${encodeURIComponent(artifactId)}/revisions?project_version_id=${encodeURIComponent(projectVersionId)}`;

export const listArtifactRevisions = (input: {
  projectId: string;
  projectVersionId: string;
  artifactType: "guide" | "interactive_demo";
  artifactId: string;
  query?: ArtifactRevisionListQuery;
}) => {
  const path = revisionPath(
    input.projectId,
    input.artifactType === "guide" ? "guides" : "interactive-demos",
    input.artifactId,
    input.projectVersionId,
  );
  const params = new URLSearchParams();
  if (input.query?.limit) params.set("limit", String(input.query.limit));
  if (input.query?.before_revision_number)
    params.set(
      "before_revision_number",
      String(input.query.before_revision_number),
    );
  return requestJson<{
    revisions: ArtifactRevisionSummary[];
    next_before_revision_number: number | null;
  }>(`${path}${params.size ? `&${params}` : ""}`);
};
export const getArtifactRevision = <
  T extends "guide" | "interactive_demo",
>(input: {
  projectId: string;
  projectVersionId: string;
  artifactType: T;
  artifactId: string;
  revisionNumber: number;
}) =>
  requestJson<
    T extends "guide" ? GuideRevisionDetail : InteractiveDemoRevisionDetail
  >(
    `${revisionPath(input.projectId, input.artifactType === "guide" ? "guides" : "interactive-demos", input.artifactId, input.projectVersionId).replace("?", `/${input.revisionNumber}?`)}`,
  );
export const checkpointArtifactRevision = (input: {
  projectId: string;
  projectVersionId: string;
  artifactType: "guide" | "interactive_demo";
  artifactId: string;
  data: ArtifactRevisionWriteRequest;
}) =>
  requestJson<{ revision: ArtifactRevisionSummary; reused: boolean }>(
    `${revisionPath(input.projectId, input.artifactType === "guide" ? "guides" : "interactive-demos", input.artifactId, input.projectVersionId).replace("?", "/checkpoint?")}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input.data),
    },
  );
export const restoreArtifactRevision = (input: {
  projectId: string;
  projectVersionId: string;
  artifactType: "guide" | "interactive_demo";
  artifactId: string;
  revisionNumber: number;
  data: ArtifactRevisionWriteRequest;
}) =>
  requestJson<
    GuideRevisionRestoreResponse | InteractiveDemoRevisionRestoreResponse
  >(
    `${revisionPath(input.projectId, input.artifactType === "guide" ? "guides" : "interactive-demos", input.artifactId, input.projectVersionId).replace("?", `/${input.revisionNumber}/restore?`)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input.data),
    },
  );
export const carryForwardArtifactEditions = (
  projectId: string,
  data: ArtifactCarryForwardRequest,
  idempotencyKey: string,
) =>
  requestJson<ArtifactCarryForwardResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/artifact-editions/carry-forward`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(data),
    },
  );
export const changeCaptureAssetLifecycle = (input: {
  projectId: string;
  captureSessionId: string;
  captureAssetId: string;
  command: "archive" | "restore";
  expectedAssetVersion: number;
}) =>
  requestJson<{ capture_asset: CaptureAsset }>(
    `/api/v1/projects/${encodeURIComponent(input.projectId)}/capture-sessions/${encodeURIComponent(input.captureSessionId)}/assets/${encodeURIComponent(input.captureAssetId)}/${input.command}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        expected_asset_version: input.expectedAssetVersion,
      }),
    },
  );
export const getCaptureAssetProtection = (input: {
  projectId: string;
  captureSessionId: string;
  captureAssetId: string;
}) =>
  requestJson<CaptureAssetProtectionResponse>(
    `/api/v1/projects/${encodeURIComponent(input.projectId)}/capture-sessions/${encodeURIComponent(input.captureSessionId)}/assets/${encodeURIComponent(input.captureAssetId)}/protection`,
  );
export const purgeCaptureAsset = (input: {
  projectId: string;
  captureSessionId: string;
  captureAssetId: string;
  expectedAssetVersion: number;
}) =>
  requestJson<CaptureAssetPurgeResponse>(
    `/api/v1/projects/${encodeURIComponent(input.projectId)}/capture-sessions/${encodeURIComponent(input.captureSessionId)}/assets/${encodeURIComponent(input.captureAssetId)}`,
    {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        expected_asset_version: input.expectedAssetVersion,
      }),
    },
  );

type ApiErrorBody = {
  error?: {
    type?: string;
    message?: string;
    details?: unknown;
  };
};

export type ListProjectsOptions = {
  status?: ProjectStatus;
};

export type ListCaptureSessionsOptions = {
  project_version_id: string;
  status?: CaptureSessionStatus;
};

export class ApiClientError extends Error {
  kind: ApiClientErrorKind;
  status: number;
  type: string | null;
  details: unknown;

  constructor(input: {
    kind: ApiClientErrorKind;
    status: number;
    message: string;
    type?: string | null;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.kind = input.kind;
    this.status = input.status;
    this.type = input.type ?? null;
    this.details = input.details;
  }
}

const apiBaseUrl = () => import.meta.env.VITE_OSSIE_API_URL ?? "";

const joinUrl = (baseUrl: string, path: string) => {
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const errorKind = (status: number, type?: string): ApiClientErrorKind => {
  if (status === 401 || type === "unauthenticated") {
    return "unauthenticated";
  }

  if (status === 403 || type === "compliance_permission_denied") {
    return "forbidden";
  }

  if (status === 404 || type?.endsWith("_not_found")) {
    return "not_found";
  }

  if (status === 400 || status === 409) {
    return "validation";
  }

  return "unknown";
};

const parseErrorBody = async (response: Response): Promise<ApiErrorBody> => {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return {};
  }
};

const requestJson = async <Result>(
  path: string,
  init: RequestInit = {},
): Promise<Result> => {
  const response = await fetch(joinUrl(apiBaseUrl(), path), {
    ...init,
    credentials: "include",
    headers: {
      accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiClientError({
      kind: errorKind(response.status, body.error?.type),
      status: response.status,
      type: body.error?.type ?? null,
      message: body.error?.message ?? "Request failed",
      details: body.error?.details,
    });
  }

  if (response.status === 204) {
    return undefined as Result;
  }

  return (await response.json()) as Result;
};

const filenameFromContentDisposition = (contentDisposition: string | null) => {
  const filenameMatch =
    contentDisposition?.match(/filename="([^"]+)"/i) ??
    contentDisposition?.match(/filename=([^;]+)/i);
  const filename = filenameMatch?.[1]?.trim();

  return filename || null;
};

const requestBlob = async (
  path: string,
  fallbackFilename: string,
): Promise<{ filename: string; blob: Blob }> => {
  const response = await fetch(joinUrl(apiBaseUrl(), path), {
    credentials: "include",
    headers: {
      accept: "application/zip",
    },
  });

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiClientError({
      kind: errorKind(response.status, body.error?.type),
      status: response.status,
      type: body.error?.type ?? null,
      message: body.error?.message ?? "Request failed",
    });
  }

  return {
    filename:
      filenameFromContentDisposition(
        response.headers.get("content-disposition"),
      ) ?? fallbackFilename,
    blob: await response.blob(),
  };
};

/** Returns the API origin users should enter in the browser extension. */
export const getConfiguredApiOrigin = () =>
  new URL(apiBaseUrl() || window.location.origin, window.location.origin)
    .origin;

/** Downloads the authenticated Manifest V3 extension bundle. */
export const downloadExtensionBundle = async (): Promise<{
  filename: string;
  blob: Blob;
}> => requestBlob("/api/v1/extension/download", "ossie-extension.zip");

export const resolveApiAssetUrl = (fileUrl: string, baseUrl = apiBaseUrl()) =>
  joinUrl(baseUrl, fileUrl);

export const getCurrentAuth = async (): Promise<AuthResponse> =>
  requestJson<AuthResponse>("/api/v1/authentication/me");

export const getPublicInstanceStatus =
  async (): Promise<PublicInstanceStatus> =>
    requestJson<PublicInstanceStatus>("/api/v1/public/instance");

export const completeFirstRunSetup = async (data: {
  owner: FirstRunSetupInput["owner"];
  organization: FirstRunSetupInput["organization"];
}): Promise<FirstRunSetupResponse> =>
  requestJson<FirstRunSetupResponse>("/api/v1/setup/first-run", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  });

export const login = async (data: LoginRequest): Promise<AuthResponse> =>
  requestJson<AuthResponse>("/api/v1/authentication/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  });

export const logout = async (): Promise<void> =>
  requestJson<void>("/api/v1/authentication/logout", {
    method: "POST",
  });

export const listOrganizationMembers =
  async (): Promise<OrganizationMemberListResponse> =>
    requestJson<OrganizationMemberListResponse>("/api/v1/organization/members");

export const listOrganizationInvites =
  async (): Promise<OrganizationInviteListResponse> =>
    requestJson<OrganizationInviteListResponse>("/api/v1/organization/invites");

export const createOrganizationInvite = async (
  input: OrganizationInviteCreateInput,
): Promise<OrganizationInviteCreateResponse> =>
  requestJson<OrganizationInviteCreateResponse>(
    "/api/v1/organization/invites",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

export const revokeOrganizationInvite = async (
  inviteId: string,
): Promise<OrganizationInviteUpdateResponse> =>
  requestJson<OrganizationInviteUpdateResponse>(
    `/api/v1/organization/invites/${encodeURIComponent(inviteId)}`,
    {
      method: "DELETE",
    },
  );

export const getPublicOrganizationInvite = async (
  token: string,
): Promise<PublicOrganizationInviteResponse> =>
  requestJson<PublicOrganizationInviteResponse>(
    `/api/v1/public/invites/${encodeURIComponent(token)}`,
  );

export const acceptPublicOrganizationInvite = async (
  token: string,
  input: AcceptOrganizationInviteInput,
): Promise<AuthResponse> =>
  requestJson<AuthResponse>(
    `/api/v1/public/invites/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

export const listProjects = async (
  options: ListProjectsOptions = {},
): Promise<ProjectListResponse> => {
  const query = options.status
    ? `?status=${encodeURIComponent(options.status)}`
    : "";

  return requestJson<ProjectListResponse>(`/api/v1/projects${query}`);
};

export const listProjectMemberships = async (
  projectId: string,
): Promise<ProjectMembershipListResponse> =>
  requestJson(`/api/v1/projects/${encodeURIComponent(projectId)}/memberships`);

export const assignProjectMembership = async (
  projectId: string,
  input: { org_user_id: string; role: ProjectRole },
): Promise<ProjectMembershipResponse> =>
  requestJson(`/api/v1/projects/${encodeURIComponent(projectId)}/memberships`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

export const changeProjectMembershipRole = async (
  projectId: string,
  membershipId: string,
  input: { role: ProjectRole; expected_version: number },
): Promise<ProjectMembershipResponse> =>
  requestJson(
    `/api/v1/projects/${encodeURIComponent(projectId)}/memberships/${encodeURIComponent(membershipId)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );

export const removeProjectMembership = async (
  projectId: string,
  membershipId: string,
  expectedVersion: number,
): Promise<void> =>
  requestJson(
    `/api/v1/projects/${encodeURIComponent(projectId)}/memberships/${encodeURIComponent(membershipId)}?expected_version=${expectedVersion}`,
    { method: "DELETE" },
  );

export const createProject = async (
  input: CreateProjectInput,
): Promise<ProjectCreateResponse> =>
  requestJson<ProjectCreateResponse>("/api/v1/projects", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

export const getProject = async (
  projectId: string,
): Promise<ProjectDetailResponse> =>
  requestJson<ProjectDetailResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}`,
  );

export const updateProject = async (
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectUpdateResponse> =>
  requestJson<ProjectUpdateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

const projectVersionsUrl = (projectId: string) =>
  `/api/v1/projects/${encodeURIComponent(projectId)}/versions`;
export const listProjectVersions = (
  projectId: string,
  query: ProjectVersionListQuery = {},
): Promise<ProjectVersionListResponse> =>
  requestJson(
    `${projectVersionsUrl(projectId)}${query.status ? `?status=${encodeURIComponent(query.status)}` : ""}`,
  );
export const resolveProjectVersion = (
  projectId: string,
  slug: string,
): Promise<ProjectVersionResolutionResponse> =>
  requestJson(
    `${projectVersionsUrl(projectId)}/resolve/${encodeURIComponent(slug)}`,
  );
export const getProjectVersion = (
  projectId: string,
  id: string,
): Promise<ProjectVersionResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}`);
export const createProjectVersion = (
  projectId: string,
  data: CreateProjectVersionRequest,
): Promise<ProjectVersionResponse> =>
  requestJson(projectVersionsUrl(projectId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
export const updateProjectVersion = (
  projectId: string,
  id: string,
  data: UpdateProjectVersionRequest,
): Promise<ProjectVersionResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
export const reorderProjectVersions = (
  projectId: string,
  data: ReorderProjectVersionsRequest,
): Promise<ProjectVersionListResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}/order`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
export const archiveProjectVersion = (
  projectId: string,
  id: string,
  expected_version: number,
): Promise<ProjectVersionResponse> =>
  requestJson(
    `${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}/archive`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expected_version }),
    },
  );
export const restoreProjectVersion = (
  projectId: string,
  id: string,
  expected_version: number,
): Promise<ProjectVersionResponse> =>
  requestJson(
    `${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}/restore`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expected_version }),
    },
  );
export const setDefaultProjectVersion = (
  projectId: string,
  id: string,
  data: SetDefaultProjectVersionRequest,
): Promise<{
  project: import("@repo/types/project").Project;
  project_version: import("@repo/types/project-version").ProjectVersionDetail;
}> =>
  requestJson(
    `${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}/set-default`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    },
  );

export const getCaptureSessionDetail = async (
  projectId: string,
  captureSessionId: string,
): Promise<CaptureSessionDetail> => {
  return requestJson<CaptureSessionDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/detail`,
  );
};

export const listProjectCaptureSessions = async (
  projectId: string,
  options: ListCaptureSessionsOptions,
): Promise<ProjectCaptureSessionListResponse> => {
  const query = new URLSearchParams({
    project_version_id: options.project_version_id,
  });
  if (options.status) query.set("status", options.status);

  return requestJson<ProjectCaptureSessionListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions?${query}`,
  );
};

export const createProjectCaptureSession = async (
  projectId: string,
  input: CreateCaptureSessionInput,
): Promise<CaptureSessionCreateResponse> =>
  requestJson<CaptureSessionCreateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

export const reassignCaptureSessionProjectVersion = (
  projectId: string,
  captureSessionId: string,
  data: { project_version_id: string; expected_version: number },
): Promise<CaptureSessionCreateResponse> =>
  requestJson(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/reassign-project-version`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    },
  );

const appendOptionalFormValue = (
  formData: FormData,
  key: string,
  value?: string | null,
) => {
  if (value !== undefined && value !== null) {
    formData.append(key, value);
  }
};

export const uploadCaptureSessionAsset = async (
  projectId: string,
  captureSessionId: string,
  input: UploadCaptureAssetInput,
): Promise<UploadCaptureAssetResponse> => {
  const formData = new FormData();
  formData.append("file", input.file);
  appendOptionalFormValue(formData, "page_url", input.page_url);
  appendOptionalFormValue(formData, "page_title", input.page_title);
  appendOptionalFormValue(formData, "captured_at", input.captured_at);

  return requestJson<UploadCaptureAssetResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/assets/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
};

export const createCaptureSessionEvent = async (
  projectId: string,
  captureSessionId: string,
  input: CreateCaptureEventInput,
): Promise<CreateCaptureEventResponse> =>
  requestJson<CreateCaptureEventResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

export const reorderCaptureSessionEvents = async (
  projectId: string,
  captureSessionId: string,
  input: ReorderCaptureEventsInput,
): Promise<ReorderCaptureEventsResponse> =>
  requestJson<ReorderCaptureEventsResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events/order`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

export const updateCaptureSessionEvent = async (
  projectId: string,
  captureSessionId: string,
  eventId: string,
  input: UpdateCaptureEventInput,
): Promise<UpdateCaptureEventResponse> =>
  requestJson<UpdateCaptureEventResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

export const getGuideDetail = async (
  projectId: string,
  guideId: string,
  projectVersionId: string,
): Promise<GuideDetail> =>
  requestJson<GuideDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}?project_version_id=${encodeURIComponent(projectVersionId)}`,
  );

export const exportGuideMarkdown = async (
  projectId: string,
  guideId: string,
  projectVersionId: string,
): Promise<GuideMarkdownExport> =>
  requestJson<GuideMarkdownExport>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/export/markdown?project_version_id=${encodeURIComponent(projectVersionId)}`,
  );

export const exportGuideHtmlZip = async (
  projectId: string,
  guideId: string,
  projectVersionId: string,
): Promise<{ filename: string; blob: Blob }> =>
  requestBlob(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/export/html.zip?project_version_id=${encodeURIComponent(projectVersionId)}`,
    "guide-html-export.zip",
  );

const artifactPublishRoot = (
  projectId: string,
  artifactType: "guide" | "interactive_demo",
  artifactId: string,
) =>
  `/api/v1/projects/${encodeURIComponent(projectId)}/${artifactType === "guide" ? "guides" : "interactive-demos"}/${encodeURIComponent(artifactId)}`;
const versionQuery = (projectVersionId: string) =>
  `project_version_id=${encodeURIComponent(projectVersionId)}`;
export const listArtifactPublications = (
  projectId: string,
  artifactType: "guide" | "interactive_demo",
  artifactId: string,
  projectVersionId: string,
): Promise<PublicationHistoryResponse> =>
  requestJson(
    `${artifactPublishRoot(projectId, artifactType, artifactId)}/publications?${versionQuery(projectVersionId)}`,
  );
export const listArtifactPublishLinks = (
  projectId: string,
  artifactType: "guide" | "interactive_demo",
  artifactId: string,
  projectVersionId: string,
): Promise<{
  publish_links: PublishLink[];
  next_cursor: null | { created_at: string; id: string };
}> =>
  requestJson(
    `${artifactPublishRoot(projectId, artifactType, artifactId)}/publish-links?${versionQuery(projectVersionId)}&status=all`,
  );
export const publishArtifact = (
  projectId: string,
  artifactType: "guide" | "interactive_demo",
  artifactId: string,
  projectVersionId: string,
  input: PublishArtifactRequest,
): Promise<PublishArtifactResponse> =>
  requestJson(
    `${artifactPublishRoot(projectId, artifactType, artifactId)}/publications?${versionQuery(projectVersionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
export const createArtifactPublishLink = (
  projectId: string,
  artifactType: "guide" | "interactive_demo",
  artifactId: string,
  projectVersionId: string,
  input: CreatePublishLinkRequest,
): Promise<{ publish_link: PublishLink }> =>
  requestJson(
    `${artifactPublishRoot(projectId, artifactType, artifactId)}/publish-links?${versionQuery(projectVersionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
export const updateArtifactPublishLink = (
  projectId: string,
  artifactType: "guide" | "interactive_demo",
  artifactId: string,
  projectVersionId: string,
  linkId: string,
  input: UpdatePublishLinkSettingsRequest,
): Promise<{ publish_link: PublishLink }> =>
  requestJson(
    `${artifactPublishRoot(projectId, artifactType, artifactId)}/publish-links/${encodeURIComponent(linkId)}?${versionQuery(projectVersionId)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
export const replaceArtifactPublishLinkManifest = (
  projectId: string,
  artifactType: "guide" | "interactive_demo",
  artifactId: string,
  projectVersionId: string,
  linkId: string,
  input: ReplacePublishLinkManifestRequest,
): Promise<{ publish_link: PublishLink }> =>
  requestJson(
    `${artifactPublishRoot(projectId, artifactType, artifactId)}/publish-links/${encodeURIComponent(linkId)}/entries?${versionQuery(projectVersionId)}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
export const rollbackArtifactPublishLinkEntry = (
  projectId: string,
  artifactType: "guide" | "interactive_demo",
  artifactId: string,
  projectVersionId: string,
  linkId: string,
  entryId: string,
  input: RollbackPublishLinkEntryRequest,
) =>
  requestJson(
    `${artifactPublishRoot(projectId, artifactType, artifactId)}/publish-links/${encodeURIComponent(linkId)}/entries/${encodeURIComponent(entryId)}/rollback?${versionQuery(projectVersionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
export const revokeArtifactPublishLink = (
  projectId: string,
  artifactType: "guide" | "interactive_demo",
  artifactId: string,
  projectVersionId: string,
  linkId: string,
  expected_link_version: number,
): Promise<{ publish_link: PublishLink }> =>
  requestJson(
    `${artifactPublishRoot(projectId, artifactType, artifactId)}/publish-links/${encodeURIComponent(linkId)}/revoke?${versionQuery(projectVersionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expected_link_version }),
    },
  );
export const getPublicPublishLink = async (
  slug: string,
  artifactType: "guide" | "interactive_demo" = "guide",
  versionSlug: string | null = null,
  surface: "reader" | "embed" = "reader",
): Promise<PublicPublishLinkResponse> =>
  requestJson<PublicPublishLinkResponse>(
    `/api/v1/public/publish-links/${encodeURIComponent(slug)}${versionSlug ? `/versions/${encodeURIComponent(versionSlug)}` : ""}?artifact_type=${artifactType}`,
    { headers: { "X-Ossie-Access-Surface": `public_${surface}` } },
  );

export const createPublicPublishViewerSession = async (
  slug: string,
  artifactTypeOrInput: "guide" | "interactive_demo" | { password: string },
  inputOrSurface: { password: string } | "reader" | "embed" = "reader",
  surface: "reader" | "embed" = "reader",
): Promise<void> =>
  requestJson<void>(
    `/api/v1/public/publish-links/${encodeURIComponent(slug)}/viewer-sessions?artifact_type=${typeof artifactTypeOrInput === "string" ? artifactTypeOrInput : "guide"}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Ossie-Access-Surface": `public_${typeof inputOrSurface === "string" ? inputOrSurface : surface}`,
      },
      body: JSON.stringify(
        typeof artifactTypeOrInput === "string"
          ? inputOrSurface
          : artifactTypeOrInput,
      ),
    },
  );

export const listComplianceEvents = async (
  input: {
    kind?: ComplianceKind;
    projectId?: string;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<ComplianceEventsResponse> => {
  const query = new URLSearchParams();
  if (input.kind && input.kind !== "all") query.set("kind", input.kind);
  if (input.projectId) query.set("project_id", input.projectId);
  if (input.cursor) query.set("cursor", input.cursor);
  if (input.limit) query.set("limit", String(input.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return requestJson<ComplianceEventsResponse>(
    `/api/v1/organization/compliance/events${suffix}`,
  );
};

export const getComplianceAuditEvent = async (
  auditEventId: string,
): Promise<ComplianceAuditEventDetailResponse> =>
  requestJson<ComplianceAuditEventDetailResponse>(
    `/api/v1/organization/compliance/audit-events/${encodeURIComponent(auditEventId)}`,
  );

export const listProjectComplianceEvents = async (
  projectId: string,
  input: {
    kind?: ComplianceKind;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<ComplianceEventsResponse> => {
  const query = new URLSearchParams();
  if (input.kind && input.kind !== "all") query.set("kind", input.kind);
  if (input.cursor) query.set("cursor", input.cursor);
  if (input.limit) query.set("limit", String(input.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return requestJson(
    `/api/v1/projects/${encodeURIComponent(projectId)}/compliance/events${suffix}`,
  );
};

export const getProjectComplianceAuditEvent = async (
  projectId: string,
  auditEventId: string,
): Promise<ComplianceAuditEventDetailResponse> =>
  requestJson(
    `/api/v1/projects/${encodeURIComponent(projectId)}/compliance/audit-events/${encodeURIComponent(auditEventId)}`,
  );

export const listProjectActivity = async (
  projectId: string,
  input: {
    cursor?: string;
    limit?: number;
  } = {},
): Promise<ProjectActivityResponse> => {
  const query = new URLSearchParams();
  if (input.cursor) query.set("cursor", input.cursor);
  if (input.limit) query.set("limit", String(input.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return requestJson(
    `/api/v1/projects/${encodeURIComponent(projectId)}/activity${suffix}`,
  );
};

export const listProjectGuides = async (
  projectId: string,
  projectVersionId: string,
): Promise<ProjectGuideListResponse> =>
  requestJson<ProjectGuideListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides?project_version_id=${encodeURIComponent(projectVersionId)}`,
  );

export const listProjectScreenshotAssets = async (
  projectId: string,
  projectVersionId: string,
): Promise<ProjectScreenshotAssetListResponse> =>
  requestJson<ProjectScreenshotAssetListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-assets?project_version_id=${encodeURIComponent(projectVersionId)}&asset_type=screenshot`,
  );

export const createGuideFromCaptureSession = async (
  projectId: string,
  captureSessionId: string,
  data: {
    title: string;
    description?: string | null;
  },
): Promise<GuideDetail> =>
  requestJson<GuideDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/from-capture-session/${encodeURIComponent(captureSessionId)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const createInteractiveDemoFromCaptureSession = async (
  projectId: string,
  captureSessionId: string,
  data: {
    title?: string;
    description?: string | null;
  } = {},
): Promise<CreateInteractiveDemoFromCaptureResponse> =>
  requestJson<CreateInteractiveDemoFromCaptureResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/interactive-demos`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const listProjectInteractiveDemos = async (
  projectId: string,
  projectVersionId: string,
): Promise<ProjectInteractiveDemoListResponse> =>
  requestJson<ProjectInteractiveDemoListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos?project_version_id=${encodeURIComponent(projectVersionId)}`,
  );

export const getInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string,
  projectVersionId: string,
): Promise<InteractiveDemoDetailResponse> =>
  requestJson<InteractiveDemoDetailResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}?project_version_id=${encodeURIComponent(projectVersionId)}`,
  );

export const updateInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string,
  data: UpdateInteractiveDemoInput,
  projectVersionId: string,
): Promise<InteractiveDemoDetailResponse> =>
  requestJson<InteractiveDemoDetailResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

const changeInteractiveDemoEditionStatus = async (
  command: "archive" | "restore",
  projectId: string,
  interactiveDemoId: string,
  projectVersionId: string,
  expectedEditionVersion: number,
): Promise<{ edition: InteractiveDemoEdition }> =>
  requestJson(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/${command}?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        expected_edition_version: expectedEditionVersion,
      }),
    },
  );

export const archiveInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string,
  projectVersionId: string,
  expectedEditionVersion: number,
): Promise<{ edition: InteractiveDemoEdition }> =>
  changeInteractiveDemoEditionStatus(
    "archive",
    projectId,
    interactiveDemoId,
    projectVersionId,
    expectedEditionVersion,
  );

export const restoreInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string,
  projectVersionId: string,
  expectedEditionVersion: number,
): Promise<{ edition: InteractiveDemoEdition }> =>
  changeInteractiveDemoEditionStatus(
    "restore",
    projectId,
    interactiveDemoId,
    projectVersionId,
    expectedEditionVersion,
  );

export const listInteractiveDemoScenes = async (
  projectId: string,
  interactiveDemoId: string,
  projectVersionId: string,
): Promise<InteractiveDemoSceneListResponse> =>
  requestJson<InteractiveDemoSceneListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes?project_version_id=${encodeURIComponent(projectVersionId)}`,
  );

export const createInteractiveDemoScene = async (
  projectId: string,
  interactiveDemoId: string,
  data: CreateDemoSceneInput,
  projectVersionId: string,
): Promise<InteractiveDemoSceneResponse> =>
  requestJson<InteractiveDemoSceneResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const updateInteractiveDemoScene = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  data: UpdateDemoSceneInput,
  projectVersionId: string,
): Promise<InteractiveDemoSceneUpdateResponse> =>
  requestJson<InteractiveDemoSceneUpdateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/${encodeURIComponent(sceneId)}?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const reorderInteractiveDemoScenes = async (
  projectId: string,
  interactiveDemoId: string,
  sceneIds: string[],
  expectedWorkingDraftVersion: number,
  projectVersionId: string,
): Promise<InteractiveDemoSceneReorderResponse> =>
  requestJson<InteractiveDemoSceneReorderResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/order?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scene_ids: sceneIds,
        expected_working_draft_version: expectedWorkingDraftVersion,
      }),
    },
  );

export const deleteInteractiveDemoScene = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  expectedWorkingDraftVersion: number,
  projectVersionId: string,
): Promise<InteractiveDemoWorkingDraftMutationResponse> =>
  requestJson<InteractiveDemoWorkingDraftMutationResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/${encodeURIComponent(sceneId)}?project_version_id=${encodeURIComponent(projectVersionId)}&expected_working_draft_version=${expectedWorkingDraftVersion}`,
    {
      method: "DELETE",
    },
  );

const demoHotspotsPath = (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  projectVersionId: string,
) =>
  `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/${encodeURIComponent(sceneId)}/hotspots?project_version_id=${encodeURIComponent(projectVersionId)}`;

export const createInteractiveDemoHotspot = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  data: CreateDemoHotspotInput,
  projectVersionId: string,
): Promise<InteractiveDemoHotspotCreateResponse> =>
  requestJson<InteractiveDemoHotspotCreateResponse>(
    demoHotspotsPath(projectId, interactiveDemoId, sceneId, projectVersionId),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const listInteractiveDemoHotspots = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  projectVersionId: string,
): Promise<InteractiveDemoHotspotListResponse> =>
  requestJson<InteractiveDemoHotspotListResponse>(
    demoHotspotsPath(projectId, interactiveDemoId, sceneId, projectVersionId),
  );

export const updateInteractiveDemoHotspot = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  hotspotId: string,
  data: UpdateDemoHotspotInput,
  projectVersionId: string,
): Promise<InteractiveDemoHotspotUpdateResponse> =>
  requestJson<InteractiveDemoHotspotUpdateResponse>(
    `${demoHotspotsPath(projectId, interactiveDemoId, sceneId, projectVersionId).split("?")[0]}/${encodeURIComponent(hotspotId)}?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const reorderInteractiveDemoHotspots = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  hotspotIds: string[],
  expectedWorkingDraftVersion: number,
  projectVersionId: string,
): Promise<InteractiveDemoHotspotReorderResponse> =>
  requestJson<InteractiveDemoHotspotReorderResponse>(
    `${demoHotspotsPath(projectId, interactiveDemoId, sceneId, projectVersionId).split("?")[0]}/order?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        hotspot_ids: hotspotIds,
        expected_working_draft_version: expectedWorkingDraftVersion,
      }),
    },
  );

export const deleteInteractiveDemoHotspot = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  hotspotId: string,
  expectedWorkingDraftVersion: number,
  projectVersionId: string,
): Promise<InteractiveDemoWorkingDraftMutationResponse> =>
  requestJson<InteractiveDemoWorkingDraftMutationResponse>(
    `${demoHotspotsPath(projectId, interactiveDemoId, sceneId, projectVersionId).split("?")[0]}/${encodeURIComponent(hotspotId)}?project_version_id=${encodeURIComponent(projectVersionId)}&expected_working_draft_version=${expectedWorkingDraftVersion}`,
    {
      method: "DELETE",
    },
  );

export const updateGuide = async (
  projectId: string,
  guideId: string,
  data: {
    title?: string;
    description?: string | null;
    expected_edition_version: number;
  },
  projectVersionId: string,
): Promise<UpdateGuideResponse> =>
  requestJson<UpdateGuideResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

const changeGuideEditionStatus = async (
  command: "archive" | "restore",
  projectId: string,
  guideId: string,
  projectVersionId: string,
  expectedEditionVersion: number,
): Promise<{ edition: GuideEdition }> =>
  requestJson(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/${command}?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        expected_edition_version: expectedEditionVersion,
      }),
    },
  );

export const archiveGuide = (
  projectId: string,
  guideId: string,
  projectVersionId: string,
  expectedEditionVersion: number,
): Promise<{ edition: GuideEdition }> =>
  changeGuideEditionStatus(
    "archive",
    projectId,
    guideId,
    projectVersionId,
    expectedEditionVersion,
  );

export const restoreGuide = (
  projectId: string,
  guideId: string,
  projectVersionId: string,
  expectedEditionVersion: number,
): Promise<{ edition: GuideEdition }> =>
  changeGuideEditionStatus(
    "restore",
    projectId,
    guideId,
    projectVersionId,
    expectedEditionVersion,
  );

export const updateGuideStep = async (
  projectId: string,
  guideId: string,
  stepId: string,
  data: {
    title?: string;
    body?: string | null;
    expected_working_draft_version: number;
  },
  projectVersionId: string,
): Promise<UpdateGuideStepResponse> =>
  requestJson<UpdateGuideStepResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/steps/${encodeURIComponent(stepId)}?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const createGuideBlock = async (
  projectId: string,
  guideId: string,
  data: CreateGuideBlockInput,
  projectVersionId: string,
): Promise<GuideBlocksResponse> =>
  requestJson<GuideBlocksResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const updateGuideBlock = async (
  projectId: string,
  guideId: string,
  blockId: string,
  data: UpdateGuideBlockInput,
  projectVersionId: string,
): Promise<GuideBlockResponse> =>
  requestJson<GuideBlockResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const updateGuideBlockScreenshot = async (
  projectId: string,
  guideId: string,
  blockId: string,
  data: UpdateGuideBlockScreenshotInput,
  projectVersionId: string,
): Promise<GuideBlockResponse> =>
  requestJson<GuideBlockResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/screenshot?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const updateGuideBlockAnnotations = async (
  projectId: string,
  guideId: string,
  blockId: string,
  data: UpdateGuideBlockAnnotationsInput,
  projectVersionId: string,
): Promise<GuideBlockResponse> =>
  requestJson<GuideBlockResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/annotations?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

export const uploadGuideBlockScreenshot = async (
  projectId: string,
  guideId: string,
  blockId: string,
  input: UploadGuideBlockScreenshotInput,
  expectedWorkingDraftVersion: number,
  projectVersionId: string,
): Promise<UploadGuideBlockScreenshotResponse> => {
  const body = new FormData();
  body.append("file", input.file);
  body.append(
    "expected_working_draft_version",
    String(expectedWorkingDraftVersion),
  );

  if (input.width !== undefined) {
    body.append("width", String(input.width));
  }
  if (input.height !== undefined) {
    body.append("height", String(input.height));
  }
  if (input.devicePixelRatio !== undefined) {
    body.append("device_pixel_ratio", String(input.devicePixelRatio));
  }
  if (input.pageUrl !== undefined) {
    body.append("page_url", input.pageUrl);
  }
  if (input.pageTitle !== undefined) {
    body.append("page_title", input.pageTitle);
  }
  if (input.capturedAt !== undefined) {
    body.append("captured_at", input.capturedAt);
  }
  if (input.metadata !== undefined) {
    body.append("metadata", JSON.stringify(input.metadata));
  }

  return requestJson<UploadGuideBlockScreenshotResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/screenshot-upload?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "POST",
      body,
    },
  );
};

export const reorderGuideBlocks = async (
  projectId: string,
  guideId: string,
  blockIds: string[],
  expectedWorkingDraftVersion: number,
  projectVersionId: string,
): Promise<GuideBlocksResponse> =>
  requestJson<GuideBlocksResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/reorder?project_version_id=${encodeURIComponent(projectVersionId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        block_ids: blockIds,
        expected_working_draft_version: expectedWorkingDraftVersion,
      }),
    },
  );

export const deleteGuideBlock = async (
  projectId: string,
  guideId: string,
  blockId: string,
  expectedWorkingDraftVersion: number,
  projectVersionId: string,
): Promise<GuideWorkingDraftMutationResponse> =>
  requestJson<GuideWorkingDraftMutationResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}?project_version_id=${encodeURIComponent(projectVersionId)}&expected_working_draft_version=${expectedWorkingDraftVersion}`,
    {
      method: "DELETE",
    },
  );
