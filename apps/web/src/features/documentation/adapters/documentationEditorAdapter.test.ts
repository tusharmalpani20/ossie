import { describe, expect, it } from "vitest";
import type { DocumentationBlock } from "@repo/types";
import {
  documentationBlocksToTiptapGraph,
  documentationBlocksToTiptapProse,
  tiptapGraphToDocumentationBlocks,
  tiptapProseToDocumentationBlocks,
} from "./documentationEditorAdapter";

const blocks: DocumentationBlock[] = [
  {
    id: "paragraph-1",
    kind: "paragraph",
    position: 1,
    expected_version: 4,
    text: "Hello **world**.",
  },
  {
    id: "heading-1",
    kind: "heading",
    position: 2,
    expected_version: null,
    level: 3,
    text: "Install",
  },
  {
    id: "ordered-1",
    kind: "ordered_list",
    position: 3,
    expected_version: 2,
    items: [
      {
        id: "ordered-item-1",
        position: 1,
        expected_version: 7,
        text: "First",
      },
      {
        id: "ordered-item-2",
        position: 2,
        expected_version: null,
        text: "Second",
      },
    ],
  },
  {
    id: "unordered-1",
    kind: "unordered_list",
    position: 4,
    expected_version: null,
    items: [
      {
        id: "unordered-item-1",
        position: 1,
        expected_version: null,
        text: "A",
      },
      {
        id: "unordered-item-2",
        position: 2,
        expected_version: null,
        text: "B",
      },
    ],
  },
  {
    id: "code-1",
    kind: "code",
    position: 5,
    expected_version: null,
    code: "pnpm install",
    language: "shell",
  },
  {
    id: "link-1",
    kind: "link",
    position: 6,
    expected_version: null,
    label: "Reference",
    page_id: "page-2",
    target_block_id: "heading-1",
  },
  {
    id: "image-1",
    kind: "image",
    position: 7,
    expected_version: null,
    source: { kind: "documentation_asset", id: "asset-1" },
    alt_text: "A synthetic image",
    caption: "Caption",
  },
  {
    id: "divider-1",
    kind: "divider",
    position: 8,
    expected_version: null,
  },
  {
    id: "api-1",
    kind: "api_reference",
    position: 9,
    expected_version: null,
    openapi_source_id: "openapi-1",
    operation_key: "GET /widgets",
  },
  {
    id: "quote-1",
    kind: "quote",
    position: 10,
    expected_version: null,
    text: "A quote",
    attribution: "A person",
  },
  {
    id: "table-1",
    kind: "table",
    position: 11,
    expected_version: null,
    caption: "Table",
    rows: [
      {
        id: "row-1",
        position: 1,
        expected_version: 3,
        cells: [
          {
            id: "cell-1",
            column_position: 1,
            expected_version: 4,
            is_header: true,
            text: "Name",
          },
          {
            id: "cell-2",
            column_position: 2,
            expected_version: null,
            is_header: true,
            text: "Value",
          },
        ],
      },
      {
        id: "row-2",
        position: 2,
        expected_version: null,
        cells: [
          {
            id: "cell-3",
            column_position: 1,
            expected_version: null,
            is_header: false,
            text: "one",
          },
          {
            id: "cell-4",
            column_position: 2,
            expected_version: null,
            is_header: false,
            text: "two",
          },
        ],
      },
    ],
  },
  {
    id: "example-1",
    kind: "code_example",
    position: 12,
    expected_version: null,
    code: "curl https://example.test",
    language: "curl",
    title: "Request",
  },
  {
    id: "callout-1",
    kind: "callout",
    position: 13,
    expected_version: 1,
    tone: "warning",
    title: "Note",
    text: "Use **safe** input.",
  },
  {
    id: "tabs-1",
    kind: "tabs",
    position: 14,
    expected_version: null,
    items: [
      {
        id: "tab-1",
        position: 1,
        expected_version: null,
        label: "One",
        body: "First tab",
      },
      {
        id: "tab-2",
        position: 2,
        expected_version: 8,
        label: "Two",
        body: "Second tab",
      },
    ],
  },
  {
    id: "snippet-1",
    kind: "snippet_reference",
    position: 15,
    expected_version: null,
    snippet_id: "snippet-a",
  },
  {
    id: "guide-1",
    kind: "guide_publication",
    position: 16,
    expected_version: null,
    published_artifact_id: "artifact-guide",
  },
  {
    id: "demo-1",
    kind: "interactive_demo_publication",
    position: 17,
    expected_version: null,
    published_artifact_id: "artifact-demo",
  },
];

describe("Tiptap editor adapter proof converters", () => {
  it("round-trips prose fields while preserving block and nested identities", () => {
    const document = documentationBlocksToTiptapProse(blocks);
    const rewritten = {
      ...document,
      content: document.content.map((node) =>
        node.attrs?.blockId === "paragraph-1"
          ? {
              ...node,
              content: [{ type: "text" as const, text: "Updated **copy**" }],
            }
          : node,
      ),
    };

    const result = tiptapProseToDocumentationBlocks(rewritten, blocks);

    expect(result.find((block) => block.id === "paragraph-1")).toMatchObject({
      id: "paragraph-1",
      position: 1,
      expected_version: 4,
      text: "Updated **copy**",
    });
    expect(result.find((block) => block.id === "ordered-1")).toEqual(
      blocks.find((block) => block.id === "ordered-1"),
    );
    expect(result.find((block) => block.id === "table-1")).toEqual(
      blocks.find((block) => block.id === "table-1"),
    );
  });

  it("round-trips the complete accepted Page graph without an opaque blob", () => {
    const document = documentationBlocksToTiptapGraph(blocks);

    expect(document.content.map((node) => node.type)).toEqual([
      "ossieParagraph",
      "ossieHeading",
      "ossieOrderedList",
      "ossieUnorderedList",
      "ossieCode",
      "ossieLink",
      "ossieImage",
      "ossieDivider",
      "ossieApiReference",
      "ossieQuote",
      "ossieTable",
      "ossieCodeExample",
      "ossieCallout",
      "ossieTabs",
      "ossieSnippetReference",
      "ossieGuidePublication",
      "ossieInteractiveDemoPublication",
    ]);
    expect(document.content[2]?.content?.[0]?.attrs).toMatchObject({
      id: "ordered-item-1",
      expectedVersion: 7,
    });
    expect(
      document.content[10]?.content?.[1]?.content?.[0]?.attrs,
    ).toMatchObject({ id: "cell-3", expectedVersion: null });
    expect(tiptapGraphToDocumentationBlocks(document)).toEqual(blocks);
  });

  it("rejects unsupported marks and nodes without changing the source graph", () => {
    const source = structuredClone(blocks);
    expect(() =>
      tiptapProseToDocumentationBlocks(
        {
          type: "doc",
          content: [
            {
              type: "paragraph",
              attrs: { blockId: "paragraph-1", field: "text" },
              content: [
                {
                  type: "text",
                  text: "unsafe",
                  marks: [
                    {
                      type: "link",
                      attrs: { href: "javascript:alert(1)" },
                    },
                  ],
                },
              ],
            },
          ],
        },
        source,
      ),
    ).toThrow(/unsupported mark/i);
    expect(source).toEqual(blocks);

    expect(() =>
      tiptapGraphToDocumentationBlocks({
        type: "doc",
        content: [{ type: "ossieUnknown", attrs: {} }],
      }),
    ).toThrow(/unsupported node/i);
  });
});
