import { describe, expect, it, vi } from "vitest";
import { assert_database_roles, run_migration_transaction } from "./migrator";

describe("migration transaction", () => {
  it("rolls back SQL and history together when logging fails", async () => {
    const queries: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        queries.push(sql);
        if (sql.includes("INSERT INTO db_migration.schema_migrations"))
          throw new Error("log failed");
        return { rows: [] };
      }),
    };

    await expect(
      run_migration_transaction(
        client,
        "015.sql",
        "CREATE SCHEMA audit_schema",
        "up",
      ),
    ).rejects.toThrow("log failed");
    expect(queries).toEqual([
      "BEGIN",
      "CREATE SCHEMA audit_schema",
      expect.stringContaining("INSERT INTO db_migration.schema_migrations"),
      "ROLLBACK",
    ]);
  });

  it("rejects a runtime role that belongs to the maintenance role", async () => {
    const pool = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("FROM pg_roles")) {
          return { rows: [{ role_name: "runtime" }, { role_name: "maintenance" }] };
        }
        if (sql.includes("pg_has_role")) {
          return { rows: [{ current_user: "maintenance", runtime_is_maintenance_member: true }] };
        }
        return { rows: [] };
      }),
    };

    await expect(assert_database_roles(
      pool as never,
      "runtime",
      "maintenance",
    )).rejects.toThrow(/must not belong to the maintenance role/);
  });
});
