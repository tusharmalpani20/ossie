import { describe, expect, it } from "vitest";
import {
  assert_documentation_lifecycle_transition,
  assert_documentation_page_retirement,
  derive_documentation_effective_status,
} from "./documentation-lifecycle-policy";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

describe("Documentation lifecycle policy", () => {
  it("allows only active-to-archived and archived-to-active transitions", () => {
    expect(() =>
      assert_documentation_lifecycle_transition("active", "archive"),
    ).not.toThrow();
    expect(() =>
      assert_documentation_lifecycle_transition("archived", "restore"),
    ).not.toThrow();
    expect(() =>
      assert_documentation_lifecycle_transition("archived", "archive"),
    ).toThrow(DocumentationDomainError);
  });

  it("distinguishes stored archive from inherited read-only state", () => {
    expect(
      derive_documentation_effective_status({
        stored_status: "archived",
        project_active: true,
        project_version_active: true,
        edition_active: true,
      }),
    ).toEqual({
      effective_status: "archived",
      read_only_reason: "This resource is archived.",
    });
    expect(
      derive_documentation_effective_status({
        stored_status: "active",
        project_active: true,
        project_version_active: false,
        edition_active: true,
      }),
    ).toEqual({
      effective_status: "read_only",
      read_only_reason: "This Project Version is archived.",
    });
  });

  it("requires explicit public retirement and a replacement for an archived home Page", () => {
    expect(() =>
      assert_documentation_page_retirement({
        page_id: "page-a",
        was_published: true,
        is_home_page: true,
        retirement: { mode: "gone" },
        replacement_home_page_id: null,
        active_page_ids: new Set(["page-a", "page-b"]),
      }),
    ).toThrow(DocumentationDomainError);

    expect(() =>
      assert_documentation_page_retirement({
        page_id: "page-a",
        was_published: true,
        is_home_page: true,
        retirement: { mode: "redirect", target_page_id: "page-b" },
        replacement_home_page_id: "page-b",
        active_page_ids: new Set(["page-a", "page-b"]),
      }),
    ).not.toThrow();
  });
});
