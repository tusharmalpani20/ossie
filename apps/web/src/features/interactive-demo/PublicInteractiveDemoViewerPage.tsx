import { useEffect, useState, type FormEvent } from "react";
import type { PublicPublishLinkResponse } from "@repo/types/publish";
import {
  ApiClientError,
  createPublicPublishViewerSession,
  getPublicPublishLink,
} from "../../lib/api";
import { PublicVersionSelector } from "../publish/PublicVersionSelector";
import styles from "./PublicInteractiveDemoViewerPage.module.css";
export type PublicInteractiveDemoViewerPageProps = {
  slug: string;
  versionSlug?: string;
  mode?: "reader" | "embed";
  loadPublishLink?: typeof getPublicPublishLink;
  createViewerSession?: typeof createPublicPublishViewerSession;
};
type State =
  | { kind: "loading" }
  | { kind: "ready"; response: PublicPublishLinkResponse }
  | { kind: "password" }
  | { kind: "error"; message: string };
export const PublicInteractiveDemoViewerPage = ({
  slug,
  versionSlug,
  mode = "reader",
  loadPublishLink = getPublicPublishLink,
  createViewerSession = createPublicPublishViewerSession,
}: PublicInteractiveDemoViewerPageProps) => {
  const [state, setState] = useState<State>({ kind: "loading" }),
    [password, setPassword] = useState(""),
    [passwordError, setPasswordError] = useState<string | null>(null),
    [retry, setRetry] = useState(0),
    [sceneIndex, setSceneIndex] = useState(0);
  useEffect(() => {
    let active = true;
    loadPublishLink(slug, "interactive_demo", versionSlug ?? null, mode)
      .then((response) => {
        if (!active) return;
        if (response.published_artifact.artifact_type !== "interactive_demo")
          return setState({
            kind: "error",
            message: "Published demo was not found.",
          });
        const target =
          response.canonical_public_url + (mode === "embed" ? "/embed" : "");
        if (versionSlug && window.location.pathname !== target)
          window.history.replaceState(null, "", target);
        setSceneIndex(0);
        setState({ kind: "ready", response });
      })
      .catch((error) => {
        if (!active) return;
        setState(
          error instanceof ApiClientError &&
            error.type === "publish_link_password_required"
            ? { kind: "password" }
            : {
                kind: "error",
                message:
                  error instanceof ApiClientError &&
                  error.type === "publish_link_expired"
                    ? "This Publish Link has expired."
                    : error instanceof ApiClientError &&
                        error.type === "publish_link_not_public"
                      ? "This Publish Link is restricted."
                      : "Published demo was not found.",
              },
        );
      });
    return () => {
      active = false;
    };
  }, [slug, versionSlug, mode, retry, loadPublishLink]);
  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createViewerSession(slug, "interactive_demo", { password }, mode);
      setPasswordError(null);
      setRetry((v) => v + 1);
    } catch {
      setPasswordError("Password is invalid.");
    }
  };
  if (state.kind === "loading")
    return <main className={styles.state}>Loading published demo…</main>;
  if (state.kind === "password")
    return (
      <main className={styles.state}>
        <form onSubmit={unlock}>
          <h1>Password required</h1>
          <input
            aria-label="Publish Link password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
            }}
          />
          {passwordError && <p role="alert">{passwordError}</p>}
          <button>Continue</button>
        </form>
      </main>
    );
  if (state.kind === "error")
    return (
      <main className={styles.state}>
        <h1>{state.message}</h1>
      </main>
    );
  const publication = state.response.published_artifact;
  if (publication.artifact_type !== "interactive_demo") return null;
  const scene = publication.demo_scenes[sceneIndex];
  const assets = new Map(
    publication.capture_assets.map((asset) => [asset.id, asset]),
  );
  return (
    <main className={mode === "embed" ? styles.embed : styles.page}>
      <header>
        <div>
          <span>Published interactive demo</span>
          <h1>{publication.revision.title}</h1>
        </div>
        <PublicVersionSelector response={state.response} mode={mode} />
      </header>
      {scene ? (
        <section className={styles.scene}>
          <h2>{scene.title ?? `Scene ${scene.scene_index}`}</h2>
          {scene.background_capture_asset_id &&
            assets.get(scene.background_capture_asset_id) && (
              <img
                src={assets.get(scene.background_capture_asset_id)!.file_url}
                alt="Demo scene"
              />
            )}
          <div className={styles.hotspots}>
            {scene.hotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                onClick={() => {
                  const target =
                    hotspot.transition?.target_demo_revision_scene_id;
                  if (target) {
                    const index = publication.demo_scenes.findIndex(
                      (item) => item.id === target,
                    );
                    if (index >= 0) setSceneIndex(index);
                  }
                }}
              >
                {hotspot.label ?? hotspot.content ?? "Continue"}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p>This demo has no scenes.</p>
      )}
    </main>
  );
};
