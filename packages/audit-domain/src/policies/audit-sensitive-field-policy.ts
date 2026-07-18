import { AuditDomainError } from "../errors/audit-domain-error";

const forbidden_fragments = [
  "password",
  "secret",
  "token",
  "cookie",
  "authorization",
  "api_key",
  "apikey",
  "session",
  "invite",
  "search_text",
  "typed_value",
  "content",
  "payload",
];

export const classify_audit_field = (
  field_name: string,
  scalar_allowlist: readonly string[],
  redacted_allowlist: readonly string[] = [],
): "scalar" | "redacted" => {
  const normalized = field_name.trim().toLowerCase();
  if (!normalized || forbidden_fragments.some((fragment) => normalized.includes(fragment))) {
    throw new AuditDomainError("forbidden_audit_field");
  }
  if (scalar_allowlist.includes(field_name)) {
    return "scalar";
  }
  if (redacted_allowlist.includes(field_name)) {
    return "redacted";
  }
  throw new AuditDomainError("unapproved_audit_field");
};
