import { describe, expect, it, vi } from "vitest";
import {
  build_project_access_service,
  build_project_membership_service,
  OrganizationMemberNotFoundError,
  ProjectMembershipConflictError,
  ProjectMembershipExistsError,
  ProjectMembershipNotRequiredError,
  ProjectMembershipUnchangedError,
  ProjectArchivedError,
  ProjectNotFoundError,
  ProjectPermissionDeniedError,
} from "./project-membership.service";

const project = {
  id: "project-1",
  organization_id: "organization-1",
  status: "active" as const,
};

describe("Project access service", () => {
  it("resolves an active current Organization owner as implicit Project Admin", async () => {
    const resolve_project_access = vi.fn().mockResolvedValue({
      project,
      actor_status: "active",
      actor_role: "owner",
      membership: null,
    });
    const service = build_project_access_service({ resolve_project_access });

    await expect(service.authorize({
      auth: { organization_id: "organization-1", actor_org_user_id: "owner-1" },
      project_id: project.id,
      capability: "project.settings.manage",
    })).resolves.toMatchObject({ role: "project_admin", source: "organization_owner" });
  });

  it("resolves current active membership and denies a known insufficient role", async () => {
    const resolve_project_access = vi.fn().mockResolvedValue({
      project,
      actor_status: "active",
      actor_role: "member",
      membership: { role: "viewer", status: "active" },
    });
    const service = build_project_access_service({ resolve_project_access });

    await expect(service.authorize({
      auth: { organization_id: "organization-1", actor_org_user_id: "viewer-1" },
      project_id: project.id,
      capability: "artifact.write",
    })).rejects.toBeInstanceOf(ProjectPermissionDeniedError);
  });

  it.each([
    ["missing project", null],
    ["inactive actor", { project, actor_status: "disabled", actor_role: "member", membership: { role: "editor", status: "active" } }],
    ["revoked membership", { project, actor_status: "active", actor_role: "member", membership: { role: "editor", status: "revoked" } }],
    ["no membership", { project, actor_status: "active", actor_role: "member", membership: null }],
  ])("hides %s", async (_name, resolved) => {
    const service = build_project_access_service({
      resolve_project_access: vi.fn().mockResolvedValue(resolved),
    });

    await expect(service.authorize({
      auth: { organization_id: "organization-1", actor_org_user_id: "member-1" },
      project_id: project.id,
      capability: "project.read",
    })).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("blocks child-content mutation on an archived Project after authorization", async () => {
    const service = build_project_access_service({
      resolve_project_access: vi.fn().mockResolvedValue({
        project: { ...project, status: "archived" },
        actor_status: "active",
        actor_role: "member",
        membership: { role: "editor", status: "active" },
      }),
    });

    await expect(service.authorize({
      auth: { organization_id: "organization-1", actor_org_user_id: "editor-1" },
      project_id: project.id,
      capability: "capture.write",
    })).rejects.toBeInstanceOf(ProjectArchivedError);
    await expect(service.authorize({
      auth: { organization_id: "organization-1", actor_org_user_id: "editor-1" },
      project_id: project.id,
      capability: "capture.read",
    })).resolves.toMatchObject({ role: "editor" });
  });
});

describe("Project membership lifecycle service", () => {
  const auth = { organization_id: "organization-1", actor_org_user_id: "admin-1" };
  const access = { authorize: vi.fn().mockResolvedValue({ role: "project_admin", source: "project_membership" }) };

  it("lists only after membership administration authorization", async () => {
    const list_access_members = vi.fn().mockResolvedValue([]);
    const service = build_project_membership_service({
      access,
      repository: { list_access_members } as never,
    });
    await expect(service.list({ auth, project_id: "project-1" })).resolves.toEqual({ members: [] });
    expect(access.authorize).toHaveBeenCalledWith({ auth, project_id: "project-1", capability: "project.membership.manage" });
  });

  it.each([
    ["owner", ProjectMembershipNotRequiredError],
    ["disabled", OrganizationMemberNotFoundError],
  ])("rejects assignment to a %s Organization Member", async (kind, ErrorType) => {
    const service = build_project_membership_service({
      access,
      repository: {
        find_target_member: vi.fn().mockResolvedValue({ role: kind === "owner" ? "owner" : "member", status: kind === "disabled" ? "disabled" : "active" }),
        find_membership: vi.fn(),
      } as never,
    });
    await expect(service.assign({ auth, project_id: "project-1", data: { org_user_id: "target-1", role: "editor" } }))
      .rejects.toBeInstanceOf(ErrorType);
  });

  it("rejects duplicate active assignment and same-role changes without writing", async () => {
    const active = { id: "membership-1", role: "editor", status: "active", version: 1 };
    const repository = {
      find_target_member: vi.fn().mockResolvedValue({ role: "member", status: "active" }),
      find_membership: vi.fn().mockResolvedValue(active),
      find_membership_by_id: vi.fn().mockResolvedValue({ ...active, organization_status: "active" }),
      assign_membership: vi.fn(),
      change_membership_role: vi.fn(),
    };
    const service = build_project_membership_service({ access, repository: repository as never });
    await expect(service.assign({ auth, project_id: "project-1", data: { org_user_id: "target-1", role: "editor" } }))
      .rejects.toBeInstanceOf(ProjectMembershipExistsError);
    await expect(service.change_role({ auth, project_id: "project-1", membership_id: active.id, data: { role: "editor", expected_version: 1 } }))
      .rejects.toBeInstanceOf(ProjectMembershipUnchangedError);
    expect(repository.assign_membership).not.toHaveBeenCalled();
    expect(repository.change_membership_role).not.toHaveBeenCalled();
  });

  it("maps stale role changes to a stable conflict", async () => {
    const service = build_project_membership_service({
      access,
      repository: {
        find_membership_by_id: vi.fn().mockResolvedValue({ id: "membership-1", role: "viewer", status: "active", version: 2, organization_status: "active" }),
        change_membership_role: vi.fn().mockResolvedValue(null),
      } as never,
    });
    await expect(service.change_role({ auth, project_id: "project-1", membership_id: "membership-1", data: { role: "editor", expected_version: 1 } }))
      .rejects.toBeInstanceOf(ProjectMembershipConflictError);
  });

  it("reports a stale same-role change as a conflict before no-op validation", async () => {
    const service = build_project_membership_service({
      access,
      repository: {
        find_membership_by_id: vi.fn().mockResolvedValue({ id: "membership-1", role: "editor", status: "active", version: 2, organization_status: "active" }),
        change_membership_role: vi.fn(),
      } as never,
    });
    await expect(service.change_role({ auth, project_id: "project-1", membership_id: "membership-1", data: { role: "editor", expected_version: 1 } }))
      .rejects.toBeInstanceOf(ProjectMembershipConflictError);
  });
});
