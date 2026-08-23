import type {
  ComplianceAccessEvent,
  ComplianceActivity,
  ComplianceAuditChangeItem,
  ComplianceAuditEventSummary,
  ComplianceAuditState,
  ComplianceKind,
} from "@repo/types/compliance";

type Queryable = {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: Row[] }>;
};

export type ComplianceCursor = {
  occurred_at: string;
  id: string;
  evidence_kind: "audit" | "access";
};

const iso = (value: unknown) =>
  value instanceof Date ? value.toISOString() : String(value);
const nullable_iso = (value: unknown) => (value == null ? null : iso(value));
const safe_count = (value: unknown) => {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0)
    throw new Error("evidence_integrity_failed");
  return count;
};
const safe_integer = (value: unknown) => {
  const integer = Number(value);
  if (!Number.isSafeInteger(integer))
    throw new Error("evidence_integrity_failed");
  return integer;
};

const map_common = (row: Record<string, unknown>) => ({
  id: String(row.id),
  organization_id: String(row.organization_id),
  project_id: row.project_id == null ? null : String(row.project_id),
  root_resource_type: String(row.root_resource_type),
  root_resource_id:
    row.root_resource_id == null ? null : String(row.root_resource_id),
  action: String(row.action),
  source_type: row.source_type as ComplianceAuditEventSummary["source_type"],
  actor_type: row.actor_type as ComplianceAuditEventSummary["actor_type"],
  actor_org_user_id:
    row.actor_org_user_id == null ? null : String(row.actor_org_user_id),
  actor_label: String(row.actor_label),
  request_id: row.request_id == null ? null : String(row.request_id),
  occurred_at: iso(row.occurred_at),
});

const map_event = (
  row: Record<string, unknown>,
): ComplianceAuditEventSummary | ComplianceAccessEvent => {
  const common = map_common(row);
  if (row.evidence_kind === "audit") {
    return {
      ...common,
      evidence_kind: "audit",
      outcome: "committed",
      correlation_id:
        row.correlation_id == null ? null : String(row.correlation_id),
      idempotency_key_hash:
        row.idempotency_key_hash == null
          ? null
          : String(row.idempotency_key_hash),
      before_row_version:
        row.before_row_version == null
          ? null
          : safe_count(row.before_row_version),
      after_row_version:
        row.after_row_version == null
          ? null
          : safe_count(row.after_row_version),
      reason: row.reason == null ? null : String(row.reason),
      change_item_count: safe_count(row.change_item_count),
    };
  }
  return {
    ...common,
    evidence_kind: "access",
    outcome: row.outcome as ComplianceAccessEvent["outcome"],
    http_method:
      row.http_method == null
        ? null
        : (row.http_method as ComplianceAccessEvent["http_method"]),
    route_template:
      row.route_template == null ? null : String(row.route_template),
    access_surface:
      row.access_surface as ComplianceAccessEvent["access_surface"],
    authorization_type:
      row.authorization_type as ComplianceAccessEvent["authorization_type"],
    authorization_role:
      row.authorization_role == null
        ? null
        : (row.authorization_role as ComplianceAccessEvent["authorization_role"]),
    reason_code:
      row.reason_code == null
        ? null
        : (row.reason_code as ComplianceAccessEvent["reason_code"]),
    response_bytes:
      row.response_bytes == null ? null : safe_count(row.response_bytes),
  };
};

const value_types = [
  "text",
  "identifier",
  "integer",
  "decimal",
  "boolean",
  "date",
  "timestamp",
  "enum",
] as const;

export const compliance_state_from_row = (
  row: Record<string, unknown>,
  side: "before" | "after",
  value_type: string | null,
): ComplianceAuditState => {
  const state = row[`${side}_state`];
  if (
    state === "absent" ||
    state === "null" ||
    state === "redacted" ||
    state === "present"
  )
    return { state };
  if (state !== "value" || !value_types.includes(value_type as never))
    throw new Error("evidence_integrity_failed");

  const populated = value_types.flatMap((type) => {
    const value = row[`${side}_${type}_value`];
    return value == null ? [] : [{ type, value }];
  });
  if (populated.length !== 1 || populated[0]?.type !== value_type)
    throw new Error("evidence_integrity_failed");
  const value = populated[0].value;
  if (value_type === "integer") {
    return { state: "value", value_type, value: safe_integer(value) };
  }
  if (value_type === "boolean") {
    if (typeof value !== "boolean")
      throw new Error("evidence_integrity_failed");
    return { state: "value", value_type, value };
  }
  if (value_type === "timestamp")
    return { state: "value", value_type, value: iso(value) };
  if (value_type === "date")
    return {
      state: "value",
      value_type,
      value:
        value instanceof Date
          ? value.toISOString().slice(0, 10)
          : String(value),
    };
  return {
    state: "value",
    value_type: value_type as "text" | "identifier" | "decimal" | "enum",
    value: String(value),
  };
};

const map_change_item = (
  row: Record<string, unknown>,
): ComplianceAuditChangeItem => ({
  id: String(row.id),
  entity_type: String(row.entity_type),
  entity_id: row.entity_id == null ? null : String(row.entity_id),
  parent_entity_type:
    row.parent_entity_type == null ? null : String(row.parent_entity_type),
  parent_entity_id:
    row.parent_entity_id == null ? null : String(row.parent_entity_id),
  logical_key: row.logical_key == null ? null : String(row.logical_key),
  operation: row.operation as ComplianceAuditChangeItem["operation"],
  field_name: row.field_name == null ? null : String(row.field_name),
  value_type:
    row.value_type == null
      ? null
      : (row.value_type as ComplianceAuditChangeItem["value_type"]),
  before: compliance_state_from_row(
    row,
    "before",
    row.value_type == null ? null : String(row.value_type),
  ),
  after: compliance_state_from_row(
    row,
    "after",
    row.value_type == null ? null : String(row.value_type),
  ),
});

export const build_compliance_repository = (db: Queryable) => ({
  async list_events(input: {
    organization_id: string;
    project_id: string | null;
    kind: ComplianceKind;
    activity: ComplianceActivity;
    cursor: ComplianceCursor | null;
    limit: number;
  }) {
    const result = await db.query<Record<string, unknown>>(
      `
      WITH audit_rows AS (
        SELECT audit_event.id, 'audit'::text AS evidence_kind,
          audit_event.organization_id, audit_event.project_id,
          audit_event.root_resource_type, audit_event.root_resource_id,
          audit_event.action, audit_event.source_type, audit_event.actor_type,
          audit_event.actor_org_user_id, audit_event.actor_label,
          audit_event.request_id, audit_event.outcome, audit_event.occurred_at,
          audit_event.correlation_id, audit_event.idempotency_key_hash,
          audit_event.before_row_version, audit_event.after_row_version,
          audit_event.reason, COUNT(audit_change_item.id)::bigint AS change_item_count,
          NULL::text AS http_method, NULL::text AS route_template,
          NULL::text AS access_surface, NULL::text AS authorization_type,
          NULL::text AS authorization_role, NULL::text AS reason_code,
          NULL::bigint AS response_bytes
        FROM audit_schema.audit_event audit_event
        LEFT JOIN audit_schema.audit_change_item audit_change_item
          ON audit_change_item.audit_event_id = audit_event.id
          AND audit_change_item.organization_id = audit_event.organization_id
        WHERE audit_event.organization_id = $1
          AND ($2::text IS NULL OR audit_event.project_id = $2)
          AND ($8::text = 'all' OR audit_event.action NOT IN (
            'authentication.session.activity_recorded',
            'authentication.session.viewed',
            'compliance.timeline_viewed',
            'compliance.audit_event_viewed'
          ))
          AND ($8::text = 'all' OR RIGHT(audit_event.action, 7) NOT IN (
            '_viewed', '.viewed'
          ))
        GROUP BY audit_event.id
      ), access_rows AS (
        SELECT access_event.id, 'access'::text AS evidence_kind,
          access_event.organization_id, access_event.project_id,
          access_event.root_resource_type, access_event.root_resource_id,
          access_event.action, access_event.source_type, access_event.actor_type,
          access_event.actor_org_user_id, access_event.actor_label,
          access_event.request_id, access_event.outcome, access_event.occurred_at,
          NULL::text AS correlation_id, NULL::text AS idempotency_key_hash,
          NULL::integer AS before_row_version, NULL::integer AS after_row_version,
          NULL::text AS reason, 0::bigint AS change_item_count,
          access_event.http_method, access_event.route_template,
          access_event.access_surface, access_event.authorization_type,
          access_event.authorization_role, access_event.reason_code,
          access_event.response_bytes
        FROM audit_schema.access_event access_event
        WHERE access_event.organization_id = $1
          AND ($2::text IS NULL OR access_event.project_id = $2)
          AND ($8::text = 'all' OR access_event.action NOT IN (
            'authentication.session.activity_recorded',
            'authentication.session.viewed',
            'compliance.timeline_viewed',
            'compliance.audit_event_viewed'
          ))
          AND ($8::text = 'all' OR access_event.outcome <> 'succeeded'
            OR RIGHT(access_event.action, 7) NOT IN ('_viewed', '.viewed'))
      ), evidence AS (
        SELECT * FROM audit_rows WHERE $3 IN ('all', 'audit')
        UNION ALL
        SELECT * FROM access_rows WHERE $3 IN ('all', 'access')
      )
      SELECT * FROM evidence
      WHERE $4::timestamptz IS NULL
        OR (occurred_at, id, evidence_kind) < ($4::timestamptz, $5::text, $6::text)
      ORDER BY occurred_at DESC, id DESC, evidence_kind DESC
      LIMIT $7
      `,
      [
        input.organization_id,
        input.project_id,
        input.kind,
        input.cursor?.occurred_at ?? null,
        input.cursor?.id ?? null,
        input.cursor?.evidence_kind ?? null,
        input.limit + 1,
        input.activity,
      ],
    );
    const has_more = result.rows.length > input.limit;
    const events = result.rows.slice(0, input.limit).map(map_event);
    const totals_result = await db.query<Record<string, unknown>>(
      `
      WITH selected AS (
        SELECT audit_event.occurred_at, 'audit'::text AS kind
        FROM audit_schema.audit_event audit_event
        WHERE audit_event.organization_id = $1
          AND ($2::text IS NULL OR audit_event.project_id = $2)
          AND $3 IN ('all', 'audit')
          AND ($4::text = 'all' OR audit_event.action NOT IN (
            'authentication.session.activity_recorded',
            'authentication.session.viewed',
            'compliance.timeline_viewed',
            'compliance.audit_event_viewed'
          ))
          AND ($4::text = 'all' OR RIGHT(audit_event.action, 7) NOT IN (
            '_viewed', '.viewed'
          ))
        UNION ALL
        SELECT access_event.occurred_at, 'access'::text AS kind
        FROM audit_schema.access_event access_event
        WHERE access_event.organization_id = $1
          AND ($2::text IS NULL OR access_event.project_id = $2)
          AND $3 IN ('all', 'access')
          AND ($4::text = 'all' OR access_event.action NOT IN (
            'authentication.session.activity_recorded',
            'authentication.session.viewed',
            'compliance.timeline_viewed',
            'compliance.audit_event_viewed'
          ))
          AND ($4::text = 'all' OR access_event.outcome <> 'succeeded'
            OR RIGHT(access_event.action, 7) NOT IN ('_viewed', '.viewed'))
      )
      SELECT
        (SELECT COUNT(*) FROM audit_schema.audit_event audit_event
          WHERE audit_event.organization_id = $1
            AND ($2::text IS NULL OR audit_event.project_id = $2)
            AND $3 IN ('all', 'audit')
            AND ($4::text = 'all' OR audit_event.action NOT IN (
              'authentication.session.activity_recorded',
              'authentication.session.viewed',
              'compliance.timeline_viewed',
              'compliance.audit_event_viewed'
            ))
            AND ($4::text = 'all' OR RIGHT(audit_event.action, 7) NOT IN (
              '_viewed', '.viewed'
            )))::bigint AS audit_events,
        (SELECT COUNT(*) FROM audit_schema.audit_change_item item
          JOIN audit_schema.audit_event audit_event ON audit_event.id = item.audit_event_id
            AND audit_event.organization_id = item.organization_id
          WHERE audit_event.organization_id = $1
            AND ($2::text IS NULL OR audit_event.project_id = $2)
            AND $3 IN ('all', 'audit')
            AND ($4::text = 'all' OR audit_event.action NOT IN (
              'authentication.session.activity_recorded',
              'authentication.session.viewed',
              'compliance.timeline_viewed',
              'compliance.audit_event_viewed'
            ))
            AND ($4::text = 'all' OR RIGHT(audit_event.action, 7) NOT IN (
              '_viewed', '.viewed'
            )))::bigint AS audit_change_items,
        (SELECT COUNT(*) FROM audit_schema.access_event access_event
          WHERE access_event.organization_id = $1
            AND ($2::text IS NULL OR access_event.project_id = $2)
            AND $3 IN ('all', 'access')
            AND ($4::text = 'all' OR access_event.action NOT IN (
              'authentication.session.activity_recorded',
              'authentication.session.viewed',
              'compliance.timeline_viewed',
              'compliance.audit_event_viewed'
            ))
            AND ($4::text = 'all' OR access_event.outcome <> 'succeeded'
              OR RIGHT(access_event.action, 7) NOT IN ('_viewed', '.viewed'))
          )::bigint AS access_events,
        MIN(occurred_at) AS oldest_occurred_at,
        MAX(occurred_at) AS newest_occurred_at
      FROM selected
      `,
      [input.organization_id, input.project_id, input.kind, input.activity],
    );
    const totals = totals_result.rows[0] ?? {};
    return {
      events,
      has_more,
      totals: {
        audit_events: safe_count(totals.audit_events ?? 0),
        audit_change_items: safe_count(totals.audit_change_items ?? 0),
        access_events: safe_count(totals.access_events ?? 0),
        oldest_occurred_at: nullable_iso(totals.oldest_occurred_at),
        newest_occurred_at: nullable_iso(totals.newest_occurred_at),
      },
    };
  },

  async get_audit_event_detail(input: {
    organization_id: string;
    audit_event_id: string;
    project_id?: string;
  }) {
    const event_result = await db.query<Record<string, unknown>>(
      `
      SELECT audit_event.*, 'audit'::text AS evidence_kind,
        COUNT(audit_change_item.id)::bigint AS change_item_count
      FROM audit_schema.audit_event audit_event
      LEFT JOIN audit_schema.audit_change_item audit_change_item
        ON audit_change_item.audit_event_id = audit_event.id
        AND audit_change_item.organization_id = audit_event.organization_id
      WHERE audit_event.organization_id = $1 AND audit_event.id = $2
        AND ($3::text IS NULL OR audit_event.project_id = $3)
      GROUP BY audit_event.id
      `,
      [input.organization_id, input.audit_event_id, input.project_id ?? null],
    );
    const event_row = event_result.rows[0];
    if (!event_row) return null;
    const item_result = await db.query<Record<string, unknown>>(
      `
      SELECT item.*
      FROM audit_schema.audit_change_item item
      JOIN audit_schema.audit_event audit_event
        ON audit_event.id = item.audit_event_id
        AND audit_event.organization_id = item.organization_id
      WHERE audit_event.organization_id = $1 AND audit_event.id = $2
        AND ($3::text IS NULL OR audit_event.project_id = $3)
      ORDER BY item.created_at, item.id
      `,
      [input.organization_id, input.audit_event_id, input.project_id ?? null],
    );
    return {
      event: map_event(event_row) as ComplianceAuditEventSummary,
      change_items: item_result.rows.map(map_change_item),
    };
  },
});
