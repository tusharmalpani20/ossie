import type { FastifyPluginAsync } from "fastify";
import { session_token_from_request } from "../authentication/request-session-token";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { error_response, unauthorized_response } from "../shared/http-errors";
import {
  build_extension_bundle,
  ExtensionBundleUnavailableError,
  type ExtensionBundle,
} from "./extension-distribution";

export type ExtensionDistributionRouteDependencies = {
  auth_service: {
    get_current_auth_context(token?: string): Promise<AuthContext>;
  };
  bundle_service?: () => Promise<ExtensionBundle>;
};

/** Serves the built extension only to signed-in Organization members. */
export const build_extension_distribution_routes =
  (dependencies: ExtensionDistributionRouteDependencies): FastifyPluginAsync =>
  async (fastify) => {
    fastify.get("/download", async (request, reply) => {
      try {
        await dependencies.auth_service.get_current_auth_context(
          session_token_from_request(request),
        );
        const bundle = await (
          dependencies.bundle_service ?? build_extension_bundle
        )();

        return reply
          .status(200)
          .header("content-type", "application/zip")
          .header(
            "content-disposition",
            `attachment; filename="${bundle.filename}"`,
          )
          .header("cache-control", "private, no-store")
          .send(bundle.archive);
      } catch (error) {
        if (error instanceof UnauthenticatedSessionError) {
          return reply.status(401).send(unauthorized_response());
        }
        if (error instanceof ExtensionBundleUnavailableError) {
          return reply
            .status(503)
            .send(
              error_response("extension_bundle_unavailable", error.message),
            );
        }
        throw error;
      }
    });
  };
