/**
 * @fileoverview Authenticated browser-extension download and setup guidance.
 */

import { useEffect, useState, type ReactNode } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Download, ShieldCheck } from "lucide-react";
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
        <div className={styles.page}>
          <p className={styles.state} aria-live="polite">
            Checking extension access…
          </p>
        </div>
      </Shell>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <Shell performLogout={performLogout} navigate={navigate}>
        <div className={styles.page}>
          <div className={styles.state}>
            <p>Sign in to download the Ossie browser extension.</p>
            <a href={signInUrl(currentPath)}>Sign in</a>
          </div>
        </div>
      </Shell>
    );
  }

  if (authState === "error") {
    return (
      <Shell performLogout={performLogout} navigate={navigate}>
        <div className={styles.page}>
          <Alert variant="destructive">
            Extension access could not be checked. Reload this page to try
            again.
          </Alert>
        </div>
      </Shell>
    );
  }

  return (
    <Shell performLogout={performLogout} navigate={navigate}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1>Browser extension</h1>
            <p>
              Capture workflows from your browser and turn them into Guides and
              Interactive Demos.
            </p>
          </div>
        </header>

        <section
          className={styles.downloadPanel}
          aria-labelledby="download-heading"
        >
          <div className={styles.downloadCopy}>
            <h2 id="download-heading">Download the extension</h2>
            <p>
              Download the ZIP published by your Ossie administrator, then keep
              its extracted folder in a permanent location.
            </p>
          </div>
          <Button
            className={styles.downloadAction}
            type="button"
            onClick={() => void downloadExtension()}
            disabled={isDownloading}
            aria-label={
              isDownloading
                ? "Preparing extension download"
                : "Download extension"
            }
            title="Download extension"
          >
            <Download size={20} aria-hidden="true" />
          </Button>
          {downloadError ? (
            <Alert className={styles.downloadError} variant="destructive">
              {downloadError}
            </Alert>
          ) : null}
        </section>

        <div className={styles.setupGrid}>
          <section
            className={styles.setupPanel}
            aria-labelledby="install-heading"
          >
            <div className={styles.panelHeader}>
              <h2 id="install-heading">Install in Chrome</h2>
              <p>
                Chrome and other Chromium-based browsers use the same steps.
              </p>
            </div>
            <ol className={styles.steps}>
              <li>
                <span className={styles.stepNumber}>1</span>
                <div>
                  <h3>Extract the download</h3>
                  <p>Unzip the download into a folder you will keep.</p>
                </div>
              </li>
              <li>
                <span className={styles.stepNumber}>2</span>
                <div>
                  <h3>Open extension settings</h3>
                  <p>
                    Enter <code>chrome://extensions</code> in the address bar
                    and turn on <strong>Developer mode</strong>.
                  </p>
                </div>
              </li>
              <li>
                <span className={styles.stepNumber}>3</span>
                <div>
                  <h3>Load and pin Ossie</h3>
                  <p>
                    Choose <strong>Load unpacked</strong>, select the folder
                    that contains <code>manifest.json</code>, then pin Ossie.
                  </p>
                </div>
              </li>
            </ol>
            <p className={styles.note}>
              The “unpacked extension” warning is expected for this self-hosted
              build.
            </p>
          </section>

          <section
            className={styles.setupPanel}
            aria-labelledby="connect-heading"
          >
            <div className={styles.panelHeader}>
              <h2 id="connect-heading">Connect to Ossie</h2>
              <p>Use these values when the extension asks where to connect.</p>
            </div>
            <dl className={styles.connectionValues}>
              <div>
                <dt>Instance/API URL</dt>
                <dd>
                  <code>{instanceUrl}</code>
                </dd>
              </div>
              <div>
                <dt>Portal URL</dt>
                <dd>
                  <code>{portalUrl}</code>
                  <span>Optional</span>
                </dd>
              </div>
            </dl>
            <ol className={styles.connectSteps}>
              <li>Open the pinned Ossie extension.</li>
              <li>Enter the connection values above.</li>
              <li>Sign in with your normal Ossie email and password.</li>
              <li>Select a Project and Project Version, then start Capture.</li>
            </ol>
          </section>
        </div>

        <details className={styles.maintenance}>
          <summary>Update, remove, and privacy</summary>
          <div className={styles.maintenanceGrid}>
            <section>
              <h2>Update the extension</h2>
              <p>
                Download the latest ZIP, replace the files in the same extracted
                folder, open <code>chrome://extensions</code>, and select
                <strong> Reload</strong> on Ossie.
              </p>
            </section>
            <section>
              <h2>Remove the extension</h2>
              <p>
                Select <strong>Remove</strong> in Chrome. This clears the local
                extension session and Capture state without deleting anything
                already stored in Ossie.
              </p>
            </section>
            <section>
              <h2>
                <ShieldCheck size={18} aria-hidden="true" /> What Ossie captures
              </h2>
              <p>
                Ossie records supported clicks and visible-tab screenshots. It
                does not store passwords, typed input values, or raw page HTML.
              </p>
            </section>
          </div>
        </details>
      </div>
    </Shell>
  );
};
