import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ulid } from "ulid";
import { pool } from "../../config/database.config";
import { reset_test_database, with_maintenance_client } from "../../test-support/database";
import { build_project_membership_repository } from "./project-membership.repository";

describe("Project Membership persistence", () => {
  beforeEach(reset_test_database);
  afterAll(async () => pool.end());

  it("enforces tenant FKs, owner invariants, lifecycle, and runtime non-destructive grants", async () => {
    const organization_id = ulid(); const project_id = ulid();
    const owner_user_id = ulid(); const owner_id = ulid();
    const member_user_id = ulid(); const member_id = ulid();
    await with_maintenance_client(async (client) => {
      await client.query("INSERT INTO user_schema.user (id,email,password_hash,display_name) VALUES ($1,$2,'hash.salt','Owner'),($3,$4,'hash.salt','Member')",
        [owner_user_id, `${owner_user_id}@example.test`, member_user_id, `${member_user_id}@example.test`]);
      await client.query("INSERT INTO organization_schema.organization (id,name) VALUES ($1,'Synthetic')", [organization_id]);
      await client.query("INSERT INTO organization_schema.org_user (id,organization_id,user_id,role) VALUES ($1,$3,$2,'owner'),($4,$3,$5,'member')",
        [owner_id, owner_user_id, organization_id, member_id, member_user_id]);
      await client.query("INSERT INTO project_schema.project (id,organization_id,name,created_by_id,updated_by_id) VALUES ($1,$2,'Synthetic Project',$3,$3)",
        [project_id, organization_id, owner_id]);
    });
    const repository = build_project_membership_repository(pool);
    await expect(repository.resolve_project_access({ organization_id, actor_org_user_id: owner_id, project_id }))
      .resolves.toMatchObject({ actor_role: "owner", membership: null });
    await with_maintenance_client(async (client) => {
      await expect(client.query(`INSERT INTO project_schema.project_membership
        (id,organization_id,project_id,org_user_id,role,created_by_id,updated_by_id)
        VALUES ($1,$2,$3,$4,'project_admin',$4,$4)`, [ulid(), organization_id, project_id, owner_id]))
        .rejects.toMatchObject({ constraint: "project_membership_owner_guard" });
    });
    await expect(pool.query("DELETE FROM project_schema.project_membership WHERE project_id = $1", [project_id]))
      .rejects.toMatchObject({ code: "42501" });
  });
});
