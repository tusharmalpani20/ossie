import {
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditEvent,
  type AuditSourceType,
} from "@repo/audit-domain";
import { ulid } from "ulid";
import { find_audit_command } from "../audit/audit-coverage-registry";
import { safe_audit_actor_label } from "../audit/audit-request-context";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_authentication_session_client_repository } from "./session.repository";
import type {
  AuthContext,
  AuthenticationSessionRepository,
} from "./session.service";

type BaseInput = {
  event_id: string;
  organization_id: string;
  org_user_id: string;
  actor_label: string;
  session_id: string;
  occurred_at: string;
  source_type: AuditSourceType;
};

const event = (
  input: BaseInput,
  action: string,
  items: AuditEvent["items"],
): AuditEvent =>
  validate_audit_event({
    id: input.event_id,
    organization_id: input.organization_id,
    project_id: null,
    root_resource_type: "auth_session",
    root_resource_id: input.session_id,
    action,
    source_type: input.source_type,
    actor_type: "org_user",
    actor_org_user_id: input.org_user_id,
    actor_label: input.actor_label,
    request_id: null,
    correlation_id: null,
    idempotency_key_hash: null,
    before_row_version: null,
    after_row_version: null,
    outcome: "committed",
    reason: null,
    occurred_at: input.occurred_at,
    items,
  });

const identity = (input: BaseInput) => ({
  organization_id: input.organization_id,
  audit_event_id: input.event_id,
  entity_type: "auth_session",
  entity_id: input.session_id,
  parent_entity_type: "org_user",
  parent_entity_id: input.org_user_id,
});

export const build_session_created_event = (
  input: BaseInput & { user_id: string; expires_at: string },
) => {
  const base = identity(input);
  return event(input, "authentication.session.created", [
    create_row_change({ id: ulid(), ...base, operation: "create" }),
    ...(
      [
        ["user_id", "identifier", input.user_id],
        ["org_user_id", "identifier", input.org_user_id],
        ["expires_at", "timestamp", input.expires_at],
        ["session_type", "enum", "web"],
      ] as const
    ).map(([field_name, value_type, value]) =>
      create_scalar_change({
        id: ulid(),
        ...base,
        operation: "create",
        field_name,
        value_type,
        before: { state: "absent" },
        after: { state: "value", value },
      }),
    ),
    create_scalar_change({
      id: ulid(),
      ...base,
      operation: "create",
      field_name: "token_hash",
      value_type: "text",
      before: { state: "absent" },
      after: { state: "redacted" },
    }),
  ]);
};

export const build_session_touched_event = (
  input: BaseInput & { before: string; after: string },
) =>
  event(input, "authentication.session.activity_recorded", [
    create_scalar_change({
      id: ulid(),
      ...identity(input),
      operation: "update",
      field_name: "last_active_at",
      value_type: "timestamp",
      before: { state: "value", value: input.before },
      after: { state: "value", value: input.after },
    }),
  ]);

export const build_session_revoked_event = (input: BaseInput) =>
  event(input, "authentication.session.revoked", [
    create_row_change({
      id: ulid(),
      ...identity(input),
      operation: "delete",
    }),
  ]);

type QueryResult<Row> = { rows: Row[] };
type AuditPool = {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>;
  connect(): Promise<{
    query<Row = Record<string, unknown>>(
      sql: string,
      values?: unknown[],
    ): Promise<QueryResult<Row>>;
    release(): void;
  }>;
};

type ActorRow = {
  organization_id: string;
  org_user_id: string;
  display_name: string;
  session_id: string;
};

const find_actor_by_session = async (
  db: Pick<AuditPool, "query">,
  where: "token_hash" | "id",
  value: string,
) => {
  const result = await db.query<ActorRow>(
    `
    SELECT auth_session.id AS session_id, auth_session.organization_id,
      auth_session.org_user_id, app_user.display_name
    FROM auth_schema.auth_session auth_session
    JOIN user_schema.user app_user ON app_user.id = auth_session.user_id
    WHERE auth_session.${where} = $1
    LIMIT 1
  `,
    [value],
  );
  return result.rows[0] ?? null;
};

export const build_authentication_session_repository = (
  pool: AuditPool,
): AuthenticationSessionRepository => {
  const base = build_authentication_session_client_repository(pool);
  return {
    async find_and_touch_auth_context_by_token_hash(token_hash) {
      const preliminary = await find_actor_by_session(
        pool,
        "token_hash",
        token_hash,
      );
      if (!preliminary) return null;
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let auth_context: AuthContext | null = null;
      let before = occurred_at;
      let after = occurred_at;
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("authentication.session.touch"),
        context: async (client) => {
          auth_context =
            await build_authentication_session_client_repository(
              client,
            ).find_auth_context_by_token_hash(token_hash);
          if (!auth_context)
            throw new Error("authentication_session_disappeared");
          const current = await client.query<{ last_active_at: Date }>(
            `
            SELECT last_active_at FROM auth_schema.auth_session WHERE id = $1
          `,
            [auth_context.session.id],
          );
          before = current.rows[0]?.last_active_at.toISOString() ?? occurred_at;
          return {
            organization_id: auth_context.organization.id,
            actor_type: "org_user",
            source_type: "web",
          };
        },
        execute: async (client) => {
          const updated = await client.query<{ last_active_at: Date }>(
            `
            UPDATE auth_schema.auth_session
            SET last_active_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 RETURNING last_active_at
          `,
            [auth_context!.session.id],
          );
          after = updated.rows[0]?.last_active_at.toISOString() ?? occurred_at;
          return auth_context;
        },
        build_event: (result) =>
          result
            ? build_session_touched_event({
                event_id,
                organization_id: result.organization.id,
                org_user_id: result.org_user.id,
                actor_label: safe_audit_actor_label(result.user.display_name),
                session_id: result.session.id,
                occurred_at,
                source_type: "web",
                before,
                after,
              })
            : null,
        write_audit_event,
      });
    },
    find_login_identity_by_email: base.find_login_identity_by_email,
    async create_session(input) {
      const actor = await pool.query<{ display_name: string }>(
        `
        SELECT app_user.display_name FROM organization_schema.org_user org_user
        JOIN user_schema.user app_user ON app_user.id = org_user.user_id
        WHERE org_user.id = $1 AND org_user.organization_id = $2
      `,
        [input.org_user_id, input.organization_id],
      );
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("authentication.session.create"),
        context: {
          organization_id: input.organization_id,
          actor_type: "org_user",
          source_type: "web",
        },
        execute: (client) =>
          build_authentication_session_client_repository(client).create_session(
            input,
          ),
        build_event: (session) =>
          build_session_created_event({
            event_id,
            organization_id: input.organization_id,
            org_user_id: input.org_user_id,
            actor_label: safe_audit_actor_label(
              actor.rows[0]?.display_name ?? "",
            ),
            session_id: session.id,
            occurred_at,
            source_type: "web",
            user_id: input.user_id,
            expires_at: session.expires_at,
          }),
        write_audit_event,
      });
    },
    async revoke_session_by_token_hash(token_hash) {
      const actor = await find_actor_by_session(pool, "token_hash", token_hash);
      if (!actor) return;
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      await run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("authentication.session.revoke"),
        context: {
          organization_id: actor.organization_id,
          actor_type: "org_user",
          source_type: "web",
        },
        execute: async (client) => {
          const result = await client.query<{ id: string }>(
            `
            UPDATE auth_schema.auth_session
            SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE token_hash = $1 AND status = 'active' AND revoked_at IS NULL
            RETURNING id
          `,
            [token_hash],
          );
          return result.rows[0] ?? null;
        },
        build_event: (session) =>
          session
            ? build_session_revoked_event({
                event_id,
                organization_id: actor.organization_id,
                org_user_id: actor.org_user_id,
                actor_label: safe_audit_actor_label(actor.display_name),
                session_id: session.id,
                occurred_at,
                source_type: "web",
              })
            : null,
        write_audit_event,
      });
    },
  };
};
