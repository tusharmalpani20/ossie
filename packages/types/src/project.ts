import {
  PROJECT_ACCESS_SOURCES,
  PROJECT_LIST_PURPOSES,
  PROJECT_ROLES,
  PROJECT_STATUSES,
} from "@repo/constants";
import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  TrimmedIdParamSchema,
} from "./common";
import { ProjectVersionSummarySchema } from "./project-version";

export const ProjectSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  name: z.string(),
  description: z.string().nullable(),
  slug: z.string().nullable(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  status: z.enum(PROJECT_STATUSES),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
  access: z.object({
    role: z.enum(PROJECT_ROLES),
    source: z.enum(PROJECT_ACCESS_SOURCES),
  }).strict(),
  default_project_version: ProjectVersionSummarySchema,
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectIdParamsSchema = z.object({
  id: TrimmedIdParamSchema,
});
export type ProjectIdParams = z.infer<typeof ProjectIdParamsSchema>;

export const CreateProjectRequestSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
}).passthrough();
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
export type CreateProjectInput = CreateProjectRequest;

export const UpdateProjectRequestSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
}).passthrough();
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;
export type UpdateProjectInput = UpdateProjectRequest;

export const ProjectListQuerySchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  purpose: z.enum(PROJECT_LIST_PURPOSES).optional(),
});
export type ProjectListQuery = z.infer<typeof ProjectListQuerySchema>;

export const ProjectResponseSchema = z.object({
  project: ProjectSchema,
});
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;
export type ProjectCreateResponse = ProjectResponse;
export type ProjectDetailResponse = ProjectResponse;
export type ProjectUpdateResponse = ProjectResponse;

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectSchema),
});
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;
