import { describe, expect, it, vi } from "vitest";
import { build } from "../../app";

describe("Project Version app composition", () => {
  it("mounts the Version API under the Project boundary", async () => {
    const list = vi.fn(async () => []);
    const app = build({ logger: false,
      access_event_writer: { append: async () => undefined },
      authentication_session_service: {
        get_current_auth_context: async () => ({ user: { id: "user_1", email: "owner@example.test", display_name: "Owner" },
          organization: { id: "org_1", name: "Synthetic" }, org_user: { id: "actor_1", role: "owner" },
          session: { id: "session_1", session_type: "web", expires_at: "2026-08-01T00:00:00.000Z" } }),
        login: async () => { throw new Error("not used"); }, logout: async () => { throw new Error("not used"); },
      },
      project_version_service: { list, create: vi.fn(), resolve: vi.fn(), get: vi.fn(), update: vi.fn(),
        reorder: vi.fn(), archive: vi.fn(), restore: vi.fn(), set_default: vi.fn() } as never,
    });
    const response = await app.inject({ method: "GET", url: "/api/v1/projects/project_1/versions" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ project_versions: [] });
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ project_id: "project_1" }));
    await app.close();
  });
});
