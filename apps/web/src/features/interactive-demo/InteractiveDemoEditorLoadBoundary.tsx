import { Button } from "@repo/ui/button";
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
    <div className={styles.state}>
      {state.status === "loading" ? (
        "Loading interactive demo..."
      ) : state.status === "unauthenticated" ? (
        <>
          <div>Sign in to view this interactive demo.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>
            Sign in
          </a>
        </>
      ) : state.status === "not_found" ? (
        "Interactive demo was not found."
      ) : (
        <>
          <div>Could not load interactive demo.</div>
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </>
      )}
    </div>
  </PortalShell>
);
