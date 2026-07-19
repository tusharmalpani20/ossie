import { AsyncLocalStorage } from "node:async_hooks";
import type { AccessRouteRegistration } from "./access-coverage-registry";
import type { AccessAuthorizationRole, AccessAuthorizationType } from "@repo/constants";
import { access_route_registration } from "./access-coverage-registry";

export type AccessAuthContext = {
  organization_id: string;
  org_user_id: string;
  actor_label: string;
  organization_role: "owner" | "member";
  auth_session_id: string;
};

export type AccessResolvedResource = {
  organization_id: string;
  project_id: string | null;
  root_resource_type: string;
  root_resource_id: string;
};

export type AccessRequestContext = {
  request_id: string;
  source_type: "web" | "extension";
  route: AccessRouteRegistration | null;
  auth: AccessAuthContext | null;
  resolved_resource: AccessResolvedResource | null;
  public_surface: "public_reader" | "public_embed" | null;
  atomic_access_event_id: string | null;
  response_access_event_id: string | null;
  authorization: {
    authorization_type: AccessAuthorizationType;
    authorization_role: AccessAuthorizationRole | null;
  } | null;
};

const storage = new AsyncLocalStorage<AccessRequestContext>();

export const run_with_access_request_context = <Result>(
  context: AccessRequestContext,
  work: () => Result,
) => storage.run(context, work);

export const current_access_request_context = () => storage.getStore() ?? null;

export const set_access_auth_context = (auth: AccessAuthContext) => {
  const context = storage.getStore();
  if (context) context.auth = auth;
};

export const set_access_resolved_resource = (
  resource: AccessResolvedResource,
) => {
  const context = storage.getStore();
  if (context) context.resolved_resource = resource;
};

export const set_access_authorization_context = (
  authorization: NonNullable<AccessRequestContext["authorization"]>,
) => {
  const context = storage.getStore();
  if (context) context.authorization = authorization;
};

type RequestLike = {
  id: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  routeOptions: { url?: string };
};

export const access_request_context = (
  request: RequestLike,
): AccessRequestContext => ({
  request_id: request.id,
  source_type:
    request.headers["x-ossie-client"] === "extension" ? "extension" : "web",
  route: request.routeOptions.url
    ? access_route_registration(request.method, request.routeOptions.url)
    : null,
  auth: null,
  resolved_resource: null,
  public_surface:
    request.headers["x-ossie-access-surface"] === "public_reader" ||
    request.headers["x-ossie-access-surface"] === "public_embed"
      ? request.headers["x-ossie-access-surface"]
      : null,
  atomic_access_event_id: null,
  response_access_event_id: null,
  authorization: null,
});
