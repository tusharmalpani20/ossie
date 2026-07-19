import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ulid } from "ulid";
import { pool } from "../../config/database.config";
import { reset_test_database, with_maintenance_client } from "../../test-support/database";
import { write_access_event } from "./access.repository";

describe("Access Evidence persistence", () => {
  beforeEach(reset_test_database);
  afterAll(async () => pool.end());

  it("appends a tenant-scoped event and rejects runtime mutation", async () => {
    const user_id = ulid();
    const organization_id = ulid();
    const org_user_id = ulid();
    await with_maintenance_client(async (client) => {
      await client.query(
        "INSERT INTO user_schema.user (id, email, password_hash, display_name) VALUES ($1, $2, 'hash.salt', 'Access Owner')",
        [user_id, `${user_id}@example.test`],
      );
      await client.query(
        "INSERT INTO organization_schema.organization (id, name) VALUES ($1, 'Access Org')",
        [organization_id],
      );
      await client.query(
        "INSERT INTO organization_schema.org_user (id, user_id, organization_id, role) VALUES ($1, $2, $3, 'owner')",
        [org_user_id, user_id, organization_id],
      );
    });

    const id = ulid();
    await write_access_event(pool, {
      id,
      organization_id,
      project_id: null,
      root_resource_type: "organization",
      root_resource_id: organization_id,
      action: "organization.members_viewed",
      source_type: "web",
      actor_type: "org_user",
      actor_org_user_id: org_user_id,
      actor_label: "Access Owner",
      request_id: "synthetic-request",
      http_method: "GET",
      route_template: "/api/v1/organization/members",
      access_surface: "portal",
      authorization_type: "organization_role",
      authorization_role: "owner",
      outcome: "succeeded",
      reason_code: null,
      response_bytes: null,
      occurred_at: new Date().toISOString(),
    });

    const result = await pool.query(
      "SELECT id, organization_id, action FROM audit_schema.access_event WHERE id = $1",
      [id],
    );
    expect(result.rows).toEqual([{ id, organization_id, action: "organization.members_viewed" }]);
    await expect(
      pool.query("UPDATE audit_schema.access_event SET actor_label = 'changed' WHERE id = $1", [id]),
    ).rejects.toMatchObject({ code: expect.stringMatching(/42501|55000/u) });
    await expect(
      pool.query("DELETE FROM audit_schema.access_event WHERE id = $1", [id]),
    ).rejects.toMatchObject({ code: expect.stringMatching(/42501|55000/u) });
    await expect(
      pool.query("TRUNCATE audit_schema.access_event"),
    ).rejects.toMatchObject({ code: expect.stringMatching(/42501|55000/u) });
    await expect(
      with_maintenance_client((client) => client.query(
        `INSERT INTO audit_schema.access_event (
          id, organization_id, project_id, root_resource_type, root_resource_id,
          action, source_type, actor_type, actor_org_user_id, actor_label,
          request_id, http_method, route_template, access_surface,
          authorization_type, authorization_role, outcome, reason_code,
          response_bytes, occurred_at
        ) SELECT $1, organization_id, project_id, root_resource_type, NULL,
          action, source_type, actor_type, actor_org_user_id, actor_label,
          request_id, http_method, route_template, access_surface,
          authorization_type, authorization_role, outcome, reason_code,
          response_bytes, occurred_at
        FROM audit_schema.access_event WHERE id = $2`,
        [ulid(), id],
      )),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("installs explicit relational columns without JSON storage", async () => {
    const columns = await pool.query<{ column_name: string; data_type: string }>(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'audit_schema' AND table_name = 'access_event'
      ORDER BY ordinal_position
    `);
    expect(columns.rows.map((row) => row.column_name)).toEqual([
      "id", "organization_id", "project_id", "root_resource_type",
      "root_resource_id", "action", "source_type", "actor_type",
      "actor_org_user_id", "actor_label", "request_id", "http_method",
      "route_template", "access_surface", "authorization_type",
      "authorization_role", "outcome", "reason_code", "response_bytes",
      "occurred_at",
    ]);
    expect(columns.rows.some((row) => /json/u.test(row.data_type))).toBe(false);
  });
});
