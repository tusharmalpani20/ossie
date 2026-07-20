import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";
import {
  CreatePublishLinkRequestSchema,
  CreatePublicViewerSessionRequestSchema,
  PublicationHistoryQuerySchema,
  PublicationVersionQuerySchema,
  PublishArtifactRequestSchema,
  PublishLinkListQuerySchema,
  PublicPublishLinkQuerySchema,
  ReplacePublishLinkManifestRequestSchema,
  RevokePublishLinkRequestSchema,
  RollbackPublishLinkEntryRequestSchema,
  UpdatePublishLinkSettingsRequestSchema,
} from "@repo/types/publish";
import {
  ArtifactEditionNotEditableError,
  ArtifactEditionNotFoundError,
  ArtifactRevisionEditionConflictError,
  ArtifactRevisionWorkingDraftConflictError,
} from "../artifact-revision/artifact-revision.service";
import {
  ArtifactNotPublishableError,
  ArtifactHasNoPublishableContentError,
  PublicationRowVersionConflictError,
  PublishLinkRollbackInvalidError,
  PublishLinkExpiredError,
  PublishLinkNotPublicError,
  PublishLinkPasswordRequiredError,
  PublishLinkNotFoundError,
  InvalidPublicViewerPasswordError,
  InvalidPublishPasswordSettingsError,
} from "@repo/publish-domain";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { web_session_cookie_name } from "../authentication/session-cookie";
import { error_response, unauthorized_response } from "../shared/http-errors";
import type {
  ArtifactScope,
  PublishAuthContext,
  PublishService,
} from "./publish.service";
import {
  PublishedAssetNotFoundError,
  UnsupportedPublishedAssetStorageProviderError,
} from "./publish.service";
import {
  public_viewer_cookie_name,
  set_public_viewer_cookie,
} from "./public-viewer-cookie";

export type PublishRouteDependencies = {
  auth_service: {
    get_current_auth_context(session_token?: string): Promise<AuthContext>;
  };
  publish_service: PublishService;
};
type Params = {
  project_id: string;
  guide_id?: string;
  interactive_demo_id?: string;
  link_id?: string;
  entry_id?: string;
};
type PublicParams = {
  slug: string;
  version_slug?: string;
  capture_asset_id?: string;
};
const auth_context = (auth: AuthContext): PublishAuthContext => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});
const invalid = (reply: FastifyReply) =>
  reply
    .status(400)
    .send(error_response("invalid_request", "Request is invalid"));
const has_error_code = (error: unknown, code: string) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === code;

export const build_publish_routes =
  (dependencies: PublishRouteDependencies): FastifyPluginAsync =>
  async (fastify: FastifyInstance) => {
    const require_auth = async (token?: string) =>
      auth_context(
        await dependencies.auth_service.get_current_auth_context(token),
      );
    const handle = (error: unknown, reply: FastifyReply) => {
      if (error instanceof UnauthenticatedSessionError)
        return reply.status(401).send(unauthorized_response());
      if (error instanceof ArtifactEditionNotFoundError)
        return reply
          .status(404)
          .send(
            error_response(
              "artifact_edition_not_found",
              "Artifact Edition was not found",
            ),
          );
      if (
        error instanceof ArtifactEditionNotEditableError ||
        error instanceof ArtifactNotPublishableError
      )
        return reply
          .status(409)
          .send(
            error_response(
              "artifact_not_publishable",
              "Artifact is not publishable",
            ),
          );
      if (error instanceof ArtifactHasNoPublishableContentError)
        return reply
          .status(400)
          .send(
            error_response(
              "artifact_has_no_publishable_content",
              "Artifact has no publishable content",
            ),
          );
      if (
        error instanceof ArtifactRevisionEditionConflictError ||
        error instanceof ArtifactRevisionWorkingDraftConflictError ||
        error instanceof PublicationRowVersionConflictError
      )
        return reply
          .status(409)
          .send(
            error_response(
              "row_version_conflict",
              "The resource changed; reload and retry",
            ),
          );
      if (error instanceof PublishLinkRollbackInvalidError)
        return reply
          .status(409)
          .send(
            error_response(
              "publish_link_rollback_invalid",
              "Publish Link entry can only roll back to an older Publication from the same Edition",
            ),
          );
      if (error instanceof PublishLinkNotPublicError)
        return reply
          .status(403)
          .send(
            error_response(
              "publish_link_not_public",
              "Publish Link is restricted",
            ),
          );
      if (
        error instanceof PublishLinkNotFoundError ||
        has_error_code(error, "publish_link_not_found")
      )
        return reply
          .status(404)
          .send(
            error_response(
              "publish_link_not_found",
              "Publish Link was not found",
            ),
          );
      if (error instanceof PublishLinkExpiredError)
        return reply
          .status(410)
          .send(
            error_response("publish_link_expired", "Publish Link has expired"),
          );
      if (error instanceof PublishLinkPasswordRequiredError)
        return reply
          .status(401)
          .send(
            error_response(
              "publish_link_password_required",
              "A valid viewer session is required",
            ),
          );
      if (error instanceof InvalidPublicViewerPasswordError)
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_publish_link_password",
              "Password is invalid",
            ),
          );
      if (error instanceof InvalidPublishPasswordSettingsError)
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_publish_password_settings",
              "Password must be between 8 and 128 characters",
            ),
          );
      if (error instanceof PublishedAssetNotFoundError)
        return reply
          .status(404)
          .send(
            error_response(
              "published_asset_not_found",
              "Published Asset was not found",
            ),
          );
      if (error instanceof UnsupportedPublishedAssetStorageProviderError)
        return reply
          .status(501)
          .send(
            error_response(
              "unsupported_storage_provider",
              "Storage provider is unsupported",
            ),
          );
      throw error;
    };
    const scope = async (
      request: {
        params: Params;
        query: unknown;
        cookies: Record<string, string | undefined>;
      },
      type: "guide" | "interactive_demo",
    ) => {
      const query = PublicationVersionQuerySchema.passthrough().safeParse(
        request.query,
      );
      if (!query.success) return null;
      return {
        auth: await require_auth(request.cookies?.[web_session_cookie_name]),
        project_id: request.params.project_id,
        project_version_id: query.data.project_version_id,
        artifact_type: type,
        artifact_id:
          type === "guide"
            ? request.params.guide_id!
            : request.params.interactive_demo_id!,
      } satisfies ArtifactScope;
    };
    const register_artifact = (type: "guide" | "interactive_demo") => {
      const root =
        type === "guide"
          ? "/projects/:project_id/guides/:guide_id"
          : "/projects/:project_id/interactive-demos/:interactive_demo_id";
      fastify.get(`${root}/publications`, async (request, reply) => {
        try {
          const parsed = PublicationHistoryQuerySchema.safeParse(request.query);
          if (!parsed.success) return invalid(reply);
          const base = await scope(request as never, type);
          if (!base) return invalid(reply);
          return dependencies.publish_service.list_publications({
            ...base,
            limit: parsed.data.limit,
            before_publication_sequence:
              parsed.data.before_publication_sequence,
          });
        } catch (e) {
          return handle(e, reply);
        }
      });
      fastify.post(`${root}/publications`, async (request, reply) => {
        try {
          const base = await scope(request as never, type);
          const body = PublishArtifactRequestSchema.safeParse(request.body);
          if (!base || !body.success) return invalid(reply);
          return reply.status(201).send(
            await dependencies.publish_service.publish({
              ...base,
              ...body.data,
            }),
          );
        } catch (e) {
          return handle(e, reply);
        }
      });
      fastify.get(`${root}/publish-links`, async (request, reply) => {
        try {
          const parsed = PublishLinkListQuerySchema.safeParse(request.query);
          if (!parsed.success) return invalid(reply);
          const base = await scope(request as never, type);
          if (!base) return invalid(reply);
          return dependencies.publish_service.list_publish_links({
            ...base,
            status: parsed.data.status,
            limit: parsed.data.limit,
            cursor: parsed.data.before_created_at
              ? {
                  created_at: parsed.data.before_created_at,
                  id: parsed.data.before_id!,
                }
              : null,
          });
        } catch (e) {
          return handle(e, reply);
        }
      });
      fastify.post(`${root}/publish-links`, async (request, reply) => {
        try {
          const base = await scope(request as never, type);
          const body = CreatePublishLinkRequestSchema.safeParse(request.body);
          if (!base || !body.success) return invalid(reply);
          return reply.status(201).send({
            publish_link:
              await dependencies.publish_service.create_publish_link({
                ...base,
                ...body.data,
              }),
          });
        } catch (e) {
          return handle(e, reply);
        }
      });
      fastify.patch(
        `${root}/publish-links/:link_id`,
        async (request, reply) => {
          try {
            const base = await scope(request as never, type);
            const body = UpdatePublishLinkSettingsRequestSchema.safeParse(
              request.body,
            );
            if (!base || !body.success) return invalid(reply);
            const result =
              await dependencies.publish_service.update_publish_link({
                ...base,
                link_id: (request.params as Params).link_id!,
                settings: body.data,
              });
            return result
              ? { publish_link: result }
              : reply
                  .status(404)
                  .send(
                    error_response(
                      "publish_link_not_found",
                      "Publish Link was not found",
                    ),
                  );
          } catch (e) {
            return handle(e, reply);
          }
        },
      );
      fastify.put(
        `${root}/publish-links/:link_id/entries`,
        async (request, reply) => {
          try {
            const base = await scope(request as never, type);
            const body = ReplacePublishLinkManifestRequestSchema.safeParse(
              request.body,
            );
            if (!base || !body.success) return invalid(reply);
            const result =
              await dependencies.publish_service.replace_publish_link_manifest({
                ...base,
                link_id: (request.params as Params).link_id!,
                manifest: body.data,
              });
            return result
              ? { publish_link: result }
              : reply
                  .status(404)
                  .send(
                    error_response(
                      "publish_link_not_found",
                      "Publish Link was not found",
                    ),
                  );
          } catch (e) {
            return handle(e, reply);
          }
        },
      );
      fastify.post(
        `${root}/publish-links/:link_id/entries/:entry_id/rollback`,
        async (request, reply) => {
          try {
            const base = await scope(request as never, type);
            const body = RollbackPublishLinkEntryRequestSchema.safeParse(
              request.body,
            );
            if (!base || !body.success) return invalid(reply);
            const params = request.params as Params;
            const result =
              await dependencies.publish_service.rollback_publish_link_entry({
                ...base,
                link_id: params.link_id!,
                entry_id: params.entry_id!,
                rollback: body.data,
              });
            return (
              result ??
              reply
                .status(404)
                .send(
                  error_response(
                    "publish_link_entry_not_found",
                    "Publish Link entry was not found",
                  ),
                )
            );
          } catch (e) {
            return handle(e, reply);
          }
        },
      );
      fastify.post(
        `${root}/publish-links/:link_id/revoke`,
        async (request, reply) => {
          try {
            const base = await scope(request as never, type);
            const body = RevokePublishLinkRequestSchema.safeParse(request.body);
            if (!base || !body.success) return invalid(reply);
            const result =
              await dependencies.publish_service.revoke_publish_link({
                ...base,
                link_id: (request.params as Params).link_id!,
                expected_link_version: body.data.expected_link_version,
              });
            return result
              ? { publish_link: result }
              : reply
                  .status(404)
                  .send(
                    error_response(
                      "publish_link_not_found",
                      "Publish Link was not found",
                    ),
                  );
          } catch (e) {
            return handle(e, reply);
          }
        },
      );
    };
    register_artifact("guide");
    register_artifact("interactive_demo");
    const public_query = (value: unknown) =>
      PublicPublishLinkQuerySchema.safeParse(value);
    fastify.get("/public/publish-links/:slug", async (request, reply) => {
      try {
        const query = public_query(request.query);
        if (!query.success) return invalid(reply);
        const p = request.params as PublicParams;
        return await dependencies.publish_service.resolve_public_publish_link({
          slug: p.slug,
          artifact_type: query.data.artifact_type,
          version_slug: null,
          viewer_token: request.cookies?.[public_viewer_cookie_name],
        });
      } catch (e) {
        return handle(e, reply);
      }
    });
    fastify.get(
      "/public/publish-links/:slug/versions/:version_slug",
      async (request, reply) => {
        try {
          const query = public_query(request.query);
          if (!query.success) return invalid(reply);
          const p = request.params as PublicParams;
          return await dependencies.publish_service.resolve_public_publish_link(
            {
              slug: p.slug,
              artifact_type: query.data.artifact_type,
              version_slug: p.version_slug!,
              viewer_token: request.cookies?.[public_viewer_cookie_name],
            },
          );
        } catch (e) {
          return handle(e, reply);
        }
      },
    );
    fastify.post(
      "/public/publish-links/:slug/viewer-sessions",
      async (request, reply) => {
        try {
          const query = public_query(request.query),
            body = CreatePublicViewerSessionRequestSchema.safeParse(
              request.body,
            );
          if (!query.success || !body.success) return invalid(reply);
          const result =
            await dependencies.publish_service.create_public_publish_viewer_session(
              {
                slug: (request.params as PublicParams).slug,
                artifact_type: query.data.artifact_type,
                password: body.data.password,
              },
            );
          set_public_viewer_cookie(reply, result.token, result.expires_at);
          return reply.status(201).send({ expires_at: result.expires_at });
        } catch (e) {
          return handle(e, reply);
        }
      },
    );
    fastify.get(
      "/public/publish-links/:slug/versions/:version_slug/assets/:capture_asset_id/file",
      async (request, reply) => {
        try {
          const query = public_query(request.query);
          if (!query.success) return invalid(reply);
          const p = request.params as PublicParams;
          const file =
            await dependencies.publish_service.get_public_published_asset_file({
              slug: p.slug,
              artifact_type: query.data.artifact_type,
              version_slug: p.version_slug!,
              capture_asset_id: p.capture_asset_id!,
              viewer_token: request.cookies?.[public_viewer_cookie_name],
            });
          reply
            .header("content-type", file.mime_type)
            .header("content-length", String(file.size_bytes));
          return reply.send(file.stream);
        } catch (e) {
          return handle(e, reply);
        }
      },
    );
  };
