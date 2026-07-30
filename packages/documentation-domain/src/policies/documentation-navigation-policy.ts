import { DocumentationDomainError } from "../errors/documentation-domain-error";
import type { DocumentationNavigationNode } from "../types/documentation-domain";
import { DOCUMENTATION_NAVIGATION_DEPTH_MAX } from "@repo/constants";

export { DocumentationDomainError };

export const validate_documentation_navigation = (
  nodes: DocumentationNavigationNode[],
) => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (byId.size !== nodes.length) {
    throw new DocumentationDomainError(
      "documentation_navigation_invalid",
      "Navigation node IDs must be unique",
    );
  }
  const pages = new Set<string>();
  for (const node of nodes) {
    if (node.parent_id && !byId.has(node.parent_id)) {
      throw new DocumentationDomainError(
        "documentation_navigation_invalid",
        "Navigation parent must belong to the same tree",
      );
    }
    if (node.kind === "page") {
      if (!node.page_id || pages.has(node.page_id)) {
        throw new DocumentationDomainError(
          "documentation_navigation_invalid",
          "A Page may appear at most once",
        );
      }
      pages.add(node.page_id);
    } else if (node.page_id) {
      throw new DocumentationDomainError(
        "documentation_navigation_invalid",
        "A group cannot reference a Page",
      );
    }
    const visited = new Set([node.id]);
    let parentId = node.parent_id;
    let depth = 1;
    while (parentId) {
      if (visited.has(parentId)) {
        throw new DocumentationDomainError(
          "documentation_navigation_invalid",
          "Navigation must be acyclic",
        );
      }
      visited.add(parentId);
      depth += 1;
      if (depth > DOCUMENTATION_NAVIGATION_DEPTH_MAX) {
        throw new DocumentationDomainError(
          "documentation_navigation_invalid",
          `Navigation cannot exceed ${DOCUMENTATION_NAVIGATION_DEPTH_MAX} levels`,
        );
      }
      parentId = byId.get(parentId)?.parent_id ?? null;
    }
  }
};
