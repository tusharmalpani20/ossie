import { AuditDomainError } from "../errors/audit-domain-error";
import {
  AUDIT_ACTOR_TYPES,
  AUDIT_OPERATIONS,
  AUDIT_SOURCE_TYPES,
  type AuditActorType,
  type AuditOperation,
  type AuditSourceType,
} from "../types/audit-evidence";

export type AuditSqlOperation = "INSERT" | "UPDATE" | "DELETE";

export type AuditCoveredWrite = {
  table: `${string}.${string}`;
  sql_operation: AuditSqlOperation;
  evidence_operations: readonly AuditOperation[];
  entity_type: string;
};

export type AuditCommandCoverage = {
  command: string;
  action: string;
  routes: readonly string[];
  source_types: readonly AuditSourceType[];
  actor_types: readonly AuditActorType[];
  writes: readonly AuditCoveredWrite[];
  audit_only?: boolean;
};

const identifier = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?$/u;
const command_or_action = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/u;
const route = /^(?:GET|POST|PUT|PATCH|DELETE) \/\S+$/u;
const sql_operations = new Set<AuditSqlOperation>(["INSERT", "UPDATE", "DELETE"]);
const evidence_operations = new Set<string>(AUDIT_OPERATIONS);
const actor_types = new Set<string>(AUDIT_ACTOR_TYPES);
const source_types = new Set<string>(AUDIT_SOURCE_TYPES);

const invalid = (): never => {
  throw new AuditDomainError("invalid_audit_coverage");
};

export const validate_audit_coverage = (
  registrations: readonly AuditCommandCoverage[],
): AuditCommandCoverage[] => {
  const commands = new Set<string>();
  for (const registration of registrations) {
    if (commands.has(registration.command)) {
      throw new AuditDomainError("duplicate_audit_coverage", "conflict");
    }
    commands.add(registration.command);
    if (
      !command_or_action.test(registration.command)
      || !command_or_action.test(registration.action)
      || !registration.routes.every((value) => route.test(value))
      || (registration.writes.length === 0 && registration.audit_only !== true)
      || registration.actor_types.length === 0
      || registration.source_types.length === 0
      || !registration.actor_types.every((value) => actor_types.has(value))
      || !registration.source_types.every((value) => source_types.has(value))
    ) invalid();

    for (const write of registration.writes) {
      if (
        !identifier.test(write.table)
        || !write.table.includes(".")
        || !identifier.test(write.entity_type)
        || !sql_operations.has(write.sql_operation)
        || write.evidence_operations.length === 0
        || !write.evidence_operations.every((value) => evidence_operations.has(value))
        || (write.sql_operation === "INSERT" && !write.evidence_operations.includes("create"))
        || (write.sql_operation === "UPDATE" && !write.evidence_operations.some((value) => value === "update" || value === "delete"))
        || (write.sql_operation === "DELETE" && !write.evidence_operations.includes("delete"))
      ) invalid();
    }
  }
  return [...registrations];
};
