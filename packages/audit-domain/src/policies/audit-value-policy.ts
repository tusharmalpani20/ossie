import { AuditDomainError } from "../errors/audit-domain-error";
import type {
  AuditChangeIdentity,
  AuditChangeItem,
  AuditEvent,
  AuditOperation,
  AuditStateValue,
  AuditValueType,
} from "../types/audit-evidence";
import {
  AUDIT_ACTOR_TYPES,
  AUDIT_OPERATIONS,
  AUDIT_SOURCE_TYPES,
  AUDIT_VALUE_STATES,
  AUDIT_VALUE_TYPES,
} from "../types/audit-evidence";

const actor_types = new Set<string>(AUDIT_ACTOR_TYPES);
const source_types = new Set<string>(AUDIT_SOURCE_TYPES);
const operations = new Set<string>(AUDIT_OPERATIONS);
const value_types = new Set<string>(AUDIT_VALUE_TYPES);
const value_states = new Set<string>(AUDIT_VALUE_STATES);

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
  if (!value_states.has(state.state)) {
    throw new AuditDomainError("invalid_audit_value");
  }
  if (state.state !== "value") return state;
  return { state: "value", value: normalize_audit_scalar(value_type, state.value) };
};

const assert_identity = (input: AuditChangeIdentity) => {
  assert_bounded(input.id, 26, "invalid_audit_item");
  assert_bounded(input.organization_id, 26, "invalid_audit_item");
  assert_bounded(input.audit_event_id, 26, "invalid_audit_item");
  assert_bounded(input.entity_type, 80, "invalid_audit_item");
  if (input.entity_id !== undefined && input.entity_id !== null) {
    assert_bounded(input.entity_id, 26, "invalid_audit_item");
  }
  const parent_type_present = input.parent_entity_type !== undefined && input.parent_entity_type !== null;
  const parent_id_present = input.parent_entity_id !== undefined && input.parent_entity_id !== null;
  if (parent_type_present !== parent_id_present) {
    throw new AuditDomainError("invalid_audit_item");
  }
  if (input.parent_entity_type) assert_bounded(input.parent_entity_type, 80, "invalid_audit_item");
  if (input.parent_entity_id) assert_bounded(input.parent_entity_id, 26, "invalid_audit_item");
  if (input.logical_key) assert_bounded(input.logical_key, 255, "invalid_audit_item");
};

const states_equal = (left: AuditStateValue, right: AuditStateValue) =>
  left.state === right.state
  && (left.state !== "value" || (right.state === "value" && left.value === right.value));

const assert_scalar_transition = (
  operation: AuditOperation,
  before: AuditStateValue,
  after: AuditStateValue,
) => {
  const value_states_only = new Set(["null", "value", "redacted"]);
  const valid = operation === "create"
    ? before.state === "absent" && value_states_only.has(after.state)
    : operation === "delete"
      ? value_states_only.has(before.state) && after.state === "absent"
      : before.state !== "present" && after.state !== "present" && !states_equal(before, after);
  if (!valid) throw new AuditDomainError("invalid_audit_transition");
};

type RowChangeInput = AuditChangeIdentity & { operation: Extract<AuditOperation, "create" | "delete"> };

export const create_row_change = (input: RowChangeInput): AuditChangeItem => ({
  ...(() => {
    assert_identity(input);
    if (input.operation !== "create" && input.operation !== "delete") {
      throw new AuditDomainError("invalid_audit_operation");
    }
    return input;
  })(),
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
  assert_identity(input);
  assert_bounded(input.field_name, 160, "invalid_audit_item");
  if (!operations.has(input.operation)) throw new AuditDomainError("invalid_audit_operation");
  if (!value_types.has(input.value_type)) throw new AuditDomainError("invalid_audit_value");
  if (input.before.state === "present" || input.after.state === "present") {
    throw new AuditDomainError("invalid_audit_value");
  }
  const before = normalize_state(input.before, input.value_type);
  const after = normalize_state(input.after, input.value_type);
  assert_scalar_transition(input.operation, before, after);
  return {
    ...input,
    entity_id: input.entity_id ?? null,
    parent_entity_type: input.parent_entity_type ?? null,
    parent_entity_id: input.parent_entity_id ?? null,
    logical_key: input.logical_key ?? null,
    before,
    after,
  };
};

const validate_audit_item = (item: AuditChangeItem): AuditChangeItem => {
  if (item.field_name === null || item.value_type === null) {
    if (item.field_name !== null || item.value_type !== null) {
      throw new AuditDomainError("invalid_audit_item");
    }
    return create_row_change(item as RowChangeInput);
  }
  return create_scalar_change(item as ScalarChangeInput);
};

export const validate_audit_event = (input: AuditEvent): AuditEvent => {
  assert_bounded(input.id, 26);
  assert_bounded(input.organization_id, 26);
  assert_bounded(input.root_resource_type, 80);
  assert_bounded(input.root_resource_id, 26);
  assert_bounded(input.action, 120);
  assert_bounded(input.actor_label, 200, "invalid_audit_actor");
  if (input.project_id) assert_bounded(input.project_id, 26);
  if (input.actor_org_user_id) assert_bounded(input.actor_org_user_id, 26, "invalid_audit_actor");
  if (input.request_id) assert_bounded(input.request_id, 255);
  if (input.correlation_id) assert_bounded(input.correlation_id, 255);
  if (input.reason) assert_bounded(input.reason, 500);
  if (!source_types.has(input.source_type)) throw new AuditDomainError("invalid_audit_source");
  if (!actor_types.has(input.actor_type)) throw new AuditDomainError("invalid_audit_actor");
  if (input.outcome !== "committed") throw new AuditDomainError("invalid_audit_outcome");
  if (input.idempotency_key_hash && !/^[0-9a-f]{64}$/u.test(input.idempotency_key_hash)) {
    throw new AuditDomainError("invalid_audit_idempotency_hash");
  }
  if (input.actor_type === "org_user" ? !input.actor_org_user_id : Boolean(input.actor_org_user_id)) {
    throw new AuditDomainError("invalid_audit_actor");
  }
  if (!input.items.length) throw new AuditDomainError("empty_audit_event");
  if (input.items.some((item) => item.organization_id !== input.organization_id || item.audit_event_id !== input.id)) {
    throw new AuditDomainError("invalid_audit_scope");
  }
  if (input.before_row_version !== null && (!Number.isSafeInteger(input.before_row_version) || input.before_row_version < 0)) {
    throw new AuditDomainError("invalid_audit_row_version");
  }
  if (input.after_row_version !== null && (!Number.isSafeInteger(input.after_row_version) || input.after_row_version < 0)) {
    throw new AuditDomainError("invalid_audit_row_version");
  }
  if (
    input.before_row_version !== null
    && input.after_row_version !== null
    && input.after_row_version < input.before_row_version
  ) {
    throw new AuditDomainError("invalid_audit_row_version");
  }
  const occurred_at = new Date(input.occurred_at);
  if (Number.isNaN(occurred_at.valueOf()) || occurred_at.toISOString() !== input.occurred_at) {
    throw new AuditDomainError("invalid_audit_timestamp");
  }
  return { ...input, items: input.items.map(validate_audit_item) };
};
