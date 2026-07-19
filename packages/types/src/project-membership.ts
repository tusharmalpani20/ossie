import {
  ORGANIZATION_MEMBER_STATUSES,
  ORGANIZATION_ROLES,
  PROJECT_ACCESS_SOURCES,
  PROJECT_MEMBERSHIP_STATUSES,
  PROJECT_ROLES,
} from "@repo/constants";
import { z } from "zod";
import { IdSchema, IsoDateTimeStringSchema } from "./common";

export const ProjectMembershipSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  org_user_id: IdSchema,
  role: z.enum(PROJECT_ROLES),
  status: z.enum(PROJECT_MEMBERSHIP_STATUSES),
  version: z.number().int().positive(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  revoked_by_id: IdSchema.nullable(),
  revoked_at: IsoDateTimeStringSchema.nullable(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
}).strict();
export type ProjectMembership = z.infer<typeof ProjectMembershipSchema>;

export const ProjectAccessMemberSchema = z.object({
  org_user_id: IdSchema,
  email: z.string().email(),
  display_name: z.string().min(1),
  organization_role: z.enum(ORGANIZATION_ROLES),
  organization_status: z.enum(ORGANIZATION_MEMBER_STATUSES),
  access_source: z.enum(PROJECT_ACCESS_SOURCES).nullable(),
  membership: ProjectMembershipSchema.nullable(),
  effective_project_role: z.enum(PROJECT_ROLES).nullable(),
}).strict();
export type ProjectAccessMember = z.infer<typeof ProjectAccessMemberSchema>;

export const ProjectMembershipListResponseSchema = z.object({
  members: z.array(ProjectAccessMemberSchema),
}).strict();
export type ProjectMembershipListResponse = z.infer<typeof ProjectMembershipListResponseSchema>;

export const AssignProjectMembershipRequestSchema = z.object({
  org_user_id: IdSchema,
  role: z.enum(PROJECT_ROLES),
});

export const ChangeProjectMembershipRoleRequestSchema = z.object({
  role: z.enum(PROJECT_ROLES),
  expected_version: z.coerce.number().int().positive(),
});

export const RemoveProjectMembershipQuerySchema = z.object({
  expected_version: z.coerce.number().int().positive(),
});

export const ProjectMembershipResponseSchema = z.object({
  membership: ProjectMembershipSchema,
}).strict();
export type ProjectMembershipResponse = z.infer<typeof ProjectMembershipResponseSchema>;
