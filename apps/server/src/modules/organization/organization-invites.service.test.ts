import { describe, expect, it, vi } from "vitest";
import {
  AcceptedInviteError,
  ExpiredInviteError,
  InviteNotFoundError,
  InvitePermissionError,
  build_organization_invites_service,
  hash_invite_token,
  type OrganizationInviteRepository,
  type OrgInvite,
  type OrgMember,
} from "./organization-invites.service";

const owner_auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_owner",
  actor_role: "owner",
};

const member_auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_member",
  actor_role: "member",
};

const stable_invite_now = () => new Date("2026-06-10T00:00:00.000Z");

const owner_member: OrgMember = {
  id: "org_user_owner",
  organization_id: "organization_1",
  user_id: "user_owner",
  email: "owner@example.com",
  display_name: "Owner User",
  role: "owner",
  status: "active",
  created_at: "2026-06-10T00:00:00.000Z",
};

const pending_invite = (overrides: Partial<OrgInvite> = {}): OrgInvite => ({
  id: "invite_1",
  organization_id: "organization_1",
  email: "teammate@example.com",
  role: "member",
  status: "pending",
  expires_at: "2026-06-20T00:00:00.000Z",
  accepted_at: null,
  accepted_user_id: null,
  created_by_id: "org_user_owner",
  updated_by_id: "org_user_owner",
  created_at: "2026-06-10T00:00:00.000Z",
  updated_at: "2026-06-10T00:00:00.000Z",
  ...overrides,
});

const build_repository = (overrides: Partial<OrganizationInviteRepository> = {}) => {
  const invites: Array<OrgInvite & { token_hash: string }> = [];
  const members: OrgMember[] = [owner_member];
  const users: Array<{ id: string; email: string; password_hash: string; display_name: string }> = [];
  const sessions: Array<{ user_id: string; organization_id: string; org_user_id: string; token_hash: string }> = [];

  const repository: OrganizationInviteRepository & {
    invites: typeof invites;
    members: typeof members;
    users: typeof users;
    sessions: typeof sessions;
  } = {
    invites,
    members,
    users,
    sessions,
    async list_members() {
      return members;
    },
    async list_invites() {
      return invites;
    },
    async find_active_invite_by_email(_organization_id, email) {
      return invites.find((invite) => invite.email === email && invite.status === "pending") ?? null;
    },
    async create_invite(input) {
      const invite = {
        ...pending_invite({
          id: `invite_${invites.length + 1}`,
          email: input.email,
          role: input.role,
          expires_at: input.expires_at,
          created_by_id: input.actor_org_user_id,
          updated_by_id: input.actor_org_user_id,
        }),
        token_hash: input.token_hash,
      };
      invites.push(invite);
      return invite;
    },
    async revoke_invite(input) {
      const invite = invites.find((candidate) => candidate.id === input.invite_id && candidate.organization_id === input.organization_id);
      if (!invite || invite.status !== "pending") {
        return null;
      }
      invite.status = "revoked";
      invite.updated_by_id = input.actor_org_user_id;
      return invite;
    },
    async find_invite_by_token_hash(token_hash) {
      return invites.find((invite) => invite.token_hash === token_hash) ?? null;
    },
    async find_user_by_email(email) {
      return users.find((user) => user.email === email) ?? null;
    },
    async find_org_user_by_user(organization_id, user_id) {
      return members.find((member) => member.organization_id === organization_id && member.user_id === user_id) ?? null;
    },
    async create_user(input) {
      const user = {
        id: `user_${users.length + 1}`,
        email: input.email,
        password_hash: input.password_hash,
        display_name: input.display_name,
      };
      users.push(user);
      return user;
    },
    async create_org_user(input) {
      const member: OrgMember = {
        id: `org_user_${members.length + 1}`,
        organization_id: input.organization_id,
        user_id: input.user_id,
        email: input.email,
        display_name: input.display_name,
        role: input.role,
        status: "active" as const,
        created_at: "2026-06-10T00:00:00.000Z",
      };
      members.push(member);
      return member;
    },
    async create_session(input) {
      sessions.push(input);
      return {
        id: `session_${sessions.length}`,
        session_type: "web",
        expires_at: "2026-07-10T00:00:00.000Z",
      };
    },
    async mark_invite_accepted(input) {
      const invite = invites.find((candidate) => candidate.id === input.invite_id);
      if (!invite) {
        throw new Error("missing invite");
      }
      invite.status = "accepted";
      invite.accepted_at = "2026-06-10T01:00:00.000Z";
      invite.accepted_user_id = input.user_id;
      invite.updated_by_id = input.org_user_id;
      return invite;
    },
    async transaction(callback) {
      return callback(repository);
    },
    ...overrides,
  };

  return repository;
};

describe("organization invites service", () => {
  it("lists members and pending invites for owners", async () => {
    const repository = build_repository();
    const service = build_organization_invites_service(repository);
    repository.invites.push({ ...pending_invite(), token_hash: "hidden_hash" });

    await expect(service.list_members({ auth: owner_auth })).resolves.toEqual({ members: [owner_member] });
    await expect(service.list_invites({ auth: owner_auth })).resolves.toEqual({ invites: [pending_invite()] });
  });

  it("creates an invite with normalized email and hashed one-time token", async () => {
    const repository = build_repository();
    const service = build_organization_invites_service(repository, {
      generate_token: () => "plain-token",
      now: () => new Date("2026-06-10T00:00:00.000Z"),
    });

    const result = await service.create_invite({
      auth: owner_auth,
      data: {
        email: " Teammate@Example.COM ",
        role: "member",
      },
    });

    expect(result.invite.email).toBe("teammate@example.com");
    expect(result.invite_token).toBe("plain-token");
    expect(repository.invites[0]?.token_hash).toBe(hash_invite_token("plain-token"));
    expect(repository.invites[0]?.token_hash).not.toBe("plain-token");
    expect(JSON.stringify(result.invite)).not.toContain("token_hash");
  });

  it("rejects invite creation and revocation for non-owner members", async () => {
    const service = build_organization_invites_service(build_repository());

    await expect(service.create_invite({
      auth: member_auth,
      data: { email: "new@example.com", role: "member" },
    })).rejects.toBeInstanceOf(InvitePermissionError);
    await expect(service.revoke_invite({
      auth: member_auth,
      invite_id: "invite_1",
    })).rejects.toBeInstanceOf(InvitePermissionError);
  });

  it("returns safe public invite metadata without token hash or account existence", async () => {
    const repository = build_repository();
    repository.invites.push({ ...pending_invite(), token_hash: hash_invite_token("plain-token") });
    const service = build_organization_invites_service(repository, {
      now: stable_invite_now,
    });

    const result = await service.get_public_invite({ token: "plain-token" });

    expect(result).toEqual({
      invite: {
        id: "invite_1",
        organization_name: "Organization",
        email: "teammate@example.com",
        role: "member",
        status: "pending",
        expires_at: "2026-06-20T00:00:00.000Z",
        requires_login: false,
      },
    });
    expect(JSON.stringify(result)).not.toContain("token_hash");
  });

  it("reports a resolved invite through a safe trusted context callback", async () => {
    const repository = build_repository();
    repository.invites.push({
      ...pending_invite(),
      token_hash: hash_invite_token("plain-token"),
    });
    const on_public_invite_resolved = vi.fn();
    const service = build_organization_invites_service(repository, {
      now: stable_invite_now,
      on_public_invite_resolved,
    });

    await service.get_public_invite({ token: "plain-token" });

    expect(on_public_invite_resolved).toHaveBeenCalledWith({
      organization_id: "organization_1",
      invite_id: "invite_1",
      status: "pending",
    });
    expect(JSON.stringify(on_public_invite_resolved.mock.calls)).not.toContain(
      "token_hash",
    );
  });

  it("accepts an invite for a new user and creates an authenticated session", async () => {
    const repository = build_repository();
    repository.invites.push({ ...pending_invite(), token_hash: hash_invite_token("plain-token") });
    const service = build_organization_invites_service(repository, {
      generate_session_token: () => "session-token",
      now: stable_invite_now,
    });

    const result = await service.accept_invite({
      token: "plain-token",
      password: "very safe local password",
      display_name: "Teammate User",
    });

    expect(result.session_token).toBe("session-token");
    expect(result.auth.user.email).toBe("teammate@example.com");
    expect(result.auth.org_user.role).toBe("member");
    expect(repository.users[0]?.password_hash).not.toBe("very safe local password");
    expect(repository.invites[0]?.status).toBe("accepted");
  });

  it("rejects expired public invite lookup and acceptance", async () => {
    const repository = build_repository();
    repository.invites.push({
      ...pending_invite({ expires_at: "2026-06-09T00:00:00.000Z" }),
      token_hash: hash_invite_token("plain-token"),
    });
    const service = build_organization_invites_service(repository, {
      now: stable_invite_now,
    });

    await expect(service.get_public_invite({ token: "plain-token" })).rejects.toBeInstanceOf(ExpiredInviteError);
    await expect(service.accept_invite({
      token: "plain-token",
      password: "very safe local password",
    })).rejects.toBeInstanceOf(ExpiredInviteError);
  });

  it("rejects already accepted invites", async () => {
    const repository = build_repository();
    repository.invites.push({
      ...pending_invite({ status: "accepted", accepted_at: "2026-06-10T01:00:00.000Z" }),
      token_hash: hash_invite_token("plain-token"),
    });
    const service = build_organization_invites_service(repository);

    await expect(service.accept_invite({
      token: "plain-token",
      password: "very safe local password",
    })).rejects.toBeInstanceOf(AcceptedInviteError);
    await expect(service.get_public_invite({ token: "missing-token" })).rejects.toBeInstanceOf(InviteNotFoundError);
  });
});
