import {
  validate_audit_mutation_context,
  type AuditMutationContext,
} from "./audit-context";
import { AuditDomainError } from "@repo/audit-domain";

type TransactionClient = {
  query(sql: string, values?: unknown[]): Promise<unknown>;
  release(): void;
};

type TransactionPool = {
  connect(): Promise<TransactionClient>;
};

export const run_audited_mutation = async <Result, Event>(input: {
  pool: TransactionPool;
  event_id: string;
  context: AuditMutationContext;
  execute: (client: TransactionClient) => Promise<Result>;
  build_event: (result: Result) => Event;
  write_audit_event: (client: TransactionClient, event: Event) => Promise<void>;
}): Promise<Result> => {
  const mutation_context = validate_audit_mutation_context({
    event_id: input.event_id,
    ...input.context,
  });
  const client = await input.pool.connect();
  let committing = false;
  try {
    await client.query("BEGIN");
    for (const [name, value] of [
      ["ossie.audit_event_id", mutation_context.event_id],
      ["ossie.audit_organization_id", mutation_context.organization_id],
      ["ossie.audit_action", mutation_context.action],
      ["ossie.audit_command", mutation_context.command],
    ]) {
      await client.query("SELECT set_config($1, $2, true)", [name, value]);
    }
    const result = await input.execute(client);
    await input.write_audit_event(client, input.build_event(result));
    committing = true;
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the stable mutation failure rather than a secondary rollback error.
    }
    if (
      committing
      || (typeof error === "object" && error !== null && "code" in error && error.code === "23514")
    ) {
      throw new AuditDomainError("audit_guard_failed", "internal");
    }
    throw error;
  } finally {
    client.release();
  }
};
