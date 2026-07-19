import { describe, expect, it, vi } from "vitest";
import { verify_audit_schema } from "./audit-schema-verification";

describe("Audit schema verification", () => {
  it("reports missing schema protections without exposing credentials", async () => {
    const pool = {
      query: vi.fn(async (sql: string, values?: unknown[]) => {
        void sql;
        void values;
        return {
          rows: [
            { issue: "trigger:project_insert_audit_evidence_guard" },
            { issue: "privilege:audit_schema.audit_event:UPDATE:false" },
          ],
        };
      }),
    };

    await expect(
      verify_audit_schema(pool as never, {
        runtime_role: "runtime",
        maintenance_role: "maintenance",
      }),
    ).rejects.toThrow(
      /trigger:project_insert_audit_evidence_guard.*privilege:audit_schema.audit_event:UPDATE:false/,
    );
    expect(JSON.stringify(pool.query.mock.calls)).not.toContain('"password":');
    expect(pool.query.mock.calls[0]?.[0]).toContain("jsonb_to_recordset");
    expect(pool.query.mock.calls[0]?.[0]).toContain("condeferrable");
    expect(pool.query.mock.calls[0]?.[0]).toContain("require_mutation_context");
    expect(pool.query.mock.calls[0]?.[1]?.slice(0, 2)).toEqual([
      "runtime",
      "maintenance",
    ]);
    expect(pool.query.mock.calls[0]?.[1]?.[2]).toContain(
      "public_publish_viewer_session",
    );
  });

  it("accepts a complete schema", async () => {
    const pool = {
      query: vi.fn(async (sql: string, values?: unknown[]) => {
        void sql;
        void values;
        return { rows: [] };
      }),
    };
    await expect(
      verify_audit_schema(pool as never, {
        runtime_role: "runtime",
        maintenance_role: "maintenance",
      }),
    ).resolves.toEqual({
      status: "ready",
    });
  });
});
