import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  build_site_revision_digest,
  validate_documentation_revision_aggregate,
  validate_site_revision_input,
} from "./documentation-revision-policy";

describe("documentation revision policy", () => {
  it("requires an included Home Page and excludes private comments from digest", () => {
    const input = {
      home_page_id: "page-1",
      pages: [{ id: "page-1", title: "Home", path: "home", blocks: [] }],
      navigation_page_ids: ["page-1"],
      comments: [{ id: "private", body: "never snapshot me" }],
    };
    expect(validate_site_revision_input(input)).toEqual({
      home_page_id: "page-1",
      pages: input.pages,
      navigation_page_ids: ["page-1"],
    });
    expect(build_site_revision_digest(input)).not.toContain("private");

    expect(() =>
      validate_site_revision_input({ ...input, navigation_page_ids: [] }),
    ).toThrow(DocumentationDomainError);
  });

  it("enforces the immutable Revision aggregate Asset ceiling", () => {
    expect(() =>
      validate_documentation_revision_aggregate({
        blocks: Array.from({ length: 5_001 }, (_, index) => ({
          kind: "image",
          source: { kind: "capture_asset", id: `asset-${index}` },
        })),
      }),
    ).toThrowError(
      expect.objectContaining({ code: "documentation_content_limit_exceeded" }),
    );
  });
});
