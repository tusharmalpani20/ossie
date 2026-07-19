import type {
  AccessActorType,
  AccessAuthorizationType,
  AccessAuthorizationRole,
  AccessOutcome,
  AccessReasonCode,
  AccessSourceType,
  AccessSurface,
} from "@repo/constants";

export type AccessEvent = {
  id: string;
  organization_id: string;
  project_id: string | null;
  root_resource_type: string;
  root_resource_id: string | null;
  action: string;
  source_type: AccessSourceType;
  actor_type: AccessActorType;
  actor_org_user_id: string | null;
  actor_label: string;
  request_id: string | null;
  http_method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | null;
  route_template: string | null;
  access_surface: AccessSurface;
  authorization_type: AccessAuthorizationType;
  authorization_role: AccessAuthorizationRole | null;
  outcome: AccessOutcome;
  reason_code: AccessReasonCode | null;
  response_bytes: number | null;
  occurred_at: string;
};
