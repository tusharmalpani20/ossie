import pg from "pg";
import { get_maintenance_admin_config } from "../config/maintenance-database.config";

type ProvisionClient = {
  query(
    sql: string,
    values?: unknown[],
  ): Promise<{
    rowCount: number | null;
    rows: Array<{ statement?: string; maintenance_member?: boolean }>;
  }>;
};

export const assert_runtime_role_provisioning_allowed = (
  env: NodeJS.ProcessEnv = process.env,
) => {
  if (env.NODE_ENV === "production")
    throw new Error("Runtime role provisioning is disabled in production");
  if (
    !env.DB_USER ||
    !env.DB_PASSWORD ||
    !env.DB_MAINTENANCE_USER ||
    env.DB_USER === env.DB_MAINTENANCE_USER
  ) {
    throw new Error("Distinct runtime role credentials must be defined");
  }
  return { user: env.DB_USER, password: env.DB_PASSWORD };
};

export const provision_runtime_role = async (
  client: ProvisionClient,
  env: NodeJS.ProcessEnv = process.env,
) => {
  const runtime = assert_runtime_role_provisioning_allowed(env);
  const existing = await client.query(
    "SELECT 1 FROM pg_roles WHERE rolname = $1",
    [runtime.user],
  );
  if (existing.rowCount) {
    const membership = await client.query(
      "SELECT pg_has_role($1::text, $2::text, 'MEMBER') AS maintenance_member",
      [runtime.user, env.DB_MAINTENANCE_USER],
    );
    if (membership.rows[0]?.maintenance_member) {
      throw new Error(
        "Runtime database role must not belong to the maintenance role",
      );
    }
  }
  const format_sql = existing.rowCount
    ? "SELECT format('ALTER ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT', $1::text, $2::text) AS statement"
    : "SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT', $1::text, $2::text) AS statement";
  const formatted = await client.query(format_sql, [
    runtime.user,
    runtime.password,
  ]);
  const statement = formatted.rows[0]?.statement;
  if (!statement)
    throw new Error("Runtime role provisioning statement could not be built");
  await client.query(statement);
};

const run = async () => {
  const client = new pg.Client(get_maintenance_admin_config());
  await client.connect();
  try {
    await provision_runtime_role(client, process.env);
  } finally {
    await client.end();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(
      "Runtime role provisioning failed",
      error instanceof Error ? error.message : "unknown_error",
    );
    process.exitCode = 1;
  });
}
