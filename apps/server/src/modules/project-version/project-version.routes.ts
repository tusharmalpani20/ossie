import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import {
  CreateProjectVersionRequestSchema, ProjectVersionExpectedVersionRequestSchema,
  ProjectVersionListQuerySchema, ReorderProjectVersionsRequestSchema,
  SetDefaultProjectVersionRequestSchema, UpdateProjectVersionRequestSchema,
  type CreateProjectVersionRequest, type ProjectVersionListQuery,
  type ReorderProjectVersionsRequest, type SetDefaultProjectVersionRequest,
  type UpdateProjectVersionRequest,
} from "@repo/types/project-version";
import { session_token_from_request } from "../authentication/request-session-token";
import { UnauthenticatedSessionError, type AuthContext } from "../authentication/session.service";
import { error_response, unauthorized_response } from "../shared/http-errors";
import { ProjectArchivedError, ProjectNotFoundError, ProjectPermissionDeniedError } from "../project-membership/project-membership.service";
import {
  DefaultProjectVersionArchiveError, InvalidProjectVersionOrderError,
  LegacyContentBlocksDefaultChangeError, ProjectVersionArchivedError,
  ProjectVersionConflictError, ProjectVersionNotFoundError, ProjectVersionSlugConflictError,
  ProjectVersionSlugRequiredError, ProjectVersionUnchangedError,
} from "./project-version.service";

type Auth = { organization_id: string; actor_org_user_id: string };
export type ProjectVersionRouteService = ReturnType<typeof import("./project-version.service").build_project_version_service>;
const auth_input = (auth: AuthContext): Auth => ({ organization_id: auth.organization.id, actor_org_user_id: auth.org_user.id });
const error_handler = (error: unknown, reply: FastifyReply) => {
  if (error instanceof UnauthenticatedSessionError) return reply.status(401).send(unauthorized_response());
  if (error instanceof ProjectNotFoundError) return reply.status(404).send(error_response("project_not_found", error.message));
  if (error instanceof ProjectVersionNotFoundError) return reply.status(404).send(error_response("project_version_not_found", error.message));
  if (error instanceof ProjectPermissionDeniedError) return reply.status(403).send(error_response("project_permission_denied", error.message));
  if (error instanceof ProjectArchivedError) return reply.status(409).send(error_response("project_archived", error.message));
  if (error instanceof ProjectVersionSlugRequiredError) return reply.status(400).send(error_response("project_version_slug_required", error.message));
  if (error instanceof ProjectVersionUnchangedError) return reply.status(400).send(error_response("project_version_unchanged", error.message));
  if (error instanceof InvalidProjectVersionOrderError) return reply.status(400).send(error_response("invalid_project_version_order", error.message));
  if (error instanceof ProjectVersionArchivedError) return reply.status(409).send(error_response("project_version_conflict", error.message));
  if (error instanceof ProjectVersionSlugConflictError) return reply.status(409).send(error_response("project_version_slug_conflict", error.message));
  if (error instanceof ProjectVersionConflictError) return reply.status(409).send(error_response("project_version_conflict", error.message));
  if (error instanceof DefaultProjectVersionArchiveError) return reply.status(409).send(error_response("default_project_version_archive_forbidden", error.message));
  if (error instanceof LegacyContentBlocksDefaultChangeError) return reply.status(409).send(error_response("project_version_legacy_content_blocks_default_change", error.message));
  throw error;
};

export const build_project_version_routes = (dependencies: {
  auth_service: { get_current_auth_context(token?: string): Promise<AuthContext> };
  project_version_service: ProjectVersionRouteService;
}): FastifyPluginAsync => async (fastify: FastifyInstance) => {
  const auth = async (request: Parameters<typeof session_token_from_request>[0]) =>
    auth_input(await dependencies.auth_service.get_current_auth_context(session_token_from_request(request)));
  const wrap = async (reply: FastifyReply, execute: () => Promise<unknown>, status = 200) => {
    try { return reply.status(status).send(await execute()); } catch (error) { return error_handler(error, reply); }
  };
  fastify.get<{ Params: { project_id: string }; Querystring: ProjectVersionListQuery }>("/:project_id/versions", {
    schema: { querystring: ProjectVersionListQuerySchema },
  }, (request, reply) => wrap(reply, async () => ({ project_versions: await dependencies.project_version_service.list({
    auth: await auth(request), project_id: request.params.project_id, query: request.query,
  }) })));
  fastify.post<{ Params: { project_id: string }; Body: CreateProjectVersionRequest }>("/:project_id/versions", {
    schema: { body: CreateProjectVersionRequestSchema },
  }, (request, reply) => wrap(reply, async () => ({ project_version: await dependencies.project_version_service.create({
    auth: await auth(request), project_id: request.params.project_id, data: request.body,
  }) }), 201));
  fastify.get<{ Params: { project_id: string; slug: string } }>("/:project_id/versions/resolve/:slug", (request, reply) =>
    wrap(reply, async () => dependencies.project_version_service.resolve({ auth: await auth(request), ...request.params })));
  fastify.put<{ Params: { project_id: string }; Body: ReorderProjectVersionsRequest }>("/:project_id/versions/order", {
    schema: { body: ReorderProjectVersionsRequestSchema },
  }, (request, reply) => wrap(reply, async () => ({ project_versions: await dependencies.project_version_service.reorder({
    auth: await auth(request), project_id: request.params.project_id, data: request.body,
  }) })));
  fastify.get<{ Params: { project_id: string; project_version_id: string } }>("/:project_id/versions/:project_version_id", (request, reply) =>
    wrap(reply, async () => ({ project_version: await dependencies.project_version_service.get({ auth: await auth(request), ...request.params }) })));
  fastify.patch<{ Params: { project_id: string; project_version_id: string }; Body: UpdateProjectVersionRequest }>("/:project_id/versions/:project_version_id", {
    schema: { body: UpdateProjectVersionRequestSchema },
  }, (request, reply) => wrap(reply, async () => ({ project_version: await dependencies.project_version_service.update({
    auth: await auth(request), ...request.params, data: request.body,
  }) })));
  const lifecycle = (kind: "archive" | "restore") => {
    fastify.post<{ Params: { project_id: string; project_version_id: string }; Body: { expected_version: number } }>(`/:project_id/versions/:project_version_id/${kind}`, {
      schema: { body: ProjectVersionExpectedVersionRequestSchema },
    }, (request, reply) => wrap(reply, async () => ({ project_version: await dependencies.project_version_service[kind]({
      auth: await auth(request), ...request.params, data: request.body,
    }) })));
  };
  lifecycle("archive"); lifecycle("restore");
  fastify.post<{ Params: { project_id: string; project_version_id: string }; Body: SetDefaultProjectVersionRequest }>("/:project_id/versions/:project_version_id/set-default", {
    schema: { body: SetDefaultProjectVersionRequestSchema },
  }, (request, reply) => wrap(reply, async () => dependencies.project_version_service.set_default({
    auth: await auth(request), project_id: request.params.project_id, project_version_id: request.params.project_version_id, data: request.body,
  })));
};
