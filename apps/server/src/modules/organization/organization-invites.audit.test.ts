import { describe, expect, it } from "vitest";
import {
  build_invite_accepted_event,
  build_invite_created_event,
  build_invite_revoked_event,
} from "./organization-invites.audit";

const invite = {
  id: "01J00000000000000000000001",
  organization_id: "01J00000000000000000000002",
  email: "member@example.com",
  role: "member" as const,
  status: "pending" as const,
  expires_at: "2026-08-01T00:00:00.000Z",
};
const base = {
  event_id: "01J00000000000000000000000",
  actor_org_user_id: "01J00000000000000000000003",
  actor_label: "Owner",
  occurred_at: "2026-07-19T00:00:00.000Z",
};

describe("Organization Invite Audit adapter", () => {
  it("redacts invite identity/secret fields and represents revocation as deletion", () => {
    const created = build_invite_created_event({ ...base, invite });
    expect(created.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "email",
          after: { state: "redacted" },
        }),
        expect.objectContaining({
          field_name: "token_hash",
          after: { state: "redacted" },
        }),
      ]),
    );
    expect(JSON.stringify(created)).not.toContain(invite.email);
    expect(build_invite_revoked_event({ ...base, invite }).items).toEqual([
      expect.objectContaining({ operation: "delete", field_name: null }),
    ]);
  });

  it("covers optional acceptance rows in one event", () => {
    const accepted = build_invite_accepted_event({
      ...base,
      invite,
      actor_org_user_id: "01J00000000000000000000004",
      actor_label: "Member",
      user: { id: "01J00000000000000000000005", created: true },
      org_user: { id: "01J00000000000000000000004", created: true },
      session_id: "01J00000000000000000000006",
    });
    expect(accepted.items.map(({ entity_type }) => entity_type)).toEqual(
      expect.arrayContaining([
        "org_invite",
        "user",
        "org_user",
        "auth_session",
      ]),
    );
  });
});
