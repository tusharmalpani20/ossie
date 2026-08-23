import fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { describe, expect, it, vi } from "vitest";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import {
  build_compliance_routes,
  type ComplianceRouteDependencies,
} from "./compliance.routes";
import { CompliancePermissionError } from "./compliance.service";

const auth = {
  user: {
    id: "01J00000000000000000000001",
    email: "owner@example.test",
    display_name: "Synthetic owner",
  },
  organization: {
    id: "01J00000000000000000000002",
    name: "Synthetic organization",
  },
  org_user: { id: "01J00000000000000000000003", role: "owner" },
  session: {
    id: "01J00000000000000000000004",
    session_type: "web",
    expires_at: "2026-08-19T12:00:00.000Z",
  },
};

const build_app = (overrides: Partial<ComplianceRouteDependencies> = {}) => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(
    build_compliance_routes({
      auth_service: {
        get_current_auth_context: vi.fn(async () => auth),
      },
      compliance_service: {
        list_events: vi.fn(async () => ({
          events: [],
          page: { next_cursor: null, has_more: false },
          totals: {
            audit_events: 0,
            audit_change_items: 0,
            access_events: 0,
            oldest_occurred_at: null,
            newest_occurred_at: null,
          },
        })),
        get_audit_event_detail: vi.fn(),
      },
      ...overrides,
    }),
    { prefix: "/api/v1/organization/compliance" },
  );
  return app;
};

describe("compliance routes", () => {
  it("returns an Owner-scoped cursor page", async () => {
    const list_events = vi.fn(async () => ({
      events: [],
      page: { next_cursor: null, has_more: false },
      totals: {
        audit_events: 2,
        audit_change_items: 4,
        access_events: 3,
        oldest_occurred_at: null,
        newest_occurred_at: null,
      },
    }));
    const app = build_app({
      compliance_service: {
        list_events,
        get_audit_event_detail: vi.fn(),
      },
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/organization/compliance/events?kind=access&activity=important&limit=10",
      headers: { authorization: "Bearer synthetic" },
    });

    expect(response.statusCode).toBe(200);
    expect(list_events).toHaveBeenCalledWith({
      auth: {
        organization_id: auth.organization.id,
        actor_role: "owner",
      },
      query: { kind: "access", activity: "important", limit: 10 },
    });
    expect(response.json().totals.access_events).toBe(3);
    await app.close();
  });

  it("returns safe 403 and 401 responses without evidence rows", async () => {
    const forbidden = build_app({
      compliance_service: {
        list_events: vi.fn(async () => {
          throw new CompliancePermissionError();
        }),
        get_audit_event_detail: vi.fn(),
      },
    });
    const forbidden_response = await forbidden.inject({
      method: "GET",
      url: "/api/v1/organization/compliance/events",
      headers: { authorization: "Bearer synthetic" },
    });
    expect(forbidden_response.statusCode).toBe(403);
    expect(forbidden_response.json()).toEqual({
      error: {
        type: "compliance_permission_denied",
        message: "Only organization owners can view compliance evidence.",
      },
    });
    await forbidden.close();

    const anonymous = build_app({
      auth_service: {
        get_current_auth_context: vi.fn(async () => {
          throw new UnauthenticatedSessionError();
        }),
      },
    });
    const anonymous_response = await anonymous.inject({
      method: "GET",
      url: "/api/v1/organization/compliance/events",
      headers: { authorization: "Bearer invalid" },
    });
    expect(anonymous_response.statusCode).toBe(401);
    expect(anonymous_response.json()).toEqual({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    });
    await anonymous.close();
  });

  it.each([
    "/api/v1/organization/compliance/events?project_id=not-a-ulid",
    "/api/v1/organization/compliance/audit-events/not-a-ulid",
  ])(
    "rejects malformed evidence identifiers before calling the service",
    async (url) => {
      const list_events = vi.fn();
      const get_audit_event_detail = vi.fn();
      const app = build_app({
        compliance_service: { list_events, get_audit_event_detail },
      });

      const response = await app.inject({ method: "GET", url });

      expect(response.statusCode).toBe(400);
      expect(list_events).not.toHaveBeenCalled();
      expect(get_audit_event_detail).not.toHaveBeenCalled();
      await app.close();
    },
  );
});
