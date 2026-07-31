import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  documentation_review_effective_status,
  evaluate_documentation_review_gate,
  normalize_documentation_review_reason,
  preview_documentation_review_gate,
  resolve_documentation_publication_review_gate,
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
    expect(documentation_review_effective_status("approved", false)).toBe(
      "invalidated",
    );
    expect(documentation_review_effective_status("open", false)).toBe("open");
  });

  it("keeps open requests pending even when current counts satisfy a loosened policy", () => {
    expect(
      preview_documentation_review_gate({
        policy_mode: "approval_required",
        required_approvals: 1,
        require_maintainer_approval: false,
        governing_request_status: "open",
        valid_approval_count: 1,
        valid_maintainer_approval_count: 0,
      }),
    ).toBe("approval_pending");
    expect(
      preview_documentation_review_gate({
        policy_mode: "approval_required",
        required_approvals: 2,
        require_maintainer_approval: false,
        governing_request_status: "approved",
        valid_approval_count: 1,
        valid_maintainer_approval_count: 0,
      }),
    ).toBe("invalidated");
  });

  it("normalizes safe plain-text reasons by Unicode code point", () => {
    expect(
      normalize_documentation_review_reason("  cafe\u0301\r\nok  ", 1),
    ).toBe("café\nok");
    expect(() => normalize_documentation_review_reason("bad\u0001", 1)).toThrow(
      DocumentationDomainError,
    );
  });

  it("enforces the current policy instead of a request's frozen threshold", () => {
    expect(() =>
      resolve_documentation_publication_review_gate({
        policy: {
          mode: "approval_required",
          required_approvals: 2,
          require_maintainer_approval: false,
        },
        governing_request: {
          id: "request",
          status: "approved",
          valid_approval_count: 1,
          valid_maintainer_approval_count: 0,
        },
        has_override: false,
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "documentation_review_approval_invalidated",
      }),
    );
  });

  it("rejects an override when the current gate is already satisfied or optional", () => {
    for (const input of [
      {
        policy: {
          mode: "optional" as const,
          required_approvals: 1,
          require_maintainer_approval: false,
        },
        governing_request: null,
      },
      {
        policy: {
          mode: "approval_required" as const,
          required_approvals: 1,
          require_maintainer_approval: false,
        },
        governing_request: {
          id: "request",
          status: "approved" as const,
          valid_approval_count: 1,
          valid_maintainer_approval_count: 0,
        },
      },
    ])
      expect(() =>
        resolve_documentation_publication_review_gate({
          ...input,
          has_override: true,
        }),
      ).toThrowError(
        expect.objectContaining({
          code: "documentation_review_override_invalid",
        }),
      );
  });
});
