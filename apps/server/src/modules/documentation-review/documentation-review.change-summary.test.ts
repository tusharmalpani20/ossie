import { describe, expect, it } from "vitest";
import { summarize_documentation_revision_snapshots } from "./documentation-review.change-summary";

describe("Documentation review structural change summary", () => {
  it("compares stable frozen identities without exposing body diffs", () => {
    const baseline = {
      revision: { id: "revision-1", revision_number: 1 },
      site: { name: "Docs", description: null },
      edition: { title: "Docs", description: null, primary_language: "en" },
      working_draft: { home_page_id: "page-a" },
      pages: [
        {
          id: "page-a",
          title: "Home",
          blocks: [{ id: "block-a", kind: "paragraph", text: "Before" }],
        },
        { id: "page-removed", title: "Removed", blocks: [] },
      ],
      snippets: [{ id: "snippet-removed", name: "Old", blocks: [] }],
      assets: [{ id: "asset-a", digest: "old" }],
      navigation: { nodes: [{ id: "node-a", page_id: "page-a" }] },
      routing: { aliases: [], rules: [] },
      openapi_source: { id: "openapi", digest: "one" },
      openapi_operations: [],
    };
    const target = {
      ...baseline,
      revision: { id: "revision-2", revision_number: 2 },
      pages: [
        {
          id: "page-a",
          title: "Home",
          blocks: [
            {
              id: "block-a",
              kind: "artifact_reference",
              artifact_reference: { published_artifact_id: "publication" },
            },
          ],
        },
        { id: "page-added", title: "Added", blocks: [] },
      ],
      snippets: [],
      assets: [{ id: "asset-a", digest: "new" }],
      navigation: {
        nodes: [
          { id: "node-a", page_id: "page-a" },
          { id: "node-b", page_id: "page-added" },
        ],
      },
      openapi_source: { id: "openapi", digest: "two" },
    };

    expect(
      summarize_documentation_revision_snapshots(target, baseline),
    ).toEqual({
      baseline_revision_id: "revision-1",
      baseline_revision_number: 1,
      metadata_changed: false,
      home_page_changed: false,
      pages: { added: 1, removed: 1, changed: 1 },
      navigation_changed: true,
      routing_changed: false,
      snippets: { added: 0, removed: 1, changed: 0 },
      assets: { added: 0, removed: 0, changed: 1 },
      openapi_changed: true,
      artifact_references_changed: true,
    });
  });

  it("reports every frozen entity as added for the first Revision", () => {
    expect(
      summarize_documentation_revision_snapshots(
        {
          revision: { id: "revision-1", revision_number: 1 },
          site: { name: "Docs", description: null },
          edition: {
            title: "Docs",
            description: null,
            primary_language: "en",
          },
          working_draft: { home_page_id: "page-a" },
          pages: [{ id: "page-a", blocks: [] }],
          snippets: [{ id: "snippet-a", blocks: [] }],
          assets: [{ id: "asset-a", digest: "one" }],
          navigation: { nodes: [] },
          routing: { aliases: [], rules: [] },
          openapi_source: null,
          openapi_operations: [],
        },
        null,
      ),
    ).toMatchObject({
      baseline_revision_id: null,
      baseline_revision_number: null,
      pages: { added: 1, removed: 0, changed: 0 },
      snippets: { added: 1, removed: 0, changed: 0 },
      assets: { added: 1, removed: 0, changed: 0 },
    });
  });
});
