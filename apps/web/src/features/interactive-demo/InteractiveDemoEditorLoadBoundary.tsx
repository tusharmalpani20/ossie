import { Button } from "@repo/ui/button";
import { StatusPanel } from "@repo/ui/status-panel";
import { signInUrl } from "../auth/navigation";
import { InteractiveDemoEditorShell as PortalShell } from "./InteractiveDemoEditorShell";
import type { InteractiveDemoEditorLoadState } from "./interactiveDemoEditorContracts";
import styles from "./InteractiveDemoEditorPage.module.css";

type PendingLoadState = Exclude<
  InteractiveDemoEditorLoadState,
  { status: "loaded" }
>;

export const InteractiveDemoEditorLoadBoundary = ({
  state,
  projectId,
  interactiveDemoId,
  currentPath,
  performLogout,
  navigate,
  renderShell,
  onRetry,
}: {
  state: PendingLoadState;
  projectId: string;
  interactiveDemoId: string;
  currentPath: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  renderShell: boolean;
  onRetry: () => void;
}) => (
  <PortalShell
    projectId={projectId}
    interactiveDemoId={interactiveDemoId}
    performLogout={performLogout}
    navigate={navigate}
    renderShell={renderShell}
  >
    <StatusPanel
      className={styles.state}
      tone={
        state.status === "loading"
          ? "loading"
          : state.status === "unauthenticated"
            ? "forbidden"
            : state.status === "not_found"
              ? "not-found"
              : "error"
      }
      title={
        state.status === "loading"
          ? "Loading interactive demo..."
          : state.status === "unauthenticated"
            ? "Sign in to view this interactive demo."
            : state.status === "not_found"
              ? "Interactive demo was not found."
              : "Could not load interactive demo."
      }
      action={
        state.status === "unauthenticated" ? (
          <a className={styles.stateLink} href={signInUrl(currentPath)}>
            Sign in
          </a>
        ) : state.status === "error" ? (
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        ) : null
      }
      titleAs="h2"
    />
  </PortalShell>
);
