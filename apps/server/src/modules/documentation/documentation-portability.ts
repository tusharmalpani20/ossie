import path from "node:path";
import {
  DocumentationPortablePageV1Schema,
  DocumentationPortableSiteV1Schema,
  DocumentationPortableSnippetV1Schema,
  type DocumentationPortableBlockV1,
} from "@repo/types";

type Snapshot = Record<string, any>;

const handle = (kind: string, position: number) =>
  `${kind}-${String(position + 1).padStart(4, "0")}`;

const extension_for_mime = (mime: string) =>
  mime === "image/jpeg" ? "jpg" : mime.split("/").at(-1) ?? "bin";

export const create_portable_documentation_snapshot = (snapshot: Snapshot) => {
  const pages = [...(snapshot.pages ?? [])].sort(
    (left, right) =>
      String(left.canonical_path).localeCompare(String(right.canonical_path)) ||
      String(left.id).localeCompare(String(right.id)),
  );
  const snippets = [...(snapshot.snippets ?? [])].sort(
    (left, right) =>
      String(left.name).localeCompare(String(right.name)) ||
      String(left.id).localeCompare(String(right.id)),
  );
  const assets = [...(snapshot.assets ?? [])].sort((left, right) =>
    String(left.id).localeCompare(String(right.id)),
  );
  const pageHandles = new Map(
    pages.map((page, index) => [page.id, handle("page", index)]),
  );
  const snippetHandles = new Map(
    snippets.map((snippet, index) => [snippet.id, handle("snippet", index)]),
  );
  const assetHandles = new Map(
    assets.map((asset, index) => [asset.id, handle("asset", index)]),
  );
  const allBlocks = [...pages, ...snippets].flatMap(
    (owner) => owner.blocks ?? [],
  );
  const blockHandles = new Map(
    allBlocks.map((block, index) => [block.id, handle("block", index)]),
  );
  const publicationIds = [
    ...new Set(
      allBlocks
        .map((block) => block.published_artifact_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ].sort();
  const bindingHandles = new Map(
    publicationIds.map((id, index) => [id, handle("binding", index)]),
  );

  const portableBlock = (
    block: Record<string, any>,
  ): DocumentationPortableBlockV1 => {
    const base = {
      handle: blockHandles.get(block.id)!,
      kind: block.kind,
      position: block.position,
    };
    switch (block.kind) {
      case "paragraph":
      case "heading":
      case "quote":
      case "callout":
        return {
          ...base,
          ...(block.kind === "heading" ? { level: block.level } : {}),
          ...(block.kind === "callout"
            ? { tone: block.tone, title: block.title ?? null }
            : {}),
          text: block.text,
          ...(block.kind === "quote"
            ? { attribution: block.attribution ?? null }
            : {}),
        } as DocumentationPortableBlockV1;
      case "ordered_list":
      case "unordered_list":
        return {
          ...base,
          items: block.items.map(
            (item: Record<string, any>, index: number) => ({
              handle: handle(`${base.handle}-item`, index),
              position: item.position,
              text: item.text,
            }),
          ),
        } as DocumentationPortableBlockV1;
      case "code":
        return {
          ...base,
          code: block.code,
          language: block.language ?? null,
        } as DocumentationPortableBlockV1;
      case "link":
        return {
          ...base,
          label: block.label,
          ...(block.url
            ? { url: block.url }
            : { page_handle: pageHandles.get(block.page_id)! }),
          target_block_handle: block.target_block_id
            ? (blockHandles.get(block.target_block_id) ?? null)
            : null,
        } as DocumentationPortableBlockV1;
      case "image": {
        const assetId = block.source?.id ?? block.asset_id;
        const assetHandle = assetHandles.get(assetId);
        if (!assetHandle)
          throw new Error("Referenced image is not portable");
        return {
          ...base,
          asset_handle: assetHandle,
          alt_text: block.alt_text,
          caption: block.caption ?? null,
        } as DocumentationPortableBlockV1;
      }
      case "divider":
        return base as DocumentationPortableBlockV1;
      case "api_reference":
        return {
          ...base,
          operation_destination_key: block.operation_key ?? null,
        } as DocumentationPortableBlockV1;
      case "table":
        return {
          ...base,
          caption: block.caption ?? null,
          rows: block.rows.map(
            (row: Record<string, any>, rowIndex: number) => ({
              handle: handle(`${base.handle}-row`, rowIndex),
              position: row.position,
              cells: row.cells.map(
                (cell: Record<string, any>, cellIndex: number) => ({
                  handle: handle(`${base.handle}-cell`, cellIndex),
                  column_position: cell.column_position,
                  is_header: cell.is_header,
                  text: cell.text,
                }),
              ),
            }),
          ),
        } as DocumentationPortableBlockV1;
      case "code_example":
        return {
          ...base,
          code: block.code,
          language: block.language ?? null,
          title: block.title ?? null,
        } as DocumentationPortableBlockV1;
      case "tabs":
        return {
          ...base,
          items: block.items.map(
            (item: Record<string, any>, index: number) => ({
              handle: handle(`${base.handle}-tab`, index),
              position: item.position,
              label: item.label,
              body: item.body,
            }),
          ),
        } as DocumentationPortableBlockV1;
      case "snippet_reference":
        return {
          ...base,
          snippet_handle: snippetHandles.get(block.snippet_id)!,
        } as DocumentationPortableBlockV1;
      case "guide_publication":
      case "interactive_demo_publication":
        return {
          ...base,
          external_binding_handle: bindingHandles.get(
            block.published_artifact_id,
          )!,
        } as DocumentationPortableBlockV1;
      default:
        throw new Error(`Unsupported Documentation block ${block.kind}`);
    }
  };

  const portablePages = pages.map((page) =>
    DocumentationPortablePageV1Schema.parse({
      schema_version: 1,
      handle: pageHandles.get(page.id),
      title: page.title,
      description: page.description ?? null,
      canonical_path: page.canonical_path,
      keywords: (page.keywords ?? []).map(
        (keyword: Record<string, any> | string) =>
          typeof keyword === "string" ? keyword : keyword.keyword,
      ),
      blocks: (page.blocks ?? []).map(portableBlock),
    }),
  );
  const portableSnippets = snippets.map((snippet) =>
    DocumentationPortableSnippetV1Schema.parse({
      schema_version: 1,
      handle: snippetHandles.get(snippet.id),
      name: snippet.name,
      status: snippet.status,
      blocks: (snippet.blocks ?? []).map(portableBlock),
    }),
  );
  const navigationNodes = [...(snapshot.navigation?.nodes ?? [])].sort(
    (left, right) => left.position - right.position,
  );
  const navigationHandles = new Map(
    navigationNodes.map((node, index) => [
      node.id,
      handle("navigation", index),
    ]),
  );
  const site = DocumentationPortableSiteV1Schema.parse({
    schema_version: 1,
    site: {
      name: snapshot.site.name,
      description: snapshot.site.description ?? null,
      primary_language: snapshot.edition.primary_language,
    },
    home_page_handle: snapshot.working_draft?.home_page_id
      ? (pageHandles.get(snapshot.working_draft.home_page_id) ?? null)
      : snapshot.home_page_id
        ? (pageHandles.get(snapshot.home_page_id) ?? null)
        : null,
    pages: portablePages.map((page) => ({
      handle: page.handle,
      title: page.title,
      description: page.description,
      canonical_path: page.canonical_path,
      keywords: page.keywords,
      typed_path: `pages/${page.handle}.json`,
      markdown_path: `pages/${page.handle}.md`,
    })),
    snippets: portableSnippets.map((snippet) => ({
      handle: snippet.handle,
      path: `snippets/${snippet.handle}.json`,
    })),
    assets: assets.map((asset) => ({
      handle: assetHandles.get(asset.id),
      path: `assets/${assetHandles.get(asset.id)}.${extension_for_mime(
        asset.mime_type,
      )}`,
      name: asset.name,
      status: asset.status,
      mime_type: asset.mime_type,
      size_bytes: asset.byte_size,
      width: asset.width,
      height: asset.height,
      sha256: asset.digest,
    })),
    navigation: navigationNodes.map((node) => ({
      handle: navigationHandles.get(node.id),
      parent_handle: node.parent_id
        ? (navigationHandles.get(node.parent_id) ?? null)
        : null,
      kind: node.kind,
      label: node.label ?? null,
      page_handle: node.page_id
        ? (pageHandles.get(node.page_id) ?? null)
        : null,
      position: node.position,
    })),
    aliases: (snapshot.routing?.aliases ?? []).map(
      (alias: Record<string, any>) => ({
        page_handle: pageHandles.get(
          alias.documentation_page_id ?? alias.source_page_id,
        ),
        former_path: alias.former_path,
      }),
    ),
    routes: (snapshot.routing?.rules ?? []).map(
      (rule: Record<string, any>) => ({
        source_path: rule.source_path,
        outcome: rule.outcome,
        target_page_handle: rule.target_page_id
          ? (pageHandles.get(rule.target_page_id) ?? null)
          : null,
      }),
    ),
    openapi: snapshot.openapi_source
      ? {
          path: `openapi/source.${snapshot.openapi_source.original_format}`,
          original_format: snapshot.openapi_source.original_format,
          sha256: snapshot.openapi_source.digest,
        }
      : null,
    external_bindings: publicationIds.map((id) => {
      const source = allBlocks.find(
        (block) => block.published_artifact_id === id,
      );
      return {
        handle: bindingHandles.get(id),
        kind: source?.kind,
        display: {
          title: source?.publication?.title ?? "Publication",
          description: source?.publication?.description ?? null,
          project_version_label:
            source?.publication?.project_version_label ?? "Imported source",
          revision_number: source?.publication?.revision_number ?? 1,
          publication_sequence:
            source?.publication?.publication_sequence ?? 1,
        },
      };
    }),
  });
  return { site, pages: portablePages, snippets: portableSnippets };
};

export const portable_asset_filename = (portablePath: string) =>
  path.posix.basename(portablePath);
