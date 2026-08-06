import { useEffect, useState, type FormEvent } from "react";
import type { PublicPublishLinkResponse } from "@repo/types/publish";
import {
  ApiClientError,
  createPublicPublishViewerSession,
  getPublicPublishLink,
} from "../../lib/api";
import { PublicVersionSelector } from "../publish/PublicVersionSelector";
import { InteractiveDemoRenderer } from "./InteractiveDemoRenderer";
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
  | { kind: "error"; message: string; retryable: boolean };
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
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    loadPublishLink(slug, "interactive_demo", versionSlug ?? null, mode)
      .then((response) => {
        if (!active) return;
        if (response.published_artifact.artifact_type !== "interactive_demo")
          return setState({
            kind: "error",
            message: "Published demo was not found.",
            retryable: false,
          });
        const target =
          response.canonical_public_url + (mode === "embed" ? "/embed" : "");
        if (versionSlug && window.location.pathname !== target)
          window.history.replaceState(null, "", target);
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
                      : error instanceof ApiClientError &&
                          error.type === "publish_link_not_found"
                        ? "Published demo was not found."
                        : "Published demo could not be loaded.",
                retryable:
                  !(error instanceof ApiClientError) ||
                  ![
                    "publish_link_expired",
                    "publish_link_not_public",
                    "publish_link_not_found",
                  ].includes(error.type ?? ""),
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
        {state.retryable ? (
          <button
            type="button"
            onClick={() => {
              setState({ kind: "loading" });
              setRetry((value) => value + 1);
            }}
          >
            Try again
          </button>
        ) : null}
      </main>
    );
  const publication = state.response.published_artifact;
  if (publication.artifact_type !== "interactive_demo") return null;
  return (
    <main
      aria-labelledby="public-interactive-demo-title"
      className={mode === "embed" ? styles.embed : styles.page}
    >
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}>Published interactive demo</span>
          <h1 id="public-interactive-demo-title">
            {publication.revision.title}
          </h1>
          {publication.revision.description ? (
            <p className={styles.description}>
              {publication.revision.description}
            </p>
          ) : null}
        </div>
        <div className={styles.versionControl}>
          <PublicVersionSelector response={state.response} mode={mode} />
        </div>
      </header>
      <InteractiveDemoRenderer
        title={publication.revision.title}
        showTitle={false}
        scenes={publication.demo_scenes.map((scene) => ({
          id: scene.id,
          sceneIndex: scene.scene_index,
          title: scene.title,
          description: scene.description,
          backgroundAssetId: scene.background_capture_asset_id,
          hotspots: scene.hotspots.map((hotspot) => ({
            id: hotspot.id,
            type: hotspot.hotspot_type,
            label: hotspot.label,
            content: hotspot.content,
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            targetSceneId:
              hotspot.transition?.target_demo_revision_scene_id ?? null,
          })),
        }))}
        assets={publication.capture_assets.map((asset) => ({
          id: asset.id,
          fileUrl: asset.file_url,
          width: asset.width,
          height: asset.height,
        }))}
      />
    </main>
  );
};
