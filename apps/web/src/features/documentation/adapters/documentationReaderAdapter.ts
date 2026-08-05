import { getBreadcrumbItems } from "fumadocs-core/breadcrumb";
import type * as PageTree from "fumadocs-core/page-tree";
import type { DocumentationBlock } from "@repo/types";

export type DocumentationReaderResourceClass =
  | "publication"
  | "draft_preview"
  | "revision_preview";

type ReaderSourcePage = {
  id: string;
  title: string;
  canonicalPath: string;
  url: string;
  blocks: DocumentationBlock[];
};

type ReaderSourceNavigation = {
  id: string;
  kind: "page" | "group";
  pageId?: string | null;
  label?: string | null;
};

export type DocumentationReaderProjectionSource = {
  resourceClass: DocumentationReaderResourceClass;
  selectedPageId: string;
  selectedPagePath: string;
  pages: ReaderSourcePage[];
  navigation: ReaderSourceNavigation[];
};

export type DocumentationReaderHeading = {
  id: string;
  title: string;
  level: 2 | 3 | 4;
};

export type DocumentationReaderProjection = {
  resourceClass: DocumentationReaderResourceClass;
  selectedPageId: string;
  selectedPagePath: string;
  pages: Array<{
    id: string;
    title: string;
    url: string;
    headings: DocumentationReaderHeading[];
  }>;
  navigation: Array<{
    id: string;
    kind: "page" | "group";
    pageId?: string | null;
    label: string;
  }>;
};

const pageHeadings = (
  blocks: DocumentationBlock[],
): DocumentationReaderHeading[] =>
  blocks.flatMap((block) =>
    block.kind === "heading"
      ? [
          {
            id: `documentation-block-${block.id}`,
            title: block.text,
            level: block.level,
          },
        ]
      : [],
  );

/** Convert an already-authorized Ossie snapshot into an explicit safe allowlist. */
export const buildDocumentationReaderProjection = (
  source: DocumentationReaderProjectionSource,
): DocumentationReaderProjection => {
  const pagesById = new Map(source.pages.map((page) => [page.id, page]));
  const navigation: DocumentationReaderProjection["navigation"] =
    source.navigation.flatMap(
      (node): DocumentationReaderProjection["navigation"] => {
        if (node.kind === "group")
          return [
            {
              id: node.id,
              kind: node.kind,
              label: node.label ?? "Documentation",
            },
          ];
        const page = node.pageId ? pagesById.get(node.pageId) : undefined;
        if (!page) return [];
        return [
          {
            id: node.id,
            kind: node.kind,
            pageId: page.id,
            label: node.label ?? page.title,
          },
        ];
      },
    );
  return {
    resourceClass: source.resourceClass,
    selectedPageId: source.selectedPageId,
    selectedPagePath: source.selectedPagePath,
    pages: source.pages.map((page) => ({
      id: page.id,
      title: page.title,
      url: page.url,
      headings: pageHeadings(page.blocks),
    })),
    navigation,
  };
};

export const buildFumadocsPageTree = (
  projection: DocumentationReaderProjection,
): PageTree.Root => {
  const pagesById = new Map(projection.pages.map((page) => [page.id, page]));
  const urls = new Set<string>();
  const children: PageTree.Node[] = [];

  for (const navigation of projection.navigation) {
    if (navigation.kind === "group") {
      children.push({
        type: "folder",
        $id: navigation.id,
        name: navigation.label,
        children: [],
      });
      continue;
    }
    const page = navigation.pageId
      ? pagesById.get(navigation.pageId)
      : undefined;
    if (!page) continue;
    if (urls.has(page.url))
      throw new Error(`Duplicate reader URL: ${page.url}`);
    urls.add(page.url);
    children.push({
      type: "page",
      $id: navigation.id,
      name: navigation.label,
      url: page.url,
    });
  }

  return { type: "root", name: "Documentation", children };
};

export const getDocumentationReaderBreadcrumb = (
  tree: PageTree.Root,
  url: string,
) => getBreadcrumbItems(url, tree, { includePage: true });
