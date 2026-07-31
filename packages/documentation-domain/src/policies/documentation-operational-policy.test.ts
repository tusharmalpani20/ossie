import { describe, expect, it } from "vitest";
import {
  assert_documentation_quota_increase,
  build_documentation_etag,
  calculate_documentation_limit_state,
  truncate_documentation_metadata,
} from "./documentation-operational-policy";

describe("Documentation operational policy", () => {
  it("classifies unlimited, at-limit, and over-limit usage", () => {
    expect(calculate_documentation_limit_state(4, null)).toBe("within_limit");
    expect(calculate_documentation_limit_state(4, 4)).toBe("at_limit");
    expect(calculate_documentation_limit_state(5, 4)).toBe("over_limit");
  });

  it("allows corrective zero-delta work while over limit and rejects growth", () => {
    expect(() =>
      assert_documentation_quota_increase({
        dimension: "active_pages",
        usage: 6,
        limit: 5,
        delta: 0,
      }),
    ).not.toThrow();
    expect(() =>
      assert_documentation_quota_increase({
        dimension: "active_pages",
        usage: 6,
        limit: 5,
        delta: 1,
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "documentation_organization_quota_exceeded",
      }),
    );
  });

  it("separates representation validators and preserves Unicode scalars", () => {
    expect(build_documentation_etag("a".repeat(64), "html")).not.toBe(
      build_documentation_etag("a".repeat(64), "json-page"),
    );
    expect(truncate_documentation_metadata("A😀B", 2)).toBe("A…");
    expect(truncate_documentation_metadata("A😀B", 3)).toBe("A😀B");
  });
});
