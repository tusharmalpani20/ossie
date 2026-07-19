import {
  create_redacted_change,
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditEvent,
  type AuditValueType,
} from "@repo/audit-domain";
import { ulid } from "ulid";
import { run_audited_mutation } from "../audit/audit-transaction";
import { find_audit_command } from "../audit/audit-coverage-registry";
import {
  current_audit_request_id,
  current_audit_source_type,
  safe_audit_actor_label,
} from "../audit/audit-request-context";
import { write_audit_event } from "../audit/audit.repository";
import { build_project_repository } from "./project.repository";
import type {
  CreateProjectInput,
  Project,
  ProjectCreationWriter,
  ProjectRepository,
  UpdateProjectInput,
} from "./project.service";

export const build_project_created_event = (input: {
  event_id: string;
  project: Project;
  actor_org_user_id: string;
  actor_label: string;
  request_id: string;
  metadata_was_present: boolean;
  occurred_at: string;
}): AuditEvent => {
  const base = {
    organization_id: input.project.organization_id,
    audit_event_id: input.event_id,
    entity_type: "project",
    entity_id: input.project.id,
  };
  const fields: Array<{ name: string; type: AuditValueType; value: unknown }> =
    [
      { name: "name", type: "text", value: input.project.name },
      { name: "description", type: "text", value: input.project.description },
      { name: "slug", type: "text", value: input.project.slug },
      { name: "color", type: "text", value: input.project.color },
      { name: "icon", type: "text", value: input.project.icon },
      { name: "status", type: "enum", value: input.project.status },
    ];
  const items = [
    create_row_change({ id: ulid(), ...base, operation: "create" }),
    ...fields.map((field) =>
      create_scalar_change({
        id: ulid(),
        ...base,
        operation: "create",
        field_name: field.name,
        value_type: field.type,
        before: { state: "absent" },
        after:
          field.value === null
            ? { state: "null" }
            : { state: "value", value: field.value },
      }),
    ),
    ...(input.metadata_was_present
      ? [
          create_scalar_change({
            id: ulid(),
            ...base,
            operation: "create",
            field_name: "metadata",
            value_type: "text",
            before: { state: "absent" },
            after: { state: "redacted" },
          }),
        ]
      : []),
  ];
  return validate_audit_event({
    id: input.event_id,
    organization_id: input.project.organization_id,
    project_id: input.project.id,
    root_resource_type: "project",
    root_resource_id: input.project.id,
    action: "project.created",
    source_type: current_audit_source_type(),
    actor_type: "org_user",
    actor_org_user_id: input.actor_org_user_id,
    actor_label: input.actor_label,
    request_id: input.request_id,
    correlation_id: null,
    idempotency_key_hash: null,
    before_row_version: null,
    after_row_version: input.project.version,
    outcome: "committed",
    reason: null,
    occurred_at: input.occurred_at,
    items,
  });
};

type ProjectMutationEventInput = {
  event_id: string;
  before: Project;
  after: Project;
  actor_org_user_id: string;
  actor_label: string;
  request_id: string | null;
  occurred_at: string;
};

const project_mutation_event = (
  input: ProjectMutationEventInput,
  action: string,
  items: AuditEvent["items"],
) =>
  validate_audit_event({
    id: input.event_id,
    organization_id: input.after.organization_id,
    project_id: input.after.id,
    root_resource_type: "project",
    root_resource_id: input.after.id,
    action,
    source_type: current_audit_source_type(),
    actor_type: "org_user",
    actor_org_user_id: input.actor_org_user_id,
    actor_label: input.actor_label,
    request_id: input.request_id,
    correlation_id: null,
    idempotency_key_hash: null,
    before_row_version: input.before.version,
    after_row_version: input.after.version,
    outcome: "committed",
    reason: null,
    occurred_at: input.occurred_at,
    items,
  });

export const build_project_updated_event = (
  input: ProjectMutationEventInput & { metadata_changed: boolean },
) => {
  const base = {
    organization_id: input.after.organization_id,
    audit_event_id: input.event_id,
    entity_type: "project",
    entity_id: input.after.id,
  };
  const fields: Array<{
    name: string;
    type: AuditValueType;
    before: unknown;
    after: unknown;
  }> = [
    {
      name: "name",
      type: "text",
      before: input.before.name,
      after: input.after.name,
    },
    {
      name: "description",
      type: "text",
      before: input.before.description,
      after: input.after.description,
    },
    {
      name: "slug",
      type: "text",
      before: input.before.slug,
      after: input.after.slug,
    },
    {
      name: "color",
      type: "text",
      before: input.before.color,
      after: input.after.color,
    },
    {
      name: "icon",
      type: "text",
      before: input.before.icon,
      after: input.after.icon,
    },
    {
      name: "status",
      type: "enum",
      before: input.before.status,
      after: input.after.status,
    },
  ];
  const state = (value: unknown) =>
    value === null
      ? ({ state: "null" } as const)
      : ({ state: "value", value } as const);
  const items = fields
    .filter((field) => field.before !== field.after)
    .map((field) =>
      create_scalar_change({
        id: ulid(),
        ...base,
        operation: "update",
        field_name: field.name,
        value_type: field.type,
        before: state(field.before),
        after: state(field.after),
      }),
    );
  if (input.metadata_changed) {
    items.push(
      create_redacted_change({
        id: ulid(),
        ...base,
        operation: "update",
        field_name: "metadata",
      }),
    );
  }
  return project_mutation_event(input, "project.updated", items);
};

export const build_project_deleted_event = (input: ProjectMutationEventInput) =>
  project_mutation_event(input, "project.deleted", [
    create_row_change({
      id: ulid(),
      organization_id: input.after.organization_id,
      audit_event_id: input.event_id,
      entity_type: "project",
      entity_id: input.after.id,
      operation: "delete",
    }),
  ]);

type ProjectPool = Parameters<typeof run_audited_mutation>[0]["pool"];

export const build_project_creation_writer =
  (pool: ProjectPool): ProjectCreationWriter =>
  async (input) => {
    const event_id = ulid();
    const occurred_at = new Date().toISOString();
    return run_audited_mutation({
      pool,
      event_id,
      command: find_audit_command("project.create"),
      context: {
        organization_id: input.organization_id,
        actor_type: "org_user",
        source_type: current_audit_source_type(),
      },
      execute: (client) =>
        build_project_repository(
          client as unknown as Parameters<typeof build_project_repository>[0],
        ).create_project({
          organization_id: input.organization_id,
          actor_org_user_id: input.actor_org_user_id,
          data: input.data as CreateProjectInput,
        }),
      build_event: (project) =>
        build_project_created_event({
          event_id,
          project,
          actor_org_user_id: input.actor_org_user_id,
          actor_label: input.actor_label,
          request_id: input.request_id,
          metadata_was_present: input.metadata_was_present,
          occurred_at,
        }),
      write_audit_event,
    });
  };

type ProjectAuditPool = ProjectPool & {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: Row[] }>;
};

const changed_project_scalar = (before: Project, data: UpdateProjectInput) =>
  (Object.keys(data) as Array<keyof UpdateProjectInput>).some(
    (key) =>
      key !== "metadata" &&
      data[key] !== undefined &&
      before[key] !== data[key],
  );

export const build_audited_project_repository = (
  pool: ProjectAuditPool,
): ProjectRepository => {
  const base = build_project_repository(pool);
  return {
    create_project: base.create_project,
    list_projects: base.list_projects,
    find_project: base.find_project,
    async update_project(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let before: Project | null = null;
      let actor_label = "organization-member";
      let metadata_changed = false;
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("project.update"),
        context: async (client) => {
          await client.query(
            `
            SELECT id FROM project_schema.project
            WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE
            FOR UPDATE
          `,
            [input.project_id, input.organization_id],
          );
          before = await build_project_repository(client).find_project(input);
          const actor = await client.query<{ display_name: string }>(
            `
            SELECT app_user.display_name
            FROM organization_schema.org_user org_user
            JOIN user_schema.user app_user ON app_user.id = org_user.user_id
            WHERE org_user.id = $1 AND org_user.organization_id = $2
          `,
            [input.actor_org_user_id, input.organization_id],
          );
          actor_label = safe_audit_actor_label(
            actor.rows[0]?.display_name ?? "",
          );
          if (before && input.data.metadata !== undefined) {
            const metadata = await client.query<{ changed: boolean }>(
              `
              SELECT metadata IS DISTINCT FROM $3::jsonb AS changed
              FROM project_schema.project WHERE id = $1 AND organization_id = $2
            `,
              [input.project_id, input.organization_id, input.data.metadata],
            );
            metadata_changed = Boolean(metadata.rows[0]?.changed);
          }
          return {
            organization_id: input.organization_id,
            actor_type: "org_user",
            source_type: current_audit_source_type(),
          };
        },
        execute: async (client) => {
          if (
            !before ||
            (!changed_project_scalar(before, input.data) && !metadata_changed)
          ) {
            return before;
          }
          return build_project_repository(client).update_project(input);
        },
        build_event: (after) =>
          after && before && after.version !== before.version
            ? build_project_updated_event({
                event_id,
                before,
                after,
                actor_org_user_id: input.actor_org_user_id,
                actor_label,
                request_id: current_audit_request_id(),
                occurred_at,
                metadata_changed,
              })
            : null,
        write_audit_event,
      });
    },
    async delete_project(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let before: Project | null = null;
      let actor_label = "organization-member";
      const deleted = await run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("project.delete"),
        context: async (client) => {
          await client.query(
            `
            SELECT id FROM project_schema.project
            WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE
            FOR UPDATE
          `,
            [input.project_id, input.organization_id],
          );
          before = await build_project_repository(client).find_project(input);
          const actor = await client.query<{ display_name: string }>(
            `
            SELECT app_user.display_name FROM organization_schema.org_user org_user
            JOIN user_schema.user app_user ON app_user.id = org_user.user_id
            WHERE org_user.id = $1 AND org_user.organization_id = $2
          `,
            [input.actor_org_user_id, input.organization_id],
          );
          actor_label = safe_audit_actor_label(
            actor.rows[0]?.display_name ?? "",
          );
          return {
            organization_id: input.organization_id,
            actor_type: "org_user",
            source_type: current_audit_source_type(),
          };
        },
        execute: (client) =>
          before
            ? build_project_repository(client).delete_project(input)
            : Promise.resolve(false),
        build_event: (result) =>
          result && before
            ? build_project_deleted_event({
                event_id,
                before,
                after: { ...before, version: before.version + 1 },
                actor_org_user_id: input.actor_org_user_id,
                actor_label,
                request_id: current_audit_request_id(),
                occurred_at,
              })
            : null,
        write_audit_event,
      });
      return deleted;
    },
  };
};
