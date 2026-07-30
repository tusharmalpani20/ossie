import { DocumentationDomainError } from "../errors/documentation-domain-error";
import type { DocumentationBlockInput } from "../types/documentation-domain";

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
  if (!["https:", "http:", "mailto:"].includes(parsed.protocol)) {
    throw new DocumentationDomainError(
      "documentation_content_unsafe",
      "Link protocol is not allowed",
    );
  }
  return parsed.toString();
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
        return { id, kind: block.kind, text: compact(block.text, "Text"), position };
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
          text: compact(block.text, "Heading"),
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
            text: compact(item.text, "List item"),
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
          ...(hasUrl ? { url: normalize_url(block.url!) } : { page_id: compact(block.page_id!, "Page ID") }),
          position,
        };
      }
      case "image":
        return {
          id,
          kind: block.kind,
          asset_id: compact(block.asset_id, "Asset ID"),
          alt_text: compact(block.alt_text, "Alternative text"),
          caption: block.caption?.trim() || null,
          position,
        };
      case "divider":
        return { id, kind: block.kind, position };
      case "api_reference":
        return {
          id,
          kind: block.kind,
          openapi_source_id: compact(block.openapi_source_id, "OpenAPI Source ID"),
          operation_key: block.operation_key?.trim() || null,
          position,
        };
    }
  });
};
