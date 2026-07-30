import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";
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
  DocumentationImportApplyRequestSchema,
  DocumentationAssetLifecycleRequestSchema,
  DocumentationAssetUpdateRequestSchema,
  DocumentationCreateSnippetRequestSchema,
  DocumentationSnippetContentRequestSchema,
  DocumentationSnippetLifecycleRequestSchema,
  DocumentationUpdateSnippetRequestSchema,
  RevokePublishLinkRequestSchema,
} from "@repo/types";
import {
  DOCUMENTATION_MARKDOWN_UPLOAD_MAX_BYTES,
  DOCUMENTATION_PACKAGE_UPLOAD_MAX_BYTES,
} from "@repo/constants";
import {
  normalize_documentation_blocks,
  normalize_documentation_path,
  validate_documentation_snippet_blocks,
} from "@repo/documentation-domain";
import { z } from "zod";
import { web_session_cookie_name } from "../authentication/session-cookie";
import type { AuthContext } from "../authentication/session.service";
import { public_viewer_cookie_name } from "../publish/public-viewer-cookie";
import { error_response } from "../shared/http-errors";
import { get_public_web_url } from "../../config/public-web-url.config";
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
const ImportInspectionParamsSchema = ParamsSchema.extend({
  inspection_id: z.string().trim().min(1),
}).strict();
const ImportInspectionQuerySchema = z
  .object({ kind: z.enum(["page_markdown", "site_package"]) })
  .strict();
const DraftPageExportQuerySchema = z
  .object({
    source: z.literal("draft"),
    expected_page_version: z.coerce.number().int().positive(),
    expected_draft_version: z.coerce.number().int().positive(),
  })
  .strict();
const ImmutableExportQuerySchema = z.union([
  z
    .object({
      source: z.literal("revision"),
      revision_number: z.coerce.number().int().positive(),
    })
    .strict(),
  z
    .object({
      source: z.literal("publication"),
      site_publication_id: z.string().trim().min(1),
    })
    .strict(),
]);
const PageExportQuerySchema = z.union([
  DraftPageExportQuerySchema,
  ...ImmutableExportQuerySchema.options,
]);
const PackageExportQuerySchema = z.union([
  z
    .object({
      source: z.literal("draft"),
      expected_site_version: z.coerce.number().int().positive(),
      expected_draft_version: z.coerce.number().int().positive(),
    })
    .strict(),
  ...ImmutableExportQuerySchema.options,
]);
const OpenApiExportQuerySchema = z.union([
  z
    .object({
      source: z.literal("draft"),
      expected_source_version: z.coerce.number().int().positive(),
    })
    .strict(),
  ...ImmutableExportQuerySchema.options,
]);
const PageParamsSchema = SiteParamsSchema.extend({
  page_id: z.string().trim().min(1),
}).strict();
const ThreadParamsSchema = SiteParamsSchema.extend({
  thread_id: z.string().trim().min(1),
}).strict();
const RevisionParamsSchema = SiteParamsSchema.extend({
  revision_number: z.coerce.number().int().positive(),
}).strict();
const AssetParamsSchema = SiteParamsSchema.extend({
  asset_id: z.string().trim().min(1),
}).strict();
const SnippetParamsSchema = SiteParamsSchema.extend({
  snippet_id: z.string().trim().min(1),
}).strict();
const SnippetListQuerySchema = z
  .object({
    status: z.enum(["active", "archived", "all"]).default("active"),
    cursor: z.string().trim().min(1).optional(),
  })
  .strict();
const AssetListQuerySchema = z
  .object({
    source: z.enum(["documentation", "capture", "all"]).default("all"),
    status: z.enum(["active", "archived", "all"]).default("active"),
    include_archived_versions: z.coerce.boolean().default(false),
    include_in_use: z.coerce.boolean().default(false),
    cursor: z.string().trim().min(1).optional(),
  })
  .strict();
const ArtifactPublicationQuerySchema = z
  .object({
    artifact_type: z.enum(["guide", "interactive_demo"]),
    cursor: z.string().trim().min(1).optional(),
  })
  .strict();
const PublicationEntryParamsSchema = SiteParamsSchema.extend({
  link_id: z.string().trim().min(1),
  entry_id: z.string().trim().min(1),
}).strict();
const PublicationLinkParamsSchema = SiteParamsSchema.extend({
  link_id: z.string().trim().min(1),
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
const PublicAssetParamsSchema = z
  .object({
    slug: z.string().trim().min(1).max(80),
    version_slug: z.string().trim().min(1).optional(),
    asset_id: z.string().trim().min(1),
  })
  .strict();

const unwrap_idempotent_result = (result: unknown) => {
  if (!result || typeof result !== "object")
    return { body: result, replayed: false };
  const { idempotent_replay, ...body } = result as Record<string, unknown> & {
    idempotent_replay?: boolean;
  };
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
      nodes: z.infer<
        typeof DocumentationNavigationUpdateRequestSchema
      >["nodes"];
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
    search_draft: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      query: string;
    }) => Promise<unknown[]>;
    list_revisions: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
    }) => Promise<unknown[]>;
    list_publications: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
    }) => Promise<unknown[]>;
    list_publish_links: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
    }) => Promise<unknown[]>;
    get_revision: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      site_id: string;
      actor_org_user_id: string;
      revision_number: number;
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
    revoke_publish_link: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      link_id: string;
      expected_link_version: number;
    }) => Promise<unknown>;
    resolve_public_site: (input: {
      slug: string;
      version_slug: string | null;
      viewer_token?: string;
    }) => Promise<unknown>;
    authorize_portability: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      capability:
        | "documentation.read"
        | "documentation.write"
        | "documentation.site.manage";
    }) => Promise<void>;
    inspect_import: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      idempotency_key: string;
      kind: "page_markdown" | "site_package";
      stream: NodeJS.ReadableStream;
      mime_type: "text/markdown" | "text/plain" | "application/zip";
      original_name: string;
    }) => Promise<unknown>;
    get_import_inspection: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      inspection_id: string;
    }) => Promise<unknown>;
    cancel_import_inspection: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      inspection_id: string;
      idempotency_key: string;
    }) => Promise<unknown>;
    apply_import: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      inspection_id: string;
      idempotency_key: string;
      data: z.infer<typeof DocumentationImportApplyRequestSchema>;
    }) => Promise<unknown>;
    export_site_package: (
      input: {
        organization_id: string;
        project_id: string;
        project_version_id: string;
        actor_org_user_id: string;
        site_id: string;
        version_slug: string;
      } & z.infer<typeof PackageExportQuerySchema>,
    ) => Promise<{
      bytes: Buffer;
      filename: string;
      mime_type: string;
    } | null>;
    export_page_markdown: (
      input: {
        organization_id: string;
        project_id: string;
        project_version_id: string;
        actor_org_user_id: string;
        site_id: string;
        page_id: string;
      } & z.infer<typeof PageExportQuerySchema>,
    ) => Promise<{
      bytes: Buffer;
      filename: string;
      mime_type: string;
    } | null>;
    export_openapi_source: (
      input: {
        organization_id: string;
        project_id: string;
        project_version_id: string;
        actor_org_user_id: string;
        site_id: string;
      } & z.infer<typeof OpenApiExportQuerySchema>,
    ) => Promise<{
      bytes: Buffer;
      filename: string;
      mime_type: string;
    } | null>;
    inspect_openapi: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      stream: NodeJS.ReadableStream;
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
    upload_asset: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      bytes: Buffer;
      mime_type: "image/png" | "image/jpeg" | "image/webp";
      original_name: string;
    }) => Promise<unknown>;
    get_asset_file: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      asset_id: string;
    }) => Promise<{
      stream: NodeJS.ReadableStream;
      mime_type: string;
      size_bytes: number;
    } | null>;
    get_capture_asset_file: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      asset_id: string;
    }) => Promise<{
      stream: NodeJS.ReadableStream;
      mime_type: string;
      size_bytes: number;
    } | null>;
    get_public_asset_file: (input: {
      slug: string;
      version_slug: string | null;
      asset_id: string;
      viewer_token?: string;
    }) => Promise<{
      stream: NodeJS.ReadableStream;
      mime_type: string;
      size_bytes: number;
    } | null>;
    get_public_capture_asset_file: (input: {
      slug: string;
      version_slug: string | null;
      asset_id: string;
      viewer_token?: string;
    }) => Promise<{
      stream: NodeJS.ReadableStream;
      mime_type: string;
      size_bytes: number;
    } | null>;
    list_snippets: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      status: "active" | "archived" | "all";
      cursor?: string;
    }) => Promise<unknown[]>;
    create_snippet: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      idempotency_key: string;
      data: z.infer<typeof DocumentationCreateSnippetRequestSchema>;
    }) => Promise<unknown>;
    get_snippet: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      snippet_id: string;
    }) => Promise<unknown>;
    update_snippet: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      snippet_id: string;
      data: z.infer<typeof DocumentationUpdateSnippetRequestSchema>;
    }) => Promise<unknown>;
    save_snippet: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      snippet_id: string;
      expected_snippet_version: number;
      blocks: z.infer<
        typeof DocumentationSnippetContentRequestSchema
      >["blocks"];
    }) => Promise<unknown>;
    transition_snippet: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      snippet_id: string;
      expected_version: number;
      transition: "archive" | "restore";
    }) => Promise<unknown>;
    list_assets: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      source: "documentation" | "capture" | "all";
      status: "active" | "archived" | "all";
      include_archived_versions: boolean;
      include_in_use: boolean;
      cursor?: string;
    }) => Promise<unknown[]>;
    update_asset: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      asset_id: string;
      expected_version: number;
      name: string;
    }) => Promise<unknown>;
    transition_asset: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id: string;
      asset_id: string;
      expected_version: number;
      transition: "archive" | "restore";
    }) => Promise<unknown>;
    list_artifact_publications: (input: {
      organization_id: string;
      project_id: string;
      project_version_id: string;
      actor_org_user_id: string;
      site_id?: string;
      artifact_type: "guide" | "interactive_demo";
      cursor?: string;
    }) => Promise<unknown[]>;
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
      reply: FastifyReply,
    ) => {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : null;
      if (code === "documentation_import_busy") {
        const retryAfter =
          typeof error === "object" &&
          error !== null &&
          "retry_after_seconds" in error &&
          typeof error.retry_after_seconds === "number"
            ? Math.max(1, Math.ceil(error.retry_after_seconds))
            : 1;
        return reply
          .header("Retry-After", String(retryAfter))
          .status(429)
          .send(
            error_response(
              code,
              "Documentation import is temporarily unavailable",
            ),
          );
      }
      if (
        code === "documentation_row_version_conflict" ||
        code === "documentation_path_conflict" ||
        code === "documentation_path_retired" ||
        code === "documentation_comment_transition_invalid" ||
        code === "documentation_publication_busy" ||
        code === "documentation_rollback_invalid" ||
        code === "documentation_snippet_conflict" ||
        code === "documentation_snippet_name_conflict" ||
        code === "documentation_snippet_archived" ||
        code === "documentation_asset_conflict" ||
        code === "documentation_asset_name_conflict" ||
        code === "documentation_asset_archived" ||
        code === "documentation_asset_source_unavailable" ||
        code === "documentation_reference_protected" ||
        code === "documentation_import_conflict" ||
        code === "documentation_import_consumed" ||
        code === "documentation_import_not_ready" ||
        code === "documentation_export_source_unavailable"
      )
        return reply
          .status(409)
          .send(
            error_response(code, "Documentation changed; reload and retry"),
          );
      if (
        code === "documentation_navigation_invalid" ||
        code === "documentation_redirect_cycle" ||
        code === "documentation_path_invalid" ||
        code === "documentation_asset_invalid" ||
        code === "documentation_comment_anchor_missing" ||
        code === "documentation_comment_invalid" ||
        code === "documentation_revision_invalid" ||
        code === "documentation_internal_link_broken" ||
        code === "documentation_table_invalid" ||
        code === "documentation_tabs_invalid" ||
        code === "documentation_asset_source_unsupported" ||
        code === "documentation_artifact_publication_type_mismatch" ||
        code === "documentation_content_unsafe" ||
        code === "documentation_snippet_nested" ||
        code === "documentation_import_invalid" ||
        code === "documentation_import_unsupported_version"
      )
        return reply
          .status(400)
          .send(error_response(code, "Documentation request is invalid"));
      if (
        code === "documentation_page_limit_exceeded" ||
        code === "documentation_comment_limit_exceeded" ||
        code === "documentation_snippet_limit_exceeded" ||
        code === "documentation_asset_limit_exceeded" ||
        code === "documentation_content_limit_exceeded" ||
        code === "documentation_import_limit_exceeded"
      )
        return reply
          .status(413)
          .send(error_response(code, "Documentation limit exceeded"));
      if (code === "publish_link_password_required")
        return reply
          .status(401)
          .send(error_response(code, "A valid viewer session is required"));
      if (code === "publish_link_not_public")
        return reply
          .status(403)
          .send(error_response(code, "Publish Link is restricted"));
      if (code === "publish_link_expired")
        return reply
          .status(410)
          .send(error_response(code, "Publish Link has expired"));
      if (code === "documentation_import_expired")
        return reply
          .status(410)
          .send(error_response(code, "Documentation import has expired"));
      if (code === "publish_link_not_found")
        return reply
          .status(404)
          .send(error_response(code, "Publish Link was not found"));
      if (
        code === "documentation_snippet_not_found" ||
        code === "documentation_artifact_publication_not_found" ||
        code === "documentation_import_not_found"
      )
        return reply
          .status(404)
          .send(error_response(code, "Documentation resource was not found"));
      throw error;
    };

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const query = SnippetListQuerySchema.safeParse(request.query);
        if (!params.success || !query.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const snippets = await dependencies.documentation_service.list_snippets(
          {
            ...scope,
            site_id: params.data.site_id,
            ...query.data,
          },
        );
        return reply.send({ snippets });
      },
    );
    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const body = DocumentationCreateSnippetRequestSchema.safeParse(
          request.body,
        );
        const key = IdempotencyKeySchema.safeParse(
          request.headers["idempotency-key"],
        );
        if (!params.success || !body.success || !key.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          const result =
            await dependencies.documentation_service.create_snippet({
              ...scope,
              site_id: params.data.site_id,
              idempotency_key: key.data,
              data: body.data,
            });
          const command = unwrap_idempotent_result(result);
          return reply
            .status(command.replayed ? 200 : 201)
            .send({ snippet: command.body });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );
    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets/:snippet_id",
      async (request, reply) => {
        const params = SnippetParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(404)
            .send(
              error_response(
                "documentation_snippet_not_found",
                "Snippet was not found",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const snippet = await dependencies.documentation_service.get_snippet({
          ...scope,
          site_id: params.data.site_id,
          snippet_id: params.data.snippet_id,
        });
        if (!snippet)
          return reply
            .status(404)
            .send(
              error_response(
                "documentation_snippet_not_found",
                "Snippet was not found",
              ),
            );
        return reply.send({ snippet });
      },
    );
    fastify.patch(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets/:snippet_id",
      async (request, reply) => {
        const params = SnippetParamsSchema.safeParse(request.params);
        const body = DocumentationUpdateSnippetRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          const snippet =
            await dependencies.documentation_service.update_snippet({
              ...scope,
              site_id: params.data.site_id,
              snippet_id: params.data.snippet_id,
              data: body.data,
            });
          return reply.send({ snippet });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );
    fastify.put(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets/:snippet_id/content",
      async (request, reply) => {
        const params = SnippetParamsSchema.safeParse(request.params);
        const body = DocumentationSnippetContentRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          validate_documentation_snippet_blocks(body.data.blocks);
          const snippet = await dependencies.documentation_service.save_snippet(
            {
              ...scope,
              site_id: params.data.site_id,
              snippet_id: params.data.snippet_id,
              ...body.data,
            },
          );
          return reply.send({ snippet });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );
    fastify.patch(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/snippets/:snippet_id/lifecycle",
      async (request, reply) => {
        const params = SnippetParamsSchema.safeParse(request.params);
        const body = DocumentationSnippetLifecycleRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          const snippet =
            await dependencies.documentation_service.transition_snippet({
              ...scope,
              site_id: params.data.site_id,
              snippet_id: params.data.snippet_id,
              ...body.data,
            });
          return reply.send({ snippet });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );
    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const query = AssetListQuerySchema.safeParse(request.query);
        if (!params.success || !query.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const assets = await dependencies.documentation_service.list_assets({
          ...scope,
          site_id: params.data.site_id,
          ...query.data,
        });
        return reply.send({ assets });
      },
    );
    fastify.patch(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/:asset_id",
      async (request, reply) => {
        const params = AssetParamsSchema.safeParse(request.params);
        const body = DocumentationAssetUpdateRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          const asset = await dependencies.documentation_service.update_asset({
            ...scope,
            site_id: params.data.site_id,
            asset_id: params.data.asset_id,
            ...body.data,
          });
          return reply.send({ asset });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );
    fastify.patch(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/:asset_id/lifecycle",
      async (request, reply) => {
        const params = AssetParamsSchema.safeParse(request.params);
        const body = DocumentationAssetLifecycleRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          const asset =
            await dependencies.documentation_service.transition_asset({
              ...scope,
              site_id: params.data.site_id,
              asset_id: params.data.asset_id,
              ...body.data,
            });
          return reply.send({ asset });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );
    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-artifact-publications",
      async (request, reply) => {
        const params = ParamsSchema.safeParse(request.params);
        const query = ArtifactPublicationQuerySchema.safeParse(request.query);
        if (!params.success || !query.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const publications =
          await dependencies.documentation_service.list_artifact_publications({
            ...scope,
            ...query.data,
          });
        return reply.send({ publications });
      },
    );
    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/artifact-publications",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const query = ArtifactPublicationQuerySchema.safeParse(request.query);
        if (!params.success || !query.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const publications =
          await dependencies.documentation_service.list_artifact_publications({
            ...scope,
            site_id: params.data.site_id,
            ...query.data,
          });
        return reply.send({ publications });
      },
    );
    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites",
      async (request, reply) => {
        const params = ParamsSchema.safeParse(request.params);
        if (!params.success) {
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
          const auth = await dependencies.auth_service.get_current_auth_context(
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
          return reply
            .status(401)
            .send(error_response("unauthenticated", "Authentication required"));
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites",
      async (request, reply) => {
        const params = ParamsSchema.safeParse(request.params);
        const body = DocumentationCreateSiteRequestSchema.safeParse(
          request.body,
        );
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
          const auth = await dependencies.auth_service.get_current_auth_context(
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
            return reply
              .status(409)
              .send(
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
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections",
      async (request, reply) => {
        const params = ParamsSchema.safeParse(request.params);
        const query = ImportInspectionQuerySchema.safeParse(request.query);
        const key = IdempotencyKeySchema.safeParse(
          request.headers["idempotency-key"],
        );
        if (
          !params.success ||
          !query.success ||
          !key.success ||
          !request.isMultipart()
        )
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation import request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          await dependencies.documentation_service.authorize_portability({
            ...scope,
            capability: "documentation.write",
          });
          let inspection: unknown;
          let fileSeen = false;
          for await (const part of request.parts({
            limits: {
              files: 1,
              fields: 0,
              fileSize:
                query.data.kind === "page_markdown"
                  ? DOCUMENTATION_MARKDOWN_UPLOAD_MAX_BYTES
                  : DOCUMENTATION_PACKAGE_UPLOAD_MAX_BYTES,
            },
          })) {
            if (part.type !== "file" || fileSeen) {
              part.type === "file" && part.file.resume();
              throw Object.assign(
                new Error("Exactly one import File is required"),
                { code: "documentation_import_invalid" },
              );
            }
            fileSeen = true;
            const mime =
              query.data.kind === "page_markdown" &&
              (part.mimetype === "text/markdown" ||
                part.mimetype === "text/plain") &&
              /\.md$/iu.test(part.filename)
                ? part.mimetype
                : query.data.kind === "site_package" &&
                    part.mimetype === "application/zip" &&
                    /\.zip$/iu.test(part.filename)
                  ? part.mimetype
                  : null;
            if (!mime) {
              part.file.resume();
              throw Object.assign(
                new Error("Documentation import media is unsupported"),
                { code: "documentation_import_invalid" },
              );
            }
            inspection =
              await dependencies.documentation_service.inspect_import({
                ...scope,
                idempotency_key: key.data,
                kind: query.data.kind,
                stream: part.file,
                mime_type: mime,
                original_name: part.filename,
              });
          }
          if (!fileSeen || !inspection)
            throw Object.assign(
              new Error("Exactly one import File is required"),
              { code: "documentation_import_invalid" },
            );
          const {
            idempotent_replay: replayed = false,
            ...body
          } = inspection as Record<string, unknown> & {
            idempotent_replay?: boolean;
          };
          return reply
            .status(replayed ? 200 : 201)
            .send({ inspection: body });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    const send_private_download = (
      reply: FastifyReply,
      download: { bytes: Buffer; filename: string; mime_type: string },
    ) =>
      reply
        .header("Content-Type", download.mime_type)
        .header("Content-Length", String(download.bytes.length))
        .header(
          "Content-Disposition",
          `attachment; filename="${download.filename.replace(/["\\\r\n]/gu, "-")}"`,
        )
        .header("Cache-Control", "private, no-store")
        .header("X-Content-Type-Options", "nosniff")
        .send(download.bytes);

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/export/package.zip",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const query = PackageExportQuerySchema.safeParse(request.query);
        if (!params.success || !query.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation export request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          await dependencies.documentation_service.authorize_portability({
            ...scope,
            capability: "documentation.read",
          });
          const download =
            await dependencies.documentation_service.export_site_package({
              ...scope,
              site_id: params.data.site_id,
              version_slug: params.data.version_slug,
              ...query.data,
            });
          if (!download)
            return reply
              .status(404)
              .send(
                error_response(
                  "documentation_export_not_found",
                  "Documentation export source was not found",
                ),
              );
          return send_private_download(reply, download);
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/export/markdown",
      async (request, reply) => {
        const params = PageParamsSchema.safeParse(request.params);
        const query = PageExportQuerySchema.safeParse(request.query);
        if (!params.success || !query.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation export request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          await dependencies.documentation_service.authorize_portability({
            ...scope,
            capability: "documentation.read",
          });
          const download =
            await dependencies.documentation_service.export_page_markdown({
              ...scope,
              site_id: params.data.site_id,
              page_id: params.data.page_id,
              ...query.data,
            });
          if (!download)
            return reply
              .status(404)
              .send(
                error_response(
                  "documentation_export_not_found",
                  "Documentation export source was not found",
                ),
              );
          return send_private_download(reply, download);
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source/export",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const query = OpenApiExportQuerySchema.safeParse(request.query);
        if (!params.success || !query.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation export request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          await dependencies.documentation_service.authorize_portability({
            ...scope,
            capability: "documentation.read",
          });
          const download =
            await dependencies.documentation_service.export_openapi_source({
              ...scope,
              site_id: params.data.site_id,
              ...query.data,
            });
          if (!download)
            return reply
              .status(404)
              .send(
                error_response(
                  "documentation_export_not_found",
                  "Documentation export source was not found",
                ),
              );
          return send_private_download(reply, download);
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id",
      async (request, reply) => {
        const params = ImportInspectionParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation import request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          await dependencies.documentation_service.authorize_portability({
            ...scope,
            capability: "documentation.read",
          });
          const inspection =
            await dependencies.documentation_service.get_import_inspection({
              ...scope,
              inspection_id: params.data.inspection_id,
            });
          if (!inspection)
            return reply
              .status(404)
              .send(
                error_response(
                  "documentation_import_not_found",
                  "Documentation import inspection was not found",
                ),
              );
          return reply.send({ inspection });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.delete(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id",
      async (request, reply) => {
        const params = ImportInspectionParamsSchema.safeParse(request.params);
        const key = IdempotencyKeySchema.safeParse(
          request.headers["idempotency-key"],
        );
        if (!params.success || !key.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation import request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          await dependencies.documentation_service.authorize_portability({
            ...scope,
            capability: "documentation.write",
          });
          await dependencies.documentation_service.cancel_import_inspection({
            ...scope,
            inspection_id: params.data.inspection_id,
            idempotency_key: key.data,
          });
          return reply.status(204).send();
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-import-inspections/:inspection_id/apply",
      async (request, reply) => {
        const params = ImportInspectionParamsSchema.safeParse(request.params);
        const body = DocumentationImportApplyRequestSchema.safeParse(
          request.body,
        );
        const key = IdempotencyKeySchema.safeParse(
          request.headers["idempotency-key"],
        );
        if (!params.success || !body.success || !key.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation import request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          await dependencies.documentation_service.authorize_portability({
            ...scope,
            capability:
              body.data.target.mode === "create_site"
                ? "documentation.site.manage"
                : "documentation.write",
          });
          const application =
            await dependencies.documentation_service.apply_import({
              ...scope,
              inspection_id: params.data.inspection_id,
              idempotency_key: key.data,
              data: body.data,
            });
          const command = unwrap_idempotent_result(application);
          return reply
            .status(command.replayed ? 200 : 201)
            .send({ application: command.body });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/inspections",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success || !request.isMultipart())
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          await dependencies.documentation_service.authorize_portability({
            ...scope,
            capability: "documentation.write",
          });
          let upload:
            | {
                inspection: unknown;
                mime_type: "application/json" | "application/yaml";
                original_name: string;
              }
            | undefined;
          for await (const part of request.parts({
            limits: { files: 1, fields: 0, fileSize: 10 * 1024 * 1024 },
          })) {
            if (part.type !== "file" || upload)
              return reply
                .status(400)
                .send(
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
              return reply
                .status(400)
                .send(
                  error_response(
                    "documentation_openapi_invalid",
                    "OpenAPI File must be JSON or YAML",
                  ),
                );
            upload = {
              inspection:
                await dependencies.documentation_service.inspect_openapi({
                  ...scope,
                  site_id: params.data.site_id,
                  stream: part.file,
                  mime_type: normalizedMime,
                  original_name: part.filename,
                }),
              mime_type: normalizedMime,
              original_name: part.filename,
            };
          }
          if (!upload)
            return reply
              .status(400)
              .send(
                error_response(
                  "invalid_documentation_request",
                  "Exactly one OpenAPI File is required",
                ),
              );
          return reply.status(201).send({ inspection: upload.inspection });
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
          return reply
            .status(400)
            .send(
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
          return reply.status(command.replayed ? 200 : 201).send(command.body);
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success || !request.isMultipart())
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Exactly one Documentation image is required",
              ),
            );
        let upload:
          | {
              bytes: Buffer;
              mime_type: "image/png" | "image/jpeg" | "image/webp";
              original_name: string;
            }
          | undefined;
        for await (const part of request.parts({
          limits: { files: 1, fields: 0, fileSize: 10 * 1024 * 1024 },
        })) {
          if (part.type !== "file" || upload)
            return reply
              .status(400)
              .send(
                error_response(
                  "documentation_asset_invalid",
                  "Documentation image is invalid",
                ),
              );
          if (
            !["image/png", "image/jpeg", "image/webp"].includes(part.mimetype)
          )
            return reply
              .status(415)
              .send(
                error_response(
                  "documentation_asset_type_unsupported",
                  "Documentation image type is unsupported",
                ),
              );
          upload = {
            bytes: await part.toBuffer(),
            mime_type: part.mimetype as
              | "image/png"
              | "image/jpeg"
              | "image/webp",
            original_name: part.filename,
          };
        }
        if (!upload)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Exactly one Documentation image is required",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          const asset = await dependencies.documentation_service.upload_asset({
            ...scope,
            site_id: params.data.site_id,
            ...upload,
          });
          return reply.status(201).send({ asset });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/capture/:asset_id/file",
      async (request, reply) => {
        const params = AssetParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(404)
            .send(
              error_response(
                "documentation_asset_not_found",
                "Documentation Asset was not found",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const file =
          await dependencies.documentation_service.get_capture_asset_file({
            ...scope,
            site_id: params.data.site_id,
            asset_id: params.data.asset_id,
          });
        if (!file)
          return reply
            .status(404)
            .send(
              error_response(
                "documentation_asset_not_found",
                "Documentation Asset was not found",
              ),
            );
        reply
          .header("content-type", file.mime_type)
          .header("content-length", String(file.size_bytes));
        return reply.send(file.stream);
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/assets/:asset_id/file",
      async (request, reply) => {
        const params = AssetParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(404)
            .send(
              error_response(
                "documentation_asset_not_found",
                "Documentation Asset was not found",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const file = await dependencies.documentation_service.get_asset_file({
          ...scope,
          site_id: params.data.site_id,
          asset_id: params.data.asset_id,
        });
        if (!file)
          return reply
            .status(404)
            .send(
              error_response(
                "documentation_asset_not_found",
                "Documentation Asset was not found",
              ),
            );
        reply
          .header("content-type", file.mime_type)
          .header("content-length", String(file.size_bytes));
        return reply.send(file.stream);
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/openapi/source",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(400)
            .send(
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
          return reply
            .status(404)
            .send(
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
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const comments = await dependencies.documentation_service.list_comments(
          {
            ...scope,
            site_id: params.data.site_id,
            page_id: params.data.page_id,
          },
        );
        return reply.send({ comments });
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        const body = DocumentationCreatePageRequestSchema.safeParse(
          request.body,
        );
        const key = IdempotencyKeySchema.safeParse(
          request.headers["idempotency-key"],
        );
        if (!params.success || !body.success || !key.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const auth = await dependencies.auth_service.get_current_auth_context(
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
            return reply
              .status(409)
              .send(
                error_response(
                  error.code,
                  "Idempotency key was already used for a different request",
                ),
              );
          return reply
            .status(404)
            .send(
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
        const body = DocumentationPageContentRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const auth = await dependencies.auth_service.get_current_auth_context(
            request.cookies[web_session_cookie_name],
          );
          const version = await dependencies.resolve_project_version({
            organization_id: auth.organization.id,
            actor_org_user_id: auth.org_user.id,
            project_id: params.data.project_id,
            version_slug: params.data.version_slug,
          });
          normalize_documentation_blocks(body.data.blocks);
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
          if (error instanceof DocumentationRowVersionConflictError)
            return reply.status(409).send({
              ...error_response(
                "documentation_row_version_conflict",
                "Documentation Page changed; preserve local work and reconcile",
              ),
              latest_page: error.latest_page,
            });
          return documentation_error(error, reply);
        }
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id",
      async (request, reply) => {
        const params = PageParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const auth = await dependencies.auth_service.get_current_auth_context(
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
          return reply
            .status(404)
            .send(
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
        const body = DocumentationPageUpdateRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply
            .status(400)
            .send(
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
          return reply
            .status(400)
            .send(
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
          return reply
            .status(400)
            .send(
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
          return reply.send({ routing });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/pages/:page_id/comments",
      async (request, reply) => {
        const params = PageParamsSchema.safeParse(request.params);
        const body = DocumentationCommentThreadCreateRequestSchema.safeParse(
          request.body,
        );
        const key = IdempotencyKeySchema.safeParse(
          request.headers["idempotency-key"],
        );
        if (!params.success || !body.success || !key.success)
          return reply
            .status(400)
            .send(
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
        const body = DocumentationCommentReplyCreateRequestSchema.safeParse(
          request.body,
        );
        const key = IdempotencyKeySchema.safeParse(
          request.headers["idempotency-key"],
        );
        if (!params.success || !body.success || !key.success)
          return reply
            .status(400)
            .send(
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
        const body = DocumentationCommentTransitionRequestSchema.safeParse(
          request.body,
        );
        if (!params.success || !body.success)
          return reply
            .status(400)
            .send(
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
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const results = await dependencies.documentation_service.search_draft({
          ...scope,
          site_id: params.data.site_id,
          query: query.data.q,
        });
        return reply.send({
          results: (results as Array<Record<string, unknown>>).map(
            (result) => ({
              ...result,
              portal_path: `/projects/${params.data.project_id}/versions/${params.data.version_slug}/documentation/${params.data.site_id}/pages/${String(result.page_id)}`,
            }),
          ),
        });
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/preview",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(400)
            .send(
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
          return reply
            .status(404)
            .send(
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
          return reply
            .status(400)
            .send(
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
          return reply
            .status(400)
            .send(
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
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/revisions/:revision_number",
      async (request, reply) => {
        const params = RevisionParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(400)
            .send(
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
          project_version_id: scope.project_version_id,
          site_id: params.data.site_id,
          revision_number: params.data.revision_number,
        });
        if (!revision)
          return reply
            .status(404)
            .send(
              error_response(
                "documentation_revision_not_found",
                "Documentation Revision was not found",
              ),
            );
        return reply.send({ revision });
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publications",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const publications =
          await dependencies.documentation_service.list_publications({
            ...scope,
            site_id: params.data.site_id,
          });
        return reply.send({ publications });
      },
    );

    fastify.get(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links",
      async (request, reply) => {
        const params = SiteParamsSchema.safeParse(request.params);
        if (!params.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        const scope = await authorized_scope(request, params.data);
        const publish_links =
          await dependencies.documentation_service.list_publish_links({
            ...scope,
            site_id: params.data.site_id,
          });
        return reply.send({ publish_links });
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
          return reply
            .status(400)
            .send(
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
          return reply.status(command.replayed ? 200 : 201).send(command.body);
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
          return reply
            .status(400)
            .send(
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

    fastify.post(
      "/api/v1/projects/:project_id/versions/:version_slug/documentation-sites/:site_id/publish-links/:link_id/revoke",
      async (request, reply) => {
        const params = PublicationLinkParamsSchema.safeParse(request.params);
        const body = RevokePublishLinkRequestSchema.safeParse(request.body);
        if (!params.success || !body.success)
          return reply
            .status(400)
            .send(
              error_response(
                "invalid_documentation_request",
                "Documentation request is invalid",
              ),
            );
        try {
          const scope = await authorized_scope(request, params.data);
          return await dependencies.documentation_service.revoke_publish_link({
            ...scope,
            site_id: params.data.site_id,
            link_id: params.data.link_id,
            expected_link_version: body.data.expected_link_version,
          });
        } catch (error) {
          return documentation_error(error, reply);
        }
      },
    );

    const public_site = async (
      params: unknown,
      reply: FastifyReply,
      viewer_token?: string,
    ) => {
      const parsed = PublicDocumentationParamsSchema.safeParse(params);
      if (!parsed.success) return null;
      try {
        const site =
          await dependencies.documentation_service.resolve_public_site({
            slug: parsed.data.slug,
            version_slug: parsed.data.version_slug ?? null,
            viewer_token,
          });
        return { params: parsed.data, site };
      } catch (error) {
        documentation_error(error, reply);
        return null;
      }
    };
    const public_site_response = (site: unknown): Record<string, unknown> => {
      if (!site || typeof site !== "object") return {};
      const response = { ...(site as Record<string, unknown>) };
      delete response.search_documents;
      return response;
    };

    fastify.get(
      "/api/v1/public/publish-links/:slug/documentation",
      async (request, reply) => {
        const result = await public_site(
          request.params,
          reply,
          request.cookies?.[public_viewer_cookie_name],
        );
        if (reply.sent) return reply;
        if (!result?.site)
          return reply
            .status(404)
            .send(
              error_response(
                "publish_link_not_found",
                "Publish Link was not found",
              ),
            );
        return reply.send(public_site_response(result.site));
      },
    );
    fastify.get(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation",
      async (request, reply) => {
        const result = await public_site(
          request.params,
          reply,
          request.cookies?.[public_viewer_cookie_name],
        );
        if (reply.sent) return reply;
        if (!result?.site)
          return reply
            .status(404)
            .send(
              error_response(
                "publish_link_not_found",
                "Publish Link was not found",
              ),
            );
        return reply.send(public_site_response(result.site));
      },
    );

    const register_public_page = (path: string) =>
      fastify.get(path, async (request, reply) => {
        const result = await public_site(
          request.params,
          reply,
          request.cookies?.[public_viewer_cookie_name],
        );
        if (reply.sent) return reply;
        if (!result?.site)
          return reply
            .status(404)
            .send(
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
          return reply
            .status(404)
            .send(
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
        if (page) return reply.send({ ...public_site_response(site), page });
        const alias = site.aliases.find(
          (candidate) => candidate.former_path === requestedPath,
        );
        const redirect = site.redirects.find(
          (candidate) => candidate.source_path === requestedPath,
        );
        if (redirect?.outcome === "gone")
          return reply
            .status(410)
            .send(
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
        return reply
          .status(404)
          .send(
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
        const result = await public_site(
          request.params,
          reply,
          request.cookies?.[public_viewer_cookie_name],
        );
        if (reply.sent) return reply;
        if (!query.success || !result?.site)
          return reply
            .status(query.success ? 404 : 400)
            .send(
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
          search_documents: Array<{
            page_id: string;
            title: string;
            description: string | null;
            canonical_path: string;
            search_text: string;
          }>;
        };
        const needle = query.data.q.toLocaleLowerCase();
        const results = site.search_documents
          .filter((document) =>
            document.search_text.toLocaleLowerCase().includes(needle),
          )
          .slice(0, 50)
          .map((document) => ({
            page_id: document.page_id,
            title: document.title,
            excerpt: document.description ?? document.search_text.slice(0, 240),
            canonical_path: document.canonical_path,
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
          return reply
            .status(404)
            .send(
              error_response(
                "documentation_operation_not_found",
                "OpenAPI operation was not found",
              ),
            );
        let site: unknown;
        try {
          site = await dependencies.documentation_service.resolve_public_site({
            slug: params.data.slug,
            version_slug: params.data.version_slug ?? null,
            viewer_token: request.cookies?.[public_viewer_cookie_name],
          });
        } catch (error) {
          documentation_error(error, reply);
          return reply;
        }
        if (!site)
          return reply
            .status(404)
            .send(
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
          return reply
            .status(404)
            .send(
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

    const register_public_asset = (
      path: string,
      source: "documentation" | "capture",
    ) =>
      fastify.get(path, async (request, reply) => {
        const params = PublicAssetParamsSchema.safeParse(request.params);
        if (!params.success) return reply.status(404).send();
        let file;
        try {
          const load =
            source === "capture"
              ? dependencies.documentation_service.get_public_capture_asset_file
              : dependencies.documentation_service.get_public_asset_file;
          file = await load({
            slug: params.data.slug,
            version_slug: params.data.version_slug ?? null,
            asset_id: params.data.asset_id,
            viewer_token: request.cookies?.[public_viewer_cookie_name],
          });
        } catch (error) {
          documentation_error(error, reply);
          return reply;
        }
        if (!file) return reply.status(404).send();
        reply
          .header("content-type", file.mime_type)
          .header("content-length", String(file.size_bytes));
        return reply.send(file.stream);
      });
    register_public_asset(
      "/api/v1/public/publish-links/:slug/documentation/assets/:asset_id/file",
      "documentation",
    );
    register_public_asset(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation/assets/:asset_id/file",
      "documentation",
    );
    register_public_asset(
      "/api/v1/public/publish-links/:slug/documentation/assets/capture/:asset_id/file",
      "capture",
    );
    register_public_asset(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation/assets/capture/:asset_id/file",
      "capture",
    );
    register_public_operation(
      "/api/v1/public/publish-links/:slug/versions/:version_slug/documentation/operations/:operation_key",
    );

    const register_public_metadata = (
      path: string,
      kind: "sitemap" | "robots",
    ) =>
      fastify.get(path, async (request, reply) => {
        const result = await public_site(
          request.params,
          reply,
          request.cookies?.[public_viewer_cookie_name],
        );
        if (reply.sent) return reply;
        if (!result?.site) return reply.status(404).send();
        const site = result.site as {
          pages: Array<{ canonical_path: string }>;
        };
        if (kind === "robots")
          return reply.type("text/plain").send("User-agent: *\nAllow: /\n");
        const urls = site.pages
          .map((page) => {
            const origin =
              get_public_web_url() ??
              `${request.protocol}://${request.hostname}`;
            return `<url><loc>${origin}/docs/${result.params.slug}${result.params.version_slug ? `/versions/${result.params.version_slug}` : ""}/${page.canonical_path}</loc></url>`;
          })
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
