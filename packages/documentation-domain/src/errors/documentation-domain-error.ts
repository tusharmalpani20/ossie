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
  | "documentation_path_invalid"
  | "documentation_redirect_cycle"
  | "documentation_revision_invalid"
  | "documentation_rollback_invalid";

export class DocumentationDomainError extends Error {
  readonly code: DocumentationDomainErrorCode;

  constructor(code: DocumentationDomainErrorCode, message: string) {
    super(message);
    this.name = "DocumentationDomainError";
    this.code = code;
  }
}
