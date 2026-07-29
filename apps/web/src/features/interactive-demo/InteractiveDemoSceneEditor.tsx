import { useEffect, useState } from "react";
import { DEMO_HOTSPOT_TYPES } from "@repo/constants";
import type { CaptureAssetWithFileUrl } from "@repo/types/capture";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";
import {
  hotspotDraftFromHotspot,
  type HotspotDraft,
  type SceneDraft,
} from "./interactiveDemoEditorHelpers";
import { InteractiveDemoCanvas } from "./InteractiveDemoCanvas";
import type { DemoHotspot, DemoHotspotType, DemoScene } from "./types";
import styles from "./InteractiveDemoSceneEditor.module.css";

export type InteractiveDemoSceneEditorProps = {
  projectId: string;
  scene: DemoScene;
  sceneNumber: number;
  isFirst: boolean;
  isLast: boolean;
  draft: SceneDraft;
  pendingAction: string | null;
  resolveAssetUrl: (fileUrl: string) => string;
  scenes: DemoScene[];
  backgroundAssets: CaptureAssetWithFileUrl[];
  selectableBackgroundAssetIds: string[];
  backgroundPickerError: boolean;
  retryBackgroundAssets: () => void;
  hotspots: DemoHotspot[];
  hotspotDrafts: Record<string, HotspotDraft>;
  updateDraft: (
    sceneId: string,
    field: keyof SceneDraft,
    value: string,
  ) => void;
  updateHotspotDraft: (
    hotspotId: string,
    field: keyof HotspotDraft,
    value: string,
  ) => void;
  saveCurrentScene: (scene: DemoScene) => Promise<void>;
  moveScene: (direction: -1 | 1) => Promise<void>;
  deleteCurrentScene: (scene: DemoScene) => Promise<void>;
  createCurrentHotspot: (scene: DemoScene) => Promise<void>;
  saveCurrentHotspot: (scene: DemoScene, hotspot: DemoHotspot) => Promise<void>;
  moveHotspot: (hotspotIndex: number, direction: -1 | 1) => Promise<void>;
  deleteCurrentHotspot: (
    scene: DemoScene,
    hotspot: DemoHotspot,
  ) => Promise<void>;
};

const geometryFields = ["x", "y", "width", "height"] as const;

export const InteractiveDemoSceneEditor = ({
  scene,
  sceneNumber,
  isFirst,
  isLast,
  draft,
  pendingAction,
  resolveAssetUrl,
  scenes,
  backgroundAssets,
  selectableBackgroundAssetIds,
  backgroundPickerError,
  retryBackgroundAssets,
  hotspots,
  hotspotDrafts,
  updateDraft,
  updateHotspotDraft,
  saveCurrentScene,
  moveScene,
  deleteCurrentScene,
  createCurrentHotspot,
  saveCurrentHotspot,
  moveHotspot,
  deleteCurrentHotspot,
}: InteractiveDemoSceneEditorProps) => {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    hotspots[0]?.id ?? null,
  );
  const selectedBackground = backgroundAssets.find(
    (asset) => asset.id === draft.background_capture_asset_id,
  );
  const selectableBackgrounds = backgroundAssets.filter((asset) =>
    selectableBackgroundAssetIds.includes(asset.id),
  );
  const protectedSelectedBackground =
    selectedBackground &&
    !selectableBackgroundAssetIds.includes(selectedBackground.id)
      ? selectedBackground
      : null;
  const assetFileUrl = selectedBackground?.file_url ?? null;
  const selectedHotspot =
    hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? null;
  const selectedDraft = selectedHotspot
    ? (hotspotDrafts[selectedHotspot.id] ??
      hotspotDraftFromHotspot(selectedHotspot))
    : null;
  const pending = pendingAction !== null;

  useEffect(() => {
    if (
      !selectedHotspotId ||
      !hotspots.some((hotspot) => hotspot.id === selectedHotspotId)
    ) {
      setSelectedHotspotId(hotspots[0]?.id ?? null);
    }
  }, [hotspots, selectedHotspotId]);

  return (
    <article className={styles.scene}>
      <header className={styles.header}>
        <div>
          <span>Position {sceneNumber}</span>
          <h3>{scene.title ?? `Scene ${sceneNumber}`}</h3>
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending || isFirst}
            onClick={() => void moveScene(-1)}
          >
            Move scene {sceneNumber} up
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending || isLast}
            onClick={() => void moveScene(1)}
          >
            Move scene {sceneNumber} down
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  `Delete scene ${sceneNumber}? Its Hotspots and inbound Transitions will be removed.`,
                )
              ) {
                void deleteCurrentScene(scene);
              }
            }}
          >
            Delete scene {sceneNumber}
          </Button>
        </div>
      </header>

      <InteractiveDemoCanvas
        sceneTitle={scene.title ?? `Scene ${sceneNumber}`}
        backgroundUrl={assetFileUrl ? resolveAssetUrl(assetFileUrl) : null}
        backgroundAspectRatio={
          selectedBackground?.width && selectedBackground.height
            ? `${selectedBackground.width} / ${selectedBackground.height}`
            : undefined
        }
        hotspots={hotspots.map((hotspot) => {
          const local = hotspotDrafts[hotspot.id];
          return {
            ...hotspot,
            x: local ? Number(local.x) : hotspot.x,
            y: local ? Number(local.y) : hotspot.y,
            width: local ? Number(local.width) : hotspot.width,
            height: local ? Number(local.height) : hotspot.height,
          };
        })}
        selectedHotspotId={selectedHotspotId}
        onSelect={setSelectedHotspotId}
        onGeometryChange={(hotspotId, geometry) => {
          for (const field of geometryFields) {
            updateHotspotDraft(hotspotId, field, String(geometry[field]));
          }
        }}
      />

      <div className={styles.inspectorGrid}>
        <section className={styles.inspector}>
          <h4>Scene settings</h4>
          <Label>
            Scene {sceneNumber} title
            <Input
              value={draft.title}
              onChange={(event) =>
                updateDraft(scene.id, "title", event.target.value)
              }
            />
          </Label>
          <Label>
            Scene {sceneNumber} description
            <Textarea
              value={draft.description}
              onChange={(event) =>
                updateDraft(scene.id, "description", event.target.value)
              }
            />
          </Label>
          <Label>
            Background screenshot
            <Select
              value={draft.background_capture_asset_id}
              onChange={(event) =>
                updateDraft(
                  scene.id,
                  "background_capture_asset_id",
                  event.target.value,
                )
              }
            >
              <option value="">No background screenshot</option>
              {protectedSelectedBackground ? (
                <option
                  disabled
                  key={protectedSelectedBackground.id}
                  value={protectedSelectedBackground.id}
                >
                  {protectedSelectedBackground.page_title ??
                    protectedSelectedBackground.file.original_name ??
                    protectedSelectedBackground.id}{" "}
                  (archived)
                </option>
              ) : null}
              {selectableBackgrounds.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.page_title ?? asset.file.original_name ?? asset.id}
                </option>
              ))}
            </Select>
          </Label>
          {backgroundPickerError ? (
            <p role="alert">
              Background choices could not be loaded. The current background is
              preserved.{" "}
              <button type="button" onClick={retryBackgroundAssets}>
                Retry background choices
              </button>
            </p>
          ) : null}
          <Button
            disabled={pending}
            onClick={() => void saveCurrentScene(scene)}
          >
            {pendingAction === `scene:${scene.id}`
              ? `Saving scene ${sceneNumber}...`
              : `Save scene ${sceneNumber}`}
          </Button>
        </section>

        <section className={styles.inspector}>
          <div className={styles.header}>
            <h4>Hotspots</h4>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => void createCurrentHotspot(scene)}
            >
              Add hotspot
            </Button>
          </div>
          {hotspots.length === 0 ? (
            <p>No hotspots yet.</p>
          ) : (
            <ol className={styles.hotspotRail}>
              {hotspots.map((hotspot, index) => (
                <li key={hotspot.id}>
                  <button
                    type="button"
                    aria-pressed={selectedHotspotId === hotspot.id}
                    onClick={() => setSelectedHotspotId(hotspot.id)}
                  >
                    {hotspot.label ?? `Hotspot ${index + 1}`}
                  </button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending || index === 0}
                    onClick={() => void moveHotspot(index, -1)}
                  >
                    Up
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending || index === hotspots.length - 1}
                    onClick={() => void moveHotspot(index, 1)}
                  >
                    Down
                  </Button>
                </li>
              ))}
            </ol>
          )}

          {selectedHotspot && selectedDraft ? (
            <div className={styles.hotspotForm}>
              <Label>
                Hotspot type
                <Select
                  value={selectedDraft.hotspot_type}
                  onChange={(event) =>
                    updateHotspotDraft(
                      selectedHotspot.id,
                      "hotspot_type",
                      event.target.value as DemoHotspotType,
                    )
                  }
                >
                  {DEMO_HOTSPOT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </Label>
              <Label>
                Hotspot label
                <Input
                  value={selectedDraft.label}
                  onChange={(event) =>
                    updateHotspotDraft(
                      selectedHotspot.id,
                      "label",
                      event.target.value,
                    )
                  }
                />
              </Label>
              <Label>
                Hotspot content
                <Textarea
                  value={selectedDraft.content}
                  onChange={(event) =>
                    updateHotspotDraft(
                      selectedHotspot.id,
                      "content",
                      event.target.value,
                    )
                  }
                />
              </Label>
              <div className={styles.geometry}>
                {geometryFields.map((field) => (
                  <Label key={field}>
                    {field}
                    <Input
                      type="number"
                      step="0.01"
                      min={field === "width" || field === "height" ? 0.01 : 0}
                      max="1"
                      value={selectedDraft[field]}
                      onChange={(event) =>
                        updateHotspotDraft(
                          selectedHotspot.id,
                          field,
                          event.target.value,
                        )
                      }
                    />
                  </Label>
                ))}
              </div>
              <Label>
                Target scene
                <Select
                  value={selectedDraft.target_scene_id}
                  onChange={(event) =>
                    updateHotspotDraft(
                      selectedHotspot.id,
                      "target_scene_id",
                      event.target.value,
                    )
                  }
                >
                  <option value="">No target scene</option>
                  {scenes.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      Scene {candidate.scene_index}:{" "}
                      {candidate.title ?? "Untitled scene"}
                    </option>
                  ))}
                </Select>
              </Label>
              <div className={styles.actions}>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    void saveCurrentHotspot(scene, selectedHotspot)
                  }
                >
                  Save hotspot
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm("Delete this hotspot?")) {
                      void deleteCurrentHotspot(scene, selectedHotspot);
                    }
                  }}
                >
                  Delete hotspot
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </article>
  );
};
