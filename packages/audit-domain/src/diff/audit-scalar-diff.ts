import type { AuditStateValue, AuditValueType } from "../types/audit-evidence";
import { normalize_audit_scalar } from "../policies/audit-value-policy";

type Input = {
  value_type: AuditValueType;
  before: unknown;
  after: unknown;
  redact?: boolean;
};

const state_for = (value_type: AuditValueType, value: unknown, redact: boolean): AuditStateValue => {
  if (value === undefined) return { state: "absent" };
  if (value === null) return { state: "null" };
  if (redact) return { state: "redacted" };
  return { state: "value", value: normalize_audit_scalar(value_type, value) };
};

export const build_scalar_diff = (input: Input): { before: AuditStateValue; after: AuditStateValue } | null => {
  const before = state_for(input.value_type, input.before, Boolean(input.redact));
  const after = state_for(input.value_type, input.after, Boolean(input.redact));
  if (JSON.stringify(before) === JSON.stringify(after)) return null;
  return { before, after };
};
