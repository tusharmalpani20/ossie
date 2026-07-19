import cookie from "@fastify/cookie";
import fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { describe, expect, it } from "vitest";
import type { CaptureAsset } from "../capture-asset/capture-asset.service";
import type { CaptureEvent } from "../capture-event/capture-event.service";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import {
  CaptureSessionNotFoundError,
  CaptureSessionNotCompletableError,
  EmptyCaptureSessionUpdateError,
  ProjectNotFoundError,
  type CaptureSession,
} from "./capture-session.service";
import { build_capture_session_routes } from "./capture-session.routes";

const auth_context = {
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
};

const capture_session: CaptureSession = {
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
  description: "Source capture for the department setup guide",
  status: "draft",
  source_type: "manual",
  started_at: null,
  completed_at: null,
  canceled_at: null,
  start_url: "https://example.internal/app/department",
  browser_name: "Chrome",
  browser_version: "126",
  operating_system: "Linux",
  viewport_width: 1440,
  viewport_height: 900,
  device_pixel_ratio: 1,
  user_agent: "Mozilla/5.0",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const capture_event: CaptureEvent = {
  id: "capture_event_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: "capture_asset_1",
  event_type: "capture",
  event_index: 1,
  occurred_at: "2026-06-05T00:01:00.000Z",
  page_url: "https://example.internal/app/department",
  page_title: "Department",
  target_label: null,
  target_selector: null,
  target_role: null,
  target_test_id: null,
  target_text: null,
  client_x: null,
  client_y: null,
  viewport_width: 1440,
  viewport_height: 900,
  device_pixel_ratio: 1,
  input_intent: null,
  input_value_redacted: true,
  note: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:01:00.000Z",
  updated_at: "2026-06-05T00:01:00.000Z",
};

const capture_asset: CaptureAsset & { file_url: string } = {
  id: "capture_asset_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_1",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 123,
    original_name: "screenshot.png",
    checksum_sha256: "checksum",
  },
      asset_type: "screenshot",
      status: "active",
  width: 1440,
  height: 900,
  device_pixel_ratio: 1,
  page_url: "https://example.internal/app/department",
  page_title: "Department",
  captured_at: "2026-06-05T00:01:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:01:00.000Z",
  updated_at: "2026-06-05T00:01:00.000Z",
  file_url:
    "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/file",
};

const build_test_app = async (
  overrides: {
    auth_service?: Partial<
      Parameters<typeof build_capture_session_routes>[0]["auth_service"]
    >;
    capture_session_service?: Partial<
      Parameters<
        typeof build_capture_session_routes
      >[0]["capture_session_service"]
    >;
  } = {},
) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  await app.register(
    build_capture_session_routes({
      auth_service: {
        get_current_auth_context: async () => auth_context,
        ...overrides.auth_service,
      },
      capture_session_service: {
        create_capture_session: async () => capture_session,
        list_capture_sessions: async () => [capture_session],
        get_capture_session: async () => capture_session,
        get_capture_session_detail: async () => ({
          capture_session,
          capture_events: [capture_event],
          capture_assets: [capture_asset],
        }),
        complete_capture_session: async () => ({
          capture_session: {
            ...capture_session,
            status: "completed",
            completed_at: "2026-06-05T00:00:02.000Z",
            version: 2,
          },
          redirect: {
            path: "/projects/project_1/capture-sessions/capture_session_1",
            reason: "capture_session_completed",
          },
        }),
        update_capture_session: async () => ({
          ...capture_session,
          name: "Updated Capture",
          status: "capturing",
          started_at: "2026-06-05T00:00:01.000Z",
          version: 2,
        }),
        delete_capture_session: async () => undefined,
        reassign_project_version: async () => capture_session,
        ...overrides.capture_session_service,
      },
    }),
    { prefix: "/api/v1/projects" },
  );
  return app;
};

describe("capture session routes", () => {
  it("rejects requests without a valid auth session", async () => {
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async () => {
          throw new UnauthenticatedSessionError();
        },
      },
    });

    for (const request of [
      {
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions",
        payload: { name: "Capture", project_version_id: "version_1" },
      },
      {
        method: "GET",
        url: "/api/v1/projects/project_1/capture-sessions?project_version_id=version_1",
      },
      {
        method: "GET",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1",
      },
      {
        method: "GET",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/detail",
      },
      {
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/complete",
      },
      {
        method: "PATCH",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1",
        payload: { name: "Updated" },
      },
      {
        method: "DELETE",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1",
      },
    ] as const) {
      const response = await app.inject(request);
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: {
          type: "unauthenticated",
          message: "Authentication is required",
        },
      });
    }

    await app.close();
  });

  it("completes capture sessions and returns redirect information", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      capture_session_service: {
        complete_capture_session: async (input) => {
          seen_inputs.push(input);
          return {
            capture_session: {
              ...capture_session,
              status: "completed",
              completed_at: "2026-06-05T00:00:02.000Z",
              version: 2,
            },
            redirect: {
              path: "/projects/project_1/capture-sessions/capture_session_1",
              reason: "capture_session_completed",
            },
          };
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/complete",
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      capture_session: {
        id: "capture_session_1",
        status: "completed",
        completed_at: "2026-06-05T00:00:02.000Z",
        version: 2,
      },
      redirect: {
        path: "/projects/project_1/capture-sessions/capture_session_1",
        reason: "capture_session_completed",
      },
    });
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      },
    ]);

    await app.close();
  });

  it("accepts empty complete body and rejects non-empty complete body", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      capture_session_service: {
        complete_capture_session: async (input) => {
          seen_inputs.push(input);
          return {
            capture_session,
            redirect: {
              path: "/projects/project_1/capture-sessions/capture_session_1",
              reason: "capture_session_completed",
            },
          };
        },
      },
    });

    const empty_body_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/complete",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {},
    });
    const non_empty_body_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/complete",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        completed_at: "2026-06-05T00:00:00.000Z",
      },
    });
    const null_body_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/complete",
      headers: {
        "content-type": "application/json",
      },
      cookies: {
        ossie_session: "session-token",
      },
      payload: "null",
    });
    const array_body_response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/complete",
      headers: {
        "content-type": "application/json",
      },
      cookies: {
        ossie_session: "session-token",
      },
      payload: "[]",
    });

    expect(empty_body_response.statusCode).toBe(200);
    expect(non_empty_body_response.statusCode).toBe(400);
    expect(non_empty_body_response.json().error.type).toBe(
      "invalid_capture_session_completion",
    );
    expect(null_body_response.statusCode).toBe(400);
    expect(null_body_response.json().error.type).toBe(
      "invalid_capture_session_completion",
    );
    expect(array_body_response.statusCode).toBe(400);
    expect(array_body_response.json().error.type).toBe(
      "invalid_capture_session_completion",
    );
    expect(seen_inputs).toHaveLength(1);

    await app.close();
  });

  it("creates a capture session with auth context and URL project id", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("session-token");
          return auth_context;
        },
      },
      capture_session_service: {
        create_capture_session: async (input) => {
          seen_inputs.push(input);
          return capture_session;
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions",
      cookies: {
        ossie_session: "session-token",
      },
      headers: { "x-ossie-client": "extension" },
      payload: {
        name: "Create department workflow",
        project_version_id: "version_1",
        description: "Source capture for the department setup guide",
        source_type: "extension",
        status: "completed",
        organization_id: "attacker_org",
        project_id: "attacker_project",
        created_by_id: "attacker_org_user",
        started_at: "attacker timestamp",
        metadata: {
          capture_mode: "screenshot",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        data: {
          name: "Create department workflow",
          project_version_id: "version_1",
          description: "Source capture for the department setup guide",
          source_type: "extension",
          metadata: {
            capture_mode: "screenshot",
          },
        },
      },
    ]);
    expect(response.json()).toEqual({ capture_session });
    expect(JSON.stringify(response.json())).not.toContain("is_deleted");
    expect(JSON.stringify(response.json())).not.toContain("deleted_at");
    expect(JSON.stringify(response.json())).not.toContain("deleted_by_id");
    expect(JSON.stringify(response.json())).not.toContain("metadata");

    await app.close();
  });

  it("creates a capture session with bearer auth", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          expect(session_token).toBe("extension-session-token");
          return auth_context;
        },
      },
      capture_session_service: {
        create_capture_session: async (input) => {
          seen_inputs.push(input);
          return {
            ...capture_session,
            source_type: "extension",
          };
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions",
      headers: {
        authorization: "Bearer extension-session-token",
        "x-ossie-client": "extension",
      },
      payload: {
        name: "Capture from Example Page",
        project_version_id: "version_1",
        source_type: "extension",
        start_url: "https://example.com/path",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().capture_session.source_type).toBe("extension");
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        data: {
          name: "Capture from Example Page",
          project_version_id: "version_1",
          source_type: "extension",
          start_url: "https://example.com/path",
        },
      },
    ]);

    await app.close();
  });

  it("reads capture sessions with bearer auth", async () => {
    const seen_tokens: Array<string | undefined> = [];
    const app = await build_test_app({
      auth_service: {
        get_current_auth_context: async (session_token) => {
          seen_tokens.push(session_token);
          return auth_context;
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1",
      headers: {
        authorization: "Bearer extension-session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ capture_session });
    expect(seen_tokens).toEqual(["extension-session-token"]);

    await app.close();
  });

  it("lists gets updates and deletes capture sessions through the service", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      capture_session_service: {
        list_capture_sessions: async (input) => {
          seen_inputs.push(input);
          return [capture_session];
        },
        get_capture_session: async (input) => {
          seen_inputs.push(input);
          return capture_session;
        },
        update_capture_session: async (input) => {
          seen_inputs.push(input);
          return {
            ...capture_session,
            name: "Updated Capture",
            status: "capturing",
            started_at: "2026-06-05T00:00:01.000Z",
            version: 2,
          };
        },
        delete_capture_session: async (input) => {
          seen_inputs.push(input);
        },
      },
    });

    const list_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions?project_version_id=version_1&status=completed",
      cookies: {
        ossie_session: "session-token",
      },
    });
    const get_response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1",
      cookies: {
        ossie_session: "session-token",
      },
    });
    const update_response = await app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1",
      cookies: {
        ossie_session: "session-token",
      },
      payload: {
        name: "Updated Capture",
        status: "capturing",
        unknown_field: "ignored",
      },
    });
    const delete_response = await app.inject({
      method: "DELETE",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1",
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(list_response.statusCode).toBe(200);
    expect(list_response.json()).toEqual({
      capture_sessions: [capture_session],
    });
    expect(get_response.statusCode).toBe(200);
    expect(get_response.json()).toEqual({ capture_session });
    expect(update_response.statusCode).toBe(200);
    expect(update_response.json().capture_session).toMatchObject({
      name: "Updated Capture",
      status: "capturing",
      version: 2,
    });
    expect(delete_response.statusCode).toBe(204);
    expect(delete_response.body).toBe("");
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        project_version_id: "version_1",
        status: "completed",
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: {
          name: "Updated Capture",
          status: "capturing",
        },
      },
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      },
    ]);

    await app.close();
  });

  it("gets capture session detail through the detail service route", async () => {
    const seen_inputs: unknown[] = [];
    const app = await build_test_app({
      capture_session_service: {
        get_capture_session: async () => {
          throw new Error(
            "generic get route should not handle detail requests",
          );
        },
        get_capture_session_detail: async (input) => {
          seen_inputs.push(input);
          return {
            capture_session,
            capture_events: [capture_event],
            capture_assets: [capture_asset],
          };
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/detail",
      cookies: {
        ossie_session: "session-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      capture_session,
      capture_events: [capture_event],
      capture_assets: [capture_asset],
    });
    expect(seen_inputs).toEqual([
      {
        auth: {
          organization_id: "organization_1",
          actor_org_user_id: "org_user_1",
        },
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      },
    ]);

    await app.close();
  });

  it("maps capture session domain errors to stable responses", async () => {
    const project_not_found_app = await build_test_app({
      capture_session_service: {
        create_capture_session: async () => {
          throw new ProjectNotFoundError();
        },
      },
    });
    const capture_not_found_app = await build_test_app({
      capture_session_service: {
        get_capture_session: async () => {
          throw new CaptureSessionNotFoundError();
        },
      },
    });
    const empty_update_app = await build_test_app({
      capture_session_service: {
        update_capture_session: async () => {
          throw new EmptyCaptureSessionUpdateError();
        },
      },
    });
    const not_completable_app = await build_test_app({
      capture_session_service: {
        complete_capture_session: async () => {
          throw new CaptureSessionNotCompletableError();
        },
      },
    });

    const project_not_found_response = await project_not_found_app.inject({
      method: "POST",
      url: "/api/v1/projects/missing/capture-sessions",
      cookies: { ossie_session: "session-token" },
      payload: { name: "Capture", project_version_id: "version_1" },
    });
    const capture_not_found_response = await capture_not_found_app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/missing",
      cookies: { ossie_session: "session-token" },
    });
    const empty_update_response = await empty_update_app.inject({
      method: "PATCH",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1",
      cookies: { ossie_session: "session-token" },
      payload: {},
    });
    const not_completable_response = await not_completable_app.inject({
      method: "POST",
      url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/complete",
      cookies: { ossie_session: "session-token" },
    });
    const detail_not_found_app = await build_test_app({
      capture_session_service: {
        get_capture_session_detail: async () => {
          throw new CaptureSessionNotFoundError();
        },
      },
    });
    const detail_project_not_found_app = await build_test_app({
      capture_session_service: {
        get_capture_session_detail: async () => {
          throw new ProjectNotFoundError();
        },
      },
    });
    const detail_not_found_response = await detail_not_found_app.inject({
      method: "GET",
      url: "/api/v1/projects/project_1/capture-sessions/missing/detail",
      cookies: { ossie_session: "session-token" },
    });
    const detail_project_not_found_response =
      await detail_project_not_found_app.inject({
        method: "GET",
        url: "/api/v1/projects/missing/capture-sessions/capture_session_1/detail",
        cookies: { ossie_session: "session-token" },
      });

    expect(project_not_found_response.statusCode).toBe(404);
    expect(project_not_found_response.json()).toEqual({
      error: {
        type: "project_not_found",
        message: "Project was not found",
      },
    });
    expect(capture_not_found_response.statusCode).toBe(404);
    expect(capture_not_found_response.json()).toEqual({
      error: {
        type: "capture_session_not_found",
        message: "Capture session was not found",
      },
    });
    expect(empty_update_response.statusCode).toBe(400);
    expect(empty_update_response.json().error.type).toBe(
      "empty_capture_session_update",
    );
    expect(not_completable_response.statusCode).toBe(400);
    expect(not_completable_response.json()).toEqual({
      error: {
        type: "capture_session_not_completable",
        message: "Capture session cannot be completed from its current status",
      },
    });
    expect(detail_not_found_response.statusCode).toBe(404);
    expect(detail_not_found_response.json().error.type).toBe(
      "capture_session_not_found",
    );
    expect(detail_project_not_found_response.statusCode).toBe(404);
    expect(detail_project_not_found_response.json().error.type).toBe(
      "project_not_found",
    );

    await project_not_found_app.close();
    await capture_not_found_app.close();
    await empty_update_app.close();
    await not_completable_app.close();
    await detail_not_found_app.close();
    await detail_project_not_found_app.close();
  });

  it("rejects invalid capture session input", async () => {
    const app = await build_test_app();

    for (const payload of [
      { name: "   ", project_version_id: "version_1" },
      {
        name: "Capture",
        project_version_id: "version_1",
        source_type: "screen_magic",
      },
      { name: "Capture", project_version_id: "version_1", viewport_width: 0 },
      { name: "Capture", project_version_id: "version_1", viewport_height: -1 },
      {
        name: "Capture",
        project_version_id: "version_1",
        device_pixel_ratio: 0,
      },
    ]) {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/projects/project_1/capture-sessions",
        cookies: {
          ossie_session: "session-token",
        },
        payload,
      });
      expect(response.statusCode).toBe(400);
    }

    await app.close();
  });

  it("rejects client-managed lifecycle timestamps on update", async () => {
    const app = await build_test_app();

    for (const payload of [
      { name: "Updated Capture", started_at: "2026-06-05T00:00:00.000Z" },
      { name: "Updated Capture", completed_at: "2026-06-05T00:00:00.000Z" },
      { name: "Updated Capture", canceled_at: "2026-06-05T00:00:00.000Z" },
    ]) {
      const response = await app.inject({
        method: "PATCH",
        url: "/api/v1/projects/project_1/capture-sessions/capture_session_1",
        cookies: {
          ossie_session: "session-token",
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          type: "invalid_capture_session",
          message: "Capture session input is invalid",
        },
      });
    }

    await app.close();
  });
});
