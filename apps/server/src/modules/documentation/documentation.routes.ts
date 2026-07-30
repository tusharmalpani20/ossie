import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import {
  DocumentationCommentReplyCreateRequestSchema,
  DocumentationCommentThreadCreateRequestSchema,
  DocumentationCommentTransitionRequestSchema,
  DocumentationCreatePageRequestSchema,
  DocumentationCreateSiteRequestSchema,
  DocumentationNavigationUpdateRequestSchema,
  DocumentationPageContentRequestSchema,
  DocumentationPageUpdateRequestSchema,
  DocumentationRoutingUpdateRequestSchema,
  DocumentationCreatePublicationRequestSchema,
  DocumentationCreateRevisionRequestSchema,
  DocumentationRollbackPublicationRequestSchema,
  DocumentationApplyOpenApiRequestSchema,
} from "@repo/types";
import {
  build_documentation_search_document,
  normalize_documentation_path,
} from "@repo/documentation-domain";
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
const ThreadParamsSchema = SiteParamsSchema.extend({
  thread_id: z.string().trim().min(1),
}).strict();
const RevisionParamsSchema = SiteParamsSchema.extend({
  revision_id: z.string().trim().min(1),
}).strict();
const PublicationEntryParamsSchema = SiteParamsSchema.extend({
  link_id: z.string().trim().min(1),
  entry_id: z.string().trim().min(1),
}).strict();
const PublicDocumentationParamsSchema = z
  .object({
    slug: z.string().trim().min(1).max(80),
    version_slug: z.string().trim().min(1).optional(),
    "*": z.string().optional(),
  })
  .strict();
const PublicOperationParamsSchema = z
  .object({
    slug: z.string().trim().min(1).max(80),
    version_slug: z.string().trim().min(1).optional(),
    operation_key: z.string().trim().min(1).max(255),
  })
  .strict();

const unwrap_idempotent_result = (result: unknown) => {
  if (!result || typeof result !== "object")
    return { body: result, replayed: false };
  const {
    idempotent_replay,
    ...body
  } = result as Record<string, unknown> & { idempotent_replay?: boolean };
  return { body, replayed: idempotent_replay === true };
};

const searchable_page = (page: {
  title: string;
  description: string | null;
  blocks: Array<Record<string, unknown>>;
}) => {
  const headings: string[] = [];
  const body: string[] = [];
  for (const block of page.blocks) {
    if (block.kind === "heading" && typeof block.text === "string")
      headings.push(block.text);
    for (const field of ["text", "code", "label", "alt_text", "caption"]) {
      const value = block[field];
      if (typeof value === "string") body.push(value);
    }
    if (Array.isArray(block.items))
      for (const item of block.items) {
        if (
          typeof item === "object" &&
          item !== null &&
          "text" in item &&
          typeof item.text === "string"
        )
          body.push(item.text);
      }
  }
  return build_documentation_search_document({
    title: page.title,
    description: page.description,
    headings,
    body_text: body.join(" "),
  });
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
    update_page: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      page_id: string;
      data: z.infer<typeof DocumentationPageUpdateRequestSchema>;
    }) => Promise<unknown>;
    replace_navigation: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      expected_version: number;
      nodes: z.infer<typeof DocumentationNavigationUpdateRequestSchema>["nodes"];
    }) => Promise<unknown>;
    replace_routing: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      expected_version: number;
      rules: z.infer<typeof DocumentationRoutingUpdateRequestSchema>["rules"];
    }) => Promise<unknown>;
    create_comment_thread: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      page_id: string;
      idempotency_key: string;
      body: string;
      block_anchor_id: string | null;
      mentioned_project_membership_ids: string[];
    }) => Promise<unknown>;
    list_comments: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      page_id: string;
    }) => Promise<unknown[]>;
    create_comment_reply: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      thread_id: string;
      idempotency_key: string;
      body: string;
      mentioned_project_membership_ids: string[];
    }) => Promise<unknown>;
    transition_comment: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      thread_id: string;
      expected_version: number;
      transition: "resolve" | "reopen";
    }) => Promise<unknown>;
    get_preview: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
    }) => Promise<unknown>;
    list_revisions: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
    }) => Promise<unknown[]>;
    get_revision: (input: {
      organization_id: string;
      project_id: string;
      actor_org_user_id: string;
      site_revision_id: string;
    }) => Promise<unknown>;
    create_revision: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      idempotency_key: string;
      expected_draft_version: number;
    }) => Promise<unknown>;
    create_publication: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      idempotency_key: string;
      revision_id: string;
      link: z.infer<typeof DocumentationCreatePublicationRequestSchema>["link"];
    }) => Promise<unknown>;
    rollback_publication: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      link_id: string;
      entry_id: string;
      idempotency_key: string;
      site_publication_id: string;
      expected_entry_version: number;
    }) => Promise<unknown>;
    resolve_public_site: (input: {
      slug: string;
      version_slug: string | null;
    }) => Promise<unknown>;
    inspect_openapi: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      bytes: Buffer;
      mime_type: "application/json" | "application/yaml";
      original_name: string;
    }) => Promise<unknown>;
    apply_openapi_source: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      idempotency_key: string;
      inspection_id: string;
      expected_source_version: number | null;
    }) => Promise<unknown>;
    get_openapi_source: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
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
    const authorized_scope = async (
      request: {
        cookies: Record<string, string | undefined>;
      },
      params: z.infer<typeof ParamsSchema>,
    ) => {
      const auth = await dependencies.auth_service.get_current_auth_context(
        request.cookies[web_session_cookie_name],
      );
      const version = await dependencies.resolve_project_version({
        organization_id: auth.organization.id,
        actor_org_user_id: auth.org_user.id,
        project_id: params.project_id,
        version_slug: params.version_slug,
      });
      return {
        organization_id: auth.organization.id,
        actor_org_user_id: auth.org_user.id,
        project_id: params.project_id,
        project_version_id: version.id,
      };
    };
    const documentation_error = (
      error: unknown,
      reply: { status: (status: number) => { send: (body: unknown) => unknown } },
    ) => {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : null;
      if (
        code === "documentation_row_version_conflict" ||
        code === "documentation_path_conflict" ||
        code === "documentation_path_retired" ||
        code === "documentation_comment_transition_invalid" ||
        code === "documentation_publication_busy" ||
        code === "documentation_rollback_invalid"
      )
        return reply
          .status(409)
          .send(error_response(code, "Documentation changed; reload and retry"));
      if (
        code === "documentation_navigation_invalid" ||
        code === "documentation_redirect_cycle" ||
        code === "documentation_path_invalid" ||
        code === "documentation_comment_anchor_missing" ||
        code === "documentation_comment_invalid" ||
        code === "documentation_revision_invalid" ||
        code === "documentation_internal_link_broken"
      )
        return reply
          .status(400)
          .send(error_response(code, "Documentation request is invalid"));
      throw error;
    };
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
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/inspections",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success || !request.isMultipart())
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        try {
          let upload:
            | {
                bytes: Buffer;
                mime_type: "application/json" | "application/yaml";
                original_name: string;
              }
            | undefined;
          for await (const part of request.parts({
            limits: { files: 1, fields: 0, fileSize: 10 * 1024 * 1024 },
          })) {
            if (part.type !== "file" || upload)
              return reply.status(400).send(
                error_response(
                  "invalid_documentation_request",
                  "Exactly one OpenAPI File is required",
                ),
              );
            const normalizedMime =
              part.mimetype === "application/json"
                ? "application/json"
                : part.mimetype === "application/yaml" ||
                    part.mimetype === "text/yaml" ||
                    /\.ya?ml$/iu.test(part.filename)
                  ? "application/yaml"
                  : null;
            if (!normalizedMime)
              return reply.status(400).send(
                error_response(
                  "documentation_openapi_invalid",
                  "OpenAPI File must be JSON or YAML",
                ),
              );
            upload = {
              bytes: await part.toBuffer(),
              mime_type: normalizedMime,
              original_name: part.filename,
            };
          }
          if (!upload)
            return reply.status(400).send(
              error_response(
                "invalid_documentation_request",
                "Exactly one OpenAPI File is required",
              ),
            );
          const scope = await authorized_scope(request, params.data);
          const inspection =
            await dependencies.documentation_service.inspect_openapi({
              ...scope,
              site_id: params.data.site_id,
              ...upload,
            });
          return reply.status(201).send({ inspection });
        } catch (error) {
          const code =
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "documentation_openapi_invalid"
              ? error.code
              : null;
          if (code)
            return reply
              .status(400)
              .send(error_response(code, "OpenAPI File is invalid"));
          return documentation_error(error, reply);
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/sources",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const body = DocumentationApplyOpenApiRequestSchema.safeParse(
          request.body,
        );
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
          const scope = await authorized_scope(request, params.data);
          const result =
            await dependencies.documentation_service.apply_openapi_source({
              ...scope,
              site_id: params.data.site_id,
              idempotency_key: key.data,
              ...body.data,
            });
          const command = unwrap_idempotent_result(result);
          return reply
            .status(command.replayed ? 200 : 201)
            .send(command.body);
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        const scope = await authorized_scope(request, params.data);
        const source =
          await dependencies.documentation_service.get_openapi_source({
            ...scope,
            site_id: params.data.site_id,
          });
        if (!source)
          return reply.status(404).send(
            error_response(
              "documentation_openapi_not_found",
              "OpenAPI Source was not found",
            ),
          );
        return reply.send(source);
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/comments",
      async (request, reply) => {
        const params = PageParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        const scope = await authorized_scope(request, params.data);
        const comments = await dependencies.documentation_service.list_comments({
          ...scope,
          site_id: params.data.site_id,
          page_id: params.data.page_id,
        });
        return reply.send({ comments });
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

    fastify.patch(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id",
      async (request, reply) => {
        const params = PageParamsSchema.safeParse(request.params);
        const body = DocumentationPageUpdateRequestSchema.safeParse(request.body);
        if (!params.success || !body.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        try {
          const scope = await authorized_scope(request, params.data);
          const page = await dependencies.documentation_service.update_page({
            ...scope,
            site_id: params.data.site_id,
            page_id: params.data.page_id,
            data: body.data,
          });
          return reply.send({ page });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.put(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/navigation",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const body = DocumentationNavigationUpdateRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        try {
          const scope = await authorized_scope(request, params.data);
          const navigation =
            await dependencies.documentation_service.replace_navigation({
              ...scope,
              site_id: params.data.site_id,
              expected_version: body.data.expected_version,
              nodes: body.data.nodes,
            });
          return reply.send({ navigation });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.put(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/routing",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const body = DocumentationRoutingUpdateRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        try {
          const scope = await authorized_scope(request, params.data);
          const routing =
            await dependencies.documentation_service.replace_routing({
              ...scope,
              site_id: params.data.site_id,
              expected_version: body.data.expected_version,
              rules: body.data.rules,
            });
          return reply.send(routing);
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/comments",
      async (request, reply) => {
        const params = PageParamsSchema.safeParse(request.params);
        const body =
          DocumentationCommentThreadCreateRequestSchema.safeParse(request.body);
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
          const scope = await authorized_scope(request, params.data);
          const result =
            await dependencies.documentation_service.create_comment_thread({
              ...scope,
              site_id: params.data.site_id,
              page_id: params.data.page_id,
              idempotency_key: key.data,
              ...body.data,
            });
          const command = unwrap_idempotent_result(result);
          return reply
            .status(command.replayed ? 200 : 201)
            .send({ thread: command.body });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/comments/:thread_id/replies",
      async (request, reply) => {
        const params = ThreadParamsSchema.safeParse(request.params);
        const body =
          DocumentationCommentReplyCreateRequestSchema.safeParse(request.body);
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
          const scope = await authorized_scope(request, params.data);
          const result =
            await dependencies.documentation_service.create_comment_reply({
              ...scope,
              site_id: params.data.site_id,
              thread_id: params.data.thread_id,
              idempotency_key: key.data,
              ...body.data,
            });
          const command = unwrap_idempotent_result(result);
          return reply
            .status(command.replayed ? 200 : 201)
            .send({ reply: command.body });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.patch(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/comments/:thread_id",
      async (request, reply) => {
        const params = ThreadParamsSchema.safeParse(request.params);
        const body =
          DocumentationCommentTransitionRequestSchema.safeParse(request.body);
        if (!params.success || !body.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        try {
          const scope = await authorized_scope(request, params.data);
          const thread =
            await dependencies.documentation_service.transition_comment({
              ...scope,
              site_id: params.data.site_id,
              thread_id: params.data.thread_id,
              ...body.data,
            });
          return reply.send({ thread });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/search",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const query = z
          .object({ q: z.string().trim().min(1).max(200) })
          .strict()
          .safeParse(request.query);
        if (!params.success || !query.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        const scope = await authorized_scope(request, params.data);
        const preview = await dependencies.documentation_service.get_preview({
          ...scope,
          site_id: params.data.site_id,
        });
        if (!preview)
          return reply.status(404).send(
            error_response(
              "documentation_site_not_found",
              "Documentation Site was not found",
            ),
          );
        const snapshot = preview as {
          pages: Array<{
            id: string;
            title: string;
            description: string | null;
            canonical_path: string;
            blocks: Array<Record<string, unknown>>;
          }>;
        };
        const needle = query.data.q.toLocaleLowerCase();
        const results = snapshot.pages
          .map((page) => ({ page, document: searchable_page(page) }))
          .filter(({ document }) =>
            document.text.toLocaleLowerCase().includes(needle),
          )
          .slice(0, 50)
          .map(({ page, document }) => ({
            page_id: page.id,
            title: page.title,
            excerpt: document.description ?? document.text.slice(0, 240),
            canonical_path: page.canonical_path,
            portal_path: `/projects/${params.data.project_id}/versions/${params.data.version_slug}/documentation/${params.data.site_id}/pages/${page.id}`,
          }));
        return reply.send({ results });
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/preview",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        const scope = await authorized_scope(request, params.data);
        const preview = await dependencies.documentation_service.get_preview({
          ...scope,
          site_id: params.data.site_id,
        });
        if (!preview)
          return reply.status(404).send(
            error_response(
              "documentation_site_not_found",
              "Documentation Site was not found",
            ),
          );
        return reply.send({ preview });
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        const scope = await authorized_scope(request, params.data);
        const revisions =
          await dependencies.documentation_service.list_revisions({
            ...scope,
            site_id: params.data.site_id,
          });
        return reply.send({ revisions });
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const body = DocumentationCreateRevisionRequestSchema.safeParse(
          request.body,
        );
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
          const scope = await authorized_scope(request, params.data);
          const result =
            await dependencies.documentation_service.create_revision({
              ...scope,
              site_id: params.data.site_id,
              idempotency_key: key.data,
              expected_draft_version: body.data.expected_draft_version,
            });
          const command = unwrap_idempotent_result(result);
          return reply
            .status(command.replayed ? 200 : 201)
            .send({ revision: command.body });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions/:revision_id",
      async (request, reply) => {
        const params = RevisionParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply.status(400).send(
            error_response(
              "invalid_documentation_request",
              "Documentation request is invalid",
            ),
          );
        const scope = await authorized_scope(request, params.data);
        const revision = await dependencies.documentation_service.get_revision({
          organization_id: scope.organization_id,
          actor_org_user_id: scope.actor_org_user_id,
          project_id: scope.project_id,
          site_revision_id: params.data.revision_id,
        });
        if (!revision)
          return reply.status(404).send(
            error_response(
              "documentation_revision_not_found",
              "Documentation Revision was not found",
            ),
          );
        return reply.send({ revision });
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const body = DocumentationCreatePublicationRequestSchema.safeParse(
          request.body,
        );
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
          const scope = await authorized_scope(request, params.data);
          const result =
            await dependencies.documentation_service.create_publication({
              ...scope,
              site_id: params.data.site_id,
              idempotency_key: key.data,
              ...body.data,
            });
          const command = unwrap_idempotent_result(result);
          return reply
            .status(command.replayed ? 200 : 201)
            .send(command.body);
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/entries/:entry_id/rollback",
      async (request, reply) => {
        const params = PublicationEntryParamsSchema.safeParse(request.params);
        const body = DocumentationRollbackPublicationRequestSchema.safeParse(
          request.body,
        );
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
          const scope = await authorized_scope(request, params.data);
          const result =
            await dependencies.documentation_service.rollback_publication({
              ...scope,
              site_id: params.data.site_id,
              link_id: params.data.link_id,
              entry_id: params.data.entry_id,
              idempotency_key: key.data,
              ...body.data,
            });
          const command = unwrap_idempotent_result(result);
          return reply.send(command.body);
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    const public_site = async (params: unknown) => {
      const parsed = PublicDocumentationParamsSchema.safeParse(params);
      if (!parsed.success) return null;
      const site = await dependencies.documentation_service.resolve_public_site({
        slug: parsed.data.slug,
        version_slug: parsed.data.version_slug ?? null,
      });
      return { params: parsed.data, site };
    };

    fastify.get(
      "/api/v1/public/publish-links/:slug/documentation",
      async (request, reply) => {
        const result = await public_site(request.params);
        if (!result?.site)
          return reply.status(404).send(
            error_response(
              "publish_link_not_found",
              "Publish Link was not found",
            ),
          );
        return reply.send(result.site);
      },
    );
    fastify.get(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation",
      async (request, reply) => {
        const result = await public_site(request.params);
        if (!result?.site)
          return reply.status(404).send(
            error_response(
              "publish_link_not_found",
              "Publish Link was not found",
            ),
          );
        return reply.send(result.site);
      },
    );

    const register_public_page = (path: string) =>
      fastify.get(path, async (request, reply) => {
        const result = await public_site(request.params);
        if (!result?.site)
          return reply.status(404).send(
            error_response(
              "publish_link_not_found",
              "Publish Link was not found",
            ),
          );
        let requestedPath: string;
        try {
          requestedPath = normalize_documentation_path(
            result.params["*"] ?? "",
          );
        } catch {
          return reply.status(404).send(
            error_response(
              "documentation_page_not_found",
              "Documentation Page was not found",
            ),
          );
        }
        const site = result.site as {
          pages: Array<{
            id: string;
            canonical_path: string;
            [key: string]: unknown;
          }>;
          aliases: Array<{
            former_path: string;
            documentation_page_id: string;
          }>;
          redirects: Array<{
            source_path: string;
            outcome: "redirect" | "gone";
            target_page_id: string | null;
          }>;
          [key: string]: unknown;
        };
        const page = site.pages.find(
          (candidate) => candidate.canonical_path === requestedPath,
        );
        if (page) return reply.send({ ...site, page });
        const alias = site.aliases.find(
          (candidate) => candidate.former_path === requestedPath,
        );
        const redirect = site.redirects.find(
          (candidate) => candidate.source_path === requestedPath,
        );
        if (redirect?.outcome === "gone")
          return reply.status(410).send(
            error_response(
              "documentation_page_gone",
              "Documentation Page is gone",
            ),
          );
        const targetPageId =
          alias?.documentation_page_id ?? redirect?.target_page_id;
        const target = site.pages.find(
          (candidate) => candidate.id === targetPageId,
        );
        if (target)
          return reply
            .status(308)
            .header(
              "location",
              result.params.version_slug
                ? `/docs/${result.params.slug}/versions/${result.params.version_slug}/${target.canonical_path}`
                : `/docs/${result.params.slug}/${target.canonical_path}`,
            )
            .send();
        return reply.status(404).send(
          error_response(
            "documentation_page_not_found",
            "Documentation Page was not found",
          ),
        );
      });
    register_public_page(
      "/api/v1/public/publish-links/:slug/documentation/pages/*",
    );
    register_public_page(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation/pages/*",
    );

    const register_public_search = (path: string) =>
      fastify.get(path, async (request, reply) => {
        const query = z
          .object({ q: z.string().trim().min(1).max(200) })
          .strict()
          .safeParse(request.query);
        const result = await public_site(request.params);
        if (!query.success || !result?.site)
          return reply.status(query.success ? 404 : 400).send(
            error_response(
              query.success
                ? "publish_link_not_found"
                : "invalid_documentation_request",
              query.success
                ? "Publish Link was not found"
                : "Documentation request is invalid",
            ),
          );
        const site = result.site as {
          pages: Array<{
            id: string;
            title: string;
            description: string | null;
            canonical_path: string;
            blocks: Array<Record<string, unknown>>;
          }>;
        };
        const needle = query.data.q.toLocaleLowerCase();
        const results = site.pages
          .map((page) => ({ page, document: searchable_page(page) }))
          .filter(({ document }) =>
            document.text.toLocaleLowerCase().includes(needle),
          )
          .slice(0, 50)
          .map(({ page, document }) => ({
            page_id: page.id,
            title: page.title,
            excerpt: document.description ?? document.text.slice(0, 240),
            canonical_path: page.canonical_path,
          }));
        return reply.send({ results });
      });
    register_public_search(
      "/api/v1/public/publish-links/:slug/documentation/search",
    );
    register_public_search(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation/search",
    );

    const register_public_operation = (path: string) =>
      fastify.get(path, async (request, reply) => {
        const params = PublicOperationParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply.status(404).send(
            error_response(
              "documentation_operation_not_found",
              "OpenAPI operation was not found",
            ),
          );
        const site = await dependencies.documentation_service.resolve_public_site(
          {
            slug: params.data.slug,
            version_slug: params.data.version_slug ?? null,
          },
        );
        if (!site)
          return reply.status(404).send(
            error_response(
              "publish_link_not_found",
              "Publish Link was not found",
            ),
          );
        const snapshot = site as {
          openapi_operations: Array<{
            destination_key: string;
            [key: string]: unknown;
          }>;
        };
        const operation = snapshot.openapi_operations.find(
          (candidate) =>
            candidate.destination_key === params.data.operation_key,
        );
        if (!operation)
          return reply.status(404).send(
            error_response(
              "documentation_operation_not_found",
              "OpenAPI operation was not found",
            ),
          );
        return reply.send({ operation });
      });
    register_public_operation(
      "/api/v1/public/publish-links/:slug/documentation/operations/:operation_key",
    );
    register_public_operation(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation/operations/:operation_key",
    );

    const register_public_metadata = (
      path: string,
      kind: "sitemap" | "robots",
    ) =>
      fastify.get(path, async (request, reply) => {
        const result = await public_site(request.params);
        if (!result?.site) return reply.status(404).send();
        const site = result.site as {
          pages: Array<{ canonical_path: string }>;
        };
        if (kind === "robots")
          return reply
            .type("text/plain")
            .send("User-agent: *\nAllow: /\n");
        const urls = site.pages
          .map(
            (page) =>
              `<url><loc>/docs/${result.params.slug}${result.params.version_slug ? `/versions/${result.params.version_slug}` : ""}/${page.canonical_path}</loc></url>`,
          )
          .join("");
        return reply
          .type("application/xml")
          .send(`<?xml version="1.0"?><urlset>${urls}</urlset>`);
      });
    register_public_metadata(
      "/api/v1/public/publish-links/:slug/documentation/sitemap.xml",
      "sitemap",
    );
    register_public_metadata(
      "/api/v1/public/publish-links/:slug/documentation/robots.txt",
      "robots",
    );
    register_public_metadata(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation/sitemap.xml",
      "sitemap",
    );
    register_public_metadata(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation/robots.txt",
      "robots",
    );
  };
};
