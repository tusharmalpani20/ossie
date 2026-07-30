import { DocumentationDomainError } from "../errors/documentation-domain-error";
import type { DocumentationBlockInput } from "../types/documentation-domain";
import {
  DOCUMENTATION_CONTROLLED_MARKDOWN_SCALAR_MAX_BYTES,
  DOCUMENTATION_SHORT_LABEL_MAX,
  DOCUMENTATION_TABLE_CAPTION_MAX,
  DOCUMENTATION_TABLE_CELLS_MAX,
  DOCUMENTATION_TABLE_COLUMNS_MAX,
  DOCUMENTATION_TABLE_ROWS_MAX,
  DOCUMENTATION_TAB_LABEL_MAX,
  DOCUMENTATION_TABS_MAX,
} from "@repo/constants";

export { DocumentationDomainError };

const compact = (value: string, field: string) => {
  const result = value.trim();
  if (!result) {
    throw new DocumentationDomainError(
      "documentation_content_unsafe",
      `${field} must not be empty`,
    );
  }
  return result;
};

const normalize_url = (value: string) => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new DocumentationDomainError(
      "documentation_content_unsafe",
      "Link URL is invalid",
    );
  }
  if (!["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol)) {
    throw new DocumentationDomainError(
      "documentation_content_unsafe",
      "Link protocol is not allowed",
    );
  }
  return parsed.toString();
};

export type DocumentationInlineNode = {
  kind: "text" | "strong" | "emphasis" | "code" | "break";
  text: string;
};

const validate_controlled_markdown_scalar = (value: string, field: string) => {
  if (
    new TextEncoder().encode(value).byteLength >
    DOCUMENTATION_CONTROLLED_MARKDOWN_SCALAR_MAX_BYTES
  )
    throw new DocumentationDomainError(
      "documentation_content_limit_exceeded",
      `${field} exceeds its accepted safety ceiling`,
    );
  if (
    /<\/?[a-z][^>]*>|!\[[^\]]*\]\(|\[[^\]]+\]\(|(^|\n)\s{0,3}#{1,6}\s|(^|\n)\s*(?:import|export)\s/iu.test(
      value,
    )
  )
    throw new DocumentationDomainError(
      "documentation_content_unsafe",
      `${field} contains unsupported markup`,
    );
  return value;
};

export const parse_documentation_controlled_markdown = (
  value: string,
): DocumentationInlineNode[] => {
  validate_controlled_markdown_scalar(value, "Text");
  const nodes: DocumentationInlineNode[] = [];
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

const controlled = (value: string, field: string, allowEmpty = false) => {
  const normalized = value.trim();
  if (!allowEmpty && !normalized)
    throw new DocumentationDomainError(
      "documentation_content_unsafe",
      `${field} must not be empty`,
    );
  validate_controlled_markdown_scalar(normalized, field);
  return normalized;
};

const short_optional = (
  value: string | null | undefined,
  field: string,
  limit = DOCUMENTATION_SHORT_LABEL_MAX,
) => {
  const normalized = value?.trim() || null;
  if (normalized && [...normalized].length > limit)
    throw new DocumentationDomainError(
      "documentation_content_limit_exceeded",
      `${field} exceeds its accepted safety ceiling`,
    );
  return normalized;
};

export const normalize_documentation_blocks = (
  blocks: DocumentationBlockInput[],
) => {
  const ids = new Set<string>();
  return blocks.map((block, index) => {
    const id = compact(block.id, "Block ID");
    if (ids.has(id)) {
      throw new DocumentationDomainError(
        "documentation_content_unsafe",
        "Block IDs must be unique",
      );
    }
    ids.add(id);
    const position = index + 1;

    switch (block.kind) {
      case "paragraph":
        return {
          id,
          kind: block.kind,
          text: controlled(block.text, "Text"),
          position,
        };
      case "heading":
        if (![2, 3, 4].includes(block.level)) {
          throw new DocumentationDomainError(
            "documentation_content_unsafe",
            "Heading level must be between 2 and 4",
          );
        }
        return {
          id,
          kind: block.kind,
          level: block.level,
          text: controlled(block.text, "Heading"),
          position,
        };
      case "ordered_list":
      case "unordered_list":
        if (block.items.length === 0 || block.items.length > 500) {
          throw new DocumentationDomainError(
            "documentation_content_unsafe",
            "List item count is invalid",
          );
        }
        return {
          id,
          kind: block.kind,
          items: block.items.map((item, itemIndex) => ({
            id: compact(item.id, "List item ID"),
            text: controlled(item.text, "List item"),
            position: itemIndex + 1,
          })),
          position,
        };
      case "code":
        return {
          id,
          kind: block.kind,
          code: block.code,
          language: block.language?.trim() || null,
          position,
        };
      case "link": {
        const hasUrl = typeof block.url === "string";
        const hasPage = typeof block.page_id === "string";
        if (hasUrl === hasPage) {
          throw new DocumentationDomainError(
            "documentation_content_unsafe",
            "Link must target exactly one URL or Page",
          );
        }
        return {
          id,
          kind: block.kind,
          label: compact(block.label, "Link label"),
          ...(hasUrl
            ? { url: normalize_url(block.url!) }
            : { page_id: compact(block.page_id!, "Page ID") }),
          ...(!hasUrl && block.target_block_id
            ? {
                target_block_id: compact(
                  block.target_block_id,
                  "Target block ID",
                ),
              }
            : {}),
          position,
        };
      }
      case "image": {
        const source =
          block.source ??
          (block.asset_id
            ? { kind: "documentation_asset" as const, id: block.asset_id }
            : null);
        if (
          !source ||
          !["documentation_asset", "capture_asset"].includes(source.kind)
        )
          throw new DocumentationDomainError(
            "documentation_asset_source_unsupported",
            "Asset source is not implemented",
          );
        return {
          id,
          kind: block.kind,
          source: {
            kind: source.kind,
            id: compact(source.id, "Asset ID"),
          },
          alt_text: compact(block.alt_text, "Alternative text"),
          caption: block.caption?.trim() || null,
          position,
        };
      }
      case "divider":
        return { id, kind: block.kind, position };
      case "api_reference":
        return {
          id,
          kind: block.kind,
          openapi_source_id: compact(
            block.openapi_source_id,
            "OpenAPI Source ID",
          ),
          operation_key: block.operation_key?.trim() || null,
          position,
        };
      case "quote":
        return {
          id,
          kind: block.kind,
          text: controlled(block.text, "Quote"),
          attribution: short_optional(block.attribution, "Attribution"),
          position,
        };
      case "table": {
        if (
          block.rows.length === 0 ||
          block.rows.length > DOCUMENTATION_TABLE_ROWS_MAX
        )
          throw new DocumentationDomainError(
            "documentation_table_invalid",
            "Table row count is invalid",
          );
        const columns = block.rows[0]?.cells.length ?? 0;
        if (
          columns === 0 ||
          columns > DOCUMENTATION_TABLE_COLUMNS_MAX ||
          block.rows.some((row) => row.cells.length !== columns) ||
          block.rows.length * columns > DOCUMENTATION_TABLE_CELLS_MAX
        )
          throw new DocumentationDomainError(
            "documentation_table_invalid",
            "Table must be rectangular and bounded",
          );
        const childIds = new Set<string>();
        return {
          id,
          kind: block.kind,
          caption: short_optional(
            block.caption,
            "Table caption",
            DOCUMENTATION_TABLE_CAPTION_MAX,
          ),
          rows: block.rows.map((row, rowIndex) => ({
            id: compact(row.id, "Table row ID"),
            position: rowIndex + 1,
            cells: row.cells.map((cell, columnIndex) => {
              const cellId = compact(cell.id, "Table cell ID");
              if (childIds.has(cellId))
                throw new DocumentationDomainError(
                  "documentation_table_invalid",
                  "Table child IDs must be unique",
                );
              childIds.add(cellId);
              if (cell.is_header && rowIndex !== 0)
                throw new DocumentationDomainError(
                  "documentation_table_invalid",
                  "Header cells are permitted only in the first row",
                );
              return {
                id: cellId,
                column_position: columnIndex + 1,
                is_header: cell.is_header,
                text: controlled(cell.text, "Table cell", true),
              };
            }),
          })),
          position,
        };
      }
      case "code_example":
        return {
          id,
          kind: block.kind,
          code: block.code,
          language: block.language?.trim().toLowerCase() || null,
          title: short_optional(block.title, "Code example title"),
          position,
        };
      case "callout":
        return {
          id,
          kind: block.kind,
          tone: block.tone,
          title: short_optional(block.title, "Callout title"),
          text: controlled(block.text, "Callout"),
          position,
        };
      case "tabs": {
        if (
          block.items.length < 2 ||
          block.items.length > DOCUMENTATION_TABS_MAX
        )
          throw new DocumentationDomainError(
            "documentation_tabs_invalid",
            "Tabs item count is invalid",
          );
        const labels = new Set<string>();
        return {
          id,
          kind: block.kind,
          items: block.items.map((item, itemIndex) => {
            const label = compact(item.label, "Tab label");
            if ([...label].length > DOCUMENTATION_TAB_LABEL_MAX)
              throw new DocumentationDomainError(
                "documentation_tabs_invalid",
                "Tab label exceeds its accepted safety ceiling",
              );
            const normalizedLabel = label.toLocaleLowerCase();
            if (labels.has(normalizedLabel))
              throw new DocumentationDomainError(
                "documentation_tabs_invalid",
                "Tab labels must be unique",
              );
            labels.add(normalizedLabel);
            return {
              id: compact(item.id, "Tab item ID"),
              label,
              body: controlled(item.body, "Tab body", true),
              position: itemIndex + 1,
            };
          }),
          position,
        };
      }
      case "snippet_reference":
        return {
          id,
          kind: block.kind,
          snippet_id: compact(block.snippet_id, "Snippet ID"),
          position,
        };
      case "guide_publication":
      case "interactive_demo_publication":
        return {
          id,
          kind: block.kind,
          published_artifact_id: compact(
            block.published_artifact_id,
            "Published Artifact ID",
          ),
          position,
        };
    }
  });
};
