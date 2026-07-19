export class AccessDomainError extends Error {
  readonly code: string;

  constructor(code = "access_evidence_unavailable") {
    super(code);
    this.name = "AccessDomainError";
    this.code = code;
  }
}
