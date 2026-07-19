import {
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditEvent,
  type AuditValueType,
} from "@repo/audit-domain";
import type { ProjectVersionDetail } from "@repo/types/project-version";
import { ulid } from "ulid";
import { find_audit_command } from "../audit/audit-coverage-registry";
import { current_audit_request_id, current_audit_source_type, safe_audit_actor_label } from "../audit/audit-request-context";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_project_version_repository } from "./project-version.repository";
import type { ProjectVersionRepository } from "./project-version.service";

type Command = "project_version.create" | "project_version.update" | "project_version.reorder"
  | "project_version.archive" | "project_version.restore" | "project_version.set_default";
const actions: Record<Command, string> = {
  "project_version.create": "project_version.created",
  "project_version.update": "project_version.updated",
  "project_version.reorder": "project_version.reordered",
  "project_version.archive": "project_version.archived",
  "project_version.restore": "project_version.restored",
  "project_version.set_default": "project_version.default_set",
};
const state = (value: unknown) => value === null
  ? ({ state: "null" } as const)
  : ({ state: "value", value } as const);
const scalar = (input: {
  id?: string; event_id: string; version: ProjectVersionDetail; operation: "create" | "update";
  name: string; type: AuditValueType; before?: unknown; after: unknown;
}) => create_scalar_change({
  id: input.id ?? ulid(), organization_id: input.version.organization_id,
  audit_event_id: input.event_id, entity_type: "project_version", entity_id: input.version.id,
  parent_entity_type: "project", parent_entity_id: input.version.project_id,
  operation: input.operation, field_name: input.name, value_type: input.type,
  before: input.operation === "create" ? { state: "absent" } : state(input.before),
  after: state(input.after),
});

export const build_project_version_event = (input: {
  event_id: string; command: Command; before: ProjectVersionDetail | null;
  after: ProjectVersionDetail; actor_org_user_id: string; actor_label: string;
  request_id: string | null; occurred_at: string;
  reordered?: Array<{ before: ProjectVersionDetail; after: ProjectVersionDetail }>;
  previous_default_id?: string;
  previous_project_row_version?: number;
}): AuditEvent => {
  const fields: Array<{ name: string; type: AuditValueType }> = [
    { name: "name", type: "text" }, { name: "description", type: "text" },
    { name: "slug", type: "text" }, { name: "release_date", type: "date" },
    { name: "position", type: "integer" }, { name: "status", type: "enum" },
  ];
  const operation = input.before ? "update" : "create";
  const items: AuditEvent["items"] = input.before ? [] : [create_row_change({
    id: ulid(), organization_id: input.after.organization_id, audit_event_id: input.event_id,
    entity_type: "project_version", entity_id: input.after.id, parent_entity_type: "project",
    parent_entity_id: input.after.project_id, operation: "create",
  })];
  if (input.reordered) {
    for (const pair of input.reordered.filter(({ before, after }) => before.position !== after.position))
      items.push(scalar({ event_id: input.event_id, version: pair.after, operation: "update",
        name: "position", type: "integer", before: pair.before.position, after: pair.after.position }));
  } else {
    for (const field of fields) {
      const before = input.before?.[field.name as keyof ProjectVersionDetail];
      const after = input.after[field.name as keyof ProjectVersionDetail];
      if (!input.before || before !== after) items.push(scalar({ event_id: input.event_id,
        version: input.after, operation, name: field.name, type: field.type, before, after }));
    }
  }
  if (input.before && input.before.slug !== input.after.slug) {
    const alias_id = input.after.aliases.find(({ slug }) => slug === input.before!.slug)?.id ?? ulid();
    items.push(create_row_change({ id: ulid(), organization_id: input.after.organization_id,
      audit_event_id: input.event_id, entity_type: "project_version_alias", entity_id: alias_id,
      parent_entity_type: "project_version", parent_entity_id: input.after.id, operation: "create" }));
    items.push(create_scalar_change({ id: ulid(), organization_id: input.after.organization_id,
      audit_event_id: input.event_id, entity_type: "project_version_alias", entity_id: alias_id,
      parent_entity_type: "project_version", parent_entity_id: input.after.id, operation: "create",
      field_name: "slug", value_type: "text", before: { state: "absent" }, after: state(input.before.slug) }));
  }
  if (input.command === "project_version.set_default") {
    items.push(create_scalar_change({ id: ulid(), organization_id: input.after.organization_id,
      audit_event_id: input.event_id, entity_type: "project", entity_id: input.after.project_id,
      operation: "update", field_name: "default_project_version_id", value_type: "identifier",
      before: state(input.previous_default_id), after: state(input.after.id) }));
    items.push(create_scalar_change({ id: ulid(), organization_id: input.after.organization_id,
      audit_event_id: input.event_id, entity_type: "project", entity_id: input.after.project_id,
      operation: "update", field_name: "version", value_type: "integer",
      before: state(input.previous_project_row_version), after: state((input.previous_project_row_version ?? 0) + 1) }));
  }
  return validate_audit_event({
    id: input.event_id, organization_id: input.after.organization_id, project_id: input.after.project_id,
    root_resource_type: "project_version", root_resource_id: input.after.id,
    action: actions[input.command], source_type: current_audit_source_type(), actor_type: "org_user",
    actor_org_user_id: input.actor_org_user_id, actor_label: input.actor_label,
    request_id: input.request_id, correlation_id: null, idempotency_key_hash: null,
    before_row_version: input.before?.version ?? null, after_row_version: input.after.version,
    outcome: "committed", reason: null, occurred_at: input.occurred_at, items,
  });
};

type Pool = Parameters<typeof run_audited_mutation>[0]["pool"] & {
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
};
type MutationArgs = { organization_id: string; project_id: string; actor_org_user_id: string };

export const build_audited_project_version_repository = (pool: Pool): ProjectVersionRepository => {
  const base = build_project_version_repository(pool);
  const run = async <Result>(input: {
    command: Command; args: MutationArgs; project_version_id?: string;
    execute(repository: ProjectVersionRepository, client: Parameters<Parameters<typeof run_audited_mutation>[0]["execute"]>[0]): Promise<Result>;
    event(result: Result, before: ProjectVersionDetail | null, label: string, event_id: string, occurred_at: string): AuditEvent | null;
  }): Promise<Result> => {
    const event_id = ulid(); const occurred_at = new Date().toISOString();
    let before: ProjectVersionDetail | null = null; let label = "organization-member";
    return run_audited_mutation({
      pool, event_id, command: find_audit_command(input.command),
      context: async (client) => {
        await client.query(`SELECT project_schema.lock_project_version_scope($1)`, [input.args.project_id]);
        await client.query(`SELECT id FROM project_schema.project WHERE organization_id = $1 AND id = $2 FOR UPDATE`,
          [input.args.organization_id, input.args.project_id]);
        if (input.project_version_id) {
          await client.query(`SELECT id FROM project_schema.project_version
            WHERE organization_id = $1 AND project_id = $2 AND id = $3 FOR UPDATE`,
          [input.args.organization_id, input.args.project_id, input.project_version_id]);
          before = await build_project_version_repository(client).find_version({
            organization_id: input.args.organization_id, project_id: input.args.project_id,
            project_version_id: input.project_version_id,
          });
        }
        const actor = await client.query<{ display_name: string }>(`SELECT app_user.display_name
          FROM organization_schema.org_user org_user JOIN user_schema.user app_user ON app_user.id = org_user.user_id
          WHERE org_user.organization_id = $1 AND org_user.id = $2`,
        [input.args.organization_id, input.args.actor_org_user_id]);
        label = safe_audit_actor_label(actor.rows[0]?.display_name ?? "");
        return { organization_id: input.args.organization_id, actor_type: "org_user", source_type: current_audit_source_type() };
      },
      execute: (client) => input.execute(build_project_version_repository(client), client),
      build_event: (result) => input.event(result, before, label, event_id, occurred_at),
      write_audit_event,
    });
  };
  const event = (command: Command, args: MutationArgs) =>
    (after: ProjectVersionDetail | null, before: ProjectVersionDetail | null, label: string, event_id: string, occurred_at: string) =>
      after ? build_project_version_event({ event_id, command, before, after,
        actor_org_user_id: args.actor_org_user_id, actor_label: label,
        request_id: current_audit_request_id(), occurred_at }) : null;
  return {
    ...base,
    create_version(args) { return run({ command: "project_version.create", args,
      execute: (repository) => repository.create_version(args), event: event("project_version.create", args) }); },
    update_version(args) { return run({ command: "project_version.update", args, project_version_id: args.project_version_id,
      execute: async (repository, client) => {
        const old = await repository.find_version({ organization_id: args.organization_id, project_id: args.project_id,
          project_version_id: args.project_version_id });
        const updated = await repository.update_version(args);
        if (updated && old && old.slug !== updated.slug) await client.query(`INSERT INTO project_schema.project_version_alias
          (id, organization_id, project_id, project_version_id, slug, created_by_id)
          VALUES ($1, $2, $3, $4, $5, $6)`, [ulid(), args.organization_id, args.project_id,
          args.project_version_id, old.slug, args.actor_org_user_id]);
        return updated ? repository.find_version({ organization_id: args.organization_id, project_id: args.project_id,
          project_version_id: args.project_version_id }) : null;
      }, event: event("project_version.update", args) }); },
    async reorder_versions(args) {
      let old: ProjectVersionDetail[] = [];
      return run({ command: "project_version.reorder", args,
        execute: async (repository, client) => {
          const ids = [...args.data.project_versions.map(({ id }) => id)].sort();
          await client.query(`SELECT id FROM project_schema.project_version WHERE organization_id = $1
            AND project_id = $2 AND id = ANY($3::varchar[]) ORDER BY id FOR UPDATE`,
          [args.organization_id, args.project_id, ids]);
          old = await repository.list_versions({ organization_id: args.organization_id, project_id: args.project_id, status: "active" });
          return repository.reorder_versions(args);
        },
        event: (after, _before, label, event_id, occurred_at) => after?.length ? build_project_version_event({
          event_id, command: "project_version.reorder", before: old.find(({ id }) => id === after[0]!.id) ?? null,
          after: after[0]!, reordered: after.map((value) => ({ before: old.find(({ id }) => id === value.id)!, after: value })),
          actor_org_user_id: args.actor_org_user_id, actor_label: label,
          request_id: current_audit_request_id(), occurred_at,
        }) : null,
      });
    },
    archive_version(args) { return run({ command: "project_version.archive", args, project_version_id: args.project_version_id,
      execute: (repository) => repository.archive_version(args), event: event("project_version.archive", args) }); },
    restore_version(args) { return run({ command: "project_version.restore", args, project_version_id: args.project_version_id,
      execute: (repository) => repository.restore_version(args), event: event("project_version.restore", args) }); },
    set_default_version(args) {
      let previous_default_id: string | undefined;
      return run({ command: "project_version.set_default", args, project_version_id: args.project_version_id,
        execute: async (repository, client) => {
          const project = await client.query<{ default_project_version_id: string }>(`SELECT default_project_version_id
            FROM project_schema.project WHERE organization_id = $1 AND id = $2`, [args.organization_id, args.project_id]);
          previous_default_id = project.rows[0]?.default_project_version_id;
          return repository.set_default_version(args);
        },
        event: (result, before, label, event_id, occurred_at) => result && before ? build_project_version_event({
          event_id, command: "project_version.set_default", before, after: { ...before, is_default: true }, previous_default_id,
          previous_project_row_version: args.data.expected_project_row_version,
          actor_org_user_id: args.actor_org_user_id, actor_label: label,
          request_id: current_audit_request_id(), occurred_at,
        }) : null,
      });
    },
  };
};
