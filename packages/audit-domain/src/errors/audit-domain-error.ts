export type AuditDomainErrorStatusHint = "bad_request" | "conflict" | "internal";

export class AuditDomainError extends Error {
  readonly code: string;
  readonly status_hint: AuditDomainErrorStatusHint;

  constructor(code: string, status_hint: AuditDomainErrorStatusHint = "bad_request") {
    super(code);
    this.name = "AuditDomainError";
    this.code = code;
    this.status_hint = status_hint;
  }
}
