import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";
import { build_documentation_repository } from "../documentation/documentation.repository";
import { build_documentation_operations_repository } from "./documentation-operations.repository";

const establish_organization = async () => {
  const app = build({ logger: false });
  const setup = await app.inject({
    method: "POST",
    url: "/api/v1/setup/first-run",
    payload: {
      owner: {
        email: "documentation-operations-owner@example.test",
        password: "safe local password",
        first_name: "Docs",
        last_name: "Operator",
      },
      organization: { name: "Documentation Operations Test" },
    },
  });
  expect(setup.statusCode).toBe(201);
  const session = setup.cookies.find(
    (cookie) => cookie.name === "ossie_session",
  )?.value;
  const project = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    cookies: { ossie_session: session ?? "" },
    payload: { name: "Documentation Operations Product" },
  });
  expect(project.statusCode).toBe(201);
  const actor = await pool.query<{
    organization_id: string;
    actor_org_user_id: string;
  }>(
    `SELECT organization_id,id actor_org_user_id
       FROM organization_schema.org_user WHERE role='owner'`,
  );
  await app.close();
  return {
    ...actor.rows[0]!,
    project_id: project.json().project.id as string,
    project_version_id: project.json().project.default_project_version
      .id as string,
  };
};

describe("DB-backed Documentation operations repository", () => {
  beforeEach(reset_test_database);
  afterAll(() => pool.end());

  it("represents an absent limits row as unlimited version zero", async () => {
    const scope = await establish_organization();
    const repository = build_documentation_operations_repository(pool);

    await expect(repository.read_limits_and_usage(scope)).resolves.toMatchObject({
      limits: {
        active_sites_limit: null,
        active_pages_limit: null,
        version: 0,
        updated_at: null,
      },
      usage: {
        active_sites: 0,
        active_pages: 0,
        retained_file_bytes: 0,
      },
    });
  });

  it("atomically creates and updates limits with an audit event", async () => {
    const scope = await establish_organization();
    const repository = build_documentation_operations_repository(pool);

    const created = await repository.update_limits({
      ...scope,
      request: {
        active_sites_limit: 4,
        active_pages_limit: 40,
        expected_version: 0,
      },
    });
    expect(created.limits).toMatchObject({
      active_sites_limit: 4,
      active_pages_limit: 40,
      version: 1,
    });

    const updated = await repository.update_limits({
      ...scope,
      request: {
        active_sites_limit: null,
        active_pages_limit: 20,
        expected_version: 1,
      },
    });
    expect(updated.limits).toMatchObject({
      active_sites_limit: null,
      active_pages_limit: 20,
      version: 2,
    });

    const evidence = await pool.query<{ action: string }>(
      `SELECT action FROM audit_schema.audit_event
        WHERE organization_id=$1
          AND action='documentation.organization_limits.updated'
        ORDER BY occurred_at`,
      [scope.organization_id],
    );
    expect(evidence.rows).toHaveLength(2);
  });

  it("does not persist a virtual all-unlimited version-zero update", async () => {
    const scope = await establish_organization();
    const repository = build_documentation_operations_repository(pool);

    const result = await repository.update_limits({
      ...scope,
      request: {
        active_sites_limit: null,
        active_pages_limit: null,
        expected_version: 0,
      },
    });
    expect(result.limits.version).toBe(0);
    const count = await pool.query<{ count: string }>(
      `SELECT count(*) FROM documentation_schema.organization_documentation_limits`,
    );
    expect(count.rows[0]?.count).toBe("0");
  });

  it("rejects Site growth atomically when an Organization quota is exhausted", async () => {
    const scope = await establish_organization();
    const operations = build_documentation_operations_repository(pool);
    const documentation = build_documentation_repository(pool);
    await operations.update_limits({
      ...scope,
      request: {
        active_sites_limit: 1,
        active_pages_limit: 1,
        expected_version: 0,
      },
    });

    await documentation.create_site({
      ...scope,
      idempotency_key: "quota-site-1",
      name: "First",
      description: null,
      primary_language: "en-US",
      initial_home_page: { title: "Home", path: "home" },
    });
    await expect(
      documentation.create_site({
        ...scope,
        idempotency_key: "quota-site-2",
        name: "Second",
        description: null,
        primary_language: "en-US",
      }),
    ).rejects.toMatchObject({
      code: "documentation_organization_quota_exceeded",
    });

    const counts = await pool.query<{ sites: string; pages: string }>(
      `SELECT
        (SELECT count(*) FROM documentation_schema.documentation_site) sites,
        (SELECT count(*) FROM documentation_schema.documentation_page) pages`,
    );
    expect(counts.rows[0]).toEqual({ sites: "1", pages: "1" });
  });

  it("records maintenance projection rebuilds with a system audit actor", async () => {
    const scope = await establish_organization();
    const operations = build_documentation_operations_repository(pool);
    const documentation = build_documentation_repository(pool);
    const created = await documentation.create_site({
      ...scope,
      idempotency_key: "system-rebuild-site",
      name: "Maintenance",
      description: null,
      primary_language: "en-US",
      initial_home_page: { title: "Home", path: "home" },
    });

    await expect(
      operations.rebuild_projection({
        organization_id: scope.organization_id,
        actor_org_user_id: null,
        actor_type: "system",
        project_id: scope.project_id,
        project_version_slug: "main",
        site_id: created.site.id,
        request: { projection: "draft_search" },
      }),
    ).resolves.toMatchObject({
      projection: "draft_search",
      outcome: "unchanged",
    });

    const evidence = await pool.query<{
      actor_type: string;
      actor_label: string;
    }>(
      `SELECT actor_type,actor_label
         FROM audit_schema.audit_event
        WHERE organization_id=$1
          AND action='documentation.projection.draft_search_rebuilt'
        ORDER BY occurred_at DESC
        LIMIT 1`,
      [scope.organization_id],
    );
    expect(evidence.rows[0]).toEqual({
      actor_type: "system",
      actor_label: "System",
    });
  });
});
