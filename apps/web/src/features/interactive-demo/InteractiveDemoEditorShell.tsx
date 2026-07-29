import type { ReactNode } from "react";
import { PortalTopbar } from "../portal/PortalTopbar";
import styles from "./InteractiveDemoEditorPage.module.css";

export const InteractiveDemoEditorShell = ({
  children,
  projectId,
  interactiveDemoId,
  performLogout,
  navigate,
  renderShell = true,
}: {
  children: ReactNode;
  projectId: string;
  interactiveDemoId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
  renderShell?: boolean;
}) =>
  renderShell ? (
    <div className={styles.page}>
      <PortalTopbar
        context={`${projectId} / interactive demos / ${interactiveDemoId}`}
        performLogout={performLogout}
        navigate={navigate}
      />
      <main className={styles.main}>{children}</main>
    </div>
  ) : (
    <>{children}</>
  );
