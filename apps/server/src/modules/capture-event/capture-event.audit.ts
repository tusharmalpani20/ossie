import {
  create_redacted_change,
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditChangeItem,
  type AuditSourceType,
  type AuditValueType,
} from "@repo/audit-domain";
import { ulid } from "ulid";
import { find_audit_command } from "../audit/audit-coverage-registry";
import {
  current_audit_request_id,
  safe_audit_actor_label,
} from "../audit/audit-request-context";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_capture_event_repository } from "./capture-event.repository";
import type {
  CaptureEvent,
  CaptureEventRepository,
  NormalizedUpdateCaptureEventInput,
} from "./capture-event.service";

type Base = {
  event_id: string;
  actor_org_user_id: string;
  actor_label: string;
  occurred_at: string;
  source_type: AuditSourceType;
};
const id = (input: Base, row: CaptureEvent) => ({
  organization_id: row.organization_id,
  audit_event_id: input.event_id,
  entity_type: "capture_event",
  entity_id: row.id,
  parent_entity_type: "capture_session",
  parent_entity_id: row.capture_session_id,
});
const state = (type: AuditValueType, value: unknown) =>
  value === null
    ? ({ state: "null" } as const)
    : ({
        state: "value",
        value:
          type === "decimal" && typeof value === "number"
            ? String(value)
            : value,
      } as const);
const audit_event = (
  input: Base,
  root: CaptureEvent,
  action: string,
  items: AuditChangeItem[],
  before_version: number | null = null,
  after_version: number | null = null,
) =>
  validate_audit_event({
    id: input.event_id,
    organization_id: root.organization_id,
    project_id: root.project_id,
    root_resource_type: "capture_session",
    root_resource_id: root.capture_session_id,
    action,
    source_type: input.source_type,
    actor_type: "org_user",
    actor_org_user_id: input.actor_org_user_id,
    actor_label: input.actor_label,
    request_id: current_audit_request_id(),
    correlation_id: null,
    idempotency_key_hash: null,
    before_row_version: before_version,
    after_row_version: after_version,
    outcome: "committed",
    reason: null,
    occurred_at: input.occurred_at,
    items,
  });
const safe: Array<[keyof CaptureEvent, AuditValueType]> = [
  ["project_id", "identifier"],
  ["capture_session_id", "identifier"],
  ["capture_asset_id", "identifier"],
  ["event_type", "enum"],
  ["event_index", "integer"],
  ["occurred_at", "timestamp"],
  ["page_title", "text"],
  ["target_role", "text"],
  ["client_x", "integer"],
  ["client_y", "integer"],
  ["viewport_width", "integer"],
  ["viewport_height", "integer"],
  ["device_pixel_ratio", "decimal"],
  ["input_value_redacted", "boolean"],
];
const private_fields: Array<keyof CaptureEvent> = [
  "page_url",
  "target_label",
  "target_selector",
  "target_test_id",
  "target_text",
  "input_intent",
  "note",
];

export const build_capture_event_created_event = (
  input: Base & { capture_event: CaptureEvent; metadata_present: boolean },
) => {
  const identity = id(input, input.capture_event);
  const items: AuditChangeItem[] = [
    create_row_change({ id: ulid(), ...identity, operation: "create" }),
  ];
  for (const [key, value_type] of safe)
    items.push(
      create_scalar_change({
        id: ulid(),
        ...identity,
        operation: "create",
        field_name: key,
        value_type,
        before: { state: "absent" },
        after: state(value_type, input.capture_event[key]),
      }),
    );
  for (const key of private_fields)
    if (input.capture_event[key] !== null)
      items.push(
        create_scalar_change({
          id: ulid(),
          ...identity,
          operation: "create",
          field_name: key,
          value_type: "text",
          before: { state: "absent" },
          after: { state: "redacted" },
        }),
      );
  if (input.metadata_present)
    items.push(
      create_scalar_change({
        id: ulid(),
        ...identity,
        operation: "create",
        field_name: "metadata",
        value_type: "text",
        before: { state: "absent" },
        after: { state: "redacted" },
      }),
    );
  return audit_event(
    input,
    input.capture_event,
    "capture_event.created",
    items,
    null,
    input.capture_event.version,
  );
};

export const build_capture_event_updated_event = (
  input: Base & { before: CaptureEvent; after: CaptureEvent },
) => {
  const identity = id(input, input.after);
  const items: AuditChangeItem[] = [];
  for (const [key, value_type] of safe)
    if (input.before[key] !== input.after[key])
      items.push(
        create_scalar_change({
          id: ulid(),
          ...identity,
          operation: "update",
          field_name: key,
          value_type,
          before: state(value_type, input.before[key]),
          after: state(value_type, input.after[key]),
        }),
      );
  for (const key of private_fields)
    if (input.before[key] !== input.after[key])
      items.push(
        create_redacted_change({
          id: ulid(),
          ...identity,
          operation: "update",
          field_name: key,
        }),
      );
  return audit_event(
    input,
    input.after,
    "capture_event.updated",
    items,
    input.before.version,
    input.after.version,
  );
};

export const build_capture_event_deleted_event = (
  input: Base & { before: CaptureEvent },
) =>
  audit_event(
    input,
    input.before,
    "capture_event.deleted",
    [
      create_row_change({
        id: ulid(),
        ...id(input, input.before),
        operation: "delete",
      }),
    ],
    input.before.version,
    input.before.version + 1,
  );

export const build_capture_events_reordered_event = (
  input: Base & { before: CaptureEvent[]; after: CaptureEvent[] },
) => {
  const before = new Map(input.before.map((row) => [row.id, row]));
  const changed = input.after.filter(
    (row) => before.get(row.id)?.event_index !== row.event_index,
  );
  const items = changed.map((row) =>
    create_scalar_change({
      id: ulid(),
      ...id(input, row),
      operation: "update",
      field_name: "event_index",
      value_type: "integer",
      before: { state: "value", value: before.get(row.id)!.event_index },
      after: { state: "value", value: row.event_index },
    }),
  );
  return audit_event(input, input.after[0]!, "capture_event.reordered", items);
};

type Pool = Parameters<typeof run_audited_mutation>[0]["pool"] & {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: Row[] }>;
};
type Client = Parameters<
  Parameters<typeof run_audited_mutation>[0]["execute"]
>[0];
const context = async (
  client: Client,
  input: {
    organization_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
  },
) => {
  const result = await client.query<{
    source_type: string;
    display_name: string;
  }>(
    `
    SELECT capture_session.source_type, app_user.display_name FROM capture_schema.capture_session capture_session
    JOIN organization_schema.org_user org_user ON org_user.id = $3
    JOIN user_schema.user app_user ON app_user.id = org_user.user_id
    WHERE capture_session.id = $1 AND capture_session.organization_id = $2
  `,
    [input.capture_session_id, input.organization_id, input.actor_org_user_id],
  );
  const raw = result.rows[0]?.source_type;
  return {
    mutation: {
      organization_id: input.organization_id,
      actor_type: "org_user" as const,
      source_type: (raw === "extension" || raw === "import"
        ? raw
        : "web") as AuditSourceType,
    },
    label: safe_audit_actor_label(result.rows[0]?.display_name ?? ""),
  };
};
const changed = (
  before: CaptureEvent,
  data: NormalizedUpdateCaptureEventInput,
) =>
  (Object.keys(data) as Array<keyof NormalizedUpdateCaptureEventInput>).some(
    (key) => before[key] !== data[key],
  );

export const build_audited_capture_event_repository = (
  pool: Pool,
): CaptureEventRepository => {
  const base = build_capture_event_repository(pool);
  const lock = async (
    client: Client,
    input: {
      capture_event_id: string;
      capture_session_id: string;
      project_id: string;
      organization_id: string;
    },
  ) => {
    await client.query(
      `SELECT id FROM capture_schema.capture_event WHERE id=$1 AND capture_session_id=$2 AND project_id=$3 AND organization_id=$4 AND is_deleted=FALSE FOR UPDATE`,
      [
        input.capture_event_id,
        input.capture_session_id,
        input.project_id,
        input.organization_id,
      ],
    );
    return build_capture_event_repository(client).find_capture_event(input);
  };
  return {
    ...base,
    async create_capture_event(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let ctx: Awaited<ReturnType<typeof context>> | null = null;
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("capture_event.create"),
        context: async (client) =>
          (ctx = await context(client, input)).mutation,
        execute: (client) =>
          build_capture_event_repository(client).create_capture_event(input),
        build_event: (row) =>
          build_capture_event_created_event({
            event_id,
            capture_event: row,
            actor_org_user_id: input.actor_org_user_id,
            actor_label: ctx!.label,
            occurred_at,
            source_type: ctx!.mutation.source_type,
            metadata_present: input.data.metadata != null,
          }),
        write_audit_event,
      });
    },
    async update_capture_event(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let ctx: Awaited<ReturnType<typeof context>> | null = null;
      let before: CaptureEvent | null = null;
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("capture_event.update"),
        context: async (client) => {
          before = await lock(client, input);
          return (ctx = await context(client, input)).mutation;
        },
        execute: (client) =>
          before && changed(before, input.data)
            ? build_capture_event_repository(client).update_capture_event(input)
            : Promise.resolve(before),
        build_event: (after) =>
          after && before && after.version !== before.version
            ? build_capture_event_updated_event({
                event_id,
                before,
                after,
                actor_org_user_id: input.actor_org_user_id,
                actor_label: ctx!.label,
                occurred_at,
                source_type: ctx!.mutation.source_type,
              })
            : null,
        write_audit_event,
      });
    },
    async delete_capture_event(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let ctx: Awaited<ReturnType<typeof context>> | null = null;
      let before: CaptureEvent | null = null;
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("capture_event.delete"),
        context: async (client) => {
          before = await lock(client, input);
          return (ctx = await context(client, input)).mutation;
        },
        execute: (client) =>
          before
            ? build_capture_event_repository(client).delete_capture_event(input)
            : Promise.resolve(false),
        build_event: (deleted) =>
          deleted && before
            ? build_capture_event_deleted_event({
                event_id,
                before,
                actor_org_user_id: input.actor_org_user_id,
                actor_label: ctx!.label,
                occurred_at,
                source_type: ctx!.mutation.source_type,
              })
            : null,
        write_audit_event,
      });
    },
    async reorder_capture_events(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let ctx: Awaited<ReturnType<typeof context>> | null = null;
      let before: CaptureEvent[] = [];
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("capture_event.reorder"),
        context: async (client) => {
          before =
            await build_capture_event_repository(client).list_capture_events(
              input,
            );
          await client.query(
            `SELECT id FROM capture_schema.capture_event WHERE capture_session_id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE FOR UPDATE`,
            [input.capture_session_id, input.project_id, input.organization_id],
          );
          return (ctx = await context(client, input)).mutation;
        },
        execute: (client) =>
          before.every((row, index) => row.id === input.event_ids[index])
            ? Promise.resolve(before)
            : build_capture_event_repository(client).reorder_capture_events(
                input,
              ),
        build_event: (after) =>
          before.some(
            (row) =>
              after.find((next) => next.id === row.id)?.event_index !==
              row.event_index,
          )
            ? build_capture_events_reordered_event({
                event_id,
                before,
                after,
                actor_org_user_id: input.actor_org_user_id,
                actor_label: ctx!.label,
                occurred_at,
                source_type: ctx!.mutation.source_type,
              })
            : null,
        write_audit_event,
      });
    },
  };
};
