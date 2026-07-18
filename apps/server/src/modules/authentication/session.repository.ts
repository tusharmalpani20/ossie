import { ulid } from "ulid";
import type {
  AuthContext,
  AuthenticationSessionRepository,
  LoginIdentity,
} from "./session.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

type AuthContextRow = {
  user_id: string;
  user_email: string;
  user_display_name: string;
  organization_id: string;
  organization_name: string;
  org_user_id: string;
  org_user_role: string;
  session_id: string;
  session_type: string;
  expires_at: Date;
};

const map_auth_context = (row: AuthContextRow): AuthContext => ({
  user: {
    id: row.user_id,
    email: row.user_email,
    display_name: row.user_display_name,
  },
  organization: {
    id: row.organization_id,
    name: row.organization_name,
  },
  org_user: {
    id: row.org_user_id,
    role: row.org_user_role,
  },
  session: {
    id: row.session_id,
    session_type: row.session_type,
    expires_at: row.expires_at.toISOString(),
  },
});

const auth_context_select = `
  SELECT
    app_user.id AS user_id,
    app_user.email AS user_email,
    app_user.display_name AS user_display_name,
    organization.id AS organization_id,
    organization.name AS organization_name,
    org_user.id AS org_user_id,
    org_user.role AS org_user_role,
    auth_session.id AS session_id,
    auth_session.session_type,
    auth_session.expires_at
  FROM auth_schema.auth_session auth_session
  INNER JOIN user_schema.user app_user ON app_user.id = auth_session.user_id
  INNER JOIN organization_schema.organization organization ON organization.id = auth_session.organization_id
  INNER JOIN organization_schema.org_user org_user ON org_user.id = auth_session.org_user_id
`;

const active_auth_context_filters = `
  app_user.status = 'active'
  AND app_user.is_deleted = FALSE
  AND organization.status = 'active'
  AND organization.is_deleted = FALSE
  AND org_user.status = 'active'
  AND org_user.is_deleted = FALSE
  AND auth_session.status = 'active'
  AND auth_session.revoked_at IS NULL
  AND auth_session.expires_at > CURRENT_TIMESTAMP
`;

export const build_authentication_session_client_repository = (
  db: Queryable,
) => ({
  async find_auth_context_by_token_hash(token_hash: string) {
    const result = await db.query<AuthContextRow>(
      `
      ${auth_context_select}
      WHERE auth_session.token_hash = $1
      AND ${active_auth_context_filters}
      LIMIT 1
      FOR UPDATE OF auth_session
    `,
      [token_hash],
    );
    const row = first_row(result);
    return row ? map_auth_context(row) : null;
  },

  async touch_session(session_id: string) {
    await db.query(
      `
      UPDATE auth_schema.auth_session
      SET last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [session_id],
    );
  },

  async find_login_identity_by_email(
    email: string,
  ): Promise<LoginIdentity | null> {
    const result = await db.query<AuthContextRow & { password_hash: string }>(
      `
      SELECT
        app_user.id AS user_id,
        app_user.email AS user_email,
        app_user.password_hash,
        app_user.display_name AS user_display_name,
        organization.id AS organization_id,
        organization.name AS organization_name,
        org_user.id AS org_user_id,
        org_user.role AS org_user_role,
        '' AS session_id,
        'web' AS session_type,
        CURRENT_TIMESTAMP AS expires_at
      FROM user_schema.user app_user
      INNER JOIN organization_schema.org_user org_user ON org_user.user_id = app_user.id
      INNER JOIN organization_schema.organization organization ON organization.id = org_user.organization_id
      WHERE lower(app_user.email) = $1
      AND app_user.status = 'active'
      AND app_user.is_deleted = FALSE
      AND organization.status = 'active'
      AND organization.is_deleted = FALSE
      AND org_user.status = 'active'
      AND org_user.is_deleted = FALSE
      ORDER BY org_user.created_at ASC
      LIMIT 1
    `,
      [email],
    );
    const row = first_row(result);

    if (!row) {
      return null;
    }

    return {
      user: {
        id: row.user_id,
        email: row.user_email,
        password_hash: row.password_hash,
        display_name: row.user_display_name,
      },
      organization: {
        id: row.organization_id,
        name: row.organization_name,
      },
      org_user: {
        id: row.org_user_id,
        role: row.org_user_role,
      },
    };
  },

  async create_session(
    input: Parameters<AuthenticationSessionRepository["create_session"]>[0],
  ) {
    const result = await db.query<{
      id: string;
      session_type: string;
      expires_at: Date;
    }>(
      `
      INSERT INTO auth_schema.auth_session (
        id,
        user_id,
        organization_id,
        org_user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP + interval '30 days')
      RETURNING id, session_type, expires_at
    `,
      [
        ulid(),
        input.user_id,
        input.organization_id,
        input.org_user_id,
        input.token_hash,
      ],
    );
    const row = first_row(result);

    if (!row) {
      throw new Error("Failed to create authentication session");
    }

    return {
      id: row.id,
      session_type: row.session_type,
      expires_at: row.expires_at.toISOString(),
    };
  },

  async revoke_session_by_token_hash(token_hash: string) {
    await db.query(
      `
      UPDATE auth_schema.auth_session
      SET status = 'revoked',
          revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE token_hash = $1
      AND status = 'active'
      AND revoked_at IS NULL
    `,
      [token_hash],
    );
  },
});
