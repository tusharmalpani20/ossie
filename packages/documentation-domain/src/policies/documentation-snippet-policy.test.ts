import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  normalize_documentation_snippet_name,
  validate_documentation_snippet_blocks,
} from "./documentation-snippet-policy";

describe("documentation snippet policy", () => {
  it("normalizes a safe Edition-owned name", () => {
    expect(
      normalize_documentation_snippet_name("  Authentication warning  "),
    ).toBe("Authentication warning");
  });

  it("rejects empty and overlong names", () => {
    expect(() => normalize_documentation_snippet_name("   ")).toThrow(
      DocumentationDomainError,
    );
    expect(() => normalize_documentation_snippet_name("x".repeat(201))).toThrow(
      DocumentationDomainError,
    );
  });

  it("forbids nested snippet references", () => {
    expect(() =>
      validate_documentation_snippet_blocks([
        {
          id: "01J00000000000000000000001",
          kind: "snippet_reference",
          snippet_id: "01J00000000000000000000002",
        },
      ]),
    ).toThrow(DocumentationDomainError);
  });
});
