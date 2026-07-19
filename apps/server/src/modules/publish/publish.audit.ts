import { ulid } from "ulid";
import type { PublishedArtifact, PublishLink } from "@repo/types/publish";
import { find_audit_command } from "../audit/audit-coverage-registry";
import {
  build_entity_audit_event,
  resolve_org_user_audit_context,
  type EntityAuditChange,
} from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import {
  build_publish_repository,
  build_publish_transactional_repository,
} from "./publish.repository";
import type { ArtifactScope, PublishRepository } from "./publish.service";

type Pool = Parameters<typeof build_publish_repository>[0];
type Client = Parameters<
  Parameters<typeof run_audited_mutation>[0]["execute"]
>[0];
type State = {
  entity_type: string;
  id: string;
  version?: number;
  status?: string;
  last_used_at?: Date | null;
  revoked_at?: Date | null;
  name?: string;
  visibility?: string;
  expires_at?: Date | null;
  password_protected?: boolean;
  project_version_id?: string;
  published_artifact_id?: string;
  revision_id?: string;
  edition_id?: string;
  publication_sequence?: number;
  position?: number;
  is_default?: boolean;
};

export const build_publish_changes = (input: {
  before_link?: PublishLink | null;
  after_link?: PublishLink | null;
  published_artifact?: PublishedArtifact | null;
}): EntityAuditChange[] => {
  const changes: EntityAuditChange[] = [];
  if (input.published_artifact)
    changes.push({
      entity_type: "published_artifact",
      entity_id: input.published_artifact.id,
      parent_entity_type: input.published_artifact.artifact_type,
      parent_entity_id: input.published_artifact.artifact_id,
      before: null,
      after: input.published_artifact,
      safe_fields: {
        artifact_type: "enum",
        artifact_id: "identifier",
        edition_id: "identifier",
        project_version_id: "identifier",
        revision_id: "identifier",
        revision_number: "integer",
        publication_sequence: "integer",
        published_at: "timestamp",
        created_at: "timestamp",
      },
      redacted_fields: [],
    });
  if (JSON.stringify(input.before_link) !== JSON.stringify(input.after_link)) {
    const link = input.after_link ?? input.before_link;
    if (link)
      changes.push({
        entity_type: "publish_link",
        entity_id: link.id,
        parent_entity_type: link.artifact_type,
        parent_entity_id: link.artifact_id,
        before: input.before_link ?? null,
        after: input.after_link ?? null,
        safe_fields: {
          artifact_type: "enum",
          artifact_id: "identifier",
          name: "text",
          visibility: "enum",
          status: "enum",
          expires_at: "timestamp",
          password_protected: "boolean",
          version: "integer",
          created_at: "timestamp",
          updated_at: "timestamp",
          revoked_at: "timestamp",
        },
        redacted_fields: ["slug", "public_url", "default_public_url"],
      });
  }
  return changes;
};

const snapshot = async (client: Client, scope: ArtifactScope) => {
  const guide = scope.artifact_type === "guide",
    column = guide ? "guide_id" : "interactive_demo_id";
  const rows: State[] = [];
  const add = (
    entity_type: string,
    values: Array<Record<string, unknown> & { id: string }>,
  ) =>
    values.forEach((row) =>
      rows.push({
        entity_type,
        id: row.id,
        ...("version" in row ? { version: Number(row.version) } : {}),
        ...("status" in row ? { status: String(row.status) } : {}),
        ...("last_used_at" in row
          ? { last_used_at: row.last_used_at as Date | null }
          : {}),
        ...("revoked_at" in row
          ? { revoked_at: row.revoked_at as Date | null }
          : {}),
        ...("name" in row ? { name: String(row.name) } : {}),
        ...("visibility" in row ? { visibility: String(row.visibility) } : {}),
        ...("expires_at" in row
          ? { expires_at: row.expires_at as Date | null }
          : {}),
        ...("password_protected" in row
          ? { password_protected: Boolean(row.password_protected) }
          : {}),
        ...("project_version_id" in row
          ? { project_version_id: String(row.project_version_id) }
          : {}),
        ...("published_artifact_id" in row
          ? { published_artifact_id: String(row.published_artifact_id) }
          : {}),
        ...("revision_id" in row
          ? { revision_id: String(row.revision_id) }
          : {}),
        ...("edition_id" in row ? { edition_id: String(row.edition_id) } : {}),
        ...("publication_sequence" in row
          ? { publication_sequence: Number(row.publication_sequence) }
          : {}),
        ...("position" in row ? { position: Number(row.position) } : {}),
        ...("is_default" in row ? { is_default: Boolean(row.is_default) } : {}),
      }),
    );
  add(
    "published_artifact",
    (
      await client.query<{ id: string }>(
        `SELECT id,project_version_id,COALESCE(guide_edition_id,interactive_demo_edition_id) edition_id,COALESCE(guide_revision_id,interactive_demo_revision_id) revision_id,publication_sequence FROM publish_schema.published_artifact WHERE organization_id=$1 AND project_id=$2 AND artifact_type=$3 AND ${column}=$4`,
        [
          scope.auth.organization_id,
          scope.project_id,
          scope.artifact_type,
          scope.artifact_id,
        ],
      )
    ).rows,
  );
  const links = (
    await client.query<{ id: string; version: number; status: string }>(
      `SELECT id,version,status,name,visibility,expires_at,(password_hash IS NOT NULL) password_protected,revoked_at FROM publish_schema.publish_link WHERE organization_id=$1 AND project_id=$2 AND artifact_type=$3 AND ${column}=$4`,
      [
        scope.auth.organization_id,
        scope.project_id,
        scope.artifact_type,
        scope.artifact_id,
      ],
    )
  ).rows;
  add("publish_link", links);
  if (links.length) {
    const ids = links.map((row) => row.id);
    add(
      "publish_link_entry",
      (
        await client.query<{ id: string; version: number }>(
          `SELECT id,version,project_version_id,published_artifact_id,position,is_default FROM publish_schema.publish_link_entry WHERE publish_link_id=ANY($1::varchar[])`,
          [ids],
        )
      ).rows,
    );
    add(
      "public_publish_viewer_session",
      (
        await client.query<{
          id: string;
          last_used_at: Date | null;
          revoked_at: Date | null;
        }>(
          `SELECT id,last_used_at,revoked_at FROM publish_schema.public_publish_viewer_session WHERE publish_link_id=ANY($1::varchar[])`,
          [ids],
        )
      ).rows,
    );
  }
  const root = guide
      ? "guide_schema.guide_revision"
      : "interactive_demo_schema.interactive_demo_revision",
    root_artifact = guide ? "guide_id" : "interactive_demo_id",
    root_type = guide ? "guide_revision" : "interactive_demo_revision",
    root_id = guide ? "guide_revision_id" : "interactive_demo_revision_id";
  const revisions = (
    await client.query<{ id: string }>(
      `SELECT id FROM ${root} WHERE organization_id=$1 AND project_id=$2 AND ${root_artifact}=$3`,
      [scope.auth.organization_id, scope.project_id, scope.artifact_id],
    )
  ).rows;
  add(root_type, revisions);
  if (revisions.length) {
    const ids = revisions.map((row) => row.id);
    for (const [type, table] of guide
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
        ])
      add(
        type!,
        (
          await client.query<{ id: string }>(
            `SELECT id FROM ${table!} WHERE ${root_id}=ANY($1::varchar[])`,
            [ids],
          )
        ).rows,
      );
  }
  return new Map(rows.map((row) => [`${row.entity_type}:${row.id}`, row]));
};
const diff = (
  before: Map<string, State>,
  after: Map<string, State>,
  scope: ArtifactScope,
): EntityAuditChange[] => {
  const result: EntityAuditChange[] = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const prior = before.get(key) ?? null,
      next = after.get(key) ?? null;
    if (JSON.stringify(prior) === JSON.stringify(next)) continue;
    const row = next ?? prior!;
    result.push({
      entity_type: row.entity_type,
      entity_id: row.id,
      parent_entity_type: scope.artifact_type,
      parent_entity_id: scope.artifact_id,
      before: prior,
      after: next,
      safe_fields: {
        ...("version" in row ? { version: "integer" as const } : {}),
        ...("status" in row ? { status: "enum" as const } : {}),
        ...("last_used_at" in row
          ? { last_used_at: "timestamp" as const }
          : {}),
        ...("revoked_at" in row ? { revoked_at: "timestamp" as const } : {}),
        ...("name" in row ? { name: "text" as const } : {}),
        ...("visibility" in row ? { visibility: "enum" as const } : {}),
        ...("expires_at" in row ? { expires_at: "timestamp" as const } : {}),
        ...("password_protected" in row
          ? { password_protected: "boolean" as const }
          : {}),
        ...("project_version_id" in row
          ? { project_version_id: "identifier" as const }
          : {}),
        ...("published_artifact_id" in row
          ? { published_artifact_id: "identifier" as const }
          : {}),
        ...("revision_id" in row ? { revision_id: "identifier" as const } : {}),
        ...("edition_id" in row ? { edition_id: "identifier" as const } : {}),
        ...("publication_sequence" in row
          ? { publication_sequence: "integer" as const }
          : {}),
        ...("position" in row ? { position: "integer" as const } : {}),
        ...("is_default" in row ? { is_default: "boolean" as const } : {}),
      },
      redacted_fields: [],
    });
  }
  return result;
};
const command_for = (method: string, type: "guide" | "interactive_demo") => {
  const commands = {
    guide: {
      publish: { command: "publish.guide", action: "guide.published" },
      create_publish_link: {
        command: "publish.guide_link.create",
        action: "guide.publish_link.created",
      },
      update_publish_link: {
        command: "publish.guide_link.settings_update",
        action: "guide.publish_link.settings_updated",
      },
      replace_publish_link_manifest: {
        command: "publish.guide_link.manifest_update",
        action: "guide.publish_link.manifest_updated",
      },
      rollback_publish_link_entry: {
        command: "publish.guide_link.entry_rollback",
        action: "guide.publish_link.entry_rolled_back",
      },
      revoke_publish_link: {
        command: "publish.guide_link.revoke",
        action: "guide.publish_link.revoked",
      },
    },
    interactive_demo: {
      publish: {
        command: "publish.interactive_demo",
        action: "interactive_demo.published",
      },
      create_publish_link: {
        command: "publish.interactive_demo_link.create",
        action: "interactive_demo.publish_link.created",
      },
      update_publish_link: {
        command: "publish.interactive_demo_link.settings_update",
        action: "interactive_demo.publish_link.settings_updated",
      },
      replace_publish_link_manifest: {
        command: "publish.interactive_demo_link.manifest_update",
        action: "interactive_demo.publish_link.manifest_updated",
      },
      rollback_publish_link_entry: {
        command: "publish.interactive_demo_link.entry_rollback",
        action: "interactive_demo.publish_link.entry_rolled_back",
      },
      revoke_publish_link: {
        command: "publish.interactive_demo_link.revoke",
        action: "interactive_demo.publish_link.revoked",
      },
    },
  } as const;
  return commands[type][method as keyof (typeof commands)[typeof type]];
};

export const build_audited_publish_repository = (
  pool: Pool,
): PublishRepository => {
  const base = build_publish_repository(pool);
  const viewer_mutation = async <Result>(input: {
    command: "publish.viewer_session.create" | "publish.viewer_session.touch";
    publish_link_id: string;
    token_hash: string;
    execute: (repository: PublishRepository) => Promise<Result>;
  }) => {
    let scope: { organization_id: string; project_id: string } | null = null,
      before: State | null = null,
      after: State | null = null;
    const event_id = ulid(),
      occurred_at = new Date().toISOString(),
      coverage = find_audit_command(input.command);
    return run_audited_mutation({
      pool,
      event_id,
      command: coverage,
      context: async (client) => {
        scope =
          (
            await client.query<{ organization_id: string; project_id: string }>(
              `SELECT organization_id,project_id FROM publish_schema.publish_link WHERE id=$1`,
              [input.publish_link_id],
            )
          ).rows[0] ?? null;
        const row = (
          await client.query<{
            id: string;
            last_used_at: Date | null;
            revoked_at: Date | null;
          }>(
            `SELECT id,last_used_at,revoked_at FROM publish_schema.public_publish_viewer_session WHERE publish_link_id=$1 AND token_hash=$2`,
            [input.publish_link_id, input.token_hash],
          )
        ).rows[0];
        before = row
          ? { entity_type: "public_publish_viewer_session", ...row }
          : null;
        return {
          organization_id: scope!.organization_id,
          actor_type: "system" as const,
          source_type: "system" as const,
        };
      },
      execute: async (client) => {
        const repository = build_publish_transactional_repository(client);
        const result = await input.execute(repository);
        const row = (
          await client.query<{
            id: string;
            last_used_at: Date | null;
            revoked_at: Date | null;
          }>(
            `SELECT id,last_used_at,revoked_at FROM publish_schema.public_publish_viewer_session WHERE publish_link_id=$1 AND token_hash=$2`,
            [input.publish_link_id, input.token_hash],
          )
        ).rows[0];
        after = row
          ? { entity_type: "public_publish_viewer_session", ...row }
          : null;
        return result;
      },
      build_event: () =>
        build_entity_audit_event({
          id: event_id,
          organization_id: scope!.organization_id,
          project_id: scope!.project_id,
          root_resource_type: "publish_link",
          root_resource_id: input.publish_link_id,
          action: coverage.action,
          actor_org_user_id: null,
          actor_label: "Public viewer",
          actor_type: "system",
          source_type: "system",
          occurred_at,
          before_row_version: null,
          after_row_version: null,
          changes:
            before || after
              ? [
                  {
                    entity_type: "public_publish_viewer_session",
                    entity_id: (after ?? before)!.id,
                    parent_entity_type: "publish_link",
                    parent_entity_id: input.publish_link_id,
                    before,
                    after,
                    safe_fields: {
                      last_used_at: "timestamp",
                      revoked_at: "timestamp",
                    },
                    redacted_fields: [],
                  },
                ]
              : [],
        }),
      write_audit_event,
    });
  };
  return {
    ...base,
    async transaction(work) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const raw = build_publish_transactional_repository(client);
        let used = false;
        const tracked = { ...raw } as PublishRepository;
        for (const method of [
          "publish",
          "create_publish_link",
          "update_publish_link",
          "replace_publish_link_manifest",
          "rollback_publish_link_entry",
          "revoke_publish_link",
        ] as const) {
          (tracked[method] as unknown) = async (
            input: ArtifactScope & Record<string, unknown>,
          ) => {
            if (used)
              throw new Error(
                "Only one audited publish mutation is allowed per transaction",
              );
            used = true;
            const selected = command_for(method, input.artifact_type);
            const coverage = find_audit_command(selected.command);
            const event_id = ulid(),
              occurred_at = new Date().toISOString(),
              context = await resolve_org_user_audit_context(
                client,
                input.auth,
              );
            for (const [name, value] of [
              ["ossie.audit_event_id", event_id],
              ["ossie.audit_organization_id", input.auth.organization_id],
              ["ossie.audit_action", selected.action],
              ["ossie.audit_command", selected.command],
              ["ossie.audit_actor_type", "org_user"],
              ["ossie.audit_source_type", context.mutation.source_type],
            ])
              await client.query("SELECT set_config($1,$2,true)", [
                name,
                value,
              ]);
            const before = await snapshot(client, input);
            const output = await (
              raw[method] as (value: unknown) => Promise<unknown>
            ).call(raw, input);
            const after = await snapshot(client, input);
            const event = build_entity_audit_event({
              id: event_id,
              organization_id: input.auth.organization_id,
              project_id: input.project_id,
              root_resource_type: input.artifact_type,
              root_resource_id: input.artifact_id,
              action: coverage.action,
              actor_org_user_id: input.auth.actor_org_user_id,
              actor_label: context.actor_label,
              source_type: context.mutation.source_type,
              occurred_at,
              before_row_version: null,
              after_row_version: null,
              changes: diff(before, after, input),
            });
            if (event) await write_audit_event(client, event);
            return output;
          };
        }
        const result = await work(tracked);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {}
        throw error;
      } finally {
        client.release();
      }
    },
    create_public_viewer_session(input) {
      return viewer_mutation({
        command: "publish.viewer_session.create",
        publish_link_id: input.publish_link_id,
        token_hash: input.token_hash,
        execute: (repository) => repository.create_public_viewer_session(input),
      });
    },
    touch_public_viewer_session(input) {
      return viewer_mutation({
        command: "publish.viewer_session.touch",
        publish_link_id: input.publish_link_id,
        token_hash: input.token_hash,
        execute: (repository) => repository.touch_public_viewer_session(input),
      });
    },
  };
};
