import {
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditEvent,
  type AuditOperation,
  type AuditValueType,
} from "@repo/audit-domain";
import type { ProjectMembership } from "@repo/types/project-membership";
import { ulid } from "ulid";
import { find_audit_command } from "../audit/audit-coverage-registry";
import { current_audit_request_id, current_audit_source_type, safe_audit_actor_label } from "../audit/audit-request-context";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_project_membership_repository } from "./project-membership.repository";
import type { ProjectMembershipRepository } from "./project-membership.service";

type MembershipCommand = "project.membership.assign" | "project.membership.role_change" | "project.membership.remove";
const actions = {
  "project.membership.assign": "project.membership.assigned",
  "project.membership.role_change": "project.membership.role_changed",
  "project.membership.remove": "project.membership.removed",
} as const;
const state = (value: unknown) => value === null
  ? ({ state: "null" } as const)
  : ({ state: "value", value } as const);

export const build_project_membership_event = (input: {
  event_id: string;
  command: MembershipCommand;
  before: ProjectMembership | null;
  after: ProjectMembership;
  actor_org_user_id: string;
  actor_label: string;
  request_id: string | null;
  occurred_at: string;
}): AuditEvent => {
  const operation: AuditOperation = input.before ? "update" : "create";
  const base = {
    organization_id: input.after.organization_id,
    audit_event_id: input.event_id,
    entity_type: "project_membership",
    entity_id: input.after.id,
    parent_entity_type: "project",
    parent_entity_id: input.after.project_id,
  };
  const fields: Array<{ name: string; type: AuditValueType; before: unknown; after: unknown }> = [
    { name: "role", type: "enum", before: input.before?.role, after: input.after.role },
    { name: "status", type: "enum", before: input.before?.status, after: input.after.status },
    { name: "version", type: "integer", before: input.before?.version, after: input.after.version },
    { name: "revoked_by_id", type: "identifier", before: input.before?.revoked_by_id, after: input.after.revoked_by_id },
    { name: "revoked_at", type: "timestamp", before: input.before?.revoked_at, after: input.after.revoked_at },
  ];
  const items = [
    ...(input.before ? [] : [create_row_change({ id: ulid(), ...base, operation: "create" })]),
    ...fields.filter((field) => !input.before || field.before !== field.after).map((field) =>
      create_scalar_change({
        id: ulid(), ...base, operation, field_name: field.name, value_type: field.type,
        before: input.before ? state(field.before) : { state: "absent" },
        after: state(field.after),
      })),
  ];
  return validate_audit_event({
    id: input.event_id, organization_id: input.after.organization_id,
    project_id: input.after.project_id, root_resource_type: "project",
    root_resource_id: input.after.project_id, action: actions[input.command],
    source_type: current_audit_source_type(), actor_type: "org_user",
    actor_org_user_id: input.actor_org_user_id, actor_label: input.actor_label,
    request_id: input.request_id, correlation_id: null, idempotency_key_hash: null,
    before_row_version: input.before?.version ?? null,
    after_row_version: input.after.version, outcome: "committed", reason: null,
    occurred_at: input.occurred_at, items,
  });
};

type Pool = Parameters<typeof run_audited_mutation>[0]["pool"] & {
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
};

export const build_audited_project_membership_repository = (pool: Pool): ProjectMembershipRepository => {
  const base = build_project_membership_repository(pool);
  const actor_label = async (client: Parameters<Parameters<typeof run_audited_mutation>[0]["execute"]>[0], organization_id: string, actor_id: string) => {
    const result = await client.query<{ display_name: string }>(`
      SELECT app_user.display_name FROM organization_schema.org_user org_user
      JOIN user_schema.user app_user ON app_user.id = org_user.user_id
      WHERE org_user.organization_id = $1 AND org_user.id = $2
    `, [organization_id, actor_id]);
    return safe_audit_actor_label(result.rows[0]?.display_name ?? "");
  };
  return {
    ...base,
    async assign_membership(args) {
      const event_id = ulid(); const occurred_at = new Date().toISOString();
      let before: ProjectMembership | null = null; let label = "organization-member";
      return run_audited_mutation({
        pool, event_id, command: find_audit_command("project.membership.assign"),
        context: async (client) => {
          await client.query(`SELECT id FROM organization_schema.org_user WHERE organization_id = $1 AND id IN ($2, $3) FOR UPDATE`, [args.organization_id, args.actor_org_user_id, args.org_user_id]);
          before = await build_project_membership_repository(client).find_membership(args);
          label = await actor_label(client, args.organization_id, args.actor_org_user_id);
          return { organization_id: args.organization_id, actor_type: "org_user", source_type: current_audit_source_type() };
        },
        execute: (client) => build_project_membership_repository(client).assign_membership(args),
        build_event: (after) => build_project_membership_event({ event_id, command: "project.membership.assign", before, after,
          actor_org_user_id: args.actor_org_user_id, actor_label: label, request_id: current_audit_request_id(), occurred_at }),
        write_audit_event,
      });
    },
    async change_membership_role(args) {
      const event_id = ulid(); const occurred_at = new Date().toISOString();
      let before: ProjectMembership | null = null; let label = "organization-member";
      return run_audited_mutation({
        pool, event_id, command: find_audit_command("project.membership.role_change"),
        context: async (client) => {
          await client.query(`SELECT id FROM project_schema.project_membership WHERE organization_id = $1 AND project_id = $2 AND id = $3 FOR UPDATE`, [args.organization_id, args.project_id, args.membership_id]);
          const found = await build_project_membership_repository(client).find_membership_by_id(args);
          before = found;
          label = await actor_label(client, args.organization_id, args.actor_org_user_id);
          return { organization_id: args.organization_id, actor_type: "org_user", source_type: current_audit_source_type() };
        },
        execute: (client) => build_project_membership_repository(client).change_membership_role(args),
        build_event: (after) => after && before ? build_project_membership_event({ event_id, command: "project.membership.role_change", before, after,
          actor_org_user_id: args.actor_org_user_id, actor_label: label, request_id: current_audit_request_id(), occurred_at }) : null,
        write_audit_event,
      });
    },
    async remove_membership(args) {
      const event_id = ulid(); const occurred_at = new Date().toISOString();
      let before: ProjectMembership | null = null; let after: ProjectMembership | null = null; let label = "organization-member";
      return run_audited_mutation({
        pool, event_id, command: find_audit_command("project.membership.remove"),
        context: async (client) => {
          await client.query(`SELECT id FROM project_schema.project_membership WHERE organization_id = $1 AND project_id = $2 AND id = $3 FOR UPDATE`, [args.organization_id, args.project_id, args.membership_id]);
          before = await build_project_membership_repository(client).find_membership_by_id(args);
          label = await actor_label(client, args.organization_id, args.actor_org_user_id);
          return { organization_id: args.organization_id, actor_type: "org_user", source_type: current_audit_source_type() };
        },
        execute: async (client) => {
          const repository = build_project_membership_repository(client);
          const removed = await repository.remove_membership(args);
          if (removed) after = await repository.find_membership_by_id(args);
          return removed;
        },
        build_event: (removed) => removed && before && after ? build_project_membership_event({ event_id, command: "project.membership.remove", before, after,
          actor_org_user_id: args.actor_org_user_id, actor_label: label, request_id: current_audit_request_id(), occurred_at }) : null,
        write_audit_event,
      });
    },
  };
};
