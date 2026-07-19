import { describe, expect, it, vi } from "vitest";
import { find_audit_command } from "./audit-coverage-registry";
import { run_audited_mutation } from "./audit-transaction";
import {
  access_request_context,
  run_with_access_request_context,
  set_access_auth_context,
} from "../access/access-request-context";
import type { AuditEvent } from "@repo/audit-domain";

const project_create = find_audit_command("project.create");
const context = {
  organization_id: "org-1",
  actor_type: "org_user" as const,
  source_type: "web" as const,
};

describe("audit transaction", () => {
  it("derives command context and commits mutation/evidence through one client", async () => {
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
      command: project_create,
      context,
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
      ...Array.from({ length: 6 }, () => expect.stringContaining("set_config")),
      "INSERT business",
      "COMMIT",
    ]);
    expect(queries.slice(1, 7).map(({ values }) => values)).toEqual([
      ["ossie.audit_event_id", "event-1"],
      ["ossie.audit_organization_id", "org-1"],
      ["ossie.audit_action", "project.created"],
      ["ossie.audit_command", "project.create"],
      ["ossie.audit_actor_type", "org_user"],
      ["ossie.audit_source_type", "web"],
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
        command: project_create,
        context,
        execute: async () => "created",
        build_event: () => ({ id: "event-1" }),
        write_audit_event: async () => {
          throw new Error("audit failed");
        },
      }),
    ).rejects.toThrow("audit failed");
    expect(queries.at(-1)).toBe("ROLLBACK");
  });

  it("rejects invalid mutation context before acquiring a client", async () => {
    const connect = vi.fn();
    await expect(
      run_audited_mutation({
        pool: { connect },
        event_id: "invalid-event-id-that-is-too-long",
        command: project_create,
        context,
        execute: async () => undefined,
        build_event: () => null,
        write_audit_event: async () => undefined,
      }),
    ).rejects.toThrow(/invalid_audit_mutation_context/);
    expect(connect).not.toHaveBeenCalled();
  });

  it("replaces only identifiable deferred Audit guard failures", async () => {
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql === "COMMIT") {
          throw Object.assign(new Error("guard detail secret-value"), {
            code: "23514",
            constraint: "ossie_audit_guard_project_insert",
          });
        }
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    await expect(
      run_audited_mutation({
        pool: { connect: vi.fn(async () => client) },
        event_id: "event-1",
        command: project_create,
        context,
        execute: async () => "created",
        build_event: () => ({ id: "event-1" }),
        write_audit_event: async () => undefined,
      }),
    ).rejects.toThrow(/^audit_guard_failed$/u);
  });

  it("commits a true no-op without writing an event", async () => {
    const client = {
      query: vi.fn(async () => ({ rows: [] })),
      release: vi.fn(),
    };
    const write = vi.fn();
    await expect(
      run_audited_mutation({
        pool: { connect: vi.fn(async () => client) },
        event_id: "event-1",
        command: find_audit_command("project.update"),
        context,
        execute: async () => "unchanged",
        build_event: () => null,
        write_audit_event: write,
      }),
    ).resolves.toBe("unchanged");
    expect(write).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });

  it("rejects actor/source combinations outside command policy before connecting", async () => {
    const connect = vi.fn();
    await expect(
      run_audited_mutation({
        pool: { connect },
        event_id: "event-1",
        command: find_audit_command("publish.viewer_session.create"),
        context,
        execute: async () => undefined,
        build_event: () => null,
        write_audit_event: async () => undefined,
      }),
    ).rejects.toThrow(/invalid_audit_command_context/);
    expect(connect).not.toHaveBeenCalled();
  });

  it("preserves unrelated deferred constraint failures", async () => {
    const failure = Object.assign(new Error("unrelated check"), {
      code: "23514",
      constraint: "some_business_check",
    });
    const client = {
      query: vi.fn(async (sql: string) => {
        if (sql === "COMMIT") throw failure;
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    await expect(
      run_audited_mutation({
        pool: { connect: vi.fn(async () => client) },
        event_id: "event-1",
        command: project_create,
        context,
        execute: async () => "created",
        build_event: () => ({ id: "event-1" }),
        write_audit_event: async () => undefined,
      }),
    ).rejects.toBe(failure);
  });

  it("resolves and locks actor context on the transaction client before setting guards", async () => {
    const order: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        order.push(sql);
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    await run_audited_mutation({
      pool: { connect: vi.fn(async () => client) },
      event_id: "event-1",
      command: find_audit_command("authentication.session.touch"),
      context: async (transaction) => {
        await transaction.query("SELECT auth FOR UPDATE");
        return context;
      },
      execute: async () => "touched",
      build_event: () => ({ id: "event-1" }),
      write_audit_event: async () => undefined,
    });
    expect(order[0]).toBe("BEGIN");
    expect(order[1]).toBe("SELECT auth FOR UPDATE");
    expect(order[2]).toContain("set_config");
  });

  it("writes extension mutation Access Evidence on the same client before commit", async () => {
    const queries: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        queries.push(sql);
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const request_context = access_request_context({
      id: "request-extension",
      method: "POST",
      headers: { "x-ossie-client": "extension" },
      routeOptions: { url: "/api/v1/projects" },
    });
    const event = {
      id: "01J00000000000000000000000",
      organization_id: "01J00000000000000000000001",
      project_id: "01J00000000000000000000002",
      root_resource_type: "project",
      root_resource_id: "01J00000000000000000000002",
      action: "project.created",
      source_type: "extension",
      actor_type: "org_user",
      actor_org_user_id: "01J00000000000000000000003",
      actor_label: "Synthetic owner",
      request_id: "request-extension",
      correlation_id: null,
      idempotency_key_hash: null,
      before_row_version: null,
      after_row_version: null,
      outcome: "committed",
      reason: null,
      occurred_at: "2026-07-19T12:00:00.000Z",
      items: [],
    } satisfies AuditEvent;

    await run_with_access_request_context(request_context, async () => {
      set_access_auth_context({
        organization_id: event.organization_id,
        org_user_id: event.actor_org_user_id,
        actor_label: event.actor_label,
        organization_role: "owner",
        auth_session_id: "01J00000000000000000000004",
      });
      await run_audited_mutation({
        pool: { connect: vi.fn(async () => client) },
        event_id: event.id,
        command: project_create,
        context: {
          organization_id: event.organization_id,
          actor_type: "org_user",
          source_type: "extension",
        },
        execute: async () => "created",
        build_event: () => event,
        write_audit_event: async () => undefined,
      });
    });

    expect(queries.some((sql) => sql.includes("INSERT INTO audit_schema.access_event"))).toBe(true);
    expect(queries.at(-1)).toBe("COMMIT");
    expect(request_context.atomic_access_event_id).toHaveLength(26);
  });
});
