import { useEffect, useState, type FormEvent } from "react";
import type { PublicPublishLinkResponse } from "@repo/types/publish";
import {
  ApiClientError,
  createPublicPublishViewerSession,
  getPublicPublishLink,
} from "../../lib/api";
import { StatusPanel } from "@repo/ui/status-panel";
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
  | { kind: "error"; message: string; retryable: boolean };
const message = (error: unknown) =>
  error instanceof ApiClientError && error.type === "publish_link_expired"
    ? "This Publish Link has expired."
    : error instanceof ApiClientError &&
        error.type === "publish_link_not_public"
      ? "This Publish Link is restricted."
      : error instanceof ApiClientError &&
          error.type === "publish_link_password_required"
        ? "password"
        : error instanceof ApiClientError &&
            error.type === "publish_link_not_found"
          ? "Published guide was not found."
          : "Published guide could not be loaded.";
const retryable = (error: unknown) =>
  !(
    error instanceof ApiClientError &&
    [
      "publish_link_expired",
      "publish_link_not_public",
      "publish_link_not_found",
    ].includes(error.type ?? "")
  );
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
            retryable: false,
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
            : { kind: "error", message: text, retryable: retryable(error) },
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
    return (
      <main className={styles.state}>
        <StatusPanel
          className={styles.statePanel}
          tone="loading"
          title="Loading published guide"
          description="Checking the published link and its selected version."
          titleAs="h1"
        />
      </main>
    );
  if (state.kind === "password")
    return (
      <main className={styles.state}>
        <StatusPanel
          className={styles.statePanel}
          tone="forbidden"
          title="Password required"
          description="Enter the password supplied by the Publish Link owner to continue."
          titleAs="h1"
        />
        <form onSubmit={unlock}>
          <label htmlFor="guide-publish-link-password">
            Publish Link password
          </label>
          <input
            id="guide-publish-link-password"
            aria-invalid={passwordError ? "true" : undefined}
            aria-describedby={
              passwordError ? "guide-password-error" : undefined
            }
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
            }}
          />
          {passwordError && (
            <p id="guide-password-error" role="alert">
              {passwordError}
            </p>
          )}
          <button>Continue</button>
        </form>
      </main>
    );
  if (state.kind === "error")
    return (
      <main className={styles.state}>
        <StatusPanel
          className={styles.statePanel}
          tone={
            state.retryable
              ? "error"
              : state.message.includes("restricted")
                ? "forbidden"
                : "not-found"
          }
          title={state.message}
          titleAs="h1"
          action={
            state.retryable ? (
              <button
                type="button"
                onClick={() => {
                  setState({ kind: "loading" });
                  setRetry((value) => value + 1);
                }}
              >
                Try again
              </button>
            ) : null
          }
        />
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
      <a className={styles.skipLink} href="#public-guide-content">
        Skip to guide content
      </a>
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
      <div id="public-guide-content" tabIndex={-1}>
        {publication.guide_blocks.length === 0 ? (
          <StatusPanel
            className={styles.empty}
            tone="empty"
            title="This guide has no steps yet."
            description="The Publish Link is valid, but its published content is empty."
            titleAs="h2"
          />
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
                                <p
                                  className={styles.missingMedia}
                                  role="status"
                                >
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
      </div>
    </main>
  );
};
