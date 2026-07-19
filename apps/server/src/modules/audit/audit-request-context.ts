import { AsyncLocalStorage } from "node:async_hooks";
import type { AuditSourceType } from "@repo/audit-domain";

export type AuditRequestContext = {
  request_id: string;
  source_type: AuditSourceType;
};

const request_context_storage = new AsyncLocalStorage<AuditRequestContext>();

export const run_with_audit_request_context = <Result>(
  context: AuditRequestContext,
  work: () => Result,
) => request_context_storage.run(context, work);

export const current_audit_request_context = () =>
  request_context_storage.getStore() ?? null;

export const current_audit_source_type = () =>
  current_audit_request_context()?.source_type ?? "web";

export const current_audit_request_id = () =>
  current_audit_request_context()?.request_id ?? null;

type RequestLike = {
  id: string;
  headers: Record<string, string | string[] | undefined>;
};

const has_control_character = (value: string) =>
  [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

export const safe_audit_actor_label = (display_name: string) => {
  const normalized = display_name.trim();
  return normalized &&
    normalized.length <= 200 &&
    !has_control_character(normalized)
    ? normalized
    : "organization-member";
};

export const audit_request_context = (
  request: RequestLike,
): {
  request_id: string;
  source_type: AuditSourceType;
} => ({
  request_id: request.id,
  source_type:
    request.headers["x-ossie-client"] === "extension" ? "extension" : "web",
});
