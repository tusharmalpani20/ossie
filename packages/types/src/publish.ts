import {
  PUBLISH_ARTIFACT_TYPES,
  PUBLISH_LINK_STATUSES,
  PUBLISH_VISIBILITIES,
  type PublishArtifactType,
  type PublishLinkStatus,
  type PublishVisibility,
} from "@repo/constants";
import { z } from "zod";
import {
  GUIDE_BLOCK_TYPES,
  DEMO_HOTSPOT_TYPES,
} from "@repo/constants";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  NullableIsoDateTimeStringSchema,
} from "./common";
import { CaptureAssetWithFileUrlSchema } from "./capture";

const PublishedGuideSnapshotBlockContentSchema = z.object({
  title: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  annotations: z.array(z.object({
    id: IdSchema,
    type: z.enum(["highlight"]),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })).nullable().optional(),
}).strict();

export type {
  PublishArtifactType,
  PublishLinkStatus,
  PublishVisibility,
};

export const PublishLinkSchema = z.object({
  id: IdSchema,
  artifact_type: z.enum(PUBLISH_ARTIFACT_TYPES),
  artifact_id: IdSchema,
  published_artifact_id: IdSchema,
  slug: z.string().min(1),
  visibility: z.enum(PUBLISH_VISIBILITIES),
  status: z.enum(PUBLISH_LINK_STATUSES),
  published_at: IsoDateTimeStringSchema,
  revoked_at: NullableIsoDateTimeStringSchema,
  expires_at: NullableIsoDateTimeStringSchema,
  password_protected: z.boolean(),
  public_url: z.string(),
});
export type PublishLink = z.infer<typeof PublishLinkSchema>;

export const PublishedArtifactSchema = z.object({
  id: IdSchema,
  artifact_type: z.enum(PUBLISH_ARTIFACT_TYPES),
  artifact_id: IdSchema,
  version_number: z.number().int().positive(),
  title: z.string(),
  published_at: IsoDateTimeStringSchema,
});
export type PublishedArtifact = z.infer<typeof PublishedArtifactSchema>;

export const PublishStatusResponseSchema = z.object({
  publish_link: PublishLinkSchema.nullable(),
  published_artifact: PublishedArtifactSchema.nullable(),
});
export type PublishStatusResponse = z.infer<typeof PublishStatusResponseSchema>;

export const PublishResultSchema = z.object({
  publish_link: PublishLinkSchema,
  published_artifact: PublishedArtifactSchema,
});
export type PublishResult = z.infer<typeof PublishResultSchema>;
export type GuidePublishStatusResponse = PublishStatusResponse;
export type GuidePublishResult = PublishResult;
export type InteractiveDemoPublishStatusResponse = PublishStatusResponse;
export type InteractiveDemoPublishResult = PublishResult;

export const RevokePublishResultSchema = z.object({
  publish_link: PublishLinkSchema,
});
export type RevokePublishResult = z.infer<typeof RevokePublishResultSchema>;

export const PublicPublishLinkSchema = PublishLinkSchema.pick({
  slug: true,
  artifact_type: true,
  visibility: true,
  status: true,
  expires_at: true,
  password_protected: true,
});
export type PublicPublishLink = z.infer<typeof PublicPublishLinkSchema>;

export const PublicPublishedArtifactSchema = PublishedArtifactSchema.extend({
  snapshot: z.unknown(),
});
export type PublicPublishedArtifact = z.infer<typeof PublicPublishedArtifactSchema>;

export const PublicPublishLinkResponseSchema = z.object({
  publish_link: PublicPublishLinkSchema,
  published_artifact: PublicPublishedArtifactSchema,
});
export type PublicPublishLinkResponse = z.infer<typeof PublicPublishLinkResponseSchema>;

export const UpdatePublishAccessRequestSchema = z.object({
  visibility: z.enum(PUBLISH_VISIBILITIES),
  expires_at: z.string().nullable().optional().transform((value) => value ?? null),
}).passthrough();
export type UpdatePublishAccessInput = z.infer<typeof UpdatePublishAccessRequestSchema>;

export const UpdatePublishPasswordRequestSchema = z.object({
  password: z.string().nullable(),
}).passthrough();
export type UpdatePublishPasswordInput = z.infer<typeof UpdatePublishPasswordRequestSchema>;

export const CreatePublicViewerSessionRequestSchema = z.object({
  password: z.string(),
}).passthrough();
export type CreatePublicViewerSessionInput = z.infer<typeof CreatePublicViewerSessionRequestSchema>;

export const PublishedSnapshotAssetSchema = z.object({
  id: IdSchema,
  asset_type: CaptureAssetWithFileUrlSchema.shape.asset_type,
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  page_title: z.string().nullable(),
  page_url: z.string().nullable(),
  file: z.object({
    id: IdSchema,
    original_name: z.string().nullable(),
    mime_type: z.string(),
    size_bytes: z.number().int().nonnegative(),
  }),
  file_url: z.string(),
});
export type PublishedSnapshotAsset = z.infer<typeof PublishedSnapshotAssetSchema>;

export const PublishedGuideSnapshotBlockSchema = z.object({
  id: IdSchema,
  block_type: z.enum(GUIDE_BLOCK_TYPES),
  block_index: z.number().int().positive(),
  content: PublishedGuideSnapshotBlockContentSchema.nullable().optional(),
  step: z.object({
    id: IdSchema,
    title: z.string(),
    body: z.string().nullable(),
  }).nullable(),
  source_asset: PublishedSnapshotAssetSchema.nullable(),
});
export type PublishedGuideSnapshotBlock = z.infer<typeof PublishedGuideSnapshotBlockSchema>;

export const PublishedGuideSnapshotSchema = z.object({
  artifact_type: z.literal("guide"),
  guide: z.object({
    id: IdSchema,
    title: z.string(),
    description: z.string().nullable(),
    source_capture_session_id: IdSchema.nullable(),
    published_version: z.number().int().positive(),
    published_at: IsoDateTimeStringSchema,
  }),
  blocks: z.array(PublishedGuideSnapshotBlockSchema),
});
export type PublishedGuideSnapshot = z.infer<typeof PublishedGuideSnapshotSchema>;

export const PublishedInteractiveDemoSnapshotHotspotSchema = z.object({
  id: IdSchema,
  hotspot_type: z.enum(DEMO_HOTSPOT_TYPES),
  label: z.string().nullable(),
  content: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  target_scene_id: IdSchema.nullable(),
  hotspot_index: z.number().int().positive(),
});
export type PublishedInteractiveDemoSnapshotHotspot = z.infer<
  typeof PublishedInteractiveDemoSnapshotHotspotSchema
>;

export const PublishedInteractiveDemoSnapshotSceneSchema = z.object({
  id: IdSchema,
  scene_index: z.number().int().positive(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  background_asset: PublishedSnapshotAssetSchema,
  hotspots: z.array(PublishedInteractiveDemoSnapshotHotspotSchema),
});
export type PublishedInteractiveDemoSnapshotScene = z.infer<
  typeof PublishedInteractiveDemoSnapshotSceneSchema
>;

export const PublishedInteractiveDemoSnapshotSchema = z.object({
  artifact_type: z.literal("interactive_demo"),
  schema_version: z.literal(1),
  interactive_demo: z.object({
    id: IdSchema,
    title: z.string(),
    description: z.string().nullable(),
    source_capture_session_id: IdSchema.nullable(),
    published_version: z.number().int().positive(),
    published_at: IsoDateTimeStringSchema,
  }),
  scenes: z.array(PublishedInteractiveDemoSnapshotSceneSchema),
});
export type PublishedInteractiveDemoSnapshot = z.infer<
  typeof PublishedInteractiveDemoSnapshotSchema
>;

export const PublishedSnapshotSchema = z.union([
  PublishedGuideSnapshotSchema,
  PublishedInteractiveDemoSnapshotSchema,
]);
export type PublishedSnapshot = z.infer<typeof PublishedSnapshotSchema>;

export type GuidePublishVisibility = PublishVisibility;
export type GuidePublishLink = PublishLink;
export type GuidePublishedArtifact = PublishedArtifact;
export type GuideRevokePublishResult = RevokePublishResult;
