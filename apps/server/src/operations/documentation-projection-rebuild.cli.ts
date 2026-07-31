import { create_maintenance_pool } from "../config/maintenance-database.config";
import { get_documentation_operations_config } from "../config/documentation-operations.config";
import { build_documentation_operations_repository } from "../modules/documentation-operations/documentation-operations.repository";

type QueryableDatabase = Parameters<
  typeof build_documentation_operations_repository
>[0];

type ProjectionTarget = {
  organization_id: string;
  project_id: string;
  project_version_slug: string;
  site_id: string;
  publication_id: string | null;
  output_digest: string | null;
  projection: "draft_search" | "publication_search";
};

export type ProjectionMaintenanceOptions =
  | { mode: "dry_run"; publication_id: string | null }
  | { mode: "all_legacy"; publication_id: null }
  | { mode: "publication"; publication_id: string };

export const parse_projection_maintenance_args = (
  argv: readonly string[],
): ProjectionMaintenanceOptions => {
  const dry_run = argv.includes("--dry-run");
  const all_legacy = argv.includes("--all-legacy");
  const publication_index = argv.indexOf("--publication-id");
  const publication_id =
    publication_index >= 0 ? argv[publication_index + 1] : undefined;
  const known = new Set(["--dry-run", "--all-legacy", "--publication-id"]);
  const unknown = argv.filter(
    (value, index) =>
      !known.has(value) &&
      !(publication_index >= 0 && index === publication_index + 1),
  );
  if (
    unknown.length ||
    (publication_index >= 0 && !publication_id) ||
    Number(all_legacy) + Number(publication_index >= 0) > 1 ||
    (dry_run && (all_legacy || publication_index >= 0))
  ) {
    throw new Error(
      "Usage: documentation-projection-rebuild [--dry-run | --all-legacy | --publication-id <id>]",
    );
  }
  if (all_legacy) return { mode: "all_legacy", publication_id: null };
  if (publication_id) return { mode: "publication", publication_id };
  return { mode: "dry_run", publication_id: null };
};

const read_targets = async (
  database: QueryableDatabase,
  options: ProjectionMaintenanceOptions,
  batch_size: number,
): Promise<ProjectionTarget[]> => {
  if (options.publication_id) {
    const result = await database.query<ProjectionTarget>(
      `SELECT publication.organization_id,publication.project_id,
              project_version.slug project_version_slug,
              publication.documentation_site_id site_id,
              publication.id publication_id,publication.output_digest,
              'publication_search'::text projection
         FROM publish_schema.site_publication publication
         JOIN documentation_schema.site_edition edition
           ON edition.id=publication.site_edition_id
         JOIN project_schema.project_version project_version
           ON project_version.id=edition.project_version_id
        WHERE publication.id=$1`,
      [options.publication_id],
    );
    if (!result.rows[0]) {
      throw new Error("Requested Documentation Publication was not found");
    }
    return result.rows;
  }
  const result = await database.query<ProjectionTarget>(
    `WITH candidates AS (
       SELECT edition.organization_id,edition.project_id,
              project_version.slug project_version_slug,
              edition.documentation_site_id site_id,
              NULL::varchar publication_id,NULL::varchar output_digest,
              'draft_search'::text projection,edition.id ordering_id
         FROM documentation_schema.site_edition edition
         JOIN project_schema.project_version project_version
           ON project_version.id=edition.project_version_id
        WHERE edition.status='active'
       UNION ALL
       SELECT generation.organization_id,generation.project_id,
              project_version.slug,publication.documentation_site_id,
              publication.id,publication.output_digest,
              'publication_search'::text,generation.id
         FROM publish_schema.site_publication_search_generation generation
         JOIN publish_schema.site_publication publication
           ON publication.id=generation.site_publication_id
         JOIN documentation_schema.site_edition edition
           ON edition.id=publication.site_edition_id
         JOIN project_schema.project_version project_version
           ON project_version.id=edition.project_version_id
        WHERE generation.status='requires_rebuild'
     )
     SELECT organization_id,project_id,project_version_slug,site_id,
            publication_id,output_digest,projection
       FROM candidates ORDER BY projection,ordering_id LIMIT $1`,
    [batch_size],
  );
  return result.rows;
};

export const run_documentation_projection_maintenance = async (input: {
  argv: readonly string[];
  database: QueryableDatabase;
  output?: (line: string) => void;
  batch_size?: number;
}) => {
  const options = parse_projection_maintenance_args(input.argv);
  const output = input.output ?? console.info;
  const targets = await read_targets(
    input.database,
    options,
    input.batch_size ??
      get_documentation_operations_config().rebuild_batch_size,
  );
  const counts = {
    draft_search: targets.filter(
      (target) => target.projection === "draft_search",
    ).length,
    publication_search: targets.filter(
      (target) => target.projection === "publication_search",
    ).length,
  };
  if (options.mode === "dry_run") {
    output(
      JSON.stringify({
        mode: "dry_run",
        candidates: counts,
        truncated:
          targets.length ===
          (input.batch_size ??
            get_documentation_operations_config().rebuild_batch_size),
      }),
    );
    return { processed: 0, candidates: counts };
  }
  const repository = build_documentation_operations_repository(input.database);
  let processed = 0;
  for (const target of targets) {
    const request =
      target.projection === "publication_search"
        ? {
            projection: "publication_search" as const,
            publication_id: target.publication_id as string,
            expected_output_digest: target.output_digest ?? undefined,
          }
        : { projection: "draft_search" as const };
    await repository.rebuild_projection({
      organization_id: target.organization_id,
      actor_org_user_id: null,
      actor_type: "system",
      project_id: target.project_id,
      project_version_slug: target.project_version_slug,
      site_id: target.site_id,
      request,
    });
    processed += 1;
  }
  output(
    JSON.stringify({
      mode: options.mode,
      processed,
      candidates: counts,
    }),
  );
  return { processed, candidates: counts };
};

const invoked_directly =
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invoked_directly) {
  const database = create_maintenance_pool();
  run_documentation_projection_maintenance({
    argv: process.argv.slice(2),
    database,
  })
    .catch((error) => {
      console.error(
        "Documentation projection maintenance failed:",
        error instanceof Error ? error.message : "unknown_error",
      );
      process.exitCode = 1;
    })
    .finally(() => database.end());
}
