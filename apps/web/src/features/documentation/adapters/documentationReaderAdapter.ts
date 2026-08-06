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
  parentId?: string | null;
  position?: number;
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
    parentId: string | null;
    position: number;
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
  const seenNavigationIds = new Set<string>();
  const navigation = source.navigation.flatMap(
    (node, index): DocumentationReaderProjection["navigation"] => {
      if (!node.id || seenNavigationIds.has(node.id)) return [];
      seenNavigationIds.add(node.id);
      const position =
        node.position === undefined
          ? index + 1
          : Number.isSafeInteger(node.position) && node.position > 0
            ? node.position
            : null;
      if (position === null) return [];
      const parentId = node.parentId ?? null;
      if (node.kind === "group")
        return [
          {
            id: node.id,
            kind: node.kind,
            label: node.label ?? "Documentation",
            parentId,
            position,
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
          parentId,
          position,
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

const buildReaderNavigationChildren = (
  projection: DocumentationReaderProjection,
): PageTree.Node[] => {
  const groupIds = new Set(
    projection.navigation
      .filter((node) => node.kind === "group")
      .map((node) => node.id),
  );
  const validNavigation = projection.navigation.filter(
    (node) => node.parentId === null || groupIds.has(node.parentId),
  );
  const byParent = new Map<string | null, typeof validNavigation>();
  for (const node of validNavigation) {
    const siblings = byParent.get(node.parentId) ?? [];
    siblings.push(node);
    byParent.set(node.parentId, siblings);
  }
  for (const siblings of byParent.values()) {
    siblings.sort(
      (left, right) =>
        left.position - right.position || left.id.localeCompare(right.id),
    );
  }

  const pagesById = new Map(projection.pages.map((page) => [page.id, page]));
  const emittedUrls = new Set<string>();
  const buildChildren = (
    parentId: string | null,
    ancestors: ReadonlySet<string>,
  ): PageTree.Node[] =>
    (byParent.get(parentId) ?? []).flatMap((node): PageTree.Node[] => {
      if (ancestors.has(node.id)) return [];
      if (node.kind === "group") {
        const nextAncestors = new Set(ancestors);
        nextAncestors.add(node.id);
        return [
          {
            type: "folder" as const,
            $id: node.id,
            name: node.label,
            children: buildChildren(node.id, nextAncestors),
          },
        ];
      }
      const page = node.pageId ? pagesById.get(node.pageId) : undefined;
      if (!page || emittedUrls.has(page.url)) return [];
      emittedUrls.add(page.url);
      return [
        {
          type: "page" as const,
          $id: node.id,
          name: node.label,
          url: page.url,
        },
      ];
    });

  return buildChildren(null, new Set());
};

export const buildDocumentationReaderNavigationTree = (
  projection: DocumentationReaderProjection,
): PageTree.Root => ({
  type: "root",
  name: "Documentation",
  children: buildReaderNavigationChildren(projection),
});

export const buildFumadocsPageTree = (
  projection: DocumentationReaderProjection,
): PageTree.Root => {
  const tree = buildDocumentationReaderNavigationTree(projection);
  const urls = new Set<string>();
  const collectPageUrls = (nodes: PageTree.Node[]) => {
    for (const node of nodes) {
      if (node.type === "page") urls.add(node.url);
      if (node.type === "folder") collectPageUrls(node.children);
    }
  };
  collectPageUrls(tree.children);

  const selected = projection.pages.find(
    (page) => page.id === projection.selectedPageId,
  );
  if (!selected || !urls.has(selected.url))
    throw new Error(
      "Selected reader Page is not present in authorized navigation",
    );

  return tree;
};

export type DocumentationReaderAdjacentPage = {
  id: string;
  title: string;
  url: string;
};

export const getDocumentationReaderAdjacentPages = (
  projection: DocumentationReaderProjection,
  tree: PageTree.Root,
): {
  previous: DocumentationReaderAdjacentPage | null;
  next: DocumentationReaderAdjacentPage | null;
} => {
  const navigationById = new Map(
    projection.navigation.map((node) => [node.id, node]),
  );
  const pagesById = new Map(projection.pages.map((page) => [page.id, page]));
  const ordered: DocumentationReaderAdjacentPage[] = [];
  const collectPages = (nodes: PageTree.Node[]) => {
    for (const node of nodes) {
      if (node.type === "folder") {
        collectPages(node.children);
        continue;
      }
      if (node.type !== "page" || !node.$id) continue;
      const navigation = navigationById.get(node.$id);
      const page = navigation?.pageId
        ? pagesById.get(navigation.pageId)
        : undefined;
      if (page) ordered.push({ id: page.id, title: page.title, url: page.url });
    }
  };
  collectPages(tree.children);
  const selectedIndex = ordered.findIndex(
    (page) => page.id === projection.selectedPageId,
  );
  return {
    previous: selectedIndex > 0 ? ordered[selectedIndex - 1]! : null,
    next:
      selectedIndex >= 0 && selectedIndex < ordered.length - 1
        ? ordered[selectedIndex + 1]!
        : null,
  };
};

export const getDocumentationReaderBreadcrumb = (
  tree: PageTree.Root,
  url: string,
) => getBreadcrumbItems(url, tree, { includePage: true });
