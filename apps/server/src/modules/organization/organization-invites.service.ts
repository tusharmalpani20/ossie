import { createHash, randomBytes } from "node:crypto";
import type {
  OrganizationInvite,
  OrganizationMember,
} from "@repo/types/organization";
import type {
  OrganizationInviteStatus,
  OrganizationRole,
} from "@repo/constants";
import { Password } from "../../common/services/password.common.service";
import {
  generate_session_token,
  hash_session_token,
  type AuthContext,
} from "../authentication/session.service";

export type OrgMemberRole = OrganizationRole;
export type OrgInviteStatus = OrganizationInviteStatus;
export type OrgMember = OrganizationMember;
export type OrgInvite = OrganizationInvite;

type StoredOrgInvite = OrgInvite & {
  token_hash: string;
  organization_name?: string;
};

export type OrganizationInviteAuth = {
  organization_id: string;
  actor_org_user_id: string;
  actor_role: string;
};

type InviteUser = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
};

type InviteSession = AuthContext["session"];

type OrganizationInviteTransactionalRepository = {
  find_invite_by_token_hash: (token_hash: string) => Promise<StoredOrgInvite | null>;
  find_user_by_email: (email: string) => Promise<InviteUser | null>;
  find_org_user_by_user: (organization_id: string, user_id: string) => Promise<OrgMember | null>;
  create_user: (input: {
    email: string;
    password_hash: string;
    display_name: string;
  }) => Promise<InviteUser>;
  create_org_user: (input: {
    organization_id: string;
    user_id: string;
    email: string;
    display_name: string;
    role: OrgMemberRole;
  }) => Promise<OrgMember>;
  create_session: (input: {
    user_id: string;
    organization_id: string;
    org_user_id: string;
    token_hash: string;
  }) => Promise<InviteSession>;
  mark_invite_accepted: (input: {
    invite_id: string;
    user_id: string;
    org_user_id: string;
  }) => Promise<OrgInvite>;
};

export type OrganizationInviteRepository = OrganizationInviteTransactionalRepository & {
  list_members: (organization_id: string) => Promise<OrgMember[]>;
  list_invites: (organization_id: string) => Promise<OrgInvite[]>;
  find_active_invite_by_email: (organization_id: string, email: string) => Promise<OrgInvite | null>;
  create_invite: (input: {
    organization_id: string;
    email: string;
    role: OrgMemberRole;
    token_hash: string;
    expires_at: string;
    actor_org_user_id: string;
  }) => Promise<OrgInvite>;
  revoke_invite: (input: {
    organization_id: string;
    invite_id: string;
    actor_org_user_id: string;
  }) => Promise<OrgInvite | null>;
  transaction: <Result>(
    callback: (repository: OrganizationInviteTransactionalRepository) => Promise<Result>
  ) => Promise<Result>;
};

export class InvitePermissionError extends Error {
  constructor() {
    super("Only organization owners can manage invites");
  }
}

export class DuplicateActiveInviteError extends Error {
  constructor() {
    super("An active invite already exists for this email");
  }
}

export class InviteNotFoundError extends Error {
  constructor() {
    super("Invite was not found");
  }
}

export class AcceptedInviteError extends Error {
  constructor() {
    super("Invite has already been accepted");
  }
}

export class RevokedInviteError extends Error {
  constructor() {
    super("Invite has been revoked");
  }
}

export class ExpiredInviteError extends Error {
  constructor() {
    super("Invite has expired");
  }
}

export class ExistingUserLoginRequiredError extends Error {
  constructor() {
    super("Existing user must be signed in to accept this invite");
  }
}

export class InviteEmailMismatchError extends Error {
  constructor() {
    super("Signed-in user does not match invite email");
  }
}

const normalize_email = (email: string) => email.trim().toLowerCase();

export const hash_invite_token = (token: string) => (
  createHash("sha256").update(token).digest("hex")
);

const generate_invite_token = () => randomBytes(32).toString("base64url");

const default_now = () => new Date();

const invite_expires_at = (now: Date) => (
  new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString()
);

const assert_owner = (auth: OrganizationInviteAuth) => {
  if (auth.actor_role !== "owner") {
    throw new InvitePermissionError();
  }
};

const public_invite_status_guard = (invite: OrgInvite, now: Date) => {
  if (invite.status === "accepted") {
    throw new AcceptedInviteError();
  }
  if (invite.status === "revoked") {
    throw new RevokedInviteError();
  }
  if (invite.status === "expired" || new Date(invite.expires_at).getTime() <= now.getTime()) {
    throw new ExpiredInviteError();
  }
};

const display_name_from_email = (email: string) => email;

const public_org_invite = (invite: OrgInvite): OrgInvite => ({
  id: invite.id,
  organization_id: invite.organization_id,
  email: invite.email,
  role: invite.role,
  status: invite.status,
  expires_at: invite.expires_at,
  accepted_at: invite.accepted_at,
  accepted_user_id: invite.accepted_user_id,
  created_by_id: invite.created_by_id,
  updated_by_id: invite.updated_by_id,
  created_at: invite.created_at,
  updated_at: invite.updated_at,
});

export const build_organization_invites_service = (
  repository: OrganizationInviteRepository,
  options: {
    generate_token?: () => string;
    generate_session_token?: () => string;
    now?: () => Date;
    on_public_invite_resolved?: (context: {
      organization_id: string;
      invite_id: string;
      status: OrgInviteStatus;
    }) => void;
  } = {}
) => {
  const generate_token = options.generate_token ?? generate_invite_token;
  const generate_auth_session_token = options.generate_session_token ?? generate_session_token;
  const now = options.now ?? default_now;
  const report_public_context = (invite: StoredOrgInvite) =>
    options.on_public_invite_resolved?.({
      organization_id: invite.organization_id,
      invite_id: invite.id,
      status: invite.status,
    });

  const list_members = async (input: { auth: OrganizationInviteAuth }) => {
    assert_owner(input.auth);
    return {
      members: await repository.list_members(input.auth.organization_id),
    };
  };

  const list_invites = async (input: { auth: OrganizationInviteAuth }) => {
    assert_owner(input.auth);
    return {
      invites: (await repository.list_invites(input.auth.organization_id)).map(public_org_invite),
    };
  };

  const create_invite = async (input: {
    auth: OrganizationInviteAuth;
    data: {
      email: string;
      role?: OrgMemberRole;
    };
  }) => {
    assert_owner(input.auth);
    const email = normalize_email(input.data.email);
    const role = input.data.role ?? "member";

    if (await repository.find_active_invite_by_email(input.auth.organization_id, email)) {
      throw new DuplicateActiveInviteError();
    }

    const invite_token = generate_token();
    const invite = await repository.create_invite({
      organization_id: input.auth.organization_id,
      email,
      role,
      token_hash: hash_invite_token(invite_token),
      expires_at: invite_expires_at(now()),
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    return {
      invite: public_org_invite(invite),
      invite_token,
    };
  };

  const revoke_invite = async (input: {
    auth: OrganizationInviteAuth;
    invite_id: string;
  }) => {
    assert_owner(input.auth);
    const invite = await repository.revoke_invite({
      organization_id: input.auth.organization_id,
      invite_id: input.invite_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!invite) {
      throw new InviteNotFoundError();
    }

    return { invite: public_org_invite(invite) };
  };

  const get_public_invite = async (input: { token: string }) => {
    const invite = await repository.find_invite_by_token_hash(hash_invite_token(input.token));
    if (!invite) {
      throw new InviteNotFoundError();
    }
    report_public_context(invite);
    public_invite_status_guard(invite, now());
    const existing_user = await repository.find_user_by_email(invite.email);

    return {
      invite: {
        id: invite.id,
        organization_name: invite.organization_name ?? "Organization",
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expires_at: invite.expires_at,
        requires_login: Boolean(existing_user),
      },
    };
  };

  const accept_invite = async (input: {
    token: string;
    password?: string;
    display_name?: string | null;
    signed_in_user?: {
      id: string;
      email: string;
    } | null;
  }) => {
    return repository.transaction(async (transaction_repository) => {
      const invite = await transaction_repository.find_invite_by_token_hash(hash_invite_token(input.token));
      if (!invite) {
        throw new InviteNotFoundError();
      }
      report_public_context(invite);
      public_invite_status_guard(invite, now());

      const existing_user = await transaction_repository.find_user_by_email(invite.email);
      if (existing_user && !input.signed_in_user) {
        throw new ExistingUserLoginRequiredError();
      }
      if (existing_user && normalize_email(input.signed_in_user?.email ?? "") !== invite.email) {
        throw new InviteEmailMismatchError();
      }

      const user = existing_user ?? await transaction_repository.create_user({
        email: invite.email,
        password_hash: await Password.to_hash(input.password ?? ""),
        display_name: input.display_name?.trim() || display_name_from_email(invite.email),
      });
      const existing_org_user = await transaction_repository.find_org_user_by_user(invite.organization_id, user.id);
      const org_user = existing_org_user ?? await transaction_repository.create_org_user({
        organization_id: invite.organization_id,
        user_id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: invite.role,
      });
      const session_token = generate_auth_session_token();
      const session = await transaction_repository.create_session({
        user_id: user.id,
        organization_id: invite.organization_id,
        org_user_id: org_user.id,
        token_hash: hash_session_token(session_token),
      });
      await transaction_repository.mark_invite_accepted({
        invite_id: invite.id,
        user_id: user.id,
        org_user_id: org_user.id,
      });

      return {
        session_token,
        auth: {
          user: {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
          },
          organization: {
            id: invite.organization_id,
            name: invite.organization_name ?? "Organization",
          },
          org_user: {
            id: org_user.id,
            role: org_user.role,
          },
          session,
        },
      };
    });
  };

  return {
    list_members,
    list_invites,
    create_invite,
    revoke_invite,
    get_public_invite,
    accept_invite,
  };
};
