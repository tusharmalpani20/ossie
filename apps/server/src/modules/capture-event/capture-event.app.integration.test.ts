import { describe, expect, it } from "vitest";
import { build } from "../../app";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import type { CaptureEvent } from "./capture-event.service";

const capture_event: CaptureEvent = {
  id: "capture_event_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: null,
  event_type: "note",
  event_index: 1,
  occurred_at: "2026-06-05T00:00:00.000Z",
  page_url: null,
  page_title: null,
  target_label: null,
  target_selector: null,
  target_role: null,
  target_test_id: null,
  target_text: null,
  client_x: null,
  client_y: null,
  viewport_width: null,
  viewport_height: null,
  device_pixel_ratio: null,
  input_intent: null,
  input_value_redacted: true,
  note: "Remember this",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

describe("capture event app integration", () => {
  it("mounts capture event routes on the project capture session path", async () => {
    const app = build({
      logger: false,
      access_event_writer: { append: async () => undefined },
      authentication_session_service: {
        login: async () => {
          throw new Error("not needed");
        },
        get_current_auth_context: async () => ({
          user: { id: "user_1", email: "owner@example.com", display_name: "Owner User" },
          organization: { id: "organization_1", name: "Acme" },
          org_user: { id: "org_user_1", role: "owner" },
          session: { id: "session_1", session_type: "web", expires_at: "2026-07-05T00:00:00.000Z" },
        }),
        logout: async () => undefined,
      },
      capture_event_service: {
        create_capture_event: async () => capture_event,
        list_capture_events: async () => [capture_event],
        get_capture_event: async () => capture_event,
        delete_capture_event: async () => undefined,
        reorder_capture_events: async () => [capture_event],
        update_capture_event: async () => ({
          ...capture_event,
          page_title: "Department list",
          note: "Open the department list.",
          version: 2,
        }),
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events",
      cookies: { ossie_session: "session-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ capture_events: [capture_event] });

    const update_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events/capture_event_1",
      cookies: { ossie_session: "session-token" },
      payload: {
        page_title: "Department list",
        note: "Open the department list.",
      },
    });

    expect(update_response.statusCode).toBe(200);
    expect(update_response.json()).toEqual({
      capture_event: {
        ...capture_event,
        page_title: "Department list",
        note: "Open the department list.",
        version: 2,
      },
    });
    await app.close();
  });

  it("uses the default auth guard when no capture event override is provided", async () => {
    const app = build({
      logger: false,
      authentication_session_service: {
        login: async () => {
          throw new Error("not needed");
        },
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
        logout: async () => undefined,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/events",
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
