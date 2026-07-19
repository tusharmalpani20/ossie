import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import {
  AssignProjectMembershipRequestSchema,
  ChangeProjectMembershipRoleRequestSchema,
  RemoveProjectMembershipQuerySchema,
} from "@repo/types/project-membership";
import type { ProjectRole } from "@repo/constants";
import type { AuthContext } from "../authentication/session.service";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import { session_token_from_request } from "../authentication/request-session-token";
import { error_response, unauthorized_response } from "../shared/http-errors";
import {
  OrganizationMemberInactiveError,
  OrganizationMemberNotFoundError,
  ProjectArchivedError,
  ProjectMembershipConflictError,
  ProjectMembershipExistsError,
  ProjectMembershipNotFoundError,
  ProjectMembershipNotRequiredError,
  ProjectMembershipUnchangedError,
  ProjectNotFoundError,
  ProjectPermissionDeniedError,
} from "./project-membership.service";

type Auth = { organization_id: string; actor_org_user_id: string };
type MembershipService = {
  list(input: { auth: Auth; project_id: string }): Promise<unknown>;
  assign(input: { auth: Auth; project_id: string; data: { org_user_id: string; role: ProjectRole } }): Promise<unknown>;
  change_role(input: { auth: Auth; project_id: string; membership_id: string; data: { role: ProjectRole; expected_version: number } }): Promise<unknown>;
  remove(input: { auth: Auth; project_id: string; membership_id: string; expected_version: number }): Promise<void>;
};
const auth_input = (auth: AuthContext): Auth => ({
  organization_id: auth.organization.id, actor_org_user_id: auth.org_user.id,
});

const handle_error = (error: unknown, reply: FastifyReply) => {
  if (error instanceof UnauthenticatedSessionError) return reply.status(401).send(unauthorized_response());
  if (error instanceof ProjectNotFoundError) return reply.status(404).send(error_response("project_not_found", error.message));
  if (error instanceof ProjectPermissionDeniedError) return reply.status(403).send(error_response("project_permission_denied", error.message));
  if (error instanceof ProjectArchivedError) return reply.status(409).send(error_response("project_archived", error.message));
  if (error instanceof OrganizationMemberNotFoundError) return reply.status(404).send(error_response("organization_member_not_found", error.message));
  if (error instanceof OrganizationMemberInactiveError) return reply.status(409).send(error_response("organization_member_inactive", error.message));
  if (error instanceof ProjectMembershipNotRequiredError) return reply.status(409).send(error_response("project_membership_not_required", error.message));
  if (error instanceof ProjectMembershipExistsError) return reply.status(409).send(error_response("project_membership_exists", error.message));
  if (error instanceof ProjectMembershipNotFoundError) return reply.status(404).send(error_response("project_membership_not_found", error.message));
  if (error instanceof ProjectMembershipConflictError) return reply.status(409).send(error_response("project_membership_conflict", error.message));
  if (error instanceof ProjectMembershipUnchangedError) return reply.status(400).send(error_response("project_membership_unchanged", error.message));
  throw error;
};

export const build_project_membership_routes = (dependencies: {
  auth_service: { get_current_auth_context(token?: string): Promise<AuthContext> };
  membership_service: MembershipService;
}): FastifyPluginAsync => async (fastify: FastifyInstance) => {
  const auth = async (request: Parameters<typeof session_token_from_request>[0]) =>
    auth_input(await dependencies.auth_service.get_current_auth_context(session_token_from_request(request)));

  fastify.get<{ Params: { project_id: string } }>("/:project_id/memberships", async (request, reply) => {
    try { return reply.status(200).send(await dependencies.membership_service.list({ auth: await auth(request), project_id: request.params.project_id })); }
    catch (error) { return handle_error(error, reply); }
  });
  fastify.post<{ Params: { project_id: string }; Body: { org_user_id: string; role: ProjectRole } }>("/:project_id/memberships", {
    schema: { body: AssignProjectMembershipRequestSchema },
  }, async (request, reply) => {
    try {
      const membership = await dependencies.membership_service.assign({ auth: await auth(request), project_id: request.params.project_id,
        data: { org_user_id: request.body.org_user_id, role: request.body.role } });
      return reply.status(201).send({ membership });
    } catch (error) { return handle_error(error, reply); }
  });
  fastify.patch<{ Params: { project_id: string; membership_id: string }; Body: { role: ProjectRole; expected_version: number } }>("/:project_id/memberships/:membership_id", {
    schema: { body: ChangeProjectMembershipRoleRequestSchema },
  }, async (request, reply) => {
    try {
      const membership = await dependencies.membership_service.change_role({ auth: await auth(request), project_id: request.params.project_id,
        membership_id: request.params.membership_id, data: { role: request.body.role, expected_version: request.body.expected_version } });
      return reply.status(200).send({ membership });
    } catch (error) { return handle_error(error, reply); }
  });
  fastify.delete<{ Params: { project_id: string; membership_id: string }; Querystring: { expected_version: number } }>("/:project_id/memberships/:membership_id", {
    schema: { querystring: RemoveProjectMembershipQuerySchema },
  }, async (request, reply) => {
    try {
      await dependencies.membership_service.remove({ auth: await auth(request), project_id: request.params.project_id,
        membership_id: request.params.membership_id, expected_version: request.query.expected_version });
      return reply.status(204).send();
    } catch (error) { return handle_error(error, reply); }
  });
};
