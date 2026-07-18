import { ulid } from "ulid";
import { find_audit_command } from "../audit/audit-coverage-registry";
import {
  build_entity_audit_event,
  resolve_org_user_audit_context,
  type EntityAuditChange,
} from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_interactive_demo_repository } from "./interactive-demo.repository";
import type {
  DemoHotspot,
  DemoScene,
  InteractiveDemo,
  InteractiveDemoRepository,
} from "./interactive-demo.service";

type Pool = Parameters<typeof run_audited_mutation>[0]["pool"] & {
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
};
type Client = Parameters<Parameters<typeof run_audited_mutation>[0]["execute"]>[0];
type ActorInput = { organization_id: string; project_id: string; actor_org_user_id: string };
type EventContext = Awaited<ReturnType<typeof resolve_org_user_audit_context>>;

const demo_fields = {
  project_id: "identifier",
  source_capture_session_id: "identifier",
  title: "text",
  description: "text",
  status: "enum",
} as const;
const scene_fields = {
  project_id: "identifier",
  interactive_demo_id: "identifier",
  source_capture_session_id: "identifier",
  source_capture_event_id: "identifier",
  source_capture_asset_id: "identifier",
  scene_index: "integer",
  title: "text",
  description: "text",
  background_capture_asset_id: "identifier",
} as const;
const hotspot_fields = {
  project_id: "identifier",
  interactive_demo_id: "identifier",
  demo_scene_id: "identifier",
  hotspot_type: "enum",
  label: "text",
  x: "decimal",
  y: "decimal",
  width: "decimal",
  height: "decimal",
  target_scene_id: "identifier",
  hotspot_index: "integer",
} as const;

const change = (
  entity_type: string,
  before: InteractiveDemo | DemoScene | DemoHotspot | null,
  after: InteractiveDemo | DemoScene | DemoHotspot | null,
  parent_entity_type: string | null,
  parent_entity_id: string | null,
): EntityAuditChange => {
  const row = after ?? before!;
  return {
    entity_type,
    entity_id: row.id,
    parent_entity_type,
    parent_entity_id,
    before: before ? { ...before } : null,
    after: after ? { ...after } : null,
    safe_fields:
      entity_type === "interactive_demo"
        ? demo_fields
        : entity_type === "demo_scene"
          ? scene_fields
          : hotspot_fields,
    redacted_fields: entity_type === "demo_hotspot" ? ["content"] : [],
  };
};

const event = (input: {
  event_id: string;
  occurred_at: string;
  actor: ActorInput;
  context: EventContext;
  root: InteractiveDemo;
  action: string;
  changes: EntityAuditChange[];
  before_version?: number | null;
  after_version?: number | null;
}) => build_entity_audit_event({
  id: input.event_id,
  organization_id: input.actor.organization_id,
  project_id: input.actor.project_id,
  root_resource_type: "interactive_demo",
  root_resource_id: input.root.id,
  action: input.action,
  actor_org_user_id: input.actor.actor_org_user_id,
  actor_label: input.context.actor_label,
  source_type: input.context.mutation.source_type,
  occurred_at: input.occurred_at,
  before_row_version: input.before_version ?? input.root.version,
  after_row_version: input.after_version ?? input.root.version,
  changes: input.changes,
});

const differs = (before: Record<string, unknown>, data: Record<string, unknown>) =>
  Object.entries(data).some(([key, value]) => JSON.stringify(before[key]) !== JSON.stringify(value));

export const build_audited_interactive_demo_repository = (pool: Pool): InteractiveDemoRepository => {
  const base = build_interactive_demo_repository(pool);
  const run = async <Result>(input: {
    command: Parameters<typeof find_audit_command>[0];
    actor: ActorInput;
    prepare?: (client: Client) => Promise<void>;
    execute: (repository: InteractiveDemoRepository) => Promise<Result>;
    build: (result: Result, context: EventContext, event_id: string, occurred_at: string) => ReturnType<typeof build_entity_audit_event>;
  }) => {
    const event_id = ulid();
    const occurred_at = new Date().toISOString();
    let context: EventContext | null = null;
    return run_audited_mutation({
      pool,
      event_id,
      command: find_audit_command(input.command),
      context: async (client) => {
        await input.prepare?.(client);
        context = await resolve_org_user_audit_context(client, input.actor);
        return context.mutation;
      },
      execute: (client) => input.execute(build_interactive_demo_repository(client)),
      build_event: (result) => input.build(result, context!, event_id, occurred_at),
      write_audit_event,
    });
  };
  const root = (repository: InteractiveDemoRepository, input: { organization_id: string; project_id: string; interactive_demo_id: string }) =>
    repository.find_demo(input);

  return {
    ...base,
    create_demo: (input) => run({
      command: "interactive_demo.create",
      actor: input,
      execute: (repository) => repository.create_demo(input),
      build: (after, context, event_id, occurred_at) => event({ event_id, occurred_at, actor: input, context, root: after, action: "interactive_demo.created", changes: [change("interactive_demo", null, after, "project", input.project_id)], before_version: null, after_version: after.version }),
    }),
    create_demo_from_capture: (input) => run({
      command: "interactive_demo.create_from_capture",
      actor: input,
      execute: (repository) => repository.create_demo_from_capture(input),
      build: (result, context, event_id, occurred_at) => event({ event_id, occurred_at, actor: input, context, root: result.interactive_demo, action: "interactive_demo.created", before_version: null, after_version: result.interactive_demo.version, changes: [change("interactive_demo", null, result.interactive_demo, "project", input.project_id), ...result.demo_scenes.map((row) => change("demo_scene", null, row, "interactive_demo", result.interactive_demo.id))] }),
    }),
    async update_demo(input) {
      let before: InteractiveDemo | null = null;
      return run({
        command: "interactive_demo.update", actor: input,
        prepare: async (client) => { await client.query("SELECT id FROM interactive_demo_schema.interactive_demo WHERE id=$1 AND organization_id=$2 AND project_id=$3 AND is_deleted=FALSE FOR UPDATE", [input.interactive_demo_id, input.organization_id, input.project_id]); before = await root(build_interactive_demo_repository(client), input); },
        execute: (repository) => before && differs({ ...before }, input.data) ? repository.update_demo(input) : Promise.resolve(before),
        build: (after, context, event_id, occurred_at) => before && after && after.version !== before.version ? event({ event_id, occurred_at, actor: input, context, root: after, action: "interactive_demo.updated", changes: [change("interactive_demo", before, after, "project", input.project_id)], before_version: before.version, after_version: after.version }) : null,
      });
    },
    async delete_demo(input) {
      let before: InteractiveDemo | null = null;
      return run({
        command: "interactive_demo.delete", actor: input,
        prepare: async (client) => { await client.query("SELECT id FROM interactive_demo_schema.interactive_demo WHERE id=$1 AND organization_id=$2 AND project_id=$3 AND is_deleted=FALSE FOR UPDATE", [input.interactive_demo_id, input.organization_id, input.project_id]); before = await root(build_interactive_demo_repository(client), input); },
        execute: (repository) => before ? repository.delete_demo(input) : Promise.resolve(false),
        build: (deleted, context, event_id, occurred_at) => deleted && before ? event({ event_id, occurred_at, actor: input, context, root: before, action: "interactive_demo.deleted", changes: [change("interactive_demo", before, null, "project", input.project_id)], before_version: before.version, after_version: before.version + 1 }) : null,
      });
    },
    create_scene: (input) => {
      let demo: InteractiveDemo | null = null;
      return run({ command: "interactive_demo.scene.create", actor: input,
        prepare: async (client) => { demo = await root(build_interactive_demo_repository(client), input); },
        execute: (repository) => repository.create_scene(input),
        build: (after, context, event_id, occurred_at) => event({ event_id, occurred_at, actor: input, context, root: demo!, action: "interactive_demo.scene.created", changes: [change("demo_scene", null, after, "interactive_demo", input.interactive_demo_id)] }),
      });
    },
    async update_scene(input) {
      let demo: InteractiveDemo | null = null; let before: DemoScene | null = null;
      return run({ command: "interactive_demo.scene.update", actor: input,
        prepare: async (client) => { const repository = build_interactive_demo_repository(client); await client.query("SELECT id FROM interactive_demo_schema.demo_scene WHERE id=$1 AND organization_id=$2 AND project_id=$3 AND interactive_demo_id=$4 AND is_deleted=FALSE FOR UPDATE", [input.demo_scene_id, input.organization_id, input.project_id, input.interactive_demo_id]); [demo, before] = await Promise.all([root(repository, input), repository.find_scene(input)]); },
        execute: (repository) => before && differs({ ...before }, input.data) ? repository.update_scene(input) : Promise.resolve(before),
        build: (after, context, event_id, occurred_at) => before && after && after.version !== before.version ? event({ event_id, occurred_at, actor: input, context, root: demo!, action: "interactive_demo.scene.updated", changes: [change("demo_scene", before, after, "interactive_demo", input.interactive_demo_id)] }) : null,
      });
    },
    async reorder_scenes(input) {
      let demo: InteractiveDemo | null = null; let before: DemoScene[] = [];
      return run({ command: "interactive_demo.scenes.reorder", actor: input,
        prepare: async (client) => { const repository = build_interactive_demo_repository(client); await client.query("SELECT id FROM interactive_demo_schema.demo_scene WHERE organization_id=$1 AND project_id=$2 AND interactive_demo_id=$3 AND is_deleted=FALSE FOR UPDATE", [input.organization_id, input.project_id, input.interactive_demo_id]); [demo, before] = await Promise.all([root(repository, input), repository.list_scenes(input)]); },
        execute: (repository) => before.every((row, index) => row.id === input.scene_ids[index]) ? Promise.resolve(before) : repository.reorder_scenes(input),
        build: (after, context, event_id, occurred_at) => { const prior = new Map(before.map((row) => [row.id, row])); const changes = after.filter((row) => prior.get(row.id)?.scene_index !== row.scene_index).map((row) => change("demo_scene", prior.get(row.id)!, row, "interactive_demo", input.interactive_demo_id)); return changes.length ? event({ event_id, occurred_at, actor: input, context, root: demo!, action: "interactive_demo.scenes.reordered", changes }) : null; },
      });
    },
    async delete_scene(input) {
      let demo: InteractiveDemo | null = null; let before: DemoScene | null = null;
      return run({ command: "interactive_demo.scene.delete", actor: input,
        prepare: async (client) => { const repository = build_interactive_demo_repository(client); await client.query("SELECT id FROM interactive_demo_schema.demo_scene WHERE id=$1 AND organization_id=$2 AND project_id=$3 AND interactive_demo_id=$4 AND is_deleted=FALSE FOR UPDATE", [input.demo_scene_id, input.organization_id, input.project_id, input.interactive_demo_id]); [demo, before] = await Promise.all([root(repository, input), repository.find_scene(input)]); },
        execute: (repository) => before ? repository.delete_scene(input) : Promise.resolve(false),
        build: (deleted, context, event_id, occurred_at) => deleted && before ? event({ event_id, occurred_at, actor: input, context, root: demo!, action: "interactive_demo.scene.deleted", changes: [change("demo_scene", before, null, "interactive_demo", input.interactive_demo_id)] }) : null,
      });
    },
    create_hotspot: (input) => { let demo: InteractiveDemo | null = null; return run({ command: "interactive_demo.hotspot.create", actor: input, prepare: async (client) => { demo = await root(build_interactive_demo_repository(client), input); }, execute: (repository) => repository.create_hotspot(input), build: (after, context, event_id, occurred_at) => event({ event_id, occurred_at, actor: input, context, root: demo!, action: "interactive_demo.hotspot.created", changes: [change("demo_hotspot", null, after, "demo_scene", input.demo_scene_id)] }) }); },
    async update_hotspot(input) {
      let demo: InteractiveDemo | null = null; let before: DemoHotspot | null = null;
      return run({ command: "interactive_demo.hotspot.update", actor: input, prepare: async (client) => { const repository = build_interactive_demo_repository(client); await client.query("SELECT id FROM interactive_demo_schema.demo_hotspot WHERE id=$1 AND organization_id=$2 AND project_id=$3 AND interactive_demo_id=$4 AND demo_scene_id=$5 AND is_deleted=FALSE FOR UPDATE", [input.demo_hotspot_id, input.organization_id, input.project_id, input.interactive_demo_id, input.demo_scene_id]); [demo, before] = await Promise.all([root(repository, input), repository.list_hotspots(input).then((rows) => rows.find((row) => row.id === input.demo_hotspot_id) ?? null)]); }, execute: (repository) => before && differs({ ...before }, input.data) ? repository.update_hotspot(input) : Promise.resolve(before), build: (after, context, event_id, occurred_at) => before && after && after.version !== before.version ? event({ event_id, occurred_at, actor: input, context, root: demo!, action: "interactive_demo.hotspot.updated", changes: [change("demo_hotspot", before, after, "demo_scene", input.demo_scene_id)] }) : null });
    },
    async reorder_hotspots(input) {
      let demo: InteractiveDemo | null = null; let before: DemoHotspot[] = [];
      return run({ command: "interactive_demo.hotspots.reorder", actor: input, prepare: async (client) => { const repository = build_interactive_demo_repository(client); await client.query("SELECT id FROM interactive_demo_schema.demo_hotspot WHERE organization_id=$1 AND project_id=$2 AND interactive_demo_id=$3 AND demo_scene_id=$4 AND is_deleted=FALSE FOR UPDATE", [input.organization_id, input.project_id, input.interactive_demo_id, input.demo_scene_id]); [demo, before] = await Promise.all([root(repository, input), repository.list_hotspots(input)]); }, execute: (repository) => before.every((row, index) => row.id === input.hotspot_ids[index]) ? Promise.resolve(before) : repository.reorder_hotspots(input), build: (after, context, event_id, occurred_at) => { const prior = new Map(before.map((row) => [row.id, row])); const changes = after.filter((row) => prior.get(row.id)?.hotspot_index !== row.hotspot_index).map((row) => change("demo_hotspot", prior.get(row.id)!, row, "demo_scene", input.demo_scene_id)); return changes.length ? event({ event_id, occurred_at, actor: input, context, root: demo!, action: "interactive_demo.hotspots.reordered", changes }) : null; } });
    },
    async delete_hotspot(input) {
      let demo: InteractiveDemo | null = null; let before: DemoHotspot | null = null;
      return run({ command: "interactive_demo.hotspot.delete", actor: input, prepare: async (client) => { const repository = build_interactive_demo_repository(client); await client.query("SELECT id FROM interactive_demo_schema.demo_hotspot WHERE id=$1 AND organization_id=$2 AND project_id=$3 AND interactive_demo_id=$4 AND demo_scene_id=$5 AND is_deleted=FALSE FOR UPDATE", [input.demo_hotspot_id, input.organization_id, input.project_id, input.interactive_demo_id, input.demo_scene_id]); [demo, before] = await Promise.all([root(repository, input), repository.list_hotspots(input).then((rows) => rows.find((row) => row.id === input.demo_hotspot_id) ?? null)]); }, execute: (repository) => before ? repository.delete_hotspot(input) : Promise.resolve(false), build: (deleted, context, event_id, occurred_at) => deleted && before ? event({ event_id, occurred_at, actor: input, context, root: demo!, action: "interactive_demo.hotspot.deleted", changes: [change("demo_hotspot", before, null, "demo_scene", input.demo_scene_id)] }) : null });
    },
  };
};
