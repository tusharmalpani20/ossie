import { ulid } from "ulid";
import {
  ProjectNameConflictError,
  ProjectSlugConflictError,
  type Project,
  type AuthorizedProject,
  type ProjectRepository,
  type ProjectStatus,
  type UpdateProjectInput,
} from "./project.service";

type QueryResult<Row> = {
  rows: Row[];
};

type Queryable = {
  query: <Row = Record<string, unknown>>(sql: string, values?: unknown[]) => Promise<QueryResult<Row>>;
};

type ProjectRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  color: string | null;
  icon: string | null;
  status: ProjectStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: Date;
  updated_at: Date;
};

const first_row = <Row>(result: QueryResult<Row>) => result.rows[0] ?? null;

const map_project = (row: ProjectRow): Project => ({
  id: row.id,
  organization_id: row.organization_id,
  name: row.name,
  description: row.description,
  slug: row.slug,
  color: row.color,
  icon: row.icon,
  status: row.status,
  created_by_id: row.created_by_id,
  updated_by_id: row.updated_by_id,
  version: row.version,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});

const project_select = `
  id,
  organization_id,
  name,
  description,
  slug,
  color,
  icon,
  status,
  created_by_id,
  updated_by_id,
  version,
  created_at,
  updated_at
`;
const qualified_project_select = project_select.replace(
  /^\s*([a-z_]+)/gmu,
  "  project.$1",
);

const is_unique_violation = (error: unknown) => (
  typeof error === "object"
  && error !== null
  && "code" in error
  && error.code === "23505"
);

const constraint_name = (error: unknown) => (
  typeof error === "object" && error !== null && "constraint" in error
    ? String(error.constraint)
    : ""
);

const map_unique_error = (error: unknown): never => {
  if (is_unique_violation(error)) {
    const constraint = constraint_name(error);

    if (constraint === "uq_project_name_active_per_org") {
      throw new ProjectNameConflictError();
    }

    if (constraint === "uq_project_slug_active_per_org") {
      throw new ProjectSlugConflictError();
    }
  }

  throw error;
};

const update_assignments = (data: UpdateProjectInput) => {
  const assignments: string[] = [];
  const values: unknown[] = [];

  const add_assignment = (column: string, value: unknown) => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (data.name !== undefined) {
    add_assignment("name", data.name);
  }
  if (data.description !== undefined) {
    add_assignment("description", data.description);
  }
  if (data.slug !== undefined) {
    add_assignment("slug", data.slug);
  }
  if (data.color !== undefined) {
    add_assignment("color", data.color);
  }
  if (data.icon !== undefined) {
    add_assignment("icon", data.icon);
  }
  if (data.metadata !== undefined) {
    add_assignment("metadata", data.metadata);
  }
  if (data.status !== undefined) {
    add_assignment("status", data.status);
  }

  return {
    assignments,
    values,
  };
};

export const build_project_repository = (db: Queryable): ProjectRepository => ({
  async create_project(input) {
    try {
      const result = await db.query<ProjectRow>(`
        INSERT INTO project_schema.project (
          id,
          organization_id,
          name,
          description,
          slug,
          color,
          icon,
          metadata,
          status,
          created_by_id,
          updated_by_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $9)
        RETURNING ${project_select}
      `, [
        ulid(),
        input.organization_id,
        input.data.name,
        input.data.description ?? null,
        input.data.slug ?? null,
        input.data.color ?? null,
        input.data.icon ?? null,
        input.data.metadata ?? null,
        input.actor_org_user_id,
      ]);
      const row = first_row(result);

      if (!row) {
        throw new Error("Failed to create project");
      }

      return map_project(row);
    } catch (error) {
      return map_unique_error(error);
    }
  },

  async list_projects(input) {
    const result = await db.query<ProjectRow>(`
      SELECT ${project_select}
      FROM project_schema.project
      WHERE organization_id = $1
      AND status = $2
      AND is_deleted = FALSE
      ORDER BY created_at DESC, id DESC
    `, [input.organization_id, input.status]);

    return result.rows.map(map_project);
  },

  async list_authorized_projects(input) {
    const result = await db.query<ProjectRow & {
      actor_role: "owner" | "member";
      membership_role: "project_admin" | "editor" | "viewer" | null;
    }>(`
      SELECT ${qualified_project_select},
        actor.role AS actor_role, membership.role AS membership_role
      FROM project_schema.project project
      INNER JOIN organization_schema.org_user actor
        ON actor.organization_id = project.organization_id AND actor.id = $2
        AND actor.status = 'active' AND actor.is_deleted = FALSE
      LEFT JOIN project_schema.project_membership membership
        ON membership.organization_id = project.organization_id
        AND membership.project_id = project.id AND membership.org_user_id = actor.id
        AND membership.status = 'active'
      WHERE project.organization_id = $1 AND project.status = $3 AND project.is_deleted = FALSE
        AND (actor.role = 'owner' OR membership.id IS NOT NULL)
        AND ($4::text IS NULL OR $4 <> 'capture' OR actor.role = 'owner' OR membership.role IN ('project_admin', 'editor'))
      ORDER BY project.created_at DESC, project.id DESC
    `, [input.organization_id, input.actor_org_user_id, input.status, input.purpose ?? null]);
    return result.rows.map((row): AuthorizedProject => ({
      ...map_project(row),
      access: row.actor_role === "owner"
        ? { role: "project_admin", source: "organization_owner" }
        : { role: row.membership_role!, source: "project_membership" },
    }));
  },

  async find_project(input) {
    const result = await db.query<ProjectRow>(`
      SELECT ${project_select}
      FROM project_schema.project
      WHERE id = $1
      AND organization_id = $2
      AND is_deleted = FALSE
      LIMIT 1
    `, [input.project_id, input.organization_id]);
    const row = first_row(result);

    return row ? map_project(row) : null;
  },

  async update_project(input) {
    const update = update_assignments(input.data);
    const values = [
      ...update.values,
      input.actor_org_user_id,
      input.project_id,
      input.organization_id,
    ];
    const actor_index = update.values.length + 1;
    const project_index = update.values.length + 2;
    const organization_index = update.values.length + 3;

    try {
      const result = await db.query<ProjectRow>(`
        UPDATE project_schema.project
        SET ${[
          ...update.assignments,
          `updated_by_id = $${actor_index}`,
          "updated_at = CURRENT_TIMESTAMP",
          "version = version + 1",
        ].join(", ")}
        WHERE id = $${project_index}
        AND organization_id = $${organization_index}
        AND is_deleted = FALSE
        RETURNING ${project_select}
      `, values);
      const row = first_row(result);

      return row ? map_project(row) : null;
    } catch (error) {
      return map_unique_error(error);
    }
  },

  async delete_project(input) {
    const result = await db.query<ProjectRow>(`
      UPDATE project_schema.project
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by_id = $1,
        updated_by_id = $1,
        updated_at = CURRENT_TIMESTAMP,
        version = version + 1
      WHERE id = $2
      AND organization_id = $3
      AND is_deleted = FALSE
      RETURNING ${project_select}
    `, [
      input.actor_org_user_id,
      input.project_id,
      input.organization_id,
    ]);

    return result.rows.length > 0;
  },
});
