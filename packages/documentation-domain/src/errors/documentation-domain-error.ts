export type DocumentationDomainErrorCode =
  | "documentation_comment_invalid"
  | "documentation_comment_transition_invalid"
  | "documentation_content_unsafe"
  | "documentation_content_limit_exceeded"
  | "documentation_table_invalid"
  | "documentation_tabs_invalid"
  | "documentation_snippet_name_invalid"
  | "documentation_snippet_nested"
  | "documentation_asset_name_invalid"
  | "documentation_asset_source_unsupported"
  | "documentation_asset_source_unavailable"
  | "documentation_artifact_publication_not_found"
  | "documentation_artifact_publication_type_mismatch"
  | "documentation_navigation_invalid"
  | "documentation_openapi_invalid"
  | "documentation_package_invalid"
  | "documentation_markdown_invalid"
  | "documentation_carry_forward_invalid"
  | "documentation_carry_forward_limit_exceeded"
  | "documentation_lifecycle_conflict"
  | "documentation_path_invalid"
  | "documentation_redirect_cycle"
  | "documentation_revision_invalid"
  | "documentation_rollback_invalid"
  | "documentation_review_invalid"
  | "documentation_review_transition_invalid"
  | "documentation_review_gate_unsatisfied"
  | "documentation_review_approval_required"
  | "documentation_review_approval_invalidated"
  | "documentation_review_override_invalid"
  | "documentation_try_it_invalid"
  | "documentation_try_it_disabled"
  | "documentation_try_it_stale_source"
  | "documentation_try_it_origin_invalid"
  | "documentation_try_it_origin_not_allowed"
  | "documentation_try_it_origin_resolution_unsafe"
  | "documentation_try_it_operation_not_allowed"
  | "documentation_try_it_operation_unsupported"
  | "documentation_try_it_policy_conflict"
  | "documentation_try_it_link_incompatible"
  | "documentation_try_it_configuration_expired"
  | "documentation_try_it_attempt_invalid"
  | "documentation_try_it_unavailable"
  | "documentation_organization_quota_exceeded"
  | "documentation_publication_capacity_exceeded"
  | "documentation_publication_timed_out"
  | "documentation_rebuild_capacity_exceeded"
  | "documentation_projection_rebuild_invalid"
  | "documentation_projection_rebuild_failed"
  | "documentation_discovery_policy_invalid";

export class DocumentationDomainError extends Error {
  readonly code: DocumentationDomainErrorCode;

  constructor(code: DocumentationDomainErrorCode, message: string) {
    super(message);
    this.name = "DocumentationDomainError";
    this.code = code;
  }
}
