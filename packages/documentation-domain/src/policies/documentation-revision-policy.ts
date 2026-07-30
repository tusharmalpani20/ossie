import { createHash } from "node:crypto";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

export { DocumentationDomainError };

type RevisionInput = {
  home_page_id: string;
  pages: Array<{ id: string; title: string; path: string; blocks: unknown[] }>;
  navigation_page_ids: string[];
  comments?: unknown[];
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
