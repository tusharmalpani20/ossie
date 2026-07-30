import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { DocumentationCreateSiteRequestSchema } from "@repo/types";
import { z } from "zod";
import { web_session_cookie_name } from "../authentication/session-cookie";
import type { AuthContext } from "../authentication/session.service";
import { error_response } from "../shared/http-errors";

const ParamsSchema = z
  .object({
    project_id: z.string().trim().min(1),
    version_slug: z.string().trim().min(1),
  })
  .strict();
const IdempotencyKeySchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[\x21-\x7e]+$/u);

export type DocumentationRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session?: string) => Promise<AuthContext>;
  };
  documentation_service: {
    create_site: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      idempotency_key: string;
      data: z.infer<typeof DocumentationCreateSiteRequestSchema>;
    }) => Promise<unknown>;
  };
  resolve_project_version: (input: {
    organization_id: string;
    actor_org_user_id: string;
    project_id: string;
    version_slug: string;
  }) => Promise<{ id: string }>;
};

export const build_documentation_routes = (
  dependencies: DocumentationRouteDependencies,
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites",
      async (request, reply) => {
        const params = ParamsSchema.safeParse(request.params);
        const body = DocumentationCreateSiteRequestSchema.safeParse(request.body);
        const idempotency_key = IdempotencyKeySchema.safeParse(
          request.headers["idempotency-key"],
        );
        if (!params.success || !body.success || !idempotency_key.success) {
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        }

        try {
          const auth =
            await dependencies.auth_service.get_current_auth_context(
              request.cookies[web_session_cookie_name],
            );
          const project_version = await dependencies.resolve_project_version({
            organization_id: auth.organization.id,
            actor_org_user_id: auth.org_user.id,
            project_id: params.data.project_id,
            version_slug: params.data.version_slug,
          });
          const result = await dependencies.documentation_service.create_site({
            organization_id: auth.organization.id,
            project_id: params.data.project_id,
            project_version_id: project_version.id,
            actor_org_user_id: auth.org_user.id,
            idempotency_key: idempotency_key.data,
            data: body.data,
          });
          return reply.status(201).send(result);
        } catch {
          return reply
            .status(401)
            .send(error_response("unauthenticated", "Authentication required"));
        }
      },
    );
  };
};
