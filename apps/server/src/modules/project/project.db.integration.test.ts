import { ulid } from "ulid";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database, with_maintenance_client } from "../../test-support/database";

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
      organization: {
        name: "Acme",
      },
    },
  });

  await app.close();
  expect(response.statusCode).toBe(201);
  const session_cookie = response.cookies.find((cookie) => cookie.name === "ossie_session");
  expect(session_cookie?.value).toEqual(expect.any(String));
  return session_cookie?.value ?? "";
};

const insert_cross_org_project = async () => {
  const user_id = ulid();
  const organization_id = ulid();
  const org_user_id = ulid();
  const project_id = ulid();

  await with_maintenance_client(async (client) => {
  await client.query(`
    INSERT INTO user_schema.user (id, email, password_hash, display_name)
    VALUES ($1, 'other@example.com', 'hash.salt', 'Other User')
  `, [user_id]);
  await client.query(`
    INSERT INTO organization_schema.organization (id, name)
    VALUES ($1, 'Other Org')
  `, [organization_id]);
  await client.query(`
    INSERT INTO organization_schema.org_user (id, user_id, organization_id, role)
    VALUES ($1, $2, $3, 'owner')
  `, [org_user_id, user_id, organization_id]);
  await client.query("SELECT set_config('ossie.maintenance_mode', 'on', false)");
  await client.query(`
    INSERT INTO project_schema.project (
      id,
      organization_id,
      name,
      created_by_id,
      updated_by_id
    )
    VALUES ($1, $2, 'Other Project', $3, $3)
  `, [project_id, organization_id, org_user_id]);
  });

  return project_id;
};

const get_owner_context = async () => {
  const owner_context = await pool.query<{
    organization_id: string;
    org_user_id: string;
  }>(`
    SELECT organization_id, id AS org_user_id
    FROM organization_schema.org_user
    WHERE role = 'owner'
  `);

  const row = owner_context.rows[0];
  expect(row).toBeDefined();
  return row;
};

describe("DB-backed project foundation API", () => {
  beforeEach(async () => {
    await reset_test_database();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates lists gets and updates projects with auth-scoped audit fields", async () => {
    const session_token = await setup_owner();
    const app = build({ logger: false });

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        name: "Onboarding Demo",
        description: "Internal onboarding demo flow",
        slug: "onboarding-demo",
        color: "#2563eb",
        icon: "presentation",
        organization_id: "attacker_org",
        created_by_id: "attacker_org_user",
      },
    });

    expect(create_response.statusCode).toBe(201);
    expect(create_response.json().project).toMatchObject({
      name: "Onboarding Demo",
      description: "Internal onboarding demo flow",
      slug: "onboarding-demo",
      color: "#2563eb",
      icon: "presentation",
      status: "active",
      version: 1,
    });
    expect(JSON.stringify(create_response.json())).not.toContain("is_deleted");
    expect(JSON.stringify(create_response.json())).not.toContain("deleted_at");

    const project_id = create_response.json().project.id as string;

    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: session_token,
      },
    });
    const get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}`,
      cookies: {
        ossie_session: session_token,
      },
    });
    const update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}`,
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        name: "Updated Demo",
        description: "",
        status: "archived",
      },
    });
    const archived_list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects?status=archived",
      cookies: {
        ossie_session: session_token,
      },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json().projects).toHaveLength(1);
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json().project.id).toBe(project_id);
    expect(update_response.statusCode).toBe(200);
    expect(update_response.json().project).toMatchObject({
      id: project_id,
      name: "Updated Demo",
      description: null,
      status: "archived",
      version: 2,
    });
    expect(archived_list_response.statusCode).toBe(200);
    expect(archived_list_response.json().projects).toHaveLength(1);

    const persisted = await pool.query<{
      organization_id: string;
      created_by_id: string;
      updated_by_id: string;
      version: number;
    }>(`
      SELECT organization_id, created_by_id, updated_by_id, version
      FROM project_schema.project
      WHERE id = $1
    `, [project_id]);
    const owner_context = await get_owner_context();

    expect(persisted.rows[0]).toMatchObject({
      organization_id: owner_context?.organization_id,
      created_by_id: owner_context?.org_user_id,
      updated_by_id: owner_context?.org_user_id,
      version: 2,
    });

    await app.close();
  });

  it("maps duplicate constraints and cross-org access correctly", async () => {
    const session_token = await setup_owner();
    const app = build({ logger: false });

    const first_project_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        name: "Onboarding Demo",
        slug: "onboarding-demo",
      },
    });
    const first_project_id = first_project_response.json().project.id as string;

    const duplicate_name_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        name: "onboarding demo",
      },
    });
    const duplicate_slug_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        name: "Second Demo",
        slug: "ONBOARDING-DEMO",
      },
    });

    expect(duplicate_name_response.statusCode).toBe(409);
    expect(duplicate_name_response.json().error.type).toBe("project_name_conflict");
    expect(duplicate_slug_response.statusCode).toBe(409);
    expect(duplicate_slug_response.json().error.type).toBe("project_slug_conflict");
    const audit_count_after_conflicts = await pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM audit_schema.audit_event",
    );
    expect(Number(audit_count_after_conflicts.rows[0]?.count)).toBe(1);

    const archive_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${first_project_id}`,
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        status: "archived",
      },
    });
    const active_same_name_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        name: "Onboarding Demo",
        slug: "archived-name-demo",
      },
    });
    expect(archive_response.statusCode).toBe(200);
    expect(active_same_name_response.statusCode).toBe(201);

    const cross_org_project_id = await insert_cross_org_project();
    const cross_org_get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${cross_org_project_id}`,
      cookies: {
        ossie_session: session_token,
      },
    });
    const cross_org_update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${cross_org_project_id}`,
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        name: "Should Not Update",
      },
    });

    expect(cross_org_get_response.statusCode).toBe(404);
    expect(cross_org_update_response.statusCode).toBe(404);

    await app.close();
  });

  it("soft deletes projects and hides them from normal project workflows", async () => {
    const session_token = await setup_owner();
    const app = build({ logger: false });

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        name: "Disposable Demo",
        slug: "disposable-demo",
      },
    });
    expect(create_response.statusCode).toBe(201);
    const project_id = create_response.json().project.id as string;
    const owner_context = await get_owner_context();

    const delete_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}`,
      cookies: {
        ossie_session: session_token,
      },
    });
    expect(delete_response.statusCode).toBe(204);
    expect(delete_response.body).toBe("");

    const persisted = await pool.query<{
      is_deleted: boolean;
      deleted_at: Date | null;
      deleted_by_id: string | null;
      status: string;
      updated_by_id: string;
      version: number;
    }>(`
      SELECT is_deleted, deleted_at, deleted_by_id, status, updated_by_id, version
      FROM project_schema.project
      WHERE id = $1
    `, [project_id]);

    expect(persisted.rows[0]).toMatchObject({
      is_deleted: true,
      deleted_by_id: owner_context?.org_user_id,
      status: "active",
      updated_by_id: owner_context?.org_user_id,
      version: 2,
    });
    expect(persisted.rows[0]?.deleted_at).toBeInstanceOf(Date);

    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: session_token,
      },
    });
    const get_response = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project_id}`,
      cookies: {
        ossie_session: session_token,
      },
    });
    const update_response = await app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project_id}`,
      cookies: {
        ossie_session: session_token,
      },
      payload: {
        name: "Should Not Update",
      },
    });
    const repeat_delete_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${project_id}`,
      cookies: {
        ossie_session: session_token,
      },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json().projects).toEqual([]);
    expect(JSON.stringify(list_response.json())).not.toContain("is_deleted");
    expect(JSON.stringify(list_response.json())).not.toContain("deleted_at");
    expect(JSON.stringify(list_response.json())).not.toContain("deleted_by_id");
    expect(get_response.statusCode).toBe(404);
    expect(get_response.json().error.type).toBe("project_not_found");
    expect(update_response.statusCode).toBe(404);
    expect(update_response.json().error.type).toBe("project_not_found");
    expect(repeat_delete_response.statusCode).toBe(404);
    expect(repeat_delete_response.json().error.type).toBe("project_not_found");

    const cross_org_project_id = await insert_cross_org_project();
    const cross_org_delete_response = await app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${cross_org_project_id}`,
      cookies: {
        ossie_session: session_token,
      },
    });
    expect(cross_org_delete_response.statusCode).toBe(404);
    expect(cross_org_delete_response.json().error.type).toBe("project_not_found");

    await app.close();
  });
});
