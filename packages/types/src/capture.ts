import {
  CAPTURE_ASSET_STATUSES,
  CAPTURE_ASSET_TYPES,
  CAPTURE_EVENT_TYPES,
  CAPTURE_SESSION_SOURCE_TYPES,
  CAPTURE_SESSION_STATUSES,
  FILE_STORAGE_PROVIDERS,
} from "@repo/constants";
import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  NonNegativeNumberSchema,
  NullableIsoDateTimeStringSchema,
  PositiveIntSchema,
  PositiveNumberSchema,
  TrimmedIdParamSchema,
} from "./common";
import { ProjectVersionSummarySchema } from "./project-version";

export const ProjectCaptureSessionCollectionParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
});
export type ProjectCaptureSessionCollectionParams = z.infer<
  typeof ProjectCaptureSessionCollectionParamsSchema
>;

export const ProjectCaptureSessionParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
  id: TrimmedIdParamSchema,
});
export type ProjectCaptureSessionParams = z.infer<
  typeof ProjectCaptureSessionParamsSchema
>;

export const CaptureEventCollectionParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
  capture_session_id: TrimmedIdParamSchema,
});
export type CaptureEventCollectionParams = z.infer<
  typeof CaptureEventCollectionParamsSchema
>;

export const CaptureEventParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
  capture_session_id: TrimmedIdParamSchema,
  id: TrimmedIdParamSchema,
});
export type CaptureEventParams = z.infer<typeof CaptureEventParamsSchema>;

export const CaptureAssetCollectionParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
  capture_session_id: TrimmedIdParamSchema,
});
export type CaptureAssetCollectionParams = z.infer<
  typeof CaptureAssetCollectionParamsSchema
>;

export const ProjectCaptureAssetCollectionParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
});
export type ProjectCaptureAssetCollectionParams = z.infer<
  typeof ProjectCaptureAssetCollectionParamsSchema
>;

export const CaptureAssetParamsSchema = z.object({
  project_id: TrimmedIdParamSchema,
  capture_session_id: TrimmedIdParamSchema,
  id: TrimmedIdParamSchema,
});
export type CaptureAssetParams = z.infer<typeof CaptureAssetParamsSchema>;

export const CaptureSessionSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  project_version_id: IdSchema,
  project_version: ProjectVersionSummarySchema,
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(CAPTURE_SESSION_STATUSES),
  source_type: z.enum(CAPTURE_SESSION_SOURCE_TYPES),
  started_at: NullableIsoDateTimeStringSchema,
  completed_at: NullableIsoDateTimeStringSchema,
  canceled_at: NullableIsoDateTimeStringSchema,
  start_url: z.string().nullable(),
  browser_name: z.string().nullable(),
  browser_version: z.string().nullable(),
  operating_system: z.string().nullable(),
  viewport_width: PositiveIntSchema.nullable(),
  viewport_height: PositiveIntSchema.nullable(),
  device_pixel_ratio: PositiveNumberSchema.nullable(),
  user_agent: z.string().nullable(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
});
export type CaptureSession = z.infer<typeof CaptureSessionSchema>;

export const CreateCaptureSessionRequestSchema = z
  .object({
    name: z.string().trim().min(1),
    project_version_id: TrimmedIdParamSchema,
    start_immediately: z.boolean().optional(),
    description: z.string().nullable().optional(),
    source_type: z.enum(CAPTURE_SESSION_SOURCE_TYPES).optional(),
    start_url: z.string().nullable().optional(),
    browser_name: z.string().nullable().optional(),
    browser_version: z.string().nullable().optional(),
    operating_system: z.string().nullable().optional(),
    viewport_width: PositiveIntSchema.nullable().optional(),
    viewport_height: PositiveIntSchema.nullable().optional(),
    device_pixel_ratio: PositiveNumberSchema.nullable().optional(),
    user_agent: z.string().nullable().optional(),
    metadata: z.unknown().optional(),
  })
  .passthrough();
export type CreateCaptureSessionRequest = z.infer<
  typeof CreateCaptureSessionRequestSchema
>;
export type CreateCaptureSessionInput = CreateCaptureSessionRequest;

export const UpdateCaptureSessionRequestSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().nullable().optional(),
    status: z.enum(CAPTURE_SESSION_STATUSES).optional(),
    start_url: z.string().nullable().optional(),
    browser_name: z.string().nullable().optional(),
    browser_version: z.string().nullable().optional(),
    operating_system: z.string().nullable().optional(),
    viewport_width: PositiveIntSchema.nullable().optional(),
    viewport_height: PositiveIntSchema.nullable().optional(),
    device_pixel_ratio: PositiveNumberSchema.nullable().optional(),
    user_agent: z.string().nullable().optional(),
    metadata: z.unknown().optional(),
  })
  .passthrough();
export type UpdateCaptureSessionRequest = z.infer<
  typeof UpdateCaptureSessionRequestSchema
>;
export type UpdateCaptureSessionInput = UpdateCaptureSessionRequest;

export const CaptureSessionListQuerySchema = z
  .object({
    project_version_id: TrimmedIdParamSchema,
    status: z.enum(CAPTURE_SESSION_STATUSES).optional(),
  })
  .strict();
export type CaptureSessionListQuery = z.infer<
  typeof CaptureSessionListQuerySchema
>;

export const CaptureSessionResponseSchema = z.object({
  capture_session: CaptureSessionSchema,
});
export type CaptureSessionResponse = z.infer<
  typeof CaptureSessionResponseSchema
>;
export type CaptureSessionCreateResponse = CaptureSessionResponse;

export const CaptureSessionListResponseSchema = z.object({
  capture_sessions: z.array(CaptureSessionSchema),
});
export type CaptureSessionListResponse = z.infer<
  typeof CaptureSessionListResponseSchema
>;
export type ProjectCaptureSessionListResponse = CaptureSessionListResponse;

export const CompleteCaptureSessionResponseSchema = z.object({
  capture_session: CaptureSessionSchema,
  redirect: z.object({
    path: z.string(),
    reason: z.literal("capture_session_completed"),
  }),
});
export type CompleteCaptureSessionResponse = z.infer<
  typeof CompleteCaptureSessionResponseSchema
>;

export const CaptureEventSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  capture_session_id: IdSchema,
  capture_asset_id: IdSchema.nullable(),
  event_type: z.enum(CAPTURE_EVENT_TYPES),
  event_index: PositiveIntSchema,
  occurred_at: IsoDateTimeStringSchema,
  page_url: z.string().nullable(),
  page_title: z.string().nullable(),
  target_label: z.string().nullable(),
  target_selector: z.string().nullable(),
  target_role: z.string().nullable(),
  target_test_id: z.string().nullable(),
  target_text: z.string().nullable(),
  client_x: NonNegativeNumberSchema.nullable(),
  client_y: NonNegativeNumberSchema.nullable(),
  viewport_width: PositiveIntSchema.nullable(),
  viewport_height: PositiveIntSchema.nullable(),
  device_pixel_ratio: PositiveNumberSchema.nullable(),
  input_intent: z.string().nullable(),
  input_value_redacted: z.literal(true),
  note: z.string().nullable(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
});
export type CaptureEvent = z.infer<typeof CaptureEventSchema>;

export const CreateCaptureEventRequestSchema = z
  .object({
    event_type: z.enum(CAPTURE_EVENT_TYPES),
    event_index: PositiveIntSchema,
    capture_asset_id: TrimmedIdParamSchema.nullable().optional(),
    occurred_at: NullableIsoDateTimeStringSchema.optional(),
    page_url: z.string().nullable().optional(),
    page_title: z.string().nullable().optional(),
    target_label: z.string().nullable().optional(),
    target_selector: z.string().nullable().optional(),
    target_role: z.string().nullable().optional(),
    target_test_id: z.string().nullable().optional(),
    target_text: z.string().nullable().optional(),
    client_x: NonNegativeNumberSchema.nullable().optional(),
    client_y: NonNegativeNumberSchema.nullable().optional(),
    viewport_width: PositiveIntSchema.nullable().optional(),
    viewport_height: PositiveIntSchema.nullable().optional(),
    device_pixel_ratio: PositiveNumberSchema.nullable().optional(),
    input_intent: z.string().nullable().optional(),
    input_value_redacted: z.boolean().optional(),
    note: z.string().nullable().optional(),
    metadata: z.unknown().optional(),
  })
  .passthrough();
export type CreateCaptureEventRequest = z.infer<
  typeof CreateCaptureEventRequestSchema
>;
export type CreateCaptureEventInput = CreateCaptureEventRequest;

export const CaptureEventListQuerySchema = z.object({
  event_type: z.enum(CAPTURE_EVENT_TYPES).optional(),
});
export type CaptureEventListQuery = z.infer<typeof CaptureEventListQuerySchema>;

export const ReorderCaptureEventsRequestSchema = z.object({
  event_ids: z.array(TrimmedIdParamSchema).min(1),
});
export type ReorderCaptureEventsRequest = z.infer<
  typeof ReorderCaptureEventsRequestSchema
>;
export type ReorderCaptureEventsInput = ReorderCaptureEventsRequest;

export const UpdateCaptureEventRequestSchema = z
  .object({
    page_url: z.string().nullable().optional(),
    page_title: z.string().nullable().optional(),
    target_label: z.string().nullable().optional(),
    target_text: z.string().nullable().optional(),
    input_intent: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0);
export type UpdateCaptureEventRequest = z.infer<
  typeof UpdateCaptureEventRequestSchema
>;
export type UpdateCaptureEventInput = UpdateCaptureEventRequest;

export const CaptureEventResponseSchema = z.object({
  capture_event: CaptureEventSchema,
});
export type CaptureEventResponse = z.infer<typeof CaptureEventResponseSchema>;
export type CreateCaptureEventResponse = CaptureEventResponse;
export type UpdateCaptureEventResponse = CaptureEventResponse;

export const CaptureEventListResponseSchema = z.object({
  capture_events: z.array(CaptureEventSchema),
});
export type CaptureEventListResponse = z.infer<
  typeof CaptureEventListResponseSchema
>;

export const ReorderCaptureEventsResponseSchema =
  CaptureEventListResponseSchema;
export type ReorderCaptureEventsResponse = z.infer<
  typeof ReorderCaptureEventsResponseSchema
>;

export const CaptureAssetFileSchema = z.object({
  id: IdSchema,
  storage_provider: z.enum(FILE_STORAGE_PROVIDERS),
  mime_type: z.string(),
  size_bytes: z.number().int().nonnegative(),
  original_name: z.string().nullable(),
  checksum_sha256: z.string().nullable(),
});
export type CaptureAssetFile = z.infer<typeof CaptureAssetFileSchema>;

export const CaptureAssetSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  project_id: IdSchema,
  capture_session_id: IdSchema,
  file: CaptureAssetFileSchema,
  asset_type: z.enum(CAPTURE_ASSET_TYPES),
  status: z.enum(CAPTURE_ASSET_STATUSES),
  width: PositiveIntSchema.nullable(),
  height: PositiveIntSchema.nullable(),
  device_pixel_ratio: PositiveNumberSchema.nullable(),
  page_url: z.string().nullable(),
  page_title: z.string().nullable(),
  captured_at: IsoDateTimeStringSchema,
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  version: z.number().int(),
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
});
export type CaptureAsset = z.infer<typeof CaptureAssetSchema>;

export const CaptureAssetWithFileUrlSchema = CaptureAssetSchema.extend({
  file_url: z.string(),
});
export type CaptureAssetWithFileUrl = z.infer<
  typeof CaptureAssetWithFileUrlSchema
>;

export const CreateCaptureAssetRequestSchema = z
  .object({
    asset_type: z.enum(CAPTURE_ASSET_TYPES),
    width: PositiveIntSchema.nullable().optional(),
    height: PositiveIntSchema.nullable().optional(),
    device_pixel_ratio: PositiveNumberSchema.nullable().optional(),
    page_url: z.string().nullable().optional(),
    page_title: z.string().nullable().optional(),
    captured_at: NullableIsoDateTimeStringSchema.optional(),
    metadata: z.unknown().optional(),
    file: z
      .object({
        storage_provider: z.enum(FILE_STORAGE_PROVIDERS).optional(),
        storage_key: z.string().trim().min(1),
        mime_type: z.string().trim().min(1),
        size_bytes: z.number().int().nonnegative(),
        original_name: z.string().nullable().optional(),
        checksum_sha256: z.string().nullable().optional(),
        metadata: z.unknown().optional(),
      })
      .passthrough(),
  })
  .passthrough();
export type CreateCaptureAssetRequest = z.infer<
  typeof CreateCaptureAssetRequestSchema
>;
export type CreateCaptureAssetInput = CreateCaptureAssetRequest;

const OptionalQueryBooleanSchema = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true")
  .optional();

export const CaptureAssetListQuerySchema = z
  .object({
    asset_type: z.enum(CAPTURE_ASSET_TYPES).optional(),
    include_archived: OptionalQueryBooleanSchema,
  })
  .strict();
export type CaptureAssetListQuery = z.infer<typeof CaptureAssetListQuerySchema>;

export const ProjectCaptureAssetListQuerySchema = z
  .object({
    asset_type: z.enum(CAPTURE_ASSET_TYPES).optional(),
    project_version_id: TrimmedIdParamSchema,
  })
  .strict();
export type ProjectCaptureAssetListQuery = z.infer<
  typeof ProjectCaptureAssetListQuerySchema
>;

export const ReassignCaptureSessionProjectVersionRequestSchema = z
  .object({
    project_version_id: TrimmedIdParamSchema,
    expected_version: PositiveIntSchema,
  })
  .strict();
export type ReassignCaptureSessionProjectVersionRequest = z.infer<
  typeof ReassignCaptureSessionProjectVersionRequestSchema
>;
export const ReassignCaptureSessionProjectVersionResponseSchema =
  CaptureSessionResponseSchema;
export type ReassignCaptureSessionProjectVersionResponse = z.infer<
  typeof ReassignCaptureSessionProjectVersionResponseSchema
>;

export const CaptureAssetResponseSchema = z.object({
  capture_asset: CaptureAssetSchema,
});
export type CaptureAssetResponse = z.infer<typeof CaptureAssetResponseSchema>;
export type UploadCaptureAssetResponse = CaptureAssetResponse;

export const CaptureAssetListResponseSchema = z.object({
  capture_assets: z.array(CaptureAssetSchema),
});
export type CaptureAssetListResponse = z.infer<
  typeof CaptureAssetListResponseSchema
>;

export const CaptureAssetLifecycleRequestSchema = z
  .object({ expected_asset_version: PositiveIntSchema })
  .strict();
export type CaptureAssetLifecycleRequest = z.infer<
  typeof CaptureAssetLifecycleRequestSchema
>;

export const CaptureAssetLifecycleResponseSchema = z
  .object({ capture_asset: CaptureAssetSchema })
  .strict();

const AuthoredAssetDependencySchema = z
  .object({
    dependency_type: z.enum([
      "guide_working_draft",
      "interactive_demo_working_draft",
    ]),
    artifact_id: IdSchema,
    edition_id: IdSchema,
  })
  .strict();
const RevisionAssetDependencySchema = z
  .object({
    dependency_type: z.enum(["guide_revision", "interactive_demo_revision"]),
    artifact_id: IdSchema,
    edition_id: IdSchema,
    revision_number: PositiveIntSchema,
  })
  .strict();
const PublishedAssetDependencySchema = z
  .object({
    dependency_type: z.literal("published_artifact"),
    published_artifact_id: IdSchema,
    publication_sequence: PositiveIntSchema,
  })
  .strict();
const SharedFileAssetDependencySchema = z
  .object({
    dependency_type: z.literal("shared_file_asset"),
    capture_asset_id: IdSchema,
  })
  .strict();
const DocumentationDraftAssetDependencySchema = z
  .object({
    dependency_type: z.enum(["documentation_page", "documentation_snippet"]),
    documentation_site_id: IdSchema,
    site_edition_id: IdSchema,
    entity_id: IdSchema,
  })
  .strict();
const DocumentationRevisionAssetDependencySchema = z
  .object({
    dependency_type: z.literal("documentation_revision"),
    documentation_site_id: IdSchema,
    site_revision_id: IdSchema,
    revision_number: PositiveIntSchema,
  })
  .strict();
export const CaptureAssetDependencySchema = z.discriminatedUnion(
  "dependency_type",
  [
    AuthoredAssetDependencySchema,
    RevisionAssetDependencySchema,
    PublishedAssetDependencySchema,
    SharedFileAssetDependencySchema,
    DocumentationDraftAssetDependencySchema,
    DocumentationRevisionAssetDependencySchema,
  ],
);

export const CaptureAssetProtectionResponseSchema = z
  .object({
    capture_asset_id: IdSchema,
    status: z.enum(CAPTURE_ASSET_STATUSES),
    purge_operation_status: z
      .enum(["pending", "failed", "completed"])
      .nullable(),
    can_purge: z.boolean(),
    total_dependency_count: z.number().int().nonnegative(),
    dependencies: z.array(CaptureAssetDependencySchema).max(100),
  })
  .strict();

export const CaptureAssetPurgeResponseSchema = z
  .object({
    capture_asset_id: IdSchema,
    purge_operation_id: IdSchema,
    status: z.enum(["pending", "failed", "completed"]),
    attempt_count: PositiveIntSchema,
  })
  .strict();
export type CaptureAssetProtectionResponse = z.infer<
  typeof CaptureAssetProtectionResponseSchema
>;
export type CaptureAssetPurgeResponse = z.infer<
  typeof CaptureAssetPurgeResponseSchema
>;

export const ProjectCaptureAssetListResponseSchema = z.object({
  capture_assets: z.array(CaptureAssetWithFileUrlSchema),
});
export type ProjectCaptureAssetListResponse = z.infer<
  typeof ProjectCaptureAssetListResponseSchema
>;

export const CaptureSessionDetailResponseSchema = z.object({
  capture_session: CaptureSessionSchema,
  capture_events: z.array(CaptureEventSchema),
  capture_assets: z.array(CaptureAssetWithFileUrlSchema),
});
export type CaptureSessionDetailResponse = z.infer<
  typeof CaptureSessionDetailResponseSchema
>;
export type CaptureSessionDetail = CaptureSessionDetailResponse;
