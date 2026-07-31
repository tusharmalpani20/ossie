import { createHash } from "node:crypto";
import { ulid } from "ulid";
import {
  build_entity_audit_event,
  resolve_org_user_audit_context,
} from "../audit/entity-audit";
import { write_audit_event } from "../audit/audit.repository";
import type { DocumentationOperationsRepository } from "./documentation-operations.service";

type QueryResult<Row> = { rows: Row[] };
type Queryable = {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>;
};
type Client = Queryable & { release(): void };
type Database = Queryable & { connect(): Promise<Client> };

type LimitsRow = {
  active_sites_limit: number | null;
  active_pages_limit: number | null;
  version: number;
  updated_at: Date;
};
type UsageRow = {
  active_sites: string | number;
  active_pages: string | number;
  retained_file_bytes: string | number;
  retained_revisions: string | number;
  retained_publications: string | number;
  active_import_inspections: string | number;
  open_review_requests: string | number;
};

export class DocumentationOperationsVersionConflictError extends Error {
  readonly code = "documentation_row_version_conflict";
  constructor(
    readonly latest: {
      active_sites_limit: number | null;
      active_pages_limit: number | null;
      version: number;
      updated_at: string | null;
    },
  ) {
    super("Documentation limits changed; reconcile with the latest values");
  }
}

const with_transaction = async <Result>(
  database: Database,
  work: (client: Queryable) => Promise<Result>,
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

const safe_integer = (value: string | number) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("Documentation usage exceeded the safe reporting range");
  }
  return parsed;
};

const read_limits = async (database: Queryable, organization_id: string) => {
  const result = await database.query<LimitsRow>(
    `SELECT active_sites_limit,active_pages_limit,version,updated_at
       FROM documentation_schema.organization_documentation_limits
      WHERE organization_id=$1`,
    [organization_id],
  );
  const row = result.rows[0];
  return row
    ? {
        active_sites_limit: row.active_sites_limit,
        active_pages_limit: row.active_pages_limit,
        version: row.version,
        updated_at: row.updated_at.toISOString(),
      }
    : {
        active_sites_limit: null,
        active_pages_limit: null,
        version: 0,
        updated_at: null,
      };
};

const read_usage = async (database: Queryable, organization_id: string) => {
  const result = await database.query<UsageRow>(
    `WITH retained_file_ids AS (
       SELECT asset.file_id
         FROM documentation_schema.documentation_asset asset
        WHERE asset.organization_id=$1
       UNION
       SELECT source.file_id
         FROM documentation_schema.openapi_source source
        WHERE source.organization_id=$1
       UNION
       SELECT reference.file_id
         FROM documentation_schema.site_revision_asset_reference reference
        WHERE reference.organization_id=$1
          AND coalesce(reference.source_kind,'documentation_asset')
              ='documentation_asset'
       UNION
       SELECT source.file_id
         FROM documentation_schema.site_revision_openapi_source source
        WHERE source.organization_id=$1
     )
     SELECT
       (SELECT count(DISTINCT edition.documentation_site_id)
          FROM documentation_schema.site_edition edition
         WHERE edition.organization_id=$1 AND edition.status='active')
         AS active_sites,
       (SELECT count(*)
          FROM documentation_schema.documentation_page page
          JOIN documentation_schema.site_edition edition
            ON edition.id=page.site_edition_id
         WHERE page.organization_id=$1
           AND page.status='active' AND edition.status='active')
         AS active_pages,
       (SELECT coalesce(sum(file.size_bytes),0)
          FROM retained_file_ids retained
          JOIN file_schema.file file ON file.id=retained.file_id
         WHERE file.organization_id=$1 AND NOT file.is_deleted)
         AS retained_file_bytes,
       (SELECT count(*) FROM documentation_schema.site_revision revision
         WHERE revision.organization_id=$1) AS retained_revisions,
       (SELECT count(*) FROM publish_schema.site_publication publication
         WHERE publication.organization_id=$1) AS retained_publications,
       (SELECT count(*)
          FROM documentation_schema.documentation_import_inspection inspection
         WHERE inspection.organization_id=$1 AND inspection.status='ready')
         AS active_import_inspections,
       (SELECT count(*)
          FROM documentation_schema.documentation_review_request review
         WHERE review.organization_id=$1 AND review.status='open')
         AS open_review_requests`,
    [organization_id],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Documentation usage query returned no row");
  return {
    active_sites: safe_integer(row.active_sites),
    active_pages: safe_integer(row.active_pages),
    retained_file_bytes: safe_integer(row.retained_file_bytes),
    retained_revisions: safe_integer(row.retained_revisions),
    retained_publications: safe_integer(row.retained_publications),
    active_import_inspections: safe_integer(row.active_import_inspections),
    open_review_requests: safe_integer(row.open_review_requests),
  };
};

const begin_audit = async (
  client: Queryable,
  input: {
    organization_id: string;
    actor_org_user_id: string | null;
    actor_type?: "org_user" | "system";
    command: string;
    action: string;
  },
) => {
  const event_id = ulid();
  const actor_type = input.actor_type ?? "org_user";
  if (actor_type === "org_user" && !input.actor_org_user_id) {
    throw new Error("Organization user audit actor is required");
  }
  const context =
    actor_type === "org_user"
      ? await resolve_org_user_audit_context(client, {
          organization_id: input.organization_id,
          actor_org_user_id: input.actor_org_user_id as string,
        })
      : {
          mutation: { source_type: "system" as const },
          actor_label: "System",
        };
  for (const [name, value] of [
    ["ossie.audit_event_id", event_id],
    ["ossie.audit_organization_id", input.organization_id],
    ["ossie.audit_action", input.action],
    ["ossie.audit_command", input.command],
    ["ossie.audit_actor_type", actor_type],
    ["ossie.audit_source_type", context.mutation.source_type],
  ]) {
    await client.query("SELECT set_config($1,$2,true)", [name, value]);
  }
  return {
    event_id,
    actor_label: context.actor_label,
    actor_type,
    source_type: context.mutation.source_type,
    occurred_at: new Date().toISOString(),
  };
};

const projection_digest = (
  rows: Array<{
    source_page_id: string;
    title: string;
    description: string | null;
    canonical_path: string;
    heading_text: string;
    body_text: string;
  }>,
) =>
  createHash("sha256")
    .update(
      JSON.stringify(
        rows.map((row) => [
          row.source_page_id,
          row.title,
          row.description,
          row.heading_text,
          row.body_text,
        ]),
      ),
    )
    .digest("hex");

const audit_projection_rebuild = async (
  client: Queryable,
  input: {
    organization_id: string;
    actor_org_user_id: string | null;
    actor_type?: "org_user" | "system";
    project_id: string;
    site_id: string;
    projection: "draft_search" | "publication_search";
    publication_id: string | null;
    output_digest: string | null;
    documents: number;
    outcome: "rebuilt" | "unchanged";
  },
) => {
  const publication = input.projection === "publication_search";
  const action = publication
    ? "documentation.projection.publication_search_rebuilt"
    : "documentation.projection.draft_search_rebuilt";
  const audit = await begin_audit(client, {
    organization_id: input.organization_id,
    actor_org_user_id: input.actor_org_user_id,
    actor_type: input.actor_type,
    command: publication
      ? "documentation.projection_rebuild.publication"
      : "documentation.projection_rebuild.draft",
    action,
  });
  const event = build_entity_audit_event({
    id: audit.event_id,
    organization_id: input.organization_id,
    project_id: input.project_id,
    root_resource_type: "documentation_site",
    root_resource_id: input.site_id,
    action,
    actor_org_user_id: input.actor_org_user_id,
    actor_label: audit.actor_label,
    actor_type: audit.actor_type,
    source_type: audit.source_type,
    occurred_at: audit.occurred_at,
    before_row_version: null,
    after_row_version: null,
    changes: [
      {
        entity_type: "documentation_projection_rebuild",
        entity_id: audit.event_id,
        parent_entity_type: "documentation_site",
        parent_entity_id: input.site_id,
        before: null,
        after: {
          projection: input.projection,
          publication_id: input.publication_id,
          output_digest: input.output_digest,
          documents: input.documents,
          outcome: input.outcome,
        },
        safe_fields: {
          projection: "enum",
          publication_id: "identifier",
          output_digest: "identifier",
          documents: "integer",
          outcome: "enum",
        },
      },
    ],
  });
  if (event) await write_audit_event(client, event);
};

export const build_documentation_operations_repository = (
  database: Database,
): DocumentationOperationsRepository => ({
  read_limits_and_usage: async ({ organization_id }) => ({
    limits: await read_limits(database, organization_id),
    usage: await read_usage(database, organization_id),
  }),

  update_limits: async ({ organization_id, actor_org_user_id, request }) =>
    with_transaction(database, async (client) => {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 138))",
        [organization_id],
      );
      const current = await read_limits(client, organization_id);
      if (current.version !== request.expected_version) {
        throw new DocumentationOperationsVersionConflictError(current);
      }
      if (
        current.version === 0 &&
        request.active_sites_limit === null &&
        request.active_pages_limit === null
      ) {
        return {
          limits: current,
          usage: await read_usage(client, organization_id),
        };
      }
      const audit = await begin_audit(client, {
        organization_id,
        actor_org_user_id,
        command: "documentation.organization_limits.update",
        action: "documentation.organization_limits.updated",
      });
      const next_version = current.version + 1;
      if (current.version === 0) {
        await client.query(
          `INSERT INTO documentation_schema.organization_documentation_limits
            (organization_id,active_sites_limit,active_pages_limit,version,
             created_by_id,updated_by_id)
           VALUES ($1,$2,$3,1,$4,$4)`,
          [
            organization_id,
            request.active_sites_limit,
            request.active_pages_limit,
            actor_org_user_id,
          ],
        );
      } else {
        await client.query(
          `UPDATE documentation_schema.organization_documentation_limits
              SET active_sites_limit=$2,active_pages_limit=$3,
                  version=version+1,updated_by_id=$4,
                  updated_at=CURRENT_TIMESTAMP
            WHERE organization_id=$1 AND version=$5`,
          [
            organization_id,
            request.active_sites_limit,
            request.active_pages_limit,
            actor_org_user_id,
            request.expected_version,
          ],
        );
      }
      const event = build_entity_audit_event({
        id: audit.event_id,
        organization_id,
        project_id: null,
        root_resource_type: "organization",
        root_resource_id: organization_id,
        action: "documentation.organization_limits.updated",
        actor_org_user_id,
        actor_label: audit.actor_label,
        source_type: audit.source_type,
        occurred_at: audit.occurred_at,
        before_row_version: current.version || null,
        after_row_version: next_version,
        changes: [
          {
            entity_type: "organization_documentation_limits",
            entity_id: organization_id,
            parent_entity_type: "organization",
            parent_entity_id: organization_id,
            before:
              current.version === 0
                ? null
                : {
                    active_sites_limit: current.active_sites_limit,
                    active_pages_limit: current.active_pages_limit,
                    version: current.version,
                  },
            after: {
              active_sites_limit: request.active_sites_limit,
              active_pages_limit: request.active_pages_limit,
              version: next_version,
            },
            safe_fields: {
              active_sites_limit: "integer",
              active_pages_limit: "integer",
              version: "integer",
            },
          },
        ],
      });
      if (event) await write_audit_event(client, event);
      return {
        limits: await read_limits(client, organization_id),
        usage: await read_usage(client, organization_id),
      };
    }),

  rebuild_projection: async (input) =>
    with_transaction(database, async (client) => {
      const scope = await client.query<{
        site_edition_id: string;
        site_publication_id: string | null;
        output_digest: string | null;
      }>(
        `SELECT edition.id site_edition_id,
                publication.id site_publication_id,
                publication.output_digest
           FROM documentation_schema.documentation_site site
           JOIN documentation_schema.site_edition edition
             ON edition.documentation_site_id=site.id
           JOIN project_schema.project_version project_version
             ON project_version.id=edition.project_version_id
           LEFT JOIN publish_schema.site_publication publication
             ON publication.id=$5
          WHERE site.id=$1 AND site.project_id=$2
            AND site.organization_id=$3
            AND project_version.slug=$4
            AND (
              $5::varchar IS NULL OR
              (publication.documentation_site_id=site.id
               AND publication.site_edition_id=edition.id
               AND publication.organization_id=$3)
            )`,
        [
          input.site_id,
          input.project_id,
          input.organization_id,
          input.project_version_slug,
          input.request.publication_id ?? null,
        ],
      );
      const selected = scope.rows[0];
      if (!selected) {
        const error = new Error("Documentation rebuild target was not found");
        Object.assign(error, { code: "documentation_not_found" });
        throw error;
      }
      if (input.request.projection === "publication_search") {
        if (
          input.request.expected_output_digest &&
          input.request.expected_output_digest !== selected.output_digest
        ) {
          const error = new Error(
            "Publication output digest no longer matches the rebuild request",
          );
          Object.assign(error, {
            code: "documentation_projection_rebuild_invalid",
          });
          throw error;
        }
        const pages = await client.query<{
          source_page_id: string;
          title: string;
          description: string | null;
          canonical_path: string;
          heading_text: string;
          body_text: string;
        }>(
          `SELECT page.source_page_id,page.title,page.description,
                  page.canonical_path,
                  coalesce(string_agg(block.text_content,' ' ORDER BY block.position)
                    FILTER (WHERE block.kind='heading'),'') heading_text,
                  coalesce(string_agg(block.text_content,' ' ORDER BY block.position)
                    FILTER (WHERE block.kind<>'heading'),'') body_text
             FROM publish_schema.site_publication publication
             JOIN documentation_schema.site_revision_page page
               ON page.site_revision_id=publication.site_revision_id
             LEFT JOIN documentation_schema.site_revision_page_block block
               ON block.site_revision_page_id=page.id
            WHERE publication.id=$1 AND publication.organization_id=$2
            GROUP BY page.id,page.source_page_id,page.title,page.description,
                     page.canonical_path
            ORDER BY page.canonical_path,page.source_page_id`,
          [input.request.publication_id, input.organization_id],
        );
        const digest = projection_digest(pages.rows);
        const existing = await client.query<{ projection_digest: string }>(
          `SELECT generation.projection_digest
             FROM publish_schema.site_publication_search_selection selection
             JOIN publish_schema.site_publication_search_generation generation
               ON generation.id=selection.search_generation_id
            WHERE selection.site_publication_id=$1`,
          [input.request.publication_id],
        );
        if (existing.rows[0]?.projection_digest === digest) {
          const receipt = {
            projection: "publication_search",
            site_id: input.site_id,
            publication_id: input.request.publication_id ?? null,
            output_digest: selected.output_digest,
            documents: pages.rows.length,
            outcome: "unchanged" as const,
          } as const;
          await audit_projection_rebuild(client, {
            organization_id: input.organization_id,
            actor_org_user_id: input.actor_org_user_id,
            project_id: input.project_id,
            ...receipt,
          });
          return receipt;
        }
        const generation_number = await client.query<{ next: number }>(
          `SELECT coalesce(max(generation_number),0)+1 next
             FROM publish_schema.site_publication_search_generation
            WHERE site_publication_id=$1`,
          [input.request.publication_id],
        );
        const generation_id = ulid();
        await client.query(
          `INSERT INTO publish_schema.site_publication_search_generation
            (id,organization_id,project_id,site_publication_id,
             generation_number,output_digest,projection_digest,document_count,
             status,legacy_compatible,actor_type,created_by_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ready',FALSE,$9,$10)`,
          [
            generation_id,
            input.organization_id,
            input.project_id,
            input.request.publication_id,
            generation_number.rows[0]?.next ?? 1,
            selected.output_digest,
            digest,
            pages.rows.length,
            input.actor_type ?? "org_user",
            input.actor_type === "system" ? null : input.actor_org_user_id,
          ],
        );
        for (const page of pages.rows) {
          await client.query(
            `INSERT INTO publish_schema.site_publication_search_document
              (id,organization_id,project_id,site_publication_id,
               search_generation_id,source_page_id,title,description,
               canonical_path,search_text,heading_text,body_text)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [
              ulid(),
              input.organization_id,
              input.project_id,
              input.request.publication_id,
              generation_id,
              page.source_page_id,
              page.title,
              page.description,
              page.canonical_path,
              [page.title, page.description, page.heading_text, page.body_text]
                .filter(Boolean)
                .join(" "),
              page.heading_text,
              page.body_text,
            ],
          );
        }
        await client.query(
          `INSERT INTO publish_schema.site_publication_search_selection
            (site_publication_id,organization_id,project_id,
             search_generation_id)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (site_publication_id) DO UPDATE
             SET search_generation_id=EXCLUDED.search_generation_id,
                 selected_at=CURRENT_TIMESTAMP`,
          [
            input.request.publication_id,
            input.organization_id,
            input.project_id,
            generation_id,
          ],
        );
        const receipt = {
          projection: "publication_search",
          site_id: input.site_id,
          publication_id: input.request.publication_id ?? null,
          output_digest: selected.output_digest,
          documents: pages.rows.length,
          outcome: "rebuilt" as const,
        } as const;
        await audit_projection_rebuild(client, {
          organization_id: input.organization_id,
          actor_org_user_id: input.actor_org_user_id,
          project_id: input.project_id,
          ...receipt,
        });
        return receipt;
      }

      const pages = await client.query<{
        source_page_id: string;
        title: string;
        description: string | null;
        canonical_path: string;
        heading_text: string;
        body_text: string;
      }>(
        `SELECT page.id source_page_id,page.title,page.description,
                page.canonical_path,
                coalesce(string_agg(block.text_content,' ' ORDER BY block.position)
                  FILTER (WHERE block.kind='heading'),'') heading_text,
                coalesce(string_agg(block.text_content,' ' ORDER BY block.position)
                  FILTER (WHERE block.kind<>'heading'),'') body_text
           FROM documentation_schema.documentation_page page
           LEFT JOIN documentation_schema.documentation_page_block block
             ON block.documentation_page_id=page.id
          WHERE page.site_edition_id=$1 AND page.organization_id=$2
            AND page.status='active'
          GROUP BY page.id,page.title,page.description,page.canonical_path
          ORDER BY page.canonical_path,page.id`,
        [selected.site_edition_id, input.organization_id],
      );
      const expected_digest = projection_digest(pages.rows);
      const current = await client.query<{
        source_page_id: string;
        title: string;
        description: string | null;
        canonical_path: string;
        heading_text: string;
        body_text: string;
      }>(
        `SELECT documentation_page_id source_page_id,title,description,
                canonical_path,heading_text,body_text
           FROM documentation_schema.documentation_draft_search_document
          WHERE site_edition_id=$1 AND organization_id=$2
          ORDER BY canonical_path,documentation_page_id`,
        [selected.site_edition_id, input.organization_id],
      );
      if (projection_digest(current.rows) === expected_digest) {
        const receipt = {
          projection: "draft_search",
          site_id: input.site_id,
          publication_id: null,
          output_digest: null,
          documents: pages.rows.length,
          outcome: "unchanged" as const,
        } as const;
        await audit_projection_rebuild(client, {
          organization_id: input.organization_id,
          actor_org_user_id: input.actor_org_user_id,
          project_id: input.project_id,
          ...receipt,
        });
        return receipt;
      }
      await client.query(
        `DELETE FROM documentation_schema.documentation_draft_search_document
          WHERE site_edition_id=$1 AND organization_id=$2`,
        [selected.site_edition_id, input.organization_id],
      );
      for (const page of pages.rows) {
        const source_digest = createHash("sha256")
          .update(
            JSON.stringify([
              page.title,
              page.description,
              page.canonical_path,
              page.heading_text,
              page.body_text,
            ]),
          )
          .digest("hex");
        await client.query(
          `INSERT INTO documentation_schema.documentation_draft_search_document
            (id,organization_id,project_id,project_version_id,
             documentation_site_id,site_edition_id,documentation_page_id,
             title,description,canonical_path,search_text,source_digest,
             heading_text,body_text)
           SELECT $1,$2,$3,edition.project_version_id,$4,$5,$6,$7,$8,$9,
                  $10,$11,$12,$13
             FROM documentation_schema.site_edition edition
            WHERE edition.id=$5`,
          [
            ulid(),
            input.organization_id,
            input.project_id,
            input.site_id,
            selected.site_edition_id,
            page.source_page_id,
            page.title,
            page.description,
            page.canonical_path,
            [page.title, page.description, page.heading_text, page.body_text]
              .filter(Boolean)
              .join(" "),
            source_digest,
            page.heading_text,
            page.body_text,
          ],
        );
      }
      const receipt = {
        projection: "draft_search",
        site_id: input.site_id,
        publication_id: null,
        output_digest: null,
        documents: pages.rows.length,
        outcome: "rebuilt" as const,
      } as const;
      await audit_projection_rebuild(client, {
        organization_id: input.organization_id,
        actor_org_user_id: input.actor_org_user_id,
        project_id: input.project_id,
        ...receipt,
      });
      return receipt;
    }),
});
