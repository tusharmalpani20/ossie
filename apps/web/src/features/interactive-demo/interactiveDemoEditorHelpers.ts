import type {
  CreateDemoHotspotInput,
  DemoHotspot,
  DemoHotspotType,
  DemoScene,
  InteractiveDemo,
  UpdateDemoHotspotInput,
} from "./types";
import type { CaptureAssetWithFileUrl } from "@repo/types/capture";

export type DemoDraft = {
  title: string;
  description: string;
  status: InteractiveDemo["status"];
};

export type SceneDraft = {
  title: string;
  description: string;
  background_capture_asset_id: string;
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

export const sortedScenes = (scenes: DemoScene[]) =>
  [...scenes].sort((left, right) => left.scene_index - right.scene_index);

export const demoDraftFromDemo = (demo: InteractiveDemo): DemoDraft => ({
  title: demo.title,
  description: demo.description ?? "",
  status: demo.status,
});

export const sceneDraftsFromScenes = (scenes: DemoScene[]) =>
  scenes.reduce<Record<string, SceneDraft>>((drafts, scene) => {
    drafts[scene.id] = {
      title: scene.title ?? "",
      description: scene.description ?? "",
      background_capture_asset_id: scene.background_capture_asset_id ?? "",
    };
    return drafts;
  }, {});

export const sortedHotspots = (hotspots: DemoHotspot[]) =>
  [...hotspots].sort((left, right) => left.hotspot_index - right.hotspot_index);

export const hotspotDraftFromHotspot = (
  hotspot: DemoHotspot,
): HotspotDraft => ({
  hotspot_type: hotspot.hotspot_type,
  label: hotspot.label ?? "",
  content: hotspot.content ?? "",
  x: String(hotspot.x),
  y: String(hotspot.y),
  width: String(hotspot.width),
  height: String(hotspot.height),
  target_scene_id: hotspot.transition?.target_scene_id ?? "",
});

export const hotspotDraftsFromHotspots = (
  hotspotsBySceneId: Record<string, DemoHotspot[]>,
) =>
  Object.values(hotspotsBySceneId)
    .flat()
    .reduce<Record<string, HotspotDraft>>((drafts, hotspot) => {
      drafts[hotspot.id] = hotspotDraftFromHotspot(hotspot);
      return drafts;
    }, {});

export const mergeConfirmedSceneDrafts = (
  drafts: Record<string, SceneDraft>,
  scene: DemoScene,
) => ({
  ...drafts,
  ...sceneDraftsFromScenes([scene]),
});

export const mergeConfirmedHotspotDrafts = (
  drafts: Record<string, HotspotDraft>,
  hotspot: DemoHotspot,
) => ({
  ...drafts,
  [hotspot.id]: hotspotDraftFromHotspot(hotspot),
});

export const hasUnsavedSceneDrafts = (
  drafts: Record<string, SceneDraft>,
  scenes: DemoScene[],
) => {
  const persisted = sceneDraftsFromScenes(scenes);
  return Object.entries(persisted).some(
    ([id, draft]) =>
      !drafts[id] ||
      drafts[id].title !== draft.title ||
      drafts[id].description !== draft.description ||
      drafts[id].background_capture_asset_id !==
        draft.background_capture_asset_id,
  );
};

export const hasUnsavedHotspotDrafts = (
  drafts: Record<string, HotspotDraft>,
  hotspotsBySceneId: Record<string, DemoHotspot[]>,
) => {
  const persisted = hotspotDraftsFromHotspots(hotspotsBySceneId);
  return Object.entries(persisted).some(([id, draft]) => {
    const local = drafts[id];
    return (
      !local ||
      local.hotspot_type !== draft.hotspot_type ||
      local.label !== draft.label ||
      local.content !== draft.content ||
      local.x !== draft.x ||
      local.y !== draft.y ||
      local.width !== draft.width ||
      local.height !== draft.height ||
      local.target_scene_id !== draft.target_scene_id
    );
  });
};

export const validHotspotBox = (
  input: Pick<CreateDemoHotspotInput, "x" | "y" | "width" | "height">,
) =>
  Number.isFinite(input.x) &&
  Number.isFinite(input.y) &&
  Number.isFinite(input.width) &&
  Number.isFinite(input.height) &&
  input.x >= 0 &&
  input.y >= 0 &&
  input.width > 0 &&
  input.height > 0 &&
  input.x + input.width <= 1 &&
  input.y + input.height <= 1;

export const updateInputFromHotspotDraft = (
  draft: HotspotDraft,
  expectedWorkingDraftVersion: number,
): UpdateDemoHotspotInput | null => {
  const input: UpdateDemoHotspotInput = {
    hotspot_type: draft.hotspot_type,
    label: draft.label.trim() || null,
    content: draft.content.trim() || null,
    x: Number(draft.x),
    y: Number(draft.y),
    width: Number(draft.width),
    height: Number(draft.height),
    transition: draft.target_scene_id
      ? { target_scene_id: draft.target_scene_id }
      : null,
    expected_working_draft_version: expectedWorkingDraftVersion,
  };
  return validHotspotBox({
    x: input.x!,
    y: input.y!,
    width: input.width!,
    height: input.height!,
  })
    ? input
    : null;
};

export const sourceCaptureUrl = (projectId: string, captureSessionId: string) =>
  `/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}`;

export const loadOptionalBackgroundAssets = async (
  loader:
    | (() => Promise<{ capture_assets: CaptureAssetWithFileUrl[] }>)
    | undefined,
) => {
  if (!loader) return { response: null, failed: false };
  try {
    return { response: await loader(), failed: false };
  } catch {
    return { response: null, failed: true };
  }
};

export const refreshedBackgroundAssets = (
  scenes: DemoScene[],
  currentAssets: CaptureAssetWithFileUrl[],
  selectableAssets: CaptureAssetWithFileUrl[],
) => {
  const referencedIds = new Set(
    scenes
      .map((scene) => scene.background_capture_asset_id)
      .filter((id): id is string => Boolean(id)),
  );
  const referencedAssets = currentAssets.filter((asset) =>
    referencedIds.has(asset.id),
  );
  return [
    ...new Map(
      [...selectableAssets, ...referencedAssets].map((asset) => [
        asset.id,
        asset,
      ]),
    ).values(),
  ];
};
