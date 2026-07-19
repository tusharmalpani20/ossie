import { ulid } from "ulid";
import type { AccessEvent } from "@repo/audit-domain";
import type { AccessReasonCode } from "@repo/constants";
import { current_access_request_context } from "./access-request-context";

type AccessWriter = {
  append(event: AccessEvent): Promise<void>;
};

type RequestLike = {
  method: string;
  params?: unknown;
};

type ReplyLike = {
  statusCode: number;
  code(status: number): unknown;
  header(name: string, value: string): unknown;
  getHeader(name: string): unknown;
};

const failure_payload = JSON.stringify({
  error: {
    type: "access_evidence_unavailable",
    message: "Access evidence is temporarily unavailable",
  },
});

const status_reason = (status: number): AccessReasonCode => {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 410) return "gone";
  if (status === 400) return "invalid_request";
  if (status === 409) return "conflict";
  return "internal_error";
};

const params_from_request = (request: RequestLike) =>
  typeof request.params === "object" && request.params !== null
    ? (request.params as Record<string, unknown>)
    : {};

export const build_access_response_hook = (options: {
  append: AccessWriter["append"];
  generate_id?: () => string;
  now?: () => Date;
}) => {
  const generate_id = options.generate_id ?? ulid;
  const now = options.now ?? (() => new Date());

  return async (request: RequestLike, reply: ReplyLike, payload: unknown) => {
    const context = current_access_request_context();
    const route = context?.route;
    if (!context || !route || route.policy === "excluded_transport") return payload;
    if (context.atomic_access_event_id || context.response_access_event_id)
      return payload;

    const success = reply.statusCode >= 200 && reply.statusCode < 300;
    const organization_id =
      context.resolved_resource?.organization_id ?? context.auth?.organization_id;
    if (!organization_id) return payload;

    const should_record_success =
      route.policy === "meaningful_read" ||
      route.policy === "public_access" ||
      route.policy === "authentication_outcome" ||
      (route.policy === "extension_conditional" &&
        context.source_type === "extension");
    const accepted_failure =
      [401, 403, 404, 410].includes(reply.statusCode) ||
      ((route.policy === "authentication_outcome" ||
        route.policy === "public_access") &&
        ([400, 409].includes(reply.statusCode) || reply.statusCode >= 500));
    if (success ? !should_record_success : !accepted_failure) return payload;

    const parameters = params_from_request(request);
    const parameter_value = route.root_parameter
      ? parameters[route.root_parameter]
      : null;
    const parameter_id =
      success && typeof parameter_value === "string" ? parameter_value : null;
    const resolved = context.resolved_resource;
    const root_resource_id = resolved
      ? resolved.root_resource_id
      : route.root_resource_type === "organization"
        ? organization_id
        : route.root_resource_type === "auth_session"
          ? (context.auth?.auth_session_id ?? null)
          : parameter_id;
    const project_parameter = route.project_parameter
      ? parameters[route.project_parameter]
      : null;
    const project_id = resolved
      ? resolved.project_id
      : success && typeof project_parameter === "string"
        ? project_parameter
        : success && route.root_resource_type === "project"
          ? root_resource_id
          : null;
    const download_size = reply.getHeader("content-length");
    const response_bytes =
      success &&
      route.surface === "download" &&
      (typeof download_size === "string" || typeof download_size === "number") &&
      Number.isSafeInteger(Number(download_size))
        ? Number(download_size)
        : null;

    const event: AccessEvent = {
      id: generate_id(),
      organization_id,
      project_id,
      root_resource_type:
        resolved?.root_resource_type ?? route.root_resource_type,
      root_resource_id,
      action: success ? route.action : route.denied_action,
      source_type: context.source_type,
      actor_type: context.auth ? "org_user" : "anonymous",
      actor_org_user_id: context.auth?.org_user_id ?? null,
      actor_label: context.auth?.actor_label ?? "anonymous",
      request_id: context.request_id,
      http_method: route.method,
      route_template: route.route_template,
      access_surface:
        route.policy === "public_access" && context.public_surface
          ? context.public_surface
          : context.source_type === "extension" && route.surface === "portal"
            ? "extension"
            : route.surface,
      authorization_type: route.authorization_type,
      authorization_role:
        route.authorization_type === "organization_role"
          ? (context.auth?.organization_role ?? null)
          : null,
      outcome: success
        ? "succeeded"
        : reply.statusCode === 404
          ? "not_found"
          : reply.statusCode >= 500
            ? "failed"
            : "denied",
      reason_code: success ? null : status_reason(reply.statusCode),
      response_bytes,
      occurred_at: now().toISOString(),
    };

    try {
      await options.append(event);
      context.response_access_event_id = event.id;
      return payload;
    } catch {
      if (
        typeof payload === "object" &&
        payload !== null &&
        "destroy" in payload &&
        typeof payload.destroy === "function"
      ) {
        payload.destroy();
      }
      reply.code(503);
      reply.header("content-type", "application/json; charset=utf-8");
      reply.header("content-length", String(Buffer.byteLength(failure_payload)));
      return failure_payload;
    }
  };
};
