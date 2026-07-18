import { describe, expect, it, vi } from "vitest";
import { run_migration_transaction } from "./migrator";

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
});
