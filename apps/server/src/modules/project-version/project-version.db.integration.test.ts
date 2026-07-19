import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";

const setup = async () => {
  const app = build({ logger: false });
  const owner = await app.inject({ method: "POST", url: "/api/v1/setup/first-run", payload: {
    owner: { email: "owner@example.test", password: "safe local password", first_name: "Owner", last_name: "User" },
    organization: { name: "Synthetic" },
  } });
  const token = owner.cookies.find(({ name }) => name === "ossie_session")?.value ?? "";
  const project = await app.inject({ method: "POST", url: "/api/v1/projects", cookies: { ossie_session: token },
    payload: { name: "Versioned Project" } });
  expect(project.statusCode).toBe(201);
  return { app, token, project: project.json().project as { id: string; version: number; default_project_version: { id: string } } };
};

describe("DB-backed Project Version lifecycle", () => {
  beforeEach(async () => reset_test_database());
  afterAll(async () => pool.end());

  it("creates, lists, renames with a permanent alias, and resolves the alias", async () => {
    const { app, token, project } = await setup();
    const created = await app.inject({ method: "POST", url: `/api/v1/projects/${project.id}/versions`,
      cookies: { ossie_session: token }, payload: { name: "Summer 2026" } });
    expect(created.statusCode).toBe(201);
    expect(created.json().project_version).toMatchObject({ slug: "summer-2026", status: "active", is_default: false, position: 2 });
    const version = created.json().project_version as { id: string; version: number };
    const changed = await app.inject({ method: "PATCH", url: `/api/v1/projects/${project.id}/versions/${version.id}`,
      cookies: { ossie_session: token }, payload: { expected_version: version.version, slug: "q3-2026" } });
    expect(changed.statusCode).toBe(200);
    expect(changed.json().project_version.aliases).toEqual(expect.arrayContaining([expect.objectContaining({ slug: "summer-2026" })]));
    const resolved = await app.inject({ method: "GET", url: `/api/v1/projects/${project.id}/versions/resolve/summer-2026`,
      cookies: { ossie_session: token } });
    expect(resolved.statusCode).toBe(200);
    expect(resolved.json()).toMatchObject({ resolution: "alias", project_version: { id: version.id, slug: "q3-2026" } });
    const list = await app.inject({ method: "GET", url: `/api/v1/projects/${project.id}/versions`, cookies: { ossie_session: token } });
    expect(list.json().project_versions.map(({ is_default }: { is_default: boolean }) => is_default)).toEqual([true, false]);
    await app.close();
  });

  it("enforces Default lifecycle and records one event per committed command", async () => {
    const { app, token, project } = await setup();
    const forbidden = await app.inject({ method: "POST",
      url: `/api/v1/projects/${project.id}/versions/${project.default_project_version.id}/archive`,
      cookies: { ossie_session: token }, payload: { expected_version: 1 } });
    expect(forbidden.statusCode).toBe(409);
    expect(forbidden.json().error.type).toBe("default_project_version_archive_forbidden");
    const actions = await pool.query<{ action: string }>(`SELECT action FROM audit_schema.audit_event
      WHERE project_id = $1 ORDER BY occurred_at, id`, [project.id]);
    expect(actions.rows.map(({ action }) => action)).toEqual(["project.created"]);
    await app.close();
  });

  it("sets an active Version as Default and preserves exact single-default state", async () => {
    const { app, token, project } = await setup();
    const created = await app.inject({ method: "POST", url: `/api/v1/projects/${project.id}/versions`,
      cookies: { ossie_session: token }, payload: { name: "Next" } });
    const target = created.json().project_version as { id: string; version: number };
    const changed = await app.inject({ method: "POST",
      url: `/api/v1/projects/${project.id}/versions/${target.id}/set-default`,
      cookies: { ossie_session: token }, payload: { expected_version: target.version, expected_project_row_version: project.version } });
    expect(changed.statusCode).toBe(200);
    const rows = await pool.query<{ id: string; is_default: boolean }>(`SELECT version.id,
      project.default_project_version_id = version.id AS is_default
      FROM project_schema.project_version version JOIN project_schema.project project ON project.id = version.project_id
      WHERE version.project_id = $1 ORDER BY version.position`, [project.id]);
    expect(rows.rows).toEqual([{ id: project.default_project_version.id, is_default: false }, { id: target.id, is_default: true }]);
    await app.close();
  });

  it("serializes concurrent slug creation without duplicating order or identity", async () => {
    const { app, token, project } = await setup();
    const responses = await Promise.all(["First", "Second"].map((name) => app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/versions`,
      cookies: { ossie_session: token },
      payload: { name, slug: "shared-release" },
    })));
    expect(responses.map(({ statusCode }) => statusCode).sort()).toEqual([201, 409]);
    const rows = await pool.query<{ slug: string; position: number }>(
      `SELECT slug, position FROM project_schema.project_version
       WHERE project_id = $1 ORDER BY position`,
      [project.id],
    );
    expect(rows.rows).toEqual([
      { slug: "main", position: 1 },
      { slug: "shared-release", position: 2 },
    ]);
    await app.close();
  });

  it("serializes set-Default against archiving the same Version", async () => {
    const { app, token, project } = await setup();
    const created = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/versions`,
      cookies: { ossie_session: token },
      payload: { name: "Contended" },
    });
    const target = created.json().project_version as { id: string; version: number };
    const responses = await Promise.all([
      app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/versions/${target.id}/set-default`,
        cookies: { ossie_session: token },
        payload: { expected_version: target.version, expected_project_row_version: project.version },
      }),
      app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/versions/${target.id}/archive`,
        cookies: { ossie_session: token },
        payload: { expected_version: target.version },
      }),
    ]);
    expect(responses.map(({ statusCode, body }) => ({ statusCode, body })).sort((a, b) => a.statusCode - b.statusCode))
      .toEqual([
        { statusCode: 200, body: expect.any(String) },
        { statusCode: 409, body: expect.any(String) },
      ]);
    const exact_default = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM project_schema.project project
       JOIN project_schema.project_version version_record
         ON version_record.id = project.default_project_version_id
       WHERE project.id = $1 AND version_record.status = 'active'`,
      [project.id],
    );
    expect(Number(exact_default.rows[0]?.count)).toBe(1);
    await app.close();
  });
});
