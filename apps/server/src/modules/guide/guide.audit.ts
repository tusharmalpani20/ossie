import { ulid } from "ulid";
import { find_audit_command } from "../audit/audit-coverage-registry";
import {
  build_entity_audit_event,
  resolve_org_user_audit_context,
  type EntityAuditChange,
} from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_guide_repository } from "./guide.repository";
import type {
  Guide,
  GuideBlock,
  GuideDetail,
  GuideRepository,
  GuideStep,
} from "./guide.service";

type Pool = Parameters<typeof run_audited_mutation>[0]["pool"] & {
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
};
type Client = Parameters<Parameters<typeof run_audited_mutation>[0]["execute"]>[0];
type ActorInput = { organization_id: string; project_id: string; actor_org_user_id: string };
type Scope = ActorInput & { guide_id: string };
type EventContext = Awaited<ReturnType<typeof resolve_org_user_audit_context>>;

const guide_fields = { project_id: "identifier", source_capture_session_id: "identifier", title: "text", description: "text", status: "enum" } as const;
const block_fields = { project_id: "identifier", guide_id: "identifier", source_capture_session_id: "identifier", source_capture_event_id: "identifier", source_capture_asset_id: "identifier", selected_capture_asset_id: "identifier", screenshot_hidden: "boolean", block_type: "enum", block_index: "integer" } as const;
const step_fields = { project_id: "identifier", guide_id: "identifier", guide_block_id: "identifier", source_capture_session_id: "identifier", source_capture_event_id: "identifier", source_capture_asset_id: "identifier", title: "text" } as const;

const row_change = (
  type: "guide" | "guide_block" | "guide_step",
  before: Guide | GuideBlock | GuideStep | null,
  after: Guide | GuideBlock | GuideStep | null,
  parent_type: string | null,
  parent_id: string | null,
): EntityAuditChange => {
  const row = after ?? before!;
  const clean = (value: Guide | GuideBlock | GuideStep | null) => {
    if (!value) return null;
    if ("block_type" in value) {
      const { step: _step, display_capture_asset_id: _display, ...persisted } = value;
      return persisted;
    }
    return { ...value };
  };
  return {
    entity_type: type,
    entity_id: row.id,
    parent_entity_type: parent_type,
    parent_entity_id: parent_id,
    before: clean(before),
    after: clean(after),
    safe_fields: type === "guide" ? guide_fields : type === "guide_block" ? block_fields : step_fields,
    redacted_fields: type === "guide_block" ? ["content"] : type === "guide_step" ? ["body"] : [],
  };
};

const different = (before: unknown, after: unknown) => JSON.stringify(before) !== JSON.stringify(after);

export const build_guide_snapshot_changes = (
  before: GuideDetail | null,
  after: GuideDetail | null,
): EntityAuditChange[] => {
  const changes: EntityAuditChange[] = [];
  if (different(before?.guide, after?.guide))
    changes.push(row_change("guide", before?.guide ?? null, after?.guide ?? null, "project", (after ?? before)!.guide.project_id));

  const before_blocks = new Map((before?.guide_blocks ?? []).map((row) => [row.id, row]));
  const after_blocks = new Map((after?.guide_blocks ?? []).map((row) => [row.id, row]));
  for (const id of new Set([...before_blocks.keys(), ...after_blocks.keys()])) {
    const prior = before_blocks.get(id) ?? null;
    const next = after_blocks.get(id) ?? null;
    if (different(prior && { ...prior, step: null }, next && { ...next, step: null }))
      changes.push(row_change("guide_block", prior, next, "guide", (after ?? before)!.guide.id));

    const prior_step = prior?.step ?? null;
    const next_step = next?.step ?? null;
    if (different(prior_step, next_step))
      changes.push(row_change("guide_step", prior_step, next_step, "guide_block", id));
  }
  return changes;
};

export const build_guide_audit_event = (input: {
  event_id: string;
  occurred_at: string;
  actor: ActorInput;
  context: EventContext;
  action: string;
  before: GuideDetail | null;
  after: GuideDetail | null;
}) => {
  const root = (input.after ?? input.before)!.guide;
  return build_entity_audit_event({
    id: input.event_id,
    organization_id: input.actor.organization_id,
    project_id: input.actor.project_id,
    root_resource_type: "guide",
    root_resource_id: root.id,
    action: input.action,
    actor_org_user_id: input.actor.actor_org_user_id,
    actor_label: input.context.actor_label,
    source_type: input.context.mutation.source_type,
    occurred_at: input.occurred_at,
    before_row_version: input.before?.guide.version ?? null,
    after_row_version: input.after?.guide.version ?? ((input.before?.guide.version ?? 0) + 1 || null),
    changes: build_guide_snapshot_changes(input.before, input.after),
  });
};

const input_differs = (before: Record<string, unknown>, data: Record<string, unknown>) =>
  Object.entries(data).some(([key, value]) => different(before[key], value));

export const build_audited_guide_repository = (pool: Pool): GuideRepository => {
  const base = build_guide_repository(pool);
  const lock_detail = async (client: Client, input: Scope) => {
    await client.query("SELECT id FROM guide_schema.guide WHERE id=$1 AND project_id=$2 AND organization_id=$3 AND is_deleted=FALSE FOR UPDATE", [input.guide_id, input.project_id, input.organization_id]);
    return build_guide_repository(client).find_guide_detail(input);
  };
  const run = async <Result>(input: {
    command: Parameters<typeof find_audit_command>[0];
    action: string;
    actor: ActorInput;
    prepare?: (client: Client) => Promise<void>;
    execute: (repository: GuideRepository) => Promise<Result>;
    evidence: (result: Result, context: EventContext, event_id: string, occurred_at: string) => ReturnType<typeof build_entity_audit_event>;
  }) => {
    const event_id = ulid(); const occurred_at = new Date().toISOString(); let context: EventContext | null = null;
    return run_audited_mutation({ pool, event_id, command: find_audit_command(input.command),
      context: async (client) => { await input.prepare?.(client); context = await resolve_org_user_audit_context(client, input.actor); return context.mutation; },
      execute: (client) => input.execute(build_guide_repository(client)),
      build_event: (result) => input.evidence(result, context!, event_id, occurred_at),
      write_audit_event,
    });
  };
  const snapshot_operation = async <Result>(options: {
    command: Parameters<typeof find_audit_command>[0]; action: string; input: Scope;
    should_execute?: (before: GuideDetail) => boolean;
    execute: (repository: GuideRepository) => Promise<Result>;
    no_op: (before: GuideDetail) => Result;
  }) => {
    let before: GuideDetail | null = null; let after: GuideDetail | null = null;
    return run({ command: options.command, action: options.action, actor: options.input,
      prepare: async (client) => { before = await lock_detail(client, options.input); },
      execute: async (repository) => {
        if (!before || (options.should_execute && !options.should_execute(before))) return options.no_op(before!);
        const result = await options.execute(repository);
        after = await repository.find_guide_detail(options.input);
        return result;
      },
        evidence: (_result, context, event_id, occurred_at) => before && after ? build_guide_audit_event({ event_id, occurred_at, actor: options.input, context, action: options.action, before, after }) : null,
    });
  };

  return {
    ...base,
    async create_guide_from_capture(input) {
      let after: GuideDetail | null = null;
      return run({ command: "guide.create_from_capture", action: "guide.created", actor: input,
        execute: async (repository) => { const result = await repository.create_guide_from_capture(input); after = await repository.find_guide_detail({ ...input, guide_id: result.guide.id }); return result; },
        evidence: (_result, context, event_id, occurred_at) => build_guide_audit_event({ event_id, occurred_at, actor: input, context, action: "guide.created", before: null, after }),
      });
    },
    update_guide: (input) => snapshot_operation({ command: "guide.update", action: "guide.updated", input, should_execute: (before) => input_differs({ ...before.guide }, input.data), execute: (repository) => repository.update_guide(input), no_op: (before) => before.guide }),
    update_guide_step: (input) => snapshot_operation({ command: "guide.step.update", action: "guide.step.updated", input, should_execute: (before) => { const step = before.guide_blocks.map((row) => row.step).find((row) => row?.id === input.guide_step_id); return Boolean(step && input_differs({ ...step }, input.data)); }, execute: (repository) => repository.update_guide_step(input), no_op: (before) => before.guide_blocks.map((row) => row.step).find((row) => row?.id === input.guide_step_id)! }),
    reorder_guide_blocks: (input) => snapshot_operation({ command: "guide.blocks.reorder", action: "guide.blocks.reordered", input, should_execute: (before) => !before.guide_blocks.every((row, index) => row.id === input.block_ids[index]), execute: (repository) => repository.reorder_guide_blocks(input), no_op: (before) => before.guide_blocks }),
    create_guide_block: (input) => snapshot_operation({ command: "guide.block.create", action: "guide.block.created", input, execute: (repository) => repository.create_guide_block(input), no_op: (before) => before.guide_blocks }),
    update_guide_block: (input) => snapshot_operation({ command: "guide.block.update", action: "guide.block.updated", input, should_execute: (before) => { const block = before.guide_blocks.find((row) => row.id === input.guide_block_id); return Boolean(block && different(block.content, input.data.content)); }, execute: (repository) => repository.update_guide_block(input), no_op: (before) => before.guide_blocks.find((row) => row.id === input.guide_block_id)! }),
    update_guide_block_screenshot: (input) => snapshot_operation({ command: "guide.block.screenshot.update", action: "guide.block.screenshot_updated", input, should_execute: (before) => { const block = before.guide_blocks.find((row) => row.id === input.guide_block_id); return Boolean(block && (block.selected_capture_asset_id !== input.data.selected_capture_asset_id || block.screenshot_hidden !== input.data.screenshot_hidden)); }, execute: (repository) => repository.update_guide_block_screenshot(input), no_op: (before) => before.guide_blocks.find((row) => row.id === input.guide_block_id)! }),
    update_guide_block_annotations: (input) => snapshot_operation({ command: "guide.block.annotations.update", action: "guide.block.annotations_updated", input, should_execute: (before) => { const block = before.guide_blocks.find((row) => row.id === input.guide_block_id); return Boolean(block && different(block.content, input.data.content)); }, execute: (repository) => repository.update_guide_block_annotations(input), no_op: (before) => before.guide_blocks.find((row) => row.id === input.guide_block_id)! }),
    delete_guide_block: (input) => snapshot_operation({ command: "guide.block.delete", action: "guide.block.deleted", input, should_execute: (before) => before.guide_blocks.some((row) => row.id === input.guide_block_id), execute: (repository) => repository.delete_guide_block(input), no_op: () => false }),
  };
};
