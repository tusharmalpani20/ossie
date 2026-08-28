/**
 * @fileoverview Shared authenticated portal application shell.
 */

import type { AuthContext, AuthResponse } from "@repo/types/auth";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Activity,
  BookOpenText,
  Camera,
  FileText,
  FolderKanban,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  PlaySquare,
  Puzzle,
  Settings,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { type MouseEvent, type ReactNode, useEffect, useState } from "react";
import { getCurrentAuth, logout } from "../../lib/api";
import { navigateWithinApp } from "../../lib/clientNavigation";
import type { PortalRouteSection } from "../../lib/portalRouteMetadata";
import {
  buildPortalBreadcrumbs,
  buildPortalNavigation,
  type PortalProjectContext,
  type PortalProjectVersionContext,
} from "../../lib/portalNavigation";
import styles from "./PortalAppShell.module.css";
import { usePortalAccount } from "./PortalAccountContext";
import { PortalTopbar } from "./PortalTopbar";

type PortalAppShellProps = {
  children: ReactNode;
  activeSection: PortalRouteSection | null;
  currentLabel: string;
  project?: PortalProjectContext;
  projectVersion?: PortalProjectVersionContext;
  account?: AuthContext | null;
  projectLibrary?: boolean;
  loadAuth?: () => Promise<AuthResponse>;
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

const libraryNavigationIcons: Record<string, LucideIcon> = {
  Projects: FolderKanban,
  "Organization members": Users,
  Compliance: ShieldCheck,
  "Documentation operations": BookOpenText,
  "Browser extension": Puzzle,
  Workspace: LayoutDashboard,
  "Capture sessions": Camera,
  Guides: BookOpenText,
  "Interactive demos": PlaySquare,
  Documentation: FileText,
  Activity,
  "Project settings": Settings,
};

/** Renders shared topbar, context, navigation, and content frame. */
export const PortalAppShell = ({
  children,
  activeSection,
  currentLabel,
  project,
  projectVersion,
  account,
  loadAuth = getCurrentAuth,
  performLogout,
  navigate = navigateWithinApp,
}: PortalAppShellProps) => {
  const [navigationCollapsed, setNavigationCollapsed] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [loadedAccount, setLoadedAccount] = useState<AuthContext | null>(null);
  const sharedAccount = usePortalAccount();
  // Every authenticated route uses the same shell. Project pages keep their
  // project context in the content area, while navigation and account controls
  // remain stable as the user moves between organization and project views.
  const resolvedAccount = account ?? sharedAccount?.account ?? loadedAccount;
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

  useEffect(() => {
    if (account !== undefined) {
      if (account) sharedAccount?.rememberAccount(account);
      return;
    }

    if (sharedAccount) {
      sharedAccount.ensureAccount(loadAuth);
      return;
    }

    let active = true;
    void loadAuth()
      .then((response) => {
        if (active) setLoadedAccount(response.auth);
      })
      .catch(() => {
        if (active) setLoadedAccount(null);
      });

    return () => {
      active = false;
    };
  }, [account, loadAuth, sharedAccount]);

  const handleLogout = async () => {
    await (performLogout ?? logout)();
    sharedAccount?.clearAccount();
  };

  const handleInternalNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(path);
  };

  return (
    <div
      className={[
        styles.shell,
        styles.projectLibrary,
        navigationCollapsed ? styles.navigationCollapsed : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <a className={styles.skipLink} href="#portal-main-content">
        Skip to main content
      </a>
      <PortalTopbar
        context={project ? contextLabel(project, projectVersion) : undefined}
        account={resolvedAccount}
        projectLibrary
        onOpenNavigation={() => setNavigationOpen(true)}
        performLogout={handleLogout}
        navigate={navigate}
      />
      <div className={styles.body}>
        {navigationOpen ? (
          <button
            className={styles.navigationBackdrop}
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavigationOpen(false)}
          />
        ) : null}
        <aside
          className={[styles.sidebar, navigationOpen ? styles.sidebarOpen : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <div className={styles.mobileSidebarHeader}>
            <strong>Navigation</strong>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              onClick={() => setNavigationOpen(false)}
            >
              <X aria-hidden="true" size={20} />
            </Button>
          </div>
          <Button
            className={styles.collapseButton}
            variant="ghost"
            size="icon"
            aria-label={
              navigationCollapsed ? "Expand navigation" : "Collapse navigation"
            }
            title={
              navigationCollapsed ? "Expand navigation" : "Collapse navigation"
            }
            onClick={() => setNavigationCollapsed((collapsed) => !collapsed)}
          >
            {navigationCollapsed ? (
              <PanelLeftOpen aria-hidden="true" size={18} />
            ) : (
              <PanelLeftClose aria-hidden="true" size={18} />
            )}
          </Button>
          <nav className={styles.nav} aria-label="Portal navigation">
            {navigation.map((item, index) => {
              const Icon = libraryNavigationIcons[item.label];
              // Keep the accessible name aligned with the visible navigation label.
              // Longer ariaLabel values are useful metadata, but make sidebar links
              // harder to discover for screen-reader users and tests.
              const accessibleLabel = item.label;
              const isProjectLink = Boolean(project) && index === 5;

              return (
                <div key={`${item.label}-${item.href}`}>
                  {isProjectLink ? <div className={styles.navDivider} /> : null}
                  <a
                    className={
                      item.active ? styles.navItemActive : styles.navItem
                    }
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    aria-label={accessibleLabel}
                    title={navigationCollapsed ? item.label : undefined}
                    onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                      setNavigationOpen(false);

                      if (
                        event.defaultPrevented ||
                        event.button !== 0 ||
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey
                      ) {
                        return;
                      }

                      event.preventDefault();
                      navigate(item.href);
                    }}
                  >
                    {Icon ? (
                      <Icon
                        className={styles.navIcon}
                        aria-hidden="true"
                        size={19}
                      />
                    ) : null}
                    <span className={styles.navLabel}>
                      {item.displayLabel ?? item.label}
                    </span>
                  </a>
                </div>
              );
            })}
          </nav>
        </aside>
        <div className={styles.contentFrame}>
          {project ? (
            <div className={styles.contextBar}>
              <nav aria-label="Breadcrumb">
                <ol className={styles.breadcrumbs}>
                  {breadcrumbs.map((crumb, index) => (
                    <li key={`${crumb.label}-${index}`}>
                      {crumb.href && index < breadcrumbs.length - 1 ? (
                        <a
                          href={crumb.href}
                          onClick={(event) =>
                            handleInternalNavigation(event, crumb.href!)
                          }
                        >
                          {crumb.label}
                        </a>
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
          ) : null}
          <main className={styles.main} id="portal-main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
