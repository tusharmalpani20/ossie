import {
  create_row_change,
  create_scalar_change,
  validate_audit_event,
  type AuditChangeItem,
} from "@repo/audit-domain";
import { ulid } from "ulid";
import { safe_audit_actor_label } from "../audit/audit-request-context";

type SetupEventInput = {
  event_id: string;
  user: { id: string; email: string; display_name: string };
  organization: { id: string; name: string };
  org_user: {
    id: string;
    user_id: string;
    organization_id: string;
    role: "owner";
  };
  session: {
    id: string;
    user_id: string;
    organization_id: string;
    org_user_id: string;
  };
  occurred_at: string;
};

export const build_first_run_setup_event = (input: SetupEventInput) => {
  const item = (
    entity_type: string,
    entity_id: string,
    parent?: { type: string; id: string },
  ) => ({
    organization_id: input.organization.id,
    audit_event_id: input.event_id,
    entity_type,
    entity_id,
    parent_entity_type: parent?.type,
    parent_entity_id: parent?.id,
  });
  const redacted = (identity: ReturnType<typeof item>, field_name: string) =>
    create_scalar_change({
      id: ulid(),
      ...identity,
      operation: "create",
      field_name,
      value_type: "text",
      before: { state: "absent" },
      after: { state: "redacted" },
    });
  const user = item("user", input.user.id);
  const organization = item("organization", input.organization.id);
  const org_user = item("org_user", input.org_user.id, {
    type: "organization",
    id: input.organization.id,
  });
  const session = item("auth_session", input.session.id, {
    type: "org_user",
    id: input.org_user.id,
  });
  const items: AuditChangeItem[] = [
    create_row_change({ id: ulid(), ...organization, operation: "create" }),
    create_scalar_change({
      id: ulid(),
      ...organization,
      operation: "create",
      field_name: "name",
      value_type: "text",
      before: { state: "absent" },
      after: { state: "value", value: input.organization.name },
    }),
    create_row_change({ id: ulid(), ...user, operation: "create" }),
    redacted(user, "email"),
    redacted(user, "password_hash"),
    create_scalar_change({
      id: ulid(),
      ...user,
      operation: "create",
      field_name: "display_name",
      value_type: "text",
      before: { state: "absent" },
      after: { state: "value", value: input.user.display_name },
    }),
    create_row_change({ id: ulid(), ...org_user, operation: "create" }),
    create_scalar_change({
      id: ulid(),
      ...org_user,
      operation: "create",
      field_name: "user_id",
      value_type: "identifier",
      before: { state: "absent" },
      after: { state: "value", value: input.user.id },
    }),
    create_scalar_change({
      id: ulid(),
      ...org_user,
      operation: "create",
      field_name: "role",
      value_type: "enum",
      before: { state: "absent" },
      after: { state: "value", value: input.org_user.role },
    }),
    create_row_change({ id: ulid(), ...session, operation: "create" }),
    redacted(session, "token_hash"),
  ];
  return validate_audit_event({
    id: input.event_id,
    organization_id: input.organization.id,
    project_id: null,
    root_resource_type: "organization",
    root_resource_id: input.organization.id,
    action: "setup.owner_bootstrapped",
    source_type: "web",
    actor_type: "org_user",
    actor_org_user_id: input.org_user.id,
    actor_label: safe_audit_actor_label(input.user.display_name),
    request_id: null,
    correlation_id: null,
    idempotency_key_hash: null,
    before_row_version: null,
    after_row_version: 1,
    outcome: "committed",
    reason: null,
    occurred_at: input.occurred_at,
    items,
  });
};
