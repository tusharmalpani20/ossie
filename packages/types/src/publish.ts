import {
  PUBLISH_ARTIFACT_TYPES,
  PUBLISH_LINK_ENTRY_MAX,
  PUBLISH_LINK_NAME_MAX_LENGTH,
  PUBLISH_LINK_STATUSES,
  PUBLISH_VISIBILITIES,
  PROJECT_VERSION_STATUSES,
  DEMO_HOTSPOT_TYPES,
  GUIDE_ANNOTATION_TYPES,
  GUIDE_BLOCK_TYPES,
  type PublishArtifactType,
  type PublishLinkStatus,
  type PublishVisibility,
} from "@repo/constants";
import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  NullableIsoDateTimeStringSchema,
  PositiveIntSchema,
  TrimmedIdParamSchema,
} from "./common";
import { ArtifactRevisionSummarySchema } from "./artifact-revision";

export type { PublishArtifactType, PublishLinkStatus, PublishVisibility };

const QueryPositiveIntSchema = z.coerce.number().int().positive();
const PublishLinkNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(PUBLISH_LINK_NAME_MAX_LENGTH);
const UniquePublishedArtifactIdsSchema = z
  .array(IdSchema)
  .min(1)
  .max(PUBLISH_LINK_ENTRY_MAX)
  .superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "Published Artifact IDs must be unique",
      });
    }
  });

export const PublisherSummarySchema = z
  .object({ id: IdSchema, display_name: z.string().min(1) })
  .strict();

export const PublishedArtifactSchema = z
  .object({
    id: IdSchema,
    artifact_type: z.enum(PUBLISH_ARTIFACT_TYPES),
    artifact_id: IdSchema,
    edition_id: IdSchema,
    project_version_id: IdSchema,
    revision_id: IdSchema,
    revision_number: PositiveIntSchema,
    publication_sequence: PositiveIntSchema,
    publisher: PublisherSummarySchema,
    published_at: IsoDateTimeStringSchema,
    created_at: IsoDateTimeStringSchema,
  })
  .strict();
export type PublishedArtifact = z.infer<typeof PublishedArtifactSchema>;

export const PublishLinkProjectVersionSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1),
    slug: z.string().min(1),
    status: z.enum(PROJECT_VERSION_STATUSES),
  })
  .strict();

export const PublishLinkEntrySchema = z
  .object({
    id: IdSchema,
    project_version: PublishLinkProjectVersionSchema,
    position: PositiveIntSchema,
    is_default: z.boolean(),
    version: PositiveIntSchema,
    published_artifact: PublishedArtifactSchema,
  })
  .strict();
export type PublishLinkEntry = z.infer<typeof PublishLinkEntrySchema>;

export const PublishLinkSchema = z
  .object({
    id: IdSchema,
    artifact_type: z.enum(PUBLISH_ARTIFACT_TYPES),
    artifact_id: IdSchema,
    name: PublishLinkNameSchema,
    slug: z.string().min(1).max(80),
    visibility: z.enum(PUBLISH_VISIBILITIES),
    status: z.enum(PUBLISH_LINK_STATUSES),
    expires_at: NullableIsoDateTimeStringSchema,
    password_protected: z.boolean(),
    version: PositiveIntSchema,
    entries: z.array(PublishLinkEntrySchema).max(PUBLISH_LINK_ENTRY_MAX),
    public_url: z.string().min(1),
    default_public_url: z.string().min(1),
    created_at: IsoDateTimeStringSchema,
    updated_at: IsoDateTimeStringSchema,
    revoked_at: NullableIsoDateTimeStringSchema,
  })
  .strict();
export type PublishLink = z.infer<typeof PublishLinkSchema>;

export const DocumentationPublishLinkSchema = z
  .object({
    id: IdSchema,
    resource_family: z.literal("documentation_site"),
    documentation_site_id: IdSchema,
    name: PublishLinkNameSchema,
    slug: z.string().min(1).max(80),
    visibility: z.enum(PUBLISH_VISIBILITIES),
    status: z.enum(PUBLISH_LINK_STATUSES),
    expires_at: NullableIsoDateTimeStringSchema,
    password_protected: z.boolean(),
    version: PositiveIntSchema,
    entries: z.array(z.unknown()).max(PUBLISH_LINK_ENTRY_MAX),
    public_url: z.string().min(1),
    default_public_url: z.string().min(1),
    created_at: IsoDateTimeStringSchema,
    updated_at: IsoDateTimeStringSchema,
    revoked_at: NullableIsoDateTimeStringSchema,
  })
  .strict();

export const PublicationVersionQuerySchema = z
  .object({ project_version_id: TrimmedIdParamSchema })
  .strict();

export const PublicationHistoryQuerySchema = z
  .object({
    project_version_id: TrimmedIdParamSchema,
    limit: QueryPositiveIntSchema.max(100).default(50),
    before_publication_sequence: QueryPositiveIntSchema.optional(),
  })
  .strict();

export const PublicationHistoryResponseSchema = z
  .object({
    publications: z.array(PublishedArtifactSchema),
    next_before_publication_sequence: PositiveIntSchema.nullable(),
  })
  .strict();

export const PublishLinkListQuerySchema = z
  .object({
    project_version_id: TrimmedIdParamSchema,
    status: z.enum(["active", "revoked", "all"]).default("active"),
    limit: QueryPositiveIntSchema.max(100).default(50),
    before_created_at: IsoDateTimeStringSchema.optional(),
    before_id: IdSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      (value.before_created_at === undefined) !==
      (value.before_id === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "Both cursor fields are required",
      });
    }
  });

export const PublishLinkListResponseSchema = z
  .object({
    publish_links: z.array(PublishLinkSchema),
    next_cursor: z
      .object({ created_at: IsoDateTimeStringSchema, id: IdSchema })
      .strict()
      .nullable(),
  })
  .strict();

const PublishLinkSelectionSchema = z
  .object({
    publish_link_id: IdSchema,
    expected_link_version: PositiveIntSchema,
  })
  .strict();

export const CreatePublishLinkDuringPublishSchema = z
  .object({
    name: PublishLinkNameSchema,
    visibility: z.enum(PUBLISH_VISIBILITIES),
    expires_at: NullableIsoDateTimeStringSchema,
    password: z.string().nullable(),
  })
  .strict();

export const PublishArtifactRequestSchema = z
  .object({
    expected_edition_version: PositiveIntSchema,
    expected_working_draft_version: PositiveIntSchema,
    update_publish_links: z
      .array(PublishLinkSelectionSchema)
      .max(PUBLISH_LINK_ENTRY_MAX),
    create_publish_link: CreatePublishLinkDuringPublishSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = value.update_publish_links.map(
      (selection) => selection.publish_link_id,
    );
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "Publish Link selections must be unique",
      });
    }
  });

export const PublishArtifactResponseSchema = z
  .object({
    revision: ArtifactRevisionSummarySchema,
    revision_reused: z.boolean(),
    published_artifact: PublishedArtifactSchema,
    updated_publish_links: z.array(PublishLinkSchema),
    created_publish_link: PublishLinkSchema.nullable(),
  })
  .strict();

const ManifestFieldsSchema = z
  .object({
    published_artifact_ids: UniquePublishedArtifactIdsSchema,
    default_published_artifact_id: IdSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      !value.published_artifact_ids.includes(
        value.default_published_artifact_id,
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Default Published Artifact must be in the manifest",
      });
    }
  });

export const CreatePublishLinkRequestSchema = z
  .object({
    name: PublishLinkNameSchema,
    visibility: z.enum(PUBLISH_VISIBILITIES),
    expires_at: NullableIsoDateTimeStringSchema,
    password: z.string().nullable(),
    published_artifact_ids: UniquePublishedArtifactIdsSchema,
    default_published_artifact_id: IdSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      !value.published_artifact_ids.includes(
        value.default_published_artifact_id,
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Default Published Artifact must be in the manifest",
      });
    }
  });

export const ReplacePublishLinkManifestRequestSchema =
  ManifestFieldsSchema.extend({
    expected_link_version: PositiveIntSchema,
  }).strict();

export const UpdatePublishLinkSettingsRequestSchema = z
  .object({
    expected_link_version: PositiveIntSchema,
    name: PublishLinkNameSchema.optional(),
    visibility: z.enum(PUBLISH_VISIBILITIES).optional(),
    expires_at: NullableIsoDateTimeStringSchema.optional(),
    password: z.string().nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.name === undefined &&
      value.visibility === undefined &&
      value.expires_at === undefined &&
      value.password === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "At least one setting is required",
      });
    }
  });

export const RollbackPublishLinkEntryRequestSchema = z
  .object({
    expected_link_version: PositiveIntSchema,
    target_published_artifact_id: IdSchema,
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export const RevokePublishLinkRequestSchema = z
  .object({ expected_link_version: PositiveIntSchema })
  .strict();

export const PublishLinkResponseSchema = z
  .object({ publish_link: PublishLinkSchema })
  .strict();
export const RollbackPublishLinkEntryResponseSchema = z
  .object({
    publish_link: PublishLinkSchema,
    entry: PublishLinkEntrySchema,
    previous_published_artifact: PublishedArtifactSchema,
  })
  .strict();

export const PublicPublishLinkQuerySchema = z
  .object({ artifact_type: z.enum(PUBLISH_ARTIFACT_TYPES) })
  .strict();

export const CreatePublicViewerSessionRequestSchema = z
  .object({ password: z.string() })
  .strict();

export const PublicPublishLinkEntrySchema = z
  .object({
    project_version_name: z.string().min(1),
    project_version_slug: z.string().min(1),
    position: PositiveIntSchema,
    is_default: z.boolean(),
    publication_sequence: PositiveIntSchema,
    public_url: z.string().min(1),
  })
  .strict();

export const PublicPublishLinkSchema = z
  .object({
    slug: z.string().min(1),
    artifact_type: z.enum(PUBLISH_ARTIFACT_TYPES),
    visibility: z.enum(PUBLISH_VISIBILITIES),
    status: z.literal("active"),
    expires_at: NullableIsoDateTimeStringSchema,
    password_protected: z.boolean(),
    entries: z
      .array(PublicPublishLinkEntrySchema)
      .min(1)
      .max(PUBLISH_LINK_ENTRY_MAX),
  })
  .strict();

export const PublicArtifactRevisionSchema = z
  .object({
    revision_number: PositiveIntSchema,
    title: z.string(),
    description: z.string().nullable(),
    created_at: IsoDateTimeStringSchema,
  })
  .strict();

export const PublicRevisionCaptureAssetSchema = z
  .object({
    id: IdSchema,
    status: z.enum(["active", "archived"]),
    file_url: z.string(),
    mime_type: z.string(),
    width: PositiveIntSchema.nullable(),
    height: PositiveIntSchema.nullable(),
  })
  .strict();

export const PublicGuideAnnotationSchema = z
  .object({
    annotation_type: z.enum(GUIDE_ANNOTATION_TYPES),
    annotation_index: PositiveIntSchema,
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .strict();

export const PublicGuideStepSchema = z
  .object({
    display_capture_asset_id: IdSchema.nullable(),
    screenshot_hidden: z.boolean(),
    title: z.string(),
    body: z.string().nullable(),
    annotations: z.array(PublicGuideAnnotationSchema),
  })
  .strict();

export const PublicGuideBlockSchema = z
  .object({
    id: IdSchema,
    block_type: z.enum(GUIDE_BLOCK_TYPES),
    title: z.string().nullable(),
    body: z.string().nullable(),
    block_index: PositiveIntSchema,
    step: PublicGuideStepSchema.nullable(),
  })
  .strict();

export const PublicDemoTransitionSchema = z
  .object({ id: IdSchema, target_demo_revision_scene_id: IdSchema })
  .strict();

export const PublicDemoHotspotSchema = z
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
    transition: PublicDemoTransitionSchema.nullable(),
  })
  .strict();

export const PublicDemoSceneSchema = z
  .object({
    id: IdSchema,
    background_capture_asset_id: IdSchema.nullable(),
    scene_index: PositiveIntSchema,
    title: z.string().nullable(),
    description: z.string().nullable(),
    hotspots: z.array(PublicDemoHotspotSchema),
  })
  .strict();

export const PublicGuidePublicationSchema = z
  .object({
    artifact_type: z.literal("guide"),
    publication_sequence: PositiveIntSchema,
    revision: PublicArtifactRevisionSchema,
    guide_blocks: z.array(PublicGuideBlockSchema),
    capture_assets: z.array(PublicRevisionCaptureAssetSchema),
  })
  .strict();

export const PublicInteractiveDemoPublicationSchema = z
  .object({
    artifact_type: z.literal("interactive_demo"),
    publication_sequence: PositiveIntSchema,
    revision: PublicArtifactRevisionSchema,
    demo_scenes: z.array(PublicDemoSceneSchema),
    capture_assets: z.array(PublicRevisionCaptureAssetSchema),
  })
  .strict();

export const PublicPublishedArtifactSchema = z.discriminatedUnion(
  "artifact_type",
  [PublicGuidePublicationSchema, PublicInteractiveDemoPublicationSchema],
);

export const PublicPublishLinkResponseSchema = z
  .object({
    publish_link: PublicPublishLinkSchema,
    selected_entry: PublicPublishLinkEntrySchema,
    published_artifact: PublicPublishedArtifactSchema,
    canonical_public_url: z.string().min(1),
  })
  .strict();

export type PublicationHistoryResponse = z.infer<
  typeof PublicationHistoryResponseSchema
>;
export type PublishArtifactRequest = z.infer<
  typeof PublishArtifactRequestSchema
>;
export type PublishArtifactResponse = z.infer<
  typeof PublishArtifactResponseSchema
>;
export type CreatePublishLinkRequest = z.infer<
  typeof CreatePublishLinkRequestSchema
>;
export type ReplacePublishLinkManifestRequest = z.infer<
  typeof ReplacePublishLinkManifestRequestSchema
>;
export type UpdatePublishLinkSettingsRequest = z.infer<
  typeof UpdatePublishLinkSettingsRequestSchema
>;
export type RollbackPublishLinkEntryRequest = z.infer<
  typeof RollbackPublishLinkEntryRequestSchema
>;
export type PublicPublishLink = z.infer<typeof PublicPublishLinkSchema>;
export type PublicPublishLinkResponse = z.infer<
  typeof PublicPublishLinkResponseSchema
>;
export type PublicPublishedArtifact = z.infer<
  typeof PublicPublishedArtifactSchema
>;
