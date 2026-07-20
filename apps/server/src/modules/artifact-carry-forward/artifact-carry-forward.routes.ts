import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  ArtifactCarryForwardRequestSchema,
  IdempotencyKeySchema,
  type ArtifactCarryForwardRequest,
} from "@repo/types";
import { z } from "zod";
import { session_token_from_request } from "../authentication/request-session-token";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { error_response, unauthorized_response } from "../shared/http-errors";
import {
  ArtifactCarryForwardIdempotencyConflictError,
  ArtifactCarryForwardProjectVersionNotFoundError,
  ArtifactCarryForwardTargetConflictError,
  ArtifactCarryForwardTargetReadOnlyError,
  type build_artifact_carry_forward_service,
} from "./artifact-carry-forward.service";

const ParamsSchema = z
  .object({ project_id: z.string().trim().min(1) })
  .strict();
const HeadersSchema = z
  .object({ "idempotency-key": IdempotencyKeySchema })
  .passthrough();
type CarryForwardRequest = FastifyRequest<{
  Params: z.infer<typeof ParamsSchema>;
  Headers: z.infer<typeof HeadersSchema>;
  Body: ArtifactCarryForwardRequest;
}>;
const handle = (error: unknown, reply: FastifyReply) => {
  if (error instanceof UnauthenticatedSessionError)
    return reply.status(401).send(unauthorized_response());
  if (error instanceof ArtifactCarryForwardProjectVersionNotFoundError)
    return reply
      .status(404)
      .send(
        error_response(
          "project_version_not_found",
          "Project Version was not found",
        ),
      );
  if (error instanceof ArtifactCarryForwardIdempotencyConflictError)
    return reply
      .status(409)
      .send(
        error_response(
          "idempotency_key_reused",
          "Idempotency key was already used for another request",
        ),
      );
  if (error instanceof ArtifactCarryForwardTargetReadOnlyError)
    return reply
      .status(409)
      .send(
        error_response(
          "project_version_read_only",
          "Target Project Version is read-only",
        ),
      );
  if (error instanceof ArtifactCarryForwardTargetConflictError)
    return reply
      .status(409)
      .send({
        error: {
          type: "carry_forward_target_conflict",
          message: error.message,
          details: { blockers: error.blockers },
        },
      });
  throw error;
};
export const build_artifact_carry_forward_routes =
  (dependencies: {
    auth_service: {
      get_current_auth_context(token?: string): Promise<AuthContext>;
    };
    artifact_carry_forward_service: ReturnType<
      typeof build_artifact_carry_forward_service
    >;
  }): FastifyPluginAsync =>
  async (app: FastifyInstance) => {
    app.post(
      "/:project_id/artifact-editions/carry-forward",
      {
        schema: {
          params: ParamsSchema,
          headers: HeadersSchema,
          body: ArtifactCarryForwardRequestSchema,
        },
      },
      async (request: CarryForwardRequest, reply) => {
        try {
          const auth = await dependencies.auth_service.get_current_auth_context(
            session_token_from_request(request),
          );
          const result =
            await dependencies.artifact_carry_forward_service.carry_forward({
              auth: {
                organization_id: auth.organization.id,
                actor_org_user_id: auth.org_user.id,
              },
              project_id: request.params.project_id,
              idempotency_key: request.headers["idempotency-key"],
              ...request.body,
            });
          return reply.status(result.replayed ? 200 : 201).send(result);
        } catch (error) {
          return handle(error, reply);
        }
      },
    );
  };
