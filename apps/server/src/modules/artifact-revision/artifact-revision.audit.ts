import { ulid } from "ulid";
import { find_audit_command } from "../audit/audit-coverage-registry";
import {
  build_entity_audit_event,
  resolve_org_user_audit_context,
  type EntityAuditChange,
} from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_artifact_revision_repository } from "./artifact-revision.repository";
import type { ArtifactRevisionRepository } from "./artifact-revision.service";

type Pool = Parameters<typeof run_audited_mutation>[0]["pool"] & {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: Row[] }>;
};
type Client = Parameters<
  Parameters<typeof run_audited_mutation>[0]["execute"]
>[0];
type Actor = {
  auth: { organization_id: string; actor_org_user_id: string };
  project_id: string;
  project_version_id: string;
};
type Row = Record<string, unknown> & { id: string };
type Snapshot = {
  root_id: string;
  edition_version: number;
  draft_version: number;
  rows: Map<string, Row>;
} | null;

const snapshot = async (
  client: Client,
  input: Actor & ({ guide_id: string } | { interactive_demo_id: string }),
): Promise<Snapshot> => {
  const guide = "guide_id" in input;
  const artifact_id = guide ? input.guide_id : input.interactive_demo_id;
  const edition_table = guide
    ? "guide_schema.guide_edition"
    : "interactive_demo_schema.interactive_demo_edition";
  const artifact_column = guide ? "guide_id" : "interactive_demo_id";
  const draft_table = guide
    ? "guide_schema.guide_working_draft"
    : "interactive_demo_schema.interactive_demo_working_draft";
  const draft_column = guide
    ? "guide_edition_id"
    : "interactive_demo_edition_id";
  const root = (
    await client.query<{
      edition_id: string;
      edition_version: number;
      draft_id: string;
      draft_version: number;
    }>(
      `SELECT edition.id AS edition_id,edition.version AS edition_version,draft.id AS draft_id,draft.version AS draft_version
     FROM ${edition_table} edition JOIN ${draft_table} draft ON draft.${draft_column}=edition.id
     WHERE edition.organization_id=$1 AND edition.project_id=$2 AND edition.project_version_id=$3
       AND edition.${artifact_column}=$4`,
      [
        input.auth.organization_id,
        input.project_id,
        input.project_version_id,
        artifact_id,
      ],
    )
  ).rows[0];
  if (!root) return null;
  const rows = new Map<string, Row>();
  const add = (entity_type: string, values: Row[]) =>
    values.forEach((row) =>
      rows.set(`${entity_type}:${row.id}`, {
        ...row,
        __entity_type: entity_type,
      }),
    );
  add(
    guide ? "guide_edition" : "interactive_demo_edition",
    (
      await client.query<Row>(`SELECT * FROM ${edition_table} WHERE id=$1`, [
        root.edition_id,
      ])
    ).rows,
  );
  add(
    guide ? "guide_working_draft" : "interactive_demo_working_draft",
    (
      await client.query<Row>(`SELECT * FROM ${draft_table} WHERE id=$1`, [
        root.draft_id,
      ])
    ).rows,
  );
  const tables = guide
    ? [
        [
          "guide_block",
          "guide_schema.guide_block",
          "guide_working_draft_id",
          root.draft_id,
        ],
        [
          "guide_step",
          "guide_schema.guide_step",
          "guide_working_draft_id",
          root.draft_id,
        ],
        [
          "guide_annotation",
          "guide_schema.guide_annotation",
          "guide_working_draft_id",
          root.draft_id,
        ],
        [
          "guide_revision",
          "guide_schema.guide_revision",
          "guide_edition_id",
          root.edition_id,
        ],
      ]
    : [
        [
          "demo_scene",
          "interactive_demo_schema.demo_scene",
          "interactive_demo_working_draft_id",
          root.draft_id,
        ],
        [
          "demo_hotspot",
          "interactive_demo_schema.demo_hotspot",
          "interactive_demo_working_draft_id",
          root.draft_id,
        ],
        [
          "demo_transition",
          "interactive_demo_schema.demo_transition",
          "interactive_demo_working_draft_id",
          root.draft_id,
        ],
        [
          "interactive_demo_revision",
          "interactive_demo_schema.interactive_demo_revision",
          "interactive_demo_edition_id",
          root.edition_id,
        ],
      ];
  for (const [type, table, column, id] of tables)
    add(
      type!,
      (
        await client.query<Row>(`SELECT * FROM ${table} WHERE ${column}=$1`, [
          id,
        ])
      ).rows,
    );
  const revisions = [...rows.values()].filter(
    (row) =>
      row.__entity_type ===
      (guide ? "guide_revision" : "interactive_demo_revision"),
  );
  for (const revision of revisions) {
    const children = guide
      ? [
          ["guide_revision_block", "guide_schema.guide_revision_block"],
          ["guide_revision_step", "guide_schema.guide_revision_step"],
          [
            "guide_revision_annotation",
            "guide_schema.guide_revision_annotation",
          ],
        ]
      : [
          [
            "demo_revision_scene",
            "interactive_demo_schema.demo_revision_scene",
          ],
          [
            "demo_revision_hotspot",
            "interactive_demo_schema.demo_revision_hotspot",
          ],
          [
            "demo_revision_transition",
            "interactive_demo_schema.demo_revision_transition",
          ],
        ];
    for (const [type, table] of children)
      add(
        type!,
        (
          await client.query<Row>(
            `SELECT * FROM ${table} WHERE ${guide ? "guide_revision_id" : "interactive_demo_revision_id"}=$1`,
            [revision.id],
          )
        ).rows,
      );
  }
  return {
    root_id: artifact_id,
    edition_version: root.edition_version,
    draft_version: root.draft_version,
    rows,
  };
};

const clean = (row: Row | null) =>
  row
    ? Object.fromEntries(
        Object.entries(row).filter(([key]) => key !== "__entity_type"),
      )
    : null;
const changes = (before: Snapshot, after: Snapshot): EntityAuditChange[] => {
  const output: EntityAuditChange[] = [];
  const keys = new Set([
    ...(before?.rows.keys() ?? []),
    ...(after?.rows.keys() ?? []),
  ]);
  for (const key of keys) {
    const prior = before?.rows.get(key) ?? null;
    const next = after?.rows.get(key) ?? null;
    if (JSON.stringify(prior) === JSON.stringify(next)) continue;
    const row = next ?? prior!;
    const safe_fields: Record<string, "integer" | "boolean" | "text" | "enum"> =
      {};
    if ("version" in row) safe_fields.version = "integer";
    if ("is_deleted" in row) safe_fields.is_deleted = "boolean";
    if ("status" in row) safe_fields.status = "enum";
    if ("title" in row) safe_fields.title = "text";
    output.push({
      entity_type: String(row.__entity_type),
      entity_id: row.id,
      parent_entity_type: "artifact",
      parent_entity_id: (after ?? before)!.root_id,
      before: clean(prior),
      after: clean(next),
      safe_fields,
      redacted_fields: [],
    });
  }
  return output;
};

export const build_audited_artifact_revision_repository = (
  pool: Pool,
): ArtifactRevisionRepository => {
  const base = build_artifact_revision_repository(pool);
  const run = async <Result>(options: {
    command:
      | "guide.revision.checkpoint"
      | "guide.revision.restore"
      | "interactive_demo.revision.checkpoint"
      | "interactive_demo.revision.restore";
    action: string;
    input: Actor & ({ guide_id: string } | { interactive_demo_id: string });
    execute(
      repository: ReturnType<typeof build_artifact_revision_repository>,
    ): Promise<Result>;
  }) => {
    const event_id = ulid();
    const occurred_at = new Date().toISOString();
    let before: Snapshot = null;
    let after: Snapshot = null;
    let context: Awaited<
      ReturnType<typeof resolve_org_user_audit_context>
    > | null = null;
    return run_audited_mutation({
      pool,
      event_id,
      command: find_audit_command(options.command),
      context: async (client) => {
        before = await snapshot(client, options.input);
        context = await resolve_org_user_audit_context(
          client,
          options.input.auth,
        );
        return context.mutation;
      },
      execute: async (client) => {
        const result = await options.execute(
          build_artifact_revision_repository(client),
        );
        after = await snapshot(client, options.input);
        return result;
      },
      build_event: () => {
        const diff = changes(before, after);
        if (!diff.length) return null;
        return build_entity_audit_event({
          id: event_id,
          organization_id: options.input.auth.organization_id,
          project_id: options.input.project_id,
          root_resource_type: "artifact",
          root_resource_id: (after ?? before)!.root_id,
          action: options.action,
          actor_org_user_id: options.input.auth.actor_org_user_id,
          actor_label: context!.actor_label,
          source_type: context!.mutation.source_type,
          occurred_at,
          before_row_version:
            before?.draft_version ?? before?.edition_version ?? null,
          after_row_version:
            after?.draft_version ?? after?.edition_version ?? null,
          changes: diff,
        });
      },
      write_audit_event,
    });
  };
  return {
    ...base,
    checkpoint_guide: (input) =>
      run({
        command: "guide.revision.checkpoint",
        action: "guide.revision.created",
        input,
        execute: (repository) => repository.checkpoint_guide(input),
      }),
    restore_guide_revision: (input) =>
      run({
        command: "guide.revision.restore",
        action: "guide.revision.restored",
        input,
        execute: (repository) => repository.restore_guide_revision(input),
      }),
    checkpoint_interactive_demo: (input) =>
      run({
        command: "interactive_demo.revision.checkpoint",
        action: "interactive_demo.revision.created",
        input,
        execute: (repository) => repository.checkpoint_interactive_demo(input),
      }),
    restore_interactive_demo_revision: (input) =>
      run({
        command: "interactive_demo.revision.restore",
        action: "interactive_demo.revision.restored",
        input,
        execute: (repository) =>
          repository.restore_interactive_demo_revision(input),
      }),
  };
};
