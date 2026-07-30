import {
  normalize_documentation_blocks,
  normalize_documentation_path,
  normalize_primary_language,
} from "@repo/documentation-domain";

type PageSafeState = {
  id: string;
  title: string;
  canonical_path: string;
  version: number;
  blocks: unknown[];
};

export class DocumentationRowVersionConflictError extends Error {
  readonly code = "documentation_row_version_conflict";
  readonly latest_page: PageSafeState;

  constructor(latest_page: PageSafeState) {
    super("Documentation Page changed; preserve local work and reconcile");
    this.name = "DocumentationRowVersionConflictError";
    this.latest_page = latest_page;
  }
}

export class DocumentationPublicationPreparationError extends Error {
  readonly code = "documentation_publication_preparation_failed";

  constructor() {
    super("Site Publication preparation failed; the live link was not changed");
    this.name = "DocumentationPublicationPreparationError";
  }
}

export class DocumentationIdempotencyConflictError extends Error {
  readonly code = "documentation_idempotency_conflict";

  constructor() {
    super("Idempotency key was already used for a different request");
    this.name = "DocumentationIdempotencyConflictError";
  }
}

type Repository = {
  create_site: (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    idempotency_key: string;
    name: string;
    description: string | null;
    primary_language: string;
    initial_home_page?: { title: string; path: string };
  }) => Promise<unknown>;
  save_page: (input: Record<string, unknown>) => Promise<unknown>;
  create_revision: (input: Record<string, unknown>) => Promise<unknown>;
  prepare_publication: (input: Record<string, unknown>) => Promise<unknown>;
  switch_publication: (input: Record<string, unknown>) => Promise<unknown>;
  rollback_publication: (input: Record<string, unknown>) => Promise<unknown>;
};

type Scope = {
  organization_id: string;
  project_id: string;
  actor_org_user_id: string;
};

export const build_documentation_service = (repository: Repository) => ({
  async create_site(
    input: Scope & {
      project_version_id: string;
      idempotency_key: string;
      data: {
        name: string;
        description: string | null;
        primary_language: string;
        initial_home_page?: { title: string; path: string };
      };
    },
  ) {
    return repository.create_site({
      organization_id: input.organization_id,
      project_id: input.project_id,
      project_version_id: input.project_version_id,
      actor_org_user_id: input.actor_org_user_id,
      idempotency_key: input.idempotency_key,
      name: input.data.name.trim(),
      description: input.data.description?.trim() || null,
      primary_language: normalize_primary_language(input.data.primary_language),
      ...(input.data.initial_home_page
        ? {
            initial_home_page: {
              title: input.data.initial_home_page.title.trim(),
              path: normalize_documentation_path(
                input.data.initial_home_page.path,
              ),
            },
          }
        : {}),
    });
  },

  async save_page(
    input: Scope & {
      site_id: string;
      page_id: string;
      expected_page_version: number;
      blocks: Parameters<typeof normalize_documentation_blocks>[0];
    },
  ) {
    return repository.save_page({
      ...input,
      blocks: normalize_documentation_blocks(input.blocks),
    });
  },

  async publish(
    input: Scope & {
      site_id: string;
      site_edition_id: string;
      project_version_id: string;
      draft_state_token: string;
      idempotency_key: string;
    },
  ) {
    const revision = await repository.create_revision(input);
    let publication: unknown;
    try {
      publication = await repository.prepare_publication({
        ...input,
        revision,
      });
    } catch {
      throw new DocumentationPublicationPreparationError();
    }
    return repository.switch_publication({
      ...input,
      revision,
      publication,
    });
  },

  rollback_publication: repository.rollback_publication,
});
