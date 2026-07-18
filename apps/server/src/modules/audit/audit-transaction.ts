import {
  validate_audit_mutation_context,
  type AuditMutationContext,
} from "./audit-context";
import {
  AuditDomainError,
  type AuditCommandCoverage,
} from "@repo/audit-domain";

export type TransactionClient = {
  query(sql: string, values?: unknown[]): Promise<unknown>;
  release(): void;
};

type TransactionPool = {
  connect(): Promise<TransactionClient>;
};

export const run_audited_mutation = async <Result, Event>(input: {
  pool: TransactionPool;
  event_id: string;
  command: AuditCommandCoverage;
  context: AuditMutationContext;
  execute: (client: TransactionClient) => Promise<Result>;
  build_event: (result: Result) => Event | null;
  write_audit_event: (client: TransactionClient, event: Event) => Promise<void>;
}): Promise<Result> => {
  const mutation_context = validate_audit_mutation_context({
    event_id: input.event_id,
    ...input.context,
    action: input.command.action,
    command: input.command.command,
  });
  if (
    !input.command.actor_types.includes(mutation_context.actor_type) ||
    !input.command.source_types.includes(mutation_context.source_type)
  ) {
    throw new AuditDomainError("invalid_audit_command_context", "internal");
  }
  const client = await input.pool.connect();
  try {
    await client.query("BEGIN");
    for (const [name, value] of [
      ["ossie.audit_event_id", mutation_context.event_id],
      ["ossie.audit_organization_id", mutation_context.organization_id],
      ["ossie.audit_action", mutation_context.action],
      ["ossie.audit_command", mutation_context.command],
      ["ossie.audit_actor_type", mutation_context.actor_type],
      ["ossie.audit_source_type", mutation_context.source_type],
    ]) {
      await client.query("SELECT set_config($1, $2, true)", [name, value]);
    }
    const result = await input.execute(client);
    const event = input.build_event(result);
    if (event !== null) await input.write_audit_event(client, event);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the stable mutation failure rather than a secondary rollback error.
    }
    const audit_guard_failure =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23514" &&
      "constraint" in error &&
      typeof error.constraint === "string" &&
      error.constraint.startsWith("ossie_audit_guard_");
    if (audit_guard_failure) {
      throw new AuditDomainError("audit_guard_failed", "internal");
    }
    throw error;
  } finally {
    client.release();
  }
};
