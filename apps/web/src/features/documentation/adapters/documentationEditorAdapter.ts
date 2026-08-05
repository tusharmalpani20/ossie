import type { DocumentationBlock } from "@repo/types";
import { parse_documentation_controlled_markdown } from "@repo/documentation-domain/policies/documentation-content-policy";

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
};

export type TiptapDocument = {
  type: "doc";
  content: TiptapNode[];
};

type BaseAttrs = {
  id: string;
  position: number;
  expectedVersion: number | null;
};

const baseAttrs = (block: {
  id: string;
  position: number;
  expected_version: number | null;
}): BaseAttrs => ({
  id: block.id,
  position: block.position,
  expectedVersion: block.expected_version,
});

const inlineToTiptap = (value: string): TiptapNode[] =>
  parse_documentation_controlled_markdown(value).map((node) => {
    if (node.kind === "break") return { type: "hardBreak" };
    if (node.kind === "text") return { type: "text", text: node.text };
    return {
      type: "text",
      text: node.text,
      marks: [
        {
          type:
            node.kind === "strong"
              ? "bold"
              : node.kind === "emphasis"
                ? "italic"
                : "code",
        },
      ],
    };
  });

const supportedMarks = new Set<TiptapMark["type"]>(["bold", "italic", "code"]);

const inlineToMarkdown = (nodes: TiptapNode[] | undefined): string => {
  if (!nodes) return "";
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "\n";
      if (node.type !== "text" || typeof node.text !== "string")
        throw new Error(`Unsupported inline node: ${node.type}`);
      const marks = node.marks ?? [];
      if (marks.some((mark) => !supportedMarks.has(mark.type)))
        throw new Error("Unsupported mark in Tiptap content");
      if (marks.length > 1)
        throw new Error("Unsupported mark combination in Tiptap content");
      const mark = marks[0]?.type;
      if (mark === "bold") return `**${node.text}**`;
      if (mark === "italic") return `*${node.text}*`;
      if (mark === "code") return `\`${node.text}\``;
      return node.text;
    })
    .join("");
};

const proseNode = (
  type: string,
  block: { id: string; position: number; expected_version: number | null },
  field: string,
  text: string,
  attrs: Record<string, unknown> = {},
): TiptapNode => ({
  type,
  attrs: { blockId: block.id, field, ...attrs },
  content: inlineToTiptap(text),
});

/** Tiptap proof shape 1: prose fields only; structural blocks stay native. */
export const documentationBlocksToTiptapProse = (
  blocks: DocumentationBlock[],
): TiptapDocument => ({
  type: "doc",
  content: blocks.flatMap((block) => {
    switch (block.kind) {
      case "paragraph":
        return [proseNode("paragraph", block, "text", block.text)];
      case "heading":
        return [
          proseNode("heading", block, "text", block.text, {
            level: block.level,
          }),
        ];
      case "quote":
        return [
          proseNode("blockquote", block, "text", block.text, {
            attribution: block.attribution,
          }),
        ];
      case "callout":
        return [
          proseNode("callout", block, "text", block.text, {
            tone: block.tone,
            title: block.title,
          }),
        ];
      case "ordered_list":
      case "unordered_list":
        return [
          {
            type: block.kind === "ordered_list" ? "orderedList" : "bulletList",
            attrs: { ...baseAttrs(block), blockId: block.id },
            content: block.items.map((item) => ({
              type: "listItem",
              attrs: {
                itemId: item.id,
                position: item.position,
                expectedVersion: item.expected_version,
                blockId: block.id,
              },
              content: inlineToTiptap(item.text),
            })),
          },
        ];
      default:
        return [];
    }
  }),
});

const findAttr = (node: TiptapNode, key: string): unknown => node.attrs?.[key];

const requiredStringAttr = (node: TiptapNode, key: string): string => {
  const value = findAttr(node, key);
  if (typeof value !== "string" || !value)
    throw new Error(`Missing ${key} in Tiptap node`);
  return value;
};

const requireProseNode = (
  node: TiptapNode,
  source: DocumentationBlock,
): string => {
  const blockId = requiredStringAttr(node, "blockId");
  if (blockId !== source.id)
    throw new Error(`Tiptap block identity mismatch for ${source.id}`);
  if (findAttr(node, "field") !== "text")
    throw new Error(`Unsupported Tiptap field for ${source.id}`);
  return inlineToMarkdown(node.content);
};

const replaceProseText = (
  block: DocumentationBlock,
  node: TiptapNode,
): DocumentationBlock => {
  const text = requireProseNode(node, block);
  if (block.kind === "paragraph" && node.type === "paragraph")
    return { ...block, text };
  if (block.kind === "heading" && node.type === "heading")
    return { ...block, text };
  if (block.kind === "quote" && node.type === "blockquote")
    return { ...block, text };
  if (block.kind === "callout" && node.type === "callout")
    return { ...block, text };
  if (
    (block.kind === "paragraph" && node.type !== "paragraph") ||
    (block.kind === "heading" && node.type !== "heading") ||
    (block.kind === "quote" && node.type !== "blockquote") ||
    (block.kind === "callout" && node.type !== "callout")
  )
    throw new Error(`Unsupported Tiptap node for ${block.id}`);
  return block;
};

/** Apply prose edits to a native graph while preserving structural identity. */
export const tiptapProseToDocumentationBlocks = (
  document: TiptapDocument,
  source: DocumentationBlock[],
): DocumentationBlock[] => {
  const nodesByBlockId = new Map<string, TiptapNode>();
  for (const node of document.content) {
    const blockId = findAttr(node, "blockId");
    if (typeof blockId !== "string")
      throw new Error("Unsupported Tiptap node without block identity");
    if (nodesByBlockId.has(blockId))
      throw new Error(`Duplicate Tiptap block identity: ${blockId}`);
    nodesByBlockId.set(blockId, node);
  }

  return source.map((block) => {
    const node = nodesByBlockId.get(block.id);
    if (!node) return block;
    if (block.kind === "ordered_list" || block.kind === "unordered_list") {
      const expectedType =
        block.kind === "ordered_list" ? "orderedList" : "bulletList";
      if (node.type !== expectedType)
        throw new Error(`Unsupported Tiptap node for ${block.id}`);
      const items = node.content ?? [];
      if (
        items.length !== block.items.length ||
        items.some(
          (item, index) =>
            item.type !== "listItem" ||
            findAttr(item, "itemId") !== block.items[index]?.id,
        )
      )
        throw new Error(
          `List structure changed outside native controls: ${block.id}`,
        );
      return {
        ...block,
        items: block.items.map((item, index) => ({
          ...item,
          text: inlineToMarkdown(items[index]?.content),
        })),
      };
    }
    return replaceProseText(block, node);
  });
};

const graphBase = (block: {
  id: string;
  position: number;
  expected_version: number | null;
}) => baseAttrs(block);

const graphNode = (
  type: string,
  block: { id: string; position: number; expected_version: number | null },
  attrs: Record<string, unknown> = {},
  content?: TiptapNode[],
): TiptapNode => ({
  type,
  attrs: { ...graphBase(block), ...attrs },
  ...(content ? { content } : {}),
});

const textContent = (value: string): TiptapNode[] => [
  { type: "text", text: value },
];

/** Tiptap proof shape 2: an exhaustive, typed transient graph representation. */
export const documentationBlocksToTiptapGraph = (
  blocks: DocumentationBlock[],
): TiptapDocument => ({
  type: "doc",
  content: blocks.map((block) => {
    switch (block.kind) {
      case "paragraph":
        return graphNode(
          "ossieParagraph",
          block,
          {},
          inlineToTiptap(block.text),
        );
      case "heading":
        return graphNode(
          "ossieHeading",
          block,
          { level: block.level },
          inlineToTiptap(block.text),
        );
      case "ordered_list":
      case "unordered_list":
        return graphNode(
          block.kind === "ordered_list"
            ? "ossieOrderedList"
            : "ossieUnorderedList",
          block,
          {},
          block.items.map((item) => ({
            type: "ossieListItem",
            attrs: {
              id: item.id,
              position: item.position,
              expectedVersion: item.expected_version,
            },
            content: inlineToTiptap(item.text),
          })),
        );
      case "code":
        return graphNode(
          "ossieCode",
          block,
          { language: block.language },
          textContent(block.code),
        );
      case "link":
        return graphNode("ossieLink", block, {
          label: block.label,
          url: block.url ?? null,
          pageId: block.page_id ?? null,
          targetBlockId: block.target_block_id ?? null,
        });
      case "image":
        return graphNode("ossieImage", block, {
          sourceKind: block.source?.kind ?? "asset_id",
          sourceId: block.source?.id ?? block.asset_id,
          altText: block.alt_text,
          caption: block.caption,
        });
      case "divider":
        return graphNode("ossieDivider", block);
      case "api_reference":
        return graphNode("ossieApiReference", block, {
          openapiSourceId: block.openapi_source_id,
          operationKey: block.operation_key,
        });
      case "quote":
        return graphNode(
          "ossieQuote",
          block,
          { attribution: block.attribution },
          inlineToTiptap(block.text),
        );
      case "table":
        return graphNode(
          "ossieTable",
          block,
          { caption: block.caption },
          block.rows.map((row) => ({
            type: "ossieTableRow",
            attrs: {
              id: row.id,
              position: row.position,
              expectedVersion: row.expected_version,
            },
            content: row.cells.map((cell) => ({
              type: "ossieTableCell",
              attrs: {
                id: cell.id,
                columnPosition: cell.column_position,
                expectedVersion: cell.expected_version,
                isHeader: cell.is_header,
              },
              content: inlineToTiptap(cell.text),
            })),
          })),
        );
      case "code_example":
        return graphNode(
          "ossieCodeExample",
          block,
          {
            language: block.language,
            title: block.title,
          },
          textContent(block.code),
        );
      case "callout":
        return graphNode(
          "ossieCallout",
          block,
          {
            tone: block.tone,
            title: block.title,
          },
          inlineToTiptap(block.text),
        );
      case "tabs":
        return graphNode(
          "ossieTabs",
          block,
          {},
          block.items.map((item) => ({
            type: "ossieTabItem",
            attrs: {
              id: item.id,
              position: item.position,
              expectedVersion: item.expected_version,
              label: item.label,
            },
            content: inlineToTiptap(item.body),
          })),
        );
      case "snippet_reference":
        return graphNode("ossieSnippetReference", block, {
          snippetId: block.snippet_id,
        });
      case "guide_publication":
        return graphNode("ossieGuidePublication", block, {
          publishedArtifactId: block.published_artifact_id,
        });
      case "interactive_demo_publication":
        return graphNode("ossieInteractiveDemoPublication", block, {
          publishedArtifactId: block.published_artifact_id,
        });
    }
  }),
});

const requiredNumberOrNull = (node: TiptapNode, key: string) => {
  const value = findAttr(node, key);
  if (value !== null && typeof value !== "number")
    throw new Error(`Invalid ${key} in Tiptap node`);
  return value as number | null;
};

const requiredNumber = (node: TiptapNode, key: string) => {
  const value = findAttr(node, key);
  if (typeof value !== "number")
    throw new Error(`Missing ${key} in Tiptap node`);
  return value;
};

const requiredBoolean = (node: TiptapNode, key: string) => {
  const value = findAttr(node, key);
  if (typeof value !== "boolean")
    throw new Error(`Missing ${key} in Tiptap node`);
  return value;
};

const optionalStringOrNull = (node: TiptapNode, key: string) => {
  const value = findAttr(node, key);
  if (value === undefined) return null;
  if (value !== null && typeof value !== "string")
    throw new Error(`Invalid ${key} in Tiptap node`);
  return value as string | null;
};

const graphIdentity = (node: TiptapNode) => ({
  id: requiredStringAttr(node, "id"),
  position: requiredNumber(node, "position"),
  expected_version: requiredNumberOrNull(node, "expectedVersion"),
});

const plainText = (node: TiptapNode, field: string) => {
  const content = node.content ?? [];
  if (content.some((child) => child.type !== "text" || child.marks?.length))
    throw new Error(`Unsupported rich content in ${field}`);
  return content.map((child) => child.text ?? "").join("");
};

const graphNodeToBlock = (node: TiptapNode): DocumentationBlock => {
  if (
    ![
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
    ].includes(node.type)
  )
    throw new Error(`Unsupported node in Tiptap graph: ${node.type}`);
  const base = graphIdentity(node);
  switch (node.type) {
    case "ossieParagraph":
      return {
        ...base,
        kind: "paragraph",
        text: inlineToMarkdown(node.content),
      };
    case "ossieHeading":
      return {
        ...base,
        kind: "heading",
        level: requiredNumber(node, "level") as 2 | 3 | 4,
        text: inlineToMarkdown(node.content),
      };
    case "ossieOrderedList":
    case "ossieUnorderedList":
      return {
        ...base,
        kind:
          node.type === "ossieOrderedList" ? "ordered_list" : "unordered_list",
        items: (node.content ?? []).map((item) => {
          if (item.type !== "ossieListItem")
            throw new Error("Unsupported list item node");
          return {
            id: requiredStringAttr(item, "id"),
            position: requiredNumber(item, "position"),
            expected_version: requiredNumberOrNull(item, "expectedVersion"),
            text: inlineToMarkdown(item.content),
          };
        }),
      };
    case "ossieCode":
      return {
        ...base,
        kind: "code",
        code: plainText(node, "code"),
        language: optionalStringOrNull(node, "language"),
      };
    case "ossieLink": {
      const url = optionalStringOrNull(node, "url");
      const pageId = optionalStringOrNull(node, "pageId");
      if ((url === null) === (pageId === null))
        throw new Error("Link must have exactly one target");
      return {
        ...base,
        kind: "link",
        label: requiredStringAttr(node, "label"),
        ...(url !== null ? { url } : { page_id: pageId! }),
        ...(optionalStringOrNull(node, "targetBlockId") !== null
          ? { target_block_id: optionalStringOrNull(node, "targetBlockId")! }
          : {}),
      };
    }
    case "ossieImage": {
      const sourceKind = requiredStringAttr(node, "sourceKind");
      if (
        sourceKind !== "documentation_asset" &&
        sourceKind !== "capture_asset" &&
        sourceKind !== "asset_id"
      )
        throw new Error("Unsupported image source");
      const sourceId = requiredStringAttr(node, "sourceId");
      return {
        ...base,
        kind: "image",
        ...(sourceKind === "asset_id"
          ? { asset_id: sourceId }
          : { source: { kind: sourceKind, id: sourceId } }),
        alt_text: requiredStringAttr(node, "altText"),
        caption: optionalStringOrNull(node, "caption"),
      };
    }
    case "ossieDivider":
      return { ...base, kind: "divider" };
    case "ossieApiReference":
      return {
        ...base,
        kind: "api_reference",
        openapi_source_id: requiredStringAttr(node, "openapiSourceId"),
        operation_key: optionalStringOrNull(node, "operationKey"),
      };
    case "ossieQuote":
      return {
        ...base,
        kind: "quote",
        text: inlineToMarkdown(node.content),
        attribution: optionalStringOrNull(node, "attribution"),
      };
    case "ossieTable":
      return {
        ...base,
        kind: "table",
        caption: optionalStringOrNull(node, "caption"),
        rows: (node.content ?? []).map((row) => {
          if (row.type !== "ossieTableRow")
            throw new Error("Unsupported table row node");
          return {
            id: requiredStringAttr(row, "id"),
            position: requiredNumber(row, "position"),
            expected_version: requiredNumberOrNull(row, "expectedVersion"),
            cells: (row.content ?? []).map((cell) => {
              if (cell.type !== "ossieTableCell")
                throw new Error("Unsupported table cell node");
              return {
                id: requiredStringAttr(cell, "id"),
                column_position: requiredNumber(cell, "columnPosition"),
                expected_version: requiredNumberOrNull(cell, "expectedVersion"),
                is_header: requiredBoolean(cell, "isHeader"),
                text: inlineToMarkdown(cell.content),
              };
            }),
          };
        }),
      };
    case "ossieCodeExample":
      return {
        ...base,
        kind: "code_example",
        code: plainText(node, "code example"),
        language: optionalStringOrNull(node, "language"),
        title: optionalStringOrNull(node, "title"),
      };
    case "ossieCallout":
      return {
        ...base,
        kind: "callout",
        tone: requiredStringAttr(node, "tone") as
          | "info"
          | "success"
          | "warning"
          | "danger",
        title: optionalStringOrNull(node, "title"),
        text: inlineToMarkdown(node.content),
      };
    case "ossieTabs":
      return {
        ...base,
        kind: "tabs",
        items: (node.content ?? []).map((item) => {
          if (item.type !== "ossieTabItem")
            throw new Error("Unsupported tab item node");
          return {
            id: requiredStringAttr(item, "id"),
            position: requiredNumber(item, "position"),
            expected_version: requiredNumberOrNull(item, "expectedVersion"),
            label: requiredStringAttr(item, "label"),
            body: inlineToMarkdown(item.content),
          };
        }),
      };
    case "ossieSnippetReference":
      return {
        ...base,
        kind: "snippet_reference",
        snippet_id: requiredStringAttr(node, "snippetId"),
      };
    case "ossieGuidePublication":
      return {
        ...base,
        kind: "guide_publication",
        published_artifact_id: requiredStringAttr(node, "publishedArtifactId"),
      };
    case "ossieInteractiveDemoPublication":
      return {
        ...base,
        kind: "interactive_demo_publication",
        published_artifact_id: requiredStringAttr(node, "publishedArtifactId"),
      };
    default:
      throw new Error(`Unsupported node in Tiptap graph: ${node.type}`);
  }
};

export const tiptapGraphToDocumentationBlocks = (
  document: TiptapDocument,
): DocumentationBlock[] => document.content.map(graphNodeToBlock);
