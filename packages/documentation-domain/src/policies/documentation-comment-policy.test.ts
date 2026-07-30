import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  assert_documentation_comment_transition,
  normalize_documentation_comment,
} from "./documentation-comment-policy";

describe("documentation comment policy", () => {
  it("keeps comments bounded plain text and permits resolve/reopen only", () => {
    expect(normalize_documentation_comment("  Please check this.  ")).toBe(
      "Please check this.",
    );
    expect(assert_documentation_comment_transition("open", "resolve")).toBe(
      "resolved",
    );
    expect(assert_documentation_comment_transition("resolved", "reopen")).toBe(
      "open",
    );
    expect(() =>
      assert_documentation_comment_transition("open", "reopen"),
    ).toThrow(DocumentationDomainError);
  });
});
