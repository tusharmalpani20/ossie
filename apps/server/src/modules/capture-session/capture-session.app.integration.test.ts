import { describe, expect, it } from "vitest";
import { build } from "../../app";

describe("capture session app routes", () => {
  it("mounts capture session routes under project-owned versioned API paths", async () => {
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
      capture_session_service: {
        create_capture_session: async () => ({
          id: "capture_session_1",
          organization_id: "organization_1",
          project_id: "project_1",
          project_version_id: "version_1",
          project_version: {
            id: "version_1",
            name: "Current",
            slug: "current",
            status: "active",
            position: 1,
          },
          name: "Create department workflow",
          description: null,
          status: "draft",
          source_type: "manual",
          started_at: null,
          completed_at: null,
          canceled_at: null,
          start_url: null,
          browser_name: null,
          browser_version: null,
          operating_system: null,
          viewport_width: null,
          viewport_height: null,
          device_pixel_ratio: null,
          user_agent: null,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T00:00:00.000Z",
          updated_at: "2026-06-05T00:00:00.000Z",
        }),
        list_capture_sessions: async () => [],
        get_capture_session: async () => {
          throw new Error("not used");
        },
        get_capture_session_detail: async () => ({
          capture_session: {
            id: "capture_session_1",
            organization_id: "organization_1",
            project_id: "project_1",
            project_version_id: "version_1",
            project_version: {
              id: "version_1",
              name: "Current",
              slug: "current",
              status: "active",
              position: 1,
            },
            name: "Create department workflow",
            description: null,
            status: "draft",
            source_type: "manual",
            started_at: null,
            completed_at: null,
            canceled_at: null,
            start_url: null,
            browser_name: null,
            browser_version: null,
            operating_system: null,
            viewport_width: null,
            viewport_height: null,
            device_pixel_ratio: null,
            user_agent: null,
            created_by_id: "org_user_1",
            updated_by_id: "org_user_1",
            version: 1,
            created_at: "2026-06-05T00:00:00.000Z",
            updated_at: "2026-06-05T00:00:00.000Z",
          },
          capture_events: [],
          capture_assets: [],
        }),
        complete_capture_session: async () => ({
          capture_session: {
            id: "capture_session_1",
            organization_id: "organization_1",
            project_id: "project_1",
            project_version_id: "version_1",
            project_version: {
              id: "version_1",
              name: "Current",
              slug: "current",
              status: "active",
              position: 1,
            },
            name: "Create department workflow",
            description: null,
            status: "completed",
            source_type: "manual",
            started_at: null,
            completed_at: "2026-06-05T00:00:01.000Z",
            canceled_at: null,
            start_url: null,
            browser_name: null,
            browser_version: null,
            operating_system: null,
            viewport_width: null,
            viewport_height: null,
            device_pixel_ratio: null,
            user_agent: null,
            created_by_id: "org_user_1",
            updated_by_id: "org_user_1",
            version: 2,
            created_at: "2026-06-05T00:00:00.000Z",
            updated_at: "2026-06-05T00:00:01.000Z",
          },
          redirect: {
            path: "/projects/project_1/versions/current/capture-sessions/capture_session_1",
            reason: "capture_session_completed",
          },
        }),
        update_capture_session: async () => {
          throw new Error("not used");
        },
        delete_capture_session: async () => {
          throw new Error("not used");
        },
        reassign_project_version: async () => {
          throw new Error("not used");
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        name: "Create department workflow",
        project_version_id: "version_1",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().capture_session.name).toBe(
      "Create department workflow",
    );

    const complete_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/complete",
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(complete_response.statusCode).toBe(200);
    expect(complete_response.json()).toMatchObject({
      capture_session: {
        status: "completed",
      },
      redirect: {
        path: "/projects/project_1/versions/current/capture-sessions/capture_session_1",
        reason: "capture_session_completed",
      },
    });

    const detail_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/detail",
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(detail_response.statusCode).toBe(200);
    expect(detail_response.json()).toMatchObject({
      capture_session: {
        id: "capture_session_1",
      },
      capture_events: [],
      capture_assets: [],
    });

    await app.close();
  });
});
