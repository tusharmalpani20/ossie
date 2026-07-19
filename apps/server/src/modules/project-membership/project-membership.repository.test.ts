import { describe, expect, it, vi } from "vitest";
import { build_project_membership_repository } from "./project-membership.repository";

describe("project membership repository", () => {
  it("resolves current actor, Project, and membership under one Organization predicate", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{
      project_id: "project-1", project_organization_id: "organization-1",
      project_status: "active", actor_status: "active", actor_role: "member",
      membership_role: "editor", membership_status: "active",
    }] });
    const repository = build_project_membership_repository({ query });
    await expect(repository.resolve_project_access({
      organization_id: "organization-1", actor_org_user_id: "member-1", project_id: "project-1",
    })).resolves.toMatchObject({ membership: { role: "editor", status: "active" } });
    expect(query.mock.calls[0]?.[0]).toContain("project.organization_id = $1");
    expect(query.mock.calls[0]?.[0]).toContain("actor.id = $2");
    expect(query.mock.calls[0]?.[0]).toContain("project.id = $3");
  });

  it("reactivates the stable membership row without creating a second identity", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{
      id: "membership-1", organization_id: "organization-1", project_id: "project-1",
      org_user_id: "member-1", role: "viewer", status: "active", version: 2,
      created_by_id: "admin-1", updated_by_id: "admin-1", revoked_by_id: null,
      revoked_at: null, created_at: new Date("2026-07-19T00:00:00.000Z"),
      updated_at: new Date("2026-07-19T00:01:00.000Z"),
    }] });
    const repository = build_project_membership_repository({ query });
    await repository.assign_membership({
      organization_id: "organization-1", project_id: "project-1", org_user_id: "member-1",
      role: "viewer", actor_org_user_id: "admin-1",
    });
    expect(query.mock.calls[0]?.[0]).toContain("ON CONFLICT (project_id, org_user_id) DO UPDATE");
    expect(query.mock.calls[0]?.[0]).toContain("target.status = 'active'");
    expect(query.mock.calls[0]?.[0]).toContain("target.role = 'member'");
    expect(query.mock.calls[0]?.[0]).toContain("WHERE project_membership.status = 'revoked'");
    expect(query.mock.calls[0]?.[0]).toContain("version = project_membership.version + 1");
  });

  it("returns no assignment when the target or conflict is no longer eligible", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const repository = build_project_membership_repository({ query });

    await expect(repository.assign_membership({
      organization_id: "organization-1", project_id: "project-1", org_user_id: "member-1",
      role: "viewer", actor_org_user_id: "admin-1",
    })).resolves.toBeNull();
  });
});
