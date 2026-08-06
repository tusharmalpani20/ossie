import { describe, expect, it } from "vitest";
import type { DocumentationBlock } from "@repo/types";
import {
  buildDocumentationReaderProjection,
  buildFumadocsPageTree,
  getDocumentationReaderAdjacentPages,
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
          parentId: null,
          position: 1,
        },
        {
          id: "nav-reference",
          kind: "page",
          pageId: "page-reference",
          label: "Reference",
          parentId: null,
          position: 2,
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

  it("preserves authorized groups and ordered pages while dropping malformed nodes", () => {
    const projection = buildDocumentationReaderProjection({
      ...source,
      selectedPageId: "page-nested",
      selectedPagePath: "/docs/nested",
      pages: [
        ...source.pages,
        {
          id: "page-nested",
          title: "Nested",
          canonicalPath: "/docs/nested",
          url: "/docs/nested",
          blocks: [],
        },
        {
          id: "page-last",
          title: "Last",
          canonicalPath: "/docs/last",
          url: "/docs/last",
          blocks: [],
        },
      ],
      navigation: [
        { id: "group-guides", kind: "group", label: "Guides", position: 1 },
        {
          id: "group-api",
          kind: "group",
          label: "API",
          parentId: "group-guides",
          position: 2,
        },
        {
          id: "nav-nested",
          kind: "page",
          pageId: "page-nested",
          parentId: "group-api",
          position: 1,
        },
        {
          id: "nav-last",
          kind: "page",
          pageId: "page-last",
          label: "Last",
          position: 3,
        },
        {
          id: "orphan",
          kind: "group",
          label: "Orphan",
          parentId: "missing-parent",
          position: 1,
        },
        {
          id: "cycle-a",
          kind: "group",
          label: "Cycle A",
          parentId: "cycle-b",
          position: 1,
        },
        {
          id: "cycle-b",
          kind: "group",
          label: "Cycle B",
          parentId: "cycle-a",
          position: 1,
        },
        {
          id: "missing-page",
          kind: "page",
          pageId: "not-authorized",
          position: 4,
        },
        {
          id: "invalid-position",
          kind: "page",
          pageId: "page-reference",
          position: Number.NaN,
        },
      ],
    });

    const tree = buildFumadocsPageTree(projection);

    expect(tree.children).toEqual([
      {
        type: "folder",
        $id: "group-guides",
        name: "Guides",
        children: [
          {
            type: "folder",
            $id: "group-api",
            name: "API",
            children: [
              {
                type: "page",
                $id: "nav-nested",
                name: "Nested",
                url: "/docs/nested",
              },
            ],
          },
        ],
      },
      {
        type: "page",
        $id: "nav-last",
        name: "Last",
        url: "/docs/last",
      },
    ]);

    expect(JSON.stringify(tree)).not.toContain("Orphan");
    expect(JSON.stringify(tree)).not.toContain("Cycle");
    expect(JSON.stringify(tree)).not.toContain("not-authorized");
  });

  it("derives previous and next pages from the same authorized grouped order", () => {
    const projection = buildDocumentationReaderProjection({
      ...source,
      selectedPageId: "page-reference",
      selectedPagePath: "/docs/reference",
      navigation: [
        { id: "group", kind: "group", label: "Guides", position: 1 },
        {
          id: "nav-install",
          kind: "page",
          pageId: "page-install",
          parentId: "group",
          position: 1,
        },
        {
          id: "nav-reference",
          kind: "page",
          pageId: "page-reference",
          parentId: "group",
          position: 2,
        },
      ],
    });
    const tree = buildFumadocsPageTree(projection);

    expect(getDocumentationReaderAdjacentPages(projection, tree)).toEqual({
      previous: {
        id: "page-install",
        title: "Install",
        url: "/docs/install",
      },
      next: null,
    });
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
