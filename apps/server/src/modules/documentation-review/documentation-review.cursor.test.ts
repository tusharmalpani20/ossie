import { describe, expect, it } from "vitest";
import {
  decode_documentation_review_cursor,
  encode_documentation_review_cursor,
} from "./documentation-review.cursor";

const context = {
  family: "requests" as const,
  scope: {
    organization_id: "org",
    project_id: "project",
    project_version_id: "version",
    site_id: "site",
    actor_org_user_id: "actor",
  },
  filters: { status: "open", participation: "assigned_to_me" },
};

describe("Documentation review cursor", () => {
  it("round trips a cursor only inside its exact scope and filters", () => {
    const cursor = encode_documentation_review_cursor({
      ...context,
      position: {
        sort_value: "2026-07-31T00:00:00.000Z",
        id: "01J00000000000000000000001",
      },
    });

    expect(decode_documentation_review_cursor(cursor, context)).toEqual({
      sort_value: "2026-07-31T00:00:00.000Z",
      id: "01J00000000000000000000001",
    });
  });

  it("rejects malformed and cross-filter cursor reuse", () => {
    const valid = encode_documentation_review_cursor({
      ...context,
      position: {
        sort_value: "2026-07-31T00:00:00.000Z",
        id: "01J00000000000000000000001",
      },
    });
    for (const [cursor, selected] of [
      ["not-a-cursor", context],
      [`${valid.slice(0, -1)}${valid.endsWith("A") ? "B" : "A"}`, context],
      [
        valid,
        {
          ...context,
          filters: { status: "approved", participation: "assigned_to_me" },
        },
      ],
    ] as const)
      expect(() =>
        decode_documentation_review_cursor(cursor, selected),
      ).toThrowError(
        expect.objectContaining({
          code: "invalid_documentation_review_request",
        }),
      );
  });
});
