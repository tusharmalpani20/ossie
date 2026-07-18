import {
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditEvent,
  type AuditValueType,
} from "@repo/audit-domain";
import { ulid } from "ulid";
import { run_audited_mutation } from "../audit/audit-transaction";
import { find_audit_command } from "../audit/audit-coverage-registry";
import { write_audit_event } from "../audit/audit.repository";
import { build_project_repository } from "./project.repository";
import type {
  CreateProjectInput,
  Project,
  ProjectCreationWriter,
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
    source_type: "web",
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
        source_type: "web",
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
