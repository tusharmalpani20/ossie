import {
  ARTIFACT_EDITION_STATUSES,
  GUIDE_ANNOTATION_TYPES,
  GUIDE_BLOCK_PLACEMENTS,
  GUIDE_BLOCK_TYPES,
  GUIDE_CREATABLE_BLOCK_TYPES,
  type ArtifactEditionStatus,
  type GuideAnnotationType,
  type GuideBlockType,
  type GuideCreatableBlockType,
} from "@repo/constants";
import { z } from "zod";
import { CaptureAssetWithFileUrlSchema } from "./capture";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  PositiveIntSchema,
  PositiveNumberSchema,
  TrimmedIdParamSchema,
} from "./common";

export type {
  ArtifactEditionStatus,
  GuideAnnotationType,
  GuideBlockType,
  GuideCreatableBlockType,
};

const RowVersionSchema = z.number().int().positive();
const NullableTrimmedStringSchema = z.string().transform((value) => value.trim()).nullable();

export const GuideProjectParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
}).strict();
export type GuideProjectParams = z.infer<typeof GuideProjectParamsSchema>;

export const GuideVersionQuerySchema = z.object({
  project_version_id: TrimmedIdParamSchema,
}).strict();
export type GuideVersionQuery = z.infer<typeof GuideVersionQuerySchema>;

export const GuideFromCaptureSessionParamsSchema = GuideProjectParamsSchema.extend({
  capture_session_id: TrimmedIdParamSchema,
}).strict();
export type GuideFromCaptureSessionParams = z.infer<
  typeof GuideFromCaptureSessionParamsSchema
>;

export const GuideDetailParamsSchema = GuideProjectParamsSchema.extend({
  guide_id: TrimmedIdParamSchema,
}).strict();
export type GuideDetailParams = z.infer<typeof GuideDetailParamsSchema>;

export const GuideStepParamsSchema = GuideDetailParamsSchema.extend({
  guide_step_id: TrimmedIdParamSchema,
}).strict();
export type GuideStepParams = z.infer<typeof GuideStepParamsSchema>;

export const GuideBlockParamsSchema = GuideDetailParamsSchema.extend({
  guide_block_id: TrimmedIdParamSchema,
}).strict();
export type GuideBlockParams = z.infer<typeof GuideBlockParamsSchema>;

export const GuideArtifactSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  created_by_id: IdSchema,
  created_at: IsoDateTimeStringSchema,
}).strict();
export type GuideArtifact = z.infer<typeof GuideArtifactSchema>;

export const GuideEditionSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  guide_id: IdSchema,
  project_version_id: IdSchema,
  source_capture_session_id: IdSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(ARTIFACT_EDITION_STATUSES),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: RowVersionSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
}).strict();
export type GuideEdition = z.infer<typeof GuideEditionSchema>;

export const GuideWorkingDraftSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  guide_edition_id: IdSchema,
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: RowVersionSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
}).strict();
export type GuideWorkingDraft = z.infer<typeof GuideWorkingDraftSchema>;

export const GuideAnnotationSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  guide_working_draft_id: IdSchema,
  guide_step_id: IdSchema,
  annotation_type: z.enum(GUIDE_ANNOTATION_TYPES),
  annotation_index: PositiveIntSchema,
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: RowVersionSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
}).strict();
export type GuideAnnotation = z.infer<typeof GuideAnnotationSchema>;

export const GuideScreenshotAnnotationSchema = z.object({
  id: IdSchema,
  type: z.enum(GUIDE_ANNOTATION_TYPES),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
}).strict();
export type GuideScreenshotAnnotation = z.infer<typeof GuideScreenshotAnnotationSchema>;

export const GuideStepSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  guide_working_draft_id: IdSchema,
  guide_block_id: IdSchema,
  source_capture_session_id: IdSchema.nullable(),
  source_capture_event_id: IdSchema.nullable(),
  source_capture_asset_id: IdSchema.nullable(),
  selected_capture_asset_id: IdSchema.nullable(),
  screenshot_hidden: z.boolean(),
  display_capture_asset_id: IdSchema.nullable(),
  title: z.string(),
  body: z.string().nullable(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: RowVersionSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
  annotations: z.array(GuideAnnotationSchema),
}).strict();
export type GuideStep = z.infer<typeof GuideStepSchema>;

export const GuideBlockSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  guide_working_draft_id: IdSchema,
  block_type: z.enum(GUIDE_BLOCK_TYPES),
  title: z.string().nullable(),
  body: z.string().nullable(),
  block_index: PositiveIntSchema,
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: RowVersionSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
  step: GuideStepSchema.nullable(),
}).strict();
export type GuideBlock = z.infer<typeof GuideBlockSchema>;

export const GuideSourceCaptureAssetSchema = z.object({
  id: IdSchema,
  capture_session_id: IdSchema,
  asset_type: CaptureAssetWithFileUrlSchema.shape.asset_type,
  width: PositiveIntSchema.nullable(),
  height: PositiveIntSchema.nullable(),
  device_pixel_ratio: PositiveNumberSchema.nullable(),
  page_url: z.string().nullable(),
  page_title: z.string().nullable(),
  captured_at: IsoDateTimeStringSchema,
  file_url: z.string(),
  file: z.object({
    id: IdSchema,
    original_name: z.string().nullable(),
    mime_type: z.string(),
    size_bytes: z.number().int().nonnegative(),
  }).strict(),
}).strict();
export type GuideSourceCaptureAsset = z.infer<typeof GuideSourceCaptureAssetSchema>;

export const GuideSummarySchema = z.object({
  artifact: GuideArtifactSchema,
  edition: GuideEditionSchema,
  authored_updated_at: IsoDateTimeStringSchema,
}).strict();
export type GuideSummary = z.infer<typeof GuideSummarySchema>;

export const GuideDetailSchema = GuideSummarySchema.extend({
  working_draft: GuideWorkingDraftSchema,
  guide_blocks: z.array(GuideBlockSchema),
  source_capture_assets: z.array(GuideSourceCaptureAssetSchema),
}).strict();
export type GuideDetail = z.infer<typeof GuideDetailSchema>;

export const GuideMarkdownExportSchema = z.object({
  filename: z.string(),
  markdown: z.string(),
}).strict();
export type GuideMarkdownExport = z.infer<typeof GuideMarkdownExportSchema>;

export const CreateGuideFromCaptureRequestSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  selected_capture_event_ids: z.array(TrimmedIdParamSchema).optional(),
}).strict();
export type CreateGuideFromCaptureInput = z.infer<
  typeof CreateGuideFromCaptureRequestSchema
>;

export const UpdateGuideRequestSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: NullableTrimmedStringSchema.optional(),
  expected_edition_version: RowVersionSchema,
}).strict();
export type UpdateGuideInput = z.infer<typeof UpdateGuideRequestSchema>;

export const UpdateGuideEditionStatusRequestSchema = z.object({
  expected_edition_version: RowVersionSchema,
}).strict();
export type UpdateGuideEditionStatusInput = z.infer<
  typeof UpdateGuideEditionStatusRequestSchema
>;

export const UpdateGuideStepRequestSchema = z.object({
  title: z.string().optional(),
  body: z.string().nullable().optional(),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type UpdateGuideStepInput = z.infer<typeof UpdateGuideStepRequestSchema>;

export const ReorderGuideBlocksRequestSchema = z.object({
  block_ids: z.array(TrimmedIdParamSchema).min(1),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type ReorderGuideBlocksInput = z.infer<typeof ReorderGuideBlocksRequestSchema>;

const GuideBlockPositionSchema = z.object({
  placement: z.enum(GUIDE_BLOCK_PLACEMENTS),
  guide_block_id: TrimmedIdParamSchema,
}).strict();

export const CreateGuideBlockRequestSchema = z.object({
  block_type: z.enum(GUIDE_CREATABLE_BLOCK_TYPES),
  position: GuideBlockPositionSchema.nullable().optional(),
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  step: z.object({
    title: z.string().optional(),
    body: z.string().nullable().optional(),
  }).strict().nullable().optional(),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type CreateGuideBlockInput = z.infer<typeof CreateGuideBlockRequestSchema>;

export const UpdateGuideBlockRequestSchema = z.object({
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type UpdateGuideBlockInput = z.infer<typeof UpdateGuideBlockRequestSchema>;

export const UpdateGuideBlockScreenshotRequestSchema = z.object({
  capture_asset_id: TrimmedIdParamSchema.nullable(),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type UpdateGuideBlockScreenshotInput = z.infer<
  typeof UpdateGuideBlockScreenshotRequestSchema
>;

const UpdateGuideScreenshotAnnotationSchema = z.object({
  id: TrimmedIdParamSchema.optional(),
  type: z.enum(GUIDE_ANNOTATION_TYPES),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
}).strict();

export const UpdateGuideBlockAnnotationsRequestSchema = z.object({
  annotations: z.array(UpdateGuideScreenshotAnnotationSchema).max(10),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type UpdateGuideBlockAnnotationsInput = z.infer<
  typeof UpdateGuideBlockAnnotationsRequestSchema
>;

export const GuideContentDeleteQuerySchema = GuideVersionQuerySchema.extend({
  expected_working_draft_version: z.coerce.number().int().positive(),
}).strict();
export type GuideContentDeleteQuery = z.infer<typeof GuideContentDeleteQuerySchema>;

export const ProjectGuideListResponseSchema = z.object({
  guide_editions: z.array(GuideSummarySchema),
}).strict();
export type ProjectGuideListResponse = z.infer<typeof ProjectGuideListResponseSchema>;

export const UpdateGuideResponseSchema = z.object({
  edition: GuideEditionSchema,
}).strict();
export type UpdateGuideResponse = z.infer<typeof UpdateGuideResponseSchema>;

export const UpdateGuideStepResponseSchema = z.object({
  guide_step: GuideStepSchema,
  working_draft: GuideWorkingDraftSchema,
}).strict();
export type UpdateGuideStepResponse = z.infer<typeof UpdateGuideStepResponseSchema>;

export const GuideBlocksResponseSchema = z.object({
  guide_blocks: z.array(GuideBlockSchema),
  working_draft: GuideWorkingDraftSchema,
}).strict();
export type GuideBlocksResponse = z.infer<typeof GuideBlocksResponseSchema>;

export const GuideBlockResponseSchema = z.object({
  guide_block: GuideBlockSchema,
  working_draft: GuideWorkingDraftSchema,
}).strict();
export type GuideBlockResponse = z.infer<typeof GuideBlockResponseSchema>;

export const UploadGuideBlockScreenshotResponseSchema = z.object({
  guide_block: GuideBlockSchema,
  working_draft: GuideWorkingDraftSchema,
  capture_asset: CaptureAssetWithFileUrlSchema,
}).strict();
export type UploadGuideBlockScreenshotResponse = z.infer<
  typeof UploadGuideBlockScreenshotResponseSchema
>;

// Temporary internal aliases ease the coordinated adapter transition. Public
// response envelopes above expose the accepted Artifact/Edition model.
export const GuideSchema = GuideEditionSchema;
export type Guide = GuideEdition;
export type GuideStatus = ArtifactEditionStatus;
