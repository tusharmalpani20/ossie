import { describe, expect, it } from "vitest";
import { Password } from "../../common/services/password.common.service";
import {
  build_authentication_session_service,
  hash_session_token,
  InvalidCredentialsError,
  UnauthenticatedSessionError,
  type AuthenticationSessionRepository,
} from "./session.service";

const auth_context = {
  user: {
    id: "user_1",
    email: "owner@example.com",
    display_name: "Owner User",
  },
  organization: {
    id: "organization_1",
    name: "Acme",
  },
  org_user: {
    id: "org_user_1",
    role: "owner",
  },
  session: {
    id: "session_1",
    session_type: "web",
    expires_at: "2026-07-05T00:00:00.000Z",
  },
};

const build_repository = (): AuthenticationSessionRepository & {
  touched_session_ids: string[];
  session_token_hashes: string[];
  created_session_token_hashes: string[];
  revoked_session_token_hashes: string[];
} => {
  const touched_session_ids: string[] = [];
  const session_token_hashes: string[] = [];
  const created_session_token_hashes: string[] = [];
  const revoked_session_token_hashes: string[] = [];

  return {
    touched_session_ids,
    session_token_hashes,
    created_session_token_hashes,
    revoked_session_token_hashes,
    async find_and_touch_auth_context_by_token_hash(token_hash) {
      session_token_hashes.push(token_hash);
      if (token_hash !== hash_session_token("valid-session-token")) {
        return null;
      }
      touched_session_ids.push(auth_context.session.id);
      return auth_context;
    },
    async find_login_identity_by_email(email) {
      if (email !== "owner@example.com") {
        return null;
      }

      return {
        user: {
          id: "user_1",
          email: "owner@example.com",
          password_hash: await Password.to_hash("safe local password"),
          display_name: "Owner User",
        },
        organization: auth_context.organization,
        org_user: auth_context.org_user,
      };
    },
    async create_session(input) {
      created_session_token_hashes.push(input.token_hash);
      return {
        id: "session_2",
        session_type: "web",
        expires_at: "2026-07-05T00:00:00.000Z",
      };
    },
    async revoke_session_by_token_hash(token_hash) {
      revoked_session_token_hashes.push(token_hash);
    },
  };
};

const build_missing_login_repository = (): AuthenticationSessionRepository & {
  created_session_token_hashes: string[];
} => {
  const created_session_token_hashes: string[] = [];

  return {
    created_session_token_hashes,
    async find_and_touch_auth_context_by_token_hash() {
      return null;
    },
    async find_login_identity_by_email() {
      return null;
    },
    async create_session() {
      throw new Error("session should not be created");
    },
    async revoke_session_by_token_hash() {
      throw new Error("not used");
    },
  };
};

describe("authentication session service", () => {
  it("returns current auth context by hashing the raw session token", async () => {
    const repository = build_repository();
    const service = build_authentication_session_service(repository);

    const result = await service.get_current_auth_context(
      "valid-session-token",
    );

    expect(result).toEqual(auth_context);
    expect(repository.session_token_hashes).toEqual([
      hash_session_token("valid-session-token"),
    ]);
    expect(repository.touched_session_ids).toEqual(["session_1"]);
  });

  it("rejects missing or invalid session tokens", async () => {
    const repository = build_repository();
    const service = build_authentication_session_service(repository);

    await expect(service.get_current_auth_context()).rejects.toBeInstanceOf(
      UnauthenticatedSessionError,
    );
    await expect(
      service.get_current_auth_context("invalid-token"),
    ).rejects.toBeInstanceOf(UnauthenticatedSessionError);
    expect(repository.touched_session_ids).toEqual([]);
  });

  it("logs in with valid credentials and creates a hashed session", async () => {
    const repository = build_repository();
    const service = build_authentication_session_service(repository);

    const result = await service.login({
      email: " OWNER@example.com ",
      password: "safe local password",
    });

    expect(result.session_token).toEqual(expect.any(String));
    expect(result.auth).toEqual({
      ...auth_context,
      session: {
        id: "session_2",
        session_type: "web",
        expires_at: "2026-07-05T00:00:00.000Z",
      },
    });
    expect(repository.created_session_token_hashes).toEqual([
      hash_session_token(result.session_token),
    ]);
    expect(repository.created_session_token_hashes[0]).not.toBe(
      result.session_token,
    );
  });

  it("rejects invalid credentials without creating a session", async () => {
    const repository = build_missing_login_repository();
    const service = build_authentication_session_service(repository);

    await expect(
      service.login({
        email: "missing@example.com",
        password: "safe local password",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(repository.created_session_token_hashes).toEqual([]);
  });

  it("logs out by revoking only the current session token hash", async () => {
    const repository = build_repository();
    const service = build_authentication_session_service(repository);

    await service.logout("session-token-to-revoke");
    await service.logout();

    expect(repository.revoked_session_token_hashes).toEqual([
      hash_session_token("session-token-to-revoke"),
    ]);
  });
});
