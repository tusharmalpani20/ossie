import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  normalize_documentation_path,
  validate_documentation_routes,
} from "./documentation-routing-policy";

describe("documentation routing policy", () => {
  it("normalizes safe paths and rejects reserved roots and cycles", () => {
    expect(normalize_documentation_path("/Getting-Started/install/")).toBe(
      "getting-started/install",
    );
    expect(() => normalize_documentation_path("versions/main")).toThrow(
      DocumentationDomainError,
    );
    expect(() =>
      validate_documentation_routes([
        { source_path: "a", outcome: "redirect", target_path: "b" },
        { source_path: "b", outcome: "redirect", target_path: "a" },
      ]),
    ).toThrow(DocumentationDomainError);
  });
});
