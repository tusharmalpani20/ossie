import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ulid } from "ulid";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database, with_maintenance_client } from "../../test-support/database";
import { AUDIT_COVERAGE_REGISTRY } from "./audit-coverage-registry";
import { run_audited_mutation } from "./audit-transaction";
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
    expect(triggers.rows.map((row) => row.trigger_name)).toEqual(
      [
        AUDIT_COVERAGE_REGISTRY[0]?.context_guard,
        AUDIT_COVERAGE_REGISTRY[0]?.deferred_guard,
      ].sort(),
    );
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
    const event = await pool.query(`
      SELECT id, organization_id, actor_org_user_id
      FROM audit_schema.audit_event WHERE project_id = $1
    `, [project_id]);
    await expect(pool.query(`
      INSERT INTO audit_schema.audit_change_item (
        id, organization_id, audit_event_id, entity_type, entity_id, operation,
        field_name, value_type, before_state, after_state, after_text_value
      ) VALUES ($1, $2, $3, 'project', $4, 'update', 'name', 'integer', 'absent', 'value', 'wrong-column')
    `, [ulid(), event.rows[0].organization_id, event.rows[0].id, project_id]))
      .rejects.toMatchObject({ code: "23514" });

    const other = { user_id: ulid(), organization_id: ulid(), org_user_id: ulid() };
    await with_maintenance_client(async (client) => {
      await client.query("INSERT INTO user_schema.user (id, email, password_hash, display_name) VALUES ($1, $2, 'hash.salt', 'Other')", [other.user_id, `${other.user_id}@example.com`]);
      await client.query("INSERT INTO organization_schema.organization (id, name) VALUES ($1, 'Other Org')", [other.organization_id]);
      await client.query("INSERT INTO organization_schema.org_user (id, user_id, organization_id, role) VALUES ($1, $2, $3, 'owner')", [other.org_user_id, other.user_id, other.organization_id]);
    });
    await expect(pool.query(`
      INSERT INTO audit_schema.audit_event (
        id, organization_id, project_id, root_resource_type, root_resource_id,
        action, source_type, actor_type, actor_org_user_id, actor_label, outcome
      ) VALUES ($1, $2, $3, 'project', $3, 'project.created', 'web', 'org_user', $4, 'Other', 'committed')
    `, [ulid(), event.rows[0].organization_id, project_id, other.org_user_id]))
      .rejects.toMatchObject({ code: "23503" });
    await expect(pool.query("DELETE FROM project_schema.project WHERE id = $1", [project_id]))
      .rejects.toMatchObject({ code: "23503" });
  });

  it("rolls back the Project when evidence persistence fails", async () => {
    await setup_owner();
    const actor = await pool.query("SELECT organization_id, id FROM organization_schema.org_user LIMIT 1");
    await expect(run_audited_mutation({
      pool,
      event_id: ulid(),
      context: {
        organization_id: actor.rows[0].organization_id,
        action: "project.created",
        command: "project.create",
      },
      execute: (client) => build_project_repository(
        client as unknown as Parameters<typeof build_project_repository>[0],
      ).create_project({
        organization_id: actor.rows[0].organization_id,
        actor_org_user_id: actor.rows[0].id,
        data: { name: "Must Roll Back" },
      }),
      build_event: () => ({ invalid: true }),
      write_audit_event: async () => { throw new Error("synthetic audit failure"); },
    })).rejects.toThrow("synthetic audit failure");
    const projects = await pool.query("SELECT 1 FROM project_schema.project WHERE name = 'Must Roll Back'");
    expect(projects.rows).toEqual([]);
  });
});
