import { useEffect, useMemo, useRef, useState } from "react";
import { StatusPanel } from "@repo/ui/status-panel";
import type { CaptureAssetWithFileUrl } from "@repo/types/capture";
import {
  archiveInteractiveDemo,
  createInteractiveDemoScene,
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
} from "../../lib/api";
import { currentBrowserPath } from "../auth/navigation";
import {
  demoDraftFromDemo,
  hotspotDraftFromHotspot,
  hotspotDraftsFromHotspots,
  hasUnsavedHotspotDrafts,
  hasUnsavedSceneDrafts,
  mergeConfirmedHotspotDrafts,
  mergeConfirmedSceneDrafts,
  loadOptionalBackgroundAssets,
  refreshedBackgroundAssets,
  sceneDraftsFromScenes,
  sortedHotspots,
  sortedScenes,
  updateInputFromHotspotDraft,
  type DemoDraft,
  type HotspotDraft,
  type SceneDraft,
} from "./interactiveDemoEditorHelpers";
import { InteractiveDemoSceneEditor } from "./InteractiveDemoSceneEditor";
import { InteractiveDemoWorkbench } from "./InteractiveDemoWorkbench";
import { InteractiveDemoReadOnlyPage } from "./InteractiveDemoReadOnlyPage";
import { InteractiveDemoEditorShell as PortalShell } from "./InteractiveDemoEditorShell";
import { InteractiveDemoEditorLoadBoundary } from "./InteractiveDemoEditorLoadBoundary";
import type {
  InteractiveDemoEditorLoadState as LoadState,
  InteractiveDemoEditorPageProps,
} from "./interactiveDemoEditorContracts";
import { interactiveDemoLoadStateFromError as loadStateFromError } from "./interactiveDemoLoadState";
import type {
  CreateDemoHotspotInput,
  DemoHotspot,
  DemoScene,
  InteractiveDemo,
} from "./types";
import styles from "./InteractiveDemoEditorPage.module.css";

export const InteractiveDemoEditorPage = ({
  projectId,
  projectVersionId,
  interactiveDemoId,
  loadDemo = (id, artifactId) =>
    getInteractiveDemo(id, artifactId, projectVersionId),
  loadScenes = (id, artifactId) =>
    listInteractiveDemoScenes(id, artifactId, projectVersionId),
  loadBackgroundAssets,
  createScene = (id, artifactId, input) =>
    createInteractiveDemoScene(id, artifactId, input, projectVersionId),
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
  renderShell = true,
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

    const assetRequest = loadOptionalBackgroundAssets(
      loadBackgroundAssets
        ? () => loadBackgroundAssets(projectId, projectVersionId)
        : undefined,
    );

    Promise.all([
      loadDemo(projectId, interactiveDemoId),
      loadScenes(projectId, interactiveDemoId),
      assetRequest,
    ])
      .then(async ([demoResponse, sceneResponse, assetResult]) => {
        const assetResponse = assetResult.response;
        const scenes = sortedScenes(sceneResponse.demo_scenes);
        const hotspotEntries = await Promise.all(
          scenes.map(async (scene) => {
            const response = await loadHotspots(
              projectId,
              interactiveDemoId,
              scene.id,
            );
            return [scene.id, sortedHotspots(response.demo_hotspots)] as const;
          }),
        );

        if (active) {
          const assetsById = new Map(
            [
              ...(assetResponse?.capture_assets ?? []),
              ...sceneResponse.background_capture_assets,
            ].map((asset) => [asset.id, asset]),
          );
          setState({
            status: "loaded",
            demo: demoResponse.edition,
            scenes,
            hotspotsBySceneId: Object.fromEntries(hotspotEntries),
            backgroundAssets: [...assetsById.values()],
            selectableBackgroundAssetIds:
              assetResponse?.capture_assets.map((asset) => asset.id) ?? [],
            backgroundPickerError: assetResult.failed,
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

  if (state.status !== "loaded") {
    return (
      <InteractiveDemoEditorLoadBoundary
        state={state}
        projectId={projectId}
        interactiveDemoId={interactiveDemoId}
        currentPath={currentPath}
        performLogout={performLogout}
        navigate={navigate}
        renderShell={renderShell}
        onRetry={() => setReloadKey((key) => key + 1)}
      />
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
    const response = await changeEditionStatus(
      command,
      projectId,
      interactiveDemoId,
      projectVersionId,
      state.demo.version,
    );
    setState({ ...state, demo: response.edition });
  };

  const retryBackgroundAssets = async () => {
    if (state.status !== "loaded" || !loadBackgroundAssets) return;
    try {
      const response = await loadBackgroundAssets(projectId, projectVersionId);
      setState({
        ...state,
        backgroundAssets: refreshedBackgroundAssets(
          state.scenes,
          state.backgroundAssets,
          response.capture_assets,
        ),
        selectableBackgroundAssetIds: response.capture_assets.map(
          (asset) => asset.id,
        ),
        backgroundPickerError: false,
      });
    } catch {
      setState({ ...state, backgroundPickerError: true });
    }
  };

  if (!canWrite || state.demo.status === "archived") {
    return (
      <InteractiveDemoReadOnlyPage
        projectId={projectId}
        interactiveDemoId={interactiveDemoId}
        demo={state.demo}
        scenes={state.scenes}
        hotspotsBySceneId={state.hotspotsBySceneId}
        backgroundAssets={state.backgroundAssets}
        workingDraftVersion={workingDraftVersion}
        canWrite={canWrite}
        versionSlug={versionSlug}
        resolveAssetUrl={resolveAssetUrl}
        performLogout={performLogout}
        navigate={navigate}
        renderShell={renderShell}
        onRestore={changeLifecycle}
      />
    );
  }

  return (
    <InteractiveDemoEditorLoaded
      projectId={projectId}
      interactiveDemoId={interactiveDemoId}
      demo={state.demo}
      scenes={state.scenes}
      hotspotsBySceneId={state.hotspotsBySceneId}
      backgroundAssets={state.backgroundAssets}
      selectableBackgroundAssetIds={state.selectableBackgroundAssetIds}
      backgroundPickerError={state.backgroundPickerError}
      retryBackgroundAssets={() => void retryBackgroundAssets()}
      initialWorkingDraftVersion={workingDraftVersion}
      saveDemo={saveDemo}
      createScene={createScene}
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
      renderShell={renderShell}
      onReload={() => setReloadKey((key) => key + 1)}
    />
  );
};

const InteractiveDemoEditorLoaded = ({
  projectId,
  interactiveDemoId,
  demo,
  scenes,
  hotspotsBySceneId,
  backgroundAssets,
  selectableBackgroundAssetIds,
  backgroundPickerError,
  retryBackgroundAssets,
  initialWorkingDraftVersion,
  saveDemo,
  createScene,
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
  renderShell,
  onReload,
}: {
  projectId: string;
  interactiveDemoId: string;
  demo: InteractiveDemo;
  scenes: DemoScene[];
  hotspotsBySceneId: Record<string, DemoHotspot[]>;
  backgroundAssets: CaptureAssetWithFileUrl[];
  selectableBackgroundAssetIds: string[];
  backgroundPickerError: boolean;
  retryBackgroundAssets: () => void;
  initialWorkingDraftVersion: number;
  saveDemo: NonNullable<InteractiveDemoEditorPageProps["saveDemo"]>;
  createScene: NonNullable<InteractiveDemoEditorPageProps["createScene"]>;
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
    backgroundAssets: CaptureAssetWithFileUrl[];
    selectableBackgroundAssetIds: string[];
    backgroundPickerError: boolean;
  }) => void;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  onChangeLifecycle: () => Promise<void>;
  versionSlug?: string;
  renderShell: boolean;
  onReload: () => void;
}) => {
  const orderedScenes = useMemo(() => sortedScenes(scenes), [scenes]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    orderedScenes[0]?.id ?? null,
  );
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
  const [conflict, setConflict] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const aggregateMutationRef = useRef(false);
  const [workingDraftVersion, setWorkingDraftVersion] = useState(
    initialWorkingDraftVersion,
  );
  const hasUnsavedMetadata =
    demoDraft.title !== demo.title ||
    demoDraft.description !== (demo.description ?? "");
  const hasUnsavedChanges =
    hasUnsavedMetadata ||
    hasUnsavedSceneDrafts(sceneDrafts, orderedScenes) ||
    hasUnsavedHotspotDrafts(hotspotDrafts, hotspotsBySceneId);
  const selectedScene =
    orderedScenes.find((scene) => scene.id === selectedSceneId) ??
    orderedScenes[0] ??
    null;

  useEffect(() => {
    if (
      !selectedSceneId ||
      !orderedScenes.some((scene) => scene.id === selectedSceneId)
    ) {
      setSelectedSceneId(orderedScenes[0]?.id ?? null);
    }
  }, [orderedScenes, selectedSceneId]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateLoadedState = (
    nextDemo: InteractiveDemo,
    nextScenes: DemoScene[],
    nextHotspotsBySceneId: Record<string, DemoHotspot[]>,
  ) => {
    setLoadedState({
      demo: nextDemo,
      scenes: nextScenes,
      hotspotsBySceneId: nextHotspotsBySceneId,
      backgroundAssets,
      selectableBackgroundAssetIds,
      backgroundPickerError,
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
        ...(drafts[sceneId] ?? {
          title: "",
          description: "",
          background_capture_asset_id: "",
        }),
        [field]: value,
      },
    }));
    setMessage(null);
  };

  const handleWorkingDraftFailure = (error: unknown, fallback: string) => {
    const type =
      typeof error === "object" && error !== null && "type" in error
        ? String(error.type)
        : "";
    if (type.includes("conflict")) {
      setConflict(true);
      setMessage(
        "This Working Draft changed elsewhere. Your local changes are still here.",
      );
    } else {
      setMessage(fallback);
    }
  };

  const beginAggregateMutation = (action: string) => {
    if (aggregateMutationRef.current || conflict) return false;
    aggregateMutationRef.current = true;
    setPendingAction(action);
    setMessage(null);
    return true;
  };

  const endAggregateMutation = () => {
    aggregateMutationRef.current = false;
    setPendingAction(null);
  };

  const handleSaveDemo = async () => {
    if (!beginAggregateMutation("demo")) return;

    try {
      const response = await saveDemo(projectId, interactiveDemoId, {
        title: demoDraft.title.trim(),
        description: demoDraft.description.trim() || null,
        expected_edition_version: demo.version,
      });
      updateLoadedState(response.edition, orderedScenes, hotspotsBySceneId);
      setDemoDraft(demoDraftFromDemo(response.edition));
      setMessage("Demo saved.");
      setConflict(false);
    } catch (error) {
      const type =
        typeof error === "object" && error !== null && "type" in error
          ? String(error.type)
          : "";
      if (type.includes("conflict")) {
        setConflict(true);
        setMessage(
          "This Demo Edition changed elsewhere. Your local changes are still here.",
        );
      } else {
        setMessage("Could not save demo.");
      }
    } finally {
      endAggregateMutation();
    }
  };

  const handleCreateScene = async () => {
    if (!beginAggregateMutation("scene:create")) return;
    try {
      const response = await createScene(projectId, interactiveDemoId, {
        title: `Scene ${orderedScenes.length + 1}`,
        description: null,
        background_capture_asset_id: null,
        expected_working_draft_version: workingDraftVersion,
      });
      const nextScenes = sortedScenes([...orderedScenes, response.demo_scene]);
      setWorkingDraftVersion(response.working_draft.version);
      setSelectedSceneId(response.demo_scene.id);
      updateLoadedState(demo, nextScenes, {
        ...hotspotsBySceneId,
        [response.demo_scene.id]: [],
      });
      setSceneDrafts((drafts) => ({
        ...drafts,
        [response.demo_scene.id]: sceneDraftsFromScenes([response.demo_scene])[
          response.demo_scene.id
        ] ?? {
          title: "",
          description: "",
          background_capture_asset_id: "",
        },
      }));
    } catch (error) {
      const type =
        typeof error === "object" && error !== null && "type" in error
          ? String(error.type)
          : "";
      if (type.includes("conflict")) {
        setConflict(true);
        setMessage(
          "This Working Draft changed elsewhere. Reload after reviewing local changes.",
        );
      } else {
        setMessage("Could not create scene.");
      }
    } finally {
      endAggregateMutation();
    }
  };

  const runAggregateMutation = async <Result,>(
    _command: "publication",
    operation: () => Promise<Result>,
  ) => {
    if (aggregateMutationRef.current || conflict) {
      throw new Error("Another Demo change is still in progress");
    }
    beginAggregateMutation("publication");
    try {
      return await operation();
    } finally {
      endAggregateMutation();
    }
  };

  const handleChangeLifecycle = async () => {
    if (!beginAggregateMutation("lifecycle")) return;
    try {
      await onChangeLifecycle();
    } catch {
      setMessage("Could not archive demo.");
    } finally {
      endAggregateMutation();
    }
  };

  const handleSaveScene = async (scene: DemoScene) => {
    const draft = sceneDrafts[scene.id] ?? {
      title: "",
      description: "",
      background_capture_asset_id: "",
    };
    if (!beginAggregateMutation(`scene:${scene.id}`)) return;

    try {
      const response = await saveScene(projectId, interactiveDemoId, scene.id, {
        title: draft.title.trim() || null,
        description: draft.description.trim() || null,
        background_capture_asset_id: draft.background_capture_asset_id || null,
        expected_working_draft_version: workingDraftVersion,
      });
      setWorkingDraftVersion(response.working_draft.version);
      const nextScenes = orderedScenes.map((candidate) =>
        candidate.id === response.demo_scene.id
          ? response.demo_scene
          : candidate,
      );
      updateLoadedState(demo, nextScenes, hotspotsBySceneId);
      setSceneDrafts((drafts) =>
        mergeConfirmedSceneDrafts(drafts, response.demo_scene),
      );
      setMessage("Scene saved.");
    } catch (error) {
      handleWorkingDraftFailure(error, "Could not save scene.");
    } finally {
      endAggregateMutation();
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
    if (!beginAggregateMutation("reorder")) return;

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
      setMessage(
        `Scene moved to position ${nextScenes.findIndex((scene) => scene.id === movingSceneId) + 1}.`,
      );
    } catch (error) {
      handleWorkingDraftFailure(error, "Could not reorder scenes.");
    } finally {
      endAggregateMutation();
    }
  };

  const handleDeleteScene = async (scene: DemoScene) => {
    if (!beginAggregateMutation(`delete:${scene.id}`)) return;

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
      const deletedIndex = orderedScenes.findIndex(
        (candidate) => candidate.id === scene.id,
      );
      setSelectedSceneId(
        nextScenes[Math.min(deletedIndex, nextScenes.length - 1)]?.id ?? null,
      );
      const nextHotspotsBySceneId = { ...hotspotsBySceneId };
      delete nextHotspotsBySceneId[scene.id];
      updateLoadedState(demo, nextScenes, nextHotspotsBySceneId);
      setSceneDrafts((drafts) => {
        const next = { ...drafts };
        delete next[scene.id];
        return next;
      });
    } catch (error) {
      handleWorkingDraftFailure(error, "Could not delete scene.");
    } finally {
      endAggregateMutation();
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

  const replaceSceneHotspots = (
    sceneId: string,
    hotspots: DemoHotspot[],
    confirmedHotspot?: DemoHotspot,
    deletedHotspotId?: string,
  ) => {
    const nextHotspotsBySceneId = {
      ...hotspotsBySceneId,
      [sceneId]: sortedHotspots(hotspots),
    };
    updateLoadedState(demo, orderedScenes, nextHotspotsBySceneId);
    setHotspotDrafts((drafts) => {
      let next = confirmedHotspot
        ? mergeConfirmedHotspotDrafts(drafts, confirmedHotspot)
        : drafts;
      if (deletedHotspotId) {
        next = { ...next };
        delete next[deletedHotspotId];
      }
      return next;
    });
  };

  const handleCreateHotspot = async (scene: DemoScene) => {
    const input: CreateDemoHotspotInput = {
      hotspot_type: "click",
      label: "New hotspot",
      content: null,
      x: 0.4,
      y: 0.35,
      width: 0.2,
      height: 0.12,
      transition: null,
      expected_working_draft_version: workingDraftVersion,
    };

    if (!beginAggregateMutation(`hotspot:create:${scene.id}`)) return;

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
      ], response.demo_hotspot);
    } catch (error) {
      handleWorkingDraftFailure(error, "Could not create hotspot.");
    } finally {
      endAggregateMutation();
    }
  };

  const handleSaveHotspot = async (scene: DemoScene, hotspot: DemoHotspot) => {
    const input = updateInputFromHotspotDraft(
      hotspotDrafts[hotspot.id] ?? hotspotDraftFromHotspot(hotspot),
      workingDraftVersion,
    );
    if (!input) {
      setMessage("Hotspot coordinates must stay inside the screenshot.");
      return;
    }

    if (!beginAggregateMutation(`hotspot:save:${hotspot.id}`)) return;

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
        response.demo_hotspot,
      );
      setMessage("Hotspot saved.");
    } catch (error) {
      handleWorkingDraftFailure(error, "Could not save hotspot.");
    } finally {
      endAggregateMutation();
    }
  };

  const handleDeleteHotspot = async (
    scene: DemoScene,
    hotspot: DemoHotspot,
  ) => {
    if (!beginAggregateMutation(`hotspot:delete:${hotspot.id}`)) return;

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
        undefined,
        hotspot.id,
      );
    } catch (error) {
      handleWorkingDraftFailure(error, "Could not delete hotspot.");
    } finally {
      endAggregateMutation();
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
    if (!beginAggregateMutation(`hotspot:reorder:${scene.id}`)) return;

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
      setMessage(
        `Hotspot moved to position ${response.demo_hotspots.findIndex((hotspot) => hotspot.id === movingHotspotId) + 1}.`,
      );
    } catch (error) {
      handleWorkingDraftFailure(error, "Could not reorder hotspots.");
    } finally {
      endAggregateMutation();
    }
  };

  return (
    <PortalShell
      projectId={projectId}
      interactiveDemoId={interactiveDemoId}
      performLogout={performLogout}
      navigate={navigate}
      renderShell={renderShell}
    >
      <InteractiveDemoWorkbench
        projectId={projectId}
        interactiveDemoId={interactiveDemoId}
        demo={demo}
        demoDraft={demoDraft}
        workingDraftVersion={workingDraftVersion}
        pendingAction={pendingAction}
        conflict={conflict}
        hasUnsavedMetadata={hasUnsavedMetadata}
        message={message}
        versionSlug={versionSlug}
        onUpdateDemoDraft={updateDemoDraft}
        onSaveDemo={handleSaveDemo}
        onCreateScene={handleCreateScene}
        onChangeLifecycle={handleChangeLifecycle}
        onReload={onReload}
        runAggregateMutation={runAggregateMutation}
      >
        {orderedScenes.length === 0 || !selectedScene ? (
          <StatusPanel
            className={styles.empty}
            tone="empty"
            title="No scenes yet."
            description="Add a Scene to begin authoring this Interactive Demo."
            titleAs="h3"
          />
        ) : (
          <>
            <nav aria-label="Scene rail" className={styles.sceneRail}>
              {orderedScenes.map((scene, index) => (
                <button
                  aria-current={
                    scene.id === selectedScene.id ? "true" : undefined
                  }
                  key={scene.id}
                  onClick={() => setSelectedSceneId(scene.id)}
                  type="button"
                >
                  Select Scene {index + 1}: {scene.title ?? "Untitled Scene"}
                </button>
              ))}
            </nav>
            <div className={styles.sceneList}>
              <InteractiveDemoSceneEditor
                key={selectedScene.id}
                projectId={projectId}
                scene={selectedScene}
                sceneNumber={orderedScenes.indexOf(selectedScene) + 1}
                isFirst={orderedScenes.indexOf(selectedScene) === 0}
                isLast={
                  orderedScenes.indexOf(selectedScene) ===
                  orderedScenes.length - 1
                }
                draft={
                  sceneDrafts[selectedScene.id] ?? {
                    title: "",
                    description: "",
                    background_capture_asset_id: "",
                  }
                }
                pendingAction={conflict ? "conflict" : pendingAction}
                resolveAssetUrl={resolveAssetUrl}
                scenes={orderedScenes}
                backgroundAssets={backgroundAssets}
                selectableBackgroundAssetIds={selectableBackgroundAssetIds}
                backgroundPickerError={backgroundPickerError}
                retryBackgroundAssets={retryBackgroundAssets}
                hotspots={sortedHotspots(
                  hotspotsBySceneId[selectedScene.id] ?? [],
                )}
                hotspotDrafts={hotspotDrafts}
                updateDraft={updateSceneDraft}
                updateHotspotDraft={updateHotspotDraft}
                saveCurrentScene={handleSaveScene}
                moveScene={(direction) =>
                  moveScene(orderedScenes.indexOf(selectedScene), direction)
                }
                deleteCurrentScene={handleDeleteScene}
                createCurrentHotspot={handleCreateHotspot}
                saveCurrentHotspot={handleSaveHotspot}
                moveHotspot={(hotspotIndex, direction) =>
                  moveHotspot(selectedScene, hotspotIndex, direction)
                }
                deleteCurrentHotspot={handleDeleteHotspot}
              />
            </div>
          </>
        )}
      </InteractiveDemoWorkbench>
    </PortalShell>
  );
};
