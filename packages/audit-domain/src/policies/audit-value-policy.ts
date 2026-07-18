import { AuditDomainError } from "../errors/audit-domain-error";
import type {
  AuditChangeIdentity,
  AuditChangeItem,
  AuditEvent,
  AuditOperation,
  AuditStateValue,
  AuditValueType,
} from "../types/audit-evidence";

const has_control_character = (value: string) => [...value].some((character) => {
  const code = character.charCodeAt(0);
  return code <= 31 || code === 127;
});

const assert_bounded = (value: string, max: number, code = "invalid_audit_value") => {
  if (!value || value.length > max || has_control_character(value)) {
    throw new AuditDomainError(code);
  }
};

const normalize_decimal = (value: string) => {
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value)) {
    throw new AuditDomainError("invalid_audit_value");
  }
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer = "0", fraction = ""] = unsigned.split(".");
  const normalized_integer = integer.replace(/^0+(?=\d)/u, "");
  const normalized_fraction = fraction.replace(/0+$/u, "");
  const magnitude = normalized_fraction ? `${normalized_integer}.${normalized_fraction}` : normalized_integer;
  return negative && magnitude !== "0" ? `-${magnitude}` : magnitude;
};

export const normalize_audit_scalar = (value_type: AuditValueType, value: unknown): string | number | boolean => {
  switch (value_type) {
    case "text":
      if (typeof value !== "string" || value.length > 4000 || has_control_character(value)) break;
      return value;
    case "identifier":
      if (typeof value !== "string") break;
      assert_bounded(value, 255);
      return value;
    case "enum":
      if (typeof value !== "string") break;
      assert_bounded(value, 160);
      return value;
    case "integer":
      if (typeof value !== "number" || !Number.isSafeInteger(value)) break;
      return value;
    case "decimal":
      if (typeof value !== "string") break;
      return normalize_decimal(value);
    case "boolean":
      if (typeof value !== "boolean") break;
      return value;
    case "date": {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) break;
      const parsed = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) break;
      return value;
    }
    case "timestamp": {
      const parsed = value instanceof Date ? value : typeof value === "string" ? new Date(value) : null;
      if (!parsed || Number.isNaN(parsed.valueOf())) break;
      return parsed.toISOString();
    }
  }
  throw new AuditDomainError("invalid_audit_value");
};

const normalize_state = (state: AuditStateValue, value_type: AuditValueType): AuditStateValue => {
  if (state.state !== "value") return state;
  return { state: "value", value: normalize_audit_scalar(value_type, state.value) };
};

type RowChangeInput = AuditChangeIdentity & { operation: Extract<AuditOperation, "create" | "delete"> };

export const create_row_change = (input: RowChangeInput): AuditChangeItem => ({
  ...input,
  entity_id: input.entity_id ?? null,
  parent_entity_type: input.parent_entity_type ?? null,
  parent_entity_id: input.parent_entity_id ?? null,
  logical_key: input.logical_key ?? null,
  field_name: null,
  value_type: null,
  before: { state: input.operation === "create" ? "absent" : "present" },
  after: { state: input.operation === "create" ? "present" : "absent" },
});

type ScalarChangeInput = AuditChangeIdentity & {
  operation: AuditOperation;
  field_name: string;
  value_type: AuditValueType;
  before: AuditStateValue;
  after: AuditStateValue;
};

export const create_scalar_change = (input: ScalarChangeInput): AuditChangeItem => {
  assert_bounded(input.field_name, 160);
  if (input.before.state === "present" || input.after.state === "present") {
    throw new AuditDomainError("invalid_audit_value");
  }
  return {
    ...input,
    entity_id: input.entity_id ?? null,
    parent_entity_type: input.parent_entity_type ?? null,
    parent_entity_id: input.parent_entity_id ?? null,
    logical_key: input.logical_key ?? null,
    before: normalize_state(input.before, input.value_type),
    after: normalize_state(input.after, input.value_type),
  };
};

export const validate_audit_event = (input: AuditEvent): AuditEvent => {
  assert_bounded(input.id, 26);
  assert_bounded(input.organization_id, 26);
  assert_bounded(input.root_resource_type, 80);
  assert_bounded(input.root_resource_id, 26);
  assert_bounded(input.action, 120);
  assert_bounded(input.actor_label, 200, "invalid_audit_actor");
  if (input.request_id) assert_bounded(input.request_id, 255);
  if (input.correlation_id) assert_bounded(input.correlation_id, 255);
  if (input.reason) assert_bounded(input.reason, 500);
  if (input.actor_type === "org_user" ? !input.actor_org_user_id : Boolean(input.actor_org_user_id)) {
    throw new AuditDomainError("invalid_audit_actor");
  }
  if (!input.items.length) throw new AuditDomainError("empty_audit_event");
  if (input.items.some((item) => item.organization_id !== input.organization_id || item.audit_event_id !== input.id)) {
    throw new AuditDomainError("invalid_audit_scope");
  }
  if (input.before_row_version !== null && input.before_row_version < 0) throw new AuditDomainError("invalid_audit_row_version");
  if (input.after_row_version !== null && input.after_row_version < 0) throw new AuditDomainError("invalid_audit_row_version");
  if (Number.isNaN(new Date(input.occurred_at).valueOf())) throw new AuditDomainError("invalid_audit_timestamp");
  return input;
};
