import {
  create_redacted_change,
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditChangeItem,
  type AuditSourceType,
  type AuditStateValue,
  type AuditValueType,
} from "@repo/audit-domain";
import { ulid } from "ulid";
import { safe_audit_actor_label } from "./audit-request-context";
import type { AuditMutationContext } from "./audit-context";

type EntityState = Record<string, unknown>;

export type EntityAuditChange = {
  entity_type: string;
  entity_id: string;
  parent_entity_type: string | null;
  parent_entity_id: string | null;
  before: EntityState | null;
  after: EntityState | null;
  safe_fields?: Readonly<Record<string, AuditValueType>>;
  redacted_fields?: readonly string[];
};

type Queryable = {
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
};

export const resolve_org_user_audit_context = async (
  client: Queryable,
  input: { organization_id: string; actor_org_user_id: string; source_type?: AuditSourceType },
): Promise<{ mutation: AuditMutationContext; actor_label: string }> => {
  const result = await client.query<{ display_name: string }>(`
    SELECT app_user.display_name
    FROM organization_schema.org_user org_user
    JOIN user_schema.user app_user ON app_user.id = org_user.user_id
    WHERE org_user.id = $1 AND org_user.organization_id = $2
  `, [input.actor_org_user_id, input.organization_id]);
  return {
    mutation: {
      organization_id: input.organization_id,
      actor_type: "org_user",
      source_type: input.source_type ?? "web",
    },
    actor_label: safe_audit_actor_label(result.rows[0]?.display_name ?? ""),
  };
};

type EntityAuditEventInput = {
  id: string;
  organization_id: string;
  project_id: string | null;
  root_resource_type: string;
  root_resource_id: string;
  action: string;
  actor_org_user_id: string | null;
  actor_label: string;
  source_type: AuditSourceType;
  occurred_at: string;
  before_row_version: number | null;
  after_row_version: number | null;
  actor_type?: "org_user" | "system";
  changes: readonly EntityAuditChange[];
};

const state = (type: AuditValueType, value: unknown): AuditStateValue => {
  if (value === undefined) return { state: "absent" };
  if (value === null) return { state: "null" };
  return {
    state: "value",
    value:
      type === "decimal" && typeof value === "number" ? String(value) : value,
  } as AuditStateValue;
};

const same = (left: unknown, right: unknown) =>
  Object.is(left, right) || JSON.stringify(left) === JSON.stringify(right);

export const build_entity_audit_event = (input: EntityAuditEventInput) => {
  const items: AuditChangeItem[] = [];

  for (const change of input.changes) {
    const identity = {
      organization_id: input.organization_id,
      audit_event_id: input.id,
      entity_type: change.entity_type,
      entity_id: change.entity_id,
      parent_entity_type: change.parent_entity_type,
      parent_entity_id: change.parent_entity_id,
    };
    const operation = change.before === null ? "create" : change.after === null ? "delete" : "update";

    if (operation !== "update") {
      items.push(create_row_change({ id: ulid(), ...identity, operation }));
    }

    for (const [field_name, value_type] of Object.entries(change.safe_fields ?? {})) {
      const before = state(value_type, change.before?.[field_name]);
      const after = state(value_type, change.after?.[field_name]);
      if (!same(before, after)) {
        items.push(create_scalar_change({
          id: ulid(),
          ...identity,
          operation,
          field_name,
          value_type,
          before,
          after,
        }));
      }
    }

    for (const field_name of change.redacted_fields ?? []) {
      const before_value = change.before?.[field_name];
      const after_value = change.after?.[field_name];
      if (same(before_value, after_value)) continue;
      if (operation === "update") {
        items.push(create_redacted_change({
          id: ulid(),
          ...identity,
          operation,
          field_name,
        }));
      } else {
        const before = before_value === undefined ? { state: "absent" as const } : { state: "redacted" as const };
        const after = after_value === undefined ? { state: "absent" as const } : { state: "redacted" as const };
        items.push(create_scalar_change({
          id: ulid(),
          ...identity,
          operation,
          field_name,
          value_type: "text",
          before,
          after,
        }));
      }
    }
  }

  if (items.length === 0) return null;
  const actor_type = input.actor_type ?? "org_user";
  return validate_audit_event({
    id: input.id,
    organization_id: input.organization_id,
    project_id: input.project_id,
    root_resource_type: input.root_resource_type,
    root_resource_id: input.root_resource_id,
    action: input.action,
    source_type: input.source_type,
    actor_type,
    actor_org_user_id: actor_type === "org_user" ? input.actor_org_user_id : null,
    actor_label: input.actor_label,
    request_id: null,
    correlation_id: null,
    idempotency_key_hash: null,
    before_row_version: input.before_row_version,
    after_row_version: input.after_row_version,
    outcome: "committed",
    reason: null,
    occurred_at: input.occurred_at,
    items,
  });
};
