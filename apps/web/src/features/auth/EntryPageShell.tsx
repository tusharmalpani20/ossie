/**
 * @fileoverview Shared shell for public auth, setup, and invite entry pages.
 */

import type { ReactNode } from "react";
import { OssieBrand } from "../../components/OssieBrand";
import styles from "./EntryPageShell.module.css";

type EntryPageShellProps = {
  children: ReactNode;
  width?: "narrow" | "standard";
};

/** Renders a brand-only public entry page wrapper. */
export const EntryPageShell = ({
  children,
  width = "narrow",
}: EntryPageShellProps) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <a className={styles.brand} href="/projects">
        <OssieBrand />
      </a>
    </header>
    <main className={width === "standard" ? styles.mainStandard : styles.main}>
      {children}
    </main>
  </div>
);
