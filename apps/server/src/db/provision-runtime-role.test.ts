import { describe, expect, it, vi } from "vitest";
import { provision_runtime_role } from "./provision-runtime-role";

describe("runtime role provisioning", () => {
  it("refuses production credential mutation", async () => {
    await expect(
      provision_runtime_role(
        { query: vi.fn() },
        {
          NODE_ENV: "production",
          DB_USER: "runtime",
          DB_PASSWORD: "runtime-password",
          DB_MAINTENANCE_USER: "maintenance",
        },
      ),
    ).rejects.toThrow(/disabled in production/);
  });

  it("requires the configured maintenance role identity", async () => {
    await expect(provision_runtime_role(
      { query: vi.fn() },
      {
        NODE_ENV: "test",
        DB_USER: "runtime",
        DB_PASSWORD: "runtime-password",
      },
    )).rejects.toThrow(/Distinct runtime role credentials must be defined/);
  });

  it("keeps the password parameterized while provisioning a distinct test role", async () => {
    const statements: Array<{ sql: string; values?: unknown[] }> = [];
    const client = {
      query: vi.fn(async (sql: string, values?: unknown[]) => {
        statements.push({ sql, values });
        if (sql.startsWith("SELECT 1 FROM pg_roles"))
          return { rowCount: 0, rows: [] };
        if (sql.startsWith("SELECT format"))
          return {
            rowCount: 1,
            rows: [{ statement: 'CREATE ROLE "runtime"' }],
          };
        return { rowCount: 0, rows: [] };
      }),
    };

    await provision_runtime_role(client, {
      NODE_ENV: "test",
      DB_USER: "runtime",
      DB_PASSWORD: "runtime-password",
      DB_MAINTENANCE_USER: "maintenance",
    });

    expect(statements.some(({ sql }) => sql.includes("runtime-password"))).toBe(
      false,
    );
    expect(
      statements.find(({ sql }) => sql.startsWith("SELECT format"))?.values,
    ).toContain("runtime-password");
    expect(statements.at(-1)?.sql).toBe('CREATE ROLE "runtime"');
  });

  it("refuses to mutate an existing runtime role that belongs to maintenance", async () => {
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql.startsWith("SELECT 1 FROM pg_roles")) {
          return { rowCount: 1, rows: [] };
        }
        if (sql.includes("pg_has_role")) {
          return { rowCount: 1, rows: [{ maintenance_member: true }] };
        }
        return { rowCount: 0, rows: [] };
      }),
    };

    await expect(provision_runtime_role(client, {
      NODE_ENV: "test",
      DB_USER: "runtime",
      DB_PASSWORD: "runtime-password",
      DB_MAINTENANCE_USER: "maintenance",
    })).rejects.toThrow(/must not belong to the maintenance role/);
    expect(client.query).toHaveBeenCalledTimes(2);
  });
});
