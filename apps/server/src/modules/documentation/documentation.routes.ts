import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import {
  DocumentationCreatePageRequestSchema,
  DocumentationCreateSiteRequestSchema,
  DocumentationPageContentRequestSchema,
} from "@repo/types";
import { z } from "zod";
import { web_session_cookie_name } from "../authentication/session-cookie";
import type { AuthContext } from "../authentication/session.service";
import { error_response } from "../shared/http-errors";
import {
  DocumentationIdempotencyConflictError,
  DocumentationRowVersionConflictError,
} from "./documentation.service";

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
const SiteParamsSchema = ParamsSchema.extend({
  site_id: z.string().trim().min(1),
}).strict();
const PageParamsSchema = SiteParamsSchema.extend({
  page_id: z.string().trim().min(1),
}).strict();

const unwrap_idempotent_result = (result: unknown) => {
  if (!result || typeof result !== "object")
    return { body: result, replayed: false };
  const {
    idempotent_replay,
    ...body
  } = result as Record<string, unknown> & { idempotent_replay?: boolean };
  return { body, replayed: idempotent_replay === true };
};

export type DocumentationRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session?: string) => Promise<AuthContext>;
  };
  documentation_service: {
    list_sites: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
    }) => Promise<unknown[]>;
    create_site: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      idempotency_key: string;
      data: z.infer<typeof DocumentationCreateSiteRequestSchema>;
    }) => Promise<unknown>;
    create_page: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      idempotency_key: string;
      data: z.infer<typeof DocumentationCreatePageRequestSchema>;
    }) => Promise<unknown>;
    get_page: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      page_id: string;
    }) => Promise<unknown>;
    save_page: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      page_id: string;
      expected_page_version: number;
      blocks: unknown[];
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
    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites",
      async (request, reply) => {
        const params = ParamsSchema.safeParse(request.params);
        if (!params.success) {
          return reply.status(400).send(
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
          const documentation_sites =
            await dependencies.documentation_service.list_sites({
              organization_id: auth.organization.id,
              actor_org_user_id: auth.org_user.id,
              project_id: params.data.project_id,
              project_version_id: project_version.id,
            });
          return reply.send({ documentation_sites });
        } catch {
          return reply.status(401).send(
            error_response("unauthenticated", "Authentication required"),
          );
        }
      },
    );

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
          const command = unwrap_idempotent_result(result);
          return reply.status(command.replayed ? 200 : 201).send(command.body);
        } catch (error) {
          if (error instanceof DocumentationIdempotencyConflictError)
            return reply.status(409).send(
              error_response(
                error.code,
                "Idempotency key was already used for a different request",
              ),
            );
          return reply
            .status(401)
            .send(error_response("unauthenticated", "Authentication required"));
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const body = DocumentationCreatePageRequestSchema.safeParse(request.body);
        const key = IdempotencyKeySchema.safeParse(
          request.headers["idempotency-key"],
        );
        if (!params.success || !body.success || !key.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        try {
          const auth =
            await dependencies.auth_service.get_current_auth_context(
              request.cookies[web_session_cookie_name],
            );
          const version = await dependencies.resolve_project_version({
            organization_id: auth.organization.id,
            actor_org_user_id: auth.org_user.id,
            project_id: params.data.project_id,
            version_slug: params.data.version_slug,
          });
          const result = await dependencies.documentation_service.create_page({
            organization_id: auth.organization.id,
            actor_org_user_id: auth.org_user.id,
            project_id: params.data.project_id,
            project_version_id: version.id,
            site_id: params.data.site_id,
            idempotency_key: key.data,
            data: body.data,
          });
          const command = unwrap_idempotent_result(result);
          return reply
            .status(command.replayed ? 200 : 201)
            .send({ page: command.body });
        } catch (error) {
          if (error instanceof DocumentationIdempotencyConflictError)
            return reply.status(409).send(
              error_response(
                error.code,
                "Idempotency key was already used for a different request",
              ),
            );
          return reply.status(404).send(
            error_response(
              "documentation_site_not_found",
              "Documentation Site was not found",
            ),
          );
        }
      },
    );

    fastify.put(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/content",
      async (request, reply) => {
        const params = PageParamsSchema.safeParse(request.params);
        const body = DocumentationPageContentRequestSchema.safeParse(request.body);
        if (!params.success || !body.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        try {
          const auth =
            await dependencies.auth_service.get_current_auth_context(
              request.cookies[web_session_cookie_name],
            );
          const version = await dependencies.resolve_project_version({
            organization_id: auth.organization.id,
            actor_org_user_id: auth.org_user.id,
            project_id: params.data.project_id,
            version_slug: params.data.version_slug,
          });
          const result = await dependencies.documentation_service.save_page({
            organization_id: auth.organization.id,
            actor_org_user_id: auth.org_user.id,
            project_id: params.data.project_id,
            project_version_id: version.id,
            site_id: params.data.site_id,
            page_id: params.data.page_id,
            expected_page_version: body.data.expected_page_version,
            blocks: body.data.blocks,
          });
          return reply.send({ page: result });
        } catch (error) {
          if (!(error instanceof DocumentationRowVersionConflictError)) throw error;
          return reply.status(409).send(
            {
              ...error_response(
                "documentation_row_version_conflict",
                "Documentation Page changed; preserve local work and reconcile",
              ),
              latest_page: error.latest_page,
            },
          );
        }
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id",
      async (request, reply) => {
        const params = PageParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        try {
          const auth =
            await dependencies.auth_service.get_current_auth_context(
              request.cookies[web_session_cookie_name],
            );
          const version = await dependencies.resolve_project_version({
            organization_id: auth.organization.id,
            actor_org_user_id: auth.org_user.id,
            project_id: params.data.project_id,
            version_slug: params.data.version_slug,
          });
          const page = await dependencies.documentation_service.get_page({
            organization_id: auth.organization.id,
            actor_org_user_id: auth.org_user.id,
            project_id: params.data.project_id,
            project_version_id: version.id,
            site_id: params.data.site_id,
            page_id: params.data.page_id,
          });
          if (!page) throw new Error("not found");
          return reply.send({ page });
        } catch {
          return reply.status(404).send(
            error_response(
              "documentation_page_not_found",
              "Documentation Page was not found",
            ),
          );
        }
      },
    );
  };
};
