import {
  PROJECT_VERSION_RESOLUTION_KINDS,
  PROJECT_VERSION_STATUSES,
} from "@repo/constants";
import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  PositiveIntSchema,
  TrimmedIdParamSchema,
} from "./common";

const date_string = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");

const slug = z.string().trim().toLowerCase().min(1).max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nullable_description = z.string().trim().max(4000).nullable();

export const ProjectVersionSummarySchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  slug,
  status: z.enum(PROJECT_VERSION_STATUSES),
  position: PositiveIntSchema,
}).strict();
export type ProjectVersionSummary = z.infer<typeof ProjectVersionSummarySchema>;

export const ProjectVersionSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  slug,
  release_date: date_string.nullable(),
  position: PositiveIntSchema,
  status: z.enum(PROJECT_VERSION_STATUSES),
  is_default: z.boolean(),
  version: PositiveIntSchema,
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
}).strict();
export type ProjectVersion = z.infer<typeof ProjectVersionSchema>;

export const ProjectVersionAliasSchema = z.object({
  id: IdSchema,
  project_version_id: IdSchema,
  slug,
  created_by_id: IdSchema,
  created_at: IsoDateTimeStringSchema,
}).strict();
export type ProjectVersionAlias = z.infer<typeof ProjectVersionAliasSchema>;

export const ProjectVersionDetailSchema = ProjectVersionSchema.extend({
  aliases: z.array(ProjectVersionAliasSchema),
}).strict();
export type ProjectVersionDetail = z.infer<typeof ProjectVersionDetailSchema>;

export const CreateProjectVersionRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: nullable_description.optional(),
  slug: slug.optional(),
  release_date: date_string.nullable().optional(),
}).strict();
export type CreateProjectVersionRequest = z.infer<typeof CreateProjectVersionRequestSchema>;

export const UpdateProjectVersionRequestSchema = z.object({
  expected_version: PositiveIntSchema,
  name: z.string().trim().min(1).max(255).optional(),
  description: nullable_description.optional(),
  slug: slug.optional(),
  release_date: date_string.nullable().optional(),
}).strict().refine((value) => (
  value.name !== undefined || value.description !== undefined ||
  value.slug !== undefined || value.release_date !== undefined
), "At least one Project Version field must be provided");
export type UpdateProjectVersionRequest = z.infer<typeof UpdateProjectVersionRequestSchema>;

export const ProjectVersionExpectedVersionRequestSchema = z.object({
  expected_version: PositiveIntSchema,
}).strict();
export type ProjectVersionExpectedVersionRequest =
  z.infer<typeof ProjectVersionExpectedVersionRequestSchema>;

export const SetDefaultProjectVersionRequestSchema = z.object({
  expected_version: PositiveIntSchema,
  expected_project_row_version: PositiveIntSchema,
}).strict();
export type SetDefaultProjectVersionRequest =
  z.infer<typeof SetDefaultProjectVersionRequestSchema>;

export const ReorderProjectVersionsRequestSchema = z.object({
  project_versions: z.array(z.object({
    id: TrimmedIdParamSchema,
    expected_version: PositiveIntSchema,
  }).strict()).min(1),
}).strict().refine((value) => (
  new Set(value.project_versions.map(({ id }) => id)).size === value.project_versions.length
), "Project Version order contains duplicate ids");
export type ReorderProjectVersionsRequest =
  z.infer<typeof ReorderProjectVersionsRequestSchema>;

export const ProjectVersionListQuerySchema = z.object({
  status: z.enum(PROJECT_VERSION_STATUSES).optional(),
}).strict();
export type ProjectVersionListQuery = z.infer<typeof ProjectVersionListQuerySchema>;

export const ProjectVersionProjectParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
}).strict();
export const ProjectVersionIdParamsSchema = ProjectVersionProjectParamsSchema.extend({
  project_version_id: TrimmedIdParamSchema,
}).strict();
export const ProjectVersionSlugParamsSchema = ProjectVersionProjectParamsSchema.extend({
  slug,
}).strict();

export const ProjectVersionListResponseSchema = z.object({
  project_versions: z.array(ProjectVersionSchema),
}).strict();
export const ProjectVersionResponseSchema = z.object({
  project_version: ProjectVersionDetailSchema,
}).strict();
export const ProjectVersionResolutionResponseSchema = z.object({
  project_version: ProjectVersionDetailSchema,
  resolution: z.enum(PROJECT_VERSION_RESOLUTION_KINDS),
}).strict();

export type ProjectVersionListResponse = z.infer<typeof ProjectVersionListResponseSchema>;
export type ProjectVersionResponse = z.infer<typeof ProjectVersionResponseSchema>;
export type ProjectVersionResolutionResponse =
  z.infer<typeof ProjectVersionResolutionResponseSchema>;
