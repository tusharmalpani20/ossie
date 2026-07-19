import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import {
  CreateProjectRequestSchema,
  ProjectListQuerySchema,
  UpdateProjectRequestSchema,
} from "@repo/types/project";
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
  EmptyProjectUpdateError,
  ProjectNameConflictError,
  ProjectNotFoundError,
  ProjectSlugConflictError,
  type CreateProjectInput,
  type Project,
  type ProjectAuthContext,
  type ProjectStatus,
  type ProjectListPurpose,
  type UpdateProjectInput,
} from "./project.service";
import {
  ProjectArchivedError,
  ProjectNotFoundError as ProjectAccessNotFoundError,
  ProjectPermissionDeniedError,
} from "../project-membership/project-membership.service";

export type ProjectRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  project_service: {
    create_project: (input: {
      auth: ProjectAuthContext;
      mutation: { actor_label: string; request_id: string };
      data: CreateProjectInput;
    }) => Promise<Project>;
    list_projects: (input: {
      auth: ProjectAuthContext;
      status?: ProjectStatus;
      purpose?: ProjectListPurpose;
    }) => Promise<Project[]>;
    get_project: (input: {
      auth: ProjectAuthContext;
      project_id: string;
    }) => Promise<Project>;
    update_project: (input: {
      auth: ProjectAuthContext;
      project_id: string;
      data: UpdateProjectInput;
    }) => Promise<Project>;
    delete_project: (input: {
      auth: ProjectAuthContext;
      project_id: string;
    }) => Promise<void>;
  };
};

const project_auth_context = (auth: AuthContext) => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const pick_create_project_data = (body: CreateProjectInput): CreateProjectInput => {
  const data: CreateProjectInput = {
    name: body.name,
  };

  if (body.description !== undefined) {
    data.description = body.description;
  }
  if (body.slug !== undefined) {
    data.slug = body.slug;
  }
  if (body.color !== undefined) {
    data.color = body.color;
  }
  if (body.icon !== undefined) {
    data.icon = body.icon;
  }
  if (body.metadata !== undefined) {
    data.metadata = body.metadata;
  }

  return data;
};

const pick_update_project_data = (body: UpdateProjectInput): UpdateProjectInput => ({
  name: body.name,
  description: body.description,
  slug: body.slug,
  color: body.color,
  icon: body.icon,
  metadata: body.metadata,
  status: body.status,
});

export const build_project_routes = (
  dependencies: ProjectRouteDependencies
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) => (
      project_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token)
      )
    );

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(unauthorized_response());
      }

      if (error instanceof ProjectNameConflictError) {
        return reply.status(409).send(
          error_response("project_name_conflict", "A project with this name already exists")
        );
      }

      if (error instanceof ProjectSlugConflictError) {
        return reply.status(409).send(
          error_response("project_slug_conflict", "A project with this slug already exists")
        );
      }

      if (error instanceof ProjectNotFoundError || error instanceof ProjectAccessNotFoundError) {
        return reply.status(404).send(
          error_response("project_not_found", "Project was not found")
        );
      }

      if (error instanceof ProjectPermissionDeniedError) {
        return reply.status(403).send(error_response("project_permission_denied", error.message));
      }

      if (error instanceof ProjectArchivedError) {
        return reply.status(409).send(error_response("project_archived", error.message));
      }

      if (error instanceof EmptyProjectUpdateError) {
        return reply.status(400).send(
          error_response("empty_project_update", "At least one project field must be provided")
        );
      }

      throw error;
    };

    fastify.post<{
      Body: CreateProjectInput;
    }>("/", {
      schema: {
        body: CreateProjectRequestSchema,
      },
    }, async (request, reply) => {
      try {
        const current_auth = await dependencies.auth_service.get_current_auth_context(
          session_token_from_request(request),
        );
        const auth = project_auth_context(current_auth);
        const project = await dependencies.project_service.create_project({
          auth,
          mutation: {
            actor_label: current_auth.user.display_name,
            request_id: String(request.id),
          },
          data: pick_create_project_data(request.body),
        });
        return reply.status(201).send({ project });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Querystring: {
        status?: ProjectStatus;
        purpose?: ProjectListPurpose;
      };
    }>("/", {
      schema: {
        querystring: ProjectListQuerySchema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const projects = await dependencies.project_service.list_projects({
          auth,
          status: request.query.status,
          purpose: request.query.purpose,
        });
        return reply.status(200).send({ projects });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        id: string;
      };
    }>("/:id", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const project = await dependencies.project_service.get_project({
          auth,
          project_id: request.params.id,
        });
        return reply.status(200).send({ project });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.patch<{
      Params: {
        id: string;
      };
      Body: UpdateProjectInput;
    }>("/:id", {
      schema: {
        body: UpdateProjectRequestSchema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const project = await dependencies.project_service.update_project({
          auth,
          project_id: request.params.id,
          data: pick_update_project_data(request.body),
        });
        return reply.status(200).send({ project });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: {
        id: string;
      };
    }>("/:id", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        await dependencies.project_service.delete_project({
          auth,
          project_id: request.params.id,
        });
        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
