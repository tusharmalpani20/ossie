import {
  AuditDomainError,
  validate_audit_event,
  type AuditChangeItem,
  type AuditEvent,
  type AuditStateValue,
  type AuditValueType,
} from "@repo/audit-domain";

type AuditClient = {
  query(sql: string, values?: unknown[]): Promise<unknown>;
};

const typed_values = (
  state: AuditStateValue,
  value_type: AuditValueType | null,
) => {
  const values: unknown[] = Array.from({ length: 8 }, () => null);
  if (state.state !== "value" || !value_type) return values;
  const index = [
    "text",
    "identifier",
    "integer",
    "decimal",
    "boolean",
    "date",
    "timestamp",
    "enum",
  ].indexOf(value_type);
  values[index] = state.value;
  return values;
};

const write_item = async (client: AuditClient, item: AuditChangeItem) => {
  const before = typed_values(item.before, item.value_type);
  const after = typed_values(item.after, item.value_type);
  await client.query(
    `
    INSERT INTO audit_schema.audit_change_item (
      id, organization_id, audit_event_id, entity_type, entity_id,
      parent_entity_type, parent_entity_id, logical_key, operation, field_name,
      value_type, before_state, after_state,
      before_text_value, before_identifier_value, before_integer_value, before_decimal_value,
      before_boolean_value, before_date_value, before_timestamp_value, before_enum_value,
      after_text_value, after_identifier_value, after_integer_value, after_decimal_value,
      after_boolean_value, after_date_value, after_timestamp_value, after_enum_value
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18, $19, $20, $21,
      $22, $23, $24, $25, $26, $27, $28, $29
    )
  `,
    [
      item.id,
      item.organization_id,
      item.audit_event_id,
      item.entity_type,
      item.entity_id,
      item.parent_entity_type,
      item.parent_entity_id,
      item.logical_key,
      item.operation,
      item.field_name,
      item.value_type,
      item.before.state,
      item.after.state,
      ...before,
      ...after,
    ],
  );
};

export const write_audit_event = async (
  client: AuditClient,
  event_input: AuditEvent,
) => {
  const event = validate_audit_event(event_input);
  try {
    await client.query(
    `
    INSERT INTO audit_schema.audit_event (
      id, organization_id, project_id, root_resource_type, root_resource_id,
      action, source_type, actor_type, actor_org_user_id, actor_label,
      request_id, correlation_id, idempotency_key_hash, before_row_version,
      after_row_version, outcome, reason, occurred_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13, $14, $15, $16, $17, $18
    )
  `,
    [
      event.id,
      event.organization_id,
      event.project_id,
      event.root_resource_type,
      event.root_resource_id,
      event.action,
      event.source_type,
      event.actor_type,
      event.actor_org_user_id,
      event.actor_label,
      event.request_id,
      event.correlation_id,
      event.idempotency_key_hash,
      event.before_row_version,
      event.after_row_version,
      event.outcome,
      event.reason,
      event.occurred_at,
    ],
    );
    for (const item of event.items) await write_item(client, item);
  } catch {
    throw new AuditDomainError("audit_persistence_failed", "internal");
  }
};
