import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { StatusPanel } from "@repo/ui/status-panel";
import {
  getInteractiveDemo,
  listInteractiveDemoHotspots,
  listInteractiveDemoScenes,
  resolveApiAssetUrl,
  type InteractiveDemoDetailResponse,
  type InteractiveDemoHotspotListResponse,
  type InteractiveDemoSceneListResponse,
} from "../../lib/api";
import {
  InteractiveDemoRenderer,
  type InteractiveDemoRenderScene,
} from "./InteractiveDemoRenderer";
import styles from "./InteractiveDemoPreviewPage.module.css";

type PreviewState =
  | { status: "loading" }
  | {
      status: "ready";
      detail: InteractiveDemoDetailResponse;
      scenes: InteractiveDemoRenderScene[];
      assets: Array<{
        id: string;
        fileUrl: string;
        width: number | null;
        height: number | null;
      }>;
    }
  | { status: "error" };

export const InteractiveDemoPreviewPage = ({
  projectId,
  projectVersionId,
  interactiveDemoId,
  loadDemo = (id, demoId) => getInteractiveDemo(id, demoId, projectVersionId),
  loadScenes = (id, demoId) =>
    listInteractiveDemoScenes(id, demoId, projectVersionId),
  loadHotspots = (id, demoId, sceneId) =>
    listInteractiveDemoHotspots(id, demoId, sceneId, projectVersionId),
}: {
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
  loadHotspots?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
  ) => Promise<InteractiveDemoHotspotListResponse>;
}) => {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadDemo(projectId, interactiveDemoId),
      loadScenes(projectId, interactiveDemoId),
    ])
      .then(async ([detail, sceneResponse]) => {
        const hotspotResponses = await Promise.all(
          sceneResponse.demo_scenes.map((scene) =>
            loadHotspots(projectId, interactiveDemoId, scene.id),
          ),
        );
        if (!active) return;
        const hotspotsByScene = new Map(
          sceneResponse.demo_scenes.map((scene, index) => [
            scene.id,
            hotspotResponses[index]?.demo_hotspots ?? [],
          ]),
        );
        setState({
          status: "ready",
          detail,
          scenes: sceneResponse.demo_scenes.map((scene) => ({
            id: scene.id,
            sceneIndex: scene.scene_index,
            title: scene.title,
            description: scene.description,
            backgroundAssetId: scene.background_capture_asset_id,
            hotspots: (hotspotsByScene.get(scene.id) ?? []).map((hotspot) => ({
              id: hotspot.id,
              type: hotspot.hotspot_type,
              label: hotspot.label,
              content: hotspot.content,
              x: hotspot.x,
              y: hotspot.y,
              width: hotspot.width,
              height: hotspot.height,
              targetSceneId: hotspot.transition?.target_scene_id ?? null,
            })),
          })),
          assets: sceneResponse.background_capture_assets.map((asset) => ({
            id: asset.id,
            fileUrl: resolveApiAssetUrl(asset.file_url),
            width: asset.width,
            height: asset.height,
          })),
        });
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      });
    return () => {
      active = false;
    };
    // Route identity and reload control requests; injected loaders may be inline adapters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactiveDemoId, projectId, projectVersionId, reload]);

  if (state.status === "loading")
    return (
      <StatusPanel
        className={styles.state}
        tone="loading"
        title="Loading Working Draft preview"
        description="Opening the mutable draft and its Scenes."
        titleAs="h1"
      />
    );
  if (state.status === "error")
    return (
      <StatusPanel
        className={styles.state}
        tone="error"
        title="Working Draft preview unavailable"
        description="Could not load the Working Draft preview."
        action={
          <Button type="button" onClick={() => setReload((value) => value + 1)}>
            Try again
          </Button>
        }
        titleAs="h1"
      />
    );

  return (
    <article className={styles.page}>
      <p className={styles.label}>Working Draft preview</p>
      <InteractiveDemoRenderer
        title={state.detail.edition.title}
        description={state.detail.edition.description}
        scenes={state.scenes}
        assets={state.assets}
      />
    </article>
  );
};
