import { describe, expect, it } from "vitest";
import { create_portable_documentation_snapshot } from "./documentation-portability";

describe("Documentation portability adapter", () => {
  it("replaces database identities with deterministic package handles", () => {
    const portable = create_portable_documentation_snapshot({
      site: { id: "site", name: "Docs", description: null },
      edition: { primary_language: "en-US" },
      working_draft: { home_page_id: "page-b" },
      pages: [
        {
          id: "page-b",
          title: "Start",
          description: null,
          canonical_path: "start",
          keywords: [{ keyword: "intro" }],
          blocks: [
            {
              id: "block-db",
              kind: "paragraph",
              position: 1,
              text: "Hello",
            },
          ],
        },
      ],
      snippets: [],
      assets: [],
      navigation: {
        nodes: [
          {
            id: "nav-db",
            parent_id: null,
            kind: "page",
            label: null,
            page_id: "page-b",
            position: 1,
          },
        ],
      },
      routing: { aliases: [], rules: [] },
      openapi_operations: [],
    });

    expect(portable.site).toMatchObject({
      home_page_handle: "page-0001",
      pages: [{ handle: "page-0001", canonical_path: "start" }],
      navigation: [
        {
          handle: "navigation-0001",
          page_handle: "page-0001",
        },
      ],
    });
    expect(portable.pages[0]).toMatchObject({
      handle: "page-0001",
      blocks: [{ handle: "block-0001", kind: "paragraph", text: "Hello" }],
    });
    expect(JSON.stringify(portable)).not.toContain("page-b");
    expect(JSON.stringify(portable)).not.toContain("block-db");
  });
});
