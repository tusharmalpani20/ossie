import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import {
  reset_test_database,
  with_maintenance_client,
} from "../../test-support/database";
import { hash_session_token } from "./session-token";

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
  const session_cookie = response.cookies.find(
    (cookie) => cookie.name === "ossie_session",
  );
  expect(session_cookie?.value).toEqual(expect.any(String));
  return session_cookie?.value ?? "";
};

const count_sessions = async () => {
  const result = await pool.query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM auth_schema.auth_session",
  );
  return Number(result.rows[0]?.count ?? 0);
};

describe("DB-backed authentication session", () => {
  beforeEach(async () => {
    await reset_test_database();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("authenticates setup and login sessions, then logs out only the current session", async () => {
    const setup_session_token = await setup_owner();
    const app = build({ logger: false });

    const setup_me_response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: setup_session_token,
      },
    });

    expect(setup_me_response.statusCode).toBe(200);
    expect(setup_me_response.json()).toMatchObject({
      auth: {
        user: {
          email: "owner@example.com",
          display_name: "Owner User",
        },
        organization: {
          name: "Acme",
        },
        org_user: {
          role: "owner",
        },
        session: {
          session_type: "web",
        },
      },
    });
    expect(JSON.stringify(setup_me_response.json())).not.toContain(
      "password_hash",
    );
    expect(JSON.stringify(setup_me_response.json())).not.toContain(
      "token_hash",
    );

    const login_response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      payload: {
        email: " OWNER@example.com ",
        password: "safe local password",
      },
    });

    expect(login_response.statusCode).toBe(200);
    const login_session_token =
      login_response.cookies.find((cookie) => cookie.name === "ossie_session")
        ?.value ?? "";
    expect(login_session_token).toEqual(expect.any(String));
    expect(login_session_token).not.toBe(setup_session_token);
    expect(await count_sessions()).toBe(2);

    await with_maintenance_client((client) =>
      client.query(
        `UPDATE auth_schema.auth_session
         SET last_active_at = TIMESTAMPTZ '2000-01-01T00:00:00Z'
         WHERE token_hash = $1`,
        [hash_session_token(login_session_token)],
      ),
    );

    const login_me_response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: login_session_token,
      },
    });

    expect(login_me_response.statusCode).toBe(200);
    const touched_session = await pool.query<{ last_active_at: Date }>(
      `
      SELECT last_active_at
      FROM auth_schema.auth_session
      WHERE token_hash = $1
    `,
      [hash_session_token(login_session_token)],
    );
    expect(
      touched_session.rows[0]?.last_active_at.getFullYear(),
    ).toBeGreaterThan(2000);

    const logout_response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/logout",
      cookies: {
        ossie_session: login_session_token,
      },
    });

    expect(logout_response.statusCode).toBe(204);
    expect(logout_response.cookies).toContainEqual(
      expect.objectContaining({
        name: "ossie_session",
        value: "",
        path: "/",
      }),
    );

    const logged_out_me_response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: login_session_token,
      },
    });
    expect(logged_out_me_response.statusCode).toBe(401);

    const setup_still_active_response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: setup_session_token,
      },
    });
    expect(setup_still_active_response.statusCode).toBe(200);

    const session_statuses = await pool.query<{
      token_hash: string;
      status: string;
      revoked_at: Date | null;
    }>(`
      SELECT token_hash, status, revoked_at
      FROM auth_schema.auth_session
    `);
    expect(session_statuses.rows).toContainEqual(
      expect.objectContaining({
        token_hash: hash_session_token(login_session_token),
        status: "revoked",
        revoked_at: expect.any(Date),
      }),
    );
    expect(session_statuses.rows).toContainEqual(
      expect.objectContaining({
        token_hash: hash_session_token(setup_session_token),
        status: "active",
        revoked_at: null,
      }),
    );

    await app.close();
  });

  it("rejects expired sessions and invalid credentials", async () => {
    const setup_session_token = await setup_owner();
    const app = build({ logger: false });

    const invalid_login_response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      payload: {
        email: "owner@example.com",
        password: "wrong password",
      },
    });

    expect(invalid_login_response.statusCode).toBe(401);
    expect(await count_sessions()).toBe(1);

    await with_maintenance_client((client) =>
      client.query(
        `UPDATE auth_schema.auth_session
         SET expires_at = CURRENT_TIMESTAMP - interval '1 second'
         WHERE token_hash = $1`,
        [hash_session_token(setup_session_token)],
      ),
    );

    const expired_me_response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: setup_session_token,
      },
    });

    expect(expired_me_response.statusCode).toBe(401);

    await app.close();
  });

  it("rejects sessions and login when user organization or membership is disabled", async () => {
    const setup_session_token = await setup_owner();
    const app = build({ logger: false });

    await with_maintenance_client((client) =>
      client.query("UPDATE user_schema.user SET status = 'disabled'"),
    );

    const disabled_user_me_response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: setup_session_token,
      },
    });
    const disabled_user_login_response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      payload: {
        email: "owner@example.com",
        password: "safe local password",
      },
    });

    expect(disabled_user_me_response.statusCode).toBe(401);
    expect(disabled_user_login_response.statusCode).toBe(401);

    await with_maintenance_client(async (client) => {
      await client.query("UPDATE user_schema.user SET status = 'active'");
      await client.query(
        "UPDATE organization_schema.organization SET status = 'disabled'",
      );
    });

    const disabled_organization_me_response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: setup_session_token,
      },
    });
    const disabled_organization_login_response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      payload: {
        email: "owner@example.com",
        password: "safe local password",
      },
    });

    expect(disabled_organization_me_response.statusCode).toBe(401);
    expect(disabled_organization_login_response.statusCode).toBe(401);

    await with_maintenance_client(async (client) => {
      await client.query(
        "UPDATE organization_schema.organization SET status = 'active'",
      );
      await client.query(
        "UPDATE organization_schema.org_user SET status = 'disabled'",
      );
    });

    const disabled_membership_me_response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: setup_session_token,
      },
    });
    const disabled_membership_login_response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/login",
      payload: {
        email: "owner@example.com",
        password: "safe local password",
      },
    });

    expect(disabled_membership_me_response.statusCode).toBe(401);
    expect(disabled_membership_login_response.statusCode).toBe(401);
    expect(await count_sessions()).toBe(1);

    await app.close();
  });
});
