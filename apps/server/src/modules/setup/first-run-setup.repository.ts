import { ulid } from "ulid";
import { find_audit_command } from "../audit/audit-coverage-registry";
import { write_audit_event } from "../audit/audit.repository";
import { run_audited_mutation } from "../audit/audit-transaction";
import { build_first_run_setup_event } from "./first-run-setup.audit";
import type { FirstRunSetupRepository } from "./first-run-setup.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};

type SetupUser = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
};

type SetupOrganization = {
  id: string;
  name: string;
};

type SetupOrgUser = {
  id: string;
  user_id: string;
  organization_id: string;
  role: "owner";
};

type SetupSession = {
  id: string;
  user_id: string;
  organization_id: string;
  org_user_id: string;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] as Row;

type SetupIdentifiers = {
  user_id: string;
  organization_id: string;
  org_user_id: string;
  session_id: string;
};

const build_transactional_repository = (
  db: Queryable,
  identifiers?: SetupIdentifiers,
) => ({
  async owner_exists() {
    const result = await db.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM organization_schema.org_user
        WHERE role = 'owner'
        AND status = 'active'
        AND is_deleted = FALSE
      ) AS exists
    `);

    return Boolean(result.rows[0]?.exists);
  },

  async create_user(input: {
    email: string;
    password_hash: string;
    first_name?: string | null;
    last_name?: string | null;
    display_name: string;
  }) {
    return first_row(
      await db.query<SetupUser>(
        `
      INSERT INTO user_schema.user (
        id,
        email,
        password_hash,
        first_name,
        last_name,
        display_name
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, password_hash, display_name
    `,
        [
          identifiers?.user_id ?? ulid(),
          input.email,
          input.password_hash,
          input.first_name ?? null,
          input.last_name ?? null,
          input.display_name,
        ],
      ),
    );
  },

  async create_organization(input: { name: string }) {
    return first_row(
      await db.query<SetupOrganization>(
        `
      INSERT INTO organization_schema.organization (
        id,
        name
      )
      VALUES ($1, $2)
      RETURNING id, name
    `,
        [identifiers?.organization_id ?? ulid(), input.name],
      ),
    );
  },

  async create_org_user(input: {
    user_id: string;
    organization_id: string;
    role: "owner";
  }) {
    return first_row(
      await db.query<SetupOrgUser>(
        `
      INSERT INTO organization_schema.org_user (
        id,
        user_id,
        organization_id,
        role
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, organization_id, role
    `,
        [
          identifiers?.org_user_id ?? ulid(),
          input.user_id,
          input.organization_id,
          input.role,
        ],
      ),
    );
  },

  async create_session(input: {
    user_id: string;
    organization_id: string;
    org_user_id: string;
    token_hash: string;
  }) {
    return first_row(
      await db.query<SetupSession>(
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
      RETURNING id, user_id, organization_id, org_user_id
    `,
        [
          identifiers?.session_id ?? ulid(),
          input.user_id,
          input.organization_id,
          input.org_user_id,
          input.token_hash,
        ],
      ),
    );
  },
});

export const build_first_run_setup_repository = (
  pool: Queryable & {
    connect: () => Promise<Queryable & { release: () => void }>;
  },
): FirstRunSetupRepository => ({
  ...build_transactional_repository(pool),

  async owner_exists() {
    return build_transactional_repository(pool).owner_exists();
  },

  async transaction(callback) {
    const identifiers: SetupIdentifiers = {
      user_id: ulid(),
      organization_id: ulid(),
      org_user_id: ulid(),
      session_id: ulid(),
    };
    const event_id = ulid();
    const occurred_at = new Date().toISOString();
    let user: SetupUser | null = null;
    let organization: SetupOrganization | null = null;
    let org_user: SetupOrgUser | null = null;
    let session: SetupSession | null = null;
    return run_audited_mutation({
      pool,
      event_id,
      command: find_audit_command("setup.complete_first_run"),
      context: {
        organization_id: identifiers.organization_id,
        actor_type: "org_user",
        source_type: "web",
      },
      execute: async (client) => {
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtext('ossie:first_run_setup'))",
        );
        const repository = build_transactional_repository(client, identifiers);
        return callback({
          ...repository,
          async create_user(input) {
            user = await repository.create_user(input);
            return user;
          },
          async create_organization(input) {
            organization = await repository.create_organization(input);
            return organization;
          },
          async create_org_user(input) {
            org_user = await repository.create_org_user(input);
            return org_user;
          },
          async create_session(input) {
            session = await repository.create_session(input);
            return session;
          },
        });
      },
      build_event: () => {
        if (!user || !organization || !org_user || !session) return null;
        return build_first_run_setup_event({
          event_id,
          user,
          organization,
          org_user,
          session,
          occurred_at,
        });
      },
      write_audit_event,
    });
  },
});
