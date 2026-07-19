import type { ProjectAccessSource, ProjectListPurpose, ProjectRole, ProjectStatus } from "@repo/constants";
import type { ProjectVersionSummary } from "@repo/types/project-version";

export type { ProjectListPurpose, ProjectStatus };

export type ProjectAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type Project = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  color: string | null;
  icon: string | null;
  status: ProjectStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  default_project_version: ProjectVersionSummary;
};
export type AuthorizedProject = Project & { access: { role: ProjectRole; source: ProjectAccessSource } };

export type CreateProjectInput = {
  name: string;
  description?: string | null;
  slug?: string | null;
  color?: string | null;
  icon?: string | null;
  metadata?: unknown;
};

export type ProjectCreationWriter = (input: {
  organization_id: string;
  actor_org_user_id: string;
  actor_label: string;
  request_id: string;
  metadata_was_present: boolean;
  data: CreateProjectInput;
}) => Promise<Project>;

export type UpdateProjectInput = Partial<{
  name: string;
  description: string | null;
  slug: string | null;
  color: string | null;
  icon: string | null;
  metadata: unknown;
  status: ProjectStatus;
}>;

export type ProjectRepository = {
  create_project: (input: {
    organization_id: string;
    actor_org_user_id: string;
    data: CreateProjectInput;
  }) => Promise<Project>;
  list_projects: (input: {
    organization_id: string;
    status: ProjectStatus;
  }) => Promise<Project[]>;
  list_authorized_projects?: (input: {
    organization_id: string;
    actor_org_user_id: string;
    status: ProjectStatus;
    purpose?: ProjectListPurpose;
  }) => Promise<AuthorizedProject[]>;
  find_project: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<Project | null>;
  update_project: (input: {
    organization_id: string;
    project_id: string;
    actor_org_user_id: string;
    data: UpdateProjectInput;
  }) => Promise<Project | null>;
  delete_project: (input: {
    organization_id: string;
    project_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
};

export class ProjectNameConflictError extends Error {
  constructor() {
    super("A project with this name already exists");
  }
}

export class ProjectSlugConflictError extends Error {
  constructor() {
    super("A project with this slug already exists");
  }
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project was not found");
  }
}

export class EmptyProjectUpdateError extends Error {
  constructor() {
    super("At least one project field must be provided");
  }
}

const compact_optional_string = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

const normalize_create_project = (input: CreateProjectInput): CreateProjectInput => ({
  name: input.name.trim(),
  description: compact_optional_string(input.description),
  slug: compact_optional_string(input.slug),
  color: compact_optional_string(input.color),
  icon: compact_optional_string(input.icon),
  metadata: input.metadata,
});

const normalize_update_project = (input: UpdateProjectInput): UpdateProjectInput => {
  const normalized: UpdateProjectInput = {};

  if (input.name !== undefined) {
    normalized.name = input.name.trim();
  }
  if (input.description !== undefined) {
    normalized.description = compact_optional_string(input.description) ?? null;
  }
  if (input.slug !== undefined) {
    normalized.slug = compact_optional_string(input.slug) ?? null;
  }
  if (input.color !== undefined) {
    normalized.color = compact_optional_string(input.color) ?? null;
  }
  if (input.icon !== undefined) {
    normalized.icon = compact_optional_string(input.icon) ?? null;
  }
  if (input.metadata !== undefined) {
    normalized.metadata = input.metadata;
  }
  if (input.status !== undefined) {
    normalized.status = input.status;
  }

  return normalized;
};

export const build_project_service = (
  repository: ProjectRepository,
  options: { create_project?: ProjectCreationWriter } = {},
) => {
  const create_project = async (input: {
    auth: ProjectAuthContext;
    mutation: { actor_label: string; request_id: string };
    data: CreateProjectInput;
  }) => {
    const data = normalize_create_project(input.data);
    if (options.create_project) {
      return options.create_project({
        organization_id: input.auth.organization_id,
        actor_org_user_id: input.auth.actor_org_user_id,
        actor_label: input.mutation.actor_label,
        request_id: input.mutation.request_id,
        metadata_was_present: input.data.metadata !== undefined && input.data.metadata !== null,
        data,
      });
    }
    return repository.create_project({
      organization_id: input.auth.organization_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const list_projects = async (input: {
    auth: ProjectAuthContext;
    status?: ProjectStatus;
    purpose?: ProjectListPurpose;
  }) => repository.list_authorized_projects
    ? repository.list_authorized_projects({
        organization_id: input.auth.organization_id,
        actor_org_user_id: input.auth.actor_org_user_id,
        status: input.status ?? "active",
        purpose: input.purpose,
      })
    : repository.list_projects({
        organization_id: input.auth.organization_id,
        status: input.status ?? "active",
      });

  const get_project = async (input: {
    auth: ProjectAuthContext;
    project_id: string;
  }) => {
    const project = await repository.find_project({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    if (!project) {
      throw new ProjectNotFoundError();
    }

    return project;
  };

  const update_project = async (input: {
    auth: ProjectAuthContext;
    project_id: string;
    data: UpdateProjectInput;
  }) => {
    const data = normalize_update_project(input.data);

    if (Object.keys(data).length === 0) {
      throw new EmptyProjectUpdateError();
    }

    const project = await repository.update_project({
      organization_id: input.auth.organization_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      project_id: input.project_id,
      data,
    });

    if (!project) {
      throw new ProjectNotFoundError();
    }

    return project;
  };

  const delete_project = async (input: {
    auth: ProjectAuthContext;
    project_id: string;
  }) => {
    const deleted = await repository.delete_project({
      organization_id: input.auth.organization_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      project_id: input.project_id,
    });

    if (!deleted) {
      throw new ProjectNotFoundError();
    }
  };

  return {
    create_project,
    list_projects,
    get_project,
    update_project,
    delete_project,
  };
};
