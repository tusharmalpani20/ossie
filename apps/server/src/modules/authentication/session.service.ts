import { Password } from "../../common/services/password.common.service";
import { generate_session_token, hash_session_token } from "./session-token";

export { generate_session_token, hash_session_token };

export type AuthContext = {
  user: {
    id: string;
    email: string;
    display_name: string;
  };
  organization: {
    id: string;
    name: string;
  };
  org_user: {
    id: string;
    role: string;
  };
  session: {
    id: string;
    session_type: string;
    expires_at: string;
  };
};

export type LoginIdentity = {
  user: {
    id: string;
    email: string;
    password_hash: string;
    display_name: string;
  };
  organization: {
    id: string;
    name: string;
  };
  org_user: {
    id: string;
    role: string;
  };
};

export type AuthenticationSessionRepository = {
  find_and_touch_auth_context_by_token_hash: (
    token_hash: string,
  ) => Promise<AuthContext | null>;
  find_login_identity_by_email: (
    email: string,
  ) => Promise<LoginIdentity | null>;
  create_session: (input: {
    user_id: string;
    organization_id: string;
    org_user_id: string;
    token_hash: string;
  }) => Promise<AuthContext["session"]>;
  revoke_session_by_token_hash: (token_hash: string) => Promise<void>;
};

export class UnauthenticatedSessionError extends Error {
  constructor() {
    super("Authentication is required");
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Email or password is incorrect");
  }
}

const normalize_email = (email: string) => email.trim().toLowerCase();

export const build_authentication_session_service = (
  repository: AuthenticationSessionRepository,
) => {
  const get_current_auth_context = async (session_token?: string) => {
    if (!session_token) {
      throw new UnauthenticatedSessionError();
    }

    const auth_context =
      await repository.find_and_touch_auth_context_by_token_hash(
        hash_session_token(session_token),
      );

    if (!auth_context) {
      throw new UnauthenticatedSessionError();
    }

    return auth_context;
  };

  const login = async (input: { email: string; password: string }) => {
    const identity = await repository.find_login_identity_by_email(
      normalize_email(input.email),
    );

    if (!identity) {
      throw new InvalidCredentialsError();
    }

    const password_matches = await Password.compare(
      identity.user.password_hash,
      input.password,
    );

    if (!password_matches) {
      throw new InvalidCredentialsError();
    }

    const session_token = generate_session_token();
    const session = await repository.create_session({
      user_id: identity.user.id,
      organization_id: identity.organization.id,
      org_user_id: identity.org_user.id,
      token_hash: hash_session_token(session_token),
    });

    return {
      session_token,
      auth: {
        user: {
          id: identity.user.id,
          email: identity.user.email,
          display_name: identity.user.display_name,
        },
        organization: identity.organization,
        org_user: identity.org_user,
        session,
      },
    };
  };

  const logout = async (session_token?: string) => {
    if (!session_token) {
      return;
    }

    await repository.revoke_session_by_token_hash(
      hash_session_token(session_token),
    );
  };

  return {
    get_current_auth_context,
    login,
    logout,
  };
};
