import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import {
  CreateDemoHotspotRequestSchema,
  CreateDemoSceneRequestSchema,
  CreateInteractiveDemoFromCaptureRequestSchema,
  CreateInteractiveDemoRequestSchema,
  ReorderDemoHotspotsRequestSchema,
  ReorderDemoScenesRequestSchema,
  UpdateDemoHotspotRequestSchema,
  UpdateDemoSceneRequestSchema,
  UpdateInteractiveDemoRequestSchema,
  UpdateInteractiveDemoEditionStatusRequestSchema,
  InteractiveDemoVersionQuerySchema,
  InteractiveDemoContentDeleteQuerySchema,
  type InteractiveDemoVersionQuery,
} from "@repo/types/demo";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { session_token_from_request } from "../authentication/request-session-token";
import {
  error_response,
  unauthorized_response,
} from "../shared/http-errors";
import {
  CaptureSessionNotFoundError,
  DemoHotspotNotFoundError,
  DemoSceneNotFoundError,
  EmptyDemoHotspotOrderError,
  EmptyDemoHotspotUpdateError,
  EmptyDemoSceneOrderError,
  EmptyDemoSceneUpdateError,
  EmptyInteractiveDemoUpdateError,
  InvalidDemoHotspotCoordinatesError,
  InvalidDemoHotspotOrderError,
  InvalidDemoHotspotTargetError,
  InteractiveDemoNotFoundError,
  InteractiveDemoNotEditableError,
  InteractiveDemoEditionConflictError,
  InteractiveDemoWorkingDraftConflictError,
  InvalidDemoSceneOrderError,
  InvalidDemoSceneReferenceError,
  NoUsableCaptureEventsError,
  ProjectNotFoundError,
  type CreateDemoHotspotInput,
  type CreateDemoSceneInput,
  type CreateInteractiveDemoInput,
  type CreateInteractiveDemoFromCaptureInput,
  type DemoScene,
  type InteractiveDemo,
  type InteractiveDemoDetail,
  type InteractiveDemoAuthContext,
  type UpdateDemoHotspotInput,
  type UpdateDemoSceneInput,
  type UpdateInteractiveDemoInput,
} from "./interactive-demo.service";

export type InteractiveDemoRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  interactive_demo_service: {
    create_interactive_demo_from_capture: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      capture_session_id: string;
      data: CreateInteractiveDemoFromCaptureInput;
    }) => Promise<{
      artifact: InteractiveDemoDetail["artifact"];
      edition: InteractiveDemoDetail["edition"];
      working_draft: InteractiveDemoDetail["working_draft"];
      demo_scenes: DemoScene[];
      redirect_path: string;
    }>;
    create_interactive_demo: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      data: CreateInteractiveDemoInput;
    }) => Promise<InteractiveDemoDetail>;
    list_interactive_demos: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      project_version_id: string;
    }) => Promise<unknown[]>;
    get_interactive_demo: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
    }) => Promise<InteractiveDemoDetail>;
    update_interactive_demo: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      data: UpdateInteractiveDemoInput;
    }) => Promise<InteractiveDemo>;
    update_interactive_demo_status: (input: {
      auth: InteractiveDemoAuthContext; project_id: string; interactive_demo_id: string;
      project_version_id: string; status: "draft" | "archived"; expected_edition_version: number;
    }) => Promise<InteractiveDemo>;
    create_demo_scene: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      data: CreateDemoSceneInput;
    }) => Promise<unknown>;
    list_demo_scenes: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
    }) => Promise<unknown>;
    update_demo_scene: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      demo_scene_id: string;
      data: UpdateDemoSceneInput;
    }) => Promise<unknown>;
    reorder_demo_scenes: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      scene_ids: string[];
      expected_working_draft_version: number;
    }) => Promise<unknown>;
    delete_demo_scene: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      demo_scene_id: string;
      expected_working_draft_version: number;
    }) => Promise<void>;
    create_demo_hotspot: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      demo_scene_id: string;
      data: CreateDemoHotspotInput;
    }) => Promise<unknown>;
    list_demo_hotspots: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      demo_scene_id: string;
    }) => Promise<unknown>;
    update_demo_hotspot: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      demo_scene_id: string;
      demo_hotspot_id: string;
      data: UpdateDemoHotspotInput;
    }) => Promise<unknown>;
    reorder_demo_hotspots: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      demo_scene_id: string;
      hotspot_ids: string[];
      expected_working_draft_version: number;
    }) => Promise<unknown>;
    delete_demo_hotspot: (input: {
      auth: InteractiveDemoAuthContext;
      project_id: string;
      interactive_demo_id: string;
      project_version_id: string;
      demo_scene_id: string;
      demo_hotspot_id: string;
      expected_working_draft_version: number;
    }) => Promise<void>;
  };
};

const interactive_demo_auth_context = (auth: AuthContext): InteractiveDemoAuthContext => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const pick_create_demo_data = (body: CreateInteractiveDemoInput): CreateInteractiveDemoInput => {
  const data: CreateInteractiveDemoInput = {
    project_version_id: body.project_version_id,
    title: body.title,
  };

  if (body.description !== undefined) {
    data.description = body.description;
  }

  return data;
};

const pick_create_demo_from_capture_data = (
  body: CreateInteractiveDemoFromCaptureInput
): CreateInteractiveDemoFromCaptureInput => {
  const data: CreateInteractiveDemoFromCaptureInput = {};

  if (body.title !== undefined) {
    data.title = body.title;
  }
  if (body.description !== undefined) {
    data.description = body.description;
  }

  return data;
};

const pick_update_demo_data = (body: UpdateInteractiveDemoInput): UpdateInteractiveDemoInput => ({
  title: body.title,
  description: body.description,
  expected_edition_version: body.expected_edition_version,
});

const pick_create_scene_data = (body: CreateDemoSceneInput): CreateDemoSceneInput => ({
  title: body.title,
  description: body.description,
  background_capture_asset_id: body.background_capture_asset_id,
  expected_working_draft_version: body.expected_working_draft_version,
});

const pick_update_scene_data = (body: UpdateDemoSceneInput): UpdateDemoSceneInput => ({
  title: body.title,
  description: body.description,
  background_capture_asset_id: body.background_capture_asset_id,
  expected_working_draft_version: body.expected_working_draft_version,
});

const pick_create_hotspot_data = (body: CreateDemoHotspotInput): CreateDemoHotspotInput => ({
  hotspot_type: body.hotspot_type,
  label: body.label,
  content: body.content,
  x: body.x,
  y: body.y,
  width: body.width,
  height: body.height,
  transition: body.transition,
  expected_working_draft_version: body.expected_working_draft_version,
});

const pick_update_hotspot_data = (body: UpdateDemoHotspotInput): UpdateDemoHotspotInput => ({
  hotspot_type: body.hotspot_type,
  label: body.label,
  content: body.content,
  x: body.x,
  y: body.y,
  width: body.width,
  height: body.height,
  transition: body.transition,
  expected_working_draft_version: body.expected_working_draft_version,
});

export const build_interactive_demo_routes = (
  dependencies: InteractiveDemoRouteDependencies
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) => (
      interactive_demo_auth_context(
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

      if (error instanceof InteractiveDemoNotFoundError) {
        return reply.status(404).send(error_response("interactive_demo_not_found", "Interactive demo was not found"));
      }

      if (error instanceof InteractiveDemoNotEditableError) {
        return reply.status(409).send(error_response(error.code, error.message));
      }

      if (error instanceof InteractiveDemoEditionConflictError || error instanceof InteractiveDemoWorkingDraftConflictError) {
        return reply.status(409).send(error_response(error.code, error.message));
      }

      if (error instanceof CaptureSessionNotFoundError) {
        return reply.status(404).send(error_response("capture_session_not_found", "Capture session was not found"));
      }

      if (error instanceof NoUsableCaptureEventsError) {
        return reply.status(400).send(error_response("no_usable_capture_events", "Capture session has no screenshot-backed events"));
      }

      if (error instanceof DemoSceneNotFoundError) {
        return reply.status(404).send(error_response("demo_scene_not_found", "Demo scene was not found"));
      }

      if (error instanceof DemoHotspotNotFoundError) {
        return reply.status(404).send(error_response("demo_hotspot_not_found", "Demo hotspot was not found"));
      }

      if (error instanceof EmptyInteractiveDemoUpdateError) {
        return reply.status(400).send(error_response("empty_interactive_demo_update", "At least one interactive demo field must be provided"));
      }

      if (error instanceof EmptyDemoSceneUpdateError) {
        return reply.status(400).send(error_response("empty_demo_scene_update", "At least one demo scene field must be provided"));
      }

      if (error instanceof EmptyDemoSceneOrderError) {
        return reply.status(400).send(error_response("empty_demo_scene_order", "At least one demo scene id must be provided"));
      }

      if (error instanceof InvalidDemoSceneOrderError) {
        return reply.status(400).send(error_response("invalid_demo_scene_order", "Demo scene order is invalid"));
      }

      if (error instanceof InvalidDemoSceneReferenceError) {
        return reply.status(400).send(error_response("invalid_demo_scene_reference", "Demo scene references are invalid"));
      }

      if (error instanceof EmptyDemoHotspotUpdateError) {
        return reply.status(400).send(error_response("empty_demo_hotspot_update", "At least one demo hotspot field must be provided"));
      }

      if (error instanceof EmptyDemoHotspotOrderError) {
        return reply.status(400).send(error_response("empty_demo_hotspot_order", "At least one demo hotspot id must be provided"));
      }

      if (error instanceof InvalidDemoHotspotOrderError) {
        return reply.status(400).send(error_response("invalid_demo_hotspot_order", "Demo hotspot order is invalid"));
      }

      if (error instanceof InvalidDemoHotspotCoordinatesError) {
        return reply.status(400).send(error_response("invalid_demo_hotspot_coordinates", "Demo hotspot coordinates are invalid"));
      }

      if (error instanceof InvalidDemoHotspotTargetError) {
        return reply.status(400).send(error_response("invalid_demo_hotspot_target", "Demo hotspot target is invalid"));
      }

      throw error;
    };

    fastify.post<{
      Params: { project_id: string; capture_session_id: string };
      Body: CreateInteractiveDemoFromCaptureInput;
    }>("/:project_id/capture-sessions/:capture_session_id/interactive-demos", {
      schema: { body: CreateInteractiveDemoFromCaptureRequestSchema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const result = await dependencies.interactive_demo_service.create_interactive_demo_from_capture({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          data: pick_create_demo_from_capture_data(request.body),
        });
        return reply.status(201).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.post<{
      Params: { project_id: string };
      Body: CreateInteractiveDemoInput;
    }>("/:project_id/interactive-demos", {
      schema: { body: CreateInteractiveDemoRequestSchema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const interactive_demo = await dependencies.interactive_demo_service.create_interactive_demo({
          auth,
          project_id: request.params.project_id,
          data: pick_create_demo_data(request.body),
        });
        return reply.status(201).send(interactive_demo);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: { project_id: string };
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos", { schema: { querystring: InteractiveDemoVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const interactive_demos = await dependencies.interactive_demo_service.list_interactive_demos({
          auth,
          project_id: request.params.project_id,
          project_version_id: request.query.project_version_id,
        });
        return reply.status(200).send({ interactive_demo_editions: interactive_demos });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: { project_id: string; interactive_demo_id: string };
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id", { schema: { querystring: InteractiveDemoVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const interactive_demo = await dependencies.interactive_demo_service.get_interactive_demo({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
        });
        return reply.status(200).send(interactive_demo);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: { project_id: string; interactive_demo_id: string };
      Body: UpdateInteractiveDemoInput;
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id", {
      schema: { body: UpdateInteractiveDemoRequestSchema, querystring: InteractiveDemoVersionQuerySchema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const interactive_demo = await dependencies.interactive_demo_service.update_interactive_demo({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          data: pick_update_demo_data(request.body),
        });
        return reply.status(200).send({ edition: interactive_demo });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    for (const command of ["archive", "restore"] as const) {
      fastify.post<{
        Params: { project_id: string; interactive_demo_id: string };
        Querystring: InteractiveDemoVersionQuery;
        Body: { expected_edition_version: number };
      }>(`/:project_id/interactive-demos/:interactive_demo_id/${command}`, {
        schema: { querystring: InteractiveDemoVersionQuerySchema, body: UpdateInteractiveDemoEditionStatusRequestSchema },
      }, async (request, reply) => {
        try {
          const auth = await require_auth(session_token_from_request(request));
          const edition = await dependencies.interactive_demo_service.update_interactive_demo_status({
            auth, project_id: request.params.project_id,
            interactive_demo_id: request.params.interactive_demo_id,
            project_version_id: request.query.project_version_id,
            status: command === "archive" ? "archived" : "draft",
            expected_edition_version: request.body.expected_edition_version,
          });
          return reply.status(200).send({ edition });
        } catch (error) {
          return handle_domain_error(error, reply);
        }
      });
    }

    fastify.post<{
      Params: { project_id: string; interactive_demo_id: string };
      Body: CreateDemoSceneInput;
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes", {
      schema: { body: CreateDemoSceneRequestSchema, querystring: InteractiveDemoVersionQuerySchema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_scene = await dependencies.interactive_demo_service.create_demo_scene({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          data: pick_create_scene_data(request.body),
        });
        return reply.status(201).send(demo_scene);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: { project_id: string; interactive_demo_id: string };
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes", { schema: { querystring: InteractiveDemoVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_scenes = await dependencies.interactive_demo_service.list_demo_scenes({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
        });
        return reply.status(200).send(demo_scenes);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: { project_id: string; interactive_demo_id: string; scene_id: string };
      Body: UpdateDemoSceneInput;
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id", {
      schema: { body: UpdateDemoSceneRequestSchema, querystring: InteractiveDemoVersionQuerySchema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_scene = await dependencies.interactive_demo_service.update_demo_scene({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          demo_scene_id: request.params.scene_id,
          data: pick_update_scene_data(request.body),
        });
        return reply.status(200).send(demo_scene);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.put<{
      Params: { project_id: string; interactive_demo_id: string };
      Body: { scene_ids: string[]; expected_working_draft_version: number };
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/order", {
      schema: { body: ReorderDemoScenesRequestSchema, querystring: InteractiveDemoVersionQuerySchema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_scenes = await dependencies.interactive_demo_service.reorder_demo_scenes({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          scene_ids: request.body.scene_ids,
          expected_working_draft_version: request.body.expected_working_draft_version,
        });
        return reply.status(200).send(demo_scenes);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: { project_id: string; interactive_demo_id: string; scene_id: string };
      Querystring: { project_version_id: string; expected_working_draft_version: number };
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id", { schema: { querystring: InteractiveDemoContentDeleteQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        await dependencies.interactive_demo_service.delete_demo_scene({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          demo_scene_id: request.params.scene_id,
          expected_working_draft_version: request.query.expected_working_draft_version,
        });
        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.post<{
      Params: { project_id: string; interactive_demo_id: string; scene_id: string };
      Body: CreateDemoHotspotInput;
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots", {
      schema: { body: CreateDemoHotspotRequestSchema, querystring: InteractiveDemoVersionQuerySchema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_hotspot = await dependencies.interactive_demo_service.create_demo_hotspot({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          demo_scene_id: request.params.scene_id,
          data: pick_create_hotspot_data(request.body),
        });
        return reply.status(201).send(demo_hotspot);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: { project_id: string; interactive_demo_id: string; scene_id: string };
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots", { schema: { querystring: InteractiveDemoVersionQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_hotspots = await dependencies.interactive_demo_service.list_demo_hotspots({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          demo_scene_id: request.params.scene_id,
        });
        return reply.status(200).send(demo_hotspots);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: { project_id: string; interactive_demo_id: string; scene_id: string; hotspot_id: string };
      Body: UpdateDemoHotspotInput;
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id", {
      schema: { body: UpdateDemoHotspotRequestSchema, querystring: InteractiveDemoVersionQuerySchema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_hotspot = await dependencies.interactive_demo_service.update_demo_hotspot({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          demo_scene_id: request.params.scene_id,
          demo_hotspot_id: request.params.hotspot_id,
          data: pick_update_hotspot_data(request.body),
        });
        return reply.status(200).send(demo_hotspot);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.put<{
      Params: { project_id: string; interactive_demo_id: string; scene_id: string };
      Body: { hotspot_ids: string[]; expected_working_draft_version: number };
      Querystring: InteractiveDemoVersionQuery;
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/order", {
      schema: { body: ReorderDemoHotspotsRequestSchema, querystring: InteractiveDemoVersionQuerySchema },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const demo_hotspots = await dependencies.interactive_demo_service.reorder_demo_hotspots({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          demo_scene_id: request.params.scene_id,
          hotspot_ids: request.body.hotspot_ids,
          expected_working_draft_version: request.body.expected_working_draft_version,
        });
        return reply.status(200).send(demo_hotspots);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: { project_id: string; interactive_demo_id: string; scene_id: string; hotspot_id: string };
      Querystring: { project_version_id: string; expected_working_draft_version: number };
    }>("/:project_id/interactive-demos/:interactive_demo_id/scenes/:scene_id/hotspots/:hotspot_id", { schema: { querystring: InteractiveDemoContentDeleteQuerySchema } }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        await dependencies.interactive_demo_service.delete_demo_hotspot({
          auth,
          project_id: request.params.project_id,
          interactive_demo_id: request.params.interactive_demo_id,
          project_version_id: request.query.project_version_id,
          demo_scene_id: request.params.scene_id,
          demo_hotspot_id: request.params.hotspot_id,
          expected_working_draft_version: request.query.expected_working_draft_version,
        });
        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
