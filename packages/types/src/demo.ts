import { ARTIFACT_EDITION_STATUSES, DEMO_HOTSPOT_TYPES } from "@repo/constants";
import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  TrimmedIdParamSchema,
  TrimmedNonEmptyStringSchema,
} from "./common";

const RowVersionSchema = z.number().int().positive();
const nullable_trimmed_string = z.string().transform((value) => value.trim()).nullable();
const semantic_number_schema = z.union([
  z.number(),
  z.literal(Number.POSITIVE_INFINITY),
  z.literal(Number.NEGATIVE_INFINITY),
]);

export const InteractiveDemoVersionQuerySchema = z.object({
  project_version_id: TrimmedIdParamSchema,
}).strict();
export type InteractiveDemoVersionQuery = z.infer<typeof InteractiveDemoVersionQuerySchema>;

export const InteractiveDemoArtifactSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  created_by_id: IdSchema,
  created_at: IsoDateTimeStringSchema,
}).strict();
export type InteractiveDemoArtifact = z.infer<typeof InteractiveDemoArtifactSchema>;

export const InteractiveDemoEditionSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  interactive_demo_id: IdSchema,
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
export type InteractiveDemoEdition = z.infer<typeof InteractiveDemoEditionSchema>;

export const InteractiveDemoWorkingDraftSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  interactive_demo_edition_id: IdSchema,
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: RowVersionSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
}).strict();
export type InteractiveDemoWorkingDraft = z.infer<typeof InteractiveDemoWorkingDraftSchema>;

export const DemoSceneSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  interactive_demo_working_draft_id: IdSchema,
  source_capture_session_id: IdSchema.nullable(),
  source_capture_event_id: IdSchema.nullable(),
  source_capture_asset_id: IdSchema.nullable(),
  scene_index: z.number().int().positive(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  background_capture_asset_id: IdSchema.nullable(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: RowVersionSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
}).strict();
export type DemoScene = z.infer<typeof DemoSceneSchema>;

export const DemoTransitionSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  interactive_demo_working_draft_id: IdSchema,
  demo_hotspot_id: IdSchema,
  target_scene_id: IdSchema,
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: RowVersionSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
}).strict();
export type DemoTransition = z.infer<typeof DemoTransitionSchema>;

export const DemoHotspotSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  interactive_demo_working_draft_id: IdSchema,
  demo_scene_id: IdSchema,
  hotspot_type: z.enum(DEMO_HOTSPOT_TYPES),
  label: z.string().nullable(),
  content: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  transition: DemoTransitionSchema.nullable(),
  hotspot_index: z.number().int().positive(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: RowVersionSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
}).strict();
export type DemoHotspot = z.infer<typeof DemoHotspotSchema>;

const DemoTransitionInputSchema = z.object({
  target_scene_id: TrimmedIdParamSchema,
}).strict();

export const CreateInteractiveDemoRequestSchema = z.object({
  project_version_id: TrimmedIdParamSchema,
  title: TrimmedNonEmptyStringSchema,
  description: z.string().nullable().optional(),
}).strict();
export type CreateInteractiveDemoInput = z.infer<typeof CreateInteractiveDemoRequestSchema> & {
  source_capture_session_id?: string | null;
};

export const CreateInteractiveDemoFromCaptureRequestSchema = z.object({
  title: TrimmedNonEmptyStringSchema.optional(),
  description: z.string().nullable().optional(),
}).strict();
export type CreateInteractiveDemoFromCaptureInput = z.infer<
  typeof CreateInteractiveDemoFromCaptureRequestSchema
>;

export const UpdateInteractiveDemoRequestSchema = z.object({
  title: TrimmedNonEmptyStringSchema.optional(),
  description: z.string().nullable().optional(),
  expected_edition_version: RowVersionSchema,
}).strict();
export type UpdateInteractiveDemoInput = z.infer<typeof UpdateInteractiveDemoRequestSchema>;

export const UpdateInteractiveDemoEditionStatusRequestSchema = z.object({
  expected_edition_version: RowVersionSchema,
}).strict();

export const CreateDemoSceneRequestSchema = z.object({
  title: nullable_trimmed_string.optional(),
  description: nullable_trimmed_string.optional(),
  background_capture_asset_id: TrimmedIdParamSchema.nullable().optional(),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type CreateDemoSceneInput = z.infer<typeof CreateDemoSceneRequestSchema> & {
  source_capture_session_id?: string | null;
  source_capture_event_id?: string | null;
  source_capture_asset_id?: string | null;
};

export const UpdateDemoSceneRequestSchema = CreateDemoSceneRequestSchema;
export type UpdateDemoSceneInput = z.infer<typeof UpdateDemoSceneRequestSchema>;

export const ReorderDemoScenesRequestSchema = z.object({
  scene_ids: z.array(TrimmedIdParamSchema).min(1),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type ReorderDemoScenesInput = z.infer<typeof ReorderDemoScenesRequestSchema>;

export const CreateDemoHotspotRequestSchema = z.object({
  hotspot_type: z.enum(DEMO_HOTSPOT_TYPES),
  label: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  x: semantic_number_schema,
  y: semantic_number_schema,
  width: semantic_number_schema,
  height: semantic_number_schema,
  transition: DemoTransitionInputSchema.nullable().optional(),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type CreateDemoHotspotRequest = z.infer<typeof CreateDemoHotspotRequestSchema>;
export type CreateDemoHotspotInput = {
  hotspot_type: string;
  label?: string | null;
  content?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  transition?: { target_scene_id: string } | null;
  expected_working_draft_version?: number;
};

export const UpdateDemoHotspotRequestSchema = z.object({
  hotspot_type: z.enum(DEMO_HOTSPOT_TYPES).optional(),
  label: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  x: semantic_number_schema.optional(),
  y: semantic_number_schema.optional(),
  width: semantic_number_schema.optional(),
  height: semantic_number_schema.optional(),
  transition: DemoTransitionInputSchema.nullable().optional(),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type UpdateDemoHotspotRequest = z.infer<typeof UpdateDemoHotspotRequestSchema>;
export type UpdateDemoHotspotInput = {
  hotspot_type?: string;
  label?: string | null;
  content?: string | null;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  transition?: { target_scene_id: string } | null;
  expected_working_draft_version?: number;
};

export const ReorderDemoHotspotsRequestSchema = z.object({
  hotspot_ids: z.array(TrimmedIdParamSchema).min(1),
  expected_working_draft_version: RowVersionSchema,
}).strict();
export type ReorderDemoHotspotsInput = z.infer<typeof ReorderDemoHotspotsRequestSchema>;

export const InteractiveDemoContentDeleteQuerySchema = InteractiveDemoVersionQuerySchema.extend({
  expected_working_draft_version: z.coerce.number().int().positive(),
}).strict();

export const InteractiveDemoSummarySchema = z.object({
  artifact: InteractiveDemoArtifactSchema,
  edition: InteractiveDemoEditionSchema,
  authored_updated_at: IsoDateTimeStringSchema,
}).strict();

export const InteractiveDemoDetailResponseSchema = InteractiveDemoSummarySchema.extend({
  working_draft: InteractiveDemoWorkingDraftSchema,
}).strict();
export type InteractiveDemoDetailResponse = z.infer<
  typeof InteractiveDemoDetailResponseSchema
>;

export const CreateInteractiveDemoFromCaptureResponseSchema =
  InteractiveDemoDetailResponseSchema.extend({
    demo_scenes: z.array(DemoSceneSchema),
    redirect_path: z.string(),
  }).strict();
export type CreateInteractiveDemoFromCaptureResponse = z.infer<
  typeof CreateInteractiveDemoFromCaptureResponseSchema
>;

export const CreateInteractiveDemoResponseSchema = InteractiveDemoDetailResponseSchema;
export type CreateInteractiveDemoResponse = z.infer<typeof CreateInteractiveDemoResponseSchema>;

export const ProjectInteractiveDemoListResponseSchema = z.object({
  interactive_demo_editions: z.array(InteractiveDemoSummarySchema),
}).strict();
export type ProjectInteractiveDemoListResponse = z.infer<
  typeof ProjectInteractiveDemoListResponseSchema
>;

export const InteractiveDemoSceneResponseSchema = z.object({
  demo_scene: DemoSceneSchema,
  working_draft: InteractiveDemoWorkingDraftSchema,
}).strict();
export type InteractiveDemoSceneResponse = z.infer<typeof InteractiveDemoSceneResponseSchema>;
export type InteractiveDemoSceneUpdateResponse = InteractiveDemoSceneResponse;

export const InteractiveDemoSceneListResponseSchema = z.object({
  demo_scenes: z.array(DemoSceneSchema),
  working_draft: InteractiveDemoWorkingDraftSchema,
}).strict();
export type InteractiveDemoSceneListResponse = z.infer<
  typeof InteractiveDemoSceneListResponseSchema
>;

export const InteractiveDemoSceneReorderResponseSchema = InteractiveDemoSceneListResponseSchema;
export type InteractiveDemoSceneReorderResponse = z.infer<
  typeof InteractiveDemoSceneReorderResponseSchema
>;

export const InteractiveDemoHotspotResponseSchema = z.object({
  demo_hotspot: DemoHotspotSchema,
  working_draft: InteractiveDemoWorkingDraftSchema,
}).strict();
export type InteractiveDemoHotspotResponse = z.infer<typeof InteractiveDemoHotspotResponseSchema>;
export type InteractiveDemoHotspotCreateResponse = InteractiveDemoHotspotResponse;
export type InteractiveDemoHotspotUpdateResponse = InteractiveDemoHotspotResponse;

export const InteractiveDemoHotspotListResponseSchema = z.object({
  demo_hotspots: z.array(DemoHotspotSchema),
  working_draft: InteractiveDemoWorkingDraftSchema,
}).strict();
export type InteractiveDemoHotspotListResponse = z.infer<
  typeof InteractiveDemoHotspotListResponseSchema
>;

export const InteractiveDemoHotspotReorderResponseSchema =
  InteractiveDemoHotspotListResponseSchema;
export type InteractiveDemoHotspotReorderResponse = z.infer<
  typeof InteractiveDemoHotspotReorderResponseSchema
>;

// Temporary internal aliases ease the coordinated adapter transition.
export const InteractiveDemoSchema = InteractiveDemoEditionSchema;
export type InteractiveDemo = InteractiveDemoEdition;
