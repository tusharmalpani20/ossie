import type {
  CreateProjectVersionRequest,
  ProjectVersionDetail,
  ProjectVersionListQuery,
  ProjectVersionResolutionResponse,
  ReorderProjectVersionsRequest,
  SetDefaultProjectVersionRequest,
  UpdateProjectVersionRequest,
} from "@repo/types/project-version";
import { set_access_resolved_resource } from "../access/access-request-context";
import type { build_project_access_service } from "../project-membership/project-membership.service";

export class ProjectVersionNotFoundError extends Error { constructor() { super("Project Version was not found"); } }
export class ProjectVersionSlugRequiredError extends Error { constructor() { super("A canonical Project Version slug could not be derived"); } }
export class ProjectVersionUnchangedError extends Error { constructor() { super("Change at least one Project Version field"); } }
export class ProjectVersionArchivedError extends Error { constructor() { super("Archived Project Versions are read-only"); } }
export class DefaultProjectVersionArchiveError extends Error { constructor() { super("The Default Project Version cannot be archived"); } }
export class ProjectVersionConflictError extends Error { constructor() { super("Project Version changed; reload and retry"); } }
export class ProjectVersionSlugConflictError extends Error { constructor() { super("That Project Version slug is already reserved"); } }
export class InvalidProjectVersionOrderError extends Error { constructor() { super("Project Version order must contain every active Project Version exactly once"); } }
export class LegacyContentBlocksDefaultChangeError extends Error { constructor() { super("Move legacy Project content before changing the Default Project Version"); } }

type Auth = { organization_id: string; actor_org_user_id: string };
type CreateData = Required<Pick<CreateProjectVersionRequest, "name" | "description" | "slug" | "release_date">>;

export type ProjectVersionRepository = {
  list_versions(input: { organization_id: string; project_id: string; status?: ProjectVersionListQuery["status"] }): Promise<ProjectVersionDetail[]>;
  find_version(input: { organization_id: string; project_id: string; project_version_id: string }): Promise<ProjectVersionDetail | null>;
  resolve_version(input: { organization_id: string; project_id: string; slug: string }): Promise<ProjectVersionResolutionResponse | null>;
  create_version(input: { organization_id: string; project_id: string; actor_org_user_id: string; data: CreateData }): Promise<ProjectVersionDetail | null>;
  update_version(input: { organization_id: string; project_id: string; project_version_id: string; actor_org_user_id: string; data: UpdateProjectVersionRequest }): Promise<ProjectVersionDetail | null>;
  reorder_versions(input: { organization_id: string; project_id: string; actor_org_user_id: string; data: ReorderProjectVersionsRequest }): Promise<ProjectVersionDetail[] | null>;
  archive_version(input: { organization_id: string; project_id: string; project_version_id: string; actor_org_user_id: string; expected_version: number }): Promise<ProjectVersionDetail | null>;
  restore_version(input: { organization_id: string; project_id: string; project_version_id: string; actor_org_user_id: string; expected_version: number }): Promise<ProjectVersionDetail | null>;
  set_default_version(input: { organization_id: string; project_id: string; project_version_id: string; actor_org_user_id: string; data: SetDefaultProjectVersionRequest }): Promise<unknown | null>;
};

const canonical_slug = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .replace(/-{2,}/g, "");

export const build_project_version_service = (input: {
  access: Pick<ReturnType<typeof build_project_access_service>, "authorize">;
  repository: ProjectVersionRepository;
}) => {
  const authorize = (auth: Auth, project_id: string, capability: "project.read" | "project_version.manage") =>
    input.access.authorize({ auth, project_id, capability });
  const resolve_existing = async (args: { auth: Auth; project_id: string; project_version_id: string }) => {
    const found = await input.repository.find_version({
      organization_id: args.auth.organization_id,
      project_id: args.project_id,
      project_version_id: args.project_version_id,
    });
    if (!found) throw new ProjectVersionNotFoundError();
    set_access_resolved_resource({
      organization_id: found.organization_id,
      project_id: found.project_id,
      root_resource_type: "project_version",
      root_resource_id: found.id,
    });
    return found;
  };
  const authorize_manage = (auth: Auth, project_id: string) => authorize(auth, project_id, "project_version.manage");

  return {
    async list(args: { auth: Auth; project_id: string; query?: ProjectVersionListQuery }) {
      await authorize(args.auth, args.project_id, "project.read");
      return input.repository.list_versions({
        organization_id: args.auth.organization_id,
        project_id: args.project_id,
        status: args.query?.status,
      });
    },
    async get(args: { auth: Auth; project_id: string; project_version_id: string }) {
      await authorize(args.auth, args.project_id, "project.read");
      return resolve_existing(args);
    },
    async resolve(args: { auth: Auth; project_id: string; slug: string }) {
      await authorize(args.auth, args.project_id, "project.read");
      const resolved = await input.repository.resolve_version({
        organization_id: args.auth.organization_id,
        project_id: args.project_id,
        slug: args.slug,
      });
      if (!resolved) throw new ProjectVersionNotFoundError();
      set_access_resolved_resource({
        organization_id: resolved.project_version.organization_id,
        project_id: resolved.project_version.project_id,
        root_resource_type: "project_version",
        root_resource_id: resolved.project_version.id,
      });
      return resolved;
    },
    async create(args: { auth: Auth; project_id: string; data: CreateProjectVersionRequest }) {
      await authorize_manage(args.auth, args.project_id);
      const name = args.data.name.trim();
      const slug = args.data.slug ?? canonical_slug(name);
      if (!slug) throw new ProjectVersionSlugRequiredError();
      const created = await input.repository.create_version({
        organization_id: args.auth.organization_id,
        project_id: args.project_id,
        actor_org_user_id: args.auth.actor_org_user_id,
        data: {
          name,
          description: args.data.description ?? null,
          slug,
          release_date: args.data.release_date ?? null,
        },
      });
      if (!created) throw new ProjectVersionConflictError();
      return created;
    },
    async update(args: { auth: Auth; project_id: string; project_version_id: string; data: UpdateProjectVersionRequest }) {
      await authorize_manage(args.auth, args.project_id);
      const existing = await resolve_existing(args);
      if (existing.status === "archived") throw new ProjectVersionArchivedError();
      if (existing.version !== args.data.expected_version) throw new ProjectVersionConflictError();
      const comparable = ["name", "description", "slug", "release_date"] as const;
      if (comparable.every((field) => args.data[field] === undefined || args.data[field] === existing[field]))
        throw new ProjectVersionUnchangedError();
      const updated = await input.repository.update_version({
        organization_id: args.auth.organization_id,
        project_id: args.project_id,
        project_version_id: args.project_version_id,
        actor_org_user_id: args.auth.actor_org_user_id,
        data: args.data,
      });
      if (!updated) throw new ProjectVersionConflictError();
      return updated;
    },
    async reorder(args: { auth: Auth; project_id: string; data: ReorderProjectVersionsRequest }) {
      await authorize_manage(args.auth, args.project_id);
      const active = await input.repository.list_versions({
        organization_id: args.auth.organization_id,
        project_id: args.project_id,
        status: "active",
      });
      const supplied = new Map(args.data.project_versions.map((entry) => [entry.id, entry.expected_version]));
      if (active.length !== supplied.size || active.some((version) => supplied.get(version.id) !== version.version))
        throw new InvalidProjectVersionOrderError();
      const current_order = [...active].sort((left, right) => left.position - right.position || left.id.localeCompare(right.id));
      if (current_order.every((version, index) => version.id === args.data.project_versions[index]?.id))
        throw new ProjectVersionUnchangedError();
      const reordered = await input.repository.reorder_versions({
        organization_id: args.auth.organization_id,
        project_id: args.project_id,
        actor_org_user_id: args.auth.actor_org_user_id,
        data: args.data,
      });
      if (!reordered) throw new ProjectVersionConflictError();
      return reordered;
    },
    async archive(args: { auth: Auth; project_id: string; project_version_id: string; data: { expected_version: number } }) {
      await authorize_manage(args.auth, args.project_id);
      const existing = await resolve_existing(args);
      if (existing.is_default) throw new DefaultProjectVersionArchiveError();
      if (existing.status === "archived") throw new ProjectVersionArchivedError();
      if (existing.version !== args.data.expected_version) throw new ProjectVersionConflictError();
      const archived = await input.repository.archive_version({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        project_version_id: args.project_version_id, actor_org_user_id: args.auth.actor_org_user_id,
        expected_version: args.data.expected_version,
      });
      if (!archived) throw new ProjectVersionConflictError();
      return archived;
    },
    async restore(args: { auth: Auth; project_id: string; project_version_id: string; data: { expected_version: number } }) {
      await authorize_manage(args.auth, args.project_id);
      const existing = await resolve_existing(args);
      if (existing.status !== "archived") throw new ProjectVersionUnchangedError();
      if (existing.version !== args.data.expected_version) throw new ProjectVersionConflictError();
      const restored = await input.repository.restore_version({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        project_version_id: args.project_version_id, actor_org_user_id: args.auth.actor_org_user_id,
        expected_version: args.data.expected_version,
      });
      if (!restored) throw new ProjectVersionConflictError();
      return restored;
    },
    async set_default(args: { auth: Auth; project_id: string; project_version_id: string; data: SetDefaultProjectVersionRequest }) {
      await authorize_manage(args.auth, args.project_id);
      const existing = await resolve_existing(args);
      if (existing.status === "archived") throw new ProjectVersionArchivedError();
      if (existing.is_default) throw new ProjectVersionUnchangedError();
      if (existing.version !== args.data.expected_version) throw new ProjectVersionConflictError();
      const changed = await input.repository.set_default_version({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        project_version_id: args.project_version_id, actor_org_user_id: args.auth.actor_org_user_id,
        data: args.data,
      });
      if (!changed) throw new ProjectVersionConflictError();
      return changed;
    },
  };
};
