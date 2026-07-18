import { describe, expect, it, vi } from "vitest";
import { run_audited_mutation } from "./audit-transaction";

describe("audit transaction", () => {
  it("commits the mutation and evidence through one client", async () => {
    const queries: Array<{ sql: string; values?: unknown[] }> = [];
    const client = {
      query: vi.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql, values });
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const write = vi.fn(async () => undefined);
    const result = await run_audited_mutation({
      pool: { connect: vi.fn(async () => client) },
      event_id: "event-1",
      context: {
        organization_id: "org-1",
        action: "project.created",
        command: "project.create",
      },
      execute: async (transaction) => {
        await transaction.query("INSERT business");
        return "created";
      },
      build_event: () => ({ id: "event-1" }),
      write_audit_event: write,
    });

    expect(result).toBe("created");
    expect(queries.map(({ sql }) => sql)).toEqual([
      "BEGIN",
      expect.stringContaining("set_config"),
      expect.stringContaining("set_config"),
      expect.stringContaining("set_config"),
      expect.stringContaining("set_config"),
      "INSERT business",
      "COMMIT",
    ]);
    expect(write).toHaveBeenCalledWith(client, { id: "event-1" });
    expect(client.release).toHaveBeenCalledOnce();
  });

  it("rolls back business work when evidence fails", async () => {
    const queries: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        queries.push(sql);
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    await expect(
      run_audited_mutation({
        pool: { connect: vi.fn(async () => client) },
        event_id: "event-1",
        context: {
          organization_id: "org-1",
          action: "project.created",
          command: "project.create",
        },
        execute: async () => "created",
        build_event: () => ({ id: "event-1" }),
        write_audit_event: async () => {
          throw new Error("audit failed");
        },
      }),
    ).rejects.toThrow("audit failed");
    expect(queries.at(-1)).toBe("ROLLBACK");
    expect(client.release).toHaveBeenCalledOnce();
  });
});
