import type { Pool } from "pg";
import { AUDIT_COVERAGE_REGISTRY } from "../modules/audit/audit-coverage-registry";

type VerificationPool = Pick<Pool, "query">;

export type AuditSchemaVerificationOptions = {
  skip_current_guard_registry?: boolean;
};

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
  _options: AuditSchemaVerificationOptions = {},
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
  options: AuditSchemaVerificationOptions = {},
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
      const operation_short =
        write.sql_operation === "INSERT"
          ? "i"
          : write.sql_operation === "DELETE"
            ? "d"
            : "u";
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
    options.skip_current_guard_registry
      ? []
      : [...guards.values()].map((guard) => ({
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
        AND procedure.proname = CASE guard.sql_operation
          WHEN 'DELETE' THEN 'require_delete_mutation_context'
          ELSE 'require_mutation_context'
        END
        AND NOT trigger.tgisinternal AND trigger.tgconstraint = 0
        AND (trigger.tgtype & 1) = 1 AND (trigger.tgtype & 2) = 2
        AND (CASE guard.sql_operation
          WHEN 'INSERT' THEN trigger.tgtype & 4
          WHEN 'DELETE' THEN trigger.tgtype & 8
          ELSE trigger.tgtype & 16
        END) <> 0
        AND encode(trigger.tgargs, 'escape') = CASE guard.sql_operation
          WHEN 'DELETE' THEN guard.entity_type || E'\\\\000' || guard.commands || E'\\\\000'
          ELSE guard.entity_type || E'\\\\000' || guard.tenant_mode || E'\\\\000'
            || guard.commands || E'\\\\000'
        END
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
        AND procedure.proname = CASE guard.sql_operation
          WHEN 'DELETE' THEN 'verify_delete_mutation_evidence'
          ELSE 'verify_mutation_evidence'
        END
        AND NOT trigger.tgisinternal AND trigger.tgconstraint <> 0
        AND constraint_record.condeferrable AND constraint_record.condeferred
        AND (trigger.tgtype & 1) = 1 AND (trigger.tgtype & 2) = 0
        AND (CASE guard.sql_operation
          WHEN 'INSERT' THEN trigger.tgtype & 4
          WHEN 'DELETE' THEN trigger.tgtype & 8
          ELSE trigger.tgtype & 16
        END) <> 0
        AND encode(trigger.tgargs, 'escape') = CASE guard.sql_operation
          WHEN 'DELETE' THEN guard.entity_type || E'\\\\000'
          ELSE guard.entity_type || E'\\\\000' || guard.tenant_mode || E'\\\\000'
            || guard.commands || E'\\\\000'
        END
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
  options: AuditSchemaVerificationOptions = {},
) => {
  await verify_audit_schema(pool, roles, options);
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
      ('chk_access_event_response_bytes'),
      ('chk_access_event_strings'),
      ('chk_access_event_scoped_success')
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

export const verify_project_membership_schema = async (
  pool: VerificationPool,
  roles: { runtime_role: string; maintenance_role: string },
  options: AuditSchemaVerificationOptions = {},
) => {
  await verify_evidence_schema(pool, roles, options);
  const result = await pool.query<{ issue: string }>(
    `
    WITH expected_triggers(name) AS (VALUES
      ('project_membership_owner_guard'),
      ('org_user_owner_membership_guard'),
      ('project_membership_i_audit_ctx'),
      ('project_membership_i_audit_evd'),
      ('project_membership_u_audit_ctx'),
      ('project_membership_u_audit_evd')
    ), expected_indexes(name) AS (VALUES
      ('uq_project_membership_project_org_user'),
      ('idx_project_membership_actor_discovery'),
      ('idx_project_membership_project_authorization')
    ), expected_constraints(name) AS (VALUES
      ('fk_project_membership_project_organization'),
      ('fk_project_membership_org_user_organization'),
      ('fk_project_membership_created_by_organization'),
      ('fk_project_membership_updated_by_organization'),
      ('fk_project_membership_revoked_by_organization'),
      ('chk_project_membership_role'),
      ('chk_project_membership_status'),
      ('chk_project_membership_version'),
      ('chk_project_membership_identifiers'),
      ('chk_project_membership_lifecycle'),
      ('chk_access_event_scoped_success')
    ), expected_privileges(privilege, expected) AS (VALUES
      ('SELECT', true), ('INSERT', true), ('UPDATE', true),
      ('DELETE', false), ('TRUNCATE', false), ('REFERENCES', false), ('TRIGGER', false)
    )
    SELECT 'table:project_schema.project_membership' AS issue
    WHERE to_regclass('project_schema.project_membership') IS NULL
    UNION ALL SELECT 'trigger:' || expected.name FROM expected_triggers expected
      WHERE NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = expected.name AND NOT tgisinternal)
    UNION ALL SELECT 'index:' || expected.name FROM expected_indexes expected
      WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = expected.name)
    UNION ALL SELECT 'constraint:' || expected.name FROM expected_constraints expected
      WHERE NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = expected.name)
    UNION ALL SELECT 'privilege:project_schema.project_membership:' || privilege || ':' || expected::text
      FROM expected_privileges WHERE has_table_privilege($1::text, 'project_schema.project_membership', privilege) IS DISTINCT FROM expected
    UNION ALL SELECT 'owner:project_schema.project_membership:maintenance'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_class class JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
        WHERE namespace.nspname = 'project_schema' AND class.relname = 'project_membership'
          AND pg_get_userbyid(class.relowner) = $2::text
      )
    UNION ALL SELECT 'constraint:chk_access_event_authorization:project_role'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_access_event_authorization'
          AND pg_get_constraintdef(oid) LIKE '%project_role%project_admin%editor%viewer%'
      )
    UNION ALL SELECT 'constraint:chk_access_event_scoped_success:preserved'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_access_event_scoped_success'
          AND pg_get_constraintdef(oid) LIKE '%root_resource_id IS NOT NULL%'
      )
    ORDER BY issue
  `,
    [roles.runtime_role, roles.maintenance_role],
  );
  return throw_verification_issues(result.rows);
};

export const verify_project_version_schema = async (
  pool: VerificationPool,
  roles: { runtime_role: string; maintenance_role: string },
  options: AuditSchemaVerificationOptions = {},
) => {
  await verify_project_membership_schema(pool, roles, options);
  const result = await pool.query<{ issue: string }>(
    `
    WITH expected_triggers(name) AS (VALUES
      ('project_version_slug_namespace_guard'),
      ('project_version_alias_slug_namespace_guard'),
      ('project_version_mutation_command_guard'),
      ('project_version_alias_provenance_guard'),
      ('project_version_alias_provenance_evidence_guard'),
      ('project_version_slug_alias_guard'),
      ('project_default_mutation_command_guard'),
      ('capture_session_project_version_guard'),
      ('capture_asset_project_version_guard'),
      ('capture_event_project_version_guard'),
      ('project_version_i_audit_ctx'), ('project_version_i_audit_evd'),
      ('project_version_u_audit_ctx'), ('project_version_u_audit_evd'),
      ('project_version_alias_i_audit_ctx'), ('project_version_alias_i_audit_evd')
    ), expected_indexes(name) AS (VALUES
      ('uq_project_version_id_project_organization'),
      ('uq_project_version_project_position'),
      ('uq_project_version_project_slug_ci'),
      ('idx_project_version_scope_status_position'),
      ('uq_project_version_alias_project_slug_ci'),
      ('idx_project_version_alias_version_created')
    ), expected_constraints(name) AS (VALUES
      ('fk_project_version_project_organization'),
      ('fk_project_version_created_by_organization'),
      ('fk_project_version_updated_by_organization'),
      ('fk_project_version_alias_version_scope'),
      ('fk_project_version_alias_created_by_organization'),
      ('fk_project_default_version_scope'),
      ('chk_project_version_status'), ('chk_project_version_version'),
      ('chk_project_version_position'), ('chk_project_version_name'),
      ('chk_project_version_slug'), ('chk_project_version_alias_slug')
    ), expected_functions(signature) AS (VALUES
      ('project_schema.lock_project_version_scope(text)'),
      ('project_schema.enforce_project_version_slug_namespace()'),
      ('project_schema.enforce_project_version_mutation_command()'),
      ('project_schema.enforce_project_version_alias_insert()'),
      ('project_schema.verify_project_version_alias_provenance()'),
      ('project_schema.verify_project_version_slug_alias()'),
      ('project_schema.enforce_project_default_mutation_command()'),
      ('project_schema.lock_project_version_legacy_root_insert()'),
      ('capture_schema.enforce_capture_project_version_scope()')
    ), version_privileges(privilege, expected) AS (VALUES
      ('SELECT', true), ('INSERT', true), ('UPDATE', true),
      ('DELETE', false), ('TRUNCATE', false), ('REFERENCES', false), ('TRIGGER', false)
    ), alias_privileges(privilege, expected) AS (VALUES
      ('SELECT', true), ('INSERT', true), ('UPDATE', false),
      ('DELETE', false), ('TRUNCATE', false), ('REFERENCES', false), ('TRIGGER', false)
    )
    SELECT 'table:project_schema.project_version' AS issue
      WHERE to_regclass('project_schema.project_version') IS NULL
    UNION ALL SELECT 'table:project_schema.project_version_alias'
      WHERE to_regclass('project_schema.project_version_alias') IS NULL
    UNION ALL SELECT 'column:project_schema.project.default_project_version_id'
      WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'project_schema' AND table_name = 'project'
          AND column_name = 'default_project_version_id' AND is_nullable = 'NO'
      )
    UNION ALL SELECT 'trigger:' || expected.name FROM expected_triggers expected
      WHERE NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = expected.name AND NOT tgisinternal)
    UNION ALL SELECT 'trigger:guide_project_version_legacy_content_guard'
      WHERE to_regclass('guide_schema.guide_edition') IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'guide_project_version_legacy_content_guard' AND NOT tgisinternal
        )
    UNION ALL SELECT 'trigger:interactive_demo_project_version_legacy_content_guard'
      WHERE to_regclass('interactive_demo_schema.interactive_demo_edition') IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'interactive_demo_project_version_legacy_content_guard' AND NOT tgisinternal
        )
    UNION ALL SELECT 'index:' || expected.name FROM expected_indexes expected
      WHERE NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = expected.name)
        AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = expected.name)
    UNION ALL SELECT 'constraint:' || expected.name FROM expected_constraints expected
      WHERE NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = expected.name)
    UNION ALL SELECT 'function:' || expected.signature FROM expected_functions expected
      WHERE to_regprocedure(expected.signature) IS NULL
    UNION ALL SELECT 'privilege:project_schema.project_version:' || privilege || ':' || expected::text
      FROM version_privileges WHERE has_table_privilege($1::text, 'project_schema.project_version', privilege) IS DISTINCT FROM expected
    UNION ALL SELECT 'privilege:project_schema.project_version_alias:' || privilege || ':' || expected::text
      FROM alias_privileges WHERE has_table_privilege($1::text, 'project_schema.project_version_alias', privilege) IS DISTINCT FROM expected
    UNION ALL SELECT 'owner:project_schema.project_version:maintenance'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_class class JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
        WHERE namespace.nspname = 'project_schema' AND class.relname = 'project_version'
          AND pg_get_userbyid(class.relowner) = $2::text
      )
    UNION ALL SELECT 'owner:project_schema.project_version_alias:maintenance'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_class class JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
        WHERE namespace.nspname = 'project_schema' AND class.relname = 'project_version_alias'
          AND pg_get_userbyid(class.relowner) = $2::text
      )
    UNION ALL SELECT 'trigger:project_version_alias_provenance_evidence_guard:not_deferred'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_trigger trigger JOIN pg_constraint constraint_record ON constraint_record.oid = trigger.tgconstraint
        WHERE trigger.tgname = 'project_version_alias_provenance_evidence_guard'
          AND constraint_record.condeferrable AND constraint_record.condeferred
      )
    UNION ALL SELECT 'trigger:project_version_slug_alias_guard:not_deferred'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_trigger trigger JOIN pg_constraint constraint_record ON constraint_record.oid = trigger.tgconstraint
        WHERE trigger.tgname = 'project_version_slug_alias_guard'
          AND constraint_record.condeferrable AND constraint_record.condeferred
      )
    UNION ALL SELECT 'column:project_version:json_forbidden'
      WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'project_schema'
          AND table_name IN ('project_version', 'project_version_alias')
          AND data_type IN ('json', 'jsonb')
      )
    UNION ALL SELECT 'trigger:capture_session_project_version_guard:delete'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'capture_session_project_version_guard'
          AND pg_get_triggerdef(oid) LIKE '%INSERT OR DELETE OR UPDATE%'
      )
    UNION ALL SELECT 'trigger:capture_asset_project_version_guard:delete'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'capture_asset_project_version_guard'
          AND pg_get_triggerdef(oid) LIKE '%INSERT OR DELETE OR UPDATE%'
      )
    UNION ALL SELECT 'trigger:capture_event_project_version_guard:delete'
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'capture_event_project_version_guard'
          AND pg_get_triggerdef(oid) LIKE '%INSERT OR DELETE OR UPDATE%'
      )
    ORDER BY issue
  `,
    [roles.runtime_role, roles.maintenance_role],
  );
  return throw_verification_issues(result.rows);
};

export const verify_artifact_edition_schema = async (
  pool: VerificationPool,
  roles: { runtime_role: string; maintenance_role: string },
  options: AuditSchemaVerificationOptions = {},
) => {
  await verify_project_version_schema(pool, roles, options);
  const result = await pool.query<{ issue: string }>(
    `
    -- Verify guide_schema.guide_edition and
    -- interactive_demo_schema.interactive_demo_working_draft explicitly.
    WITH expected_tables(schema_name, table_name) AS (VALUES
      ('guide_schema', 'guide'),
      ('guide_schema', 'guide_edition'),
      ('guide_schema', 'guide_working_draft'),
      ('guide_schema', 'guide_block'),
      ('guide_schema', 'guide_step'),
      ('guide_schema', 'guide_annotation'),
      ('interactive_demo_schema', 'interactive_demo'),
      ('interactive_demo_schema', 'interactive_demo_edition'),
      ('interactive_demo_schema', 'interactive_demo_working_draft'),
      ('interactive_demo_schema', 'demo_scene'),
      ('interactive_demo_schema', 'demo_hotspot'),
      ('interactive_demo_schema', 'demo_transition')
    ), expected_triggers(name) AS (VALUES
      ('guide_edition_exactly_one_working_draft'),
      ('interactive_demo_edition_exactly_one_working_draft'),
      ('guide_artifact_mutation_guard'), ('guide_edition_mutation_guard'),
      ('guide_working_draft_mutation_guard'), ('guide_block_mutation_guard'),
      ('guide_step_mutation_guard'), ('guide_annotation_mutation_guard'),
      ('interactive_demo_artifact_mutation_guard'),
      ('interactive_demo_edition_mutation_guard'),
      ('interactive_demo_working_draft_mutation_guard'),
      ('demo_scene_mutation_guard'), ('demo_hotspot_mutation_guard'),
      ('demo_transition_mutation_guard'), ('guide_step_asset_version_guard'),
      ('demo_scene_asset_version_guard')
    ), expected_constraints(name) AS (VALUES
      ('uq_guide_edition_artifact_version'),
      ('uq_interactive_demo_edition_artifact_version'),
      ('fk_guide_edition_version_scope'),
      ('fk_interactive_demo_edition_version_scope'),
      ('fk_guide_annotation_step_scope'), ('fk_demo_transition_target_scope'),
      ('uq_capture_session_id_version_project_organization'),
      ('uq_capture_asset_id_project_organization'),
      ('uq_capture_event_id_session_project_organization')
    ), expected_functions(signature) AS (VALUES
      ('project_schema.enforce_artifact_edition_mutation()'),
      ('project_schema.enforce_authored_asset_version_scope()'),
      ('guide_schema.verify_guide_edition_working_draft()'),
      ('interactive_demo_schema.verify_interactive_demo_edition_working_draft()')
    )
    SELECT 'table:' || expected.schema_name || '.' || expected.table_name
      FROM expected_tables expected
      WHERE to_regclass(expected.schema_name || '.' || expected.table_name) IS NULL
    UNION ALL SELECT 'trigger:' || expected.name FROM expected_triggers expected
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = expected.name AND NOT tgisinternal
      )
    UNION ALL SELECT 'constraint:' || expected.name FROM expected_constraints expected
      WHERE NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = expected.name)
    UNION ALL SELECT 'function:' || expected.signature FROM expected_functions expected
      WHERE to_regprocedure(expected.signature) IS NULL
    UNION ALL SELECT 'column:guide_schema.guide:identity_only'
      WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'guide_schema' AND table_name = 'guide'
          AND column_name IN ('title', 'description', 'status', 'version', 'updated_at')
      )
    UNION ALL SELECT 'column:interactive_demo_schema.interactive_demo:identity_only'
      WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'interactive_demo_schema' AND table_name = 'interactive_demo'
          AND column_name IN ('title', 'description', 'status', 'version', 'updated_at')
      )
    UNION ALL SELECT 'column:guide_schema.guide_block:content_json_forbidden'
      WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'guide_schema' AND table_name = 'guide_block'
          AND (column_name = 'content' OR data_type IN ('json', 'jsonb'))
      )
    UNION ALL SELECT 'column:interactive_demo_schema.demo_hotspot:target_forbidden'
      WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'interactive_demo_schema' AND table_name = 'demo_hotspot'
          AND column_name = 'target_scene_id'
      )
    UNION ALL SELECT 'column:working_draft:json_forbidden'
      WHERE EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name IN ('guide_working_draft', 'interactive_demo_working_draft')
          AND data_type IN ('json', 'jsonb')
      )
    UNION ALL SELECT 'privilege:' || expected.schema_name || '.' || expected.table_name || ':DELETE:false'
      FROM expected_tables expected
      WHERE has_table_privilege($1::text, expected.schema_name || '.' || expected.table_name, 'DELETE')
    UNION ALL SELECT 'owner:' || expected.schema_name || '.' || expected.table_name || ':maintenance'
      FROM expected_tables expected
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_class class
        JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
        WHERE namespace.nspname = expected.schema_name
          AND class.relname = expected.table_name
          AND pg_get_userbyid(class.relowner) = $2::text
      )
    ORDER BY 1
    `,
    [roles.runtime_role, roles.maintenance_role],
  );
  return throw_verification_issues(result.rows);
};

export const verify_artifact_revision_schema = async (
  pool: VerificationPool,
  roles: { runtime_role: string; maintenance_role: string },
  options: AuditSchemaVerificationOptions = {},
  publication_projection_expected = true,
) => {
  await verify_artifact_edition_schema(pool, roles, options);
  const result = await pool.query<{ issue: string }>(
    `
    -- Verify guide_schema.guide_revision and protected Asset tables explicitly.
    WITH expected_tables(schema_name,table_name) AS (VALUES
      ('guide_schema','guide_revision'),('guide_schema','guide_revision_block'),('guide_schema','guide_revision_step'),
      ('guide_schema','guide_revision_annotation'),('interactive_demo_schema','interactive_demo_revision'),
      ('interactive_demo_schema','demo_revision_scene'),('interactive_demo_schema','demo_revision_hotspot'),
      ('interactive_demo_schema','demo_revision_transition'),('project_schema','artifact_carry_forward'),
      ('project_schema','artifact_carry_forward_item'),('guide_schema','guide_carry_forward_item'),
      ('interactive_demo_schema','interactive_demo_carry_forward_item'),('capture_schema','capture_asset_purge_operation'),
      ('publish_schema','published_artifact_capture_asset')
    ), checked_tables AS (
      SELECT * FROM expected_tables
      WHERE table_name <> 'published_artifact_capture_asset' OR $3::boolean
    ), expected_triggers(name) AS (VALUES ('capture_asset_purge_request_guard'),('capture_asset_lifecycle_guard'),
      ('file_purge_guard'),('guide_step_asset_lifecycle_guard'),('demo_scene_asset_lifecycle_guard'),
      ('guide_edition_lineage_guard'),('interactive_demo_edition_lineage_guard'),('guide_revision_block_shape_guard'),
      ('artifact_carry_forward_item_detail_guard')
    ), expected_functions(signature) AS (VALUES ('project_schema.prevent_immutable_revision_mutation()'),
      ('project_schema.enforce_artifact_edition_lineage()'),('capture_schema.enforce_capture_asset_reference_lifecycle()'),
      ('capture_schema.enforce_capture_asset_lifecycle_mutation()'),('capture_schema.enforce_capture_asset_purge_request()'))
    SELECT 'table:'||schema_name||'.'||table_name FROM checked_tables
      WHERE to_regclass(schema_name||'.'||table_name) IS NULL
    UNION ALL SELECT 'trigger:'||name FROM expected_triggers WHERE NOT EXISTS(
      SELECT 1 FROM pg_trigger WHERE tgname=name AND NOT tgisinternal)
    UNION ALL SELECT 'function:'||signature FROM expected_functions WHERE to_regprocedure(signature) IS NULL
    UNION ALL SELECT 'column:revision_history:json_forbidden' WHERE EXISTS(SELECT 1 FROM information_schema.columns
      WHERE table_name IN ('guide_revision','guide_revision_block','guide_revision_step','guide_revision_annotation',
        'interactive_demo_revision','demo_revision_scene','demo_revision_hotspot','demo_revision_transition',
        'artifact_carry_forward','artifact_carry_forward_item') AND data_type IN ('json','jsonb'))
    UNION ALL SELECT 'privilege:'||schema_name||'.'||table_name||':SELECT:true' FROM checked_tables
      WHERE has_table_privilege($1::text,schema_name||'.'||table_name,'SELECT') IS DISTINCT FROM TRUE
    UNION ALL SELECT 'privilege:'||schema_name||'.'||table_name||':DELETE:false' FROM checked_tables
      WHERE has_table_privilege($1::text,schema_name||'.'||table_name,'DELETE')
    UNION ALL SELECT 'owner:'||schema_name||'.'||table_name||':maintenance' FROM checked_tables expected
      WHERE NOT EXISTS(SELECT 1 FROM pg_class class JOIN pg_namespace namespace ON namespace.oid=class.relnamespace
        WHERE namespace.nspname=expected.schema_name AND class.relname=expected.table_name AND pg_get_userbyid(class.relowner)=$2::text)
    ORDER BY 1`,
    [
      roles.runtime_role,
      roles.maintenance_role,
      publication_projection_expected,
    ],
  );
  return throw_verification_issues(result.rows);
};

export const verify_publication_schema = async (
  pool: VerificationPool,
  roles: { runtime_role: string; maintenance_role: string },
  options: AuditSchemaVerificationOptions = {},
) => {
  await verify_artifact_revision_schema(pool, roles, options, false);
  const result = await pool.query<{ issue: string }>(
    `
    WITH expected_tables(name) AS (VALUES ('published_artifact'),('publish_link'),('publish_link_entry'),('public_publish_viewer_session'))
    SELECT 'table:publish_schema.'||name FROM expected_tables WHERE to_regclass('publish_schema.'||name) IS NULL
    UNION ALL SELECT 'legacy:published_artifact_capture_asset' WHERE to_regclass('publish_schema.published_artifact_capture_asset') IS NOT NULL
    UNION ALL SELECT 'column:snapshot_json' WHERE EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='publish_schema' AND column_name IN('snapshot_json','version_number','published_artifact_id') AND table_name IN('published_artifact','publish_link'))
    UNION ALL SELECT 'trigger:published_artifact_immutable_guard' WHERE NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='published_artifact_immutable_guard' AND NOT tgisinternal)
    UNION ALL SELECT 'trigger:publish_link_entry_manifest_guard' WHERE NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='publish_link_entry_manifest_guard' AND NOT tgisinternal)
    UNION ALL SELECT 'privilege:published_artifact:UPDATE' WHERE has_table_privilege($1::text,'publish_schema.published_artifact','UPDATE')
    UNION ALL SELECT 'privilege:published_artifact:DELETE' WHERE has_table_privilege($1::text,'publish_schema.published_artifact','DELETE')
    UNION ALL SELECT 'privilege:publish_link_entry:DELETE' WHERE has_table_privilege($1::text,'publish_schema.publish_link_entry','DELETE') IS DISTINCT FROM TRUE
    UNION ALL SELECT 'owner:publish_schema.'||name FROM expected_tables expected WHERE NOT EXISTS(SELECT 1 FROM pg_class class JOIN pg_namespace namespace ON namespace.oid=class.relnamespace WHERE namespace.nspname='publish_schema' AND class.relname=expected.name AND pg_get_userbyid(class.relowner)=$2::text)
    ORDER BY 1`,
    [roles.runtime_role, roles.maintenance_role],
  );
  return throw_verification_issues(result.rows);
};
