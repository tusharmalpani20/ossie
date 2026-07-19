import { ulid } from "ulid";
import type { AuditCommandCoverage, AuditEvent } from "@repo/audit-domain";
import { current_access_request_context } from "./access-request-context";
import { write_access_event, type AccessClient } from "./access.repository";

export const write_atomic_access_for_audit = async (input: {
  client: AccessClient;
  command: AuditCommandCoverage;
  audit_event: AuditEvent;
}) => {
  const context = current_access_request_context();
  const route = context?.route;
  if (!context || !route || !route.atomic_commands.includes(input.command.command))
    return;

  const should_write =
    route.policy === "authentication_outcome" ||
    (route.policy === "extension_conditional" &&
      context.source_type === "extension");
  if (!should_write) return;

  const anonymous = input.command.command === "publish.viewer_session.create";
  const id = ulid();
  await write_access_event(input.client, {
    id,
    organization_id: input.audit_event.organization_id,
    project_id: input.audit_event.project_id,
    root_resource_type: input.audit_event.root_resource_type,
    root_resource_id: input.audit_event.root_resource_id,
    action: route.action,
    source_type: context.source_type,
    actor_type: anonymous ? "anonymous" : input.audit_event.actor_type,
    actor_org_user_id: anonymous
      ? null
      : input.audit_event.actor_org_user_id,
    actor_label: anonymous ? "anonymous" : input.audit_event.actor_label,
    request_id: context.request_id,
    http_method: route.method,
    route_template: route.route_template,
    access_surface:
      route.policy === "extension_conditional" ? "extension" : route.surface,
    authorization_type: context.authorization?.authorization_type ?? route.authorization_type,
    authorization_role: context.authorization?.authorization_role ?? (
      route.authorization_type === "organization_role"
        ? (context.auth?.organization_role ?? null)
        : null),
    outcome: "succeeded",
    reason_code: null,
    response_bytes: null,
    occurred_at: input.audit_event.occurred_at,
  });
  context.atomic_access_event_id = id;
};
