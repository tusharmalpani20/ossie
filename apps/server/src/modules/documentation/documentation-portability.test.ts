import { describe, expect, it } from "vitest";
import {
  create_portable_documentation_snapshot,
  prepare_portable_documentation_import,
} from "./documentation-portability";

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

  it("exports publication references as explicit bindings and resolves only the selected identity", () => {
    const portable = create_portable_documentation_snapshot({
      site: { id: "site", name: "Docs", description: null },
      edition: { primary_language: "en-US" },
      working_draft: { home_page_id: "page" },
      pages: [
        {
          id: "page",
          title: "Start",
          description: null,
          canonical_path: "start",
          keywords: [],
          blocks: [
            {
              id: "block",
              kind: "guide_publication",
              position: 1,
              published_artifact_id: "publication-db-id",
              publication: {
                title: "Install guide",
                description: null,
                project_version_label: "Summer",
                revision_number: 2,
                publication_sequence: 3,
              },
            },
          ],
        },
      ],
      snippets: [],
      assets: [],
      navigation: { nodes: [] },
      routing: { aliases: [], rules: [] },
      openapi_operations: [],
    });
    const binding = portable.site.external_bindings[0]!;
    expect(binding).toMatchObject({
      kind: "guide_publication",
      display: { title: "Install guide" },
    });
    expect(portable.pages[0]?.blocks[0]).toMatchObject({
      kind: "guide_publication",
      external_binding_handle: binding.handle,
    });
    expect(JSON.stringify(portable)).not.toContain("publication-db-id");

    const prepared = prepare_portable_documentation_import({
      site: portable.site,
      pages: portable.pages,
      snippets: portable.snippets,
      external_bindings: [
        {
          handle: binding.handle,
          published_artifact_id: "selected-publication-id",
        },
      ],
    });
    expect(prepared.pages[0]?.blocks[0]?.published_artifact_id).toBe(
      "selected-publication-id",
    );
  });
});

describe("prepare_portable_documentation_import", () => {
  it("allocates fresh identities and resolves package-local relationships", () => {
    const prepared = prepare_portable_documentation_import({
      site: {
        schema_version: 1,
        site: {
          name: "Imported",
          description: null,
          primary_language: "en",
        },
        home_page_handle: "page-home",
        pages: [
          {
            handle: "page-home",
            title: "Home",
            description: null,
            canonical_path: "/",
            keywords: [],
            typed_path: "pages/page-home.json",
            markdown_path: "pages/page-home.md",
          },
        ],
        snippets: [
          { handle: "snippet-note", path: "snippets/snippet-note.json" },
        ],
        assets: [],
        navigation: [
          {
            handle: "navigation-home",
            parent_handle: null,
            kind: "page",
            label: null,
            page_handle: "page-home",
            position: 1,
          },
        ],
        aliases: [],
        routes: [],
        openapi: null,
        external_bindings: [],
      },
      pages: [
        {
          schema_version: 1,
          handle: "page-home",
          title: "Home",
          description: null,
          canonical_path: "/",
          keywords: [],
          blocks: [
            {
              handle: "block-note",
              kind: "snippet_reference",
              position: 1,
              snippet_handle: "snippet-note",
            },
          ],
        },
      ],
      snippets: [
        {
          schema_version: 1,
          handle: "snippet-note",
          name: "Note",
          status: "active",
          blocks: [
            {
              handle: "snippet-paragraph",
              kind: "paragraph",
              position: 1,
              text: "Portable",
            },
          ],
        },
      ],
      external_bindings: [],
    });

    expect(prepared.home_page_id).toBe(prepared.pages[0]?.id);
    expect(prepared.pages[0]?.blocks[0]?.snippet_id).toBe(
      prepared.snippets[0]?.id,
    );
    expect(prepared.navigation[0]?.page_id).toBe(prepared.pages[0]?.id);
    expect(prepared.pages[0]?.id).not.toBe("page-home");
  });
});
