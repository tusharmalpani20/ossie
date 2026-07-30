import { describe, expect, it } from "vitest";
import {
  build_documentation_browser_fixture,
  documentation_browser_fixture_cli_summary,
} from "./documentation-browser-fixture";

describe("Documentation browser fixture", () => {
  it("describes the bounded users, routes, and exact-publication cases without seeding", () => {
    const fixture = build_documentation_browser_fixture();
    expect(fixture.users.map((user) => user.project_role)).toEqual([
      "project_admin",
      "viewer",
    ]);
    expect(fixture.routes.list).toContain(
      "/versions/summer-release/documentation",
    );
    expect(fixture.routes.public_reader).toBe(
      "/docs/plan132-public/install-guide",
    );
    expect(fixture.cases).toEqual(
      expect.arrayContaining([
        "page_conflict",
        "private_comment",
        "openapi_reference",
        "publication_immutability",
        "rollback",
        "snippet_conflict",
        "asset_archive_protection",
        "expanded_content",
        "review_request",
        "review_inbox",
        "review_publication_evidence",
      ]),
    );
    expect(fixture.routes.review_inbox).toContain("/documentation/reviews");
    expect(
      documentation_browser_fixture_cli_summary(fixture),
    ).not.toHaveProperty("session_token");
  });
});
