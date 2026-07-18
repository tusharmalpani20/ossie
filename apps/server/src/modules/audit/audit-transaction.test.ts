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

  it("rejects invalid mutation context before acquiring a client", async () => {
    const connect = vi.fn();
    const execute = vi.fn();
    await expect(run_audited_mutation({
      pool: { connect },
      event_id: "invalid-event-id-that-is-too-long",
      context: {
        organization_id: "org-1",
        action: "project.created",
        command: "project.create",
      },
      execute,
      build_event: () => ({}),
      write_audit_event: async () => undefined,
    })).rejects.toThrow(/invalid_audit_mutation_context/);
    expect(connect).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("replaces deferred guard failures with a stable non-sensitive error", async () => {
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql === "COMMIT") {
          throw Object.assign(new Error("guard detail secret-value"), {
            code: "23514",
          });
        }
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    await expect(run_audited_mutation({
      pool: { connect: vi.fn(async () => client) },
      event_id: "event-1",
      context: {
        organization_id: "org-1",
        action: "project.created",
        command: "project.create",
      },
      execute: async () => "created",
      build_event: () => ({ id: "event-1" }),
      write_audit_event: async () => undefined,
    })).rejects.toThrow(/^audit_guard_failed$/u);
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalledOnce();
  });
});
