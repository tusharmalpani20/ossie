import { ulid } from "ulid";
import {
  build_entity_audit_event,
  resolve_org_user_audit_context,
  type EntityAuditChange,
} from "../audit/entity-audit";
import { find_audit_command } from "../audit/audit-coverage-registry";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import {
  build_publish_repository,
  build_publish_transactional_repository,
} from "./publish.repository";
import type {
  InteractiveDemoPublishDetail,
  PublishedArtifact,
  PublishArtifactType,
  PublishLink,
  PublishRepository,
  PublishStatus,
} from "./publish.service";

type Pool = Parameters<typeof build_publish_repository>[0];
type Client = Parameters<Parameters<typeof run_audited_mutation>[0]["execute"]>[0];
type Actor = { organization_id: string; project_id: string; actor_org_user_id: string };
type ActorContext = Awaited<ReturnType<typeof resolve_org_user_audit_context>>;

const artifact_fields = { artifact_type: "enum", artifact_id: "identifier", version_number: "integer", title: "text", published_at: "timestamp" } as const;
const link_fields = { artifact_type: "enum", artifact_id: "identifier", published_artifact_id: "identifier", visibility: "enum", status: "enum", published_at: "timestamp", revoked_at: "timestamp", expires_at: "timestamp", password_protected: "boolean" } as const;

export const build_publish_changes = (input: {
  artifact_type: PublishArtifactType;
  artifact_id: string;
  before_link: PublishLink | null;
  after_link: PublishLink | null;
  published_artifact?: PublishedArtifact | null;
}): EntityAuditChange[] => {
  const changes: EntityAuditChange[] = [];
  if (input.published_artifact) {
    changes.push({
      entity_type: "published_artifact",
      entity_id: input.published_artifact.id,
      parent_entity_type: input.artifact_type,
      parent_entity_id: input.artifact_id,
      before: null,
      after: { ...input.published_artifact, snapshot_json: true },
      safe_fields: artifact_fields,
      redacted_fields: ["snapshot_json"],
    });
  }
  if (JSON.stringify(input.before_link) !== JSON.stringify(input.after_link)) {
    const row = input.after_link ?? input.before_link!;
    const clean = (value: PublishLink | null) => value ? { ...value, slug: true, public_url: undefined } : null;
    changes.push({
      entity_type: "publish_link",
      entity_id: row.id,
      parent_entity_type: input.artifact_type,
      parent_entity_id: input.artifact_id,
      before: clean(input.before_link),
      after: clean(input.after_link),
      safe_fields: link_fields,
      redacted_fields: ["slug"],
    });
  }
  return changes;
};

const publish_event = (input: {
  event_id: string; occurred_at: string; actor: Actor; context: ActorContext;
  artifact_type: PublishArtifactType; artifact_id: string; action: string;
  changes: EntityAuditChange[]; before_version: number | null; after_version: number | null;
}) => build_entity_audit_event({
  id: input.event_id,
  organization_id: input.actor.organization_id,
  project_id: input.actor.project_id,
  root_resource_type: input.artifact_type,
  root_resource_id: input.artifact_id,
  action: input.action,
  actor_org_user_id: input.actor.actor_org_user_id,
  actor_label: input.context.actor_label,
  source_type: input.context.mutation.source_type,
  occurred_at: input.occurred_at,
  before_row_version: input.before_version,
  after_row_version: input.after_version,
  changes: input.changes,
});

const password_change = (link: PublishLink): EntityAuditChange => ({
  entity_type: "publish_link",
  entity_id: link.id,
  parent_entity_type: link.artifact_type,
  parent_entity_id: link.artifact_id,
  before: { password_hash: "before", password_salt: "before" },
  after: { password_hash: "after", password_salt: "after" },
  redacted_fields: ["password_hash", "password_salt"],
});

const set_context = async (client: Client, values: { event_id: string; organization_id: string; action: string; command: string; actor_type: string; source_type: string }) => {
  for (const [name, value] of [
    ["ossie.audit_event_id", values.event_id],
    ["ossie.audit_organization_id", values.organization_id],
    ["ossie.audit_action", values.action],
    ["ossie.audit_command", values.command],
    ["ossie.audit_actor_type", values.actor_type],
    ["ossie.audit_source_type", values.source_type],
  ]) await client.query("SELECT set_config($1, $2, true)", [name, value]);
};

export const build_audited_publish_repository = (pool: Pool): PublishRepository => {
  const base = build_publish_repository(pool);
  const audited_transaction: PublishRepository["transaction"] = async (work) => {
    const client = await pool.connect();
    const event_id = ulid(); const occurred_at = new Date().toISOString();
    let artifact_type: PublishArtifactType | null = null; let artifact_id: string | null = null;
    let actor: Actor | null = null; let context: ActorContext | null = null;
    let root_version: number | null = null; let before_link: PublishLink | null = null;
    let after_link: PublishLink | null = null; let published_artifact: PublishedArtifact | null = null;
    try {
      await client.query("BEGIN");
      const raw = build_publish_transactional_repository(client);
      const tracked: PublishRepository = {
        ...raw,
        async find_guide_detail(input) { const result = await raw.find_guide_detail(input); if (result) root_version = result.guide.version; return result; },
        async find_interactive_demo_detail(input) { const result = await raw.find_interactive_demo_detail(input); if (result) root_version = result.interactive_demo.version; return result; },
        async find_active_publish_link(input) { const result = await raw.find_active_publish_link(input); before_link = result; return result; },
        async create_published_artifact(input) {
          artifact_type = input.artifact_type; artifact_id = input.artifact_id;
          actor = { organization_id: input.organization_id, project_id: input.project_id, actor_org_user_id: input.actor_org_user_id };
          context = await resolve_org_user_audit_context(client, actor);
          const command = artifact_type === "guide" ? "publish.guide" : "publish.interactive_demo";
          const action = artifact_type === "guide" ? "guide.published" : "interactive_demo.published";
          await set_context(client, { event_id, organization_id: input.organization_id, action, command, actor_type: "org_user", source_type: context.mutation.source_type });
          published_artifact = await raw.create_published_artifact(input);
          return published_artifact;
        },
        async create_publish_link(input) { after_link = await raw.create_publish_link(input); return after_link; },
        async update_publish_link_target(input) { after_link = await raw.update_publish_link_target(input); return after_link; },
      };
      const result = await work(tracked);
      if (artifact_type && artifact_id && actor && context && published_artifact && after_link) {
        const action = artifact_type === "guide" ? "guide.published" : "interactive_demo.published";
        const audit = publish_event({ event_id, occurred_at, actor, context, artifact_type, artifact_id, action, before_version: root_version, after_version: root_version, changes: build_publish_changes({ artifact_type, artifact_id, before_link, after_link, published_artifact }) });
        if (audit) await write_audit_event(client, audit);
      }
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* preserve the mutation error */ }
      throw error;
    } finally { client.release(); }
  };

  const run_actor = async <Result>(input: {
    command: Parameters<typeof find_audit_command>[0]; actor: Actor;
    prepare: (client: Client) => Promise<void>;
    execute: (repository: PublishRepository) => Promise<Result>;
    evidence: (result: Result, context: ActorContext, event_id: string, occurred_at: string) => ReturnType<typeof build_entity_audit_event>;
  }) => {
    const event_id = ulid(); const occurred_at = new Date().toISOString(); let context: ActorContext | null = null;
    return run_audited_mutation({ pool, event_id, command: find_audit_command(input.command), context: async (client) => { await input.prepare(client); context = await resolve_org_user_audit_context(client, input.actor); return context.mutation; }, execute: (client) => input.execute(build_publish_transactional_repository(client)), build_event: (result) => input.evidence(result, context!, event_id, occurred_at), write_audit_event });
  };

  const active = (repository: PublishRepository, input: { organization_id: string; project_id: string; artifact_type: PublishArtifactType; artifact_id: string }) => repository.find_publish_status(input);
  const viewer_rows = (client: Client, publish_link_id: string) => client.query<{ id: string; expires_at: Date; last_used_at: Date | null; revoked_at: Date | null }>("SELECT id, expires_at, last_used_at, revoked_at FROM publish_schema.public_publish_viewer_session WHERE publish_link_id=$1 AND revoked_at IS NULL FOR UPDATE", [publish_link_id]);

  return {
    ...base,
    transaction: audited_transaction,
    async revoke_active_publish_link(input) {
      let before: PublishStatus | null = null; let viewers: Awaited<ReturnType<typeof viewer_rows>>["rows"] = [];
      return run_actor({ command: input.artifact_type === "guide" ? "publish.guide_link.revoke" : "publish.interactive_demo_link.revoke", actor: input,
        prepare: async (client) => { await client.query("SELECT id FROM publish_schema.publish_link WHERE organization_id=$1 AND project_id=$2 AND artifact_type=$3 AND artifact_id=$4 AND status='active' FOR UPDATE", [input.organization_id, input.project_id, input.artifact_type, input.artifact_id]); const repository = build_publish_transactional_repository(client); before = await active(repository, input); if (before?.publish_link) viewers = (await viewer_rows(client, before.publish_link.id)).rows; },
        execute: async (repository) => { if (!before?.publish_link) return null; const link = await repository.revoke_active_publish_link(input); await repository.revoke_public_viewer_sessions_for_publish_link({ publish_link_id: before.publish_link.id }); return link; },
        evidence: (link, context, event_id, occurred_at) => link && before?.publish_link ? publish_event({ event_id, occurred_at, actor: input, context, artifact_type: input.artifact_type, artifact_id: input.artifact_id, action: input.artifact_type === "guide" ? "guide.publish_link.revoked" : "interactive_demo.publish_link.revoked", before_version: null, after_version: null, changes: [...build_publish_changes({ artifact_type: input.artifact_type, artifact_id: input.artifact_id, before_link: before.publish_link, after_link: null }), ...viewers.map((row) => ({ entity_type: "public_publish_viewer_session", entity_id: row.id, parent_entity_type: "publish_link", parent_entity_id: before!.publish_link!.id, before: { expires_at: row.expires_at.toISOString() }, after: null, safe_fields: { expires_at: "timestamp" } as const }))] }) : null,
      });
    },
    async update_publish_link_access(input) {
      let before: PublishStatus | null = null;
      return run_actor({ command: input.artifact_type === "guide" ? "publish.guide_link.access_update" : "publish.interactive_demo_link.access_update", actor: input,
        prepare: async (client) => { await client.query("SELECT id FROM publish_schema.publish_link WHERE organization_id=$1 AND project_id=$2 AND artifact_type=$3 AND artifact_id=$4 AND status='active' FOR UPDATE", [input.organization_id, input.project_id, input.artifact_type, input.artifact_id]); before = await active(build_publish_transactional_repository(client), input); },
        execute: (repository) => before?.publish_link && (before.publish_link.visibility !== input.visibility || before.publish_link.expires_at !== input.expires_at) ? repository.update_publish_link_access(input) : Promise.resolve(before),
        evidence: (after, context, event_id, occurred_at) => before?.publish_link && after?.publish_link && JSON.stringify(before.publish_link) !== JSON.stringify(after.publish_link) ? publish_event({ event_id, occurred_at, actor: input, context, artifact_type: input.artifact_type, artifact_id: input.artifact_id, action: input.artifact_type === "guide" ? "guide.publish_link.access_updated" : "interactive_demo.publish_link.access_updated", before_version: null, after_version: null, changes: build_publish_changes({ artifact_type: input.artifact_type, artifact_id: input.artifact_id, before_link: before.publish_link, after_link: after.publish_link }) }) : null,
      });
    },
    async update_publish_link_password(input) {
      let before: PublishStatus | null = null; let viewers: Awaited<ReturnType<typeof viewer_rows>>["rows"] = [];
      return run_actor({ command: input.artifact_type === "guide" ? "publish.guide_link.password_update" : "publish.interactive_demo_link.password_update", actor: input,
        prepare: async (client) => { await client.query("SELECT id FROM publish_schema.publish_link WHERE organization_id=$1 AND project_id=$2 AND artifact_type=$3 AND artifact_id=$4 AND status='active' FOR UPDATE", [input.organization_id, input.project_id, input.artifact_type, input.artifact_id]); before = await active(build_publish_transactional_repository(client), input); if (before?.publish_link) viewers = (await viewer_rows(client, before.publish_link.id)).rows; },
        execute: async (repository) => { if (!before?.publish_link || (!before.publish_link.password_protected && input.password_hash === null)) return before; const result = await repository.update_publish_link_password(input); await repository.revoke_public_viewer_sessions_for_publish_link({ publish_link_id: before.publish_link.id }); return result; },
        evidence: (after, context, event_id, occurred_at) => before?.publish_link && after?.publish_link && (before.publish_link.password_protected !== after.publish_link.password_protected || input.password_hash !== null) ? publish_event({ event_id, occurred_at, actor: input, context, artifact_type: input.artifact_type, artifact_id: input.artifact_id, action: input.artifact_type === "guide" ? "guide.publish_link.password_updated" : "interactive_demo.publish_link.password_updated", before_version: null, after_version: null, changes: [...build_publish_changes({ artifact_type: input.artifact_type, artifact_id: input.artifact_id, before_link: before.publish_link, after_link: after.publish_link }), password_change(after.publish_link), ...viewers.map((row) => ({ entity_type: "public_publish_viewer_session", entity_id: row.id, parent_entity_type: "publish_link", parent_entity_id: before!.publish_link!.id, before: { expires_at: row.expires_at.toISOString() }, after: null, safe_fields: { expires_at: "timestamp" } as const }))] }) : null,
      });
    },
    async create_public_viewer_session(input) {
      const event_id = ulid(); const occurred_at = new Date().toISOString(); let owner: { organization_id: string; project_id: string; artifact_type: PublishArtifactType; artifact_id: string } | null = null; let viewer_id: string | null = null;
      return run_audited_mutation({ pool, event_id, command: find_audit_command("publish.viewer_session.create"), context: async (client) => { const result = await client.query<NonNullable<typeof owner>>("SELECT organization_id, project_id, artifact_type, artifact_id FROM publish_schema.publish_link WHERE id=$1 AND status='active'", [input.publish_link_id]); owner = result.rows[0] ?? null; return { organization_id: owner!.organization_id, actor_type: "system", source_type: "system" }; }, execute: async (client) => { const result = await build_publish_transactional_repository(client).create_public_viewer_session(input); const row = await client.query<{ id: string }>("SELECT id FROM publish_schema.public_publish_viewer_session WHERE token_hash=$1", [input.token_hash]); viewer_id = row.rows[0]!.id; return result; }, build_event: () => build_entity_audit_event({ id: event_id, organization_id: owner!.organization_id, project_id: owner!.project_id, root_resource_type: "publish_link", root_resource_id: input.publish_link_id, action: "publish.viewer_session.created", actor_type: "system", actor_org_user_id: null, actor_label: "public-viewer-session", source_type: "system", occurred_at, before_row_version: null, after_row_version: null, changes: [{ entity_type: "public_publish_viewer_session", entity_id: viewer_id!, parent_entity_type: "publish_link", parent_entity_id: input.publish_link_id, before: null, after: { expires_at: input.expires_at, token_hash: true }, safe_fields: { expires_at: "timestamp" }, redacted_fields: ["token_hash"] }] }), write_audit_event });
    },
    async touch_public_viewer_session(input) {
      const event_id = ulid(); const occurred_at = new Date().toISOString(); let row: { id: string; organization_id: string; project_id: string; publish_link_id: string; last_used_at: Date | null } | null = null; let after: Date | null = null;
      await run_audited_mutation({ pool, event_id, command: find_audit_command("publish.viewer_session.touch"), context: async (client) => { const result = await client.query<NonNullable<typeof row>>("SELECT viewer.id, link.organization_id, link.project_id, viewer.publish_link_id, viewer.last_used_at FROM publish_schema.public_publish_viewer_session viewer JOIN publish_schema.publish_link link ON link.id=viewer.publish_link_id WHERE viewer.token_hash=$1 FOR UPDATE", [input.token_hash]); row = result.rows[0] ?? null; return { organization_id: row!.organization_id, actor_type: "system", source_type: "system" }; }, execute: async (client) => { await build_publish_transactional_repository(client).touch_public_viewer_session(input); const result = await client.query<{ last_used_at: Date }>("SELECT last_used_at FROM publish_schema.public_publish_viewer_session WHERE id=$1", [row!.id]); after = result.rows[0]!.last_used_at; }, build_event: () => row && after ? build_entity_audit_event({ id: event_id, organization_id: row.organization_id, project_id: row.project_id, root_resource_type: "publish_link", root_resource_id: row.publish_link_id, action: "publish.viewer_session.activity_recorded", actor_type: "system", actor_org_user_id: null, actor_label: "public-viewer-session", source_type: "system", occurred_at, before_row_version: null, after_row_version: null, changes: [{ entity_type: "public_publish_viewer_session", entity_id: row.id, parent_entity_type: "publish_link", parent_entity_id: row.publish_link_id, before: { last_used_at: row.last_used_at?.toISOString() ?? null }, after: { last_used_at: after.toISOString() }, safe_fields: { last_used_at: "timestamp" } }] }) : null, write_audit_event });
    },
  };
};
