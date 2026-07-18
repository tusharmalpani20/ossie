export const quote_database_identifier = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

const role_placeholder_pattern = /__OSSIE_[A-Z_]+__/gu;

const assert_role_identifier = (identifier: string) => {
  if (!identifier || identifier.length > 63 || [...identifier].some((character) => character.charCodeAt(0) <= 31)) {
    throw new Error("Invalid database role identifier");
  }
};

export const render_database_role_identifiers = (
  sql: string,
  roles: { runtime_role: string; maintenance_role: string },
) => {
  assert_role_identifier(roles.runtime_role);
  assert_role_identifier(roles.maintenance_role);
  const allowed = new Set(["__OSSIE_RUNTIME_DB_ROLE__", "__OSSIE_MAINTENANCE_DB_ROLE__"]);
  const placeholders = sql.match(role_placeholder_pattern) ?? [];
  if (placeholders.some((placeholder) => !allowed.has(placeholder))) {
    throw new Error("Unknown database role placeholder");
  }
  const rendered = sql
    .replaceAll("__OSSIE_RUNTIME_DB_ROLE__", quote_database_identifier(roles.runtime_role))
    .replaceAll("__OSSIE_MAINTENANCE_DB_ROLE__", quote_database_identifier(roles.maintenance_role));
  if (role_placeholder_pattern.test(rendered)) {
    throw new Error("Unrendered database role placeholder");
  }
  return rendered;
};
