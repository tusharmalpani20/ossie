import {
  AccessDomainError,
  validate_access_event,
  type AccessEvent,
} from "@repo/audit-domain";
import {
  access_route_registration,
  is_registered_access_action,
} from "./access-coverage-registry";

export type AccessClient = {
  query(sql: string, values?: unknown[]): Promise<unknown>;
};

const insert_access_event = async (
  client: AccessClient,
  event: AccessEvent,
) => {
  await client.query(
    `
    INSERT INTO audit_schema.access_event (
      id, organization_id, project_id, root_resource_type, root_resource_id,
      action, source_type, actor_type, actor_org_user_id, actor_label,
      request_id, http_method, route_template, access_surface,
      authorization_type, authorization_role, outcome, reason_code,
      response_bytes, occurred_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    )
    `,
    [
      event.id,
      event.organization_id,
      event.project_id,
      event.root_resource_type,
      event.root_resource_id,
      event.action,
      event.source_type,
      event.actor_type,
      event.actor_org_user_id,
      event.actor_label,
      event.request_id,
      event.http_method,
      event.route_template,
      event.access_surface,
      event.authorization_type,
      event.authorization_role,
      event.outcome,
      event.reason_code,
      event.response_bytes,
      event.occurred_at,
    ],
  );
};

export const write_access_event = async (
  client: AccessClient,
  input: AccessEvent,
) => {
  try {
    if (!is_registered_access_action(input.action)) throw new AccessDomainError();
    if (input.http_method !== null && input.route_template !== null) {
      const registration = access_route_registration(
        input.http_method,
        input.route_template,
      );
      const expected_action = input.outcome === "succeeded"
        ? registration?.action
        : registration?.denied_action;
      if (!registration || input.action !== expected_action)
        throw new AccessDomainError();
    }
    await insert_access_event(client, validate_access_event(input));
  } catch {
    throw new AccessDomainError();
  }
};

export const build_access_repository = (pool: AccessClient) => ({
  append: (event: AccessEvent) => write_access_event(pool, event),
});
