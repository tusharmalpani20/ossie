import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import {
  DocumentationReviewCancelRequestSchema,
  DocumentationReviewDecisionRequestSchema,
  DocumentationReviewNotificationReadRequestSchema,
  DocumentationReviewPolicyUpdateRequestSchema,
  DocumentationReviewRequestCreateRequestSchema,
} from "@repo/types";
import { z } from "zod";
import { web_session_cookie_name } from "../authentication/session-cookie";
import type { AuthContext } from "../authentication/session.service";
import { error_response } from "../shared/http-errors";
import { set_access_resolved_resource } from "../access/access-request-context";

const Params = z
  .object({
    project_id: z.string().trim().min(1),
    version_slug: z.string().trim().min(1),
  })
  .strict();
const SiteParams = Params.extend({
  site_id: z.string().trim().min(1),
}).strict();
const RequestParams = SiteParams.extend({
  review_request_id: z.string().trim().min(1),
}).strict();
const NotificationParams = Params.extend({
  notification_id: z.string().trim().min(1),
}).strict();
const EvidenceParams = SiteParams.extend({
  evidence_id: z.string().trim().min(1),
}).strict();
const IdempotencyKey = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[\x21-\x7e]+$/u);
const PageQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(50),
    cursor: z.string().min(1).optional(),
  })
  .strict();
const ReviewQuery = PageQuery.extend({
  status: z
    .enum([
      "open",
      "approved",
      "rejected",
      "canceled",
      "superseded",
      "invalidated",
      "all",
    ])
    .default("open"),
  participation: z
    .enum(["all", "requested_by_me", "assigned_to_me"])
    .default("all"),
}).strict();
const InboxQuery = PageQuery.extend({
  status: z.enum(["unread", "read", "all"]).default("unread"),
}).strict();
const EvidenceQuery = PageQuery.extend({
  revision_id: z.string().trim().min(1).optional(),
  site_publication_id: z.string().trim().min(1).optional(),
  outcome: z
    .enum(["not_required", "approved", "overridden", "all"])
    .default("all"),
}).strict();
const GateQuery = z.object({ revision_id: z.string().trim().min(1) }).strict();

type Service = Record<
  | "get_policy"
  | "update_policy"
  | "list_candidates"
  | "create_request"
  | "list_requests"
  | "get_request"
  | "decide"
  | "cancel"
  | "preview_gate"
  | "list_inbox"
  | "mark_read"
  | "list_evidence"
  | "get_evidence",
  (input: any) => Promise<unknown>
>;

export type DocumentationReviewRouteDependencies = {
  auth_service: {
    get_current_auth_context(session?: string): Promise<AuthContext>;
  };
  resolve_project_version(input: {
    organization_id: string;
    actor_org_user_id: string;
    project_id: string;
    version_slug: string;
  }): Promise<{ id: string }>;
  documentation_review_service: Service;
};

export const build_documentation_review_routes =
  (dependencies: DocumentationReviewRouteDependencies): FastifyPluginAsync =>
  async (app: FastifyInstance) => {
    const scope = async (
      request: { cookies: Record<string, string | undefined> },
      params: z.infer<typeof Params>,
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
    const handler =
      (
        paramsSchema: z.ZodTypeAny,
        operation: (
          request: any,
          params: any,
          resolved: Record<string, string>,
        ) => Promise<unknown>,
        successStatus = 200,
      ) =>
      async (request: any, reply: any) => {
        try {
          const params = paramsSchema.parse(request.params) as z.infer<
            typeof Params
          >;
          const resolved = await scope(request, params);
          const result = await operation(request, params, resolved);
          const status =
            successStatus === 201 &&
            result &&
            typeof result === "object" &&
            "idempotent_replay" in result
              ? 200
              : successStatus;
          return reply.status(status).send(result);
        } catch (error) {
          if (error instanceof z.ZodError)
            return reply
              .status(400)
              .send(error_response("invalid_request", "Invalid request"));
          const code =
            error && typeof error === "object" && "code" in error
              ? String(error.code)
              : "documentation_review_failed";
          const status =
            code.endsWith("_not_found") || code.endsWith("_missing")
              ? 404
              : code.includes("candidate") ||
                  code.includes("self_assignment") ||
                  code.includes("policy_invalid") ||
                  code.includes("limit_exceeded")
                ? 422
                : code.includes("forbidden") ||
                    code.includes("assignment_required")
                  ? 403
                  : code.includes("conflict") ||
                      code.includes("not_latest") ||
                      code.includes("read_only")
                    ? 409
                    : 400;
          return reply
            .status(status)
            .send(error_response(code, "Documentation review request failed"));
        }
      };

    const sitePath =
      "/:project_id/versions/:version_slug/documentation-sites/:site_id";

    app.get(
      `${sitePath}/review-policy`,
      handler(SiteParams, (_request, params, resolved) =>
        dependencies.documentation_review_service.get_policy({
          ...resolved,
          site_id: params.site_id,
        }),
      ),
    );
    app.patch(
      `${sitePath}/review-policy`,
      handler(SiteParams, (request, params, resolved) =>
        dependencies.documentation_review_service.update_policy({
          ...resolved,
          site_id: params.site_id,
          idempotency_key: IdempotencyKey.parse(
            request.headers["idempotency-key"],
          ),
          data: DocumentationReviewPolicyUpdateRequestSchema.parse(
            request.body,
          ),
        }),
      ),
    );
    app.get(
      `${sitePath}/review-candidates`,
      handler(SiteParams, (request, params, resolved) =>
        dependencies.documentation_review_service.list_candidates({
          ...resolved,
          site_id: params.site_id,
          ...PageQuery.parse(request.query),
        }),
      ),
    );
    app.get(
      `${sitePath}/review-gate`,
      handler(SiteParams, (request, params, resolved) => {
        const query = GateQuery.parse(request.query);
        return dependencies.documentation_review_service.preview_gate({
          ...resolved,
          site_id: params.site_id,
          revision_id: query.revision_id,
        });
      }),
    );
    app.post(
      `${sitePath}/reviews`,
      handler(
        SiteParams,
        (request, params, resolved) =>
          dependencies.documentation_review_service.create_request({
            ...resolved,
            site_id: params.site_id,
            idempotency_key: IdempotencyKey.parse(
              request.headers["idempotency-key"],
            ),
            data: DocumentationReviewRequestCreateRequestSchema.parse(
              request.body,
            ),
          }),
        201,
      ),
    );
    app.get(
      `${sitePath}/reviews`,
      handler(SiteParams, (request, params, resolved) =>
        dependencies.documentation_review_service.list_requests({
          ...resolved,
          site_id: params.site_id,
          ...ReviewQuery.parse(request.query),
        }),
      ),
    );
    app.get(
      `${sitePath}/reviews/:review_request_id`,
      handler(RequestParams, (_request, params, resolved) =>
        dependencies.documentation_review_service.get_request({
          ...resolved,
          site_id: params.site_id,
          review_request_id: params.review_request_id,
        }),
      ),
    );
    app.post(
      `${sitePath}/reviews/:review_request_id/decisions`,
      handler(
        RequestParams,
        (request, params, resolved) =>
          dependencies.documentation_review_service.decide({
            ...resolved,
            site_id: params.site_id,
            review_request_id: params.review_request_id,
            idempotency_key: IdempotencyKey.parse(
              request.headers["idempotency-key"],
            ),
            data: DocumentationReviewDecisionRequestSchema.parse(request.body),
          }),
        201,
      ),
    );
    app.post(
      `${sitePath}/reviews/:review_request_id/cancel`,
      handler(RequestParams, (request, params, resolved) =>
        dependencies.documentation_review_service.cancel({
          ...resolved,
          site_id: params.site_id,
          review_request_id: params.review_request_id,
          idempotency_key: IdempotencyKey.parse(
            request.headers["idempotency-key"],
          ),
          data: DocumentationReviewCancelRequestSchema.parse(request.body),
        }),
      ),
    );
    app.get(
      "/:project_id/versions/:version_slug/documentation-review-inbox",
      handler(Params, async (request, _params, resolved) => {
        const result =
          await dependencies.documentation_review_service.list_inbox({
            ...resolved,
            ...InboxQuery.parse(request.query),
          });
        set_access_resolved_resource({
          organization_id: resolved.organization_id!,
          project_id: resolved.project_id!,
          root_resource_type: "project_version",
          root_resource_id: resolved.project_version_id!,
        });
        return result;
      }),
    );
    app.patch(
      "/:project_id/versions/:version_slug/documentation-review-inbox/:notification_id/read",
      handler(NotificationParams, (request, params, resolved) =>
        dependencies.documentation_review_service.mark_read({
          ...resolved,
          notification_id: params.notification_id,
          data: DocumentationReviewNotificationReadRequestSchema.parse(
            request.body,
          ),
        }),
      ),
    );
    app.get(
      `${sitePath}/review-publication-evidence`,
      handler(SiteParams, (request, params, resolved) =>
        dependencies.documentation_review_service.list_evidence({
          ...resolved,
          site_id: params.site_id,
          ...EvidenceQuery.parse(request.query),
        }),
      ),
    );
    app.get(
      `${sitePath}/review-publication-evidence/:evidence_id`,
      handler(EvidenceParams, (_request, params, resolved) =>
        dependencies.documentation_review_service.get_evidence({
          ...resolved,
          site_id: params.site_id,
          evidence_id: params.evidence_id,
        }),
      ),
    );
  };
