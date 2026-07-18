import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ulid } from "ulid";
import { create_row_change, create_scalar_change } from "@repo/audit-domain";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import {
  reset_test_database,
  with_maintenance_client,
} from "../../test-support/database";
import { AUDIT_COVERAGE_REGISTRY } from "./audit-coverage-registry";
import { run_audited_mutation } from "./audit-transaction";
import { write_audit_event } from "./audit.repository";
import { build_project_repository } from "../project/project.repository";

const setup_owner = async () => {
  const app = build({ logger: false });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/setup/first-run",
    payload: {
      owner: {
        email: "owner@example.com",
        password: "safe local password",
        first_name: "Owner",
        last_name: "User",
      },
      organization: { name: "Acme" },
    },
  });
  await app.close();
  expect(response.statusCode).toBe(201);
  return (
    response.cookies.find((cookie) => cookie.name === "ossie_session")?.value ??
    ""
  );
};

describe("Audit Evidence core", () => {
  beforeEach(reset_test_database);
  afterAll(async () => pool.end());

  it("commits Project creation with exactly one typed event", async () => {
    const session = await setup_owner();
    const app = build({ logger: false });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: { ossie_session: session },
      payload: {
        name: "Audited Project",
        metadata: { private: "metadata-value" },
      },
    });
    await app.close();
    expect(response.statusCode).toBe(201);
    const project_id = response.json().project.id as string;
    const events = await pool.query(
      `
      SELECT id, organization_id, project_id, action, actor_type, actor_org_user_id,
        before_row_version, after_row_version
      FROM audit_schema.audit_event
      WHERE project_id = $1
    `,
      [project_id],
    );
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0]).toMatchObject({
      project_id,
      action: "project.created",
      actor_type: "org_user",
      before_row_version: null,
      after_row_version: 1,
    });
    const items = await pool.query(
      `
      SELECT field_name, before_state, after_state, after_text_value
      FROM audit_schema.audit_change_item
      WHERE audit_event_id = $1
      ORDER BY created_at, id
    `,
      [events.rows[0].id],
    );
    expect(items.rows).toHaveLength(8);
    expect(
      items.rows.find((row) => row.field_name === "metadata"),
    ).toMatchObject({
      before_state: "absent",
      after_state: "redacted",
      after_text_value: null,
    });
    expect(JSON.stringify(items.rows)).not.toContain("metadata-value");
  });

  it("enforces runtime append-only privileges and the Project guard", async () => {
    const session = await setup_owner();
    const app = build({ logger: false });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: { ossie_session: session },
      payload: { name: "Guarded Project" },
    });
    await app.close();
    expect(response.statusCode).toBe(201);
    await expect(
      pool.query("UPDATE audit_schema.audit_event SET actor_label = 'changed'"),
    ).rejects.toMatchObject({ code: expect.stringMatching(/42501|55000/) });
    await expect(
      pool.query("DELETE FROM audit_schema.audit_event"),
    ).rejects.toMatchObject({ code: expect.stringMatching(/42501|55000/) });
    await expect(
      pool.query("TRUNCATE audit_schema.audit_change_item"),
    ).rejects.toMatchObject({ code: expect.stringMatching(/42501|55000/) });
    await pool.query(
      "SELECT set_config('ossie.maintenance_mode', 'on', false)",
    );
    await expect(
      pool.query("UPDATE audit_schema.audit_event SET actor_label = 'spoofed'"),
    ).rejects.toMatchObject({ code: expect.stringMatching(/42501|55000/) });

    const context = await pool.query(
      "SELECT organization_id, id FROM organization_schema.org_user LIMIT 1",
    );
    await expect(
      pool.query(
        `
      INSERT INTO project_schema.project (id, organization_id, name, created_by_id, updated_by_id)
      VALUES ('01J00000000000000000999999', $1, 'Unguarded', $2, $2)
    `,
        [context.rows[0].organization_id, context.rows[0].id],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("matches the partial coverage registry to installed triggers and role separation", async () => {
    const triggers = await pool.query<{ trigger_name: string }>(`
      SELECT tgname AS trigger_name
      FROM pg_trigger
      WHERE tgrelid = 'project_schema.project'::regclass AND NOT tgisinternal
      ORDER BY tgname
    `);
    expect(triggers.rows.map((row) => row.trigger_name)).toEqual([
      "project_insert_audit_context_guard",
      "project_insert_audit_evidence_guard",
    ]);
    const role = await pool.query<{
      current_user: string;
      maintenance_member: boolean;
    }>(
      `
      SELECT current_user, pg_has_role(current_user, $1, 'MEMBER') AS maintenance_member
    `,
      [process.env.DB_MAINTENANCE_USER],
    );
    expect(role.rows[0]).toEqual({
      current_user: process.env.DB_USER,
      maintenance_member: false,
    });
    const business_privileges = await pool.query(`
      SELECT
        has_table_privilege(current_user, 'project_schema.project', 'INSERT') AS project_insert,
        has_table_privilege(current_user, 'project_schema.project', 'UPDATE') AS project_update,
        has_table_privilege(current_user, 'project_schema.project', 'DELETE') AS project_delete,
        has_table_privilege(current_user, 'capture_schema.capture_event', 'DELETE') AS capture_event_delete
    `);
    expect(business_privileges.rows[0]).toEqual({
      project_insert: true,
      project_update: true,
      project_delete: false,
      capture_event_delete: false,
    });
    const json_columns = await pool.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'audit_schema' AND data_type IN ('json', 'jsonb')
    `);
    expect(json_columns.rows).toEqual([]);
  });

  it("rejects mismatched typed values, cross-tenant actors, and destructive Project deletion", async () => {
    const session = await setup_owner();
    const app = build({ logger: false });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: { ossie_session: session },
      payload: { name: "Protected Project" },
    });
    await app.close();
    const project_id = response.json().project.id as string;
    const event = await pool.query(
      `
      SELECT id, organization_id, actor_org_user_id
      FROM audit_schema.audit_event WHERE project_id = $1
    `,
      [project_id],
    );
    await expect(
      pool.query(
        `
      INSERT INTO audit_schema.audit_change_item (
        id, organization_id, audit_event_id, entity_type, entity_id, operation,
        field_name, value_type, before_state, after_state, after_text_value
      ) VALUES ($1, $2, $3, 'project', $4, 'update', 'name', 'integer', 'absent', 'value', 'wrong-column')
    `,
        [ulid(), event.rows[0].organization_id, event.rows[0].id, project_id],
      ),
    ).rejects.toMatchObject({ code: "23514" });

    const other = {
      user_id: ulid(),
      organization_id: ulid(),
      org_user_id: ulid(),
    };
    await with_maintenance_client(async (client) => {
      await client.query(
        "INSERT INTO user_schema.user (id, email, password_hash, display_name) VALUES ($1, $2, 'hash.salt', 'Other')",
        [other.user_id, `${other.user_id}@example.com`],
      );
      await client.query(
        "INSERT INTO organization_schema.organization (id, name) VALUES ($1, 'Other Org')",
        [other.organization_id],
      );
      await client.query(
        "INSERT INTO organization_schema.org_user (id, user_id, organization_id, role) VALUES ($1, $2, $3, 'owner')",
        [other.org_user_id, other.user_id, other.organization_id],
      );
    });
    await expect(
      pool.query(
        `
      INSERT INTO audit_schema.audit_event (
        id, organization_id, project_id, root_resource_type, root_resource_id,
        action, source_type, actor_type, actor_org_user_id, actor_label, outcome
      ) VALUES ($1, $2, $3, 'project', $3, 'project.created', 'web', 'org_user', $4, 'Other', 'committed')
    `,
        [ulid(), event.rows[0].organization_id, project_id, other.org_user_id],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      pool.query("DELETE FROM project_schema.project WHERE id = $1", [
        project_id,
      ]),
    ).rejects.toMatchObject({ code: "42501" });
    await with_maintenance_client(async (client) => {
      await expect(
        client.query("DELETE FROM project_schema.project WHERE id = $1", [
          project_id,
        ]),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("rejects invalid scalar operation transitions", async () => {
    const session = await setup_owner();
    const app = build({ logger: false });
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: { ossie_session: session },
      payload: { name: "Transition Project" },
    });
    await app.close();
    const event = await pool.query(
      "SELECT id, organization_id FROM audit_schema.audit_event WHERE project_id = $1",
      [response.json().project.id],
    );
    await expect(
      pool.query(
        `
      INSERT INTO audit_schema.audit_change_item (
        id, organization_id, audit_event_id, entity_type, entity_id, operation,
        field_name, value_type, before_state, after_state,
        before_text_value, after_text_value
      ) VALUES ($1, $2, $3, 'project', $4, 'create', 'name', 'text', 'value', 'value', 'old', 'new')
    `,
        [
          ulid(),
          event.rows[0].organization_id,
          event.rows[0].id,
          response.json().project.id,
        ],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("round-trips decimal, date, and timestamp values through typed columns", async () => {
    await setup_owner();
    const organization = await pool.query(
      "SELECT id FROM organization_schema.organization LIMIT 1",
    );
    const event_id = ulid();
    const identity = {
      organization_id: organization.rows[0].id,
      audit_event_id: event_id,
      entity_type: "diagnostic",
      entity_id: ulid(),
    };
    await write_audit_event(pool, {
      id: event_id,
      organization_id: organization.rows[0].id,
      project_id: null,
      root_resource_type: "organization",
      root_resource_id: organization.rows[0].id,
      action: "diagnostic.created",
      source_type: "system",
      actor_type: "system",
      actor_org_user_id: null,
      actor_label: "Test System",
      request_id: null,
      correlation_id: null,
      idempotency_key_hash: "a".repeat(64),
      before_row_version: null,
      after_row_version: null,
      outcome: "committed",
      reason: null,
      occurred_at: "2026-07-19T00:00:00.000Z",
      items: [
        create_row_change({ id: ulid(), ...identity, operation: "create" }),
        create_scalar_change({
          id: ulid(),
          ...identity,
          operation: "create",
          field_name: "decimal",
          value_type: "decimal",
          before: { state: "absent" },
          after: { state: "value", value: "12.340" },
        }),
        create_scalar_change({
          id: ulid(),
          ...identity,
          operation: "create",
          field_name: "date",
          value_type: "date",
          before: { state: "absent" },
          after: { state: "value", value: "2026-07-19" },
        }),
        create_scalar_change({
          id: ulid(),
          ...identity,
          operation: "create",
          field_name: "timestamp",
          value_type: "timestamp",
          before: { state: "absent" },
          after: { state: "value", value: "2026-07-19T01:02:03.000Z" },
        }),
      ],
    });
    const values = await pool.query(
      `
      SELECT field_name, after_decimal_value::text AS decimal_value,
        after_date_value::text AS date_value, after_timestamp_value
      FROM audit_schema.audit_change_item
      WHERE audit_event_id = $1 AND field_name IS NOT NULL
      ORDER BY field_name
    `,
      [event_id],
    );
    expect(values.rows).toEqual([
      expect.objectContaining({ field_name: "date", date_value: "2026-07-19" }),
      expect.objectContaining({
        field_name: "decimal",
        decimal_value: "12.34",
      }),
      expect.objectContaining({
        field_name: "timestamp",
        after_timestamp_value: new Date("2026-07-19T01:02:03.000Z"),
      }),
    ]);
  });

  it("rolls back a context-bearing Project INSERT when deferred evidence is absent", async () => {
    await setup_owner();
    const actor = await pool.query(
      "SELECT organization_id, id FROM organization_schema.org_user LIMIT 1",
    );
    const project_id = ulid();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT set_config('ossie.audit_event_id', $1, true)",
        [ulid()],
      );
      await client.query(
        "SELECT set_config('ossie.audit_organization_id', $1, true)",
        [actor.rows[0].organization_id],
      );
      await client.query(
        "SELECT set_config('ossie.audit_action', 'project.created', true)",
      );
      await client.query(
        "SELECT set_config('ossie.audit_command', 'project.create', true)",
      );
      await client.query(
        `
        INSERT INTO project_schema.project (id, organization_id, name, created_by_id, updated_by_id)
        VALUES ($1, $2, 'Missing Evidence', $3, $3)
      `,
        [project_id, actor.rows[0].organization_id, actor.rows[0].id],
      );
      await expect(client.query("COMMIT")).rejects.toMatchObject({
        code: "23514",
      });
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
    const project = await pool.query(
      "SELECT 1 FROM project_schema.project WHERE id = $1",
      [project_id],
    );
    expect(project.rows).toEqual([]);
  });

  it("rolls back the Project when evidence persistence fails", async () => {
    await setup_owner();
    const actor = await pool.query(
      "SELECT organization_id, id FROM organization_schema.org_user LIMIT 1",
    );
    await expect(
      run_audited_mutation({
        pool,
        event_id: ulid(),
        command: AUDIT_COVERAGE_REGISTRY.find(
          ({ command }) => command === "project.create",
        )!,
        context: {
          organization_id: actor.rows[0].organization_id,
          actor_type: "org_user",
          source_type: "web",
        },
        execute: (client) =>
          build_project_repository(
            client as unknown as Parameters<typeof build_project_repository>[0],
          ).create_project({
            organization_id: actor.rows[0].organization_id,
            actor_org_user_id: actor.rows[0].id,
            data: { name: "Must Roll Back" },
          }),
        build_event: () => ({ invalid: true }),
        write_audit_event: async () => {
          throw new Error("synthetic audit failure");
        },
      }),
    ).rejects.toThrow("synthetic audit failure");
    const projects = await pool.query(
      "SELECT 1 FROM project_schema.project WHERE name = 'Must Roll Back'",
    );
    expect(projects.rows).toEqual([]);
  });
});
