import { describe, expect, it } from "vitest";
import { build_scalar_diff } from "./audit-scalar-diff";

describe("audit scalar diff", () => {
  it("preserves absent, null, value, and redacted states", () => {
    expect(build_scalar_diff({ value_type: "text", before: undefined, after: "name" })).toEqual({
      before: { state: "absent" },
      after: { state: "value", value: "name" },
    });
    expect(build_scalar_diff({ value_type: "text", before: null, after: null })).toBeNull();
    expect(build_scalar_diff({ value_type: "text", before: undefined, after: null })).toEqual({
      before: { state: "absent" },
      after: { state: "null" },
    });
    expect(build_scalar_diff({ value_type: "text", before: undefined, after: "ignored", redact: true })).toEqual({
      before: { state: "absent" },
      after: { state: "redacted" },
    });
  });

  it("normalizes decimals and timestamps without floating-point coercion", () => {
    expect(build_scalar_diff({ value_type: "decimal", before: "1.20", after: "1.2" })).toBeNull();
    expect(build_scalar_diff({
      value_type: "timestamp",
      before: new Date("2026-07-19T00:00:00Z"),
      after: "2026-07-19T00:00:00.000Z",
    })).toBeNull();
  });
});
