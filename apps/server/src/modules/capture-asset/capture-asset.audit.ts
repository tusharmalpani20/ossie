import {
  AuditDomainError,
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditChangeItem,
  type AuditSourceType,
  type AuditValueType,
} from "@repo/audit-domain";
import { ulid } from "ulid";
import {
  current_audit_request_id,
  safe_audit_actor_label,
} from "../audit/audit-request-context";
import { write_audit_event } from "../audit/audit.repository";
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

export const build_capture_asset_deleted_event = (input: Base) => {
  const id = identities(input);
  return event(input, "capture_asset.deleted", [
    create_row_change({ id: ulid(), ...id.asset, operation: "delete" }),
    create_row_change({ id: ulid(), ...id.file, operation: "delete" }),
  ]);
};

type Pool = Parameters<typeof build_uncovered_capture_asset_repository>[0];
type Tracked = {
  command:
    | "capture_asset.create"
    | "capture_asset.upload"
    | "capture_asset.delete";
  asset: CaptureAsset;
  actor_org_user_id: string;
  source_type: AuditSourceType;
};
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
        : "capture_asset.deleted";
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
      let tracked: Tracked | null = null;
      try {
        await client.query("BEGIN");
        const repository = build_capture_asset_transactional_repository(client);
        const begin = async (
          input: {
            organization_id: string;
            capture_session_id: string;
            actor_org_user_id: string;
          },
          command: Tracked["command"],
        ) => {
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
          async delete_capture_asset(input) {
            const asset = await repository.find_capture_asset(input);
            if (!asset) return false;
            const context = await begin(input, "capture_asset.delete");
            label = context.label;
            const deleted = await repository.delete_capture_asset(input);
            if (deleted)
              tracked = {
                command: "capture_asset.delete",
                asset,
                actor_org_user_id: input.actor_org_user_id,
                source_type: context.source_type,
              };
            return deleted;
          },
        };
        const result = await callback(wrapped);
        if (!tracked)
          throw new AuditDomainError("missing_capture_asset_audit", "internal");
        const completed = tracked as Tracked;
        const audit =
          completed.command === "capture_asset.delete"
            ? build_capture_asset_deleted_event({
                event_id,
                asset: completed.asset,
                actor_org_user_id: completed.actor_org_user_id,
                actor_label: label,
                occurred_at,
                source_type: completed.source_type,
              })
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
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23514" &&
          "constraint" in error &&
          typeof error.constraint === "string" &&
          error.constraint.startsWith("ossie_audit_guard_")
        )
          throw new AuditDomainError("audit_guard_failed", "internal");
        throw error;
      } finally {
        client.release();
      }
    },
  };
};
