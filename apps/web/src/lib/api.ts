import type { CaptureSessionStatus, ProjectRole, ProjectStatus } from "@repo/constants";
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
} from "@repo/types/capture";
import type {
  CreateDemoHotspotInput,
  CreateInteractiveDemoFromCaptureResponse,
  InteractiveDemoDetailResponse,
  InteractiveDemoHotspotCreateResponse,
  InteractiveDemoHotspotListResponse,
  InteractiveDemoHotspotReorderResponse,
  InteractiveDemoHotspotUpdateResponse,
  InteractiveDemoSceneListResponse,
  InteractiveDemoSceneReorderResponse,
  InteractiveDemoSceneUpdateResponse,
  ProjectInteractiveDemoListResponse,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
} from "@repo/types/demo";
import type {
  CreateGuideBlockInput,
  Guide,
  GuideBlockResponse,
  GuideBlocksResponse,
  GuideDetail,
  GuideMarkdownExport,
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
  GuidePublishResult,
  GuidePublishStatusResponse,
  GuideRevokePublishResult,
  InteractiveDemoPublishResult,
  InteractiveDemoPublishStatusResponse,
  PublicPublishLinkResponse,
  RevokePublishResult,
  UpdatePublishAccessInput,
  UpdatePublishPasswordInput,
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
  ProjectVersionListQuery, ProjectVersionListResponse, ProjectVersionResolutionResponse,
  ProjectVersionResponse, ReorderProjectVersionsRequest, SetDefaultProjectVersionRequest,
  UpdateProjectVersionRequest,
} from "@repo/types/project-version";
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
  ProjectInteractiveDemoListResponse,
} from "@repo/types/demo";
export type {
  CaptureSessionCreateResponse,
  ProjectCaptureSessionListResponse,
} from "@repo/types/capture";
export type {
  ProjectGuideListResponse,
} from "@repo/types/guide";
export type {
  ProjectCreateResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  ProjectUpdateResponse,
} from "@repo/types/project";
export type { PublicInstanceStatus } from "@repo/types/instance";
export type { ProjectVersionDetail, ProjectVersionListResponse, ProjectVersionResolutionResponse, ProjectVersionResponse } from "@repo/types/project-version";

export type ApiClientErrorKind = "unauthenticated" | "forbidden" | "not_found" | "validation" | "unknown";

type ApiErrorBody = {
  error?: {
    type?: string;
    message?: string;
  };
};

export type ListProjectsOptions = {
  status?: ProjectStatus;
};

export type ListCaptureSessionsOptions = {
  status?: CaptureSessionStatus;
};

export class ApiClientError extends Error {
  kind: ApiClientErrorKind;
  status: number;
  type: string | null;

  constructor(input: { kind: ApiClientErrorKind; status: number; message: string; type?: string | null }) {
    super(input.message);
    this.name = "ApiClientError";
    this.kind = input.kind;
    this.status = input.status;
    this.type = input.type ?? null;
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
    return await response.json() as ApiErrorBody;
  } catch {
    return {};
  }
};

const requestJson = async <Result>(
  path: string,
  init: RequestInit = {}
): Promise<Result> => {
  const response = await fetch(
    joinUrl(apiBaseUrl(), path),
    {
      ...init,
      credentials: "include",
      headers: {
        accept: "application/json",
        ...init.headers,
      },
    }
  );

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiClientError({
      kind: errorKind(response.status, body.error?.type),
      status: response.status,
      type: body.error?.type ?? null,
      message: body.error?.message ?? "Request failed",
    });
  }

  if (response.status === 204) {
    return undefined as Result;
  }

  return await response.json() as Result;
};

const filenameFromContentDisposition = (contentDisposition: string | null) => {
  const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/i)
    ?? contentDisposition?.match(/filename=([^;]+)/i);
  const filename = filenameMatch?.[1]?.trim();

  return filename || null;
};

const requestBlob = async (
  path: string,
  fallbackFilename: string
): Promise<{ filename: string; blob: Blob }> => {
  const response = await fetch(
    joinUrl(apiBaseUrl(), path),
    {
      credentials: "include",
      headers: {
        accept: "application/zip",
      },
    }
  );

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
    filename: filenameFromContentDisposition(response.headers.get("content-disposition")) ?? fallbackFilename,
    blob: await response.blob(),
  };
};

export const resolveApiAssetUrl = (fileUrl: string, baseUrl = apiBaseUrl()) => (
  joinUrl(baseUrl, fileUrl)
);

export const getCurrentAuth = async (): Promise<AuthResponse> => (
  requestJson<AuthResponse>("/api/v1/authentication/me")
);

export const getPublicInstanceStatus = async (): Promise<PublicInstanceStatus> => (
  requestJson<PublicInstanceStatus>("/api/v1/public/instance")
);

export const completeFirstRunSetup = async (data: {
  owner: FirstRunSetupInput["owner"];
  organization: FirstRunSetupInput["organization"];
}): Promise<FirstRunSetupResponse> => (
  requestJson<FirstRunSetupResponse>("/api/v1/setup/first-run", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  })
);

export const login = async (data: LoginRequest): Promise<AuthResponse> => (
  requestJson<AuthResponse>("/api/v1/authentication/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  })
);

export const logout = async (): Promise<void> => (
  requestJson<void>("/api/v1/authentication/logout", {
    method: "POST",
  })
);

export const listOrganizationMembers = async (): Promise<OrganizationMemberListResponse> => (
  requestJson<OrganizationMemberListResponse>("/api/v1/organization/members")
);

export const listOrganizationInvites = async (): Promise<OrganizationInviteListResponse> => (
  requestJson<OrganizationInviteListResponse>("/api/v1/organization/invites")
);

export const createOrganizationInvite = async (
  input: OrganizationInviteCreateInput
): Promise<OrganizationInviteCreateResponse> => (
  requestJson<OrganizationInviteCreateResponse>("/api/v1/organization/invites", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  })
);

export const revokeOrganizationInvite = async (
  inviteId: string
): Promise<OrganizationInviteUpdateResponse> => (
  requestJson<OrganizationInviteUpdateResponse>(
    `/api/v1/organization/invites/${encodeURIComponent(inviteId)}`,
    {
      method: "DELETE",
    }
  )
);

export const getPublicOrganizationInvite = async (
  token: string
): Promise<PublicOrganizationInviteResponse> => (
  requestJson<PublicOrganizationInviteResponse>(
    `/api/v1/public/invites/${encodeURIComponent(token)}`
  )
);

export const acceptPublicOrganizationInvite = async (
  token: string,
  input: AcceptOrganizationInviteInput
): Promise<AuthResponse> => (
  requestJson<AuthResponse>(
    `/api/v1/public/invites/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const listProjects = async (
  options: ListProjectsOptions = {}
): Promise<ProjectListResponse> => {
  const query = options.status ? `?status=${encodeURIComponent(options.status)}` : "";

  return requestJson<ProjectListResponse>(`/api/v1/projects${query}`);
};

export const listProjectMemberships = async (projectId: string): Promise<ProjectMembershipListResponse> => (
  requestJson(`/api/v1/projects/${encodeURIComponent(projectId)}/memberships`)
);

export const assignProjectMembership = async (
  projectId: string,
  input: { org_user_id: string; role: ProjectRole },
): Promise<ProjectMembershipResponse> => requestJson(
  `/api/v1/projects/${encodeURIComponent(projectId)}/memberships`,
  { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) },
);

export const changeProjectMembershipRole = async (
  projectId: string,
  membershipId: string,
  input: { role: ProjectRole; expected_version: number },
): Promise<ProjectMembershipResponse> => requestJson(
  `/api/v1/projects/${encodeURIComponent(projectId)}/memberships/${encodeURIComponent(membershipId)}`,
  { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) },
);

export const removeProjectMembership = async (
  projectId: string,
  membershipId: string,
  expectedVersion: number,
): Promise<void> => requestJson(
  `/api/v1/projects/${encodeURIComponent(projectId)}/memberships/${encodeURIComponent(membershipId)}?expected_version=${expectedVersion}`,
  { method: "DELETE" },
);

export const createProject = async (
  input: CreateProjectInput
): Promise<ProjectCreateResponse> => (
  requestJson<ProjectCreateResponse>("/api/v1/projects", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  })
);

export const getProject = async (
  projectId: string
): Promise<ProjectDetailResponse> => (
  requestJson<ProjectDetailResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}`
  )
);

export const updateProject = async (
  projectId: string,
  input: UpdateProjectInput
): Promise<ProjectUpdateResponse> => (
  requestJson<ProjectUpdateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

const projectVersionsUrl = (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/versions`;
export const listProjectVersions = (projectId: string, query: ProjectVersionListQuery = {}): Promise<ProjectVersionListResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}${query.status ? `?status=${encodeURIComponent(query.status)}` : ""}`);
export const resolveProjectVersion = (projectId: string, slug: string): Promise<ProjectVersionResolutionResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}/resolve/${encodeURIComponent(slug)}`);
export const getProjectVersion = (projectId: string, id: string): Promise<ProjectVersionResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}`);
export const createProjectVersion = (projectId: string, data: CreateProjectVersionRequest): Promise<ProjectVersionResponse> =>
  requestJson(projectVersionsUrl(projectId), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
export const updateProjectVersion = (projectId: string, id: string, data: UpdateProjectVersionRequest): Promise<ProjectVersionResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
export const reorderProjectVersions = (projectId: string, data: ReorderProjectVersionsRequest): Promise<ProjectVersionListResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}/order`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
export const archiveProjectVersion = (projectId: string, id: string, expected_version: number): Promise<ProjectVersionResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}/archive`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expected_version }) });
export const restoreProjectVersion = (projectId: string, id: string, expected_version: number): Promise<ProjectVersionResponse> =>
  requestJson(`${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}/restore`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ expected_version }) });
export const setDefaultProjectVersion = (projectId: string, id: string, data: SetDefaultProjectVersionRequest): Promise<{ project: import("@repo/types/project").Project; project_version: import("@repo/types/project-version").ProjectVersionDetail }> =>
  requestJson(`${projectVersionsUrl(projectId)}/${encodeURIComponent(id)}/set-default`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });

export const getCaptureSessionDetail = async (
  projectId: string,
  captureSessionId: string
): Promise<CaptureSessionDetail> => {
  return requestJson<CaptureSessionDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/detail`
  );
};

export const listProjectCaptureSessions = async (
  projectId: string,
  options: ListCaptureSessionsOptions = {}
): Promise<ProjectCaptureSessionListResponse> => {
  const query = options.status ? `?status=${encodeURIComponent(options.status)}` : "";

  return requestJson<ProjectCaptureSessionListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions${query}`
  );
};

export const createProjectCaptureSession = async (
  projectId: string,
  input: CreateCaptureSessionInput
): Promise<CaptureSessionCreateResponse> => (
  requestJson<CaptureSessionCreateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

const appendOptionalFormValue = (formData: FormData, key: string, value?: string | null) => {
  if (value !== undefined && value !== null) {
    formData.append(key, value);
  }
};

export const uploadCaptureSessionAsset = async (
  projectId: string,
  captureSessionId: string,
  input: UploadCaptureAssetInput
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
    }
  );
};

export const createCaptureSessionEvent = async (
  projectId: string,
  captureSessionId: string,
  input: CreateCaptureEventInput
): Promise<CreateCaptureEventResponse> => (
  requestJson<CreateCaptureEventResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const reorderCaptureSessionEvents = async (
  projectId: string,
  captureSessionId: string,
  input: ReorderCaptureEventsInput
): Promise<ReorderCaptureEventsResponse> => (
  requestJson<ReorderCaptureEventsResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events/order`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const updateCaptureSessionEvent = async (
  projectId: string,
  captureSessionId: string,
  eventId: string,
  input: UpdateCaptureEventInput
): Promise<UpdateCaptureEventResponse> => (
  requestJson<UpdateCaptureEventResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const getGuideDetail = async (
  projectId: string,
  guideId: string
): Promise<GuideDetail> => (
  requestJson<GuideDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}`
  )
);

export const exportGuideMarkdown = async (
  projectId: string,
  guideId: string
): Promise<GuideMarkdownExport> => (
  requestJson<GuideMarkdownExport>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/export/markdown`
  )
);

export const exportGuideHtmlZip = async (
  projectId: string,
  guideId: string
): Promise<{ filename: string; blob: Blob }> => (
  requestBlob(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/export/html.zip`,
    "guide-html-export.zip"
  )
);

export const getGuidePublishStatus = async (
  projectId: string,
  guideId: string
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish`
  )
);

export const getInteractiveDemoPublishStatus = async (
  projectId: string,
  interactiveDemoId: string
): Promise<InteractiveDemoPublishStatusResponse> => (
  requestJson<InteractiveDemoPublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish`
  )
);

export const publishGuide = async (
  projectId: string,
  guideId: string
): Promise<GuidePublishResult> => (
  requestJson<GuidePublishResult>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish`,
    {
      method: "POST",
    }
  )
);

export const publishInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string
): Promise<InteractiveDemoPublishResult> => (
  requestJson<InteractiveDemoPublishResult>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish`,
    {
      method: "POST",
    }
  )
);

export const revokeGuidePublishLink = async (
  projectId: string,
  guideId: string
): Promise<GuideRevokePublishResult> => (
  requestJson<GuideRevokePublishResult>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish`,
    {
      method: "DELETE",
    }
  )
);

export const revokeInteractiveDemoPublishLink = async (
  projectId: string,
  interactiveDemoId: string
): Promise<RevokePublishResult> => (
  requestJson<RevokePublishResult>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish`,
    {
      method: "DELETE",
    }
  )
);

export const updateGuidePublishAccess = async (
  projectId: string,
  guideId: string,
  input: UpdatePublishAccessInput
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish/access`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const updateInteractiveDemoPublishAccess = async (
  projectId: string,
  interactiveDemoId: string,
  input: UpdatePublishAccessInput
): Promise<InteractiveDemoPublishStatusResponse> => (
  requestJson<InteractiveDemoPublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish/access`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const updateGuidePublishPassword = async (
  projectId: string,
  guideId: string,
  input: UpdatePublishPasswordInput
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish/password`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const updateInteractiveDemoPublishPassword = async (
  projectId: string,
  interactiveDemoId: string,
  input: UpdatePublishPasswordInput
): Promise<InteractiveDemoPublishStatusResponse> => (
  requestJson<InteractiveDemoPublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish/password`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const getPublicPublishLink = async (
  slug: string,
  surface: "reader" | "embed" = "reader"
): Promise<PublicPublishLinkResponse> => (
  requestJson<PublicPublishLinkResponse>(
    `/api/v1/public/publish-links/${encodeURIComponent(slug)}`,
    { headers: { "X-Ossie-Access-Surface": `public_${surface}` } }
  )
);

export const createPublicPublishViewerSession = async (
  slug: string,
  input: { password: string },
  surface: "reader" | "embed" = "reader"
): Promise<void> => (
  requestJson<void>(
    `/api/v1/public/publish-links/${encodeURIComponent(slug)}/viewer-sessions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Ossie-Access-Surface": `public_${surface}`,
      },
      body: JSON.stringify(input),
    }
  )
);

export const listComplianceEvents = async (input: {
  kind?: ComplianceKind;
  projectId?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<ComplianceEventsResponse> => {
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
): Promise<ComplianceAuditEventDetailResponse> => (
  requestJson<ComplianceAuditEventDetailResponse>(
    `/api/v1/organization/compliance/audit-events/${encodeURIComponent(auditEventId)}`,
  )
);

export const listProjectComplianceEvents = async (projectId: string, input: {
  kind?: ComplianceKind; cursor?: string; limit?: number;
} = {}): Promise<ComplianceEventsResponse> => {
  const query = new URLSearchParams();
  if (input.kind && input.kind !== "all") query.set("kind", input.kind);
  if (input.cursor) query.set("cursor", input.cursor);
  if (input.limit) query.set("limit", String(input.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return requestJson(`/api/v1/projects/${encodeURIComponent(projectId)}/compliance/events${suffix}`);
};

export const getProjectComplianceAuditEvent = async (
  projectId: string,
  auditEventId: string,
): Promise<ComplianceAuditEventDetailResponse> => requestJson(
  `/api/v1/projects/${encodeURIComponent(projectId)}/compliance/audit-events/${encodeURIComponent(auditEventId)}`,
);

export const listProjectActivity = async (projectId: string, input: {
  cursor?: string; limit?: number;
} = {}): Promise<ProjectActivityResponse> => {
  const query = new URLSearchParams();
  if (input.cursor) query.set("cursor", input.cursor);
  if (input.limit) query.set("limit", String(input.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return requestJson(`/api/v1/projects/${encodeURIComponent(projectId)}/activity${suffix}`);
};

export const listProjectGuides = async (
  projectId: string
): Promise<ProjectGuideListResponse> => (
  requestJson<ProjectGuideListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides`
  )
);

export const listProjectScreenshotAssets = async (
  projectId: string
): Promise<ProjectScreenshotAssetListResponse> => (
  requestJson<ProjectScreenshotAssetListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-assets?asset_type=screenshot`
  )
);

export const createGuideFromCaptureSession = async (
  projectId: string,
  captureSessionId: string,
  data: {
    title: string;
    description?: string | null;
  }
): Promise<GuideDetail> => (
  requestJson<GuideDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/from-capture-session/${encodeURIComponent(captureSessionId)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const createInteractiveDemoFromCaptureSession = async (
  projectId: string,
  captureSessionId: string,
  data: {
    title?: string;
    description?: string | null;
  } = {}
): Promise<CreateInteractiveDemoFromCaptureResponse> => (
  requestJson<CreateInteractiveDemoFromCaptureResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/interactive-demos`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const listProjectInteractiveDemos = async (
  projectId: string
): Promise<ProjectInteractiveDemoListResponse> => (
  requestJson<ProjectInteractiveDemoListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos`
  )
);

export const getInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string
): Promise<InteractiveDemoDetailResponse> => (
  requestJson<InteractiveDemoDetailResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}`
  )
);

export const updateInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string,
  data: UpdateInteractiveDemoInput
): Promise<InteractiveDemoDetailResponse> => (
  requestJson<InteractiveDemoDetailResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const archiveInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string
): Promise<void> => (
  requestJson<void>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}`,
    {
      method: "DELETE",
    }
  )
);

export const listInteractiveDemoScenes = async (
  projectId: string,
  interactiveDemoId: string
): Promise<InteractiveDemoSceneListResponse> => (
  requestJson<InteractiveDemoSceneListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes`
  )
);

export const updateInteractiveDemoScene = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  data: UpdateDemoSceneInput
): Promise<InteractiveDemoSceneUpdateResponse> => (
  requestJson<InteractiveDemoSceneUpdateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/${encodeURIComponent(sceneId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const reorderInteractiveDemoScenes = async (
  projectId: string,
  interactiveDemoId: string,
  sceneIds: string[]
): Promise<InteractiveDemoSceneReorderResponse> => (
  requestJson<InteractiveDemoSceneReorderResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/order`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scene_ids: sceneIds,
      }),
    }
  )
);

export const deleteInteractiveDemoScene = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string
): Promise<void> => (
  requestJson<void>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/${encodeURIComponent(sceneId)}`,
    {
      method: "DELETE",
    }
  )
);

const demoHotspotsPath = (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string
) => (
  `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/${encodeURIComponent(sceneId)}/hotspots`
);

export const createInteractiveDemoHotspot = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  data: CreateDemoHotspotInput
): Promise<InteractiveDemoHotspotCreateResponse> => (
  requestJson<InteractiveDemoHotspotCreateResponse>(
    demoHotspotsPath(projectId, interactiveDemoId, sceneId),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const listInteractiveDemoHotspots = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string
): Promise<InteractiveDemoHotspotListResponse> => (
  requestJson<InteractiveDemoHotspotListResponse>(
    demoHotspotsPath(projectId, interactiveDemoId, sceneId)
  )
);

export const updateInteractiveDemoHotspot = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  hotspotId: string,
  data: UpdateDemoHotspotInput
): Promise<InteractiveDemoHotspotUpdateResponse> => (
  requestJson<InteractiveDemoHotspotUpdateResponse>(
    `${demoHotspotsPath(projectId, interactiveDemoId, sceneId)}/${encodeURIComponent(hotspotId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const reorderInteractiveDemoHotspots = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  hotspotIds: string[]
): Promise<InteractiveDemoHotspotReorderResponse> => (
  requestJson<InteractiveDemoHotspotReorderResponse>(
    `${demoHotspotsPath(projectId, interactiveDemoId, sceneId)}/order`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        hotspot_ids: hotspotIds,
      }),
    }
  )
);

export const deleteInteractiveDemoHotspot = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  hotspotId: string
): Promise<void> => (
  requestJson<void>(
    `${demoHotspotsPath(projectId, interactiveDemoId, sceneId)}/${encodeURIComponent(hotspotId)}`,
    {
      method: "DELETE",
    }
  )
);

export const updateGuide = async (
  projectId: string,
  guideId: string,
  data: {
    title?: string;
    description?: string | null;
    status?: Guide["status"];
  }
): Promise<UpdateGuideResponse> => (
  requestJson<UpdateGuideResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const updateGuideStep = async (
  projectId: string,
  guideId: string,
  stepId: string,
  data: {
    title?: string;
    body?: string | null;
  }
): Promise<UpdateGuideStepResponse> => (
  requestJson<UpdateGuideStepResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/steps/${encodeURIComponent(stepId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const createGuideBlock = async (
  projectId: string,
  guideId: string,
  data: CreateGuideBlockInput
): Promise<GuideBlocksResponse> => (
  requestJson<GuideBlocksResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const updateGuideBlock = async (
  projectId: string,
  guideId: string,
  blockId: string,
  data: UpdateGuideBlockInput
): Promise<GuideBlockResponse> => (
  requestJson<GuideBlockResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const updateGuideBlockScreenshot = async (
  projectId: string,
  guideId: string,
  blockId: string,
  data: UpdateGuideBlockScreenshotInput
): Promise<GuideBlockResponse> => (
  requestJson<GuideBlockResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/screenshot`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const updateGuideBlockAnnotations = async (
  projectId: string,
  guideId: string,
  blockId: string,
  data: UpdateGuideBlockAnnotationsInput
): Promise<GuideBlockResponse> => (
  requestJson<GuideBlockResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/annotations`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const uploadGuideBlockScreenshot = async (
  projectId: string,
  guideId: string,
  blockId: string,
  input: UploadGuideBlockScreenshotInput
): Promise<UploadGuideBlockScreenshotResponse> => {
  const body = new FormData();
  body.append("file", input.file);

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
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/screenshot-upload`,
    {
      method: "POST",
      body,
    }
  );
};

export const reorderGuideBlocks = async (
  projectId: string,
  guideId: string,
  blockIds: string[]
): Promise<GuideBlocksResponse> => (
  requestJson<GuideBlocksResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/reorder`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        block_ids: blockIds,
      }),
    }
  )
);

export const deleteGuideBlock = async (
  projectId: string,
  guideId: string,
  blockId: string
): Promise<void> => (
  requestJson<void>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}`,
    {
      method: "DELETE",
    }
  )
);
