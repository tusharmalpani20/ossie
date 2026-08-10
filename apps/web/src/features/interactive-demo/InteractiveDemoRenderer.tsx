import { useEffect, useMemo, useRef, useState } from "react";
import type { DemoHotspotType } from "@repo/constants";
import { StatusPanel } from "@repo/ui/status-panel";
import styles from "./InteractiveDemoRenderer.module.css";

export type InteractiveDemoRenderHotspot = {
  id: string;
  type: DemoHotspotType;
  label: string | null;
  content: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  targetSceneId: string | null;
};

export type InteractiveDemoRenderScene = {
  id: string;
  sceneIndex: number;
  title: string | null;
  description: string | null;
  backgroundAssetId: string | null;
  hotspots: InteractiveDemoRenderHotspot[];
};

export const InteractiveDemoRenderer = ({
  title,
  description,
  scenes,
  assets,
  showTitle = true,
  emptyMessage = "This demo has no scenes.",
}: {
  title: string;
  description?: string | null;
  scenes: InteractiveDemoRenderScene[];
  assets: Array<{
    id: string;
    fileUrl: string;
    width?: number | null;
    height?: number | null;
  }>;
  showTitle?: boolean;
  emptyMessage?: string;
}) => {
  const orderedScenes = useMemo(
    () => [...scenes].sort((a, b) => a.sceneIndex - b.sceneIndex),
    [scenes],
  );
  const [sceneId, setSceneId] = useState(orderedScenes[0]?.id ?? null);
  const [history, setHistory] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [failedBackgroundKey, setFailedBackgroundKey] = useState<string | null>(
    null,
  );
  const [resolvedBackgroundUrl, setResolvedBackgroundUrl] = useState<
    string | null
  >(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusSceneRef = useRef(false);
  const assetsById = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets],
  );
  const scene =
    orderedScenes.find((candidate) => candidate.id === sceneId) ??
    orderedScenes[0];

  useEffect(() => {
    if (scene && scene.id !== sceneId) setSceneId(scene.id);
  }, [scene, sceneId]);
  useEffect(() => {
    if (!focusSceneRef.current) return;
    focusSceneRef.current = false;
    headingRef.current?.focus();
  }, [sceneId]);

  const sceneTitle = scene
    ? (scene.title ?? `Scene ${scene.sceneIndex}`)
    : title;
  const backgroundAsset = scene?.backgroundAssetId
    ? assetsById.get(scene.backgroundAssetId)
    : null;
  const backgroundUrl = backgroundAsset?.fileUrl;
  const backgroundKey =
    scene && backgroundUrl && backgroundAsset
      ? `${scene.id}:${backgroundAsset.id}:${backgroundUrl}`
      : null;
  const sameOriginBackground = backgroundUrl
    ? new URL(backgroundUrl, window.location.href).origin ===
      window.location.origin
    : false;
  const displayBackgroundUrl = sameOriginBackground
    ? backgroundUrl
    : resolvedBackgroundUrl;
  const backgroundAvailable =
    Boolean(displayBackgroundUrl) && failedBackgroundKey !== backgroundKey;

  useEffect(() => {
    if (!backgroundUrl || sameOriginBackground) {
      setResolvedBackgroundUrl(null);
      return;
    }

    const controller = new AbortController();
    let active = true;
    let objectUrl: string | null = null;
    setResolvedBackgroundUrl(null);

    void fetch(backgroundUrl, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Captured screen request failed");
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setResolvedBackgroundUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (active) {
          setResolvedBackgroundUrl(null);
          setFailedBackgroundKey(backgroundKey);
        }
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [backgroundKey, backgroundUrl, sameOriginBackground]);

  if (!scene) {
    return (
      <section className={styles.emptyViewer} aria-label={title}>
        {showTitle ? <h1>{title}</h1> : null}
        {showTitle && description ? <p>{description}</p> : null}
        <StatusPanel
          className={styles.emptyState}
          tone="empty"
          title={emptyMessage}
          description="Published demos need at least one Scene before they can be played."
          titleAs="h2"
        />
      </section>
    );
  }

  const activate = (hotspot: InteractiveDemoRenderHotspot) => {
    const target = hotspot.targetSceneId
      ? orderedScenes.find(
          (candidate) => candidate.id === hotspot.targetSceneId,
        )
      : null;
    if (hotspot.targetSceneId && !target) {
      setAnnouncement("The target Scene is unavailable.");
      return;
    }
    if (!target) {
      setAnnouncement(
        hotspot.content ??
          hotspot.label ??
          "This Hotspot does not navigate to another Scene.",
      );
      return;
    }
    setHistory((current) => [...current, scene.id]);
    focusSceneRef.current = true;
    setSceneId(target.id);
    setAnnouncement(
      `Moved to Scene ${target.sceneIndex}: ${target.title ?? "Untitled Scene"}`,
    );
  };

  const goBack = () => {
    const targetId = history.at(-1);
    if (!targetId) return;
    setHistory((current) => current.slice(0, -1));
    focusSceneRef.current = true;
    setSceneId(targetId);
  };

  return (
    <section className={styles.viewer} aria-label={title}>
      <header className={styles.header}>
        <div>
          {showTitle ? <h1>{title}</h1> : null}
          {showTitle && description ? <p>{description}</p> : null}
        </div>
        <span>
          Scene {scene.sceneIndex} of {orderedScenes.length}
        </span>
      </header>
      <div className={styles.sceneHeader}>
        <h2 ref={headingRef} tabIndex={-1}>
          {sceneTitle}
        </h2>
        {scene.description ? <p>{scene.description}</p> : null}
      </div>
      <div
        className={styles.canvas}
        data-testid="interactive-demo-scene-canvas"
        style={
          backgroundAsset?.width && backgroundAsset.height
            ? {
                aspectRatio: `${backgroundAsset.width} / ${backgroundAsset.height}`,
              }
            : undefined
        }
      >
        {backgroundAvailable ? (
          <img
            src={displayBackgroundUrl!}
            alt={`${sceneTitle} captured screen`}
            onError={() => setFailedBackgroundKey(backgroundKey)}
          />
        ) : (
          <div className={styles.missing} role="alert">
            Captured screen is unavailable.
          </div>
        )}
        {backgroundAvailable
          ? scene.hotspots.map((hotspot) => (
              <button
                className={styles.hotspot}
                key={hotspot.id}
                onClick={() => activate(hotspot)}
                style={{
                  left: `${hotspot.x * 100}%`,
                  top: `${hotspot.y * 100}%`,
                  width: `${hotspot.width * 100}%`,
                  height: `${hotspot.height * 100}%`,
                }}
                title={hotspot.content ?? undefined}
              >
                <span>{hotspot.label ?? hotspot.content ?? "Continue"}</span>
              </button>
            ))
          : null}
      </div>
      <div className={styles.controls}>
        <button type="button" disabled={!history.length} onClick={goBack}>
          Previous Scene
        </button>
        <button
          type="button"
          disabled={scene.id === orderedScenes[0]?.id}
          onClick={() => {
            setHistory([]);
            focusSceneRef.current = true;
            setSceneId(orderedScenes[0]!.id);
          }}
        >
          Restart
        </button>
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
};
