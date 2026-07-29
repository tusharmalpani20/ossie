/**
 * @fileoverview Shared authenticated portal application shell.
 */

import type { ReactNode } from "react";
import { Badge } from "@repo/ui/badge";
import type { PortalRouteSection } from "../../lib/portalRouteMetadata";
import {
  buildPortalBreadcrumbs,
  buildPortalNavigation,
  type PortalProjectContext,
  type PortalProjectVersionContext,
} from "../../lib/portalNavigation";
import { PortalTopbar } from "./PortalTopbar";
import styles from "./PortalAppShell.module.css";

type PortalAppShellProps = {
  children: ReactNode;
  activeSection: PortalRouteSection | null;
  currentLabel: string;
  project?: PortalProjectContext;
  projectVersion?: PortalProjectVersionContext;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const contextLabel = (
  project?: PortalProjectContext,
  projectVersion?: PortalProjectVersionContext,
) => {
  if (!project) return "Portal";
  if (!projectVersion || projectVersion.isDefault)
    return project.name ?? project.id;

  return `${project.name ?? project.id} / ${projectVersion.name ?? projectVersion.slug}`;
};

/** Renders shared topbar, context, navigation, and content frame. */
export const PortalAppShell = ({
  children,
  activeSection,
  currentLabel,
  project,
  projectVersion,
  performLogout,
  navigate,
}: PortalAppShellProps) => {
  const navigation = buildPortalNavigation({
    activeSection,
    project,
    projectVersion,
  });
  const breadcrumbs = buildPortalBreadcrumbs({
    activeLabel: currentLabel,
    project,
    projectVersion,
  });

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#portal-main-content">
        Skip to main content
      </a>
      <PortalTopbar
        context={contextLabel(project, projectVersion)}
        performLogout={performLogout}
        navigate={navigate}
      />
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav} aria-label="Portal navigation">
            {navigation.map((item) => (
              <a
                key={`${item.label}-${item.href}`}
                className={item.active ? styles.navItemActive : styles.navItem}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                aria-label={item.ariaLabel}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <div className={styles.contentFrame}>
          <div className={styles.contextBar}>
            <nav aria-label="Breadcrumb">
              <ol className={styles.breadcrumbs}>
                {breadcrumbs.map((crumb, index) => (
                  <li key={`${crumb.label}-${index}`}>
                    {crumb.href && index < breadcrumbs.length - 1 ? (
                      <a href={crumb.href}>{crumb.label}</a>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            {projectVersion && !projectVersion.isDefault ? (
              <aside aria-label="Named Project Version context">
                <Badge>Project Version</Badge>
              </aside>
            ) : null}
          </div>
          <main
            className={styles.main}
            id="portal-main-content"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
