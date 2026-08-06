import { useEffect, useState, type FormEvent } from "react";
import type { PublicPublishLinkResponse } from "@repo/types/publish";
import {
  ApiClientError,
  createPublicPublishViewerSession,
  getPublicPublishLink,
} from "../../lib/api";
import { PublicVersionSelector } from "../publish/PublicVersionSelector";
import styles from "./PublicGuideReaderPage.module.css";

export type PublicGuideReaderPageProps = {
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
const message = (error: unknown) =>
  error instanceof ApiClientError && error.type === "publish_link_expired"
    ? "This Publish Link has expired."
    : error instanceof ApiClientError &&
        error.type === "publish_link_not_public"
      ? "This Publish Link is restricted."
      : error instanceof ApiClientError &&
          error.type === "publish_link_password_required"
        ? "password"
        : "Published guide was not found.";
export const PublicGuideReaderPage = ({
  slug,
  versionSlug,
  mode = "reader",
  loadPublishLink = getPublicPublishLink,
  createViewerSession = createPublicPublishViewerSession,
}: PublicGuideReaderPageProps) => {
  const [state, setState] = useState<State>({ kind: "loading" }),
    [password, setPassword] = useState(""),
    [passwordError, setPasswordError] = useState<string | null>(null),
    [failedAssetIds, setFailedAssetIds] = useState<Set<string>>(
      () => new Set(),
    ),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    loadPublishLink(slug, "guide", versionSlug ?? null, mode)
      .then((response) => {
        if (!active) return;
        if (response.published_artifact.artifact_type !== "guide")
          return setState({
            kind: "error",
            message: "Published guide was not found.",
          });
        if (
          versionSlug &&
          window.location.pathname !==
            response.canonical_public_url + (mode === "embed" ? "/embed" : "")
        )
          window.history.replaceState(
            null,
            "",
            response.canonical_public_url + (mode === "embed" ? "/embed" : ""),
          );
        setState({ kind: "ready", response });
      })
      .catch((error) => {
        if (!active) return;
        const text = message(error);
        setState(
          text === "password"
            ? { kind: "password" }
            : { kind: "error", message: text },
        );
      });
    return () => {
      active = false;
    };
  }, [slug, versionSlug, mode, retry, loadPublishLink]);
  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createViewerSession(slug, "guide", { password }, mode);
      setPasswordError(null);
      setRetry((value) => value + 1);
    } catch {
      setPasswordError("Password is invalid.");
    }
  };
  if (state.kind === "loading")
    return <main className={styles.state}>Loading published guide…</main>;
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
  if (publication.artifact_type !== "guide") return null;
  const assets = new Map(
    publication.capture_assets.map((asset) => [asset.id, asset]),
  );
  return (
    <main
      className={mode === "embed" ? styles.embed : styles.page}
      aria-labelledby={mode === "embed" ? undefined : "public-guide-title"}
      aria-label={mode === "embed" ? "Embedded published guide" : undefined}
    >
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}>Published guide</span>
          <h1 id="public-guide-title">{publication.revision.title}</h1>
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
      {publication.guide_blocks.length === 0 ? (
        <section className={styles.empty} aria-label="Published guide content">
          <p>This published guide does not have any blocks yet.</p>
        </section>
      ) : (
        <ol className={styles.blocks}>
          {publication.guide_blocks
            .sort((a, b) => a.block_index - b.block_index)
            .map((block) => (
              <li key={block.id}>
                <h2>{block.title ?? `Step ${block.block_index}`}</h2>
                {block.body && <p>{block.body}</p>}
                {block.step && (
                  <>
                    <h3>{block.step.title}</h3>
                    {block.step.body && <p>{block.step.body}</p>}
                    {block.step.display_capture_asset_id
                      ? (() => {
                          const asset = assets.get(
                            block.step.display_capture_asset_id,
                          );
                          if (!asset || failedAssetIds.has(asset.id))
                            return (
                              <p className={styles.missingMedia} role="status">
                                Captured screenshot is unavailable.
                              </p>
                            );
                          return (
                            <img
                              src={asset.file_url}
                              alt={`Screenshot for ${block.step.title}`}
                              onError={() =>
                                setFailedAssetIds((current) => {
                                  const next = new Set(current);
                                  next.add(asset.id);
                                  return next;
                                })
                              }
                            />
                          );
                        })()
                      : null}
                  </>
                )}
              </li>
            ))}
        </ol>
      )}
    </main>
  );
};
