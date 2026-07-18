import type { AuditSourceType } from "@repo/audit-domain";

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
