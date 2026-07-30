import path from "node:path";
import {
  DOCUMENTATION_MARKDOWN_AST_NODES_MAX,
  DOCUMENTATION_MARKDOWN_UPLOAD_MAX_BYTES,
} from "@repo/constants";
import type { DocumentationPortableBlockV1 } from "@repo/types";
import { fromMarkdown } from "mdast-util-from-markdown";
import type {
  BlockContent,
  DefinitionContent,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
} from "mdast";

export class DocumentationMarkdownError extends Error {
  readonly code = "documentation_import_invalid";

  constructor(message: string) {
    super(message);
    this.name = "DocumentationMarkdownError";
  }
}

type MarkdownInspectionOptions = {
  filename_stem: string;
  package_path?: string;
  asset_handle_by_path?: Readonly<Record<string, string>>;
  page_handle_by_path?: Readonly<Record<string, string>>;
};

const count_nodes = (node: { children?: unknown[] }): number => {
  let total = 1;
  for (const child of node.children ?? [])
    total += count_nodes(
      child && typeof child === "object"
        ? (child as { children?: unknown[] })
        : {},
    );
  return total;
};

const inline_text = (nodes: PhrasingContent[]): string =>
  nodes
    .map((node) => {
      switch (node.type) {
        case "text":
          return node.value;
        case "strong":
          return `**${inline_text(node.children)}**`;
        case "emphasis":
          return `*${inline_text(node.children)}*`;
        case "inlineCode":
          if (node.value.includes("`"))
            throw new DocumentationMarkdownError(
              "Inline code containing backticks is unsupported",
            );
          return `\`${node.value}\``;
        case "break":
          return "\n";
        default:
          throw new DocumentationMarkdownError(
            "Markdown inline content is unsupported",
          );
      }
    })
    .join("");

const safe_external_url = (value: string) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new DocumentationMarkdownError("Markdown link is invalid");
  }
  if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol))
    throw new DocumentationMarkdownError("Markdown link protocol is unsafe");
  return url.toString();
};

const resolve_package_path = (source: string, target: string) => {
  if (
    !source ||
    target.startsWith("/") ||
    target.includes("\\") ||
    /^[a-z][a-z0-9+.-]*:/iu.test(target)
  )
    throw new DocumentationMarkdownError("Package media path is unsafe");
  const resolved = path.posix.normalize(
    path.posix.join(path.posix.dirname(source), target),
  );
  if (resolved.startsWith("../") || resolved === "..")
    throw new DocumentationMarkdownError("Package media path is unsafe");
  return resolved;
};

const sole_inline_block = (
  paragraph: Paragraph,
  options: MarkdownInspectionOptions,
  handle: string,
  position: number,
): DocumentationPortableBlockV1 => {
  const only = paragraph.children[0];
  if (only?.type === "link") {
    const label = inline_text(only.children);
    if (options.package_path && !/^[a-z][a-z0-9+.-]*:/iu.test(only.url)) {
      const [target, fragment] = only.url.split("#", 2);
      const packagePath = resolve_package_path(options.package_path, target!);
      const pageHandle = options.page_handle_by_path?.[packagePath];
      if (!pageHandle)
        throw new DocumentationMarkdownError(
          "Markdown Page link is unresolved",
        );
      return {
        handle,
        kind: "link",
        position,
        label,
        page_handle: pageHandle,
        target_block_handle: fragment || null,
      };
    }
    return {
      handle,
      kind: "link",
      position,
      label,
      url: safe_external_url(only.url),
      target_block_handle: null,
    };
  }
  if (only?.type === "image") {
    if (!options.package_path)
      throw new DocumentationMarkdownError(
        "A standalone Markdown image is unsupported",
      );
    const packagePath = resolve_package_path(options.package_path, only.url);
    const assetHandle = options.asset_handle_by_path?.[packagePath];
    if (!assetHandle)
      throw new DocumentationMarkdownError(
        "Markdown image is not a declared package Asset",
      );
    if (!only.alt?.trim())
      throw new DocumentationMarkdownError(
        "Markdown image alternative text is required",
      );
    return {
      handle,
      kind: "image",
      position,
      asset_handle: assetHandle,
      alt_text: only.alt.trim(),
      caption: only.title?.trim() || null,
    };
  }
  if (paragraph.children.some((node) => ["link", "image"].includes(node.type)))
    throw new DocumentationMarkdownError(
      "A Markdown link or image must be the paragraph's only content",
    );
  return {
    handle,
    kind: "paragraph",
    position,
    text: inline_text(paragraph.children),
  };
};

const list_item_text = (item: ListItem) => {
  if (
    item.children.length !== 1 ||
    item.children[0]?.type !== "paragraph" ||
    item.children[0].children.some((node) =>
      ["link", "image"].includes(node.type),
    )
  )
    throw new DocumentationMarkdownError(
      "Nested or loose Markdown list items are unsupported",
    );
  return inline_text(item.children[0].children);
};

const quote_text = (children: Array<BlockContent | DefinitionContent>) => {
  if (
    children.length !== 1 ||
    children[0]?.type !== "paragraph" ||
    children[0].children.some((node) => ["link", "image"].includes(node.type))
  )
    throw new DocumentationMarkdownError(
      "Nested Markdown block quotes are unsupported",
    );
  return inline_text(children[0].children);
};

const canonical_path_from_stem = (value: string) => {
  const canonical = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gu, "")
    .trim()
    .replace(/[\s-]+/gu, "-");
  if (!canonical)
    throw new DocumentationMarkdownError(
      "Markdown filename cannot produce a canonical path",
    );
  return canonical;
};

export const inspect_documentation_markdown = (
  bytes: Buffer,
  options: MarkdownInspectionOptions,
) => {
  if (bytes.byteLength > DOCUMENTATION_MARKDOWN_UPLOAD_MAX_BYTES)
    throw new DocumentationMarkdownError("Markdown upload exceeds 4 MiB");
  let markdown: string;
  try {
    markdown = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new DocumentationMarkdownError("Markdown must be valid UTF-8");
  }
  if (
    markdown.includes("\0") ||
    /[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/u.test(
      markdown,
    )
  )
    throw new DocumentationMarkdownError(
      "Markdown contains unsafe control characters",
    );

  let tree: Root;
  try {
    tree = fromMarkdown(markdown);
  } catch {
    throw new DocumentationMarkdownError("Markdown syntax is invalid");
  }
  if (count_nodes(tree) > DOCUMENTATION_MARKDOWN_AST_NODES_MAX)
    throw new DocumentationMarkdownError("Markdown AST exceeds safe limits");

  let title: string | null = null;
  const blocks: DocumentationPortableBlockV1[] = [];
  for (const [index, node] of tree.children.entries()) {
    if (node.type === "heading" && node.depth === 1) {
      if (index !== 0 || title !== null)
        throw new DocumentationMarkdownError(
          "Markdown H1 is allowed only as the first title",
        );
      title = inline_text(node.children).trim();
      continue;
    }
    const position = blocks.length + 1;
    const handle = `block-${String(position).padStart(4, "0")}`;
    switch (node.type) {
      case "paragraph":
        blocks.push(sole_inline_block(node, options, handle, position));
        break;
      case "heading":
        if (node.depth < 2 || node.depth > 4)
          throw new DocumentationMarkdownError(
            "Only Markdown H2 through H4 are supported",
          );
        blocks.push({
          handle,
          kind: "heading",
          position,
          level: node.depth as 2 | 3 | 4,
          text: inline_text(node.children),
        });
        break;
      case "list":
        if (node.ordered && node.start !== null && node.start !== 1)
          throw new DocumentationMarkdownError(
            "Ordered Markdown lists must start at one",
          );
        blocks.push({
          handle,
          kind: node.ordered ? "ordered_list" : "unordered_list",
          position,
          items: node.children.map((item, itemIndex) => ({
            handle: `${handle}-item-${String(itemIndex + 1).padStart(4, "0")}`,
            position: itemIndex + 1,
            text: list_item_text(item),
          })),
        });
        break;
      case "code":
        if (node.meta || (node.lang && !/^[a-z0-9][a-z0-9+_.-]{0,39}$/iu.test(node.lang)))
          throw new DocumentationMarkdownError(
            "Markdown code fence metadata is unsupported",
          );
        blocks.push({
          handle,
          kind: "code",
          position,
          code: node.value,
          language: node.lang ?? null,
        });
        break;
      case "blockquote":
        blocks.push({
          handle,
          kind: "quote",
          position,
          text: quote_text(node.children),
          attribution: null,
        });
        break;
      case "thematicBreak":
        blocks.push({ handle, kind: "divider", position });
        break;
      default:
        throw new DocumentationMarkdownError(
          `Markdown ${node.type} content is unsupported`,
        );
    }
  }
  const proposedTitle = title || options.filename_stem.trim();
  if (!proposedTitle)
    throw new DocumentationMarkdownError("Markdown title is required");
  return {
    title: proposedTitle,
    canonical_path: canonical_path_from_stem(options.filename_stem),
    blocks,
  };
};
