import { ulid } from "ulid";
import type { ArtifactCarryForwardResponse } from "@repo/types";
import { find_audit_command } from "../audit/audit-coverage-registry";
import {
  build_entity_audit_event,
  resolve_org_user_audit_context,
  type EntityAuditChange,
} from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_artifact_carry_forward_repository } from "./artifact-carry-forward.repository";
import type { ArtifactCarryForwardRepository } from "./artifact-carry-forward.service";

type Pool = Parameters<typeof run_audited_mutation>[0]["pool"] & {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
};
type Client = Parameters<
  Parameters<typeof run_audited_mutation>[0]["execute"]
>[0];
type Row = Record<string, unknown> & { id: string };
type Snapshot = Map<string, Row>;
const tables: Array<[string, string, string]> = [
  ["guide_revision", "guide_schema.guide_revision", "id"],
  ["guide_revision_block", "guide_schema.guide_revision_block", "id"],
  ["guide_revision_step", "guide_schema.guide_revision_step", "id"],
  ["guide_revision_annotation", "guide_schema.guide_revision_annotation", "id"],
  [
    "interactive_demo_revision",
    "interactive_demo_schema.interactive_demo_revision",
    "id",
  ],
  ["demo_revision_scene", "interactive_demo_schema.demo_revision_scene", "id"],
  [
    "demo_revision_hotspot",
    "interactive_demo_schema.demo_revision_hotspot",
    "id",
  ],
  [
    "demo_revision_transition",
    "interactive_demo_schema.demo_revision_transition",
    "id",
  ],
  ["artifact_carry_forward", "project_schema.artifact_carry_forward", "id"],
  [
    "artifact_carry_forward_item",
    "project_schema.artifact_carry_forward_item",
    "id",
  ],
  [
    "guide_carry_forward_item",
    "guide_schema.guide_carry_forward_item",
    "artifact_carry_forward_item_id",
  ],
  [
    "interactive_demo_carry_forward_item",
    "interactive_demo_schema.interactive_demo_carry_forward_item",
    "artifact_carry_forward_item_id",
  ],
  ["guide_edition", "guide_schema.guide_edition", "id"],
  ["guide_working_draft", "guide_schema.guide_working_draft", "id"],
  ["guide_block", "guide_schema.guide_block", "id"],
  ["guide_step", "guide_schema.guide_step", "id"],
  ["guide_annotation", "guide_schema.guide_annotation", "id"],
  [
    "interactive_demo_edition",
    "interactive_demo_schema.interactive_demo_edition",
    "id",
  ],
  [
    "interactive_demo_working_draft",
    "interactive_demo_schema.interactive_demo_working_draft",
    "id",
  ],
  ["demo_scene", "interactive_demo_schema.demo_scene", "id"],
  ["demo_hotspot", "interactive_demo_schema.demo_hotspot", "id"],
  ["demo_transition", "interactive_demo_schema.demo_transition", "id"],
];
const snapshot = async (
  client: Client,
  organization_id: string,
  project_id: string,
): Promise<Snapshot> => {
  const result: Snapshot = new Map();
  for (const [type, table, id_column] of tables) {
    const rows = await client.query<Row>(
      `SELECT *,${id_column} AS id FROM ${table} WHERE organization_id=$1 AND project_id=$2`,
      [organization_id, project_id],
    );
    for (const row of rows.rows)
      result.set(`${type}:${row.id}`, { ...row, __entity_type: type });
  }
  return result;
};
const clean = (row: Row | null) =>
  row
    ? Object.fromEntries(
        Object.entries(row).filter(([key]) => key !== "__entity_type"),
      )
    : null;
const diff = (
  before: Snapshot,
  after: Snapshot,
  root_id: string,
): EntityAuditChange[] => {
  const changes: EntityAuditChange[] = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const prior = before.get(key) ?? null,
      next = after.get(key) ?? null;
    if (JSON.stringify(prior) === JSON.stringify(next)) continue;
    const row = next ?? prior!;
    changes.push({
      entity_type: String(row.__entity_type),
      entity_id: row.id,
      parent_entity_type: "artifact_carry_forward",
      parent_entity_id: root_id,
      before: clean(prior),
      after: clean(next),
      safe_fields: {},
      redacted_fields: [],
    });
  }
  return changes;
};

export const build_audited_artifact_carry_forward_repository = (
  pool: Pool,
): ArtifactCarryForwardRepository => ({
  async carry_forward(input) {
    const event_id = ulid(),
      occurred_at = new Date().toISOString();
    let before: Snapshot = new Map(),
      after: Snapshot = new Map();
    let context: Awaited<
      ReturnType<typeof resolve_org_user_audit_context>
    > | null = null;
    return run_audited_mutation({
      pool,
      event_id,
      command: find_audit_command("artifact.carry_forward"),
      context: async (client) => {
        before = await snapshot(
          client,
          input.auth.organization_id,
          input.project_id,
        );
        context = await resolve_org_user_audit_context(client, input.auth);
        return context.mutation;
      },
      execute: async (client) => {
        const result =
          await build_artifact_carry_forward_repository(client).carry_forward(
            input,
          );
        if (!result.replayed)
          after = await snapshot(
            client,
            input.auth.organization_id,
            input.project_id,
          );
        else after = before;
        return result;
      },
      build_event: (result: ArtifactCarryForwardResponse) => {
        if (result.replayed) return null;
        const changes = diff(before, after, result.carry_forward.id);
        return build_entity_audit_event({
          id: event_id,
          organization_id: input.auth.organization_id,
          project_id: input.project_id,
          root_resource_type: "artifact_carry_forward",
          root_resource_id: result.carry_forward.id,
          action: "artifact.editions.carried_forward",
          actor_org_user_id: input.auth.actor_org_user_id,
          actor_label: context!.actor_label,
          source_type: context!.mutation.source_type,
          occurred_at,
          before_row_version: null,
          after_row_version: null,
          changes,
        });
      },
      write_audit_event,
    });
  },
});
