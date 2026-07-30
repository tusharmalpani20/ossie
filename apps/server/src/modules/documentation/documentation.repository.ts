import { ulid } from "ulid";

type QueryResult<Row> = { rows: Row[] };
type Queryable = {
  query: <Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};
type Client = Queryable & { release: () => void };
type Database = Queryable & { connect: () => Promise<Client> };

const with_transaction = async <T>(
  database: Database,
  work: (client: Queryable) => Promise<T>,
) => {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

type CreateSiteInput = {
  organization_id: string;
  project_id: string;
  project_version_id: string;
  actor_org_user_id: string;
  idempotency_key: string;
  name: string;
  description: string | null;
  primary_language: string;
  initial_home_page?: { title: string; path: string };
};

export const build_documentation_repository = (database: Database) => ({
  create_site: async (input: CreateSiteInput) =>
    with_transaction(database, async (client) => {
      const site_id = ulid();
      const edition_id = ulid();
      const working_draft_id = ulid();
      const home_page_id = input.initial_home_page ? ulid() : null;

      await client.query(
        `INSERT INTO documentation_schema.documentation_site
          (id,organization_id,project_id,name,description,created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$6)`,
        [
          site_id,
          input.organization_id,
          input.project_id,
          input.name,
          input.description,
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO documentation_schema.site_edition
          (id,organization_id,project_id,documentation_site_id,project_version_id,
           primary_language,created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
        [
          edition_id,
          input.organization_id,
          input.project_id,
          site_id,
          input.project_version_id,
          input.primary_language,
          input.actor_org_user_id,
        ],
      );
      await client.query(
        `INSERT INTO documentation_schema.site_working_draft
          (id,organization_id,project_id,documentation_site_id,site_edition_id,
           created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$6)`,
        [
          working_draft_id,
          input.organization_id,
          input.project_id,
          site_id,
          edition_id,
          input.actor_org_user_id,
        ],
      );

      if (home_page_id && input.initial_home_page) {
        await client.query(
          `INSERT INTO documentation_schema.documentation_page
            (id,organization_id,project_id,documentation_site_id,site_edition_id,
             site_working_draft_id,title,canonical_path,created_by_id,updated_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
          [
            home_page_id,
            input.organization_id,
            input.project_id,
            site_id,
            edition_id,
            working_draft_id,
            input.initial_home_page.title,
            input.initial_home_page.path,
            input.actor_org_user_id,
          ],
        );
        await client.query(
          `UPDATE documentation_schema.site_working_draft
             SET home_page_id=$1,version=version+1,updated_by_id=$2,updated_at=CURRENT_TIMESTAMP
           WHERE id=$3 AND organization_id=$4 AND project_id=$5`,
          [
            home_page_id,
            input.actor_org_user_id,
            working_draft_id,
            input.organization_id,
            input.project_id,
          ],
        );
      }

      return {
        site: {
          id: site_id,
          organization_id: input.organization_id,
          project_id: input.project_id,
          name: input.name,
          description: input.description,
          version: 1,
        },
        edition: {
          id: edition_id,
          documentation_site_id: site_id,
          project_version_id: input.project_version_id,
          primary_language: input.primary_language,
          version: 1,
        },
        working_draft: {
          id: working_draft_id,
          site_edition_id: edition_id,
          home_page_id,
          version: home_page_id ? 2 : 1,
        },
        home_page: home_page_id
          ? {
              id: home_page_id,
              title: input.initial_home_page?.title,
              canonical_path: input.initial_home_page?.path,
              version: 1,
            }
          : null,
      };
    }),
});
