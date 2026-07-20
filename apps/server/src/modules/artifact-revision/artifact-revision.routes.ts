import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  ArtifactRevisionHistoryQuerySchema,
  ArtifactRevisionVersionQuerySchema,
  ArtifactRevisionWriteRequestSchema,
  type ArtifactRevisionListQuery,
  type ArtifactRevisionWriteRequest,
} from "@repo/types";
import { z } from "zod";
import {
  GuideEditionConflictError,
  GuideNotEditableError,
  GuideWorkingDraftConflictError,
} from "@repo/guide-domain";
import {
  InteractiveDemoEditionConflictError,
  InteractiveDemoNotEditableError,
  InteractiveDemoWorkingDraftConflictError,
} from "@repo/demo-domain";
import { session_token_from_request } from "../authentication/request-session-token";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { error_response, unauthorized_response } from "../shared/http-errors";
import {
  ArtifactEditionNotEditableError,
  ArtifactEditionNotFoundError,
  ArtifactRevisionEditionConflictError,
  ArtifactRevisionNotFoundError,
  ArtifactRevisionWorkingDraftConflictError,
  type build_artifact_revision_service,
} from "./artifact-revision.service";

type Service = ReturnType<typeof build_artifact_revision_service>;
const BaseParamsSchema = z
  .object({ project_id: z.string().trim().min(1) })
  .strict();
const RevisionParamsSchema = BaseParamsSchema.extend({
  revision_number: z.coerce.number().int().positive(),
}).strict();
type RevisionRouteParams = {
  project_id: string;
  guide_id?: string;
  interactive_demo_id?: string;
  revision_number?: number;
};
type RevisionRouteRequest = FastifyRequest<{
  Params: RevisionRouteParams;
  Querystring: ArtifactRevisionListQuery & { project_version_id: string };
  Body: ArtifactRevisionWriteRequest;
}>;

const handle_error = (error: unknown, reply: FastifyReply) => {
  if (error instanceof UnauthenticatedSessionError)
    return reply.status(401).send(unauthorized_response());
  if (error instanceof ArtifactEditionNotFoundError)
    return reply
      .status(404)
      .send(error_response("artifact_edition_not_found", error.message));
  if (error instanceof ArtifactRevisionNotFoundError)
    return reply
      .status(404)
      .send(error_response("artifact_revision_not_found", error.message));
  if (
    error instanceof ArtifactEditionNotEditableError ||
    error instanceof GuideNotEditableError ||
    error instanceof InteractiveDemoNotEditableError
  )
    return reply
      .status(409)
      .send(error_response("artifact_edition_not_editable", error.message));
  if (
    error instanceof ArtifactRevisionEditionConflictError ||
    error instanceof GuideEditionConflictError ||
    error instanceof InteractiveDemoEditionConflictError
  )
    return reply
      .status(409)
      .send(error_response("edition_conflict", error.message));
  if (
    error instanceof ArtifactRevisionWorkingDraftConflictError ||
    error instanceof GuideWorkingDraftConflictError ||
    error instanceof InteractiveDemoWorkingDraftConflictError
  )
    return reply
      .status(409)
      .send(error_response("working_draft_conflict", error.message));
  throw error;
};

export const build_artifact_revision_routes =
  (dependencies: {
    auth_service: {
      get_current_auth_context(token?: string): Promise<AuthContext>;
    };
    artifact_revision_service: Service;
  }): FastifyPluginAsync =>
  async (app: FastifyInstance) => {
    const auth = async (
      request: Parameters<typeof session_token_from_request>[0],
    ) => {
      const value = await dependencies.auth_service.get_current_auth_context(
        session_token_from_request(request),
      );
      return {
        organization_id: value.organization.id,
        actor_org_user_id: value.org_user.id,
      };
    };
    const send = async (
      reply: FastifyReply,
      execute: () => Promise<unknown>,
      status = 200,
    ) => {
      try {
        return reply.status(status).send(await execute());
      } catch (error) {
        return handle_error(error, reply);
      }
    };
    const register = (kind: "guide" | "interactive_demo") => {
      const segment = kind === "guide" ? "guides" : "interactive-demos";
      const id_name = kind === "guide" ? "guide_id" : "interactive_demo_id";
      const prefix = `/:project_id/${segment}/:${id_name}/revisions`;
      const scope = async (request: RevisionRouteRequest) => ({
        auth: await auth(request),
        project_id: request.params.project_id,
        project_version_id: request.query.project_version_id,
        [id_name]: request.params[id_name],
      });
      app.get(
        prefix,
        { schema: { querystring: ArtifactRevisionHistoryQuerySchema } },
        (request: RevisionRouteRequest, reply) =>
          send(reply, async () =>
            dependencies.artifact_revision_service[
              kind === "guide"
                ? "list_guide_revisions"
                : "list_interactive_demo_revisions"
            ]({
              ...(await scope(request)),
              limit: request.query.limit,
              before_revision_number: request.query.before_revision_number,
            } as never),
          ),
      );
      app.post(
        `${prefix}/checkpoint`,
        {
          schema: {
            querystring: ArtifactRevisionVersionQuerySchema,
            body: ArtifactRevisionWriteRequestSchema,
          },
        },
        (request: RevisionRouteRequest, reply) =>
          send(reply, async () => {
            const result = await dependencies.artifact_revision_service[
              kind === "guide"
                ? "checkpoint_guide"
                : "checkpoint_interactive_demo"
            ]({
              ...(await scope(request)),
              ...(request.body as ArtifactRevisionWriteRequest),
            } as never);
            reply.status(result.reused ? 200 : 201);
            return result;
          }),
      );
      app.get(
        `${prefix}/:revision_number`,
        {
          schema: {
            params: RevisionParamsSchema.passthrough(),
            querystring: ArtifactRevisionVersionQuerySchema,
          },
        },
        (request: RevisionRouteRequest, reply) =>
          send(reply, async () =>
            dependencies.artifact_revision_service[
              kind === "guide"
                ? "get_guide_revision"
                : "get_interactive_demo_revision"
            ]({
              ...request.params,
              ...request.query,
              auth: await auth(request),
            } as never),
          ),
      );
      app.post(
        `${prefix}/:revision_number/restore`,
        {
          schema: {
            params: RevisionParamsSchema.passthrough(),
            querystring: ArtifactRevisionVersionQuerySchema,
            body: ArtifactRevisionWriteRequestSchema,
          },
        },
        (request: RevisionRouteRequest, reply) =>
          send(reply, async () =>
            dependencies.artifact_revision_service[
              kind === "guide"
                ? "restore_guide_revision"
                : "restore_interactive_demo_revision"
            ]({
              ...request.params,
              ...request.query,
              ...request.body,
              auth: await auth(request),
            } as never),
          ),
      );
    };
    register("guide");
    register("interactive_demo");
  };
