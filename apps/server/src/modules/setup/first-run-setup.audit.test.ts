import { describe, expect, it } from "vitest";
import { build_first_run_setup_event } from "./first-run-setup.audit";

describe("First-run Setup Audit adapter", () => {
  it("covers all four rows while redacting credentials and email", () => {
    const event = build_first_run_setup_event({
      event_id: "01J00000000000000000000000",
      user: {
        id: "01J00000000000000000000001",
        email: "owner@example.com",
        display_name: "Owner",
      },
      organization: { id: "01J00000000000000000000002", name: "Acme" },
      org_user: {
        id: "01J00000000000000000000003",
        user_id: "01J00000000000000000000001",
        organization_id: "01J00000000000000000000002",
        role: "owner",
      },
      session: {
        id: "01J00000000000000000000004",
        user_id: "01J00000000000000000000001",
        organization_id: "01J00000000000000000000002",
        org_user_id: "01J00000000000000000000003",
      },
      occurred_at: "2026-07-19T00:00:00.000Z",
    });
    expect(
      event.items.filter(({ field_name }) => field_name === null),
    ).toHaveLength(4);
    expect(event.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity_type: "user",
          field_name: "email",
          after: { state: "redacted" },
        }),
        expect.objectContaining({
          entity_type: "user",
          field_name: "password_hash",
          after: { state: "redacted" },
        }),
        expect.objectContaining({
          entity_type: "auth_session",
          field_name: "token_hash",
          after: { state: "redacted" },
        }),
      ]),
    );
    expect(JSON.stringify(event)).not.toContain("owner@example.com");
  });
});
