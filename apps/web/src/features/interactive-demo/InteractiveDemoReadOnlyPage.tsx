import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { PortalTopbar } from "../portal/PortalTopbar";
import { ArtifactPublishingPanel } from "../publish/ArtifactPublishingPanel";
import { sortedHotspots, sortedScenes } from "./interactiveDemoEditorHelpers";
import { InteractiveDemoRenderer } from "./InteractiveDemoRenderer";
import type { DemoHotspot, DemoScene, InteractiveDemo } from "./types";
import styles from "./InteractiveDemoReadOnlyPage.module.css";

export const InteractiveDemoReadOnlyPage = ({
  projectId,
  interactiveDemoId,
  demo,
  scenes,
  hotspotsBySceneId,
  backgroundAssets,
  workingDraftVersion,
  canWrite,
  versionSlug,
  resolveAssetUrl,
  performLogout,
  navigate,
  onRestore,
  renderShell,
}: {
  projectId: string;
  interactiveDemoId: string;
  demo: InteractiveDemo;
  scenes: DemoScene[];
  hotspotsBySceneId: Record<string, DemoHotspot[]>;
  backgroundAssets: CaptureAssetWithFileUrl[];
  workingDraftVersion: number;
  canWrite: boolean;
  versionSlug?: string;
  resolveAssetUrl: (fileUrl: string) => string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  onRestore: () => Promise<void>;
  renderShell: boolean;
}) => (
  <div className={styles.page}>
    {renderShell ? (
      <PortalTopbar
        context={`${projectId} / interactive demos / ${interactiveDemoId}`}
        performLogout={performLogout}
        navigate={navigate}
      />
    ) : null}
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <span>Interactive demo · read only</span>
          <strong>{demo.title}</strong>
          {demo.description ? <p>{demo.description}</p> : null}
        </div>
        <div className={styles.actions}>
          <Badge>{demo.status}</Badge>
          {versionSlug ? (
            <a
              href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/revisions`}
            >
              Revision history
            </a>
          ) : null}
          {canWrite && demo.status === "archived" ? (
            <Button variant="secondary" onClick={() => void onRestore()}>
              Restore demo
            </Button>
          ) : null}
        </div>
      </header>

      <InteractiveDemoRenderer
        title={demo.title}
        description={demo.description}
        scenes={sortedScenes(scenes).map((scene) => ({
          id: scene.id,
          sceneIndex: scene.scene_index,
          title: scene.title,
          description: scene.description,
          backgroundAssetId: scene.background_capture_asset_id,
          hotspots: sortedHotspots(hotspotsBySceneId[scene.id] ?? []).map(
            (hotspot) => ({
              id: hotspot.id,
              type: hotspot.hotspot_type,
              label: hotspot.label,
              content: hotspot.content,
              x: hotspot.x,
              y: hotspot.y,
              width: hotspot.width,
              height: hotspot.height,
              targetSceneId: hotspot.transition?.target_scene_id ?? null,
            }),
          ),
        }))}
        assets={backgroundAssets.map((asset) => ({
          id: asset.id,
          fileUrl: resolveAssetUrl(asset.file_url),
          width: asset.width,
          height: asset.height,
        }))}
      />

      <ArtifactPublishingPanel
        projectId={projectId}
        projectVersionId={demo.project_version_id}
        artifactType="interactive_demo"
        artifactId={interactiveDemoId}
        editionVersion={demo.version}
        workingDraftVersion={workingDraftVersion}
        publicationReadOnly
        linkManagementReadOnly={!canWrite}
        showMutationControls={canWrite}
      />
    </main>
  </div>
);
import type { CaptureAssetWithFileUrl } from "@repo/types/capture";
