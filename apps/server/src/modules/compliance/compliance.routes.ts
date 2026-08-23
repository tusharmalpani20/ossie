import type { FastifyPluginAsync, FastifyReply } from "fastify";
import {
  ComplianceAuditEventDetailResponseSchema,
  ComplianceActivitySchema,
  ComplianceEventsResponseSchema,
  ComplianceKindSchema,
  type ComplianceAuditEventDetailResponse,
  type ComplianceActivity,
  type ComplianceEventsResponse,
  type ComplianceKind,
} from "@repo/types/compliance";
import { z } from "zod";
import { session_token_from_request } from "../authentication/request-session-token";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { error_response, unauthorized_response } from "../shared/http-errors";
import {
  ComplianceAuditEventNotFoundError,
  ComplianceCursorError,
  CompliancePermissionError,
} from "./compliance.service";
import {
  ProjectNotFoundError,
  ProjectPermissionDeniedError,
} from "../project-membership/project-membership.service";

const EvidenceIdSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/u);

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().min(1).max(2048).optional(),
  kind: ComplianceKindSchema.optional(),
  activity: ComplianceActivitySchema.optional(),
  project_id: EvidenceIdSchema.optional(),
});
const DetailParamsSchema = z.object({
  audit_event_id: EvidenceIdSchema,
});

type ComplianceQuery = {
  limit?: number;
  cursor?: string;
  kind?: ComplianceKind;
  activity?: ComplianceActivity;
  project_id?: string;
};

export type ComplianceRouteDependencies = {
  auth_service: {
    get_current_auth_context(session_token?: string): Promise<AuthContext>;
  };
  compliance_service: {
    list_events(input: {
      auth: { organization_id: string; actor_role: string };
      query: ComplianceQuery;
    }): Promise<ComplianceEventsResponse>;
    get_audit_event_detail(input: {
      auth: { organization_id: string; actor_role: string };
      audit_event_id: string;
    }): Promise<ComplianceAuditEventDetailResponse>;
  };
};

const handle_error = (error: unknown, reply: FastifyReply) => {
  if (error instanceof UnauthenticatedSessionError)
    return reply.status(401).send(unauthorized_response());
  if (error instanceof CompliancePermissionError)
    return reply
      .status(403)
      .send(
        error_response(
          "compliance_permission_denied",
          "Only organization owners can view compliance evidence.",
        ),
      );
  if (error instanceof ProjectNotFoundError)
    return reply
      .status(404)
      .send(error_response("project_not_found", error.message));
  if (error instanceof ProjectPermissionDeniedError)
    return reply
      .status(403)
      .send(error_response("project_permission_denied", error.message));
  if (error instanceof ComplianceCursorError)
    return reply
      .status(400)
      .send(
        error_response(
          "invalid_compliance_cursor",
          "Compliance query or cursor is invalid",
        ),
      );
  if (error instanceof ComplianceAuditEventNotFoundError)
    return reply
      .status(404)
      .send(
        error_response("audit_event_not_found", "Audit event was not found"),
      );
  throw error;
};

export const build_compliance_routes = (
  dependencies: ComplianceRouteDependencies,
): FastifyPluginAsync =>
  async function compliance_routes(fastify) {
    const auth = async (
      request: Parameters<typeof session_token_from_request>[0],
    ) => {
      const context = await dependencies.auth_service.get_current_auth_context(
        session_token_from_request(request),
      );
      return {
        organization_id: context.organization.id,
        actor_role: context.org_user.role,
      };
    };

    fastify.get<{ Querystring: ComplianceQuery }>(
      "/events",
      {
        schema: {
          querystring: QuerySchema,
          response: { 200: ComplianceEventsResponseSchema },
        },
      },
      async (request, reply) => {
        try {
          return reply.status(200).send(
            await dependencies.compliance_service.list_events({
              auth: await auth(request),
              query: request.query,
            }),
          );
        } catch (error) {
          return handle_error(error, reply);
        }
      },
    );

    fastify.get<{ Params: { audit_event_id: string } }>(
      "/audit-events/:audit_event_id",
      {
        schema: {
          params: DetailParamsSchema,
          response: { 200: ComplianceAuditEventDetailResponseSchema },
        },
      },
      async (request, reply) => {
        try {
          return reply.status(200).send(
            await dependencies.compliance_service.get_audit_event_detail({
              auth: await auth(request),
              audit_event_id: request.params.audit_event_id,
            }),
          );
        } catch (error) {
          return handle_error(error, reply);
        }
      },
    );
  };

export const build_project_compliance_routes =
  (dependencies: {
    auth_service: {
      get_current_auth_context(session_token?: string): Promise<AuthContext>;
    };
    compliance_service: {
      list_events(input: {
        auth: { organization_id: string; actor_org_user_id: string };
        project_id: string;
        query: ComplianceQuery;
      }): Promise<ComplianceEventsResponse>;
      get_audit_event_detail(input: {
        auth: { organization_id: string; actor_org_user_id: string };
        project_id: string;
        audit_event_id: string;
      }): Promise<ComplianceAuditEventDetailResponse>;
    };
  }): FastifyPluginAsync =>
  async (fastify) => {
    const current = async (
      request: Parameters<typeof session_token_from_request>[0],
    ) => {
      const auth = await dependencies.auth_service.get_current_auth_context(
        session_token_from_request(request),
      );
      return {
        organization_id: auth.organization.id,
        actor_org_user_id: auth.org_user.id,
      };
    };
    fastify.get<{
      Params: { project_id: string };
      Querystring: ComplianceQuery;
    }>(
      "/:project_id/compliance/events",
      {
        schema: {
          querystring: QuerySchema.omit({ project_id: true }),
          response: { 200: ComplianceEventsResponseSchema },
        },
      },
      async (request, reply) => {
        try {
          return reply.status(200).send(
            await dependencies.compliance_service.list_events({
              auth: await current(request),
              project_id: request.params.project_id,
              query: request.query,
            }),
          );
        } catch (error) {
          return handle_error(error, reply);
        }
      },
    );
    fastify.get<{ Params: { project_id: string; audit_event_id: string } }>(
      "/:project_id/compliance/audit-events/:audit_event_id",
      {
        schema: {
          params: DetailParamsSchema.extend({ project_id: EvidenceIdSchema }),
          response: { 200: ComplianceAuditEventDetailResponseSchema },
        },
      },
      async (request, reply) => {
        try {
          return reply.status(200).send(
            await dependencies.compliance_service.get_audit_event_detail({
              auth: await current(request),
              project_id: request.params.project_id,
              audit_event_id: request.params.audit_event_id,
            }),
          );
        } catch (error) {
          return handle_error(error, reply);
        }
      },
    );
  };
