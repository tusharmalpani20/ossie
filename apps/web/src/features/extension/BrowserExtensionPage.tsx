/**
 * @fileoverview Authenticated browser-extension download and setup guidance.
 */

import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import {
  ApiClientError,
  downloadExtensionBundle,
  getConfiguredApiOrigin,
  getCurrentAuth,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
import styles from "./BrowserExtensionPage.module.css";

type AuthState = "checking" | "ready" | "unauthenticated" | "error";

type BrowserExtensionPageProps = {
  checkAuth?: () => Promise<unknown>;
  downloadBundle?: typeof downloadExtensionBundle;
  saveFile?: (filename: string, blob: Blob) => Promise<void>;
  instanceUrl?: string;
  portalUrl?: string;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const save_blob_file = async (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const state_from_error = (error: unknown): AuthState =>
  error instanceof ApiClientError && error.kind === "unauthenticated"
    ? "unauthenticated"
    : "error";

const Shell = ({
  children,
  performLogout,
  navigate,
}: {
  children: ReactNode;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <PortalAppShell
    activeSection="browser_extension"
    currentLabel="Browser extension"
    performLogout={performLogout}
    navigate={navigate}
  >
    {children}
  </PortalAppShell>
);

/** Renders the member-visible extension distribution and install workflow. */
export const BrowserExtensionPage = ({
  checkAuth = getCurrentAuth,
  downloadBundle: download = downloadExtensionBundle,
  saveFile = save_blob_file,
  instanceUrl = getConfiguredApiOrigin(),
  portalUrl = window.location.origin,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: BrowserExtensionPageProps) => {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    checkAuth()
      .then(() => {
        if (active) setAuthState("ready");
      })
      .catch((error: unknown) => {
        if (active) setAuthState(state_from_error(error));
      });
    return () => {
      active = false;
    };
  }, [checkAuth]);

  const downloadExtension = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const bundle = await download();
      await saveFile(bundle.filename, bundle.blob);
    } catch (error) {
      if (state_from_error(error) === "unauthenticated") {
        setAuthState("unauthenticated");
      } else {
        setDownloadError(
          "The extension could not be downloaded. Ask your Ossie administrator to build and configure the extension bundle.",
        );
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (authState === "checking") {
    return (
      <Shell performLogout={performLogout} navigate={navigate}>
        <p className={styles.state} aria-live="polite">
          Checking extension access…
        </p>
      </Shell>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <Shell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <p>Sign in to download the Ossie browser extension.</p>
          <a href={signInUrl(currentPath)}>Sign in</a>
        </div>
      </Shell>
    );
  }

  if (authState === "error") {
    return (
      <Shell performLogout={performLogout} navigate={navigate}>
        <Alert variant="destructive">
          Extension access could not be checked. Reload this page to try again.
        </Alert>
      </Shell>
    );
  }

  return (
    <Shell performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Capture tools</div>
          <h1>Install the browser extension</h1>
          <p className={styles.lede}>
            Capture clicks and screenshots from Chrome or another Chromium-based
            browser, then turn them into guides and interactive demos in Ossie.
          </p>
        </div>
        <Badge>Manifest V3</Badge>
      </section>

      <Card className={styles.downloadCard} aria-labelledby="download-heading">
        <CardHeader>
          <h2 id="download-heading">Download the extension</h2>
        </CardHeader>
        <CardContent className={styles.downloadContent}>
          <p>
            This ZIP is generated from the extension build published by your
            Ossie administrator. Keep the extracted folder after installing it.
          </p>
          {downloadError ? (
            <Alert variant="destructive">{downloadError}</Alert>
          ) : null}
          <Button
            type="button"
            onClick={() => void downloadExtension()}
            disabled={isDownloading}
          >
            {isDownloading ? "Preparing download…" : "Download extension"}
          </Button>
        </CardContent>
      </Card>

      <div className={styles.grid}>
        <Card aria-labelledby="install-heading">
          <CardHeader>
            <h2 id="install-heading">Install in Chrome</h2>
          </CardHeader>
          <CardContent>
            <ol className={styles.steps}>
              <li>Download the ZIP and extract it to a permanent folder.</li>
              <li>
                Enter <code>chrome://extensions</code> in the browser address
                bar.
              </li>
              <li>
                Turn on <strong>Developer mode</strong>.
              </li>
              <li>
                Select <strong>Load unpacked</strong>, then choose the extracted
                folder that contains <code>manifest.json</code>.
              </li>
              <li>Pin Ossie from the browser Extensions menu.</li>
            </ol>
            <p className={styles.note}>
              Chrome cannot install this ZIP directly. The “unpacked extension”
              warning is expected for a self-hosted development build.
            </p>
          </CardContent>
        </Card>

        <Card aria-labelledby="connect-heading">
          <CardHeader>
            <h2 id="connect-heading">Connect it to this Ossie instance</h2>
          </CardHeader>
          <CardContent>
            <ol className={styles.steps}>
              <li>Open the pinned Ossie extension.</li>
              <li>
                Enter this value for <strong>Instance/API URL</strong>:
                <code className={styles.url}>{instanceUrl}</code>
              </li>
              <li>
                Enter this value for the optional <strong>Portal URL</strong>:
                <code className={styles.url}>{portalUrl}</code>
              </li>
              <li>Sign in with your normal Ossie email and password.</li>
              <li>Select a project and Project Version, then start capture.</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card aria-labelledby="update-heading">
        <CardHeader>
          <h2 id="update-heading">Update or remove it</h2>
        </CardHeader>
        <CardContent className={styles.details}>
          <p>
            To update, download the latest ZIP, replace the files in the same
            extracted folder, open <code>chrome://extensions</code>, and select
            <strong> Reload</strong> on Ossie.
          </p>
          <p>
            To remove it, select <strong>Remove</strong> on that same Chrome
            page. Removing the extension clears its local session and capture
            state, but it does not delete anything already stored in Ossie.
          </p>
          <p>
            During an active capture, Ossie records supported clicks and visible
            tab screenshots. It does not store passwords, typed input values, or
            raw page HTML.
          </p>
        </CardContent>
      </Card>
    </Shell>
  );
};
