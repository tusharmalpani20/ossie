import { DocumentationDomainError } from "../errors/documentation-domain-error";
import type { DocumentationBlockInput } from "../types/documentation-domain";
import { normalize_documentation_blocks } from "./documentation-content-policy";

export { DocumentationDomainError };

export const normalize_documentation_snippet_name = (value: string) => {
  const name = value.trim();
  if (!name || [...name].length > 200)
    throw new DocumentationDomainError(
      "documentation_snippet_name_invalid",
      "Snippet name must contain between 1 and 200 characters",
    );
  return name;
};

export const validate_documentation_snippet_blocks = (
  blocks: DocumentationBlockInput[],
) => {
  if (blocks.some((block) => block.kind === "snippet_reference"))
    throw new DocumentationDomainError(
      "documentation_snippet_nested",
      "Snippets cannot reference other Snippets",
    );
  return normalize_documentation_blocks(blocks);
};
