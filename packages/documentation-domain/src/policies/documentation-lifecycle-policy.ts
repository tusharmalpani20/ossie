import { DocumentationDomainError } from "../errors/documentation-domain-error";

export type DocumentationLifecycleStatus = "active" | "archived";
export type DocumentationLifecycleTransition = "archive" | "restore";

export function assert_documentation_lifecycle_transition(
  current: DocumentationLifecycleStatus,
  transition: DocumentationLifecycleTransition,
): void {
  if (
    (current === "active" && transition !== "archive") ||
    (current === "archived" && transition !== "restore")
  ) {
    throw new DocumentationDomainError(
      "documentation_lifecycle_invalid",
      "The requested Documentation lifecycle transition is not valid",
    );
  }
}

export function derive_documentation_effective_status(input: {
  stored_status: DocumentationLifecycleStatus;
  project_active: boolean;
  project_version_active: boolean;
  edition_active: boolean;
}): {
  effective_status: "active" | "read_only" | "archived";
  read_only_reason: string | null;
} {
  if (input.stored_status === "archived")
    return {
      effective_status: "archived",
      read_only_reason: "This resource is archived.",
    };
  if (!input.project_active)
    return {
      effective_status: "read_only",
      read_only_reason: "This Project is archived.",
    };
  if (!input.project_version_active)
    return {
      effective_status: "read_only",
      read_only_reason: "This Project Version is archived.",
    };
  if (!input.edition_active)
    return {
      effective_status: "read_only",
      read_only_reason: "This Documentation Site Edition is archived.",
    };
  return { effective_status: "active", read_only_reason: null };
}

type PageRetirement =
  | { mode: "none" }
  | { mode: "gone" }
  | { mode: "redirect"; target_page_id: string };

export function assert_documentation_page_retirement(input: {
  page_id: string;
  was_published: boolean;
  is_home_page: boolean;
  retirement: PageRetirement;
  replacement_home_page_id: string | null;
  active_page_ids: ReadonlySet<string>;
}): void {
  if (input.was_published && input.retirement.mode === "none") {
    throw new DocumentationDomainError(
      "documentation_lifecycle_invalid",
      "A previously published Page needs a redirect or gone outcome",
    );
  }
  if (!input.was_published && input.retirement.mode !== "none") {
    throw new DocumentationDomainError(
      "documentation_lifecycle_invalid",
      "An unpublished Page does not need a public retirement outcome",
    );
  }
  if (input.retirement.mode === "redirect") {
    if (
      input.retirement.target_page_id === input.page_id ||
      !input.active_page_ids.has(input.retirement.target_page_id)
    ) {
      throw new DocumentationDomainError(
        "documentation_lifecycle_invalid",
        "The redirect target must be a different active Page",
      );
    }
  }
  if (
    input.is_home_page &&
    (input.replacement_home_page_id === null ||
      input.replacement_home_page_id === input.page_id ||
      !input.active_page_ids.has(input.replacement_home_page_id))
  ) {
    throw new DocumentationDomainError(
      "documentation_lifecycle_invalid",
      "Archiving the Home Page requires a different active replacement",
    );
  }
}
