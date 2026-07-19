import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";
import { Umzug, type MigrationParams } from "umzug";
import { create_maintenance_pool } from "../config/maintenance-database.config";
import { render_database_role_identifiers } from "./identifier";

const migrations_path = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "migrations",
);

export const parse_migration_file = (content: string) => ({
  up: content.match(/-- UP:\s*([\s\S]*?)(?=-- DOWN:|$)/iu)?.[1]?.trim() ?? "",
  down: content.match(/-- DOWN:\s*([\s\S]*?)$/iu)?.[1]?.trim() ?? "",
});

type QueryClient = { query(sql: string, values?: unknown[]): Promise<unknown> };

export const run_migration_transaction = async (
  client: QueryClient,
  name: string,
  sql: string,
  direction: "up" | "down",
) => {
  await client.query("BEGIN");
  try {
    await client.query(
      "SELECT set_config('ossie.maintenance_mode', 'off', true)",
    );
    await client.query(sql);
    if (direction === "up") {
      await client.query(
        "INSERT INTO db_migration.schema_migrations (name, executed_at) VALUES ($1, NOW())",
        [name],
      );
    } else {
      await client.query(
        "DELETE FROM db_migration.schema_migrations WHERE name = $1",
        [name],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
};

const ensure_migrations_table = async (pool: Pool) => {
  await pool.query("CREATE SCHEMA IF NOT EXISTS db_migration");
  await pool.query(`CREATE TABLE IF NOT EXISTS db_migration.schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
};

export const assert_database_roles = async (
  pool: Pick<Pool, "query">,
  runtime_role: string,
  maintenance_role: string,
) => {
  if (runtime_role === maintenance_role)
    throw new Error("Runtime and maintenance database roles must be distinct");
  const result = await pool.query<{ role_name: string }>(
    "SELECT rolname AS role_name FROM pg_roles WHERE rolname = ANY($1::text[])",
    [[runtime_role, maintenance_role]],
  );
  const found = new Set(result.rows.map((row) => row.role_name));
  if (!found.has(runtime_role) || !found.has(maintenance_role)) {
    throw new Error(
      "Configured runtime and maintenance database roles must exist",
    );
  }
  const current = await pool.query<{
    current_user: string;
    runtime_is_maintenance_member: boolean;
  }>(
    `SELECT current_user,
      pg_has_role($1::text, $2::text, 'MEMBER') AS runtime_is_maintenance_member`,
    [runtime_role, maintenance_role],
  );
  if (current.rows[0]?.current_user !== maintenance_role) {
    throw new Error("Migrations must run as the configured maintenance role");
  }
  if (current.rows[0]?.runtime_is_maintenance_member) {
    throw new Error(
      "Runtime database role must not belong to the maintenance role",
    );
  }
};

export const create_migrator = (
  pool: Pool,
  roles: { runtime_role: string; maintenance_role: string },
) => {
  const storage = {
    async executed() {
      await ensure_migrations_table(pool);
      const result = await pool.query<{ name: string }>(
        "SELECT name FROM db_migration.schema_migrations ORDER BY executed_at, name",
      );
      return result.rows.map((row) => row.name);
    },
    async logMigration() {},
    async unlogMigration() {},
  };
  return new Umzug({
    migrations: {
      glob: path.join(migrations_path, "*.sql"),
      resolve: (params: MigrationParams<{ pool: Pool }>) => {
        const { name, path: migration_path } = params;
        if (!migration_path)
          throw new Error(`Migration path not found for ${name}`);
        const run = async (direction: "up" | "down") => {
          await assert_database_roles(
            pool,
            roles.runtime_role,
            roles.maintenance_role,
          );
          const content = await fs.readFile(migration_path, "utf8");
          const parsed = parse_migration_file(content);
          const sql = render_database_role_identifiers(
            parsed[direction],
            roles,
          );
          if (!sql)
            throw new Error(
              `No ${direction.toUpperCase()} section found in migration ${name}`,
            );
          const client = await pool.connect();
          try {
            await run_migration_transaction(client, name, sql, direction);
          } finally {
            client.release();
          }
        };
        return { name, up: () => run("up"), down: () => run("down") };
      },
    },
    context: { pool },
    storage,
    logger: console,
  });
};

export const get_migrator = () => {
  const pool = create_maintenance_pool();
  const runtime_role = process.env.DB_USER;
  const maintenance_role = process.env.DB_MAINTENANCE_USER;
  if (!runtime_role || !maintenance_role)
    throw new Error("Database role identifiers must be defined");
  return {
    pool,
    umzug: create_migrator(pool, { runtime_role, maintenance_role }),
  };
};
