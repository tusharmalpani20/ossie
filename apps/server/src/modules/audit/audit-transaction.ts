import type { AuditMutationContext } from "./audit-context";

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
  const client = await input.pool.connect();
  try {
    await client.query("BEGIN");
    for (const [name, value] of [
      ["ossie.audit_event_id", input.event_id],
      ["ossie.audit_organization_id", input.context.organization_id],
      ["ossie.audit_action", input.context.action],
      ["ossie.audit_command", input.context.command],
    ]) {
      await client.query("SELECT set_config($1, $2, true)", [name, value]);
    }
    const result = await input.execute(client);
    await input.write_audit_event(client, input.build_event(result));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
