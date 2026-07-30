import type {
  DocumentationPortableBlockV1,
  DocumentationPortablePageV1,
} from "@repo/types";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

export const escape_documentation_markdown_text = (value: string) =>
  value.replace(/[\\`*_[\]()#+.!|>{}-]/gu, "\\$&");

export const create_documentation_heading_destination = (value: string) => {
  const destination = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gu, "")
    .trim()
    .replace(/[\s-]+/gu, "-");
  if (!destination)
    throw new DocumentationDomainError(
      "documentation_markdown_invalid",
      "Heading does not have a portable destination",
    );
  return destination;
};

const fence_for = (code: string) => {
  const longest = Math.max(
    0,
    ...Array.from(code.matchAll(/`+/gu), ([run]) => run.length),
  );
  return "`".repeat(Math.max(3, longest + 1));
};

type MarkdownExportContext = {
  asset_paths?: Readonly<Record<string, string>>;
  page_paths?: Readonly<Record<string, string>>;
  snippet_markdown?: Readonly<Record<string, string>>;
  operation_labels?: Readonly<Record<string, string>>;
  external_binding_labels?: Readonly<Record<string, string>>;
};

const export_block = (
  block: DocumentationPortableBlockV1,
  context: MarkdownExportContext,
) => {
  switch (block.kind) {
    case "paragraph":
      return block.text;
    case "heading":
      return `${"#".repeat(block.level)} ${escape_documentation_markdown_text(block.text)}`;
    case "ordered_list":
      return block.items
        .map((item) => `${item.position}. ${item.text}`)
        .join("\n");
    case "unordered_list":
      return block.items.map((item) => `- ${item.text}`).join("\n");
    case "code": {
      const fence = fence_for(block.code);
      return `${fence}${block.language ?? ""}\n${block.code}\n${fence}`;
    }
    case "link": {
      if (block.url)
        return `[${escape_documentation_markdown_text(block.label)}](${block.url})`;
      const target = context.page_paths?.[block.page_handle!];
      return target
        ? `[${escape_documentation_markdown_text(block.label)}](${target}${block.target_block_handle ? `#${block.target_block_handle}` : ""})`
        : `${escape_documentation_markdown_text(block.label)} (internal Page link omitted)`;
    }
    case "image": {
      const target = context.asset_paths?.[block.asset_handle];
      if (target)
        return `![${escape_documentation_markdown_text(block.alt_text)}](${target}${block.caption ? ` "${escape_documentation_markdown_text(block.caption)}"` : ""})`;
      return `> Image omitted: ${escape_documentation_markdown_text(
        [block.alt_text, block.caption].filter(Boolean).join(" — "),
      )}`;
    }
    case "divider":
      return "---";
    case "api_reference":
      return `> API reference: ${escape_documentation_markdown_text(
        (block.operation_destination_key &&
          context.operation_labels?.[block.operation_destination_key]) ||
          "OpenAPI overview",
      )}`;
    case "quote":
      return `${block.text
        .split(/\r?\n/u)
        .map((line) => `> ${line}`)
        .join(
          "\n",
        )}${block.attribution ? `\n>\n> — ${escape_documentation_markdown_text(block.attribution)}` : ""}`;
    case "table": {
      const lines = block.rows.map((row) =>
        row.cells.map((cell) => cell.text).join(" | "),
      );
      const fence = fence_for(lines.join("\n"));
      return `${block.caption ? `${escape_documentation_markdown_text(block.caption)}\n\n` : ""}${fence}text\n${lines.join("\n")}\n${fence}`;
    }
    case "code_example": {
      const fence = fence_for(block.code);
      return `${block.title ? `${escape_documentation_markdown_text(block.title)}\n\n` : ""}${fence}${block.language ?? ""}\n${block.code}\n${fence}`;
    }
    case "callout":
      return [
        `> ${escape_documentation_markdown_text(
          [block.tone.toUpperCase(), block.title].filter(Boolean).join(": "),
        )}`,
        ...block.text.split(/\r?\n/u).map((line) => `> ${line}`),
      ].join("\n");
    case "tabs":
      return block.items
        .map(
          (item) =>
            `### ${escape_documentation_markdown_text(item.label)}\n\n${item.body}`,
        )
        .join("\n\n");
    case "snippet_reference":
      return `> Expanded snippet\n\n${
        context.snippet_markdown?.[block.snippet_handle] ??
        "Snippet content unavailable"
      }`;
    case "guide_publication":
    case "interactive_demo_publication":
      return `> ${block.kind === "guide_publication" ? "Guide" : "Interactive Demo"}: ${escape_documentation_markdown_text(
        context.external_binding_labels?.[block.external_binding_handle] ??
          "Publication",
      )}`;
  }
};

export const export_documentation_page_markdown = (
  page: Pick<DocumentationPortablePageV1, "title" | "blocks">,
  context: MarkdownExportContext = {},
) => {
  const sections = [
    `# ${escape_documentation_markdown_text(page.title)}`,
    ...[...page.blocks]
      .sort((left, right) => left.position - right.position)
      .map((block) => export_block(block, context)),
  ];
  return `${sections.join("\n\n")}\n`;
};
