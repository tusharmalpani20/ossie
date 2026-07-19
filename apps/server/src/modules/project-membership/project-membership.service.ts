import type {
  OrganizationMemberStatus,
  OrganizationRole,
  ProjectAccessSource,
  ProjectMembershipStatus,
  ProjectRole,
  ProjectStatus,
} from "@repo/constants";
import type { ProjectAccessMember, ProjectMembership } from "@repo/types/project-membership";
import {
  set_access_authorization_context,
  set_access_resolved_resource,
} from "../access/access-request-context";
import {
  is_project_content_mutation,
  project_role_has_capability,
  type ProjectCapability,
} from "./project-access.policy";

export class ProjectNotFoundError extends Error {
  constructor() { super("Project was not found"); }
}
export class ProjectPermissionDeniedError extends Error {
  constructor() { super("Your Project role does not permit this action"); }
}
export class ProjectArchivedError extends Error {
  constructor() { super("Archived Projects are read-only"); }
}
export class OrganizationMemberNotFoundError extends Error { constructor() { super("Organization member was not found"); } }
export class OrganizationMemberInactiveError extends Error { constructor() { super("Organization member is inactive"); } }
export class ProjectMembershipNotRequiredError extends Error { constructor() { super("Organization owners use implicit Project access"); } }
export class ProjectMembershipExistsError extends Error { constructor() { super("Project membership already exists"); } }
export class ProjectMembershipNotFoundError extends Error { constructor() { super("Project membership was not found"); } }
export class ProjectMembershipConflictError extends Error { constructor() { super("Project membership changed; reload and retry"); } }
export class ProjectMembershipUnchangedError extends Error { constructor() { super("Select a different Project role"); } }

export type EffectiveProjectAccess = {
  role: ProjectRole;
  source: ProjectAccessSource;
};

type ProjectAccessResolution = {
  project: {
    id: string;
    organization_id: string;
    status: ProjectStatus;
  };
  actor_status: OrganizationMemberStatus;
  actor_role: OrganizationRole;
  membership: {
    role: ProjectRole;
    status: ProjectMembershipStatus;
  } | null;
};

export type ProjectAccessRepository = {
  resolve_project_access(input: {
    organization_id: string;
    actor_org_user_id: string;
    project_id: string;
  }): Promise<ProjectAccessResolution | null>;
};

export const build_project_access_service = (repository: ProjectAccessRepository) => ({
  async authorize(input: {
    auth: { organization_id: string; actor_org_user_id: string };
    project_id: string;
    capability: ProjectCapability;
  }): Promise<EffectiveProjectAccess> {
    const resolved = await repository.resolve_project_access({
      organization_id: input.auth.organization_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      project_id: input.project_id,
    });
    if (!resolved || resolved.actor_status !== "active") {
      set_access_authorization_context({ authorization_type: "project_role", authorization_role: null });
      throw new ProjectNotFoundError();
    }

    set_access_resolved_resource({
      organization_id: resolved.project.organization_id,
      project_id: resolved.project.id,
      root_resource_type: "project",
      root_resource_id: resolved.project.id,
    });

    const access: EffectiveProjectAccess | null = resolved.actor_role === "owner"
      ? { role: "project_admin", source: "organization_owner" }
      : resolved.membership?.status === "active"
        ? { role: resolved.membership.role, source: "project_membership" }
        : null;
    if (!access) {
      set_access_authorization_context({ authorization_type: "project_role", authorization_role: null });
      throw new ProjectNotFoundError();
    }

    set_access_authorization_context(access.source === "organization_owner"
      ? { authorization_type: "organization_role", authorization_role: "owner" }
      : { authorization_type: "project_role", authorization_role: access.role });
    if (!project_role_has_capability(access.role, input.capability))
      throw new ProjectPermissionDeniedError();
    if (resolved.project.status === "archived" && is_project_content_mutation(input.capability))
      throw new ProjectArchivedError();
    return access;
  },
});

type TargetMember = { role: OrganizationRole; status: OrganizationMemberStatus };
export type ProjectMembershipRepository = {
  list_access_members(input: { organization_id: string; project_id: string }): Promise<ProjectAccessMember[]>;
  find_target_member(input: { organization_id: string; org_user_id: string }): Promise<TargetMember | null>;
  find_membership(input: { organization_id: string; project_id: string; org_user_id: string }): Promise<ProjectMembership | null>;
  find_membership_by_id(input: { organization_id: string; project_id: string; membership_id: string }): Promise<(ProjectMembership & { organization_status: OrganizationMemberStatus }) | null>;
  assign_membership(input: { organization_id: string; project_id: string; org_user_id: string; role: ProjectRole; actor_org_user_id: string }): Promise<ProjectMembership | null>;
  change_membership_role(input: { organization_id: string; project_id: string; membership_id: string; role: ProjectRole; expected_version: number; actor_org_user_id: string }): Promise<ProjectMembership | null>;
  remove_membership(input: { organization_id: string; project_id: string; membership_id: string; expected_version: number; actor_org_user_id: string }): Promise<boolean>;
};

type MembershipAuth = { organization_id: string; actor_org_user_id: string };
export const build_project_membership_service = (input: {
  access: Pick<ReturnType<typeof build_project_access_service>, "authorize">;
  repository: ProjectMembershipRepository;
}) => {
  const authorize = (auth: MembershipAuth, project_id: string) => input.access.authorize({
    auth, project_id, capability: "project.membership.manage",
  });
  return {
    async list(args: { auth: MembershipAuth; project_id: string }) {
      await authorize(args.auth, args.project_id);
      return { members: await input.repository.list_access_members({
        organization_id: args.auth.organization_id, project_id: args.project_id,
      }) };
    },
    async assign(args: { auth: MembershipAuth; project_id: string; data: { org_user_id: string; role: ProjectRole } }) {
      await authorize(args.auth, args.project_id);
      const target = await input.repository.find_target_member({
        organization_id: args.auth.organization_id, org_user_id: args.data.org_user_id,
      });
      if (!target) throw new OrganizationMemberNotFoundError();
      if (target.role === "owner") throw new ProjectMembershipNotRequiredError();
      if (target.status !== "active") throw new OrganizationMemberNotFoundError();
      const existing = await input.repository.find_membership({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        org_user_id: args.data.org_user_id,
      });
      if (existing?.status === "active") throw new ProjectMembershipExistsError();
      const assigned = await input.repository.assign_membership({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        org_user_id: args.data.org_user_id, role: args.data.role,
        actor_org_user_id: args.auth.actor_org_user_id,
      });
      if (assigned) return assigned;

      const current_target = await input.repository.find_target_member({
        organization_id: args.auth.organization_id, org_user_id: args.data.org_user_id,
      });
      if (!current_target || current_target.status !== "active")
        throw new OrganizationMemberNotFoundError();
      if (current_target.role === "owner") throw new ProjectMembershipNotRequiredError();
      const current_membership = await input.repository.find_membership({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        org_user_id: args.data.org_user_id,
      });
      if (current_membership?.status === "active") throw new ProjectMembershipExistsError();
      throw new ProjectMembershipConflictError();
    },
    async change_role(args: { auth: MembershipAuth; project_id: string; membership_id: string; data: { role: ProjectRole; expected_version: number } }) {
      await authorize(args.auth, args.project_id);
      const existing = await input.repository.find_membership_by_id({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        membership_id: args.membership_id,
      });
      if (!existing || existing.status !== "active") throw new ProjectMembershipNotFoundError();
      if (existing.organization_status !== "active") throw new OrganizationMemberInactiveError();
      if (existing.version !== args.data.expected_version) throw new ProjectMembershipConflictError();
      if (existing.role === args.data.role) throw new ProjectMembershipUnchangedError();
      const changed = await input.repository.change_membership_role({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        membership_id: args.membership_id, role: args.data.role,
        expected_version: args.data.expected_version,
        actor_org_user_id: args.auth.actor_org_user_id,
      });
      if (!changed) throw new ProjectMembershipConflictError();
      return changed;
    },
    async remove(args: { auth: MembershipAuth; project_id: string; membership_id: string; expected_version: number }) {
      await authorize(args.auth, args.project_id);
      const existing = await input.repository.find_membership_by_id({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        membership_id: args.membership_id,
      });
      if (!existing || existing.status !== "active") throw new ProjectMembershipNotFoundError();
      const removed = await input.repository.remove_membership({
        organization_id: args.auth.organization_id, project_id: args.project_id,
        membership_id: args.membership_id, expected_version: args.expected_version,
        actor_org_user_id: args.auth.actor_org_user_id,
      });
      if (!removed) throw new ProjectMembershipConflictError();
    },
  };
};
