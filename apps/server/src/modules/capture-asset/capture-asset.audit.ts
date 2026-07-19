import {
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditChangeItem,
  type AuditSourceType,
  type AuditValueType,
  type AuditEvent,
} from "@repo/audit-domain";
import { ulid } from "ulid";
import {
  current_audit_request_id,
  safe_audit_actor_label,
} from "../audit/audit-request-context";
import { write_audit_event } from "../audit/audit.repository";
import { translate_audit_transaction_error } from "../audit/audit-transaction";
import { build_entity_audit_event } from "../audit/entity-audit";
import {
  build_capture_asset_transactional_repository,
  build_uncovered_capture_asset_repository,
} from "./capture-asset.repository";
import type {
  CaptureAsset,
  CaptureAssetRepository,
  CaptureAssetTransactionalRepository,
} from "./capture-asset.service";

type Base = {
  event_id: string;
  asset: CaptureAsset;
  actor_org_user_id: string;
  actor_label: string;
  occurred_at: string;
  source_type: AuditSourceType;
};
const identities = (input: Base) => ({
  asset: {
    organization_id: input.asset.organization_id,
    audit_event_id: input.event_id,
    entity_type: "capture_asset",
    entity_id: input.asset.id,
    parent_entity_type: "capture_session",
    parent_entity_id: input.asset.capture_session_id,
  },
  file: {
    organization_id: input.asset.organization_id,
    audit_event_id: input.event_id,
    entity_type: "file",
    entity_id: input.asset.file.id,
    parent_entity_type: "capture_asset",
    parent_entity_id: input.asset.id,
  },
});
const event = (input: Base, action: string, items: AuditChangeItem[]) =>
  validate_audit_event({
    id: input.event_id,
    organization_id: input.asset.organization_id,
    project_id: input.asset.project_id,
    root_resource_type: "capture_session",
    root_resource_id: input.asset.capture_session_id,
    action,
    source_type: input.source_type,
    actor_type: "org_user",
    actor_org_user_id: input.actor_org_user_id,
    actor_label: input.actor_label,
    request_id: current_audit_request_id(),
    correlation_id: null,
    idempotency_key_hash: null,
    before_row_version: null,
    after_row_version: null,
    outcome: "committed",
    reason: null,
    occurred_at: input.occurred_at,
    items,
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

export const build_capture_asset_created_event = (
  input: Base & {
    action:
      | "capture_asset.created"
      | "capture_asset.uploaded"
      | "guide.block.screenshot_uploaded";
  },
) => {
  const id = identities(input);
  const items: AuditChangeItem[] = [
    create_row_change({ id: ulid(), ...id.file, operation: "create" }),
    create_row_change({ id: ulid(), ...id.asset, operation: "create" }),
  ];
  const add = (
    identity: typeof id.file,
    field_name: string,
    value_type: AuditValueType,
    value: unknown,
  ) =>
    items.push(
      create_scalar_change({
        id: ulid(),
        ...identity,
        operation: "create",
        field_name,
        value_type,
        before: { state: "absent" },
        after: state(value_type, value),
      }),
    );
  add(id.file, "storage_provider", "enum", input.asset.file.storage_provider);
  add(id.file, "mime_type", "text", input.asset.file.mime_type);
  add(id.file, "size_bytes", "integer", input.asset.file.size_bytes);
  for (const name of ["original_name", "checksum_sha256"] as const) {
    if (input.asset.file[name] !== null)
      items.push(
        create_scalar_change({
          id: ulid(),
          ...id.file,
          operation: "create",
          field_name: name,
          value_type: "text",
          before: { state: "absent" },
          after: { state: "redacted" },
        }),
      );
  }
  for (const [name, type, value] of [
    ["project_id", "identifier", input.asset.project_id],
    ["capture_session_id", "identifier", input.asset.capture_session_id],
    ["file_id", "identifier", input.asset.file.id],
    ["asset_type", "enum", input.asset.asset_type],
    ["width", "integer", input.asset.width],
    ["height", "integer", input.asset.height],
    ["device_pixel_ratio", "decimal", input.asset.device_pixel_ratio],
    ["page_title", "text", input.asset.page_title],
    ["captured_at", "timestamp", input.asset.captured_at],
  ] as Array<[string, AuditValueType, unknown]>)
    add(id.asset, name, type, value);
  if (input.asset.page_url !== null)
    items.push(
      create_scalar_change({
        id: ulid(),
        ...id.asset,
        operation: "create",
        field_name: "page_url",
        value_type: "text",
        before: { state: "absent" },
        after: { state: "redacted" },
      }),
    );
  return event(input, input.action, items);
};

type Pool = Parameters<typeof build_uncovered_capture_asset_repository>[0];
type Tracked = {
  command: "capture_asset.create" | "capture_asset.upload";
  asset: CaptureAsset;
  actor_org_user_id: string;
  source_type: AuditSourceType;
};
type LifecycleTracked = { audit: AuditEvent };
const set_context = async (
  client: Awaited<ReturnType<Pool["connect"]>>,
  tracked: Omit<Tracked, "asset"> & { organization_id: string },
  event_id: string,
) => {
  const action =
    tracked.command === "capture_asset.create"
      ? "capture_asset.created"
      : tracked.command === "capture_asset.upload"
        ? "capture_asset.uploaded"
        : "capture_asset.uploaded";
  for (const [name, value] of [
    ["ossie.audit_event_id", event_id],
    ["ossie.audit_organization_id", tracked.organization_id],
    ["ossie.audit_action", action],
    ["ossie.audit_command", tracked.command],
    ["ossie.audit_actor_type", "org_user"],
    ["ossie.audit_source_type", tracked.source_type],
  ])
    await client.query("SELECT set_config($1, $2, true)", [name, value]);
};

const lifecycle_actions = {
  "capture_asset.archive": "capture_asset.archived",
  "capture_asset.restore": "capture_asset.restored",
  "capture_asset.purge.request": "capture_asset.purge_requested",
  "capture_asset.purge.fail": "capture_asset.purge_failed",
  "capture_asset.purge.complete": "capture_asset.purged",
} as const;

const set_lifecycle_context = async (
  client: Awaited<ReturnType<Pool["connect"]>>,
  input: {
    command: keyof typeof lifecycle_actions;
    organization_id: string;
    source_type: AuditSourceType;
  },
  event_id: string,
) => {
  for (const [name, value] of [
    ["ossie.audit_event_id", event_id],
    ["ossie.audit_organization_id", input.organization_id],
    ["ossie.audit_action", lifecycle_actions[input.command]],
    ["ossie.audit_command", input.command],
    ["ossie.audit_actor_type", "org_user"],
    ["ossie.audit_source_type", input.source_type],
  ])
    await client.query("SELECT set_config($1, $2, true)", [name, value]);
};

export const build_capture_asset_repository = (
  pool: Pool,
): CaptureAssetRepository => {
  const base = build_uncovered_capture_asset_repository(pool);
  return {
    ...base,
    async transaction(callback) {
      const client = await pool.connect();
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let tracked: Tracked | LifecycleTracked | null = null;
      try {
        await client.query("BEGIN");
        const repository = build_capture_asset_transactional_repository(client);
        const begin = async (
          input: {
            organization_id: string;
            project_id: string;
            capture_session_id: string;
            actor_org_user_id: string;
          },
          command: Tracked["command"],
        ) => {
          await client.query(
            "SELECT project_schema.lock_project_version_scope($1)",
            [input.project_id],
          );
          const provenance = await client.query<{
            source_type: string;
            display_name: string;
          }>(
            `
            SELECT capture_session.source_type, app_user.display_name
            FROM capture_schema.capture_session capture_session
            JOIN organization_schema.org_user org_user ON org_user.id = $3
            JOIN user_schema.user app_user ON app_user.id = org_user.user_id
            WHERE capture_session.id = $1 AND capture_session.organization_id = $2
          `,
            [
              input.capture_session_id,
              input.organization_id,
              input.actor_org_user_id,
            ],
          );
          const raw_source = provenance.rows[0]?.source_type;
          const source_type: AuditSourceType =
            raw_source === "extension" || raw_source === "import"
              ? raw_source
              : "web";
          const partial = {
            command,
            actor_org_user_id: input.actor_org_user_id,
            source_type,
            organization_id: input.organization_id,
          };
          await set_context(client, partial, event_id);
          return {
            source_type,
            label: safe_audit_actor_label(
              provenance.rows[0]?.display_name ?? "",
            ),
          };
        };
        let label = "organization-member";
        const wrapped: CaptureAssetTransactionalRepository = {
          ...repository,
          async create_capture_asset(input) {
            const context = await begin(input, "capture_asset.create");
            label = context.label;
            const asset = await repository.create_capture_asset(input);
            tracked = {
              command: "capture_asset.create",
              asset,
              actor_org_user_id: input.actor_org_user_id,
              source_type: context.source_type,
            };
            return asset;
          },
          async create_uploaded_capture_asset(input) {
            const context = await begin(input, "capture_asset.upload");
            label = context.label;
            const asset = await repository.create_uploaded_capture_asset(input);
            tracked = {
              command: "capture_asset.upload",
              asset,
              actor_org_user_id: input.actor_org_user_id,
              source_type: context.source_type,
            };
            return asset;
          },
          async transition_capture_asset(input) {
            const before = await repository.find_capture_asset(input);
            if (!before) return null;
            const command =
              input.status === "archived"
                ? "capture_asset.archive"
                : "capture_asset.restore";
            const context = await begin(input, "capture_asset.create");
            label = context.label;
            await set_lifecycle_context(
              client,
              {
                command,
                organization_id: input.organization_id,
                source_type: context.source_type,
              },
              event_id,
            );
            const after = await repository.transition_capture_asset(input);
            if (after)
              tracked = {
                audit: build_entity_audit_event({
                  id: event_id,
                  organization_id: input.organization_id,
                  project_id: input.project_id,
                  root_resource_type: "capture_asset",
                  root_resource_id: after.id,
                  action: lifecycle_actions[command],
                  actor_org_user_id: input.actor_org_user_id,
                  actor_label: label,
                  source_type: context.source_type,
                  occurred_at,
                  before_row_version: before.version,
                  after_row_version: after.version,
                  changes: [
                    {
                      entity_type: "capture_asset",
                      entity_id: after.id,
                      parent_entity_type: "capture_session",
                      parent_entity_id: after.capture_session_id,
                      before,
                      after,
                      safe_fields: { status: "enum", version: "integer" },
                      redacted_fields: [],
                    },
                  ],
                })!,
              };
            return after;
          },
          async begin_capture_asset_purge(input) {
            const before =
              (
                await client.query<Record<string, unknown> & { id: string }>(
                  `SELECT * FROM capture_schema.capture_asset_purge_operation
              WHERE capture_asset_id=$1`,
                  [input.capture_asset_id],
                )
              ).rows[0] ?? null;
            const context = await begin(input, "capture_asset.create");
            label = context.label;
            const command = "capture_asset.purge.request" as const;
            await set_lifecycle_context(
              client,
              {
                command,
                organization_id: input.organization_id,
                source_type: context.source_type,
              },
              event_id,
            );
            const result = await repository.begin_capture_asset_purge(input);
            if (result && !result.completed) {
              const after = {
                id: result.operation.purge_operation_id,
                status: result.operation.status,
                attempt_count: result.operation.attempt_count,
              };
              tracked = {
                audit: build_entity_audit_event({
                  id: event_id,
                  organization_id: input.organization_id,
                  project_id: input.project_id,
                  root_resource_type: "capture_asset",
                  root_resource_id: input.capture_asset_id,
                  action: lifecycle_actions[command],
                  actor_org_user_id: input.actor_org_user_id,
                  actor_label: label,
                  source_type: context.source_type,
                  occurred_at,
                  before_row_version: null,
                  after_row_version: null,
                  changes: [
                    {
                      entity_type: "capture_asset_purge_operation",
                      entity_id: after.id,
                      parent_entity_type: "capture_asset",
                      parent_entity_id: input.capture_asset_id,
                      before,
                      after,
                      safe_fields: { status: "enum", attempt_count: "integer" },
                      redacted_fields: [],
                    },
                  ],
                })!,
              };
            }
            return result;
          },
          async fail_capture_asset_purge(input) {
            const before =
              (
                await client.query<Record<string, unknown> & { id: string }>(
                  `SELECT * FROM capture_schema.capture_asset_purge_operation WHERE id=$1`,
                  [input.operation_id],
                )
              ).rows[0] ?? null;
            const context = await begin(input, "capture_asset.create");
            label = context.label;
            const source_type = context.source_type;
            await set_lifecycle_context(
              client,
              {
                command: "capture_asset.purge.fail",
                organization_id: input.organization_id,
                source_type,
              },
              event_id,
            );
            const result = await repository.fail_capture_asset_purge(input);
            if (result.status === "completed") return result;
            const after = {
              id: result.purge_operation_id,
              status: result.status,
              attempt_count: result.attempt_count,
            };
            tracked = {
              audit: build_entity_audit_event({
                id: event_id,
                organization_id: input.organization_id,
                project_id: input.project_id,
                root_resource_type: "capture_asset",
                root_resource_id: input.capture_asset_id,
                action: lifecycle_actions["capture_asset.purge.fail"],
                actor_org_user_id: input.actor_org_user_id,
                actor_label: label,
                source_type,
                occurred_at,
                before_row_version: null,
                after_row_version: null,
                changes: [
                  {
                    entity_type: "capture_asset_purge_operation",
                    entity_id: after.id,
                    parent_entity_type: "capture_asset",
                    parent_entity_id: input.capture_asset_id,
                    before,
                    after,
                    safe_fields: { status: "enum", attempt_count: "integer" },
                    redacted_fields: [],
                  },
                ],
              })!,
            };
            return result;
          },
          async complete_capture_asset_purge(input) {
            const locked_asset = (
              await client.query<{ capture_session_id: string }>(
                `SELECT asset.capture_session_id FROM capture_schema.capture_asset asset
               JOIN file_schema.file file_record ON file_record.id=asset.file_id
               WHERE asset.id=$1 AND asset.project_id=$2 AND asset.organization_id=$3
               FOR UPDATE OF asset,file_record`,
                [
                  input.capture_asset_id,
                  input.project_id,
                  input.organization_id,
                ],
              )
            ).rows[0];
            if (!locked_asset)
              throw new Error("Capture Asset purge target was not found");
            const locked_operation = (
              await client.query<{ status: string }>(
                `SELECT status FROM capture_schema.capture_asset_purge_operation
               WHERE id=$1 AND capture_asset_id=$2 AND project_id=$3 AND organization_id=$4 FOR UPDATE`,
                [
                  input.operation_id,
                  input.capture_asset_id,
                  input.project_id,
                  input.organization_id,
                ],
              )
            ).rows[0];
            if (locked_operation?.status === "completed")
              return repository.complete_capture_asset_purge(input);
            const before_asset = await repository.find_capture_asset({
              ...input,
              capture_session_id: locked_asset.capture_session_id,
            });
            const before_file = (
              await client.query<{
                id: string;
                is_deleted: boolean;
                version: number;
              }>(
                `SELECT id,is_deleted,version FROM file_schema.file WHERE id=$1 AND organization_id=$2`,
                [before_asset!.file.id, input.organization_id],
              )
            ).rows[0]!;
            const before_operation =
              (
                await client.query<Record<string, unknown> & { id: string }>(
                  `SELECT * FROM capture_schema.capture_asset_purge_operation WHERE id=$1`,
                  [input.operation_id],
                )
              ).rows[0] ?? null;
            const context = await begin(
              {
                ...input,
                capture_session_id: before_asset!.capture_session_id,
              },
              "capture_asset.create",
            );
            label = context.label;
            const command = "capture_asset.purge.complete" as const;
            await set_lifecycle_context(
              client,
              {
                command,
                organization_id: input.organization_id,
                source_type: context.source_type,
              },
              event_id,
            );
            const result = await repository.complete_capture_asset_purge(input);
            const after_operation = {
              id: result.purge_operation_id,
              status: result.status,
              attempt_count: result.attempt_count,
            };
            tracked = {
              audit: build_entity_audit_event({
                id: event_id,
                organization_id: input.organization_id,
                project_id: input.project_id,
                root_resource_type: "capture_asset",
                root_resource_id: input.capture_asset_id,
                action: lifecycle_actions[command],
                actor_org_user_id: input.actor_org_user_id,
                actor_label: label,
                source_type: context.source_type,
                occurred_at,
                before_row_version: before_asset?.version ?? null,
                after_row_version: before_asset
                  ? before_asset.version + 1
                  : null,
                changes: [
                  {
                    entity_type: "capture_asset",
                    entity_id: input.capture_asset_id,
                    parent_entity_type: "capture_session",
                    parent_entity_id: before_asset!.capture_session_id,
                    before: { ...before_asset, is_deleted: false },
                    after: null,
                    safe_fields: {},
                    redacted_fields: [],
                  },
                  {
                    entity_type: "file",
                    entity_id: before_asset!.file.id,
                    parent_entity_type: "capture_asset",
                    parent_entity_id: input.capture_asset_id,
                    before: before_file,
                    after: null,
                    safe_fields: {},
                    redacted_fields: [],
                  },
                  {
                    entity_type: "capture_asset_purge_operation",
                    entity_id: result.purge_operation_id,
                    parent_entity_type: "capture_asset",
                    parent_entity_id: input.capture_asset_id,
                    before: before_operation,
                    after: after_operation,
                    safe_fields: { status: "enum", attempt_count: "integer" },
                    redacted_fields: [],
                  },
                ],
              })!,
            };
            return result;
          },
        };
        const result = await callback(wrapped);
        if (!tracked) {
          await client.query("COMMIT");
          return result;
        }
        const completed = tracked as Tracked | LifecycleTracked;
        const audit =
          "audit" in completed
            ? completed.audit
            : build_capture_asset_created_event({
                event_id,
                asset: completed.asset,
                actor_org_user_id: completed.actor_org_user_id,
                actor_label: label,
                occurred_at,
                source_type: completed.source_type,
                action:
                  completed.command === "capture_asset.create"
                    ? "capture_asset.created"
                    : "capture_asset.uploaded",
              });
        await write_audit_event(client, audit);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {
          /* preserve */
        }
        throw translate_audit_transaction_error(error);
      } finally {
        client.release();
      }
    },
  };
};
