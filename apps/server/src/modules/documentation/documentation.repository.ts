import { ulid } from "ulid";
import { DocumentationRowVersionConflictError } from "./documentation.service";

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
  create_page: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    actor_org_user_id: string;
    data: {
      title: string;
      description: string | null;
      canonical_path: string;
    };
  }) =>
    with_transaction(database, async (client) => {
      const parent = await client.query<{
        edition_id: string;
        working_draft_id: string;
      }>(
        `SELECT edition.id edition_id,draft.id working_draft_id
           FROM documentation_schema.site_edition edition
           JOIN documentation_schema.site_working_draft draft
             ON draft.site_edition_id=edition.id
          WHERE edition.organization_id=$1 AND edition.project_id=$2
            AND edition.project_version_id=$3
            AND edition.documentation_site_id=$4
          FOR UPDATE OF edition,draft`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
        ],
      );
      const scope = parent.rows[0];
      if (!scope) throw new Error("Documentation Site was not found");
      const id = ulid();
      await client.query(
        `INSERT INTO documentation_schema.documentation_page
          (id,organization_id,project_id,documentation_site_id,site_edition_id,
           site_working_draft_id,title,description,canonical_path,
           created_by_id,updated_by_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
        [
          id,
          input.organization_id,
          input.project_id,
          input.site_id,
          scope.edition_id,
          scope.working_draft_id,
          input.data.title,
          input.data.description,
          input.data.canonical_path,
          input.actor_org_user_id,
        ],
      );
      return {
        id,
        title: input.data.title,
        description: input.data.description,
        canonical_path: input.data.canonical_path,
        version: 1,
        blocks: [],
      };
    }),

  get_page: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    page_id: string;
  }) => {
    const page = await database.query<{
      id: string;
      title: string;
      description: string | null;
      canonical_path: string;
      version: number;
    }>(
      `SELECT page.id,page.title,page.description,page.canonical_path,page.version
         FROM documentation_schema.documentation_page page
         JOIN documentation_schema.site_edition edition
           ON edition.id=page.site_edition_id
        WHERE page.organization_id=$1 AND page.project_id=$2
          AND edition.project_version_id=$3
          AND page.documentation_site_id=$4 AND page.id=$5`,
      [
        input.organization_id,
        input.project_id,
        input.project_version_id,
        input.site_id,
        input.page_id,
      ],
    );
    if (!page.rows[0]) return null;
    const blocks = await database.query<Record<string, unknown>>(
      `SELECT id,kind,position,heading_level,text_content,link_url,linked_page_id,
              documentation_asset_id,openapi_source_id,operation_key,alt_text,version
         FROM documentation_schema.documentation_page_block
        WHERE organization_id=$1 AND project_id=$2
          AND documentation_page_id=$3 ORDER BY position,id`,
      [input.organization_id, input.project_id, input.page_id],
    );
    return { ...page.rows[0], blocks: blocks.rows };
  },

  save_page: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    site_id: string;
    page_id: string;
    actor_org_user_id: string;
    expected_page_version: number;
    blocks: Array<Record<string, unknown>>;
  }) =>
    with_transaction(database, async (client) => {
      const current = await client.query<{
        id: string;
        title: string;
        description: string | null;
        canonical_path: string;
        version: number;
      }>(
        `SELECT page.id,page.title,page.description,page.canonical_path,page.version
           FROM documentation_schema.documentation_page page
           JOIN documentation_schema.site_edition edition
             ON edition.id=page.site_edition_id
          WHERE page.organization_id=$1 AND page.project_id=$2
            AND edition.project_version_id=$3
            AND page.documentation_site_id=$4 AND page.id=$5
          FOR UPDATE OF page`,
        [
          input.organization_id,
          input.project_id,
          input.project_version_id,
          input.site_id,
          input.page_id,
        ],
      );
      const page = current.rows[0];
      if (!page) throw new Error("Documentation Page was not found");
      if (page.version !== input.expected_page_version) {
        throw new DocumentationRowVersionConflictError({
          ...page,
          blocks: [],
        });
      }
      await client.query(
        `DELETE FROM documentation_schema.documentation_page_block
          WHERE organization_id=$1 AND project_id=$2 AND documentation_page_id=$3`,
        [input.organization_id, input.project_id, input.page_id],
      );
      for (const block of input.blocks) {
        await client.query(
          `INSERT INTO documentation_schema.documentation_page_block
            (id,organization_id,project_id,site_edition_id,documentation_page_id,
             kind,position,heading_level,text_content,link_url,linked_page_id,
             documentation_asset_id,openapi_source_id,operation_key,alt_text,
             created_by_id,updated_by_id)
           SELECT $1,$2,$3,page.site_edition_id,page.id,$4,$5,$6,$7,$8,$9,
                  $10,$11,$12,$13,$14,$14
             FROM documentation_schema.documentation_page page
            WHERE page.id=$15 AND page.organization_id=$2 AND page.project_id=$3`,
          [
            block.id,
            input.organization_id,
            input.project_id,
            block.kind,
            block.position,
            block.level ?? null,
            block.text ?? block.code ?? block.label ?? null,
            block.url ?? null,
            block.page_id ?? null,
            block.asset_id ?? null,
            block.openapi_source_id ?? null,
            block.operation_key ?? null,
            block.alt_text ?? null,
            input.actor_org_user_id,
            input.page_id,
          ],
        );
      }
      await client.query(
        `UPDATE documentation_schema.documentation_page
            SET version=version+1,updated_by_id=$1,updated_at=CURRENT_TIMESTAMP
          WHERE id=$2 AND organization_id=$3 AND project_id=$4`,
        [
          input.actor_org_user_id,
          input.page_id,
          input.organization_id,
          input.project_id,
        ],
      );
      return { ...page, version: page.version + 1, blocks: input.blocks };
    }),

  list_sites: async (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
  }) => {
    const result = await database.query<{
      id: string;
      name: string;
      description: string | null;
      version: number;
      edition_id: string;
      primary_language: string;
      edition_version: number;
      updated_at: Date;
    }>(
      `SELECT site.id,site.name,site.description,site.version,
              edition.id edition_id,edition.primary_language,
              edition.version edition_version,edition.updated_at
         FROM documentation_schema.documentation_site site
         JOIN documentation_schema.site_edition edition
           ON edition.documentation_site_id=site.id
          AND edition.project_id=site.project_id
          AND edition.organization_id=site.organization_id
        WHERE site.organization_id=$1 AND site.project_id=$2
          AND edition.project_version_id=$3
        ORDER BY edition.updated_at DESC,site.id`,
      [input.organization_id, input.project_id, input.project_version_id],
    );
    return result.rows.map((row) => ({
      ...row,
      updated_at: row.updated_at.toISOString(),
    }));
  },
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
