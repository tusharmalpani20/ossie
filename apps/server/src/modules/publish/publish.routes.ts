import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import { GuideVersionQuerySchema, type GuideVersionQuery } from "@repo/types/guide";
import {
  CreatePublicViewerSessionRequestSchema,
  type PublishResult,
  type PublishStatusResponse,
  type RevokePublishResult,
  UpdatePublishAccessRequestSchema,
  UpdatePublishPasswordRequestSchema,
} from "@repo/types/publish";
import {
  GuideHasNoPublishableBlocksError,
  GuideNotPublishableError,
  InteractiveDemoHasNoPublishableScenesError,
  InvalidPublicViewerPasswordError,
  InvalidPublishAccessSettingsError,
  InvalidPublishPasswordSettingsError,
  PublishLinkExpiredError,
  PublishLinkNotPublicError,
  PublishLinkPasswordRequiredError,
} from "@repo/publish-domain";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { web_session_cookie_name } from "../authentication/session-cookie";
import {
  error_response,
  unauthorized_response,
} from "../shared/http-errors";
import {
  GuideNotFoundError,
  InteractiveDemoNotFoundError,
  ProjectNotFoundError,
  PublishedAssetNotFoundError,
  PublishLinkNotFoundError,
  UnsupportedPublishedAssetStorageProviderError,
  type PublishAuthContext,
  type PublicPublishResult,
  type PublishedAssetFileRead,
  type PublishVisibility,
} from "./publish.service";
import {
  public_viewer_cookie_name,
  set_public_viewer_cookie,
} from "./public-viewer-cookie";

export type PublishRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  publish_service: {
    publish_guide: (input: {
      auth: PublishAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
    }) => Promise<PublishResult>;
    publish_interactive_demo: (input: {
      auth: PublishAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
    }) => Promise<PublishResult>;
    get_guide_publish_status: (input: {
      auth: PublishAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
    }) => Promise<PublishStatusResponse>;
    get_interactive_demo_publish_status: (input: {
      auth: PublishAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
    }) => Promise<PublishStatusResponse>;
    revoke_guide_publish_link: (input: {
      auth: PublishAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
    }) => Promise<RevokePublishResult>;
    revoke_interactive_demo_publish_link: (input: {
      auth: PublishAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
    }) => Promise<RevokePublishResult>;
    update_guide_publish_access: (input: {
      auth: PublishAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      visibility: PublishVisibility;
      expires_at: string | null;
    }) => Promise<PublishStatusResponse>;
    update_interactive_demo_publish_access: (input: {
      auth: PublishAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      visibility: PublishVisibility;
      expires_at: string | null;
    }) => Promise<PublishStatusResponse>;
    update_guide_publish_password: (input: {
      auth: PublishAuthContext;
      project_id: string;
      guide_id: string;
      project_version_id: string;
      password: string | null;
    }) => Promise<PublishStatusResponse>;
    update_interactive_demo_publish_password: (input: {
      auth: PublishAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      password: string | null;
    }) => Promise<PublishStatusResponse>;
    resolve_public_publish_link: (input: {
      slug: string;
      viewer_token?: string;
    }) => Promise<PublicPublishResult>;
    create_public_publish_viewer_session: (input: {
      slug: string;
      password: string;
    }) => Promise<{ token: string; expires_at: string }>;
    get_public_published_asset_file: (input: {
      slug: string;
      capture_asset_id: string;
      viewer_token?: string;
    }) => Promise<PublishedAssetFileRead>;
  };
};

const publish_auth_context = (auth: AuthContext): PublishAuthContext => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const parse_publish_access_body = (body: unknown): { visibility: PublishVisibility; expires_at: string | null } => {
  const parsed = UpdatePublishAccessRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new InvalidPublishAccessSettingsError();
  }

  if (
    parsed.data.expires_at !== null
    && !Number.isFinite(new Date(parsed.data.expires_at).getTime())
  ) {
    throw new InvalidPublishAccessSettingsError();
  }

  return {
    visibility: parsed.data.visibility,
    expires_at: parsed.data.expires_at,
  };
};

const parse_publish_password_body = (body: unknown): { password: string | null } => {
  const parsed = UpdatePublishPasswordRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new InvalidPublishPasswordSettingsError();
  }

  return { password: parsed.data.password };
};

const parse_public_viewer_password_body = (body: unknown): { password: string } => {
  const parsed = CreatePublicViewerSessionRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new InvalidPublicViewerPasswordError();
  }

  return { password: parsed.data.password };
};

const public_publish_response = (result: PublicPublishResult): PublicPublishResult => ({
  publish_link: result.publish_link,
  published_artifact: result.published_artifact,
});

export const build_publish_routes = (
  dependencies: PublishRouteDependencies
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) => (
      publish_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token)
      )
    );

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(unauthorized_response());
      }

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send(error_response("project_not_found", "Project was not found"));
      }

      if (error instanceof GuideNotFoundError) {
        return reply.status(404).send(error_response("guide_not_found", "Guide was not found"));
      }

      if (error instanceof InteractiveDemoNotFoundError) {
        return reply.status(404).send(error_response("interactive_demo_not_found", "Interactive demo was not found"));
      }

      if (error instanceof GuideNotPublishableError) {
        return reply.status(409).send(error_response("guide_not_publishable", "Guide is not publishable"));
      }

      if (error instanceof GuideHasNoPublishableBlocksError) {
        return reply.status(400).send(
          error_response("guide_has_no_publishable_blocks", "Guide has no publishable blocks")
        );
      }

      if (error instanceof InteractiveDemoHasNoPublishableScenesError) {
        return reply.status(400).send(
          error_response("interactive_demo_has_no_publishable_scenes", "Interactive demo has no publishable scenes")
        );
      }

      if (error instanceof InvalidPublishAccessSettingsError) {
        return reply.status(400).send(
          error_response("invalid_publish_access_settings", "Invalid publish access settings")
        );
      }

      if (error instanceof InvalidPublishPasswordSettingsError) {
        return reply.status(400).send(
          error_response("invalid_publish_password_settings", "Invalid publish password settings")
        );
      }

      if (error instanceof PublishLinkNotFoundError) {
        return reply.status(404).send(error_response("publish_link_not_found", "Publish link was not found"));
      }

      if (error instanceof PublishLinkNotPublicError) {
        return reply.status(403).send(error_response("publish_link_not_public", "Publish link is not public"));
      }

      if (error instanceof PublishLinkExpiredError) {
        return reply.status(410).send(error_response("publish_link_expired", "Publish link has expired"));
      }

      if (error instanceof PublishLinkPasswordRequiredError) {
        return reply.status(401).send(
          error_response("publish_link_password_required", "Publish link password is required")
        );
      }

      if (error instanceof InvalidPublicViewerPasswordError) {
        return reply.status(400).send(
          error_response("invalid_public_viewer_password", "Invalid public viewer password")
        );
      }

      if (error instanceof PublishedAssetNotFoundError) {
        return reply.status(404).send(error_response("published_asset_not_found", "Published asset was not found"));
      }

      if (error instanceof UnsupportedPublishedAssetStorageProviderError) {
        return reply.status(501).send(
          error_response(
            "unsupported_published_asset_storage_provider",
            "Published asset storage provider is not supported"
          )
        );
      }

      throw error;
    };

    fastify.post<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/guides/:guide_id/publish", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const result = await dependencies.publish_service.publish_guide({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
          project_version_id: request.query.project_version_id,
        });

        return reply.status(201).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/guides/:guide_id/publish", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const result = await dependencies.publish_service.get_guide_publish_status({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
          project_version_id: request.query.project_version_id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/guides/:guide_id/publish", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const result = await dependencies.publish_service.revoke_guide_publish_link({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
          project_version_id: request.query.project_version_id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Body: {
        visibility: PublishVisibility;
        expires_at?: string | null;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/guides/:guide_id/publish/access", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const access_body = parse_publish_access_body(request.body);
        const result = await dependencies.publish_service.update_guide_publish_access({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
          project_version_id: request.query.project_version_id,
          visibility: access_body.visibility,
          expires_at: access_body.expires_at,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: {
        project_id: string;
        guide_id: string;
      };
      Body: {
        password: string | null;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/guides/:guide_id/publish/password", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const password_body = parse_publish_password_body(request.body);
        const result = await dependencies.publish_service.update_guide_publish_password({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
          project_version_id: request.query.project_version_id,
          password: password_body.password,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.post<{
      Params: {
        project_id: string;
        interactive_demo_id: string;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/interactive-demos/:interactive_demo_id/publish", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const result = await dependencies.publish_service.publish_interactive_demo({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
        });

        return reply.status(201).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
        interactive_demo_id: string;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/interactive-demos/:interactive_demo_id/publish", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const result = await dependencies.publish_service.get_interactive_demo_publish_status({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: {
        project_id: string;
        interactive_demo_id: string;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/interactive-demos/:interactive_demo_id/publish", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const result = await dependencies.publish_service.revoke_interactive_demo_publish_link({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: {
        project_id: string;
        interactive_demo_id: string;
      };
      Body: {
        visibility: PublishVisibility;
        expires_at?: string | null;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/interactive-demos/:interactive_demo_id/publish/access", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const access_body = parse_publish_access_body(request.body);
        const result = await dependencies.publish_service.update_interactive_demo_publish_access({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          visibility: access_body.visibility,
          expires_at: access_body.expires_at,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: {
        project_id: string;
        interactive_demo_id: string;
      };
      Body: {
        password: string | null;
      };
      Querystring: GuideVersionQuery;
    }>("/projects/:project_id/interactive-demos/:interactive_demo_id/publish/password", { schema: { querystring: GuideVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const password_body = parse_publish_password_body(request.body);
        const result = await dependencies.publish_service.update_interactive_demo_publish_password({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          password: password_body.password,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        slug: string;
      };
    }>("/public/publish-links/:slug", async (request, reply) => {
      try {
        const result = await dependencies.publish_service.resolve_public_publish_link({
          slug: request.params.slug,
          viewer_token: request.cookies[public_viewer_cookie_name],
        });

        return reply.status(200).send(public_publish_response(result));
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.post<{
      Params: {
        slug: string;
      };
      Body: {
        password: string;
      };
    }>("/public/publish-links/:slug/viewer-sessions", async (request, reply) => {
      try {
        const password_body = parse_public_viewer_password_body(request.body);
        const session = await dependencies.publish_service.create_public_publish_viewer_session({
          slug: request.params.slug,
          password: password_body.password,
        });

        if (session.token) {
          set_public_viewer_cookie(reply, session.token, session.expires_at);
        }

        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        slug: string;
        capture_asset_id: string;
      };
    }>("/public/publish-links/:slug/assets/:capture_asset_id/file", async (request, reply) => {
      try {
        const file = await dependencies.publish_service.get_public_published_asset_file({
          slug: request.params.slug,
          capture_asset_id: request.params.capture_asset_id,
          viewer_token: request.cookies[public_viewer_cookie_name],
        });

        return reply
          .status(200)
          .header("content-type", file.mime_type)
          .header("content-length", String(file.size_bytes))
          .send(file.stream);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
