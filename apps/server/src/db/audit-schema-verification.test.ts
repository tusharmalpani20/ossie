import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  verify_audit_core_schema,
  verify_audit_schema,
} from "./audit-schema-verification";
import * as verification from "./audit-schema-verification";

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
    expect(pool.query.mock.calls[0]?.[0]).toContain(
      "mutation_command_policy_is_valid",
    );
    expect(pool.query.mock.calls[0]?.[0]).toContain(
      "require_delete_mutation_context",
    );
    expect(pool.query.mock.calls[0]?.[0]).toContain(
      "verify_delete_mutation_evidence",
    );
    expect(pool.query.mock.calls[0]?.[0]).toContain(
      "WHEN 'DELETE' THEN trigger.tgtype & 8",
    );
    expect(pool.query.mock.calls[0]?.[0]).toContain("has_function_privilege");
    expect(pool.query.mock.calls[0]?.[1]?.slice(0, 2)).toEqual([
      "runtime",
      "maintenance",
    ]);
    expect(pool.query.mock.calls[0]?.[1]?.[2]).toContain(
      "public_publish_viewer_session",
    );
    expect(pool.query.mock.calls[0]?.[1]?.[2]).toContain(
      '"context_trigger":"publish_link_entry_d_audit_ctx"',
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

  it("ignores guards owned by pending migrations without weakening head verification", async () => {
    const missing_operational_guard = {
      issue:
        "guard:documentation_schema.organization_documentation_limits:INSERT",
    };
    const pool = {
      query: vi.fn(async (_sql: string, values?: unknown[]) => ({
        rows: values?.[3] === false ? [] : [missing_operational_guard],
      })),
    };
    const verify = Reflect.get(verification, "verify_audit_schema");
    const roles = {
      runtime_role: "runtime",
      maintenance_role: "maintenance",
    };

    await expect(
      verify(pool as never, roles, {
        allow_missing_guard_tables: true,
      }),
    ).resolves.toEqual({ status: "ready" });
    await expect(verify(pool as never, roles)).rejects.toThrow(
      missing_operational_guard.issue,
    );
  });

  it("accepts the child 112 core catalog after migration 016 is rolled back", async () => {
    const pool = {
      query: vi.fn(async (sql: string) => {
        void sql;
        return { rows: [] };
      }),
    };

    await expect(
      verify_audit_core_schema(pool as never, {
        runtime_role: "runtime",
        maintenance_role: "maintenance",
      }),
    ).resolves.toEqual({ status: "ready" });
    expect(pool.query.mock.calls[0]?.[0]).toContain(
      "project_insert_audit_context_guard",
    );
    expect(pool.query.mock.calls[0]?.[0]).toContain(
      "require_project_insert_context",
    );
    expect(pool.query.mock.calls[0]?.[0]).not.toContain(
      "public_publish_viewer_session",
    );
  });

  it("verifies the full Access Evidence catalog after migration 017", async () => {
    const pool = {
      query: vi.fn<
        (sql: string, values?: unknown[]) => Promise<{ rows: never[] }>
      >(async () => ({ rows: [] })),
    };
    const verify = Reflect.get(verification, "verify_evidence_schema");

    expect(verify).toBeTypeOf("function");
    await expect(
      verify(pool as never, {
        runtime_role: "runtime",
        maintenance_role: "maintenance",
      }),
    ).resolves.toEqual({ status: "ready" });
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "access_event_append_only",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "idx_access_event_organization_cursor",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "audit_schema.access_event",
    );
  });

  it("verifies Project Membership and preserves the evidence verifier", async () => {
    const pool = {
      query: vi.fn<
        (sql: string, values?: unknown[]) => Promise<{ rows: never[] }>
      >(async () => ({ rows: [] })),
    };
    const verify = Reflect.get(
      verification,
      "verify_project_membership_schema",
    );
    expect(verify).toBeTypeOf("function");
    await expect(
      verify(pool as never, {
        runtime_role: "runtime",
        maintenance_role: "maintenance",
      }),
    ).resolves.toEqual({ status: "ready" });
    expect(pool.query.mock.calls).toHaveLength(3);
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "project_schema.project_membership",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "project_membership_owner_guard",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "chk_access_event_scoped_success",
    );
  });

  it("verifies Project Version schema after migration 020", async () => {
    const pool = {
      query: vi.fn<
        (sql: string, values?: unknown[]) => Promise<{ rows: never[] }>
      >(async () => ({ rows: [] })),
    };
    const verify = Reflect.get(verification, "verify_project_version_schema");
    expect(verify).toBeTypeOf("function");
    await expect(
      verify(pool as never, {
        runtime_role: "runtime",
        maintenance_role: "maintenance",
      }),
    ).resolves.toEqual({ status: "ready" });
    expect(pool.query.mock.calls).toHaveLength(4);
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "project_schema.project_version",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "project_version_mutation_command_guard",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "project_version_alias_provenance_guard",
    );
  });

  it("selects Project Version verification after migration 020", () => {
    const source = readFileSync(
      new URL("./migrate.ts", import.meta.url),
      "utf8",
    );
    expect(source).toContain("verify_project_version_schema");
    expect(source).toContain("020_project_version_foundation.sql");
  });

  it("verifies and selects the Artifact Edition schema after migration 022", async () => {
    const pool = {
      query: vi.fn<
        (sql: string, values?: unknown[]) => Promise<{ rows: never[] }>
      >(async () => ({ rows: [] })),
    };
    const verify = Reflect.get(verification, "verify_artifact_edition_schema");
    expect(verify).toBeTypeOf("function");
    await expect(
      verify(pool as never, {
        runtime_role: "runtime",
        maintenance_role: "maintenance",
      }),
    ).resolves.toEqual({ status: "ready" });
    expect(pool.query.mock.calls).toHaveLength(5);
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "guide_schema.guide_edition",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "interactive_demo_schema.interactive_demo_working_draft",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "guide_edition_exactly_one_working_draft",
    );

    const source = readFileSync(
      new URL("./migrate.ts", import.meta.url),
      "utf8",
    );
    expect(source).toContain("verify_artifact_edition_schema");
    expect(source).toContain(
      "022_guide_demo_edition_working_draft_relational_foundation.sql",
    );
  });

  it("verifies and selects the Revision and protected Asset schema after migration 023", async () => {
    const pool = {
      query: vi.fn<
        (sql: string, values?: unknown[]) => Promise<{ rows: never[] }>
      >(async () => ({ rows: [] })),
    };
    const verify = Reflect.get(verification, "verify_artifact_revision_schema");
    expect(verify).toBeTypeOf("function");
    await expect(
      verify(pool as never, {
        runtime_role: "runtime",
        maintenance_role: "maintenance",
      }),
    ).resolves.toEqual({ status: "ready" });
    expect(pool.query.mock.calls).toHaveLength(6);
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "guide_schema.guide_revision",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "capture_asset_purge_request_guard",
    );
    const source = readFileSync(
      new URL("./migrate.ts", import.meta.url),
      "utf8",
    );
    expect(source).toContain("verify_artifact_revision_schema");
    expect(source).toContain(
      "023_guide_demo_revision_carry_forward_protected_assets.sql",
    );
  });

  it("verifies and selects the relational Publication schema after migration 024", async () => {
    const pool = {
      query: vi.fn<
        (sql: string, values?: unknown[]) => Promise<{ rows: never[] }>
      >(async () => ({ rows: [] })),
    };
    const verify = Reflect.get(verification, "verify_publication_schema");
    expect(verify).toBeTypeOf("function");
    await expect(
      verify(pool as never, {
        runtime_role: "runtime",
        maintenance_role: "maintenance",
      }),
    ).resolves.toEqual({ status: "ready" });
    expect(pool.query.mock.calls).toHaveLength(7);
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "publish_schema.publish_link_entry",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "published_artifact_immutable_guard",
    );
    expect(pool.query.mock.calls.at(-1)?.[0]).toContain(
      "publish_link_entry_manifest_guard",
    );
    expect(
      pool.query.mock.calls.some(
        ([sql, values]) =>
          sql.includes("published_artifact_capture_asset") &&
          values?.[2] === false,
      ),
    ).toBe(true);

    const source = readFileSync(
      new URL("./migrate.ts", import.meta.url),
      "utf8",
    );
    expect(source).toContain("verify_publication_schema");
    expect(source).toContain(
      "024_revision_backed_publication_and_publish_link_manifests.sql",
    );
  });
});
