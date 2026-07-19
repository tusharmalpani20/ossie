import { describe, expect, it } from "vitest";
import {
  access_request_context,
  current_access_request_context,
  run_with_access_request_context,
  set_access_auth_context,
  set_access_resolved_resource,
} from "./access-request-context";

describe("Access request context", () => {
  it("derives only normalized source and public surface claims", () => {
    expect(
      access_request_context({
        id: "request-1",
        method: "GET",
        headers: {
          "x-ossie-client": "extension",
          "x-ossie-access-surface": "public_embed",
        },
        routeOptions: { url: "/api/v1/public/publish-links/:slug" },
      }),
    ).toMatchObject({
      request_id: "request-1",
      source_type: "extension",
      public_surface: "public_embed",
    });

    expect(
      access_request_context({
        id: "request-2",
        method: "GET",
        headers: {
          "x-ossie-client": "system",
          "x-ossie-access-surface": "private_admin",
        },
        routeOptions: { url: "/api/v1/projects" },
      }),
    ).toMatchObject({ source_type: "web", public_surface: null });
  });

  it("allows services to add only trusted auth and resolved-resource facts", async () => {
    const context = access_request_context({
      id: "request-3",
      method: "GET",
      headers: {},
      routeOptions: { url: "/api/v1/projects/:id" },
    });

    await run_with_access_request_context(context, async () => {
      set_access_auth_context({
        organization_id: "01J00000000000000000000001",
        org_user_id: "01J00000000000000000000002",
        actor_label: "Synthetic owner",
        organization_role: "owner",
        auth_session_id: "01J00000000000000000000003",
      });
      set_access_resolved_resource({
        organization_id: "01J00000000000000000000001",
        project_id: "01J00000000000000000000004",
        root_resource_type: "project",
        root_resource_id: "01J00000000000000000000004",
      });

      expect(current_access_request_context()).toMatchObject({
        auth: { organization_role: "owner" },
        resolved_resource: { root_resource_type: "project" },
      });
      await Promise.resolve();
      expect(current_access_request_context()?.request_id).toBe("request-3");
    });
    expect(current_access_request_context()).toBeNull();
  });
});
