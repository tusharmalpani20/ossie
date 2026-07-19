import type { DemoHotspotType } from "@repo/constants";
import type {
  CreateDemoHotspotInput,
  CreateInteractiveDemoFromCaptureResponse,
  DemoHotspot,
  DemoScene,
  InteractiveDemoDetailResponse,
  InteractiveDemoHotspotCreateResponse,
  InteractiveDemoHotspotListResponse,
  InteractiveDemoHotspotReorderResponse,
  InteractiveDemoHotspotUpdateResponse,
  InteractiveDemo,
  InteractiveDemoSceneListResponse,
  InteractiveDemoSceneReorderResponse,
  InteractiveDemoSceneUpdateResponse,
  ProjectInteractiveDemoListResponse,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
} from "@repo/types/demo";
import type {
  PublishedArtifact,
  PublishLink,
  PublicPublishLinkResponse,
} from "@repo/types/publish";

export type {
  CreateDemoHotspotInput,
  CreateInteractiveDemoFromCaptureResponse,
  DemoHotspot,
  DemoHotspotType,
  DemoScene,
  InteractiveDemo,
  InteractiveDemoDetailResponse,
  InteractiveDemoHotspotCreateResponse,
  InteractiveDemoHotspotListResponse,
  InteractiveDemoHotspotReorderResponse,
  InteractiveDemoHotspotUpdateResponse,
  InteractiveDemoSceneListResponse,
  InteractiveDemoSceneReorderResponse,
  InteractiveDemoSceneUpdateResponse,
  ProjectInteractiveDemoListResponse,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
  PublicPublishLinkResponse,
};
export type InteractiveDemoPublishStatusResponse = {
  publish_link: PublishLink | null;
  published_artifact: PublishedArtifact | null;
};
export type InteractiveDemoPublishResult = InteractiveDemoPublishStatusResponse;
export type RevokePublishResult = { publish_link: PublishLink };
export type UpdatePublishAccessInput = {
  visibility: "public" | "restricted";
  expires_at: string | null;
};
export type UpdatePublishPasswordInput = { password: string | null };
