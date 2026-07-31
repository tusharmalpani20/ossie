import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";
import {
  DocumentationProjectionRebuildRequestSchema,
  UpdateDocumentationOrganizationLimitsRequestSchema,
} from "@repo/types";
import { DocumentationDomainError } from "@repo/documentation-domain";
import { session_token_from_request } from "../authentication/request-session-token";
import { UnauthenticatedSessionError } from "../authentication/session.service";
import { error_response } from "../shared/http-errors";
import {
  DocumentationOperationsPermissionError,
  type DocumentationOperationsService,
} from "./documentation-operations.service";
import { DocumentationOperationsVersionConflictError } from "./documentation-operations.repository";

export type DocumentationOperationsRouteDependencies = {
  auth_service: {
    get_current_auth_context(session_token?: string): Promise<{
      organization: { id: string };
      org_user: { id: string; role: string };
    }>;
  };
  service: DocumentationOperationsService;
};

const auth_input = (auth: {
  organization: { id: string };
  org_user: { id: string; role: string };
}) => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
  actor_role: auth.org_user.role,
});

const handle_error = (error: unknown, reply: FastifyReply) => {
  if (error instanceof UnauthenticatedSessionError) {
    return reply
      .status(401)
      .send(error_response("unauthenticated", "Authentication is required"));
  }
  if (error instanceof DocumentationOperationsPermissionError) {
    return reply
      .status(403)
      .send(
        error_response(
          "documentation_operations_permission_denied",
          "Organization Owner permission is required",
        ),
      );
  }
  if (error instanceof DocumentationOperationsVersionConflictError) {
    return reply.status(409).send({
      ...error_response(error.code, error.message),
      latest: error.latest,
    });
  }
  if (error instanceof DocumentationDomainError) {
    const status =
      error.code === "documentation_rebuild_capacity_exceeded"
        ? 503
        : error.code === "documentation_projection_rebuild_invalid"
          ? 409
          : 422;
    if (status === 503) reply.header("retry-after", "1");
    return reply.status(status).send(error_response(error.code, error.message));
  }
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (code === "documentation_not_found") {
    return reply
      .status(404)
      .send(error_response("documentation_not_found", "Resource not found"));
  }
  if (code === "documentation_projection_rebuild_invalid") {
    return reply
      .status(409)
      .send(
        error_response(
          code,
          "The projection target changed; refresh before rebuilding",
        ),
      );
  }
  throw error;
};

export const build_documentation_operations_routes =
  (
    dependencies: DocumentationOperationsRouteDependencies,
  ): FastifyPluginAsync =>
  async (fastify: FastifyInstance) => {
    const authenticate = async (
      request: Parameters<typeof session_token_from_request>[0],
    ) =>
      auth_input(
        await dependencies.auth_service.get_current_auth_context(
          session_token_from_request(request),
        ),
      );

    fastify.get(
      "/api/v1/organization/documentation/operations",
      async (request, reply) => {
        try {
          const result = await dependencies.service.get_summary(
            await authenticate(request),
          );
          return reply
            .header("cache-control", "private, no-store")
            .status(200)
            .send(result);
        } catch (error) {
          return handle_error(error, reply);
        }
      },
    );

    fastify.put(
      "/api/v1/organization/documentation/limits",
      async (request, reply) => {
        const parsed =
          UpdateDocumentationOrganizationLimitsRequestSchema.safeParse(
            request.body,
          );
        if (!parsed.success) {
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_request",
                "Documentation limits request is invalid",
              ),
            );
        }
        try {
          const result = await dependencies.service.update_limits(
            await authenticate(request),
            parsed.data,
          );
          return reply
            .header("cache-control", "private, no-store")
            .status(200)
            .send(result);
        } catch (error) {
          return handle_error(error, reply);
        }
      },
    );

    fastify.post<{
      Params: {
        project_id: string;
        version_slug: string;
        site_id: string;
      };
    }>(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/projections/rebuild",
      async (request, reply) => {
        const parsed = DocumentationProjectionRebuildRequestSchema.safeParse(
          request.body,
        );
        if (!parsed.success) {
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_request",
                "Documentation projection rebuild request is invalid",
              ),
            );
        }
        try {
          const result = await dependencies.service.rebuild_projection(
            await authenticate(request),
            {
              project_id: request.params.project_id,
              project_version_slug: request.params.version_slug,
              site_id: request.params.site_id,
              request: parsed.data,
            },
          );
          return reply
            .header("cache-control", "private, no-store")
            .status(200)
            .send(result);
        } catch (error) {
          return handle_error(error, reply);
        }
      },
    );
  };
