import type { ReactNode } from "react";
import styles from "./ProjectVersionEmptyState.module.css";

/** Displays an illustrated, actionable empty state for version-owned content. */
export const ProjectVersionEmptyState = ({
  imageSrc,
  imageAlt,
  title,
  description,
  action,
}: {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <section className={styles.empty}>
    <img className={styles.illustration} src={imageSrc} alt={imageAlt} />
    <div className={styles.copy}>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  </section>
);
