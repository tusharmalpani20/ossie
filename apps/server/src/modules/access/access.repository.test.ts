import { describe, expect, it, vi } from "vitest";
import { AccessDomainError, type AccessEvent } from "@repo/audit-domain";
import {
  build_access_repository,
  write_access_event,
} from "./access.repository";

const event = (): AccessEvent => ({
  id: "01J00000000000000000000000",
  organization_id: "01J00000000000000000000001",
  project_id: null,
  root_resource_type: "organization",
  root_resource_id: "01J00000000000000000000001",
  action: "project.list_viewed",
  source_type: "web",
  actor_type: "org_user",
  actor_org_user_id: "01J00000000000000000000002",
  actor_label: "Synthetic owner",
  request_id: "request-1",
  http_method: "GET",
  route_template: "/api/v1/projects",
  access_surface: "portal",
  authorization_type: "organization_role",
  authorization_role: "owner",
  outcome: "succeeded",
  reason_code: null,
  response_bytes: null,
  occurred_at: "2026-07-19T12:00:00.000Z",
});

describe("Access repository", () => {
  it("writes every typed Access Event column through the supplied transaction client", async () => {
    const client = {
      query: vi.fn<
        (sql: string, values?: unknown[]) => Promise<{ rows: never[] }>
      >(async () => ({ rows: [] })),
    };

    await write_access_event(client, event());

    expect(client.query).toHaveBeenCalledOnce();
    expect(client.query.mock.calls[0]?.[0]).toContain(
      "INSERT INTO audit_schema.access_event",
    );
    expect(client.query.mock.calls[0]?.[1]).toEqual([
      event().id,
      event().organization_id,
      event().project_id,
      event().root_resource_type,
      event().root_resource_id,
      event().action,
      event().source_type,
      event().actor_type,
      event().actor_org_user_id,
      event().actor_label,
      event().request_id,
      event().http_method,
      event().route_template,
      event().access_surface,
      event().authorization_type,
      event().authorization_role,
      event().outcome,
      event().reason_code,
      event().response_bytes,
      event().occurred_at,
    ]);
  });

  it("maps persistence details to the stable Access failure", async () => {
    const repository = build_access_repository({
      query: vi.fn(async () => {
        throw new Error("private database detail");
      }),
    });

    await expect(repository.append(event())).rejects.toEqual(
      expect.objectContaining<Partial<AccessDomainError>>({
        name: "AccessDomainError",
        code: "access_evidence_unavailable",
      }),
    );
  });

  it("rejects actions outside the exhaustive route registry", async () => {
    await expect(write_access_event({ query: vi.fn() }, {
      ...event(),
      action: "unregistered.secret_viewed",
    })).rejects.toBeInstanceOf(AccessDomainError);
  });
});
