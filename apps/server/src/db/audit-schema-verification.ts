import type { Pool } from "pg";

type VerificationPool = Pick<Pool, "query">;

export const verify_audit_schema = async (
  pool: VerificationPool,
  roles: { runtime_role: string; maintenance_role: string },
) => {
  const result = await pool.query<{ issue: string }>(
    `
    WITH expected_triggers(name) AS (VALUES
      ('audit_event_append_only'),
      ('audit_event_no_truncate'),
      ('audit_change_item_append_only'),
      ('audit_change_item_no_truncate'),
      ('project_insert_audit_context_guard'),
      ('project_insert_audit_evidence_guard')
    ), expected_indexes(name) AS (VALUES
      ('idx_audit_event_organization_cursor'),
      ('idx_audit_event_project_cursor'),
      ('idx_audit_event_root_cursor'),
      ('idx_audit_event_actor_cursor'),
      ('idx_audit_event_request'),
      ('idx_audit_event_idempotency'),
      ('idx_audit_change_item_event_order'),
      ('idx_audit_change_item_entity')
    ), expected_constraints(name) AS (VALUES
      ('fk_audit_event_organization'),
      ('fk_audit_event_project_organization'),
      ('fk_audit_event_actor_organization'),
      ('chk_audit_event_row_versions'),
      ('chk_audit_event_digest'),
      ('fk_audit_change_item_event_organization'),
      ('chk_audit_change_item_shape'),
      ('chk_audit_change_item_before_count'),
      ('chk_audit_change_item_after_count'),
      ('chk_audit_change_item_before_type'),
      ('chk_audit_change_item_after_type')
    ), expected_privileges(table_name, privilege, expected) AS (VALUES
      ('audit_schema.audit_event', 'SELECT', true),
      ('audit_schema.audit_event', 'INSERT', true),
      ('audit_schema.audit_event', 'UPDATE', false),
      ('audit_schema.audit_event', 'DELETE', false),
      ('audit_schema.audit_event', 'TRUNCATE', false),
      ('audit_schema.audit_change_item', 'SELECT', true),
      ('audit_schema.audit_change_item', 'INSERT', true),
      ('audit_schema.audit_change_item', 'UPDATE', false),
      ('audit_schema.audit_change_item', 'DELETE', false),
      ('audit_schema.audit_change_item', 'TRUNCATE', false)
    )
    SELECT 'trigger:' || expected.name AS issue
    FROM expected_triggers expected
    WHERE NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = expected.name AND NOT tgisinternal)
    UNION ALL
    SELECT 'index:' || expected.name
    FROM expected_indexes expected
    WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = expected.name)
    UNION ALL
    SELECT 'constraint:' || expected.name
    FROM expected_constraints expected
    WHERE NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = expected.name)
    UNION ALL
    SELECT 'privilege:' || table_name || ':' || privilege || ':' || expected::text
    FROM expected_privileges
    WHERE has_table_privilege($1::text, table_name, privilege) IS DISTINCT FROM expected
    UNION ALL
    SELECT 'privilege:audit_schema:USAGE:true'
    WHERE has_schema_privilege($1::text, 'audit_schema', 'USAGE') IS DISTINCT FROM true
    UNION ALL
    SELECT 'role:runtime_maintenance_membership:false'
    WHERE pg_has_role($1::text, $2::text, 'MEMBER')
    UNION ALL
    SELECT 'owner:audit_schema:maintenance'
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_namespace
      WHERE nspname = 'audit_schema' AND pg_get_userbyid(nspowner) = $2::text
    )
    UNION ALL
    SELECT 'column:audit_schema:json_forbidden'
    WHERE EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'audit_schema' AND data_type IN ('json', 'jsonb')
    )
    ORDER BY issue
    `,
    [roles.runtime_role, roles.maintenance_role],
  );
  if (result.rows.length) {
    throw new Error(
      `Audit schema verification failed: ${result.rows.map(({ issue }) => issue).join(", ")}`,
    );
  }
  return { status: "ready" as const };
};
