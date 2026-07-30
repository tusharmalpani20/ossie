import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  validate_documentation_navigation,
} from "./documentation-navigation-policy";

describe("documentation navigation policy", () => {
  it("accepts one occurrence per Page and rejects cycles", () => {
    expect(() =>
      validate_documentation_navigation([
        { id: "group", kind: "group", parent_id: null, page_id: null },
        {
          id: "page-node",
          kind: "page",
          parent_id: "group",
          page_id: "page-1",
        },
      ]),
    ).not.toThrow();

    expect(() =>
      validate_documentation_navigation([
        { id: "a", kind: "group", parent_id: "b", page_id: null },
        { id: "b", kind: "group", parent_id: "a", page_id: null },
      ]),
    ).toThrow(DocumentationDomainError);
  });

  it("rejects a parent outside the same navigation tree", () => {
    expect(() =>
      validate_documentation_navigation([
        {
          id: "page-node",
          kind: "page",
          parent_id: "missing",
          page_id: "page-1",
        },
      ]),
    ).toThrow(DocumentationDomainError);
  });

  it("rejects navigation deeper than sixteen levels", () => {
    const nodes = Array.from({ length: 17 }, (_, index) => ({
      id: `group-${index}`,
      kind: "group" as const,
      parent_id: index === 0 ? null : `group-${index - 1}`,
      page_id: null,
    }));

    expect(() => validate_documentation_navigation(nodes)).toThrow(
      DocumentationDomainError,
    );
  });
});
