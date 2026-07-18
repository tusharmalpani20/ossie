import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";
import { build } from "../../app";
import { hash_session_token } from "../authentication/session-token";
import { build_first_run_setup_repository } from "./first-run-setup.repository";

const count_rows = async (table_name: string) => {
  const result = await pool.query<{ count: string }>(`SELECT COUNT(*) AS count FROM ${table_name}`);
  return Number(result.rows[0]?.count ?? 0);
};

describe("DB-backed first-run setup", () => {
  beforeEach(async () => {
    await reset_test_database();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("persists first owner setup and stores only a session token hash", async () => {
    const app = build({ logger: false });

    const setup_response = await app.inject({
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

    expect(setup_response.statusCode).toBe(201);
    const session_cookie = setup_response.cookies.find((cookie) => cookie.name === "ossie_session");
    expect(session_cookie?.value).toEqual(expect.any(String));
    expect(setup_response.json()).toMatchObject({
      auth: {
        user: {
          email: "owner@example.com",
        },
        organization: {
          name: "Acme",
        },
        org_user: {
          role: "owner",
        },
      },
    });
    expect(JSON.stringify(setup_response.json())).not.toContain("password_hash");
    expect(JSON.stringify(setup_response.json())).not.toContain("token_hash");

    expect(await count_rows("user_schema.user")).toBe(1);
    expect(await count_rows("organization_schema.organization")).toBe(1);
    expect(await count_rows("organization_schema.org_user")).toBe(1);
    expect(await count_rows("auth_schema.auth_session")).toBe(1);

    const persisted = await pool.query<{
      user_email: string;
      organization_name: string;
      org_user_role: string;
      token_hash: string;
      organization_id: string;
      session_organization_id: string;
      org_user_id: string;
      session_org_user_id: string;
    }>(`
      SELECT
        app_user.email AS user_email,
        organization.name AS organization_name,
        org_user.role AS org_user_role,
        auth_session.token_hash,
        organization.id AS organization_id,
        auth_session.organization_id AS session_organization_id,
        org_user.id AS org_user_id,
        auth_session.org_user_id AS session_org_user_id
      FROM auth_schema.auth_session auth_session
      INNER JOIN user_schema.user app_user ON app_user.id = auth_session.user_id
      INNER JOIN organization_schema.organization organization ON organization.id = auth_session.organization_id
      INNER JOIN organization_schema.org_user org_user ON org_user.id = auth_session.org_user_id
    `);

    expect(persisted.rows[0]).toMatchObject({
      user_email: "owner@example.com",
      organization_name: "Acme",
      org_user_role: "owner",
    });
    expect(persisted.rows[0]?.token_hash).toBe(hash_session_token(session_cookie?.value ?? ""));
    expect(persisted.rows[0]?.token_hash).not.toBe(session_cookie?.value);
    expect(persisted.rows[0]?.session_organization_id).toBe(persisted.rows[0]?.organization_id);
    expect(persisted.rows[0]?.session_org_user_id).toBe(persisted.rows[0]?.org_user_id);

    const instance_response = await app.inject({
      method: "GET",
      url: "/api/v1/public/instance",
    });

    expect(instance_response.statusCode).toBe(200);
    expect(instance_response.json()).toMatchObject({
      setup_required: false,
    });

    await app.close();
  });

  it("rejects repeated first-run setup without duplicating setup records", async () => {
    const app = build({ logger: false });
    const payload = {
      owner: {
        email: "owner@example.com",
        password: "safe local password",
      },
      organization: {
        name: "Acme",
      },
    };

    const first_response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload,
    });
    const second_response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "another@example.com",
          password: "another safe password",
        },
        organization: {
          name: "Another",
        },
      },
    });

    expect(first_response.statusCode).toBe(201);
    expect(second_response.statusCode).toBe(409);
    expect(second_response.json()).toMatchObject({
      error: {
        type: "first_run_setup_completed",
      },
    });

    expect(await count_rows("user_schema.user")).toBe(1);
    expect(await count_rows("organization_schema.organization")).toBe(1);
    expect(await count_rows("organization_schema.org_user")).toBe(1);
    expect(await count_rows("auth_schema.auth_session")).toBe(1);

    await app.close();
  });

  it("prevents concurrent first-run requests from creating multiple owners", async () => {
    const app = build({ logger: false });

    const responses = await Promise.all([
      app.inject({
        method: "POST",
        url: "/api/v1/setup/first-run",
        payload: {
          owner: {
            email: "owner-a@example.com",
            password: "safe local password",
          },
          organization: {
            name: "Acme A",
          },
        },
      }),
      app.inject({
        method: "POST",
        url: "/api/v1/setup/first-run",
        payload: {
          owner: {
            email: "owner-b@example.com",
            password: "another safe password",
          },
          organization: {
            name: "Acme B",
          },
        },
      }),
    ]);

    expect(responses.map((response) => response.statusCode).sort()).toEqual([201, 409]);
    expect(await count_rows("user_schema.user")).toBe(1);
    expect(await count_rows("organization_schema.organization")).toBe(1);
    expect(await count_rows("organization_schema.org_user")).toBe(1);
    expect(await count_rows("auth_schema.auth_session")).toBe(1);

    await app.close();
  });

  it("rolls back partial setup records when a transaction fails", async () => {
    const repository = build_first_run_setup_repository(pool);

    await expect(repository.transaction(async (transaction_repository) => {
      await transaction_repository.create_user({
        email: "owner@example.com",
        password_hash: "hashed-password",
        display_name: "Owner",
      });
      await transaction_repository.create_organization({
        name: "Acme",
      });
      throw new Error("forced setup failure");
    })).rejects.toThrow("forced setup failure");

    expect(await count_rows("user_schema.user")).toBe(0);
    expect(await count_rows("organization_schema.organization")).toBe(0);
    expect(await count_rows("organization_schema.org_user")).toBe(0);
    expect(await count_rows("auth_schema.auth_session")).toBe(0);
  });
});
