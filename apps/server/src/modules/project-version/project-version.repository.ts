import type { ProjectVersionAlias, ProjectVersionDetail } from "@repo/types/project-version";
import { ulid } from "ulid";
import { build_project_repository } from "../project/project.repository";
import {
  LegacyContentBlocksDefaultChangeError,
  ProjectVersionSlugConflictError,
  type ProjectVersionRepository,
} from "./project-version.service";

type Queryable = { query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }> };
type AliasRow = Omit<ProjectVersionAlias, "created_at"> & { created_at: Date | string };
type VersionRow = Omit<ProjectVersionDetail, "created_at" | "updated_at" | "aliases"> & {
  created_at: Date; updated_at: Date; aliases: AliasRow[] | null;
};

const map_alias = (row: AliasRow): ProjectVersionAlias => ({ ...row,
  created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at });
const map_version = (row: VersionRow): ProjectVersionDetail => ({
  ...row,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
  aliases: (row.aliases ?? []).map(map_alias),
});
const version_select = `version.id, version.organization_id, version.project_id,
  version.name, version.description, version.slug, version.release_date::text,
  version.position, version.status,
  (project.default_project_version_id = version.id) AS is_default,
  version.version, version.created_by_id, version.updated_by_id,
  version.created_at, version.updated_at,
  COALESCE((SELECT json_agg(json_build_object(
    'id', alias.id, 'project_version_id', alias.project_version_id, 'slug', alias.slug,
    'created_by_id', alias.created_by_id, 'created_at', alias.created_at
  ) ORDER BY alias.created_at, alias.id)
  FROM project_schema.project_version_alias alias
  WHERE alias.organization_id = version.organization_id
    AND alias.project_id = version.project_id
    AND alias.project_version_id = version.id), '[]'::json) AS aliases`;

const is_constraint = (error: unknown, names: string[]) => typeof error === "object" && error !== null
  && "constraint" in error && names.includes(String(error.constraint));
const map_write_error = (error: unknown): never => {
  if (is_constraint(error, [
    "project_version_slug_namespace_guard", "uq_project_version_project_slug_ci",
    "uq_project_version_alias_project_slug_ci", "project_version_slug_alias_guard",
  ])) throw new ProjectVersionSlugConflictError();
  if (is_constraint(error, ["project_default_legacy_content_guard"]))
    throw new LegacyContentBlocksDefaultChangeError();
  throw error;
};

export const build_project_version_repository = (db: Queryable): ProjectVersionRepository => {
  const find_version: ProjectVersionRepository["find_version"] = async (input) => {
    const result = await db.query<VersionRow>(`SELECT ${version_select}
      FROM project_schema.project_version version
      JOIN project_schema.project project
        ON project.id = version.project_id AND project.organization_id = version.organization_id
      WHERE version.organization_id = $1 AND version.project_id = $2 AND version.id = $3
      LIMIT 1`, [input.organization_id, input.project_id, input.project_version_id]);
    return result.rows[0] ? map_version(result.rows[0]) : null;
  };
  return {
    find_version,
    async list_versions(input) {
      const result = await db.query<VersionRow>(`SELECT ${version_select}
        FROM project_schema.project_version version
        JOIN project_schema.project project
          ON project.id = version.project_id AND project.organization_id = version.organization_id
        WHERE version.organization_id = $1 AND version.project_id = $2
          AND ($3::text IS NULL OR version.status = $3)
        ORDER BY CASE WHEN project.default_project_version_id = version.id THEN 0
          WHEN version.status = 'active' THEN 1 ELSE 2 END,
          version.position, version.id`, [input.organization_id, input.project_id, input.status ?? null]);
      return result.rows.map(map_version);
    },
    async resolve_version(input) {
      const result = await db.query<VersionRow & { resolution: "canonical" | "alias" }>(`SELECT ${version_select},
          CASE WHEN lower(version.slug) = lower($3) THEN 'canonical' ELSE 'alias' END AS resolution
        FROM project_schema.project_version version
        JOIN project_schema.project project
          ON project.id = version.project_id AND project.organization_id = version.organization_id
        LEFT JOIN project_schema.project_version_alias matched_alias
          ON matched_alias.organization_id = version.organization_id
          AND matched_alias.project_id = version.project_id
          AND matched_alias.project_version_id = version.id AND lower(matched_alias.slug) = lower($3)
        WHERE version.organization_id = $1 AND version.project_id = $2
          AND (lower(version.slug) = lower($3) OR matched_alias.id IS NOT NULL)
        LIMIT 1`, [input.organization_id, input.project_id, input.slug]);
      const row = result.rows[0];
      return row ? { project_version: map_version(row), resolution: row.resolution } : null;
    },
    async create_version(input) {
      const id = ulid();
      try {
        const result = await db.query<VersionRow>(`WITH inserted AS (
          INSERT INTO project_schema.project_version (
            id, organization_id, project_id, name, description, slug, release_date,
            position, status, created_by_id, updated_by_id
          ) SELECT $1, project.organization_id, project.id, $4, $5, $6, $7,
              COALESCE((SELECT max(position) + 1 FROM project_schema.project_version WHERE project_id = project.id), 1),
              'active', $3, $3
            FROM project_schema.project project
            WHERE project.organization_id = $2 AND project.id = $8 AND project.is_deleted = FALSE
          RETURNING *
        ) SELECT ${version_select}
          FROM inserted version JOIN project_schema.project project
            ON project.id = version.project_id AND project.organization_id = version.organization_id`,
        [id, input.organization_id, input.actor_org_user_id, input.data.name, input.data.description,
          input.data.slug, input.data.release_date, input.project_id]);
        return result.rows[0] ? map_version(result.rows[0]) : null;
      } catch (error) { return map_write_error(error); }
    },
    async update_version(input) {
      const { expected_version, ...changes } = input.data;
      const assignments: string[] = [];
      const values: unknown[] = [];
      for (const key of ["name", "description", "slug", "release_date"] as const) {
        if (changes[key] !== undefined) { values.push(changes[key]); assignments.push(`${key} = $${values.length}`); }
      }
      values.push(input.actor_org_user_id, input.organization_id, input.project_id, input.project_version_id, expected_version);
      const actor = values.length - 4, org = values.length - 3, project = values.length - 2, id = values.length - 1, version = values.length;
      try {
        const result = await db.query<VersionRow>(`WITH updated AS (
          UPDATE project_schema.project_version SET ${assignments.join(", ")},
            updated_by_id = $${actor}, updated_at = CURRENT_TIMESTAMP, version = version + 1
          WHERE organization_id = $${org} AND project_id = $${project} AND id = $${id}
            AND status = 'active' AND version = $${version} RETURNING *
        ) SELECT ${version_select} FROM updated version JOIN project_schema.project project
          ON project.id = version.project_id AND project.organization_id = version.organization_id`, values);
        return result.rows[0] ? map_version(result.rows[0]) : null;
      } catch (error) { return map_write_error(error); }
    },
    async reorder_versions(input) {
      try {
        const ids = input.data.project_versions.map(({ id }) => id);
        const expected = input.data.project_versions.map(({ expected_version }) => expected_version);
        const result = await db.query<VersionRow>(`WITH requested AS (
            SELECT request.id, request.expected_version, request.ordinality
            FROM unnest($4::varchar[], $5::integer[]) WITH ORDINALITY
              AS request(id, expected_version, ordinality)
          ), slots AS (
            SELECT position, row_number() OVER (ORDER BY position, id) AS ordinality
            FROM project_schema.project_version
            WHERE organization_id = $1 AND project_id = $2 AND status = 'active'
          ), valid AS (
            SELECT count(*)::integer AS matched FROM requested JOIN project_schema.project_version version
              ON version.organization_id = $1 AND version.project_id = $2 AND version.id = requested.id
              AND version.status = 'active' AND version.version = requested.expected_version
          ), updated AS (
            UPDATE project_schema.project_version version SET position = slots.position,
              updated_by_id = $3, updated_at = CURRENT_TIMESTAMP, version = version.version + 1
            FROM requested JOIN slots USING (ordinality)
            WHERE version.organization_id = $1 AND version.project_id = $2
              AND version.id = requested.id AND version.status = 'active'
              AND version.version = requested.expected_version
              AND version.position IS DISTINCT FROM slots.position
              AND (SELECT matched FROM valid) = cardinality($4::varchar[])
            RETURNING version.*
          ) SELECT ${version_select} FROM project_schema.project_version version JOIN project_schema.project project
            ON project.id = version.project_id AND project.organization_id = version.organization_id
          WHERE version.organization_id = $1 AND version.project_id = $2 AND version.status = 'active'
            AND (SELECT matched FROM valid) = cardinality($4::varchar[])
          ORDER BY version.position, version.id`, [input.organization_id, input.project_id, input.actor_org_user_id, ids, expected]);
        return result.rows.length === ids.length ? result.rows.map(map_version) : null;
      } catch (error) { return map_write_error(error); }
    },
    async archive_version(input) {
      const result = await db.query<VersionRow>(`WITH updated AS (
        UPDATE project_schema.project_version SET status = 'archived', updated_by_id = $4,
          updated_at = CURRENT_TIMESTAMP, version = version + 1
        WHERE organization_id = $1 AND project_id = $2 AND id = $3
          AND status = 'active' AND version = $5 RETURNING *
      ) SELECT ${version_select} FROM updated version JOIN project_schema.project project
        ON project.id = version.project_id AND project.organization_id = version.organization_id`,
      [input.organization_id, input.project_id, input.project_version_id, input.actor_org_user_id, input.expected_version]);
      return result.rows[0] ? map_version(result.rows[0]) : null;
    },
    async restore_version(input) {
      const result = await db.query<VersionRow>(`WITH updated AS (
        UPDATE project_schema.project_version SET status = 'active', updated_by_id = $4,
          updated_at = CURRENT_TIMESTAMP, version = version + 1
        WHERE organization_id = $1 AND project_id = $2 AND id = $3
          AND status = 'archived' AND version = $5 RETURNING *
      ) SELECT ${version_select} FROM updated version JOIN project_schema.project project
        ON project.id = version.project_id AND project.organization_id = version.organization_id`,
      [input.organization_id, input.project_id, input.project_version_id, input.actor_org_user_id, input.expected_version]);
      return result.rows[0] ? map_version(result.rows[0]) : null;
    },
    async set_default_version(input) {
      try {
        const result = await db.query<{ id: string }>(`UPDATE project_schema.project SET default_project_version_id = $3, updated_by_id = $4,
            updated_at = CURRENT_TIMESTAMP, version = version + 1
          WHERE organization_id = $1 AND id = $2 AND version = $6
            AND EXISTS (SELECT 1 FROM project_schema.project_version target
              WHERE target.organization_id = $1 AND target.project_id = $2 AND target.id = $3
                AND target.status = 'active' AND target.version = $5)
          RETURNING id`,
        [input.organization_id, input.project_id, input.project_version_id, input.actor_org_user_id,
          input.data.expected_version, input.data.expected_project_row_version]);
        if (!result.rows[0]) return null;
        const project = await build_project_repository(db).find_project({
          organization_id: input.organization_id, project_id: input.project_id,
        });
        const project_version = await find_version({ organization_id: input.organization_id,
          project_id: input.project_id, project_version_id: input.project_version_id });
        return project && project_version ? { project, project_version } : null;
      } catch (error) { return map_write_error(error); }
    },
  };
};
