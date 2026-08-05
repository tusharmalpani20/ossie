import { describe, expect, it } from "vitest";
import type { DocumentationBlock } from "@repo/types";
import {
  buildDocumentationReaderProjection,
  buildFumadocsPageTree,
  getDocumentationReaderBreadcrumb,
} from "./documentationReaderAdapter";

const blocks: DocumentationBlock[] = [
  {
    id: "heading-1",
    kind: "heading",
    position: 1,
    expected_version: null,
    level: 2,
    text: "Install",
  },
  {
    id: "paragraph-1",
    kind: "paragraph",
    position: 2,
    expected_version: null,
    text: "Safe text",
  },
];

const source = {
  resourceClass: "publication" as const,
  selectedPageId: "page-install",
  selectedPagePath: "/docs/install",
  pages: [
    {
      id: "page-install",
      title: "Install",
      canonicalPath: "/docs/install",
      url: "/docs/install",
      blocks,
      privateCommentBody: "do not expose this",
      reviewReason: "private review",
    },
    {
      id: "page-reference",
      title: "Reference",
      canonicalPath: "/docs/reference",
      url: "/docs/reference",
      blocks: [],
    },
  ],
  navigation: [
    {
      id: "nav-install",
      kind: "page" as const,
      pageId: "page-install",
      label: "Install",
      privateAccessMode: "internal",
    },
    {
      id: "nav-reference",
      kind: "page" as const,
      pageId: "page-reference",
      label: "Reference",
    },
  ],
};

describe("Fumadocs reader adapter proof projection", () => {
  it("allowlists exact-page navigation and heading data for each resource class", () => {
    const projection = buildDocumentationReaderProjection(source);

    expect(projection).toEqual({
      resourceClass: "publication",
      selectedPageId: "page-install",
      selectedPagePath: "/docs/install",
      pages: [
        {
          id: "page-install",
          title: "Install",
          url: "/docs/install",
          headings: [
            {
              id: "documentation-block-heading-1",
              title: "Install",
              level: 2,
            },
          ],
        },
        {
          id: "page-reference",
          title: "Reference",
          url: "/docs/reference",
          headings: [],
        },
      ],
      navigation: [
        {
          id: "nav-install",
          kind: "page",
          pageId: "page-install",
          label: "Install",
        },
        {
          id: "nav-reference",
          kind: "page",
          pageId: "page-reference",
          label: "Reference",
        },
      ],
    });
    expect(JSON.stringify(projection)).not.toContain("private");
    expect(JSON.stringify(projection)).not.toContain("review");
  });

  it.each(["publication", "draft_preview", "revision_preview"] as const)(
    "preserves the %s resource boundary",
    (resourceClass) => {
      const projection = buildDocumentationReaderProjection({
        ...source,
        resourceClass,
      });
      expect(projection.resourceClass).toBe(resourceClass);
      expect(projection.selectedPageId).toBe(source.selectedPageId);
    },
  );

  it("uses Fumadocs page-tree, breadcrumb, and stable heading anchors without duplicate URLs", () => {
    const projection = buildDocumentationReaderProjection(source);
    const tree = buildFumadocsPageTree(projection);

    expect(tree.children).toEqual([
      {
        type: "page",
        $id: "nav-install",
        name: "Install",
        url: "/docs/install",
      },
      {
        type: "page",
        $id: "nav-reference",
        name: "Reference",
        url: "/docs/reference",
      },
    ]);
    expect(getDocumentationReaderBreadcrumb(tree, "/docs/install")).toEqual([
      { name: "Install", url: "/docs/install" },
    ]);
    expect(
      new Set(
        tree.children
          .filter((node) => node.type === "page")
          .map((node) => node.url),
      ).size,
    ).toBe(2);
  });

  it("fails closed when the selected Page is not in authorized navigation", () => {
    const projection = buildDocumentationReaderProjection({
      ...source,
      selectedPageId: "page-missing",
    });

    expect(() => buildFumadocsPageTree(projection)).toThrow(
      /not present in authorized navigation/i,
    );
  });
});
