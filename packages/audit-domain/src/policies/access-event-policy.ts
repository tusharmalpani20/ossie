import {
  ACCESS_ACTOR_TYPES,
  ACCESS_AUTHORIZATION_TYPES,
  ACCESS_OUTCOMES,
  ACCESS_REASON_CODES,
  ACCESS_SOURCE_TYPES,
  ACCESS_SURFACES,
} from "@repo/constants";
import { AccessDomainError } from "../errors/access-domain-error";
import type { AccessEvent } from "../types/access-evidence";

const values = <T extends readonly string[]>(input: T) => new Set<string>(input);
const actor_types = values(ACCESS_ACTOR_TYPES);
const source_types = values(ACCESS_SOURCE_TYPES);
const outcomes = values(ACCESS_OUTCOMES);
const surfaces = values(ACCESS_SURFACES);
const authorization_types = values(ACCESS_AUTHORIZATION_TYPES);
const reason_codes = values(ACCESS_REASON_CODES);
const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const ulid_pattern = /^[0-9A-HJKMNP-TV-Z]{26}$/u;
const access_event_keys = new Set([
  "id", "organization_id", "project_id", "root_resource_type",
  "root_resource_id", "action", "source_type", "actor_type",
  "actor_org_user_id", "actor_label", "request_id", "http_method",
  "route_template", "access_surface", "authorization_type",
  "authorization_role", "outcome", "reason_code", "response_bytes",
  "occurred_at",
]);

const has_control_character = (value: string) =>
  [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

const bounded = (value: string, max: number) =>
  value.length > 0 && value.length <= max && !has_control_character(value);

const optional_bounded = (value: string | null, max: number) =>
  value === null || bounded(value, max);

const fail = () => {
  throw new AccessDomainError();
};

export const validate_access_event = (input: AccessEvent): AccessEvent => {
  if (
    typeof input !== "object" ||
    input === null ||
    Object.keys(input).some((key) => !access_event_keys.has(key)) ||
    !ulid_pattern.test(input.id) ||
    !ulid_pattern.test(input.organization_id) ||
    (input.project_id !== null && !ulid_pattern.test(input.project_id)) ||
    !bounded(input.root_resource_type, 80) ||
    (input.root_resource_id !== null && !ulid_pattern.test(input.root_resource_id)) ||
    !bounded(input.action, 120) ||
    !bounded(input.actor_label, 200) ||
    (input.actor_org_user_id !== null && !ulid_pattern.test(input.actor_org_user_id)) ||
    !optional_bounded(input.request_id, 255) ||
    !actor_types.has(input.actor_type) ||
    !source_types.has(input.source_type) ||
    !outcomes.has(input.outcome) ||
    !surfaces.has(input.access_surface) ||
    !authorization_types.has(input.authorization_type) ||
    (input.reason_code !== null && !reason_codes.has(input.reason_code))
  ) fail();

  const occurred_at = new Date(input.occurred_at);
  if (Number.isNaN(occurred_at.valueOf()) || occurred_at.toISOString() !== input.occurred_at) fail();

  if ((input.actor_type === "org_user") !== Boolean(input.actor_org_user_id)) fail();
  if (input.actor_type === "anonymous" && input.actor_label !== "anonymous") fail();

  const http_fields = [input.request_id, input.http_method, input.route_template];
  if (http_fields.some(Boolean) && http_fields.some((value) => value === null)) fail();
  if (input.http_method !== null && !methods.has(input.http_method)) fail();
  if (
    input.route_template !== null &&
    (!bounded(input.route_template, 255) ||
      !input.route_template.startsWith("/") ||
      /[?#@]/u.test(input.route_template))
  ) fail();

  if (
    input.authorization_type === "organization_role"
      ? input.authorization_role !== "owner" && input.authorization_role !== "member"
      : input.authorization_role !== null
  ) fail();

  if (input.outcome === "succeeded" ? input.reason_code !== null : input.reason_code === null) fail();
  if (input.outcome === "succeeded" && input.root_resource_id === null) fail();
  if (
    input.response_bytes !== null &&
    (input.access_surface !== "download" ||
      input.outcome !== "succeeded" ||
      !Number.isSafeInteger(input.response_bytes) ||
      input.response_bytes < 0)
  ) fail();

  return input;
};
