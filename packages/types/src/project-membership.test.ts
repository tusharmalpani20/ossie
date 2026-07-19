import { describe, expect, it } from "vitest";
import {
  AssignProjectMembershipRequestSchema,
  ChangeProjectMembershipRoleRequestSchema,
  ProjectMembershipListResponseSchema,
  RemoveProjectMembershipQuerySchema,
} from "./project-membership";

const membership = {
  id: "01J00000000000000000000001",
  organization_id: "01J00000000000000000000002",
  project_id: "01J00000000000000000000003",
  org_user_id: "01J00000000000000000000004",
  role: "editor",
  status: "active",
  version: 1,
  created_by_id: "01J00000000000000000000005",
  updated_by_id: "01J00000000000000000000005",
  revoked_by_id: null,
  revoked_at: null,
  created_at: "2026-07-19T12:00:00.000Z",
  updated_at: "2026-07-19T12:00:00.000Z",
};

describe("project membership contracts", () => {
  it("parses an administration roster without exposing unrelated member data", () => {
    const response = {
      members: [{
        org_user_id: membership.org_user_id,
        email: "editor@example.test",
        display_name: "Synthetic editor",
        organization_role: "member",
        organization_status: "active",
        access_source: "project_membership",
        membership,
        effective_project_role: "editor",
      }],
    };

    expect(ProjectMembershipListResponseSchema.parse(response)).toEqual(response);
  });

  it("accepts exact assignment, role-change, and removal inputs", () => {
    expect(AssignProjectMembershipRequestSchema.parse({
      org_user_id: membership.org_user_id,
      role: "viewer",
      ignored: true,
    })).toEqual({ org_user_id: membership.org_user_id, role: "viewer" });
    expect(ChangeProjectMembershipRoleRequestSchema.parse({
      role: "project_admin",
      expected_version: 2,
    })).toEqual({ role: "project_admin", expected_version: 2 });
    expect(RemoveProjectMembershipQuerySchema.parse({ expected_version: "3" }))
      .toEqual({ expected_version: 3 });
  });

  it("rejects owners as stored project roles and non-positive Row Versions", () => {
    expect(AssignProjectMembershipRequestSchema.safeParse({
      org_user_id: membership.org_user_id,
      role: "owner",
    }).success).toBe(false);
    expect(ChangeProjectMembershipRoleRequestSchema.safeParse({
      role: "editor",
      expected_version: 0,
    }).success).toBe(false);
  });
});
