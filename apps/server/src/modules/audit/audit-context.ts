import {
  AuditDomainError,
  type AuditActorType,
  type AuditSourceType,
} from "@repo/audit-domain";

export type AuditMutationContext = {
  organization_id: string;
  actor_type: AuditActorType;
  source_type: AuditSourceType;
};

export type ValidatedAuditMutationContext = AuditMutationContext & {
  event_id: string;
  action: string;
  command: string;
};

const valid_scalar = (value: string, maximum: number) =>
  Boolean(value) &&
  value.length <= maximum &&
  ![...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

export const validate_audit_mutation_context = (
  input: ValidatedAuditMutationContext,
) => {
  if (
    !valid_scalar(input.event_id, 26) ||
    !valid_scalar(input.organization_id, 26) ||
    !valid_scalar(input.action, 120) ||
    !valid_scalar(input.command, 120) ||
    !valid_scalar(input.actor_type, 40) ||
    !valid_scalar(input.source_type, 40)
  ) {
    throw new AuditDomainError("invalid_audit_mutation_context", "internal");
  }
  return input;
};
