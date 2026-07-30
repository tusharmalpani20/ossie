import type { ProjectCapability } from "../project-membership/project-access.policy";

type Scope = {
  organization_id: string;
  project_id: string;
  project_version_id: string;
  actor_org_user_id: string;
  site_id?: string;
};

type Repository = {
  get_policy(input: Scope): Promise<unknown>;
  update_policy(input: Scope & Record<string, unknown>): Promise<unknown>;
  list_candidates(input: Scope & Record<string, unknown>): Promise<unknown>;
  create_request(input: Scope & Record<string, unknown>): Promise<unknown>;
  list_requests(input: Scope & Record<string, unknown>): Promise<unknown>;
  get_request(input: Scope & Record<string, unknown>): Promise<unknown>;
  decide(input: Scope & Record<string, unknown>): Promise<unknown>;
  cancel(input: Scope & Record<string, unknown>): Promise<unknown>;
  preview_gate(input: Scope & Record<string, unknown>): Promise<unknown>;
  list_inbox(input: Scope & Record<string, unknown>): Promise<unknown>;
  mark_read(input: Scope & Record<string, unknown>): Promise<unknown>;
  list_evidence(input: Scope & Record<string, unknown>): Promise<unknown>;
  get_evidence(input: Scope & Record<string, unknown>): Promise<unknown>;
};

type Access = {
  authorize(input: {
    auth: { organization_id: string; actor_org_user_id: string };
    project_id: string;
    capability: ProjectCapability;
  }): Promise<unknown>;
};

const authorize = (
  access: Access,
  input: Scope,
  capability: ProjectCapability,
) =>
  access.authorize({
    auth: {
      organization_id: input.organization_id,
      actor_org_user_id: input.actor_org_user_id,
    },
    project_id: input.project_id,
    capability,
  });

export const build_documentation_review_service = (
  repository: Repository,
  access: Access,
) => ({
  async get_policy(input: Scope) {
    await authorize(access, input, "documentation.read");
    return repository.get_policy(input);
  },
  async update_policy(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.review.manage");
    return repository.update_policy(input);
  },
  async list_candidates(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.review.request");
    return repository.list_candidates(input);
  },
  async create_request(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.review.request");
    return repository.create_request(input);
  },
  async list_requests(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.read");
    return repository.list_requests(input);
  },
  async get_request(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.read");
    return repository.get_request(input);
  },
  async decide(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.review.decide");
    return repository.decide(input);
  },
  async cancel(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.review.request");
    return repository.cancel(input);
  },
  async preview_gate(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.read");
    return repository.preview_gate(input);
  },
  async list_inbox(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.review.inbox");
    return repository.list_inbox(input);
  },
  async mark_read(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.review.inbox");
    return repository.mark_read(input);
  },
  async list_evidence(input: Scope & Record<string, unknown>) {
    await authorize(access, input, "documentation.read");
    return repository.list_evidence(input);
  },
  async get_evidence(input: Scope & Record<string, unknown>) {
    await authorize(
      access,
      input,
      "documentation.review.evidence.read_sensitive",
    );
    return repository.get_evidence(input);
  },
  async authorize_publication(input: Scope, hasOverride: boolean) {
    await authorize(access, input, "publication.create");
    if (hasOverride)
      await authorize(access, input, "documentation.review.override");
  },
});
