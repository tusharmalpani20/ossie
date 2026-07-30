import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  validate_documentation_artifact_reference,
} from "./documentation-artifact-reference-policy";

describe("documentation artifact reference policy", () => {
  it("accepts an exact matching immutable Publication identity", () => {
    expect(
      validate_documentation_artifact_reference({
        block_kind: "guide_publication",
        publication_type: "guide",
        published_artifact_id: "01J00000000000000000000001",
      }),
    ).toEqual({
      block_kind: "guide_publication",
      publication_type: "guide",
      published_artifact_id: "01J00000000000000000000001",
    });
  });

  it("rejects a mismatched artifact family", () => {
    expect(() =>
      validate_documentation_artifact_reference({
        block_kind: "guide_publication",
        publication_type: "interactive_demo",
        published_artifact_id: "01J00000000000000000000001",
      }),
    ).toThrow(DocumentationDomainError);
  });
});
