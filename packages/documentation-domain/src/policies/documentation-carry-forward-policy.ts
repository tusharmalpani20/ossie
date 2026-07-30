import {
  DOCUMENTATION_CARRY_FORWARD_CONTENT_NODES_MAX,
  DOCUMENTATION_CARRY_FORWARD_MAX_SELECTIONS,
  DOCUMENTATION_CARRY_FORWARD_PAGES_MAX,
  DOCUMENTATION_CARRY_FORWARD_PROTECTED_REFERENCES_MAX,
  DOCUMENTATION_CARRY_FORWARD_SAVED_TEXT_MAX_BYTES,
  DOCUMENTATION_CARRY_FORWARD_SNIPPETS_MAX,
} from "@repo/constants";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

type CarryForwardSelectionFacts = {
  site_id: string;
  page_count: number;
  snippet_count: number;
  content_node_count: number;
  protected_reference_count: number;
  saved_text_bytes: number;
};

export function assert_documentation_carry_forward_eligibility(input: {
  source_project_version_id: string;
  target_project_version_id: string;
  selections: CarryForwardSelectionFacts[];
}): void {
  if (
    input.source_project_version_id === input.target_project_version_id ||
    input.selections.length < 1 ||
    input.selections.length > DOCUMENTATION_CARRY_FORWARD_MAX_SELECTIONS
  ) {
    throw new DocumentationDomainError(
      "documentation_carry_forward_invalid",
      "Carry-Forward requires distinct source and target versions and one to ten Sites",
    );
  }

  const totals = input.selections.reduce(
    (current, selection) => ({
      pages: current.pages + selection.page_count,
      snippets: current.snippets + selection.snippet_count,
      content_nodes: current.content_nodes + selection.content_node_count,
      protected_references:
        current.protected_references + selection.protected_reference_count,
      saved_text_bytes:
        current.saved_text_bytes + selection.saved_text_bytes,
    }),
    {
      pages: 0,
      snippets: 0,
      content_nodes: 0,
      protected_references: 0,
      saved_text_bytes: 0,
    },
  );
  if (
    totals.pages > DOCUMENTATION_CARRY_FORWARD_PAGES_MAX ||
    totals.snippets > DOCUMENTATION_CARRY_FORWARD_SNIPPETS_MAX ||
    totals.content_nodes > DOCUMENTATION_CARRY_FORWARD_CONTENT_NODES_MAX ||
    totals.protected_references >
      DOCUMENTATION_CARRY_FORWARD_PROTECTED_REFERENCES_MAX ||
    totals.saved_text_bytes > DOCUMENTATION_CARRY_FORWARD_SAVED_TEXT_MAX_BYTES
  ) {
    throw new DocumentationDomainError(
      "documentation_carry_forward_limit_exceeded",
      "The selected Documentation graph exceeds the Carry-Forward safety ceiling",
    );
  }

  const siteIds = input.selections.map((selection) => selection.site_id);
  if (new Set(siteIds).size !== siteIds.length) {
    throw new DocumentationDomainError(
      "documentation_carry_forward_invalid",
      "Each Documentation Site may be selected only once",
    );
  }
}

export type DocumentationCarryForwardReferenceKind =
  | "page"
  | "navigation"
  | "routing"
  | "snippet"
  | "documentation_asset"
  | "openapi_source"
  | "documentation_file"
  | "capture_asset"
  | "published_artifact"
  | "site_revision"
  | "site_publication"
  | "comment"
  | "import_application";

export function classify_documentation_carry_forward_reference(
  kind: DocumentationCarryForwardReferenceKind,
): "copy_fresh_identity" | "reuse_exact_identity" | "exclude" {
  if (
    kind === "documentation_file" ||
    kind === "capture_asset" ||
    kind === "published_artifact"
  )
    return "reuse_exact_identity";
  if (
    kind === "site_revision" ||
    kind === "site_publication" ||
    kind === "comment" ||
    kind === "import_application"
  )
    return "exclude";
  return "copy_fresh_identity";
}
