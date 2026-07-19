import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
} from "fastify";
import {
  CaptureSessionListQuerySchema,
  CreateCaptureSessionRequestSchema,
  ReassignCaptureSessionProjectVersionRequestSchema,
  type ReassignCaptureSessionProjectVersionRequest,
  UpdateCaptureSessionRequestSchema,
} from "@repo/types/capture";
import {
  assert_no_client_lifecycle_timestamp_input,
  assert_valid_capture_session_completion_body,
} from "@repo/capture-domain";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { session_token_from_request } from "../authentication/request-session-token";
import { error_response, unauthorized_response } from "../shared/http-errors";
import {
  CaptureSessionNotFoundError,
  CaptureSessionNotCompletableError,
  EmptyCaptureSessionUpdateError,
  InvalidCaptureSessionCompletionError,
  InvalidCaptureSessionInputError,
  ProjectNotFoundError,
  CaptureSessionProjectVersionLockedError,
  CaptureSessionProjectVersionUnchangedError,
  CaptureSessionConflictError,
  CaptureProjectVersionConflictError,
  CaptureProjectVersionNotFoundError,
  type CaptureSession,
  type CaptureSessionDetail,
  type CaptureSessionAuthContext,
  type CompletedCaptureSessionResult,
  type CaptureSessionStatus,
  type CreateCaptureSessionInput,
  type UpdateCaptureSessionInput,
} from "./capture-session.service";

export type CaptureSessionRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  capture_session_service: {
    create_capture_session: (input: {
      auth: CaptureSessionAuthContext;
      project_id: string;
      data: CreateCaptureSessionInput;
    }) => Promise<CaptureSession>;
    list_capture_sessions: (input: {
      auth: CaptureSessionAuthContext;
      project_id: string;
      status?: CaptureSessionStatus;
      project_version_id: string;
    }) => Promise<CaptureSession[]>;
    get_capture_session: (input: {
      auth: CaptureSessionAuthContext;
      project_id: string;
      capture_session_id: string;
    }) => Promise<CaptureSession>;
    get_capture_session_detail: (input: {
      auth: CaptureSessionAuthContext;
      project_id: string;
      capture_session_id: string;
    }) => Promise<CaptureSessionDetail>;
    update_capture_session: (input: {
      auth: CaptureSessionAuthContext;
      project_id: string;
      capture_session_id: string;
      data: UpdateCaptureSessionInput;
    }) => Promise<CaptureSession>;
    complete_capture_session: (input: {
      auth: CaptureSessionAuthContext;
      project_id: string;
      capture_session_id: string;
    }) => Promise<CompletedCaptureSessionResult>;
    delete_capture_session: (input: {
      auth: CaptureSessionAuthContext;
      project_id: string;
      capture_session_id: string;
    }) => Promise<void>;
    reassign_project_version: (input: {
      auth: CaptureSessionAuthContext;
      project_id: string;
      capture_session_id: string;
      data: ReassignCaptureSessionProjectVersionRequest;
    }) => Promise<CaptureSession>;
  };
};

const capture_session_auth_context = (auth: AuthContext) => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const pick_create_capture_session_data = (
  body: CreateCaptureSessionInput,
): CreateCaptureSessionInput => {
  const data: CreateCaptureSessionInput = {
    name: body.name,
    project_version_id: body.project_version_id,
  };
  if (body.start_immediately !== undefined)
    data.start_immediately = body.start_immediately;

  if (body.description !== undefined) {
    data.description = body.description;
  }
  if (body.source_type !== undefined) {
    data.source_type = body.source_type;
  }
  if (body.start_url !== undefined) {
    data.start_url = body.start_url;
  }
  if (body.browser_name !== undefined) {
    data.browser_name = body.browser_name;
  }
  if (body.browser_version !== undefined) {
    data.browser_version = body.browser_version;
  }
  if (body.operating_system !== undefined) {
    data.operating_system = body.operating_system;
  }
  if (body.viewport_width !== undefined) {
    data.viewport_width = body.viewport_width;
  }
  if (body.viewport_height !== undefined) {
    data.viewport_height = body.viewport_height;
  }
  if (body.device_pixel_ratio !== undefined) {
    data.device_pixel_ratio = body.device_pixel_ratio;
  }
  if (body.user_agent !== undefined) {
    data.user_agent = body.user_agent;
  }
  if (body.metadata !== undefined) {
    data.metadata = body.metadata;
  }

  return data;
};

const pick_update_capture_session_data = (
  body: UpdateCaptureSessionInput,
): UpdateCaptureSessionInput => ({
  name: body.name,
  description: body.description,
  status: body.status,
  start_url: body.start_url,
  browser_name: body.browser_name,
  browser_version: body.browser_version,
  operating_system: body.operating_system,
  viewport_width: body.viewport_width,
  viewport_height: body.viewport_height,
  device_pixel_ratio: body.device_pixel_ratio,
  user_agent: body.user_agent,
  metadata: body.metadata,
});

export const build_capture_session_routes = (
  dependencies: CaptureSessionRouteDependencies,
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) =>
      capture_session_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token),
      );

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      if (
        (error as { constraint?: string })?.constraint ===
        "capture_project_version_active_guard"
      ) {
        return reply
          .status(409)
          .send(
            error_response(
              "project_version_conflict",
              "Archived Project Versions are read-only",
            ),
          );
      }
      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(unauthorized_response());
      }

      if (error instanceof ProjectNotFoundError) {
        return reply
          .status(404)
          .send(error_response("project_not_found", "Project was not found"));
      }

      if (error instanceof CaptureSessionNotFoundError) {
        return reply
          .status(404)
          .send(
            error_response(
              "capture_session_not_found",
              "Capture session was not found",
            ),
          );
      }

      if (error instanceof CaptureSessionNotCompletableError) {
        return reply
          .status(400)
          .send(
            error_response(
              "capture_session_not_completable",
              "Capture session cannot be completed from its current status",
            ),
          );
      }

      if (error instanceof InvalidCaptureSessionCompletionError) {
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_capture_session_completion",
              "Capture session completion input is invalid",
            ),
          );
      }

      if (error instanceof EmptyCaptureSessionUpdateError) {
        return reply
          .status(400)
          .send(
            error_response(
              "empty_capture_session_update",
              "At least one capture session field must be provided",
            ),
          );
      }

      if (error instanceof InvalidCaptureSessionInputError) {
        return reply
          .status(400)
          .send(
            error_response(
              "invalid_capture_session",
              "Capture session input is invalid",
            ),
          );
      }
      if (error instanceof CaptureProjectVersionNotFoundError)
        return reply
          .status(404)
          .send(error_response("project_version_not_found", error.message));
      if (error instanceof CaptureProjectVersionConflictError)
        return reply
          .status(409)
          .send(error_response("project_version_conflict", error.message));
      if (error instanceof CaptureSessionProjectVersionLockedError)
        return reply
          .status(409)
          .send(
            error_response(
              "capture_session_project_version_locked",
              error.message,
            ),
          );
      if (error instanceof CaptureSessionProjectVersionUnchangedError)
        return reply
          .status(409)
          .send(
            error_response(
              "capture_session_project_version_unchanged",
              error.message,
            ),
          );
      if (error instanceof CaptureSessionConflictError)
        return reply
          .status(409)
          .send(error_response("capture_session_conflict", error.message));

      throw error;
    };

    fastify.post<{
      Params: {
        project_id: string;
      };
      Body: CreateCaptureSessionInput;
    }>(
      "/:project_id/capture-sessions",
      {
        schema: {
          body: CreateCaptureSessionRequestSchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const extension_client =
            request.headers["x-ossie-client"] === "extension";
          if (
            (extension_client &&
              request.body.source_type &&
              request.body.source_type !== "extension") ||
            (!extension_client && request.body.source_type === "extension")
          ) {
            throw new InvalidCaptureSessionInputError();
          }
          const create_data = pick_create_capture_session_data(request.body);
          if (extension_client) create_data.source_type = "extension";
          const capture_session =
            await dependencies.capture_session_service.create_capture_session({
              auth,
              project_id: request.params.project_id,
              data: create_data,
            });
          return reply.status(201).send({ capture_session });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.get<{
      Params: {
        project_id: string;
        id: string;
      };
    }>("/:project_id/capture-sessions/:id/detail", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const detail =
          await dependencies.capture_session_service.get_capture_session_detail(
            {
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.id,
            },
          );
        return reply.status(200).send(detail);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
      };
      Querystring: {
        project_version_id: string;
        status?: CaptureSessionStatus;
      };
    }>(
      "/:project_id/capture-sessions",
      {
        schema: {
          querystring: CaptureSessionListQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const capture_sessions =
            await dependencies.capture_session_service.list_capture_sessions({
              auth,
              project_id: request.params.project_id,
              project_version_id: request.query.project_version_id,
              status: request.query.status,
            });
          return reply.status(200).send({ capture_sessions });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.post<{
      Params: { project_id: string; id: string };
      Body: ReassignCaptureSessionProjectVersionRequest;
    }>(
      "/:project_id/capture-sessions/:id/reassign-project-version",
      {
        schema: { body: ReassignCaptureSessionProjectVersionRequestSchema },
      },
      async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const capture_session =
            await dependencies.capture_session_service.reassign_project_version(
              {
                auth,
                project_id: request.params.project_id,
                capture_session_id: request.params.id,
                data: request.body,
              },
            );
          return reply.status(200).send({ capture_session });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.post<{
      Params: {
        project_id: string;
        id: string;
      };
      Body?: Record<string, unknown>;
    }>("/:project_id/capture-sessions/:id/complete", async (request, reply) => {
      try {
        assert_valid_capture_session_completion_body(request.body);

        const auth = await require_auth(session_token_from_request(request));
        const result =
          await dependencies.capture_session_service.complete_capture_session({
            auth,
            project_id: request.params.project_id,
            capture_session_id: request.params.id,
          });
        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
        id: string;
      };
    }>("/:project_id/capture-sessions/:id", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const capture_session =
          await dependencies.capture_session_service.get_capture_session({
            auth,
            project_id: request.params.project_id,
            capture_session_id: request.params.id,
          });
        return reply.status(200).send({ capture_session });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: {
        project_id: string;
        id: string;
      };
      Body: UpdateCaptureSessionInput;
    }>(
      "/:project_id/capture-sessions/:id",
      {
        schema: {
          body: UpdateCaptureSessionRequestSchema,
        },
      },
      async (request, reply) => {
        try {
          assert_no_client_lifecycle_timestamp_input(request.body);

          const auth = await require_auth(session_token_from_request(request));
          const capture_session =
            await dependencies.capture_session_service.update_capture_session({
              auth,
              project_id: request.params.project_id,
              capture_session_id: request.params.id,
              data: pick_update_capture_session_data(request.body),
            });
          return reply.status(200).send({ capture_session });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      },
    );

    fastify.delete<{
      Params: {
        project_id: string;
        id: string;
      };
    }>("/:project_id/capture-sessions/:id", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        await dependencies.capture_session_service.delete_capture_session({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.id,
        });
        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
