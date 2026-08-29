import type { ReactNode } from "react";
import styles from "./ProjectVersionSectionHeader.module.css";

/** Introduces one content area inside a Project Version workspace. */
export const ProjectVersionSectionHeader = ({
  title,
  description,
  actions,
  headingId,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  headingId?: string;
}) => (
  <div className={styles.header}>
    <div>
      <h2 id={headingId}>{title}</h2>
      <p>{description}</p>
    </div>
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </div>
);
