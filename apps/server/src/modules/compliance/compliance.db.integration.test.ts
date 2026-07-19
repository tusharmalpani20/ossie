import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ulid } from "ulid";
import { pool } from "../../config/database.config";
import { reset_test_database, with_maintenance_client } from "../../test-support/database";
import { write_access_event } from "../access/access.repository";
import { build_compliance_repository } from "./compliance.repository";
import { build_compliance_service } from "./compliance.service";

describe("Compliance Evidence queries", () => {
  beforeEach(reset_test_database);
  afterAll(async () => pool.end());

  it("returns only evidence owned by the requested organization", async () => {
    const create_tenant = async (name: string) => {
      const user_id = ulid();
      const organization_id = ulid();
      const org_user_id = ulid();
      await with_maintenance_client(async (client) => {
        await client.query(
          "INSERT INTO user_schema.user (id, email, password_hash, display_name) VALUES ($1, $2, 'hash.salt', $3)",
          [user_id, `${user_id}@example.test`, name],
        );
        await client.query(
          "INSERT INTO organization_schema.organization (id, name) VALUES ($1, $2)",
          [organization_id, name],
        );
        await client.query(
          "INSERT INTO organization_schema.org_user (id, user_id, organization_id, role) VALUES ($1, $2, $3, 'owner')",
          [org_user_id, user_id, organization_id],
        );
      });
      return { organization_id, org_user_id };
    };
    const first = await create_tenant("First tenant");
    const second = await create_tenant("Second tenant");
    for (const tenant of [first, second]) {
      await write_access_event(pool, {
        id: ulid(), organization_id: tenant.organization_id, project_id: null,
        root_resource_type: "organization", root_resource_id: tenant.organization_id,
        action: "organization.members_viewed", source_type: "web", actor_type: "org_user",
        actor_org_user_id: tenant.org_user_id, actor_label: "Synthetic owner",
        request_id: ulid(), http_method: "GET", route_template: "/api/v1/organization/members",
        access_surface: "portal", authorization_type: "organization_role",
        authorization_role: "owner", outcome: "succeeded", reason_code: null,
        response_bytes: null, occurred_at: new Date().toISOString(),
      });
    }

    const service = build_compliance_service(build_compliance_repository(pool));
    const result = await service.list_events({
      auth: { organization_id: first.organization_id, actor_role: "owner" },
      query: { kind: "all", limit: 25 },
    });
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.organization_id).toBe(first.organization_id);
    expect(result.totals).toMatchObject({ access_events: 1, audit_events: 0 });
  });
});
