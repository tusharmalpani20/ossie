import { AuditDomainError } from "@repo/audit-domain";

export type AuditMutationContext = {
  organization_id: string;
  action: string;
  command: string;
};

export type ValidatedAuditMutationContext = AuditMutationContext & {
  event_id: string;
};

const valid_scalar = (value: string, maximum: number) =>
  Boolean(value)
  && value.length <= maximum
  && ![...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

export const validate_audit_mutation_context = (
  input: ValidatedAuditMutationContext,
) => {
  if (
    !valid_scalar(input.event_id, 26)
    || !valid_scalar(input.organization_id, 26)
    || !valid_scalar(input.action, 120)
    || !valid_scalar(input.command, 120)
  ) {
    throw new AuditDomainError("invalid_audit_mutation_context", "internal");
  }
  return input;
};
