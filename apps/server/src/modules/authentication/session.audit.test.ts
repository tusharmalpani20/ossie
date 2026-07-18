import { describe, expect, it } from "vitest";
import {
  build_session_created_event,
  build_session_revoked_event,
  build_session_touched_event,
} from "./session.audit";

const base = {
  event_id: "01J00000000000000000000000",
  organization_id: "01J00000000000000000000001",
  org_user_id: "01J00000000000000000000002",
  actor_label: "Owner User",
  session_id: "01J00000000000000000000003",
  occurred_at: "2026-07-19T00:00:00.000Z",
};

describe("Authentication Session Audit adapter", () => {
  it("creates redacted session evidence without token values", () => {
    const event = build_session_created_event({
      ...base,
      user_id: "01J00000000000000000000004",
      expires_at: "2026-08-19T00:00:00.000Z",
      source_type: "web",
    });
    expect(event.action).toBe("authentication.session.created");
    expect(event.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field_name: null, operation: "create" }),
        expect.objectContaining({
          field_name: "token_hash",
          after: { state: "redacted" },
        }),
      ]),
    );
    expect(JSON.stringify(event)).not.toContain("raw-token");
  });

  it("records activity time and revocation without credentials", () => {
    const touched = build_session_touched_event({
      ...base,
      before: "2026-07-18T00:00:00.000Z",
      after: "2026-07-19T00:00:00.000Z",
      source_type: "extension",
    });
    expect(touched.items).toEqual([
      expect.objectContaining({
        field_name: "last_active_at",
        operation: "update",
      }),
    ]);

    const revoked = build_session_revoked_event({
      ...base,
      source_type: "web",
    });
    expect(revoked.items).toEqual([
      expect.objectContaining({ field_name: null, operation: "delete" }),
    ]);
  });
});
