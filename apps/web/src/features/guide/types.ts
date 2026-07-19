import type {
  GuideBlockType,
} from "@repo/constants";
import type { ProjectCaptureAssetListResponse } from "@repo/types/capture";
import type {
  CreateGuideBlockInput,
  Guide,
  GuideBlock,
  GuideDetail,
  GuideMarkdownExport,
  GuideScreenshotAnnotation,
  GuideSourceCaptureAsset,
  GuideStatus,
  GuideStep,
  UpdateGuideBlockAnnotationsInput,
  UpdateGuideBlockInput,
  UpdateGuideBlockScreenshotInput,
  UploadGuideBlockScreenshotResponse,
} from "@repo/types/guide";
import type {
  GuidePublishedArtifact,
  GuidePublishLink,
  GuidePublishResult,
  GuidePublishStatusResponse,
  GuidePublishVisibility,
  GuideRevokePublishResult,
  PublishedGuideSnapshot,
  PublishedGuideSnapshotBlock,
  PublishedSnapshotAsset,
  PublicPublishedArtifact,
  PublicPublishLink,
  PublicPublishLinkResponse,
  UpdatePublishAccessInput,
  UpdatePublishPasswordInput,
} from "@repo/types/publish";

export type {
  CreateGuideBlockInput,
  Guide,
  GuideBlock,
  GuideBlockType,
  GuideDetail,
  GuideMarkdownExport,
  GuideScreenshotAnnotation,
  GuideSourceCaptureAsset,
  GuideStatus,
  GuideStep,
  UpdateGuideBlockAnnotationsInput,
  UpdateGuideBlockInput,
  UpdateGuideBlockScreenshotInput,
  UploadGuideBlockScreenshotResponse,
};
export type {
  GuidePublishedArtifact,
  GuidePublishLink,
  GuidePublishResult,
  GuidePublishStatusResponse,
  GuidePublishVisibility,
  GuideRevokePublishResult,
  PublishedGuideSnapshot,
  PublishedGuideSnapshotBlock,
  PublicPublishedArtifact,
  PublicPublishLink,
  PublicPublishLinkResponse,
};
export type PublishedGuideSnapshotAsset = PublishedSnapshotAsset;

export type ProjectScreenshotAssetListResponse = ProjectCaptureAssetListResponse;

export type UploadGuideBlockScreenshotInput = {
  file: File;
  width?: number;
  height?: number;
  devicePixelRatio?: number;
  pageUrl?: string;
  pageTitle?: string;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateGuidePublishAccessInput = UpdatePublishAccessInput;
export type UpdateGuidePublishPasswordInput = UpdatePublishPasswordInput;
