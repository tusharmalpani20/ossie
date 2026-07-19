import { describe, expect, it } from "vitest";
import * as audit_domain from "../index";
import type { AccessEvent } from "../types/access-evidence";

const valid_event = (): AccessEvent => ({
  id: "01J00000000000000000000000",
  organization_id: "01J00000000000000000000001",
  project_id: "01J00000000000000000000002",
  root_resource_type: "project",
  root_resource_id: "01J00000000000000000000002",
  action: "project.viewed",
  source_type: "web",
  actor_type: "org_user",
  actor_org_user_id: "01J00000000000000000000003",
  actor_label: "Synthetic owner",
  request_id: "request-1",
  http_method: "GET",
  route_template: "/api/v1/projects/:id",
  access_surface: "portal",
  authorization_type: "organization_role",
  authorization_role: "owner",
  outcome: "succeeded",
  reason_code: null,
  response_bytes: null,
  occurred_at: "2026-07-19T12:00:00.000Z",
});

describe("Access Event policy", () => {
  it("exports and accepts one server-derived organization-owned event", () => {
    const validate = Reflect.get(audit_domain, "validate_access_event");

    expect(validate).toBeTypeOf("function");
    expect(validate(valid_event())).toEqual(valid_event());
  });

  it.each([
    ["missing tenant", { organization_id: "" }],
    ["anonymous actor id", { actor_type: "anonymous", actor_org_user_id: valid_event().actor_org_user_id }],
    ["raw route", { route_template: "/api/v1/projects/secret?token=value" }],
    ["download bytes on portal", { response_bytes: 42 }],
    ["role without role authorization", { authorization_type: "public_link", authorization_role: "member" }],
    ["malformed id", { id: "not-an-id" }],
    ["extra payload", { metadata: { raw_url: "/secret" } }],
  ])("rejects %s", (_name, replacement) => {
    const validate = Reflect.get(audit_domain, "validate_access_event") as (value: unknown) => unknown;

    expect(() => validate({ ...valid_event(), ...replacement })).toThrow();
  });

  it("allows an organization-scoped anonymous public denial without a raw resource id", () => {
    const validate = Reflect.get(audit_domain, "validate_access_event") as (value: unknown) => unknown;
    const event = {
      ...valid_event(),
      project_id: null,
      root_resource_type: "publish_link",
      root_resource_id: null,
      action: "publish_link.viewed",
      actor_type: "anonymous",
      actor_org_user_id: null,
      actor_label: "anonymous",
      access_surface: "public_reader",
      authorization_type: "public_link",
      authorization_role: null,
      outcome: "denied",
      reason_code: "gone",
    };

    expect(validate(event)).toEqual(event);
  });
});
