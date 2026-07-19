import { useEffect, useMemo, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  ApiClientError,
  createPublicPublishViewerSession,
  getPublicPublishLink,
  resolveApiAssetUrl,
} from "../../lib/api";
import type {
  DemoHotspotType,
  PublishedInteractiveDemoSnapshot,
  PublishedInteractiveDemoSnapshotAsset,
  PublishedInteractiveDemoSnapshotHotspot,
  PublishedInteractiveDemoSnapshotScene,
  PublicPublishLinkResponse,
} from "./types";
import styles from "./PublicInteractiveDemoViewerPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; response: PublicPublishLinkResponse; snapshot: PublishedInteractiveDemoSnapshot }
  | { status: "not_found" }
  | { status: "restricted" }
  | { status: "expired" }
  | { status: "password_required" }
  | { status: "malformed" }
  | { status: "error" };

export type PublicInteractiveDemoViewerPageProps = {
  slug: string;
  mode?: "page" | "embed";
  loadPublishLink?: (slug: string, surface?: "reader" | "embed") => Promise<PublicPublishLinkResponse>;
  createViewerSession?: (slug: string, input: { password: string }, surface?: "reader" | "embed") => Promise<void>;
};

const is_record = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === "object" && !Array.isArray(value)
);

const nullable_string = (value: unknown): string | null => (
  typeof value === "string" ? value : null
);

const number_or_zero = (value: unknown) => (
  typeof value === "number" && Number.isFinite(value) ? value : 0
);

const optional_number = (value: unknown): number | null => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);

const parse_asset = (value: unknown): PublishedInteractiveDemoSnapshotAsset | null => {
  if (!is_record(value) || typeof value.id !== "string" || typeof value.file_url !== "string") {
    return null;
  }

  const file = is_record(value.file) ? value.file : {};

  return {
    id: value.id,
    asset_type: value.asset_type === "redacted_screenshot" ? "redacted_screenshot" : "screenshot",
    width: optional_number(value.width),
    height: optional_number(value.height),
    page_title: nullable_string(value.page_title),
    page_url: nullable_string(value.page_url),
    file_url: value.file_url,
    file: {
      id: typeof file.id === "string" ? file.id : "",
      original_name: nullable_string(file.original_name),
      mime_type: typeof file.mime_type === "string" ? file.mime_type : "application/octet-stream",
      size_bytes: number_or_zero(file.size_bytes),
    },
  };
};

const valid_hotspot_type = (value: unknown): value is DemoHotspotType => (
  value === "click" || value === "info" || value === "next"
);

const valid_box_number = (value: unknown): value is number => (
  typeof value === "number" && Number.isFinite(value)
);

const parse_hotspot = (value: unknown): PublishedInteractiveDemoSnapshotHotspot | null => {
  if (!is_record(value) || typeof value.id !== "string" || !valid_hotspot_type(value.hotspot_type)) {
    return null;
  }

  if (
    !valid_box_number(value.x)
    || !valid_box_number(value.y)
    || !valid_box_number(value.width)
    || !valid_box_number(value.height)
  ) {
    return null;
  }

  return {
    id: value.id,
    hotspot_type: value.hotspot_type,
    label: nullable_string(value.label),
    content: nullable_string(value.content),
    x: value.x,
    y: value.y,
    width: value.width,
    height: value.height,
    target_scene_id: nullable_string(value.target_scene_id),
    hotspot_index: number_or_zero(value.hotspot_index),
  };
};

const parse_scene = (value: unknown): PublishedInteractiveDemoSnapshotScene | null => {
  if (!is_record(value) || typeof value.id !== "string") {
    return null;
  }

  const background_asset = parse_asset(value.background_asset);
  if (!background_asset) {
    return null;
  }

  return {
    id: value.id,
    scene_index: number_or_zero(value.scene_index),
    title: nullable_string(value.title),
    description: nullable_string(value.description),
    background_asset,
    hotspots: Array.isArray(value.hotspots)
      ? value.hotspots.flatMap((hotspot) => {
        const parsed = parse_hotspot(hotspot);
        return parsed ? [parsed] : [];
      })
      : [],
  };
};

const parse_snapshot = (value: unknown): PublishedInteractiveDemoSnapshot | null => {
  if (!is_record(value) || value.artifact_type !== "interactive_demo" || !is_record(value.interactive_demo)) {
    return null;
  }

  const demo = value.interactive_demo;
  if (typeof demo.id !== "string" || typeof demo.title !== "string") {
    return null;
  }

  return {
    artifact_type: "interactive_demo",
    schema_version: 1,
    interactive_demo: {
      id: demo.id,
      title: demo.title,
      description: nullable_string(demo.description),
      source_capture_session_id: nullable_string(demo.source_capture_session_id),
      published_version: number_or_zero(demo.published_version),
      published_at: typeof demo.published_at === "string" ? demo.published_at : "",
    },
    scenes: Array.isArray(value.scenes)
      ? value.scenes.flatMap((scene) => {
        const parsed = parse_scene(scene);
        return parsed ? [parsed] : [];
      }).sort((left, right) => left.scene_index - right.scene_index)
      : [],
  };
};

const loadStateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError && error.kind === "not_found") return { status: "not_found" };
  if (error instanceof ApiClientError && error.type === "publish_link_not_public") return { status: "restricted" };
  if (error instanceof ApiClientError && error.type === "publish_link_expired") return { status: "expired" };
  if (error instanceof ApiClientError && error.type === "publish_link_password_required") return { status: "password_required" };
  return { status: "error" };
};

const percent = (value: number) => `${Number((value * 100).toFixed(4))}%`;

export const PublicInteractiveDemoViewerPage = ({
  slug,
  mode = "page",
  loadPublishLink = getPublicPublishLink,
  createViewerSession = createPublicPublishViewerSession,
}: PublicInteractiveDemoViewerPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadPublishLink(slug, mode === "embed" ? "embed" : "reader")
      .then((response) => {
        if (!active) return;
        const snapshot = parse_snapshot(response.published_artifact.snapshot);
        if (response.published_artifact.artifact_type !== "interactive_demo" || !snapshot) {
          setState({ status: "malformed" });
          return;
        }
        setState({ status: "loaded", response, snapshot });
      })
      .catch((error: unknown) => {
        if (active) setState(loadStateFromError(error));
      });

    return () => {
      active = false;
    };
  }, [loadPublishLink, mode, reloadKey, slug]);

  if (state.status === "loading") return <PublicState message="Loading interactive demo..." mode={mode} />;
  if (state.status === "not_found") return <PublicState message="Interactive demo was not found." mode={mode} />;
  if (state.status === "restricted") return <PublicState message="This demo is not publicly accessible." mode={mode} />;
  if (state.status === "expired") return <PublicState message="This demo link has expired." mode={mode} />;
  if (state.status === "malformed") return <PublicState message="Published artifact cannot be displayed." mode={mode} />;
  if (state.status === "error") return <PublicState message="Could not load interactive demo." mode={mode} />;
  if (state.status === "password_required") {
    return (
      <PasswordGate
        slug={slug}
        mode={mode}
        createViewerSession={createViewerSession}
        onUnlocked={() => setReloadKey((key) => key + 1)}
      />
    );
  }

  return <Viewer snapshot={state.snapshot} mode={mode} />;
};

const PublicState = ({ message, mode }: { message: string; mode: "page" | "embed" }) => (
  <div className={`${styles.page} ${mode === "embed" ? styles.embedPage : ""}`}>
    <main className={`${styles.main} ${mode === "embed" ? styles.embedMain : ""}`} role="main">
      <div className={styles.state}>{message}</div>
    </main>
  </div>
);

const PasswordGate = ({
  slug,
  mode,
  createViewerSession,
  onUnlocked,
}: {
  slug: string;
  mode: "page" | "embed";
  createViewerSession: (slug: string, input: { password: string }, surface?: "reader" | "embed") => Promise<void>;
  onUnlocked: () => void;
}) => {
  const [password, setPassword] = useState("");

  return (
    <div className={`${styles.page} ${mode === "embed" ? styles.embedPage : ""}`}>
      <main className={`${styles.main} ${mode === "embed" ? styles.embedMain : ""}`} role="main">
        <section className={styles.state}>
          <h1>{mode === "embed" ? "Password required" : "This demo is password protected."}</h1>
          <Label className={styles.passwordField}>
            Password
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Label>
          <Button disabled={password.length === 0} onClick={() => void createViewerSession(slug, { password }, mode === "embed" ? "embed" : "reader").then(onUnlocked)}>
            {mode === "embed" ? "Unlock" : "Unlock demo"}
          </Button>
        </section>
      </main>
    </div>
  );
};

const Viewer = ({ snapshot, mode }: { snapshot: PublishedInteractiveDemoSnapshot; mode: "page" | "embed" }) => {
  const scenes = useMemo(() => snapshot.scenes, [snapshot.scenes]);
  const [activeSceneId, setActiveSceneId] = useState(scenes[0]?.id ?? "");
  const [infoHotspot, setInfoHotspot] = useState<PublishedInteractiveDemoSnapshotHotspot | null>(null);
  const activeIndex = Math.max(0, scenes.findIndex((scene) => scene.id === activeSceneId));
  const activeScene = scenes[activeIndex] ?? scenes[0] ?? null;

  if (!activeScene) {
    return <PublicState message="This published demo does not have any scenes yet." mode={mode} />;
  }

  const goToIndex = (index: number) => {
    const scene = scenes[index];
    if (scene) {
      setActiveSceneId(scene.id);
      setInfoHotspot(null);
    }
  };

  const activateHotspot = (hotspot: PublishedInteractiveDemoSnapshotHotspot) => {
    if (hotspot.hotspot_type === "info") {
      setInfoHotspot(hotspot);
      return;
    }

    const explicitTargetScene = hotspot.target_scene_id
      ? scenes.find((scene) => scene.id === hotspot.target_scene_id)
      : null;
    const targetScene = explicitTargetScene ?? scenes[activeIndex + 1];

    if (targetScene) {
      setActiveSceneId(targetScene.id);
      setInfoHotspot(null);
    }
  };

  return (
    <div className={`${styles.page} ${mode === "embed" ? styles.embedPage : ""}`}>
      <main
        className={`${styles.main} ${mode === "embed" ? styles.embedMain : ""}`}
        role="main"
        aria-label={mode === "embed" ? "Embedded interactive demo" : undefined}
      >
        <section className={`${styles.header} ${mode === "embed" ? styles.embedHeader : ""}`}>
          {mode === "page" ? <div className={styles.eyebrow}>Published interactive demo</div> : null}
          <h1 className={styles.title}>{snapshot.interactive_demo.title}</h1>
          {snapshot.interactive_demo.description ? <p className={styles.description}>{snapshot.interactive_demo.description}</p> : null}
        </section>

        <section className={styles.stage} aria-label="Interactive demo scene">
          <div className={styles.sceneHeader}>
            <div>
              <h2 className={styles.sceneTitle}>{activeScene.title ?? `Scene ${activeScene.scene_index}`}</h2>
              {activeScene.description ? <p className={styles.sceneDescription}>{activeScene.description}</p> : null}
            </div>
            <div className={styles.nav}>
              <Button variant="secondary" size="sm" disabled={activeIndex === 0} onClick={() => goToIndex(activeIndex - 1)}>
                Previous scene
              </Button>
              <Button variant="secondary" size="sm" disabled={activeIndex >= scenes.length - 1} onClick={() => goToIndex(activeIndex + 1)}>
                Next scene
              </Button>
            </div>
          </div>
          <div className={styles.screenshotFrame}>
            <img
              className={styles.screenshot}
              src={resolveApiAssetUrl(activeScene.background_asset.file_url)}
              alt={activeScene.background_asset.page_title ?? activeScene.background_asset.file.original_name ?? `Scene ${activeScene.scene_index}`}
            />
            {[...activeScene.hotspots].sort((left, right) => left.hotspot_index - right.hotspot_index).map((hotspot) => (
              <button
                key={hotspot.id}
                type="button"
                className={styles.hotspot}
                aria-label={hotspot.label ?? `Hotspot ${hotspot.hotspot_index}`}
                style={{
                  left: percent(hotspot.x),
                  top: percent(hotspot.y),
                  width: percent(hotspot.width),
                  height: percent(hotspot.height),
                }}
                onClick={() => activateHotspot(hotspot)}
              />
            ))}
          </div>
          {infoHotspot ? (
            <section className={styles.infoPanel} aria-label="Hotspot information">
              <h2>{infoHotspot.label ?? "Information"}</h2>
              {infoHotspot.content ? <p>{infoHotspot.content}</p> : null}
              <Button className={styles.dismiss} variant="secondary" size="sm" onClick={() => setInfoHotspot(null)}>Dismiss</Button>
            </section>
          ) : null}
        </section>
      </main>
    </div>
  );
};
