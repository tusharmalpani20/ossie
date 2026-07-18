import { ulid } from "ulid";
import type {
  OrganizationInviteStatus,
  OrganizationMemberStatus,
} from "@repo/constants";
import type {
  OrganizationInviteRepository,
  OrgInvite,
  OrgMember,
  OrgMemberRole,
} from "./organization-invites.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};

type OrgInviteRow = {
  id: string;
  organization_id: string;
  organization_name?: string;
  email: string;
  role: OrgMemberRole;
  token_hash: string;
  status: OrganizationInviteStatus;
  expires_at: Date;
  accepted_at: Date | null;
  accepted_user_id: string | null;
  created_by_id: string;
  updated_by_id: string;
  created_at: Date;
  updated_at: Date;
};

type OrgMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: OrgMemberRole;
  status: OrganizationMemberStatus;
  created_at: Date;
};

type InviteUserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const map_invite = (
  row: OrgInviteRow,
): OrgInvite & { token_hash: string; organization_name?: string } => ({
  id: row.id,
  organization_id: row.organization_id,
  organization_name: row.organization_name,
  email: row.email,
  role: row.role,
  token_hash: row.token_hash,
  status: row.status,
  expires_at: row.expires_at.toISOString(),
  accepted_at: row.accepted_at?.toISOString() ?? null,
  accepted_user_id: row.accepted_user_id,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const map_member = (row: OrgMemberRow): OrgMember => ({
  id: row.id,
  organization_id: row.organization_id,
  user_id: row.user_id,
  email: row.email,
  display_name: row.display_name,
  role: row.role,
  status: row.status,
  created_at: row.created_at.toISOString(),
});

const invite_select = `
  SELECT
    org_invite.id,
    org_invite.organization_id,
    organization.name AS organization_name,
    org_invite.email,
    org_invite.role,
    org_invite.token_hash,
    org_invite.status,
    org_invite.expires_at,
    org_invite.accepted_at,
    org_invite.accepted_user_id,
    org_invite.created_by_id,
    org_invite.updated_by_id,
    org_invite.created_at,
    org_invite.updated_at
  FROM organization_schema.org_invite org_invite
  INNER JOIN organization_schema.organization organization ON organization.id = org_invite.organization_id
`;

const member_select = `
  SELECT
    org_user.id,
    org_user.organization_id,
    org_user.user_id,
    app_user.email,
    app_user.display_name,
    org_user.role,
    org_user.status,
    org_user.created_at
  FROM organization_schema.org_user org_user
  INNER JOIN user_schema.user app_user ON app_user.id = org_user.user_id
`;

export const build_organization_invites_transactional_repository = (
  db: Queryable,
) => ({
  async find_invite_by_token_hash(token_hash: string) {
    const row = first_row(
      await db.query<OrgInviteRow>(
        `
      ${invite_select}
      WHERE org_invite.token_hash = $1
      LIMIT 1
      FOR UPDATE OF org_invite
    `,
        [token_hash],
      ),
    );
    return row ? map_invite(row) : null;
  },

  async find_user_by_email(email: string) {
    return first_row(
      await db.query<InviteUserRow>(
        `
      SELECT id, email, password_hash, display_name
      FROM user_schema.user
      WHERE lower(email) = $1
      AND status = 'active'
      AND is_deleted = FALSE
      LIMIT 1
    `,
        [email],
      ),
    );
  },

  async find_org_user_by_user(organization_id: string, user_id: string) {
    const row = first_row(
      await db.query<OrgMemberRow>(
        `
      ${member_select}
      WHERE org_user.organization_id = $1
      AND org_user.user_id = $2
      AND org_user.is_deleted = FALSE
      LIMIT 1
    `,
        [organization_id, user_id],
      ),
    );
    return row ? map_member(row) : null;
  },

  async create_user(input: {
    email: string;
    password_hash: string;
    display_name: string;
  }) {
    const row = first_row(
      await db.query<InviteUserRow>(
        `
      INSERT INTO user_schema.user (
        id,
        email,
        password_hash,
        display_name
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, password_hash, display_name
    `,
        [ulid(), input.email, input.password_hash, input.display_name],
      ),
    );

    if (!row) {
      throw new Error("Failed to create invited user");
    }

    return row;
  },

  async create_org_user(input: {
    organization_id: string;
    user_id: string;
    email: string;
    display_name: string;
    role: OrgMemberRole;
  }) {
    const row = first_row(
      await db.query<OrgMemberRow>(
        `
      INSERT INTO organization_schema.org_user (
        id,
        organization_id,
        user_id,
        role
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        organization_id,
        user_id,
        $5::TEXT AS email,
        $6::TEXT AS display_name,
        role,
        status,
        created_at
    `,
        [
          ulid(),
          input.organization_id,
          input.user_id,
          input.role,
          input.email,
          input.display_name,
        ],
      ),
    );

    if (!row) {
      throw new Error("Failed to create organization member");
    }

    return map_member(row);
  },

  async create_session(input: {
    user_id: string;
    organization_id: string;
    org_user_id: string;
    token_hash: string;
  }) {
    const row = first_row(
      await db.query<{
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
      ),
    );

    if (!row) {
      throw new Error("Failed to create invite acceptance session");
    }

    return {
      id: row.id,
      session_type: row.session_type,
      expires_at: row.expires_at.toISOString(),
    };
  },

  async mark_invite_accepted(input: {
    invite_id: string;
    user_id: string;
    org_user_id: string;
  }) {
    const row = first_row(
      await db.query<OrgInviteRow>(
        `
      WITH updated_invite AS (
        UPDATE organization_schema.org_invite
        SET status = 'accepted',
            accepted_at = CURRENT_TIMESTAMP,
            accepted_user_id = $2,
            updated_by_id = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      )
      SELECT
        updated_invite.id,
        updated_invite.organization_id,
        organization.name AS organization_name,
        updated_invite.email,
        updated_invite.role,
        updated_invite.token_hash,
        updated_invite.status,
        updated_invite.expires_at,
        updated_invite.accepted_at,
        updated_invite.accepted_user_id,
        updated_invite.created_by_id,
        updated_invite.updated_by_id,
        updated_invite.created_at,
        updated_invite.updated_at
      FROM updated_invite
      INNER JOIN organization_schema.organization organization ON organization.id = updated_invite.organization_id
    `,
        [input.invite_id, input.user_id, input.org_user_id],
      ),
    );

    if (!row) {
      throw new Error("Failed to mark invite accepted");
    }

    return map_invite(row);
  },
});

export const build_uncovered_organization_invites_repository = (
  pool: Queryable & {
    connect: () => Promise<Queryable & { release: () => void }>;
  },
): OrganizationInviteRepository => ({
  ...build_organization_invites_transactional_repository(pool),

  async list_members(organization_id) {
    const result = await pool.query<OrgMemberRow>(
      `
      ${member_select}
      WHERE org_user.organization_id = $1
      AND org_user.is_deleted = FALSE
      ORDER BY org_user.created_at ASC
    `,
      [organization_id],
    );
    return result.rows.map(map_member);
  },

  async list_invites(organization_id) {
    const result = await pool.query<OrgInviteRow>(
      `
      ${invite_select}
      WHERE org_invite.organization_id = $1
      ORDER BY org_invite.created_at DESC
    `,
      [organization_id],
    );
    return result.rows.map(map_invite);
  },

  async find_active_invite_by_email(organization_id, email) {
    const row = first_row(
      await pool.query<OrgInviteRow>(
        `
      ${invite_select}
      WHERE org_invite.organization_id = $1
      AND lower(org_invite.email) = $2
      AND org_invite.status = 'pending'
      LIMIT 1
    `,
        [organization_id, email],
      ),
    );
    return row ? map_invite(row) : null;
  },

  async create_invite(input) {
    const row = first_row(
      await pool.query<OrgInviteRow>(
        `
      WITH inserted_invite AS (
        INSERT INTO organization_schema.org_invite (
          id,
          organization_id,
          email,
          role,
          token_hash,
          expires_at,
          created_by_id,
          updated_by_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING *
      )
      SELECT
        inserted_invite.id,
        inserted_invite.organization_id,
        organization.name AS organization_name,
        inserted_invite.email,
        inserted_invite.role,
        inserted_invite.token_hash,
        inserted_invite.status,
        inserted_invite.expires_at,
        inserted_invite.accepted_at,
        inserted_invite.accepted_user_id,
        inserted_invite.created_by_id,
        inserted_invite.updated_by_id,
        inserted_invite.created_at,
        inserted_invite.updated_at
      FROM inserted_invite
      INNER JOIN organization_schema.organization organization ON organization.id = inserted_invite.organization_id
    `,
        [
          ulid(),
          input.organization_id,
          input.email,
          input.role,
          input.token_hash,
          input.expires_at,
          input.actor_org_user_id,
        ],
      ),
    );

    if (!row) {
      throw new Error("Failed to create organization invite");
    }

    return map_invite(row);
  },

  async revoke_invite(input) {
    const row = first_row(
      await pool.query<OrgInviteRow>(
        `
      WITH updated_invite AS (
        UPDATE organization_schema.org_invite
        SET status = 'revoked',
            updated_by_id = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        AND organization_id = $1
        AND status = 'pending'
        RETURNING *
      )
      SELECT
        updated_invite.id,
        updated_invite.organization_id,
        organization.name AS organization_name,
        updated_invite.email,
        updated_invite.role,
        updated_invite.token_hash,
        updated_invite.status,
        updated_invite.expires_at,
        updated_invite.accepted_at,
        updated_invite.accepted_user_id,
        updated_invite.created_by_id,
        updated_invite.updated_by_id,
        updated_invite.created_at,
        updated_invite.updated_at
      FROM updated_invite
      INNER JOIN organization_schema.organization organization ON organization.id = updated_invite.organization_id
    `,
        [input.organization_id, input.invite_id, input.actor_org_user_id],
      ),
    );
    return row ? map_invite(row) : null;
  },

  async transaction(callback) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(
        build_organization_invites_transactional_repository(client),
      );
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
});
