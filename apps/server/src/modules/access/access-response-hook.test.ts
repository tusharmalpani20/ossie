import { describe, expect, it, vi } from "vitest";
import {
  access_request_context,
  run_with_access_request_context,
  set_access_auth_context,
} from "./access-request-context";
import { build_access_response_hook } from "./access-response-hook";

const reply = (statusCode = 200, contentLength?: number) => {
  const state = {
    statusCode,
    headers: new Map<string, string>(),
  };
  if (contentLength !== undefined)
    state.headers.set("content-length", String(contentLength));
  return {
    get statusCode() {
      return state.statusCode;
    },
    code: vi.fn((status: number) => {
      state.statusCode = status;
      return response;
    }),
    header: vi.fn((name: string, value: string) => {
      state.headers.set(name.toLowerCase(), value);
      return response;
    }),
    getHeader: vi.fn((name: string) => state.headers.get(name.toLowerCase())),
  } as never;
  function response() {}
};

const request = (method: string, url: string, params: Record<string, string> = {}) => ({
  id: "request-1",
  method,
  headers: {},
  routeOptions: { url },
  params,
});

const with_owner = async <Result>(
  request_value: ReturnType<typeof request>,
  work: () => Promise<Result>,
) => {
  const context = access_request_context(request_value);
  return run_with_access_request_context(context, async () => {
    set_access_auth_context({
      organization_id: "01J00000000000000000000001",
      org_user_id: "01J00000000000000000000002",
      actor_label: "Synthetic owner",
      organization_role: "owner",
      auth_session_id: "01J00000000000000000000003",
    });
    return work();
  });
};

describe("Access response hook", () => {
  it("persists a successful protected read before returning its payload", async () => {
    const append = vi.fn(async () => undefined);
    const hook = build_access_response_hook({ append, generate_id: () => "01J00000000000000000000004", now: () => new Date("2026-07-19T12:00:00.000Z") });
    const request_value = request("GET", "/api/v1/projects/:id", {
      id: "01J00000000000000000000005",
    });

    const payload = await with_owner(request_value, () =>
      hook(request_value as never, reply(), '{"project":{}}'),
    );

    expect(payload).toBe('{"project":{}}');
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "01J00000000000000000000001",
        project_id: "01J00000000000000000000005",
        root_resource_id: "01J00000000000000000000005",
        action: "project.viewed",
        outcome: "succeeded",
      }),
    );
  });

  it("does not duplicate an Access Event already written atomically", async () => {
    const append = vi.fn();
    const hook = build_access_response_hook({ append });
    const request_value = request("POST", "/api/v1/authentication/login");
    const context = access_request_context(request_value);
    context.atomic_access_event_id = "01J00000000000000000000006";

    await run_with_access_request_context(context, () =>
      hook(request_value as never, reply(), "{}"),
    );
    expect(append).not.toHaveBeenCalled();
  });

  it("replaces protected stream bytes with the stable 503 when append fails", async () => {
    const hook = build_access_response_hook({
      append: vi.fn(async () => {
        throw new Error("private database detail");
      }),
    });
    const request_value = request(
      "GET",
      "/api/v1/projects/:project_id/guides/:guide_id/export/html.zip",
      {
        project_id: "01J00000000000000000000005",
        guide_id: "01J00000000000000000000006",
      },
    );
    const stream = { destroy: vi.fn() };
    const response = reply(200, 42) as unknown as {
      statusCode: number;
      code: ReturnType<typeof vi.fn>;
      header: ReturnType<typeof vi.fn>;
    };

    const payload = await with_owner(request_value, () =>
      hook(request_value as never, response as never, stream as never),
    );

    expect(stream.destroy).toHaveBeenCalledOnce();
    expect(response.code).toHaveBeenCalledWith(503);
    expect(payload).toBe(
      JSON.stringify({
        error: {
          type: "access_evidence_unavailable",
          message: "Access evidence is temporarily unavailable",
        },
      }),
    );
  });
});
