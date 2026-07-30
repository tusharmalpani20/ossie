import { createHash } from "node:crypto";
import {
  DOCUMENTATION_ASSETS_PER_REVISION_MAX,
  DOCUMENTATION_READER_NODES_MAX,
  DOCUMENTATION_REVISION_TEXT_MAX_BYTES,
} from "@repo/constants";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

export { DocumentationDomainError };

type RevisionInput = {
  home_page_id: string;
  pages: Array<{ id: string; title: string; path: string; blocks: unknown[] }>;
  navigation_page_ids: string[];
  comments?: unknown[];
};

export const validate_documentation_revision_aggregate = (input: unknown) => {
  const stack = [input];
  const assets = new Set<string>();
  let nodeCount = 0;
  let textBytes = 0;
  while (stack.length) {
    const value = stack.pop();
    if (typeof value === "string") {
      textBytes += new TextEncoder().encode(value).byteLength;
      continue;
    }
    if (!value || typeof value !== "object") continue;
    nodeCount += 1;
    if (Array.isArray(value)) {
      stack.push(...value);
      continue;
    }
    const record = value as Record<string, unknown>;
    if (record.kind === "image") {
      const source =
        record.source && typeof record.source === "object"
          ? (record.source as Record<string, unknown>)
          : record.asset_id
            ? { kind: "documentation_asset", id: record.asset_id }
            : null;
      if (
        source &&
        typeof source.kind === "string" &&
        typeof source.id === "string"
      )
        assets.add(`${source.kind}:${source.id}`);
    }
    stack.push(...Object.values(record));
  }
  if (
    assets.size > DOCUMENTATION_ASSETS_PER_REVISION_MAX ||
    nodeCount > DOCUMENTATION_READER_NODES_MAX ||
    textBytes > DOCUMENTATION_REVISION_TEXT_MAX_BYTES
  )
    throw new DocumentationDomainError(
      "documentation_content_limit_exceeded",
      "Documentation Revision exceeds its accepted aggregate safety ceiling",
    );
  return {
    asset_count: assets.size,
    node_count: nodeCount,
    text_bytes: textBytes,
  };
};

export const validate_site_revision_input = (input: RevisionInput) => {
  const pageIds = new Set(input.pages.map((page) => page.id));
  if (
    !pageIds.has(input.home_page_id) ||
    !input.navigation_page_ids.includes(input.home_page_id) ||
    input.navigation_page_ids.some((id) => !pageIds.has(id))
  ) {
    throw new DocumentationDomainError(
      "documentation_revision_invalid",
      "Revision requires an included Home Page and valid navigation",
    );
  }
  return {
    home_page_id: input.home_page_id,
    pages: input.pages,
    navigation_page_ids: input.navigation_page_ids,
  };
};

export const build_site_revision_digest = (input: RevisionInput) =>
  createHash("sha256")
    .update(JSON.stringify(validate_site_revision_input(input)))
    .digest("hex");
