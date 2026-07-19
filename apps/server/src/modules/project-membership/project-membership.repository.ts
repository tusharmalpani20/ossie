import { ulid } from "ulid";
import type {
  ProjectAccessMember,
  ProjectMembership,
} from "@repo/types/project-membership";
import type { ProjectMembershipRepository, ProjectAccessRepository } from "./project-membership.service";

type Queryable = {
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }>;
};

type MembershipRow = Omit<ProjectMembership, "created_at" | "updated_at" | "revoked_at"> & {
  created_at: Date;
  updated_at: Date;
  revoked_at: Date | null;
};
const map_membership = (row: MembershipRow): ProjectMembership => ({
  ...row,
  revoked_at: row.revoked_at?.toISOString() ?? null,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
});
const membership_select = `membership.id, membership.organization_id, membership.project_id,
  membership.org_user_id, membership.role, membership.status, membership.version,
  membership.created_by_id, membership.updated_by_id, membership.revoked_by_id,
  membership.revoked_at, membership.created_at, membership.updated_at`;

export const build_project_membership_repository = (db: Queryable): ProjectMembershipRepository & ProjectAccessRepository => ({
  async resolve_project_access(input) {
    const result = await db.query<{
      project_id: string; project_organization_id: string; project_status: "active" | "archived";
      actor_status: "active" | "disabled"; actor_role: "owner" | "member";
      membership_role: "project_admin" | "editor" | "viewer" | null;
      membership_status: "active" | "revoked" | null;
    }>(`
      SELECT project.id AS project_id, project.organization_id AS project_organization_id,
        project.status AS project_status, actor.status AS actor_status, actor.role AS actor_role,
        membership.role AS membership_role, membership.status AS membership_status
      FROM project_schema.project project
      INNER JOIN organization_schema.org_user actor
        ON actor.organization_id = project.organization_id AND actor.id = $2
        AND actor.is_deleted = FALSE
      LEFT JOIN project_schema.project_membership membership
        ON membership.organization_id = project.organization_id
        AND membership.project_id = project.id AND membership.org_user_id = actor.id
      WHERE project.organization_id = $1 AND project.id = $3 AND project.is_deleted = FALSE
      LIMIT 1
    `, [input.organization_id, input.actor_org_user_id, input.project_id]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      project: { id: row.project_id, organization_id: row.project_organization_id, status: row.project_status },
      actor_status: row.actor_status,
      actor_role: row.actor_role,
      membership: row.membership_role && row.membership_status
        ? { role: row.membership_role, status: row.membership_status }
        : null,
    };
  },

  async list_access_members(input) {
    const result = await db.query<{
      org_user_id: string; email: string; display_name: string;
      organization_role: "owner" | "member"; organization_status: "active" | "disabled";
      membership_id: string | null; membership_role: "project_admin" | "editor" | "viewer" | null;
      membership_status: "active" | "revoked" | null; membership_version: number | null;
      membership_created_by_id: string | null; membership_updated_by_id: string | null;
      membership_revoked_by_id: string | null; membership_revoked_at: Date | null;
      membership_created_at: Date | null; membership_updated_at: Date | null;
    }>(`
      SELECT org_user.id AS org_user_id, app_user.email, app_user.display_name,
        org_user.role AS organization_role, org_user.status AS organization_status,
        membership.id AS membership_id, membership.role AS membership_role,
        membership.status AS membership_status, membership.version AS membership_version,
        membership.created_by_id AS membership_created_by_id,
        membership.updated_by_id AS membership_updated_by_id,
        membership.revoked_by_id AS membership_revoked_by_id,
        membership.revoked_at AS membership_revoked_at,
        membership.created_at AS membership_created_at,
        membership.updated_at AS membership_updated_at
      FROM organization_schema.org_user org_user
      INNER JOIN user_schema.user app_user ON app_user.id = org_user.user_id AND app_user.is_deleted = FALSE
      LEFT JOIN project_schema.project_membership membership
        ON membership.organization_id = org_user.organization_id
        AND membership.project_id = $2 AND membership.org_user_id = org_user.id
      WHERE org_user.organization_id = $1 AND org_user.is_deleted = FALSE
        AND (org_user.status = 'active' OR membership.id IS NOT NULL)
      ORDER BY CASE WHEN org_user.role = 'owner' THEN 0 ELSE 1 END, lower(app_user.display_name), org_user.id
    `, [input.organization_id, input.project_id]);
    return result.rows.map((row): ProjectAccessMember => {
      const membership = row.membership_id ? map_membership({
        id: row.membership_id, organization_id: input.organization_id,
        project_id: input.project_id, org_user_id: row.org_user_id,
        role: row.membership_role!, status: row.membership_status!, version: row.membership_version!,
        created_by_id: row.membership_created_by_id!, updated_by_id: row.membership_updated_by_id!,
        revoked_by_id: row.membership_revoked_by_id, revoked_at: row.membership_revoked_at,
        created_at: row.membership_created_at!, updated_at: row.membership_updated_at!,
      }) : null;
      const owner = row.organization_role === "owner" && row.organization_status === "active";
      const active_membership = row.organization_status === "active" && membership?.status === "active";
      return {
        org_user_id: row.org_user_id, email: row.email, display_name: row.display_name,
        organization_role: row.organization_role, organization_status: row.organization_status,
        access_source: owner ? "organization_owner" : active_membership ? "project_membership" : null,
        membership: owner ? null : membership,
        effective_project_role: owner ? "project_admin" : active_membership ? membership.role : null,
      };
    });
  },

  async find_target_member(input) {
    const result = await db.query<{ role: "owner" | "member"; status: "active" | "disabled" }>(`
      SELECT role, status FROM organization_schema.org_user
      WHERE organization_id = $1 AND id = $2 AND is_deleted = FALSE LIMIT 1
    `, [input.organization_id, input.org_user_id]);
    return result.rows[0] ?? null;
  },

  async find_membership(input) {
    const result = await db.query<MembershipRow>(`
      SELECT ${membership_select} FROM project_schema.project_membership membership
      WHERE membership.organization_id = $1 AND membership.project_id = $2
        AND membership.org_user_id = $3 LIMIT 1
    `, [input.organization_id, input.project_id, input.org_user_id]);
    return result.rows[0] ? map_membership(result.rows[0]) : null;
  },

  async find_membership_by_id(input) {
    const result = await db.query<MembershipRow & { organization_status: "active" | "disabled" }>(`
      SELECT ${membership_select}, org_user.status AS organization_status
      FROM project_schema.project_membership membership
      INNER JOIN organization_schema.org_user org_user
        ON org_user.organization_id = membership.organization_id AND org_user.id = membership.org_user_id
      WHERE membership.organization_id = $1 AND membership.project_id = $2
        AND membership.id = $3 LIMIT 1
    `, [input.organization_id, input.project_id, input.membership_id]);
    const row = result.rows[0];
    return row ? { ...map_membership(row), organization_status: row.organization_status } : null;
  },

  async assign_membership(input) {
    const result = await db.query<MembershipRow>(`
      INSERT INTO project_schema.project_membership (
        id, organization_id, project_id, org_user_id, role, status, created_by_id, updated_by_id
      ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $6)
      ON CONFLICT (project_id, org_user_id) DO UPDATE SET
        role = EXCLUDED.role, status = 'active', revoked_by_id = NULL, revoked_at = NULL,
        updated_by_id = EXCLUDED.updated_by_id, updated_at = CURRENT_TIMESTAMP,
        version = project_membership.version + 1
      RETURNING ${membership_select.replaceAll("membership.", "")}
    `, [ulid(), input.organization_id, input.project_id, input.org_user_id, input.role, input.actor_org_user_id]);
    return map_membership(result.rows[0]!);
  },

  async change_membership_role(input) {
    const result = await db.query<MembershipRow>(`
      UPDATE project_schema.project_membership membership SET role = $1,
        updated_by_id = $2, updated_at = CURRENT_TIMESTAMP, version = version + 1
      WHERE organization_id = $3 AND project_id = $4 AND id = $5
        AND status = 'active' AND version = $6 RETURNING ${membership_select}
    `, [input.role, input.actor_org_user_id, input.organization_id, input.project_id, input.membership_id, input.expected_version]);
    return result.rows[0] ? map_membership(result.rows[0]) : null;
  },

  async remove_membership(input) {
    const result = await db.query<{ id: string }>(`
      UPDATE project_schema.project_membership SET status = 'revoked', revoked_by_id = $1,
        revoked_at = CURRENT_TIMESTAMP, updated_by_id = $1, updated_at = CURRENT_TIMESTAMP,
        version = version + 1 WHERE organization_id = $2 AND project_id = $3 AND id = $4
        AND status = 'active' AND version = $5 RETURNING id
    `, [input.actor_org_user_id, input.organization_id, input.project_id, input.membership_id, input.expected_version]);
    return result.rows.length === 1;
  },
});
