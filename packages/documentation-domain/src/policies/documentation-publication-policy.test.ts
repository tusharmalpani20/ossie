import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  assert_documentation_rollback_target,
  publication_cache_key,
} from "./documentation-publication-policy";

describe("documentation publication policy", () => {
  it("keys caches by exact selection and limits rollback to the same Edition", () => {
    expect(
      publication_cache_key({
        publish_link_id: "link",
        link_version: 2,
        entry_id: "entry",
        entry_version: 3,
        site_publication_id: "publication",
        preparation_version: 1,
      }),
    ).toBe("link:2:entry:3:publication:1");

    expect(() =>
      assert_documentation_rollback_target(
        { edition_id: "edition-a", publication_sequence: 2 },
        { edition_id: "edition-b", publication_sequence: 1 },
      ),
    ).toThrow(DocumentationDomainError);
  });
});
