import type {
  CreateDemoHotspotInput,
  CreateDemoSceneInput,
  DemoHotspot,
  DemoScene,
  InteractiveDemoDetailResponse,
  InteractiveDemoHotspotCreateResponse,
  InteractiveDemoHotspotListResponse,
  InteractiveDemoHotspotReorderResponse,
  InteractiveDemoHotspotUpdateResponse,
  InteractiveDemoSceneListResponse,
  InteractiveDemoSceneReorderResponse,
  InteractiveDemoSceneResponse,
  InteractiveDemoSceneUpdateResponse,
  InteractiveDemoWorkingDraftMutationResponse,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
  InteractiveDemo,
} from "@repo/types/demo";
import type { CaptureAssetWithFileUrl } from "@repo/types/capture";

export type InteractiveDemoEditorLoadState =
  | { status: "loading" }
  | {
      status: "loaded";
      demo: InteractiveDemo;
      scenes: DemoScene[];
      hotspotsBySceneId: Record<string, DemoHotspot[]>;
      backgroundAssets: CaptureAssetWithFileUrl[];
      selectableBackgroundAssetIds: string[];
      backgroundPickerError: boolean;
    }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

export type InteractiveDemoEditorPageProps = {
  projectId: string;
  projectVersionId: string;
  interactiveDemoId: string;
  loadDemo?: (
    projectId: string,
    interactiveDemoId: string,
  ) => Promise<InteractiveDemoDetailResponse>;
  loadScenes?: (
    projectId: string,
    interactiveDemoId: string,
  ) => Promise<InteractiveDemoSceneListResponse>;
  loadBackgroundAssets?: (
    projectId: string,
    projectVersionId: string,
  ) => Promise<{ capture_assets: CaptureAssetWithFileUrl[] }>;
  createScene?: (
    projectId: string,
    interactiveDemoId: string,
    input: CreateDemoSceneInput,
  ) => Promise<InteractiveDemoSceneResponse>;
  saveDemo?: (
    projectId: string,
    interactiveDemoId: string,
    input: UpdateInteractiveDemoInput,
  ) => Promise<InteractiveDemoDetailResponse>;
  saveScene?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    input: UpdateDemoSceneInput,
  ) => Promise<InteractiveDemoSceneUpdateResponse>;
  reorderScenes?: (
    projectId: string,
    interactiveDemoId: string,
    sceneIds: string[],
    expectedWorkingDraftVersion: number,
  ) => Promise<InteractiveDemoSceneReorderResponse>;
  deleteScene?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    expectedWorkingDraftVersion: number,
  ) => Promise<InteractiveDemoWorkingDraftMutationResponse>;
  loadHotspots?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
  ) => Promise<InteractiveDemoHotspotListResponse>;
  createHotspot?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    input: CreateDemoHotspotInput,
  ) => Promise<InteractiveDemoHotspotCreateResponse>;
  saveHotspot?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    hotspotId: string,
    input: UpdateDemoHotspotInput,
  ) => Promise<InteractiveDemoHotspotUpdateResponse>;
  reorderHotspots?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    hotspotIds: string[],
    expectedWorkingDraftVersion: number,
  ) => Promise<InteractiveDemoHotspotReorderResponse>;
  deleteHotspot?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    hotspotId: string,
    expectedWorkingDraftVersion: number,
  ) => Promise<InteractiveDemoWorkingDraftMutationResponse>;
  resolveAssetUrl?: (fileUrl: string) => string;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  canWrite?: boolean;
  versionSlug?: string;
  renderShell?: boolean;
  changeEditionStatus?: (
    command: "archive" | "restore",
    projectId: string,
    interactiveDemoId: string,
    projectVersionId: string,
    expectedEditionVersion: number,
  ) => Promise<{ edition: InteractiveDemoDetailResponse["edition"] }>;
};
