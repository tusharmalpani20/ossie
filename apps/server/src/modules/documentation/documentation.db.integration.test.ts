import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";
import { build_documentation_repository } from "./documentation.repository";

const establish_project = async () => {
  const app = build({ logger: false });
  const setup = await app.inject({
    method: "POST",
    url: "/api/v1/setup/first-run",
    payload: {
      owner: {
        email: "documentation-owner@example.test",
        password: "safe local password",
        first_name: "Docs",
        last_name: "Owner",
      },
      organization: { name: "Documentation Test" },
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
    payload: { name: "Product" },
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
    organization_id: actor.rows[0]!.organization_id,
    actor_org_user_id: actor.rows[0]!.actor_org_user_id,
    project_id: project.json().project.id as string,
    project_version_id: project.json().project.default_project_version
      .id as string,
    session_token: session ?? "",
  };
};

describe("DB-backed Documentation repository", () => {
  beforeEach(reset_test_database);
  afterAll(() => pool.end());

  it("atomically persists one Site, Edition, Working Draft, and Home Page", async () => {
    const scope = await establish_project();
    const repository = build_documentation_repository(pool);
    const created = await repository.create_site({
      ...scope,
      idempotency_key: "docs-create-1",
      name: "Product docs",
      description: null,
      primary_language: "en-US",
      initial_home_page: { title: "Home", path: "home" },
    });

    expect(created).toMatchObject({
      site: { name: "Product docs" },
      edition: { primary_language: "en-US" },
      working_draft: { version: 2 },
      home_page: { canonical_path: "home" },
    });
    const counts = await pool.query<{
      sites: string;
      editions: string;
      drafts: string;
      pages: string;
    }>(`
      SELECT
        (SELECT count(*) FROM documentation_schema.documentation_site) sites,
        (SELECT count(*) FROM documentation_schema.site_edition) editions,
        (SELECT count(*) FROM documentation_schema.site_working_draft) drafts,
        (SELECT count(*) FROM documentation_schema.documentation_page) pages
    `);
    expect(counts.rows[0]).toEqual({
      sites: "1",
      editions: "1",
      drafts: "1",
      pages: "1",
    });
  });

  it("exposes the authorized version-scoped Site creation API", async () => {
    const scope = await establish_project();
    const app = build({ logger: false });
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites`,
      cookies: { ossie_session: scope.session_token },
      headers: { "idempotency-key": "site-create-route-1" },
      payload: {
        name: "Product docs",
        description: null,
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      site: { name: "Product docs" },
      edition: { primary_language: "en-US" },
      home_page: { canonical_path: "home" },
    });
    const list = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${scope.project_id}/versions/main/documentation-sites`,
      cookies: { ossie_session: scope.session_token },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().documentation_sites).toHaveLength(1);
    await app.close();
  });
});
