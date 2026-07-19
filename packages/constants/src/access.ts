export const ACCESS_ACTOR_TYPES = ["org_user", "anonymous", "system"] as const;
export const ACCESS_SOURCE_TYPES = ["web", "extension", "api", "system"] as const;
export const ACCESS_OUTCOMES = ["succeeded", "denied", "not_found", "failed"] as const;
export const ACCESS_SURFACES = [
  "portal",
  "extension",
  "api",
  "public_reader",
  "public_embed",
  "download",
  "authentication",
  "compliance",
] as const;
export const ACCESS_AUTHORIZATION_TYPES = [
  "organization_role",
  "public_link",
  "public_link_password",
  "public_secret",
  "authentication",
  "system",
] as const;
export const ACCESS_REASON_CODES = [
  "unauthenticated",
  "invalid_credentials",
  "forbidden",
  "not_found",
  "gone",
  "invalid_request",
  "conflict",
  "internal_error",
] as const;

export type AccessActorType = (typeof ACCESS_ACTOR_TYPES)[number];
export type AccessSourceType = (typeof ACCESS_SOURCE_TYPES)[number];
export type AccessOutcome = (typeof ACCESS_OUTCOMES)[number];
export type AccessSurface = (typeof ACCESS_SURFACES)[number];
export type AccessAuthorizationType = (typeof ACCESS_AUTHORIZATION_TYPES)[number];
export type AccessReasonCode = (typeof ACCESS_REASON_CODES)[number];
