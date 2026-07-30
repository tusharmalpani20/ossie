export type DocumentationDomainErrorCode =
  | "documentation_comment_invalid"
  | "documentation_comment_transition_invalid"
  | "documentation_content_unsafe"
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
