import type { GuideBlockType } from "@repo/constants";
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
  PublishedArtifact,
  PublishLink,
  PublicPublishedArtifact,
  PublicPublishLink,
  PublicPublishLinkResponse,
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
  PublicPublishedArtifact,
  PublicPublishLink,
  PublicPublishLinkResponse,
};
export type GuidePublishStatusResponse = {
  publish_link: PublishLink | null;
  published_artifact: PublishedArtifact | null;
};
export type GuidePublishResult = GuidePublishStatusResponse;
export type GuideRevokePublishResult = { publish_link: PublishLink };

export type ProjectScreenshotAssetListResponse =
  ProjectCaptureAssetListResponse;

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

export type UpdateGuidePublishAccessInput = {
  visibility: "public" | "restricted";
  expires_at: string | null;
};
export type UpdateGuidePublishPasswordInput = { password: string | null };
