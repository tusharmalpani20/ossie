import { describe, expect, it, vi } from "vitest";
import {
  build_compliance_repository,
  compliance_state_from_row,
} from "./compliance.repository";

describe("compliance repository", () => {
  it("scopes both evidence kinds and totals to the authenticated organization", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            audit_events: "0",
            audit_change_items: "0",
            access_events: "0",
            oldest_occurred_at: null,
            newest_occurred_at: null,
          },
        ],
      });
    const repository = build_compliance_repository({ query } as never);

    await repository.list_events({
      organization_id: "01J00000000000000000000001",
      project_id: null,
      kind: "all",
      cursor: null,
      limit: 25,
    });

    expect(query.mock.calls[0]?.[0]).toContain(
      "audit_event.organization_id = $1",
    );
    expect(query.mock.calls[0]?.[0]).toContain(
      "access_event.organization_id = $1",
    );
    expect(query.mock.calls[1]?.[0]).toContain(
      "audit_event.organization_id = $1",
    );
    expect(query.mock.calls[1]?.[0]).toContain(
      "access_event.organization_id = $1",
    );
    expect(query.mock.calls[0]?.[1]?.[0]).toBe(
      "01J00000000000000000000001",
    );
  });

  it("reconstructs exactly one typed scalar column", () => {
    expect(
      compliance_state_from_row(
        {
          before_state: "value",
          before_text_value: "Safe value",
          before_identifier_value: null,
          before_integer_value: null,
          before_decimal_value: null,
          before_boolean_value: null,
          before_date_value: null,
          before_timestamp_value: null,
          before_enum_value: null,
        },
        "before",
        "text",
      ),
    ).toEqual({ state: "value", value_type: "text", value: "Safe value" });

    expect(() =>
      compliance_state_from_row(
        {
          before_state: "value",
          before_text_value: "one",
          before_identifier_value: "two",
        },
        "before",
        "text",
      ),
    ).toThrow(/evidence_integrity_failed/u);

    expect(
      compliance_state_from_row(
        {
          before_state: "value",
          before_integer_value: "-42",
        },
        "before",
        "integer",
      ),
    ).toEqual({ state: "value", value_type: "integer", value: -42 });
  });
});
