import type { Pool } from "pg";
import { AUDIT_COVERAGE_REGISTRY } from "../modules/audit/audit-coverage-registry";

type VerificationPool = Pick<Pool, "query">;

const throw_verification_issues = (rows: Array<{ issue: string }>) => {
  if (rows.length) {
    throw new Error(
      `Audit schema verification failed: ${rows.map(({ issue }) => issue).join(", ")}`,
    );
  }
  return { status: "ready" as const };
};

export const verify_audit_core_schema = async (
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
    ), expected_functions(signature) AS (VALUES
      ('audit_schema.is_maintenance_bypass(oid)'),
      ('audit_schema.reject_audit_mutation()'),
      ('audit_schema.reject_audit_truncate()'),
      ('audit_schema.require_project_insert_context()'),
      ('audit_schema.verify_project_insert_evidence()')
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
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = expected.name AND NOT tgisinternal
    )
    UNION ALL
    SELECT 'function:' || expected.signature
    FROM expected_functions expected
    WHERE to_regprocedure(expected.signature) IS NULL
      OR has_function_privilege(
        $1::text,
        to_regprocedure(expected.signature),
        'EXECUTE'
      ) IS DISTINCT FROM true
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
  return throw_verification_issues(result.rows);
};

export const verify_audit_schema = async (
  pool: VerificationPool,
  roles: { runtime_role: string; maintenance_role: string },
) => {
  const guards = new Map<
    string,
    {
      schema_name: string;
      table_name: string;
      sql_operation: string;
      entity_type: string;
      tenant_mode: string;
      commands: string[];
      context_trigger: string;
      evidence_trigger: string;
    }
  >();
  for (const registration of AUDIT_COVERAGE_REGISTRY) {
    for (const write of registration.writes) {
      const key = `${write.table}:${write.sql_operation}`;
      const [schema_name, table_name] = write.table.split(".") as [
        string,
        string,
      ];
      const existing = guards.get(key);
      if (existing) {
        if (!existing.commands.includes(registration.command))
          existing.commands.push(registration.command);
        continue;
      }
      const operation_short = write.sql_operation === "INSERT" ? "i" : "u";
      guards.set(key, {
        schema_name,
        table_name,
        sql_operation: write.sql_operation,
        entity_type: write.entity_type,
        tenant_mode:
          write.table === "user_schema.user"
            ? "context"
            : write.table === "organization_schema.organization"
              ? "id"
              : write.table === "publish_schema.public_publish_viewer_session"
                ? "viewer"
                : "direct",
        commands: [registration.command],
        context_trigger: `${table_name}_${operation_short}_audit_ctx`,
        evidence_trigger: `${table_name}_${operation_short}_audit_evd`,
      });
    }
  }
  const expected_guards = JSON.stringify(
    [...guards.values()].map((guard) => ({
      ...guard,
      commands: guard.commands.join(","),
    })),
  );
  const result = await pool.query<{ issue: string }>(
    `
    WITH expected_triggers(name) AS (VALUES
      ('audit_event_append_only'),
      ('audit_event_no_truncate'),
      ('audit_change_item_append_only'),
      ('audit_change_item_no_truncate')
    ), expected_guards AS (
      SELECT * FROM jsonb_to_recordset($3::jsonb) AS guard(
        schema_name text, table_name text, sql_operation text,
        entity_type text, tenant_mode text, commands text,
        context_trigger text, evidence_trigger text
      )
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
    ), expected_functions(signature) AS (VALUES
      ('audit_schema.is_maintenance_bypass(oid)'),
      ('audit_schema.reject_audit_mutation()'),
      ('audit_schema.reject_audit_truncate()'),
      ('audit_schema.mutation_command_policy_is_valid(text,text,text,text)'),
      ('audit_schema.require_mutation_context()'),
      ('audit_schema.verify_mutation_evidence()')
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
    SELECT 'guard:' || guard.schema_name || '.' || guard.table_name || ':' || guard.sql_operation
    FROM expected_guards guard
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_trigger trigger
      JOIN pg_class class ON class.oid = trigger.tgrelid
      JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
      JOIN pg_proc procedure ON procedure.oid = trigger.tgfoid
      WHERE trigger.tgname = guard.context_trigger
        AND namespace.nspname = guard.schema_name
        AND class.relname = guard.table_name
        AND procedure.proname = 'require_mutation_context'
        AND NOT trigger.tgisinternal AND trigger.tgconstraint = 0
        AND (trigger.tgtype & 1) = 1 AND (trigger.tgtype & 2) = 2
        AND (CASE guard.sql_operation WHEN 'INSERT' THEN trigger.tgtype & 4 ELSE trigger.tgtype & 16 END) <> 0
        AND encode(trigger.tgargs, 'escape') = guard.entity_type || E'\\\\000'
          || guard.tenant_mode || E'\\\\000' || guard.commands || E'\\\\000'
    ) OR NOT EXISTS (
      SELECT 1
      FROM pg_trigger trigger
      JOIN pg_class class ON class.oid = trigger.tgrelid
      JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
      JOIN pg_proc procedure ON procedure.oid = trigger.tgfoid
      JOIN pg_constraint constraint_record ON constraint_record.oid = trigger.tgconstraint
      WHERE trigger.tgname = guard.evidence_trigger
        AND namespace.nspname = guard.schema_name
        AND class.relname = guard.table_name
        AND procedure.proname = 'verify_mutation_evidence'
        AND NOT trigger.tgisinternal AND trigger.tgconstraint <> 0
        AND constraint_record.condeferrable AND constraint_record.condeferred
        AND (trigger.tgtype & 1) = 1 AND (trigger.tgtype & 2) = 0
        AND (CASE guard.sql_operation WHEN 'INSERT' THEN trigger.tgtype & 4 ELSE trigger.tgtype & 16 END) <> 0
        AND encode(trigger.tgargs, 'escape') = guard.entity_type || E'\\\\000'
          || guard.tenant_mode || E'\\\\000' || guard.commands || E'\\\\000'
    )
    UNION ALL
    SELECT 'index:' || expected.name
    FROM expected_indexes expected
    WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = expected.name)
    UNION ALL
    SELECT 'constraint:' || expected.name
    FROM expected_constraints expected
    WHERE NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = expected.name)
    UNION ALL
    SELECT 'function:' || expected.signature
    FROM expected_functions expected
    WHERE to_regprocedure(expected.signature) IS NULL
      OR has_function_privilege(
        $1::text,
        to_regprocedure(expected.signature),
        'EXECUTE'
      ) IS DISTINCT FROM true
      OR EXISTS (
        SELECT 1
        FROM pg_proc procedure
        CROSS JOIN LATERAL aclexplode(
          COALESCE(procedure.proacl, acldefault('f', procedure.proowner))
        ) privilege
        WHERE procedure.oid = to_regprocedure(expected.signature)
          AND privilege.grantee = 0
          AND privilege.privilege_type = 'EXECUTE'
      )
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
    [roles.runtime_role, roles.maintenance_role, expected_guards],
  );
  return throw_verification_issues(result.rows);
};

export const verify_evidence_schema = async (
  pool: VerificationPool,
  roles: { runtime_role: string; maintenance_role: string },
) => {
  await verify_audit_schema(pool, roles);
  const result = await pool.query<{ issue: string }>(
    `
    WITH expected_triggers(name) AS (VALUES
      ('access_event_append_only'),
      ('access_event_no_truncate')
    ), expected_indexes(name) AS (VALUES
      ('idx_access_event_organization_cursor'),
      ('idx_access_event_project_cursor'),
      ('idx_access_event_actor_cursor'),
      ('idx_access_event_root_cursor'),
      ('idx_access_event_request')
    ), expected_constraints(name) AS (VALUES
      ('fk_access_event_organization'),
      ('fk_access_event_project_organization'),
      ('fk_access_event_actor_organization'),
      ('chk_access_event_source'),
      ('chk_access_event_actor'),
      ('chk_access_event_outcome'),
      ('chk_access_event_surface'),
      ('chk_access_event_authorization'),
      ('chk_access_event_reason'),
      ('chk_access_event_transport'),
      ('chk_access_event_response_bytes')
    ), expected_privileges(privilege, expected) AS (VALUES
      ('SELECT', true),
      ('INSERT', true),
      ('UPDATE', false),
      ('DELETE', false),
      ('TRUNCATE', false),
      ('REFERENCES', false),
      ('TRIGGER', false)
    )
    SELECT 'table:audit_schema.access_event' AS issue
    WHERE to_regclass('audit_schema.access_event') IS NULL
    UNION ALL
    SELECT 'trigger:' || expected.name
    FROM expected_triggers expected
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = expected.name AND NOT tgisinternal
    )
    UNION ALL
    SELECT 'index:' || expected.name
    FROM expected_indexes expected
    WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = expected.name)
    UNION ALL
    SELECT 'constraint:' || expected.name
    FROM expected_constraints expected
    WHERE NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = expected.name)
    UNION ALL
    SELECT 'privilege:audit_schema.access_event:' || privilege || ':' || expected::text
    FROM expected_privileges
    WHERE has_table_privilege($1::text, 'audit_schema.access_event', privilege)
      IS DISTINCT FROM expected
    UNION ALL
    SELECT 'owner:audit_schema.access_event:maintenance'
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_class class
      JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
      WHERE namespace.nspname = 'audit_schema'
        AND class.relname = 'access_event'
        AND pg_get_userbyid(class.relowner) = $2::text
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
  return throw_verification_issues(result.rows);
};
