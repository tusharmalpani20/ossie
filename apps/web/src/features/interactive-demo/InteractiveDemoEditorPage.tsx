import { useEffect, useMemo, useState } from "react";
import { DEMO_HOTSPOT_TYPES } from "@repo/constants";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";
import {
  ApiClientError,
  archiveInteractiveDemo,
  createInteractiveDemoHotspot,
  deleteInteractiveDemoHotspot,
  deleteInteractiveDemoScene,
  getInteractiveDemo,
  listInteractiveDemoHotspots,
  listInteractiveDemoScenes,
  reorderInteractiveDemoHotspots,
  reorderInteractiveDemoScenes,
  resolveApiAssetUrl,
  restoreInteractiveDemo,
  updateInteractiveDemoHotspot,
  updateInteractiveDemo,
  updateInteractiveDemoScene,
  type InteractiveDemoHotspotCreateResponse,
  type InteractiveDemoHotspotListResponse,
  type InteractiveDemoHotspotReorderResponse,
  type InteractiveDemoHotspotUpdateResponse,
  type InteractiveDemoDetailResponse,
  type InteractiveDemoSceneListResponse,
  type InteractiveDemoSceneReorderResponse,
  type InteractiveDemoSceneUpdateResponse,
  type InteractiveDemoWorkingDraftMutationResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import { ArtifactPublishingPanel } from "../publish/ArtifactPublishingPanel";
import {
  demoDraftFromDemo,
  hotspotDraftFromHotspot,
  hotspotDraftsFromHotspots,
  sceneAssetFileUrl,
  sceneDraftsFromScenes,
  sortedHotspots,
  sortedScenes,
  sourceCaptureUrl,
  validHotspotBox,
  type DemoDraft,
  type HotspotDraft,
  type SceneDraft,
} from "./interactiveDemoEditorHelpers";
import type {
  CreateDemoHotspotInput,
  DemoHotspot,
  DemoHotspotType,
  DemoScene,
  InteractiveDemo,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
} from "./types";
import styles from "./InteractiveDemoEditorPage.module.css";

type LoadState =
  | { status: "loading" }
  | {
      status: "loaded";
      demo: InteractiveDemo;
      scenes: DemoScene[];
      hotspotsBySceneId: Record<string, DemoHotspot[]>;
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
  changeEditionStatus?: (
    command: "archive" | "restore",
    projectId: string,
    interactiveDemoId: string,
    projectVersionId: string,
    expectedEditionVersion: number,
  ) => Promise<{ edition: InteractiveDemoDetailResponse["edition"] }>;
};

const loadStateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    if (error.kind === "not_found") {
      return { status: "not_found" };
    }
  }

  return { status: "error" };
};

export const InteractiveDemoEditorPage = ({
  projectId,
  projectVersionId,
  interactiveDemoId,
  loadDemo = (id, artifactId) =>
    getInteractiveDemo(id, artifactId, projectVersionId),
  loadScenes = (id, artifactId) =>
    listInteractiveDemoScenes(id, artifactId, projectVersionId),
  saveDemo = (id, artifactId, input) =>
    updateInteractiveDemo(id, artifactId, input, projectVersionId),
  saveScene = (id, artifactId, sceneId, input) =>
    updateInteractiveDemoScene(
      id,
      artifactId,
      sceneId,
      input,
      projectVersionId,
    ),
  reorderScenes = (id, artifactId, sceneIds, expected) =>
    reorderInteractiveDemoScenes(
      id,
      artifactId,
      sceneIds,
      expected,
      projectVersionId,
    ),
  deleteScene = (id, artifactId, sceneId, expected) =>
    deleteInteractiveDemoScene(
      id,
      artifactId,
      sceneId,
      expected,
      projectVersionId,
    ),
  loadHotspots = (id, artifactId, sceneId) =>
    listInteractiveDemoHotspots(id, artifactId, sceneId, projectVersionId),
  createHotspot = (id, artifactId, sceneId, input) =>
    createInteractiveDemoHotspot(
      id,
      artifactId,
      sceneId,
      input,
      projectVersionId,
    ),
  saveHotspot = (id, artifactId, sceneId, hotspotId, input) =>
    updateInteractiveDemoHotspot(
      id,
      artifactId,
      sceneId,
      hotspotId,
      input,
      projectVersionId,
    ),
  reorderHotspots = (id, artifactId, sceneId, hotspotIds, expected) =>
    reorderInteractiveDemoHotspots(
      id,
      artifactId,
      sceneId,
      hotspotIds,
      expected,
      projectVersionId,
    ),
  deleteHotspot = (id, artifactId, sceneId, hotspotId, expected) =>
    deleteInteractiveDemoHotspot(
      id,
      artifactId,
      sceneId,
      hotspotId,
      expected,
      projectVersionId,
    ),
  resolveAssetUrl = resolveApiAssetUrl,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
  canWrite = true,
  versionSlug,
  changeEditionStatus = (command, id, artifactId, versionId, expected) =>
    command === "archive"
      ? archiveInteractiveDemo(id, artifactId, versionId, expected)
      : restoreInteractiveDemo(id, artifactId, versionId, expected),
}: InteractiveDemoEditorPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [workingDraftVersion, setWorkingDraftVersion] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    Promise.all([
      loadDemo(projectId, interactiveDemoId),
      loadScenes(projectId, interactiveDemoId),
    ])
      .then(async ([demoResponse, sceneResponse]) => {
        const scenes = sortedScenes(sceneResponse.demo_scenes);
        const hotspotEntries = await Promise.all(
          scenes.map(async (scene) => {
            try {
              const response = await loadHotspots(
                projectId,
                interactiveDemoId,
                scene.id,
              );
              return [
                scene.id,
                sortedHotspots(response.demo_hotspots),
              ] as const;
            } catch {
              return [scene.id, []] as const;
            }
          }),
        );

        if (active) {
          setState({
            status: "loaded",
            demo: demoResponse.edition,
            scenes,
            hotspotsBySceneId: Object.fromEntries(hotspotEntries),
          });
          setWorkingDraftVersion(demoResponse.working_draft.version);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState(loadStateFromError(error));
        }
      });

    return () => {
      active = false;
    };
    // Route identity and reloadKey intentionally control refetching; injected loaders may be inline test adapters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectVersionId, interactiveDemoId, reloadKey]);

  if (state.status === "loading") {
    return (
      <PortalShell
        projectId={projectId}
        interactiveDemoId={interactiveDemoId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <div className={styles.state}>Loading interactive demo...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell
        projectId={projectId}
        interactiveDemoId={interactiveDemoId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <div className={styles.state}>
          <div>Sign in to view this interactive demo.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>
            Sign in
          </a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell
        projectId={projectId}
        interactiveDemoId={interactiveDemoId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <div className={styles.state}>Interactive demo was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell
        projectId={projectId}
        interactiveDemoId={interactiveDemoId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <div className={styles.state}>
          <div>Could not load interactive demo.</div>
          <Button
            variant="secondary"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </Button>
        </div>
      </PortalShell>
    );
  }

  const changeLifecycle = async () => {
    if (state.status !== "loaded") return;
    const command = state.demo.status === "draft" ? "archive" : "restore";
    if (
      command === "archive" &&
      !window.confirm("Archive this interactive demo edition?")
    )
      return;
    try {
      const response = await changeEditionStatus(
        command,
        projectId,
        interactiveDemoId,
        projectVersionId,
        state.demo.version,
      );
      setState({ ...state, demo: response.edition });
    } catch {
      setState({ status: "error" });
    }
  };

  if (!canWrite || state.demo.status === "archived") {
    return (
      <PortalShell
        projectId={projectId}
        interactiveDemoId={interactiveDemoId}
        performLogout={performLogout}
        navigate={navigate}
      >
        <section className={styles.header}>
          <div>
            <div className={styles.eyebrow}>Interactive demo · read only</div>
            <h1 className={styles.title}>{state.demo.title}</h1>
            {state.demo.description ? (
              <p className={styles.description}>{state.demo.description}</p>
            ) : null}
          </div>
          <div>
            <Badge>{state.demo.status}</Badge>
            {versionSlug ? (
              <a
                href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/revisions`}
              >
                Revision history
              </a>
            ) : null}
            {canWrite && state.demo.status === "archived" ? (
              <Button
                variant="secondary"
                onClick={() => void changeLifecycle()}
              >
                Restore demo
              </Button>
            ) : null}
          </div>
        </section>
        <ArtifactPublishingPanel
          projectId={projectId}
          projectVersionId={state.demo.project_version_id}
          artifactType="interactive_demo"
          artifactId={interactiveDemoId}
          editionVersion={state.demo.version}
          workingDraftVersion={workingDraftVersion}
          publicationReadOnly
          linkManagementReadOnly={!canWrite}
          showMutationControls={canWrite}
        />
        <section aria-labelledby="demo-scenes-readonly-heading">
          <h2 id="demo-scenes-readonly-heading" className={styles.sectionTitle}>
            Scenes
          </h2>
          {state.scenes.length === 0 ? (
            <div className={styles.state}>
              This demo does not have any scenes yet.
            </div>
          ) : (
            state.scenes.map((scene, index) => {
              const sceneNumber = index + 1;
              const sceneTitle = scene.title ?? `Scene ${sceneNumber}`;
              const assetFileUrl = sceneAssetFileUrl(projectId, scene);
              const hotspots = state.hotspotsBySceneId[scene.id] ?? [];
              return (
                <Card key={scene.id} className={styles.panel}>
                  <CardContent>
                    <h3>
                      Scene {sceneNumber}: {sceneTitle}
                    </h3>
                    {scene.description ? <p>{scene.description}</p> : null}
                    <div className={styles.screenshotFrame}>
                      {assetFileUrl ? (
                        <>
                          <img
                            className={styles.screenshot}
                            src={resolveAssetUrl(assetFileUrl)}
                            alt={`${sceneTitle} screenshot`}
                          />
                          {hotspots.map((hotspot) => (
                            <span
                              key={hotspot.id}
                              role="note"
                              className={styles.hotspotOverlay}
                              aria-label={`Hotspot ${hotspot.label ?? hotspot.hotspot_index}`}
                              style={{
                                left: `${hotspot.x * 100}%`,
                                top: `${hotspot.y * 100}%`,
                                width: `${hotspot.width * 100}%`,
                                height: `${hotspot.height * 100}%`,
                              }}
                            />
                          ))}
                        </>
                      ) : (
                        <div className={styles.placeholder}>
                          No screenshot attached.
                        </div>
                      )}
                    </div>
                    {hotspots.length === 0 ? (
                      <p>No hotspots.</p>
                    ) : (
                      <ol
                        className={styles.hotspotList}
                        aria-label={`Scene ${sceneNumber} hotspot content`}
                      >
                        {hotspots.map((hotspot) => (
                          <li key={hotspot.id}>
                            <strong>
                              {hotspot.label ??
                                `Hotspot ${hotspot.hotspot_index}`}
                            </strong>
                            <span>
                              {hotspot.content ?? hotspot.hotspot_type}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>
      </PortalShell>
    );
  }

  return (
    <InteractiveDemoEditorLoaded
      projectId={projectId}
      interactiveDemoId={interactiveDemoId}
      demo={state.demo}
      scenes={state.scenes}
      hotspotsBySceneId={state.hotspotsBySceneId}
      initialWorkingDraftVersion={workingDraftVersion}
      saveDemo={saveDemo}
      saveScene={saveScene}
      reorderScenes={reorderScenes}
      deleteScene={deleteScene}
      createHotspot={createHotspot}
      saveHotspot={saveHotspot}
      reorderHotspots={reorderHotspots}
      deleteHotspot={deleteHotspot}
      resolveAssetUrl={resolveAssetUrl}
      setLoadedState={(next) => setState({ status: "loaded", ...next })}
      performLogout={performLogout}
      navigate={navigate}
      onChangeLifecycle={changeLifecycle}
      versionSlug={versionSlug}
    />
  );
};

const PortalShell = ({
  children,
  projectId,
  interactiveDemoId,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  projectId: string;
  interactiveDemoId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <div className={styles.page}>
    <PortalTopbar
      context={`${projectId} / interactive demos / ${interactiveDemoId}`}
      performLogout={performLogout}
      navigate={navigate}
    />
    <main className={styles.main}>{children}</main>
  </div>
);

const InteractiveDemoEditorLoaded = ({
  projectId,
  interactiveDemoId,
  demo,
  scenes,
  hotspotsBySceneId,
  initialWorkingDraftVersion,
  saveDemo,
  saveScene,
  reorderScenes,
  deleteScene,
  createHotspot,
  saveHotspot,
  reorderHotspots,
  deleteHotspot,
  resolveAssetUrl,
  setLoadedState,
  performLogout,
  navigate,
  onChangeLifecycle,
  versionSlug,
}: {
  projectId: string;
  interactiveDemoId: string;
  demo: InteractiveDemo;
  scenes: DemoScene[];
  hotspotsBySceneId: Record<string, DemoHotspot[]>;
  initialWorkingDraftVersion: number;
  saveDemo: NonNullable<InteractiveDemoEditorPageProps["saveDemo"]>;
  saveScene: NonNullable<InteractiveDemoEditorPageProps["saveScene"]>;
  reorderScenes: NonNullable<InteractiveDemoEditorPageProps["reorderScenes"]>;
  deleteScene: NonNullable<InteractiveDemoEditorPageProps["deleteScene"]>;
  createHotspot: NonNullable<InteractiveDemoEditorPageProps["createHotspot"]>;
  saveHotspot: NonNullable<InteractiveDemoEditorPageProps["saveHotspot"]>;
  reorderHotspots: NonNullable<
    InteractiveDemoEditorPageProps["reorderHotspots"]
  >;
  deleteHotspot: NonNullable<InteractiveDemoEditorPageProps["deleteHotspot"]>;
  resolveAssetUrl: (fileUrl: string) => string;
  setLoadedState: (state: {
    demo: InteractiveDemo;
    scenes: DemoScene[];
    hotspotsBySceneId: Record<string, DemoHotspot[]>;
  }) => void;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  onChangeLifecycle: () => Promise<void>;
  versionSlug?: string;
}) => {
  const orderedScenes = useMemo(() => sortedScenes(scenes), [scenes]);
  const [demoDraft, setDemoDraft] = useState<DemoDraft>(() =>
    demoDraftFromDemo(demo),
  );
  const [sceneDrafts, setSceneDrafts] = useState<Record<string, SceneDraft>>(
    () => sceneDraftsFromScenes(orderedScenes),
  );
  const [hotspotDrafts, setHotspotDrafts] = useState<
    Record<string, HotspotDraft>
  >(() => hotspotDraftsFromHotspots(hotspotsBySceneId));
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [workingDraftVersion, setWorkingDraftVersion] = useState(
    initialWorkingDraftVersion,
  );

  const updateLoadedState = (
    nextDemo: InteractiveDemo,
    nextScenes: DemoScene[],
    nextHotspotsBySceneId: Record<string, DemoHotspot[]>,
  ) => {
    setLoadedState({
      demo: nextDemo,
      scenes: nextScenes,
      hotspotsBySceneId: nextHotspotsBySceneId,
    });
  };

  const updateDemoDraft = (field: keyof DemoDraft, value: string) => {
    setDemoDraft((draft) => ({
      ...draft,
      [field]: field === "status" && value === "archived" ? "archived" : value,
    }));
    setMessage(null);
  };

  const updateSceneDraft = (
    sceneId: string,
    field: keyof SceneDraft,
    value: string,
  ) => {
    setSceneDrafts((drafts) => ({
      ...drafts,
      [sceneId]: {
        ...(drafts[sceneId] ?? { title: "", description: "" }),
        [field]: value,
      },
    }));
    setMessage(null);
  };

  const handleSaveDemo = async () => {
    setPendingAction("demo");
    setMessage(null);

    try {
      const response = await saveDemo(projectId, interactiveDemoId, {
        title: demoDraft.title.trim(),
        description: demoDraft.description.trim() || null,
        expected_edition_version: demo.version,
      });
      updateLoadedState(response.edition, orderedScenes, hotspotsBySceneId);
      setDemoDraft(demoDraftFromDemo(response.edition));
      setMessage("Demo saved.");
    } catch {
      setMessage("Could not save demo.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveScene = async (scene: DemoScene) => {
    const draft = sceneDrafts[scene.id] ?? { title: "", description: "" };
    setPendingAction(`scene:${scene.id}`);
    setMessage(null);

    try {
      const response = await saveScene(projectId, interactiveDemoId, scene.id, {
        title: draft.title.trim() || null,
        description: draft.description.trim() || null,
        expected_working_draft_version: workingDraftVersion,
      });
      setWorkingDraftVersion(response.working_draft.version);
      const nextScenes = orderedScenes.map((candidate) =>
        candidate.id === response.demo_scene.id
          ? response.demo_scene
          : candidate,
      );
      updateLoadedState(demo, nextScenes, hotspotsBySceneId);
      setSceneDrafts(sceneDraftsFromScenes(nextScenes));
      setMessage("Scene saved.");
    } catch {
      setMessage("Could not save scene.");
    } finally {
      setPendingAction(null);
    }
  };

  const moveScene = async (fromIndex: number, direction: -1 | 1) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= orderedScenes.length) {
      return;
    }

    const sceneIds = orderedScenes.map((scene) => scene.id);
    const movingSceneId = sceneIds[fromIndex];
    const targetSceneId = sceneIds[toIndex];

    if (!movingSceneId || !targetSceneId) {
      return;
    }

    sceneIds[fromIndex] = targetSceneId;
    sceneIds[toIndex] = movingSceneId;
    setPendingAction("reorder");
    setMessage(null);

    try {
      const response = await reorderScenes(
        projectId,
        interactiveDemoId,
        sceneIds,
        workingDraftVersion,
      );
      setWorkingDraftVersion(response.working_draft.version);
      const nextScenes = sortedScenes(response.demo_scenes);
      updateLoadedState(demo, nextScenes, hotspotsBySceneId);
      setSceneDrafts(sceneDraftsFromScenes(nextScenes));
    } catch {
      setMessage("Could not reorder scenes.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteScene = async (scene: DemoScene) => {
    setPendingAction(`delete:${scene.id}`);
    setMessage(null);

    try {
      const result = await deleteScene(
        projectId,
        interactiveDemoId,
        scene.id,
        workingDraftVersion,
      );
      setWorkingDraftVersion(result.working_draft.version);
      const nextScenes = orderedScenes.filter(
        (candidate) => candidate.id !== scene.id,
      );
      const nextHotspotsBySceneId = { ...hotspotsBySceneId };
      delete nextHotspotsBySceneId[scene.id];
      updateLoadedState(demo, nextScenes, nextHotspotsBySceneId);
      setSceneDrafts(sceneDraftsFromScenes(nextScenes));
    } catch {
      setMessage("Could not delete scene.");
    } finally {
      setPendingAction(null);
    }
  };

  const updateHotspotDraft = (
    hotspotId: string,
    field: keyof HotspotDraft,
    value: string,
  ) => {
    setHotspotDrafts((drafts) => ({
      ...drafts,
      [hotspotId]: {
        ...(drafts[hotspotId] ?? {
          hotspot_type: "click",
          label: "",
          content: "",
          x: "0",
          y: "0",
          width: "0.2",
          height: "0.12",
          target_scene_id: "",
        }),
        [field]: value,
      },
    }));
    setMessage(null);
  };

  const replaceSceneHotspots = (sceneId: string, hotspots: DemoHotspot[]) => {
    const nextHotspotsBySceneId = {
      ...hotspotsBySceneId,
      [sceneId]: sortedHotspots(hotspots),
    };
    updateLoadedState(demo, orderedScenes, nextHotspotsBySceneId);
    setHotspotDrafts(hotspotDraftsFromHotspots(nextHotspotsBySceneId));
  };

  const nextTargetSceneId = (sceneId: string) =>
    orderedScenes.find((candidate) => candidate.id !== sceneId)?.id ?? null;

  const handleCreateHotspot = async (scene: DemoScene) => {
    const input: CreateDemoHotspotInput = {
      hotspot_type: "click",
      label: "New hotspot",
      content: null,
      x: 0.4,
      y: 0.35,
      width: 0.2,
      height: 0.12,
      transition: nextTargetSceneId(scene.id)
        ? { target_scene_id: nextTargetSceneId(scene.id)! }
        : null,
      expected_working_draft_version: workingDraftVersion,
    };

    setPendingAction(`hotspot:create:${scene.id}`);
    setMessage(null);

    try {
      const response = await createHotspot(
        projectId,
        interactiveDemoId,
        scene.id,
        input,
      );
      setWorkingDraftVersion(response.working_draft.version);
      replaceSceneHotspots(scene.id, [
        ...(hotspotsBySceneId[scene.id] ?? []),
        response.demo_hotspot,
      ]);
    } catch {
      setMessage("Could not create hotspot.");
    } finally {
      setPendingAction(null);
    }
  };

  const inputFromHotspotDraft = (
    draft: HotspotDraft,
  ): UpdateDemoHotspotInput | null => {
    const input = {
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
      expected_working_draft_version: workingDraftVersion,
    };

    if (!validHotspotBox(input)) {
      return null;
    }

    return input;
  };

  const handleSaveHotspot = async (scene: DemoScene, hotspot: DemoHotspot) => {
    const input = inputFromHotspotDraft(
      hotspotDrafts[hotspot.id] ?? hotspotDraftFromHotspot(hotspot),
    );
    if (!input) {
      setMessage("Hotspot coordinates must stay inside the screenshot.");
      return;
    }

    setPendingAction(`hotspot:save:${hotspot.id}`);
    setMessage(null);

    try {
      const response = await saveHotspot(
        projectId,
        interactiveDemoId,
        scene.id,
        hotspot.id,
        input,
      );
      setWorkingDraftVersion(response.working_draft.version);
      replaceSceneHotspots(
        scene.id,
        (hotspotsBySceneId[scene.id] ?? []).map((candidate) =>
          candidate.id === response.demo_hotspot.id
            ? response.demo_hotspot
            : candidate,
        ),
      );
      setMessage("Hotspot saved.");
    } catch {
      setMessage("Could not save hotspot.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteHotspot = async (
    scene: DemoScene,
    hotspot: DemoHotspot,
  ) => {
    setPendingAction(`hotspot:delete:${hotspot.id}`);
    setMessage(null);

    try {
      const result = await deleteHotspot(
        projectId,
        interactiveDemoId,
        scene.id,
        hotspot.id,
        workingDraftVersion,
      );
      setWorkingDraftVersion(result.working_draft.version);
      replaceSceneHotspots(
        scene.id,
        (hotspotsBySceneId[scene.id] ?? []).filter(
          (candidate) => candidate.id !== hotspot.id,
        ),
      );
    } catch {
      setMessage("Could not delete hotspot.");
    } finally {
      setPendingAction(null);
    }
  };

  const moveHotspot = async (
    scene: DemoScene,
    fromIndex: number,
    direction: -1 | 1,
  ) => {
    const sceneHotspots = sortedHotspots(hotspotsBySceneId[scene.id] ?? []);
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= sceneHotspots.length) {
      return;
    }

    const hotspotIds = sceneHotspots.map((hotspot) => hotspot.id);
    const movingHotspotId = hotspotIds[fromIndex];
    const targetHotspotId = hotspotIds[toIndex];
    if (!movingHotspotId || !targetHotspotId) {
      return;
    }

    hotspotIds[fromIndex] = targetHotspotId;
    hotspotIds[toIndex] = movingHotspotId;
    setPendingAction(`hotspot:reorder:${scene.id}`);
    setMessage(null);

    try {
      const response = await reorderHotspots(
        projectId,
        interactiveDemoId,
        scene.id,
        hotspotIds,
        workingDraftVersion,
      );
      setWorkingDraftVersion(response.working_draft.version);
      replaceSceneHotspots(scene.id, response.demo_hotspots);
    } catch {
      setMessage("Could not reorder hotspots.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <PortalShell
      projectId={projectId}
      interactiveDemoId={interactiveDemoId}
      performLogout={performLogout}
      navigate={navigate}
    >
      <section className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.eyebrow}>Interactive demo</div>
            <h1 className={styles.title}>{demo.title}</h1>
            {demo.description ? (
              <p className={styles.description}>{demo.description}</p>
            ) : null}
            <div className={styles.meta}>
              <span>
                {demo.source_capture_session_id
                  ? `Source capture: ${demo.source_capture_session_id}`
                  : "No source capture"}
              </span>
              {demo.source_capture_session_id ? (
                <a
                  className={styles.sourceLink}
                  href={sourceCaptureUrl(
                    projectId,
                    demo.source_capture_session_id,
                  )}
                >
                  Open source capture
                </a>
              ) : null}
            </div>
          </div>
          <div>
            <Badge variant={demo.status === "draft" ? "warning" : "success"}>
              {demo.status}
            </Badge>
            {versionSlug ? (
              <a
                href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/revisions`}
              >
                Revision history
              </a>
            ) : null}
            <Button
              variant="destructive"
              onClick={() => void onChangeLifecycle()}
            >
              Archive demo
            </Button>
          </div>
        </div>
      </section>

      <div className={styles.content}>
        <div className={styles.sidePanelStack}>
          <section
            className={styles.panel}
            aria-labelledby="demo-metadata-heading"
          >
            <h2 className={styles.sectionTitle} id="demo-metadata-heading">
              Demo metadata
            </h2>
            <Label className={styles.field}>
              Demo title
              <Input
                value={demoDraft.title}
                onChange={(event) =>
                  updateDemoDraft("title", event.target.value)
                }
              />
            </Label>
            <Label className={styles.field}>
              Demo description
              <Textarea
                value={demoDraft.description}
                onChange={(event) =>
                  updateDemoDraft("description", event.target.value)
                }
              />
            </Label>
            <Button
              disabled={pendingAction === "demo"}
              onClick={handleSaveDemo}
            >
              {pendingAction === "demo" ? "Saving demo..." : "Save demo"}
            </Button>
            {message ? <div className={styles.message}>{message}</div> : null}
          </section>

          <ArtifactPublishingPanel
            projectId={projectId}
            projectVersionId={demo.project_version_id}
            artifactType="interactive_demo"
            artifactId={interactiveDemoId}
            editionVersion={demo.version}
            workingDraftVersion={workingDraftVersion}
            publicationReadOnly={demo.status === "archived"}
          />
        </div>

        <section aria-labelledby="demo-scenes-heading">
          <h2 className={styles.sectionTitle} id="demo-scenes-heading">
            Scenes
          </h2>
          {orderedScenes.length === 0 ? (
            <div className={styles.empty}>No scenes yet.</div>
          ) : (
            <div className={styles.sceneList}>
              {orderedScenes.map((scene, index) => (
                <SceneEditor
                  key={scene.id}
                  projectId={projectId}
                  scene={scene}
                  sceneNumber={index + 1}
                  isFirst={index === 0}
                  isLast={index === orderedScenes.length - 1}
                  draft={
                    sceneDrafts[scene.id] ?? { title: "", description: "" }
                  }
                  pendingAction={pendingAction}
                  resolveAssetUrl={resolveAssetUrl}
                  scenes={orderedScenes}
                  hotspots={sortedHotspots(hotspotsBySceneId[scene.id] ?? [])}
                  hotspotDrafts={hotspotDrafts}
                  updateDraft={updateSceneDraft}
                  updateHotspotDraft={updateHotspotDraft}
                  saveCurrentScene={handleSaveScene}
                  moveScene={(direction) => moveScene(index, direction)}
                  deleteCurrentScene={handleDeleteScene}
                  createCurrentHotspot={handleCreateHotspot}
                  saveCurrentHotspot={handleSaveHotspot}
                  moveHotspot={(hotspotIndex, direction) =>
                    moveHotspot(scene, hotspotIndex, direction)
                  }
                  deleteCurrentHotspot={handleDeleteHotspot}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
};

const SceneEditor = ({
  projectId,
  scene,
  sceneNumber,
  isFirst,
  isLast,
  draft,
  pendingAction,
  resolveAssetUrl,
  scenes,
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
}: {
  projectId: string;
  scene: DemoScene;
  sceneNumber: number;
  isFirst: boolean;
  isLast: boolean;
  draft: SceneDraft;
  pendingAction: string | null;
  resolveAssetUrl: (fileUrl: string) => string;
  scenes: DemoScene[];
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
}) => {
  const assetFileUrl = sceneAssetFileUrl(projectId, scene);
  const imageAlt = `${scene.title ?? `Scene ${sceneNumber}`} screenshot`;
  const pending = pendingAction !== null;

  return (
    <article className={styles.scene}>
      <div className={styles.sceneHeader}>
        <h3 className={styles.sceneTitle}>
          {scene.title ?? `Scene ${sceneNumber}`}
        </h3>
        <div className={styles.sceneActions}>
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
            onClick={() => void deleteCurrentScene(scene)}
          >
            Delete scene {sceneNumber}
          </Button>
        </div>
      </div>
      <div className={styles.screenshotFrame}>
        {assetFileUrl ? (
          <>
            <img
              className={styles.screenshot}
              src={resolveAssetUrl(assetFileUrl)}
              alt={imageAlt}
            />
            {hotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                type="button"
                className={styles.hotspotOverlay}
                aria-label={`Hotspot ${hotspot.label ?? hotspot.hotspot_index}`}
                style={{
                  left: `${hotspot.x * 100}%`,
                  top: `${hotspot.y * 100}%`,
                  width: `${hotspot.width * 100}%`,
                  height: `${hotspot.height * 100}%`,
                }}
              />
            ))}
          </>
        ) : (
          <div className={styles.placeholder}>No screenshot attached.</div>
        )}
      </div>
      <Label className={styles.field}>
        Scene {sceneNumber} title
        <Input
          value={draft.title}
          onChange={(event) =>
            updateDraft(scene.id, "title", event.target.value)
          }
        />
      </Label>
      <Label className={styles.field}>
        Scene {sceneNumber} description
        <Textarea
          value={draft.description}
          onChange={(event) =>
            updateDraft(scene.id, "description", event.target.value)
          }
        />
      </Label>
      <Button
        disabled={pendingAction === `scene:${scene.id}`}
        onClick={() => void saveCurrentScene(scene)}
      >
        {pendingAction === `scene:${scene.id}`
          ? `Saving scene ${sceneNumber}...`
          : `Save scene ${sceneNumber}`}
      </Button>
      <section
        className={styles.hotspotSection}
        aria-label={`Scene ${sceneNumber} hotspots`}
      >
        <div className={styles.hotspotHeader}>
          <h4 className={styles.hotspotTitle}>Hotspots</h4>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => void createCurrentHotspot(scene)}
          >
            Add hotspot to scene {sceneNumber}
          </Button>
        </div>
        {hotspots.length === 0 ? (
          <div className={styles.emptyInline}>No hotspots yet.</div>
        ) : (
          <div className={styles.hotspotList}>
            {hotspots.map((hotspot, hotspotIndex) => {
              const hotspotNumber = hotspotIndex + 1;
              const hotspotDraft =
                hotspotDrafts[hotspot.id] ?? hotspotDraftFromHotspot(hotspot);

              return (
                <div className={styles.hotspotEditor} key={hotspot.id}>
                  <div className={styles.hotspotEditorHeader}>
                    <strong>Hotspot {hotspotNumber}</strong>
                    <div className={styles.sceneActions}>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending || hotspotIndex === 0}
                        onClick={() => void moveHotspot(hotspotIndex, -1)}
                      >
                        Move hotspot {hotspotNumber} up
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={
                          pending || hotspotIndex === hotspots.length - 1
                        }
                        onClick={() => void moveHotspot(hotspotIndex, 1)}
                      >
                        Move hotspot {hotspotNumber} down
                      </Button>
                    </div>
                  </div>
                  <Label className={styles.field}>
                    Hotspot {hotspotNumber} type
                    <Select
                      value={hotspotDraft.hotspot_type}
                      onChange={(event) =>
                        updateHotspotDraft(
                          hotspot.id,
                          "hotspot_type",
                          event.target.value as DemoHotspotType,
                        )
                      }
                    >
                      {DEMO_HOTSPOT_TYPES.map((hotspotType) => (
                        <option key={hotspotType} value={hotspotType}>
                          {hotspotType}
                        </option>
                      ))}
                    </Select>
                  </Label>
                  <Label className={styles.field}>
                    Hotspot {hotspotNumber} label
                    <Input
                      value={hotspotDraft.label}
                      onChange={(event) =>
                        updateHotspotDraft(
                          hotspot.id,
                          "label",
                          event.target.value,
                        )
                      }
                    />
                  </Label>
                  <Label className={styles.field}>
                    Hotspot {hotspotNumber} content
                    <Textarea
                      value={hotspotDraft.content}
                      onChange={(event) =>
                        updateHotspotDraft(
                          hotspot.id,
                          "content",
                          event.target.value,
                        )
                      }
                    />
                  </Label>
                  <div className={styles.coordinateGrid}>
                    <Label className={styles.field}>
                      Hotspot {hotspotNumber} x
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={hotspotDraft.x}
                        onChange={(event) =>
                          updateHotspotDraft(
                            hotspot.id,
                            "x",
                            event.target.value,
                          )
                        }
                      />
                    </Label>
                    <Label className={styles.field}>
                      Hotspot {hotspotNumber} y
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={hotspotDraft.y}
                        onChange={(event) =>
                          updateHotspotDraft(
                            hotspot.id,
                            "y",
                            event.target.value,
                          )
                        }
                      />
                    </Label>
                    <Label className={styles.field}>
                      Hotspot {hotspotNumber} width
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        value={hotspotDraft.width}
                        onChange={(event) =>
                          updateHotspotDraft(
                            hotspot.id,
                            "width",
                            event.target.value,
                          )
                        }
                      />
                    </Label>
                    <Label className={styles.field}>
                      Hotspot {hotspotNumber} height
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        value={hotspotDraft.height}
                        onChange={(event) =>
                          updateHotspotDraft(
                            hotspot.id,
                            "height",
                            event.target.value,
                          )
                        }
                      />
                    </Label>
                  </div>
                  <Label className={styles.field}>
                    Hotspot {hotspotNumber} target scene
                    <Select
                      value={hotspotDraft.target_scene_id}
                      onChange={(event) =>
                        updateHotspotDraft(
                          hotspot.id,
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
                  <div className={styles.sceneActions}>
                    <Button
                      size="sm"
                      disabled={pendingAction === `hotspot:save:${hotspot.id}`}
                      onClick={() => void saveCurrentHotspot(scene, hotspot)}
                    >
                      {pendingAction === `hotspot:save:${hotspot.id}`
                        ? `Saving hotspot ${hotspotNumber}...`
                        : `Save hotspot ${hotspotNumber}`}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={
                        pendingAction === `hotspot:delete:${hotspot.id}`
                      }
                      onClick={() => void deleteCurrentHotspot(scene, hotspot)}
                    >
                      Delete hotspot {hotspotNumber}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </article>
  );
};
