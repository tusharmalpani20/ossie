import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import { ProjectActivityResponseSchema } from "@repo/types/project-activity";
import type { AuthContext } from "../authentication/session.service";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import { session_token_from_request } from "../authentication/request-session-token";
import { error_response, unauthorized_response } from "../shared/http-errors";
import { ProjectNotFoundError, ProjectPermissionDeniedError } from "../project-membership/project-membership.service";
import { InvalidProjectActivityCursorError } from "./project-activity.service";

const Query = z.object({ limit: z.coerce.number().int().min(1).max(50).optional(), cursor: z.string().min(1).max(2048).optional() });
const handle = (error: unknown, reply: FastifyReply) => {
  if (error instanceof UnauthenticatedSessionError) return reply.status(401).send(unauthorized_response());
  if (error instanceof ProjectNotFoundError) return reply.status(404).send(error_response("project_not_found", error.message));
  if (error instanceof ProjectPermissionDeniedError) return reply.status(403).send(error_response("project_permission_denied", error.message));
  if (error instanceof InvalidProjectActivityCursorError) return reply.status(400).send(error_response("invalid_project_activity_cursor", error.message));
  throw error;
};
export const build_project_activity_routes = (dependencies: {
  auth_service: { get_current_auth_context(token?: string): Promise<AuthContext> };
  activity_service: { list(input: { auth: { organization_id: string; actor_org_user_id: string }; project_id: string; query: { limit?: number; cursor?: string } }): Promise<unknown> };
}): FastifyPluginAsync => async (fastify) => {
  fastify.get<{ Params: { project_id: string }; Querystring: { limit?: number; cursor?: string } }>("/:project_id/activity", {
    schema: { querystring: Query, response: { 200: ProjectActivityResponseSchema } },
  }, async (request, reply) => {
    try {
      const context = await dependencies.auth_service.get_current_auth_context(session_token_from_request(request));
      return reply.status(200).send(await dependencies.activity_service.list({
        auth: { organization_id: context.organization.id, actor_org_user_id: context.org_user.id },
        project_id: request.params.project_id, query: request.query,
      }));
    } catch (error) { return handle(error, reply); }
  });
};
