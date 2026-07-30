import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  documentation_review_effective_status,
  evaluate_documentation_review_gate,
  normalize_documentation_review_reason,
} from "../index";

describe("documentation review policy", () => {
  it("requires current approvals and current maintainer approval", () => {
    expect(
      evaluate_documentation_review_gate({
        policy_mode: "approval_required",
        required_approvals: 2,
        require_maintainer_approval: true,
        valid_approval_count: 2,
        valid_maintainer_approval_count: 1,
        has_governing_request: true,
      }),
    ).toBe("approved");
    expect(
      evaluate_documentation_review_gate({
        policy_mode: "approval_required",
        required_approvals: 2,
        require_maintainer_approval: true,
        valid_approval_count: 2,
        valid_maintainer_approval_count: 0,
        has_governing_request: true,
      }),
    ).toBe("approval_pending");
  });

  it("derives invalidation only from stored approved requests", () => {
    expect(
      documentation_review_effective_status("approved", false),
    ).toBe("invalidated");
    expect(documentation_review_effective_status("open", false)).toBe("open");
  });

  it("normalizes safe plain-text reasons by Unicode code point", () => {
    expect(normalize_documentation_review_reason("  cafe\u0301\r\nok  ", 1)).toBe(
      "café\nok",
    );
    expect(() => normalize_documentation_review_reason("bad\u0001", 1)).toThrow(
      DocumentationDomainError,
    );
  });
});
