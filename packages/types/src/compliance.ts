import {
  ACCESS_AUTHORIZATION_TYPES,
  ACCESS_AUTHORIZATION_ROLES,
  ACCESS_OUTCOMES,
  ACCESS_REASON_CODES,
  ACCESS_SURFACES,
} from "@repo/constants";
import { z } from "zod";
import { IdSchema, IsoDateTimeStringSchema } from "./common";

const NullableIdSchema = IdSchema.nullable();
const NullableDateTimeSchema = IsoDateTimeStringSchema.nullable();
const CommonSchema = z
  .object({
    id: IdSchema,
    evidence_kind: z.enum(["audit", "access"]),
    organization_id: IdSchema,
    project_id: NullableIdSchema,
    root_resource_type: z.string().min(1).max(80),
    root_resource_id: NullableIdSchema,
    action: z.string().min(1).max(120),
    source_type: z.enum([
      "web",
      "extension",
      "api",
      "system",
      "import",
      "migration",
    ]),
    actor_type: z.enum(["org_user", "anonymous", "system"]),
    actor_org_user_id: NullableIdSchema,
    actor_label: z.string().min(1).max(200),
    request_id: z.string().min(1).max(255).nullable(),
    occurred_at: IsoDateTimeStringSchema,
  })
  .strict();

export const ComplianceAuditEventSummarySchema = CommonSchema.extend({
  evidence_kind: z.literal("audit"),
  outcome: z.literal("committed"),
  correlation_id: z.string().min(1).max(255).nullable(),
  idempotency_key_hash: z
    .string()
    .regex(/^[0-9a-f]{64}$/u)
    .nullable(),
  before_row_version: z.number().int().nonnegative().nullable(),
  after_row_version: z.number().int().nonnegative().nullable(),
  reason: z.string().max(500).nullable(),
  change_item_count: z.number().int().nonnegative(),
}).strict();
export type ComplianceAuditEventSummary = z.infer<
  typeof ComplianceAuditEventSummarySchema
>;

export const ComplianceAccessEventSchema = CommonSchema.extend({
  evidence_kind: z.literal("access"),
  outcome: z.enum(ACCESS_OUTCOMES),
  http_method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).nullable(),
  route_template: z.string().min(1).max(255).nullable(),
  access_surface: z.enum(ACCESS_SURFACES),
  authorization_type: z.enum(ACCESS_AUTHORIZATION_TYPES),
  authorization_role: z.enum(ACCESS_AUTHORIZATION_ROLES).nullable(),
  reason_code: z.enum(ACCESS_REASON_CODES).nullable(),
  response_bytes: z.number().int().nonnegative().nullable(),
}).strict();
export type ComplianceAccessEvent = z.infer<typeof ComplianceAccessEventSchema>;

const NonValueStateSchema = z
  .object({ state: z.enum(["absent", "null", "redacted", "present"]) })
  .strict();
const StringValueStateSchema = z
  .object({
    state: z.literal("value"),
    value_type: z.enum([
      "text",
      "identifier",
      "decimal",
      "date",
      "timestamp",
      "enum",
    ]),
    value: z.string(),
  })
  .strict();
const IntegerValueStateSchema = z
  .object({
    state: z.literal("value"),
    value_type: z.literal("integer"),
    value: z.number().int().safe(),
  })
  .strict();
const BooleanValueStateSchema = z
  .object({
    state: z.literal("value"),
    value_type: z.literal("boolean"),
    value: z.boolean(),
  })
  .strict();

export const ComplianceAuditStateSchema = z.union([
  NonValueStateSchema,
  StringValueStateSchema,
  IntegerValueStateSchema,
  BooleanValueStateSchema,
]);
export type ComplianceAuditState = z.infer<typeof ComplianceAuditStateSchema>;

export const ComplianceAuditChangeItemSchema = z
  .object({
    id: IdSchema,
    entity_type: z.string().min(1).max(80),
    entity_id: NullableIdSchema,
    parent_entity_type: z.string().min(1).max(80).nullable(),
    parent_entity_id: NullableIdSchema,
    logical_key: z.string().min(1).max(255).nullable(),
    operation: z.enum(["create", "update", "delete"]),
    field_name: z.string().min(1).max(160).nullable(),
    value_type: z
      .enum([
        "text",
        "identifier",
        "integer",
        "decimal",
        "boolean",
        "date",
        "timestamp",
        "enum",
      ])
      .nullable(),
    before: ComplianceAuditStateSchema,
    after: ComplianceAuditStateSchema,
  })
  .strict();
export type ComplianceAuditChangeItem = z.infer<
  typeof ComplianceAuditChangeItemSchema
>;

export const ComplianceAuditEventDetailResponseSchema = z
  .object({
    event: ComplianceAuditEventSummarySchema.extend({
      change_items: z.array(ComplianceAuditChangeItemSchema),
    }).strict(),
  })
  .strict();
export type ComplianceAuditEventDetailResponse = z.infer<
  typeof ComplianceAuditEventDetailResponseSchema
>;

export const ComplianceEventsResponseSchema = z
  .object({
    events: z.array(
      z.discriminatedUnion("evidence_kind", [
        ComplianceAuditEventSummarySchema,
        ComplianceAccessEventSchema,
      ]),
    ),
    page: z
      .object({
        next_cursor: z.string().min(1).nullable(),
        has_more: z.boolean(),
      })
      .strict(),
    totals: z
      .object({
        audit_events: z.number().int().nonnegative(),
        audit_change_items: z.number().int().nonnegative(),
        access_events: z.number().int().nonnegative(),
        oldest_occurred_at: NullableDateTimeSchema,
        newest_occurred_at: NullableDateTimeSchema,
      })
      .strict(),
  })
  .strict();
export type ComplianceEventsResponse = z.infer<
  typeof ComplianceEventsResponseSchema
>;

export const ComplianceKindSchema = z.enum(["all", "audit", "access"]);
export type ComplianceKind = z.infer<typeof ComplianceKindSchema>;

export const ComplianceActivitySchema = z.enum(["important", "all"]);
export type ComplianceActivity = z.infer<typeof ComplianceActivitySchema>;
