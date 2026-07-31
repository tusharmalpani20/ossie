const api = () => import.meta.env.VITE_OSSIE_API_URL ?? "";
const sitePath = (projectId: string, versionSlug: string, siteId: string) =>
  `${api()}/api/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation-sites/${encodeURIComponent(siteId)}`;
const versionPath = (projectId: string, versionSlug: string) =>
  `${api()}/api/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}`;

const json = async <T>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      body?.error?.message ??
        `Documentation review failed (${response.status})`,
    );
  return body as T;
};
const mutation = <T>(url: string, method: "POST" | "PATCH", body: unknown) =>
  fetch(url, {
    method,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  }).then((response) => json<T>(response));

export type DocumentationReviewPolicy = {
  id: string;
  site_id: string;
  site_edition_id: string;
  mode: "optional" | "approval_required";
  required_approvals: number;
  require_maintainer_approval: boolean;
  maintainer_org_user_ids: string[];
  version: number;
  updated_at: string;
};
export type DocumentationReviewCandidate = {
  org_user_id: string;
  display_name: string;
  project_role: "project_admin" | "editor" | "viewer";
  is_organization_owner: boolean;
  is_maintainer: boolean;
};
export type DocumentationReviewRequest = {
  id: string;
  site_revision_id: string;
  revision_number: number;
  request_number: number;
  status: "open" | "approved" | "rejected" | "canceled" | "superseded";
  effective_status:
    | "open"
    | "approved"
    | "rejected"
    | "canceled"
    | "superseded"
    | "invalidated";
  required_approvals: number;
  valid_approval_count: number;
  require_maintainer_approval: boolean;
  valid_maintainer_approval_count: number;
  created_by_id: string;
  version: number;
};
export type DocumentationReviewAssignment = {
  id: string;
  reviewer_org_user_id: string;
  reviewer_display_name: string;
  current_access_status: "active" | "revoked" | "disabled";
  is_current_maintainer: boolean;
  decision: { decision: "approve" | "reject"; reason: string | null } | null;
};
export type DocumentationReviewDetail = {
  review_request: DocumentationReviewRequest;
  assignments: DocumentationReviewAssignment[];
  actor_can_decide: boolean;
  change_summary: Record<string, number | boolean>;
  cancellation: { reason: string } | null;
};

export const getDocumentationReviewPolicy = (
  projectId: string,
  versionSlug: string,
  siteId: string,
) =>
  fetch(`${sitePath(projectId, versionSlug, siteId)}/review-policy`, {
    credentials: "include",
  }).then((response) => json<DocumentationReviewPolicy>(response));

export const updateDocumentationReviewPolicy = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  body: {
    expected_policy_version: number;
    mode: "optional" | "approval_required";
    required_approvals: number;
    require_maintainer_approval: boolean;
    maintainer_org_user_ids: string[];
  },
) =>
  mutation<DocumentationReviewPolicy>(
    `${sitePath(projectId, versionSlug, siteId)}/review-policy`,
    "PATCH",
    body,
  );

export const listDocumentationReviewCandidates = (
  projectId: string,
  versionSlug: string,
  siteId: string,
) =>
  fetch(`${sitePath(projectId, versionSlug, siteId)}/review-candidates`, {
    credentials: "include",
  }).then((response) =>
    json<{ candidates: DocumentationReviewCandidate[]; next_cursor: null }>(
      response,
    ),
  );

export const createDocumentationReviewRequest = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  body: {
    site_revision_id: string;
    expected_policy_version: number;
    reviewer_org_user_ids: string[];
  },
) =>
  mutation<{ review_request: DocumentationReviewRequest }>(
    `${sitePath(projectId, versionSlug, siteId)}/reviews`,
    "POST",
    body,
  );

export const getDocumentationReviewGate = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  revisionId: string,
) =>
  fetch(
    `${sitePath(projectId, versionSlug, siteId)}/review-gate?revision_id=${encodeURIComponent(revisionId)}`,
    { credentials: "include" },
  ).then((response) =>
    json<{
      site_revision_id: string;
      policy_mode: "optional" | "approval_required";
      policy_version: number;
      outcome:
        | "not_required"
        | "approval_missing"
        | "approval_pending"
        | "approved"
        | "invalidated";
      override_available_to_actor: boolean;
    }>(response),
  );

export const listDocumentationReviewRequests = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  status = "all",
) =>
  fetch(
    `${sitePath(projectId, versionSlug, siteId)}/reviews?status=${status}&participation=all`,
    { credentials: "include" },
  ).then((response) =>
    json<{ review_requests: DocumentationReviewRequest[]; next_cursor: null }>(
      response,
    ),
  );

export const decideDocumentationReview = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  requestId: string,
  body: {
    expected_review_request_version: number;
    decision: "approve" | "reject";
    reason: string | null;
  },
) =>
  mutation<{ review_request: DocumentationReviewRequest }>(
    `${sitePath(projectId, versionSlug, siteId)}/reviews/${encodeURIComponent(requestId)}/decisions`,
    "POST",
    body,
  );

export const getDocumentationReviewRequest = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  requestId: string,
) =>
  fetch(
    `${sitePath(projectId, versionSlug, siteId)}/reviews/${encodeURIComponent(requestId)}`,
    { credentials: "include" },
  ).then((response) => json<DocumentationReviewDetail>(response));

export const cancelDocumentationReview = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  requestId: string,
  expectedVersion: number,
  reason: string,
) =>
  mutation<{ review_request: DocumentationReviewRequest }>(
    `${sitePath(projectId, versionSlug, siteId)}/reviews/${encodeURIComponent(requestId)}/cancel`,
    "POST",
    { expected_review_request_version: expectedVersion, reason },
  );

export const listDocumentationPublicationReviewEvidence = (
  projectId: string,
  versionSlug: string,
  siteId: string,
) =>
  fetch(
    `${sitePath(projectId, versionSlug, siteId)}/review-publication-evidence?outcome=all`,
    { credentials: "include" },
  ).then((response) =>
    json<{
      evidence: Array<{
        id: string;
        site_revision_id: string;
        operation: "publication" | "rollback";
        outcome: "not_required" | "approved" | "overridden";
        created_at: string;
      }>;
      next_cursor: null;
    }>(response),
  );

export const getDocumentationPublicationReviewEvidence = (
  projectId: string,
  versionSlug: string,
  siteId: string,
  evidenceId: string,
) =>
  fetch(
    `${sitePath(projectId, versionSlug, siteId)}/review-publication-evidence/${encodeURIComponent(evidenceId)}`,
    { credentials: "include" },
  ).then((response) =>
    json<{
      evidence: {
        id: string;
        site_revision_id: string;
        operation: "publication" | "rollback";
        outcome: "not_required" | "approved" | "overridden";
        created_at: string;
      };
      override_reason: string | null;
    }>(response),
  );

export const listDocumentationReviewInbox = (
  projectId: string,
  versionSlug: string,
  status: "unread" | "read" | "all" = "unread",
) =>
  fetch(
    `${versionPath(projectId, versionSlug)}/documentation-review-inbox?status=${status}`,
    { credentials: "include" },
  ).then((response) =>
    json<{
      items: Array<{
        notification: {
          id: string;
          review_request_id: string;
          site_id: string;
          status: "unread" | "read";
          version: number;
          type: string;
        };
        display_context: {
          site_name: string;
          revision_number: number;
          request_number: number;
        };
      }>;
      unread_count: number;
      next_cursor: null;
    }>(response),
  );

export const markDocumentationReviewNotificationRead = (
  projectId: string,
  versionSlug: string,
  notificationId: string,
  expectedVersion: number,
) =>
  mutation(
    `${versionPath(projectId, versionSlug)}/documentation-review-inbox/${encodeURIComponent(notificationId)}/read`,
    "PATCH",
    { expected_version: expectedVersion },
  );
