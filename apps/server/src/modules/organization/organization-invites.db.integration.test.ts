import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { pool } from "../../config/database.config";
import { reset_test_database } from "../../test-support/database";
import { hash_invite_token } from "./organization-invites.service";

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
  return response.cookies.find((cookie) => cookie.name === "ossie_session")?.value ?? "";
};

describe("DB-backed organization invites", () => {
  beforeEach(async () => {
    await reset_test_database();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("invites and accepts a new organization member without storing plaintext token", async () => {
    const owner_session = await setup_owner();
    const app = build({ logger: false });

    const create_response = await app.inject({
      method: "POST",
      url: "/api/v1/organization/invites",
      cookies: {
        ossie_session: owner_session,
      },
      payload: {
        email: " Teammate@Example.com ",
        role: "member",
      },
    });

    expect(create_response.statusCode).toBe(201);
    const invite_token = create_response.json().invite_token as string;
    expect(invite_token).toEqual(expect.any(String));
    expect(create_response.json().invite.email).toBe("teammate@example.com");
    expect(create_response.json().invite_url).toContain(`/invites/${invite_token}`);
    expect(JSON.stringify(create_response.json())).not.toContain("token_hash");

    const stored_invite = await pool.query<{ email: string; token_hash: string; status: string }>(`
      SELECT email, token_hash, status
      FROM organization_schema.org_invite
    `);
    expect(stored_invite.rows).toEqual([{
      email: "teammate@example.com",
      token_hash: hash_invite_token(invite_token),
      status: "pending",
    }]);
    expect(stored_invite.rows[0]?.token_hash).not.toBe(invite_token);

    const lookup_response = await app.inject({
      method: "GET",
      url: `/api/v1/public/invites/${invite_token}`,
    });

    expect(lookup_response.statusCode).toBe(200);
    expect(lookup_response.json().invite).toMatchObject({
      organization_name: "Acme",
      email: "teammate@example.com",
      requires_login: false,
    });

    const accept_response = await app.inject({
      method: "POST",
      url: `/api/v1/public/invites/${invite_token}/accept`,
      payload: {
        password: "safe teammate password",
        display_name: "Teammate User",
      },
    });

    expect(accept_response.statusCode).toBe(200);
    const teammate_session = accept_response.cookies.find((cookie) => cookie.name === "ossie_session")?.value ?? "";
    expect(teammate_session).toEqual(expect.any(String));
    expect(accept_response.json().auth).toMatchObject({
      user: {
        email: "teammate@example.com",
        display_name: "Teammate User",
      },
      organization: {
        name: "Acme",
      },
      org_user: {
        role: "member",
      },
    });

    const members_response = await app.inject({
      method: "GET",
      url: "/api/v1/organization/members",
      cookies: {
        ossie_session: owner_session,
      },
    });
    expect(members_response.statusCode).toBe(200);
    expect(members_response.json().members).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: "owner@example.com", role: "owner" }),
      expect.objectContaining({ email: "teammate@example.com", role: "member" }),
    ]));

    const teammate_me_response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: teammate_session,
      },
    });
    expect(teammate_me_response.statusCode).toBe(200);
    expect(teammate_me_response.json().auth.org_user.role).toBe("member");

    const accepted_invite = await pool.query<{ status: string; accepted_user_id: string | null }>(`
      SELECT status, accepted_user_id
      FROM organization_schema.org_invite
    `);
    expect(accepted_invite.rows[0]).toMatchObject({
      status: "accepted",
      accepted_user_id: expect.any(String),
    });

    await app.close();
  });
});
