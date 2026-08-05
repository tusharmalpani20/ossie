import type { DocumentationBlock } from "@repo/types";

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

const CONTROLLED_MARKDOWN_MAX_BYTES = 256 * 1024;
const UNSUPPORTED_MARKUP =
  /<\/?[a-z][^>]*>|!\[[^\]]*\]\(|\[[^\]]+\]\(|(^|\n)\s{0,3}#{1,6}\s|(^|\n)\s*(?:import|export)\s/iu;

type ControlledInlineNode = {
  kind: "text" | "strong" | "emphasis" | "code" | "break";
  text: string;
};

const parseControlledInline = (value: string): ControlledInlineNode[] => {
  if (new TextEncoder().encode(value).byteLength > CONTROLLED_MARKDOWN_MAX_BYTES)
    throw new Error("Text exceeds its accepted safety ceiling");
  if (UNSUPPORTED_MARKUP.test(value))
    throw new Error("Text contains unsupported markup");

  const nodes: ControlledInlineNode[] = [];
  const matcher = /(\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`|\r?\n)/gu;
  let offset = 0;
  for (const match of value.matchAll(matcher)) {
    if (match.index > offset)
      nodes.push({ kind: "text", text: value.slice(offset, match.index) });
    if (match[0] === "\n" || match[0] === "\r\n")
      nodes.push({ kind: "break", text: "\n" });
    else if (match[2]) nodes.push({ kind: "strong", text: match[2] });
    else if (match[3]) nodes.push({ kind: "emphasis", text: match[3] });
    else if (match[4]) nodes.push({ kind: "code", text: match[4] });
    offset = match.index + match[0].length;
  }
  if (offset < value.length)
    nodes.push({ kind: "text", text: value.slice(offset) });
  return nodes;
};

const inlineToTiptap = (value: string): TiptapNode[] =>
  parseControlledInline(value).map((node) => {
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

const supportedMarks = new Set(["bold", "italic", "code"]);

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
  block: { id: string },
  text: string,
  attrs: Record<string, unknown> = {},
): TiptapNode => ({
  type,
  attrs: { blockId: block.id, field: "text", ...attrs },
  content: inlineToTiptap(text),
});

export const documentationBlocksToTiptapProse = (
  blocks: DocumentationBlock[],
): TiptapDocument => ({
  type: "doc",
  content: blocks.flatMap((block) => {
    switch (block.kind) {
      case "paragraph":
        return [proseNode("paragraph", block, block.text)];
      case "heading":
        return [
          proseNode("heading", block, block.text, { level: block.level }),
        ];
      case "quote":
        return [
          proseNode("blockquote", block, block.text, {
            attribution: block.attribution,
          }),
        ];
      case "callout":
        return [
          proseNode("callout", block, block.text, {
            tone: block.tone,
            title: block.title,
          }),
        ];
      case "ordered_list":
      case "unordered_list":
        return [
          {
            type: block.kind === "ordered_list" ? "orderedList" : "bulletList",
            attrs: { blockId: block.id },
            content: block.items.map((item) => ({
              type: "listItem",
              attrs: { blockId: block.id, itemId: item.id },
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

const requireProseNode = (node: TiptapNode, source: DocumentationBlock) => {
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
