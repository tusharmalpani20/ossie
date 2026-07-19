import { describe, expect, it, vi } from "vitest";
import {
  build_compliance_service,
  build_project_compliance_service,
  ComplianceCursorError,
  CompliancePermissionError,
} from "./compliance.service";

const auth = (role: "owner" | "member" = "owner") => ({
  organization_id: "01J00000000000000000000001",
  actor_role: role,
});

describe("Project compliance service", () => {
  it("authorizes Project compliance and forces the path Project scope", async () => {
    const repository = {
      list_events: vi.fn().mockResolvedValue({ events: [], has_more: false, totals: {
        audit_events: 0, audit_change_items: 0, access_events: 0,
        oldest_occurred_at: null, newest_occurred_at: null,
      } }),
      get_audit_event_detail: vi.fn(),
    };
    const access = { authorize: vi.fn().mockResolvedValue({ role: "project_admin" }) };
    const service = build_project_compliance_service(repository, access);
    await service.list_events({
      auth: { organization_id: auth().organization_id, actor_org_user_id: "admin-1" },
      project_id: "01J00000000000000000000009",
      query: { project_id: "01J00000000000000000000008" },
    });
    expect(access.authorize).toHaveBeenCalledWith(expect.objectContaining({ capability: "project.compliance.read" }));
    expect(repository.list_events).toHaveBeenCalledWith(expect.objectContaining({ project_id: "01J00000000000000000000009" }));
  });
});

describe("compliance service", () => {
  it("rejects a current member before querying evidence", async () => {
    const repository = { list_events: vi.fn(), get_audit_event_detail: vi.fn() };
    const service = build_compliance_service(repository);

    await expect(
      service.list_events({ auth: auth("member"), query: {} }),
    ).rejects.toBeInstanceOf(CompliancePermissionError);
    expect(repository.list_events).not.toHaveBeenCalled();
  });

  it("binds opaque cursors to the current filters", async () => {
    const repository = {
      list_events: vi.fn(async () => ({
        events: [
          {
            id: "01J00000000000000000000002",
            evidence_kind: "access" as const,
            occurred_at: "2026-07-19T12:00:00.000Z",
          },
        ],
        has_more: true,
        totals: {
          audit_events: 0,
          audit_change_items: 0,
          access_events: 1,
          oldest_occurred_at: "2026-07-19T12:00:00.000Z",
          newest_occurred_at: "2026-07-19T12:00:00.000Z",
        },
      })),
      get_audit_event_detail: vi.fn(),
    };
    const service = build_compliance_service(repository as never);
    const first = await service.list_events({
      auth: auth(),
      query: { kind: "access", limit: 1 },
    });

    expect(first.page.next_cursor).toEqual(expect.any(String));
    await expect(
      service.list_events({
        auth: auth(),
        query: { kind: "audit", cursor: first.page.next_cursor! },
      }),
    ).rejects.toBeInstanceOf(ComplianceCursorError);
  });

  it("rejects oversized cursors before querying", async () => {
    const repository = { list_events: vi.fn(), get_audit_event_detail: vi.fn() };
    const service = build_compliance_service(repository);

    await expect(
      service.list_events({
        auth: auth(),
        query: { cursor: "x".repeat(2049) },
      }),
    ).rejects.toBeInstanceOf(ComplianceCursorError);
    expect(repository.list_events).not.toHaveBeenCalled();
  });

  it.each([
    "not-base64url!",
    Buffer.from(JSON.stringify({
      version: 1,
      filter: "all:",
      id: "not-a-ulid",
      occurred_at: "2026-07-19T12:00:00.000Z",
      evidence_kind: "access",
    })).toString("base64url"),
    Buffer.from(JSON.stringify({
      version: 1,
      filter: "all:",
      id: "01J00000000000000000000002",
      occurred_at: "2026-07-19 12:00:00Z",
      evidence_kind: "access",
    })).toString("base64url"),
  ])("rejects malformed cursor transport and payload before querying", async (cursor) => {
    const repository = { list_events: vi.fn(), get_audit_event_detail: vi.fn() };
    const service = build_compliance_service(repository);

    await expect(
      service.list_events({ auth: auth(), query: { cursor } }),
    ).rejects.toBeInstanceOf(ComplianceCursorError);
    expect(repository.list_events).not.toHaveBeenCalled();
  });
});
