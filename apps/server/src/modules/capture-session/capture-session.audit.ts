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
import { safe_audit_actor_label } from "../audit/audit-request-context";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_capture_session_repository } from "./capture-session.repository";
import type {
  CaptureSession,
  CaptureSessionRepository,
  NormalizedUpdateCaptureSessionInput,
} from "./capture-session.service";

type Base = {
  event_id: string;
  actor_org_user_id: string;
  actor_label: string;
  occurred_at: string;
};
const source = (session: CaptureSession): AuditSourceType =>
  session.source_type === "manual" ? "web" : session.source_type;
const identity = (input: Base, session: CaptureSession) => ({
  organization_id: session.organization_id,
  audit_event_id: input.event_id,
  entity_type: "capture_session",
  entity_id: session.id,
});
const state = (value: unknown) =>
  value === null
    ? ({ state: "null" } as const)
    : ({ state: "value", value } as const);
const event = (
  input: Base,
  before: CaptureSession | null,
  after: CaptureSession,
  action: string,
  items: AuditChangeItem[],
) =>
  validate_audit_event({
    id: input.event_id,
    organization_id: after.organization_id,
    project_id: after.project_id,
    root_resource_type: "capture_session",
    root_resource_id: after.id,
    action,
    source_type: source(after),
    actor_type: "org_user",
    actor_org_user_id: input.actor_org_user_id,
    actor_label: input.actor_label,
    request_id: null,
    correlation_id: null,
    idempotency_key_hash: null,
    before_row_version: before?.version ?? null,
    after_row_version: after.version,
    outcome: "committed",
    reason: null,
    occurred_at: input.occurred_at,
    items,
  });

const safe_fields: Array<[keyof CaptureSession, string, AuditValueType]> = [
  ["project_id", "project_id", "identifier"],
  ["name", "name", "text"],
  ["description", "description", "text"],
  ["status", "status", "enum"],
  ["source_type", "source_type", "enum"],
  ["started_at", "started_at", "timestamp"],
  ["completed_at", "completed_at", "timestamp"],
  ["canceled_at", "canceled_at", "timestamp"],
  ["viewport_width", "viewport_width", "integer"],
  ["viewport_height", "viewport_height", "integer"],
  ["device_pixel_ratio", "device_pixel_ratio", "decimal"],
];
const private_fields: Array<keyof CaptureSession> = [
  "start_url",
  "browser_name",
  "browser_version",
  "operating_system",
  "user_agent",
];
const scalar_value = (type: AuditValueType, value: unknown) =>
  type === "decimal" && typeof value === "number" ? String(value) : value;

export const build_capture_session_created_event = (
  input: Base & { session: CaptureSession; metadata_present: boolean },
) => {
  const base = identity(input, input.session);
  const items: AuditChangeItem[] = [
    create_row_change({ id: ulid(), ...base, operation: "create" }),
  ];
  for (const [key, field_name, value_type] of safe_fields) {
    items.push(
      create_scalar_change({
        id: ulid(),
        ...base,
        operation: "create",
        field_name,
        value_type,
        before: { state: "absent" },
        after: state(scalar_value(value_type, input.session[key])),
      }),
    );
  }
  for (const key of private_fields) {
    if (input.session[key] !== null)
      items.push(
        create_scalar_change({
          id: ulid(),
          ...base,
          operation: "create",
          field_name: key,
          value_type: "text",
          before: { state: "absent" },
          after: { state: "redacted" },
        }),
      );
  }
  if (input.metadata_present)
    items.push(
      create_scalar_change({
        id: ulid(),
        ...base,
        operation: "create",
        field_name: "metadata",
        value_type: "text",
        before: { state: "absent" },
        after: { state: "redacted" },
      }),
    );
  return event(input, null, input.session, "capture_session.created", items);
};

export const build_capture_session_updated_event = (
  input: Base & {
    before: CaptureSession;
    after: CaptureSession;
    action: "capture_session.updated" | "capture_session.completed";
    metadata_changed: boolean;
  },
) => {
  const base = identity(input, input.after);
  const items: AuditChangeItem[] = [];
  for (const [key, field_name, value_type] of safe_fields) {
    if (input.before[key] !== input.after[key])
      items.push(
        create_scalar_change({
          id: ulid(),
          ...base,
          operation: "update",
          field_name,
          value_type,
          before: state(scalar_value(value_type, input.before[key])),
          after: state(scalar_value(value_type, input.after[key])),
        }),
      );
  }
  for (const key of private_fields) {
    if (input.before[key] !== input.after[key])
      items.push(
        create_redacted_change({
          id: ulid(),
          ...base,
          operation: "update",
          field_name: key,
        }),
      );
  }
  if (input.metadata_changed)
    items.push(
      create_redacted_change({
        id: ulid(),
        ...base,
        operation: "update",
        field_name: "metadata",
      }),
    );
  return event(input, input.before, input.after, input.action, items);
};

export const build_capture_session_deleted_event = (
  input: Base & { before: CaptureSession; after: CaptureSession },
) =>
  event(input, input.before, input.after, "capture_session.deleted", [
    create_row_change({
      id: ulid(),
      ...identity(input, input.after),
      operation: "delete",
    }),
  ]);

type Pool = Parameters<typeof run_audited_mutation>[0]["pool"] & {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: Row[] }>;
};
const label_for = async (
  client: Parameters<Parameters<typeof run_audited_mutation>[0]["execute"]>[0],
  actor_id: string,
  org_id: string,
) => {
  const result = await client.query<{ display_name: string }>(
    `
    SELECT app_user.display_name FROM organization_schema.org_user org_user
    JOIN user_schema.user app_user ON app_user.id = org_user.user_id
    WHERE org_user.id = $1 AND org_user.organization_id = $2
  `,
    [actor_id, org_id],
  );
  return safe_audit_actor_label(result.rows[0]?.display_name ?? "");
};
const scalar_changed = (
  before: CaptureSession,
  data: NormalizedUpdateCaptureSessionInput,
) =>
  (Object.keys(data) as Array<keyof NormalizedUpdateCaptureSessionInput>).some(
    (key) =>
      key !== "metadata" &&
      data[key] !== undefined &&
      before[key] !== data[key],
  );

export const build_audited_capture_session_repository = (
  pool: Pool,
): CaptureSessionRepository => {
  const base = build_capture_session_repository(pool);
  const lock = async (
    client: Parameters<
      Parameters<typeof run_audited_mutation>[0]["execute"]
    >[0],
    input: {
      capture_session_id: string;
      project_id: string;
      organization_id: string;
    },
  ) => {
    await client.query(
      `SELECT id FROM capture_schema.capture_session
      WHERE id = $1 AND project_id = $2 AND organization_id = $3 AND is_deleted = FALSE FOR UPDATE`,
      [input.capture_session_id, input.project_id, input.organization_id],
    );
    return build_capture_session_repository(client).find_capture_session(input);
  };
  return {
    ...base,
    async create_capture_session(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let label = "organization-member";
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("capture_session.create"),
        context: async (client) => {
          label = await label_for(
            client,
            input.actor_org_user_id,
            input.organization_id,
          );
          return {
            organization_id: input.organization_id,
            actor_type: "org_user",
            source_type:
              input.data.source_type === "extension"
                ? "extension"
                : input.data.source_type === "import"
                  ? "import"
                  : "web",
          };
        },
        execute: (client) =>
          build_capture_session_repository(client).create_capture_session(
            input,
          ),
        build_event: (session) =>
          build_capture_session_created_event({
            event_id,
            session,
            actor_org_user_id: input.actor_org_user_id,
            actor_label: label,
            occurred_at,
            metadata_present: input.data.metadata != null,
          }),
        write_audit_event,
      });
    },
    async update_capture_session(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let before: CaptureSession | null = null;
      let label = "organization-member";
      let metadata_changed = false;
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("capture_session.update"),
        context: async (client) => {
          before = await lock(client, input);
          label = await label_for(
            client,
            input.actor_org_user_id,
            input.organization_id,
          );
          if (before && input.data.metadata !== undefined) {
            const result = await client.query<{ changed: boolean }>(
              `SELECT metadata IS DISTINCT FROM $4::jsonb AS changed FROM capture_schema.capture_session WHERE id=$1 AND project_id=$2 AND organization_id=$3`,
              [
                input.capture_session_id,
                input.project_id,
                input.organization_id,
                input.data.metadata,
              ],
            );
            metadata_changed = Boolean(result.rows[0]?.changed);
          }
          return {
            organization_id: input.organization_id,
            actor_type: "org_user",
            source_type: before ? source(before) : "web",
          };
        },
        execute: (client) =>
          before && (scalar_changed(before, input.data) || metadata_changed)
            ? build_capture_session_repository(client).update_capture_session(
                input,
              )
            : Promise.resolve(before),
        build_event: (after) =>
          after && before && after.version !== before.version
            ? build_capture_session_updated_event({
                event_id,
                before,
                after,
                action: "capture_session.updated",
                actor_org_user_id: input.actor_org_user_id,
                actor_label: label,
                occurred_at,
                metadata_changed,
              })
            : null,
        write_audit_event,
      });
    },
    async complete_capture_session(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let before: CaptureSession | null = null;
      let label = "organization-member";
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("capture_session.complete"),
        context: async (client) => {
          before = await lock(client, input);
          label = await label_for(
            client,
            input.actor_org_user_id,
            input.organization_id,
          );
          return {
            organization_id: input.organization_id,
            actor_type: "org_user",
            source_type: before ? source(before) : "web",
          };
        },
        execute: (client) =>
          build_capture_session_repository(client).complete_capture_session(
            input,
          ),
        build_event: (result) =>
          result.outcome === "completed" && result.capture_session && before
            ? build_capture_session_updated_event({
                event_id,
                before,
                after: result.capture_session,
                action: "capture_session.completed",
                actor_org_user_id: input.actor_org_user_id,
                actor_label: label,
                occurred_at,
                metadata_changed: false,
              })
            : null,
        write_audit_event,
      });
    },
    async delete_capture_session(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let before: CaptureSession | null = null;
      let label = "organization-member";
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("capture_session.delete"),
        context: async (client) => {
          before = await lock(client, input);
          label = await label_for(
            client,
            input.actor_org_user_id,
            input.organization_id,
          );
          return {
            organization_id: input.organization_id,
            actor_type: "org_user",
            source_type: before ? source(before) : "web",
          };
        },
        execute: (client) =>
          before
            ? build_capture_session_repository(client).delete_capture_session(
                input,
              )
            : Promise.resolve(false),
        build_event: (deleted) =>
          deleted && before
            ? build_capture_session_deleted_event({
                event_id,
                before,
                after: { ...before, version: before.version + 1 },
                actor_org_user_id: input.actor_org_user_id,
                actor_label: label,
                occurred_at,
              })
            : null,
        write_audit_event,
      });
    },
  };
};
