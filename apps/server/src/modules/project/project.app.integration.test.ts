import { describe, expect, it } from "vitest";
import { build } from "../../app";

describe("project app routes", () => {
  it("mounts project routes under the versioned API", async () => {
    const app = build({
      logger: false,
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
      project_service: {
        create_project: async () => ({
          id: "project_1",
          organization_id: "organization_1",
          name: "Onboarding Demo",
          description: null,
          slug: null,
          color: null,
          icon: null,
          status: "active",
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T00:00:00.000Z",
          updated_at: "2026-06-05T00:00:00.000Z",
          default_project_version: { id: "version_1", name: "Main", slug: "main", status: "active", position: 1 },
        }),
        list_projects: async () => [],
        get_project: async () => {
          throw new Error("not used");
        },
        update_project: async () => {
          throw new Error("not used");
        },
        delete_project: async () => {
          throw new Error("not used");
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        name: "Onboarding Demo",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().project.name).toBe("Onboarding Demo");

    await app.close();
  });
});
