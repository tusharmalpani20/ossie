export const AUDIT_ACTOR_TYPES = ["org_user", "system"] as const;
export const AUDIT_SOURCE_TYPES = ["web", "extension", "api", "system", "import", "migration"] as const;
export const AUDIT_OPERATIONS = ["create", "update", "delete"] as const;
export const AUDIT_VALUE_TYPES = ["text", "identifier", "integer", "decimal", "boolean", "date", "timestamp", "enum"] as const;
export const AUDIT_VALUE_STATES = ["absent", "null", "value", "redacted", "present"] as const;

export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];
export type AuditSourceType = (typeof AUDIT_SOURCE_TYPES)[number];
export type AuditOperation = (typeof AUDIT_OPERATIONS)[number];
export type AuditValueType = (typeof AUDIT_VALUE_TYPES)[number];
export type AuditValueStateName = (typeof AUDIT_VALUE_STATES)[number];

export type AuditStateValue =
  | { state: Exclude<AuditValueStateName, "value"> }
  | { state: "value"; value: unknown };

export type AuditChangeItem = {
  id: string;
  organization_id: string;
  audit_event_id: string;
  entity_type: string;
  entity_id: string | null;
  parent_entity_type: string | null;
  parent_entity_id: string | null;
  logical_key: string | null;
  operation: AuditOperation;
  field_name: string | null;
  value_type: AuditValueType | null;
  before: AuditStateValue;
  after: AuditStateValue;
};

export type AuditEvent = {
  id: string;
  organization_id: string;
  project_id: string | null;
  root_resource_type: string;
  root_resource_id: string;
  action: string;
  source_type: AuditSourceType;
  actor_type: AuditActorType;
  actor_org_user_id: string | null;
  actor_label: string;
  request_id: string | null;
  correlation_id: string | null;
  idempotency_key_hash: string | null;
  before_row_version: number | null;
  after_row_version: number | null;
  outcome: "committed";
  reason: string | null;
  occurred_at: string;
  items: AuditChangeItem[];
};

export type AuditChangeIdentity = Pick<
  AuditChangeItem,
  "id" | "organization_id" | "audit_event_id" | "entity_type"
> & Partial<Pick<AuditChangeItem, "entity_id" | "parent_entity_type" | "parent_entity_id" | "logical_key">>;
