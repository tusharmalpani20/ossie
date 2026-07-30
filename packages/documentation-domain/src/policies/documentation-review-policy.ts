import { DOCUMENTATION_REVIEW_REASON_MAX } from "@repo/constants";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

export type DocumentationReviewStoredStatus =
  | "open"
  | "approved"
  | "rejected"
  | "canceled"
  | "superseded";

export type DocumentationReviewGateOutcome =
  | "not_required"
  | "approval_missing"
  | "approval_pending"
  | "approved";

export const normalize_documentation_review_reason = (
  input: string,
  minimumCodePoints = 0,
) => {
  const value = input.replace(/\r\n?/gu, "\n").normalize("NFC").trim();
  if (
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value) ||
    Array.from(value).length < minimumCodePoints ||
    Array.from(value).length > DOCUMENTATION_REVIEW_REASON_MAX
  )
    throw new DocumentationDomainError(
      "documentation_review_invalid",
      "Review reason is outside the accepted plain-text bounds",
    );
  return value;
};

export const documentation_review_threshold_satisfied = (input: {
  required_approvals: number;
  require_maintainer_approval: boolean;
  valid_approval_count: number;
  valid_maintainer_approval_count: number;
}) =>
  input.valid_approval_count >= input.required_approvals &&
  (!input.require_maintainer_approval ||
    input.valid_maintainer_approval_count >= 1);

export const evaluate_documentation_review_gate = (input: {
  policy_mode: "optional" | "approval_required";
  required_approvals: number;
  require_maintainer_approval: boolean;
  valid_approval_count: number;
  valid_maintainer_approval_count: number;
  has_governing_request: boolean;
}): DocumentationReviewGateOutcome => {
  if (input.policy_mode === "optional") return "not_required";
  if (!input.has_governing_request) return "approval_missing";
  return documentation_review_threshold_satisfied(input)
    ? "approved"
    : "approval_pending";
};

export const documentation_review_effective_status = (
  storedStatus: DocumentationReviewStoredStatus,
  currentApprovalValid: boolean,
) =>
  storedStatus === "approved" && !currentApprovalValid
    ? ("invalidated" as const)
    : storedStatus;

export const assert_documentation_review_transition = (
  from: DocumentationReviewStoredStatus,
  to: Exclude<DocumentationReviewStoredStatus, "open">,
) => {
  if (from !== "open")
    throw new DocumentationDomainError(
      "documentation_review_transition_invalid",
      "Only an open Review Request can be closed",
    );
  return to;
};

export const summarize_documentation_revision_change = (input: {
  pages_added: number;
  pages_changed: number;
  pages_removed: number;
  snippets_changed: number;
  assets_changed: number;
  navigation_changed: boolean;
  openapi_changed: boolean;
}) => ({ ...input });
