import type {
  CreateDemoHotspotInput,
  DemoHotspot,
  DemoHotspotType,
  DemoScene,
  InteractiveDemo,
} from "./types";

export type DemoDraft = {
  title: string;
  description: string;
  status: InteractiveDemo["status"];
};

export type SceneDraft = {
  title: string;
  description: string;
};

export type HotspotDraft = {
  hotspot_type: DemoHotspotType;
  label: string;
  content: string;
  x: string;
  y: string;
  width: string;
  height: string;
  target_scene_id: string;
};

export const sortedScenes = (scenes: DemoScene[]) => (
  [...scenes].sort((left, right) => left.scene_index - right.scene_index)
);

export const demoDraftFromDemo = (demo: InteractiveDemo): DemoDraft => ({
  title: demo.title,
  description: demo.description ?? "",
  status: demo.status,
});

export const sceneDraftsFromScenes = (scenes: DemoScene[]) => scenes.reduce<Record<string, SceneDraft>>((drafts, scene) => {
  drafts[scene.id] = {
    title: scene.title ?? "",
    description: scene.description ?? "",
  };
  return drafts;
}, {});

export const sortedHotspots = (hotspots: DemoHotspot[]) => (
  [...hotspots].sort((left, right) => left.hotspot_index - right.hotspot_index)
);

export const hotspotDraftFromHotspot = (hotspot: DemoHotspot): HotspotDraft => ({
  hotspot_type: hotspot.hotspot_type,
  label: hotspot.label ?? "",
  content: hotspot.content ?? "",
  x: String(hotspot.x),
  y: String(hotspot.y),
  width: String(hotspot.width),
  height: String(hotspot.height),
  target_scene_id: hotspot.transition?.target_scene_id ?? "",
});

export const hotspotDraftsFromHotspots = (hotspotsBySceneId: Record<string, DemoHotspot[]>) => (
  Object.values(hotspotsBySceneId).flat().reduce<Record<string, HotspotDraft>>((drafts, hotspot) => {
    drafts[hotspot.id] = hotspotDraftFromHotspot(hotspot);
    return drafts;
  }, {})
);

export const validHotspotBox = (input: Pick<CreateDemoHotspotInput, "x" | "y" | "width" | "height">) => (
  Number.isFinite(input.x)
    && Number.isFinite(input.y)
    && Number.isFinite(input.width)
    && Number.isFinite(input.height)
    && input.x >= 0
    && input.y >= 0
    && input.width > 0
    && input.height > 0
    && input.x + input.width <= 1
    && input.y + input.height <= 1
);

export const sourceCaptureUrl = (projectId: string, captureSessionId: string) => (
  `/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}`
);

export const sceneAssetFileUrl = (projectId: string, scene: DemoScene) => {
  if (!scene.source_capture_session_id || !scene.background_capture_asset_id) {
    return null;
  }

  return `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(scene.source_capture_session_id)}/assets/${encodeURIComponent(scene.background_capture_asset_id)}/file`;
};
