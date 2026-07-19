import {
  ARTIFACT_REVISION_TRIGGERS,
  DEMO_HOTSPOT_TYPES,
  GUIDE_ANNOTATION_TYPES,
  GUIDE_BLOCK_TYPES,
} from "@repo/constants";
import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  PositiveIntSchema,
  TrimmedIdParamSchema,
} from "./common";
import { InteractiveDemoDetailResponseSchema, DemoSceneSchema } from "./demo";
import { GuideDetailSchema } from "./guide";

const QueryPositiveIntSchema = z.coerce.number().int().positive();

export const ArtifactRevisionTriggerSchema = z.enum(ARTIFACT_REVISION_TRIGGERS);

export const ArtifactRevisionSummarySchema = z
  .object({
    id: IdSchema,
    edition_id: IdSchema,
    revision_number: PositiveIntSchema,
    trigger: ArtifactRevisionTriggerSchema,
    title: z.string().min(1),
    description: z.string().nullable(),
    source_working_draft_version: PositiveIntSchema,
    created_by_id: IdSchema,
    created_at: IsoDateTimeStringSchema,
  })
  .strict();

export const ArtifactRevisionVersionQuerySchema = z
  .object({ project_version_id: TrimmedIdParamSchema })
  .strict();

export const ArtifactRevisionListQuerySchema = z
  .object({
    limit: QueryPositiveIntSchema.max(100).default(50),
    before_revision_number: QueryPositiveIntSchema.optional(),
  })
  .strict();

export const ArtifactRevisionHistoryQuerySchema = z
  .object({
    project_version_id: TrimmedIdParamSchema,
    limit: QueryPositiveIntSchema.max(100).default(50),
    before_revision_number: QueryPositiveIntSchema.optional(),
  })
  .strict();

export const ArtifactRevisionListResponseSchema = z
  .object({
    revisions: z.array(ArtifactRevisionSummarySchema),
    next_before_revision_number: PositiveIntSchema.nullable(),
  })
  .strict();

export const ArtifactRevisionWriteRequestSchema = z
  .object({
    expected_edition_version: PositiveIntSchema,
    expected_working_draft_version: PositiveIntSchema,
  })
  .strict();

export const CheckpointArtifactRevisionRequestSchema =
  ArtifactRevisionWriteRequestSchema;
export const RestoreArtifactRevisionRequestSchema =
  ArtifactRevisionWriteRequestSchema;

export const ArtifactRevisionParamsSchema = z
  .object({
    project_id: TrimmedIdParamSchema,
    artifact_id: TrimmedIdParamSchema,
    revision_number: QueryPositiveIntSchema,
  })
  .strict();

export const CheckpointArtifactRevisionResponseSchema = z
  .object({
    revision: ArtifactRevisionSummarySchema,
    reused: z.boolean(),
  })
  .strict();

export const RevisionCaptureAssetSchema = z
  .object({
    id: IdSchema,
    capture_session_id: IdSchema,
    status: z.enum(["active", "archived"]),
    file_url: z.string(),
    mime_type: z.string(),
    width: PositiveIntSchema.nullable(),
    height: PositiveIntSchema.nullable(),
  })
  .strict();

export const GuideRevisionAnnotationSchema = z
  .object({
    id: IdSchema,
    annotation_type: z.enum(GUIDE_ANNOTATION_TYPES),
    annotation_index: PositiveIntSchema,
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .strict();

export const GuideRevisionStepSchema = z
  .object({
    id: IdSchema,
    source_capture_session_id: IdSchema.nullable(),
    source_capture_event_id: IdSchema.nullable(),
    source_capture_asset_id: IdSchema.nullable(),
    selected_capture_asset_id: IdSchema.nullable(),
    display_capture_asset_id: IdSchema.nullable(),
    screenshot_hidden: z.boolean(),
    title: z.string(),
    body: z.string().nullable(),
    annotations: z.array(GuideRevisionAnnotationSchema),
  })
  .strict();

export const GuideRevisionBlockSchema = z
  .object({
    id: IdSchema,
    block_type: z.enum(GUIDE_BLOCK_TYPES),
    title: z.string().nullable(),
    body: z.string().nullable(),
    block_index: PositiveIntSchema,
    step: GuideRevisionStepSchema.nullable(),
  })
  .strict();

export const GuideRevisionDetailSchema = z
  .object({
    revision: ArtifactRevisionSummarySchema,
    guide_blocks: z.array(GuideRevisionBlockSchema),
    capture_assets: z.array(RevisionCaptureAssetSchema).default([]),
  })
  .strict();

export const DemoRevisionTransitionSchema = z
  .object({ id: IdSchema, target_demo_revision_scene_id: IdSchema })
  .strict();
export const DemoRevisionHotspotSchema = z
  .object({
    id: IdSchema,
    hotspot_type: z.enum(DEMO_HOTSPOT_TYPES),
    label: z.string().nullable(),
    content: z.string().nullable(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    hotspot_index: PositiveIntSchema,
    transition: DemoRevisionTransitionSchema.nullable(),
  })
  .strict();
export const DemoRevisionSceneSchema = z
  .object({
    id: IdSchema,
    source_capture_session_id: IdSchema.nullable(),
    source_capture_event_id: IdSchema.nullable(),
    source_capture_asset_id: IdSchema.nullable(),
    background_capture_asset_id: IdSchema.nullable(),
    scene_index: PositiveIntSchema,
    title: z.string().nullable(),
    description: z.string().nullable(),
    hotspots: z.array(DemoRevisionHotspotSchema),
  })
  .strict();
export const InteractiveDemoRevisionDetailSchema = z
  .object({
    revision: ArtifactRevisionSummarySchema,
    demo_scenes: z.array(DemoRevisionSceneSchema),
    capture_assets: z.array(RevisionCaptureAssetSchema).default([]),
  })
  .strict();

export const GuideRevisionRestoreResponseSchema = GuideDetailSchema.extend({
  revision: ArtifactRevisionSummarySchema,
  restored: z.boolean(),
}).strict();
export const InteractiveDemoRevisionRestoreResponseSchema =
  InteractiveDemoDetailResponseSchema.extend({
    demo_scenes: z.array(DemoSceneSchema),
    revision: ArtifactRevisionSummarySchema,
    restored: z.boolean(),
  }).strict();

export type ArtifactRevisionSummary = z.infer<
  typeof ArtifactRevisionSummarySchema
>;
export type ArtifactRevisionListQuery = z.infer<
  typeof ArtifactRevisionListQuerySchema
>;
export type ArtifactRevisionWriteRequest = z.infer<
  typeof ArtifactRevisionWriteRequestSchema
>;
export type GuideRevisionDetail = z.infer<typeof GuideRevisionDetailSchema>;
export type InteractiveDemoRevisionDetail = z.infer<
  typeof InteractiveDemoRevisionDetailSchema
>;
export type GuideRevisionRestoreResponse = z.infer<
  typeof GuideRevisionRestoreResponseSchema
>;
export type InteractiveDemoRevisionRestoreResponse = z.infer<
  typeof InteractiveDemoRevisionRestoreResponseSchema
>;
