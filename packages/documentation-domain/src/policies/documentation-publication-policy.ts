import { DocumentationDomainError } from "../errors/documentation-domain-error";

export { DocumentationDomainError };

export const publication_cache_key = (input: {
  publish_link_id: string;
  link_version: number;
  entry_id: string;
  entry_version: number;
  site_publication_id: string;
  preparation_version: number;
}) =>
  [
    input.publish_link_id,
    input.link_version,
    input.entry_id,
    input.entry_version,
    input.site_publication_id,
    input.preparation_version,
  ].join(":");

export const assert_documentation_rollback_target = (
  current: { edition_id: string; publication_sequence: number },
  target: { edition_id: string; publication_sequence: number },
) => {
  if (
    current.edition_id !== target.edition_id ||
    target.publication_sequence >= current.publication_sequence
  ) {
    throw new DocumentationDomainError(
      "documentation_rollback_invalid",
      "Rollback target must be an older Publication from the same Site Edition",
    );
  }
};
