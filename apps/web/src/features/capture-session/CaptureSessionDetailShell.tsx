/**
 * @fileoverview Optional local shell for standalone Capture Session detail routes.
 */

import type { ReactNode } from "react";
import { PortalTopbar } from "../portal/PortalTopbar";
import styles from "./CaptureSessionDetailPage.module.css";

export const CaptureSessionDetailShell = ({
  children,
  projectId,
  captureSessionId,
  performLogout,
  navigate,
  renderShell,
}: {
  children: ReactNode;
  projectId: string;
  captureSessionId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  renderShell: boolean;
}) =>
  renderShell ? (
    <div className={styles.page}>
      <PortalTopbar
        context={`${projectId} / ${captureSessionId}`}
        performLogout={performLogout}
        navigate={navigate}
      />
      <main className={styles.main}>{children}</main>
    </div>
  ) : (
    <>{children}</>
  );
