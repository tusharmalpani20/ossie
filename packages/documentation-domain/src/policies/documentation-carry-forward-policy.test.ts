import { describe, expect, it } from "vitest";
import {
  assert_documentation_carry_forward_eligibility,
  classify_documentation_carry_forward_reference,
} from "./documentation-carry-forward-policy";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

describe("Documentation Carry-Forward policy", () => {
  it("accepts bounded, distinct whole-Site selections across versions", () => {
    expect(() =>
      assert_documentation_carry_forward_eligibility({
        source_project_version_id: "version-a",
        target_project_version_id: "version-b",
        selections: [
          {
            site_id: "site-a",
            page_count: 2,
            snippet_count: 1,
            content_node_count: 10,
            protected_reference_count: 2,
            saved_text_bytes: 500,
          },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects same-version, duplicate, empty, and aggregate-limit requests", () => {
    expect(() =>
      assert_documentation_carry_forward_eligibility({
        source_project_version_id: "version-a",
        target_project_version_id: "version-a",
        selections: [],
      }),
    ).toThrow(DocumentationDomainError);

    expect(() =>
      assert_documentation_carry_forward_eligibility({
        source_project_version_id: "version-a",
        target_project_version_id: "version-b",
        selections: [
          {
            site_id: "site-a",
            page_count: 5_001,
            snippet_count: 0,
            content_node_count: 0,
            protected_reference_count: 0,
            saved_text_bytes: 0,
          },
          {
            site_id: "site-a",
            page_count: 0,
            snippet_count: 0,
            content_node_count: 0,
            protected_reference_count: 0,
            saved_text_bytes: 0,
          },
        ],
      }),
    ).toThrow(DocumentationDomainError);
  });

  it("makes File and publication reuse explicit while mutable state is copied", () => {
    expect(classify_documentation_carry_forward_reference("page")).toBe(
      "copy_fresh_identity",
    );
    expect(
      classify_documentation_carry_forward_reference("documentation_file"),
    ).toBe("reuse_exact_identity");
    expect(
      classify_documentation_carry_forward_reference("capture_asset"),
    ).toBe("reuse_exact_identity");
    expect(
      classify_documentation_carry_forward_reference("site_revision"),
    ).toBe("exclude");
    expect(
      classify_documentation_carry_forward_reference("comment"),
    ).toBe("exclude");
  });
});
