import {
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditChangeItem,
} from "@repo/audit-domain";
import { ulid } from "ulid";
import { AuditDomainError } from "@repo/audit-domain";
import { find_audit_command } from "../audit/audit-coverage-registry";
import {
  current_audit_request_id,
  safe_audit_actor_label,
} from "../audit/audit-request-context";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import {
  build_organization_invites_transactional_repository,
  build_uncovered_organization_invites_repository,
} from "./organization-invites.repository";
import type { OrganizationInviteRepository } from "./organization-invites.service";

type InviteShape = {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
};
type Base = {
  event_id: string;
  invite: InviteShape;
  actor_org_user_id: string;
  actor_label: string;
  occurred_at: string;
};

const identity = (
  input: Base,
  entity_type: string,
  entity_id: string,
  parent = true,
) => ({
  organization_id: input.invite.organization_id,
  audit_event_id: input.event_id,
  entity_type,
  entity_id,
  ...(parent
    ? {
        parent_entity_type: "organization",
        parent_entity_id: input.invite.organization_id,
      }
    : {}),
});

const event = (input: Base, action: string, items: AuditChangeItem[]) =>
  validate_audit_event({
    id: input.event_id,
    organization_id: input.invite.organization_id,
    project_id: null,
    root_resource_type: "org_invite",
    root_resource_id: input.invite.id,
    action,
    source_type: "web",
    actor_type: "org_user",
    actor_org_user_id: input.actor_org_user_id,
    actor_label: input.actor_label,
    request_id: current_audit_request_id(),
    correlation_id: null,
    idempotency_key_hash: null,
    before_row_version: null,
    after_row_version: null,
    outcome: "committed",
    reason: null,
    occurred_at: input.occurred_at,
    items,
  });

export const build_invite_created_event = (input: Base) => {
  const base = identity(input, "org_invite", input.invite.id);
  const scalar = (
    field_name: string,
    value_type: "enum" | "timestamp",
    value: string,
  ) =>
    create_scalar_change({
      id: ulid(),
      ...base,
      operation: "create",
      field_name,
      value_type,
      before: { state: "absent" },
      after: { state: "value", value },
    });
  const redacted = (field_name: string) =>
    create_scalar_change({
      id: ulid(),
      ...base,
      operation: "create",
      field_name,
      value_type: "text",
      before: { state: "absent" },
      after: { state: "redacted" },
    });
  return event(input, "organization.invite.created", [
    create_row_change({ id: ulid(), ...base, operation: "create" }),
    redacted("email"),
    redacted("token_hash"),
    scalar("role", "enum", input.invite.role),
    scalar("status", "enum", input.invite.status),
    scalar("expires_at", "timestamp", input.invite.expires_at),
  ]);
};

export const build_invite_revoked_event = (input: Base) =>
  event(input, "organization.invite.revoked", [
    create_row_change({
      id: ulid(),
      ...identity(input, "org_invite", input.invite.id),
      operation: "delete",
    }),
  ]);

export const build_invite_accepted_event = (
  input: Base & {
    user: { id: string; created: boolean };
    org_user: { id: string; created: boolean };
    session_id: string;
  },
) => {
  const invite = identity(input, "org_invite", input.invite.id);
  const items: AuditChangeItem[] = [
    create_scalar_change({
      id: ulid(),
      ...invite,
      operation: "update",
      field_name: "status",
      value_type: "enum",
      before: { state: "value", value: "pending" },
      after: { state: "value", value: "accepted" },
    }),
  ];
  if (input.user.created) {
    items.push(
      create_row_change({
        id: ulid(),
        ...identity(input, "user", input.user.id, false),
        operation: "create",
      }),
    );
  }
  if (input.org_user.created) {
    items.push(
      create_row_change({
        id: ulid(),
        ...identity(input, "org_user", input.org_user.id),
        operation: "create",
      }),
    );
  }
  const session = {
    organization_id: input.invite.organization_id,
    audit_event_id: input.event_id,
    entity_type: "auth_session",
    entity_id: input.session_id,
    parent_entity_type: "org_user",
    parent_entity_id: input.org_user.id,
  };
  items.push(
    create_row_change({ id: ulid(), ...session, operation: "create" }),
    create_scalar_change({
      id: ulid(),
      ...session,
      operation: "create",
      field_name: "token_hash",
      value_type: "text",
      before: { state: "absent" },
      after: { state: "redacted" },
    }),
  );
  return event(input, "organization.invite.accepted", items);
};

type InvitePool = Parameters<
  typeof build_uncovered_organization_invites_repository
>[0];
type TransactionalRepository = ReturnType<
  typeof build_organization_invites_transactional_repository
>;

const client_pool = (
  client: Awaited<ReturnType<InvitePool["connect"]>>,
): InvitePool => ({
  ...client,
  connect: async () => client,
});

const actor_label = async (
  db: {
    query<Row = Record<string, unknown>>(
      sql: string,
      values?: unknown[],
    ): Promise<{ rows: Row[] }>;
  },
  org_user_id: string,
  organization_id: string,
) => {
  const result = await db.query<{ display_name: string }>(
    `
    SELECT app_user.display_name FROM organization_schema.org_user org_user
    JOIN user_schema.user app_user ON app_user.id = org_user.user_id
    WHERE org_user.id = $1 AND org_user.organization_id = $2
  `,
    [org_user_id, organization_id],
  );
  return safe_audit_actor_label(result.rows[0]?.display_name ?? "");
};

export const build_organization_invites_repository = (
  pool: InvitePool,
): OrganizationInviteRepository => {
  const base = build_uncovered_organization_invites_repository(pool);
  return {
    ...base,
    async create_invite(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let label = "organization-member";
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("organization.invite.create"),
        context: async (client) => {
          label = await actor_label(
            client,
            input.actor_org_user_id,
            input.organization_id,
          );
          return {
            organization_id: input.organization_id,
            actor_type: "org_user",
            source_type: "web",
          };
        },
        execute: (client) =>
          build_uncovered_organization_invites_repository(
            client_pool(client),
          ).create_invite(input),
        build_event: (invite) =>
          build_invite_created_event({
            event_id,
            invite,
            actor_org_user_id: input.actor_org_user_id,
            actor_label: label,
            occurred_at,
          }),
        write_audit_event,
      });
    },
    async revoke_invite(input) {
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      let label = "organization-member";
      return run_audited_mutation({
        pool,
        event_id,
        command: find_audit_command("organization.invite.revoke"),
        context: async (client) => {
          label = await actor_label(
            client,
            input.actor_org_user_id,
            input.organization_id,
          );
          return {
            organization_id: input.organization_id,
            actor_type: "org_user",
            source_type: "web",
          };
        },
        execute: (client) =>
          build_uncovered_organization_invites_repository(
            client_pool(client),
          ).revoke_invite(input),
        build_event: (invite) =>
          invite
            ? build_invite_revoked_event({
                event_id,
                invite,
                actor_org_user_id: input.actor_org_user_id,
                actor_label: label,
                occurred_at,
              })
            : null,
        write_audit_event,
      });
    },
    async transaction(callback) {
      const client = await pool.connect();
      const event_id = ulid();
      const occurred_at = new Date().toISOString();
      const state = {
        invite: null as Awaited<
          ReturnType<TransactionalRepository["find_invite_by_token_hash"]>
        >,
        user: null as Awaited<
          ReturnType<TransactionalRepository["find_user_by_email"]>
        >,
        org_user: null as Awaited<
          ReturnType<TransactionalRepository["find_org_user_by_user"]>
        >,
        session: null as Awaited<
          ReturnType<TransactionalRepository["create_session"]>
        > | null,
      };
      let user_created = false;
      let org_user_created = false;
      try {
        await client.query("BEGIN");
        const repository =
          build_organization_invites_transactional_repository(client);
        const tracked: TransactionalRepository = {
          ...repository,
          async find_invite_by_token_hash(token_hash) {
            state.invite =
              await repository.find_invite_by_token_hash(token_hash);
            if (state.invite) {
              for (const [name, value] of [
                ["ossie.audit_event_id", event_id],
                ["ossie.audit_organization_id", state.invite.organization_id],
                ["ossie.audit_action", "organization.invite.accepted"],
                ["ossie.audit_command", "organization.invite.accept"],
                ["ossie.audit_actor_type", "org_user"],
                ["ossie.audit_source_type", "web"],
              ])
                await client.query("SELECT set_config($1, $2, true)", [
                  name,
                  value,
                ]);
            }
            return state.invite;
          },
          async find_user_by_email(email) {
            state.user = await repository.find_user_by_email(email);
            return state.user;
          },
          async create_user(input) {
            state.user = await repository.create_user(input);
            user_created = true;
            return state.user;
          },
          async find_org_user_by_user(organization_id, user_id) {
            state.org_user = await repository.find_org_user_by_user(
              organization_id,
              user_id,
            );
            return state.org_user;
          },
          async create_org_user(input) {
            state.org_user = await repository.create_org_user(input);
            org_user_created = true;
            return state.org_user;
          },
          async create_session(input) {
            state.session = await repository.create_session(input);
            return state.session;
          },
        };
        const result = await callback(tracked);
        if (!state.invite || !state.user || !state.org_user || !state.session) {
          throw new AuditDomainError(
            "invalid_invite_acceptance_audit",
            "internal",
          );
        }
        const accepted_invite = state.invite;
        const accepted_user = state.user;
        const accepted_org_user = state.org_user;
        const accepted_session = state.session;
        await write_audit_event(
          client,
          build_invite_accepted_event({
            event_id,
            invite: accepted_invite,
            actor_org_user_id: accepted_org_user.id,
            actor_label: safe_audit_actor_label(accepted_user.display_name),
            occurred_at,
            user: { id: accepted_user.id, created: user_created },
            org_user: { id: accepted_org_user.id, created: org_user_created },
            session_id: accepted_session.id,
          }),
        );
        await client.query("COMMIT");
        return result;
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {
          /* preserve original */
        }
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23514" &&
          "constraint" in error &&
          typeof error.constraint === "string" &&
          error.constraint.startsWith("ossie_audit_guard_")
        )
          throw new AuditDomainError("audit_guard_failed", "internal");
        throw error;
      } finally {
        client.release();
      }
    },
  };
};
