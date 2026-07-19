import { describe, expect, it } from "vitest";
import { build } from "../../app";

describe("authentication session app routes", () => {
  it("allows extension login request headers during CORS preflight", async () => {
    const app = build({ logger: false });

    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/authentication/login",
      headers: {
        origin: "chrome-extension://extension-id",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-ossie-client",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(String(response.headers["access-control-allow-headers"]).toLowerCase()).toContain("x-ossie-client");

    await app.close();
  });

  it("mounts authentication session routes under the versioned API", async () => {
    const app = build({
      logger: false,
      access_event_writer: { append: async () => undefined },
      authentication_session_service: {
        get_current_auth_context: async () => ({
          user: {
            id: "user_1",
            email: "owner@example.com",
            display_name: "Owner User",
          },
          organization: {
            id: "organization_1",
            name: "Acme",
          },
          org_user: {
            id: "org_user_1",
            role: "owner",
          },
          session: {
            id: "session_1",
            session_type: "web",
            expires_at: "2026-07-05T00:00:00.000Z",
          },
        }),
        login: async () => {
          throw new Error("not used");
        },
        logout: async () => {
          throw new Error("not used");
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/authentication/me",
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().auth.user.email).toBe("owner@example.com");

    await app.close();
  });

  it("does not mount removed legacy authentication routes", async () => {
    const app = build({ logger: false });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/authentication/signin/password",
      payload: {
        email: "owner@example.com",
        password: "safe local password",
      },
    });

    expect(response.statusCode).toBe(404);

    await app.close();
  });
});
