/**
 * @fileoverview Compact Project Version selector and context bar.
 */

import { Badge } from "@repo/ui/badge";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type {
  ProjectVersion,
  ProjectVersionDetail,
} from "@repo/types/project-version";
import type { Project } from "@repo/types/project";
import { projectVersionWorkspaceUrl } from "../../lib/portalNavigation";
import { navigateWithinApp } from "../../lib/clientNavigation";
import styles from "./ProjectVersionContextBar.module.css";

export { projectVersionWorkspaceUrl };

/** Renders the current Project Version selector and its status. */
export const ProjectVersionContextBar = ({
  project,
  selected,
  versions,
  navigate,
  routeSuffix = "",
}: {
  project: Project;
  selected: ProjectVersionDetail;
  versions: ProjectVersion[];
  navigate?: (path: string) => void;
  routeSuffix?: "" | "/capture-sessions" | "/guides" | "/interactive-demos";
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const activeLabelId = useId();
  const archivedLabelId = useId();
  const active = versions.filter(({ status }) => status === "active");
  const archived = versions.filter(({ status }) => status === "archived");
  const open = (slug: string) => {
    const path = `${projectVersionWorkspaceUrl(project.id, slug)}${routeSuffix}`;
    (navigate ?? navigateWithinApp)(path);
  };
  const selectVersion = (slug: string) => {
    setMenuOpen(false);
    if (slug !== selected.slug) open(slug);
  };
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);
  const openManageVersions = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const path = `/projects/${encodeURIComponent(project.id)}/settings#project-versions`;
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
    (navigate ?? navigateWithinApp)(path);
  };
  return (
    <section className={styles.bar} aria-label="Project Version context">
      <div className={styles.selector} ref={selectorRef}>
        <button
          className={styles.selectorTrigger}
          type="button"
          aria-label={`Project Version: ${selected.name}`}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>{selected.name}</span>
          <ChevronDown aria-hidden="true" size={18} />
        </button>
        {menuOpen ? (
          <div
            className={styles.selectorMenu}
            id={menuId}
            role="listbox"
            aria-label="Project Versions"
          >
            <div role="group" aria-labelledby={activeLabelId}>
              <span className={styles.selectorGroupLabel} id={activeLabelId}>
                Active versions
              </span>
              {active.map((version) => (
                <button
                  className={`${styles.selectorOption} ${
                    version.slug === selected.slug
                      ? styles.selectorOptionSelected
                      : ""
                  }`}
                  key={version.id}
                  type="button"
                  role="option"
                  aria-selected={version.slug === selected.slug}
                  onClick={() => selectVersion(version.slug)}
                >
                  <span>{version.name}</span>
                  {version.slug === selected.slug ? (
                    <Check aria-hidden="true" size={17} />
                  ) : null}
                </button>
              ))}
            </div>
            {archived.length ? (
              <div role="group" aria-labelledby={archivedLabelId}>
                <span
                  className={styles.selectorGroupLabel}
                  id={archivedLabelId}
                >
                  Archived versions
                </span>
                {archived.map((version) => (
                  <button
                    className={styles.selectorOption}
                    key={version.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => selectVersion(version.slug)}
                  >
                    <span>{version.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        className={styles.contextActions}
        role="group"
        aria-label="Project Version actions"
      >
        <div className={styles.statuses} aria-label="Version status">
          {selected.is_default ? (
            <Badge className={`${styles.statusBadge} ${styles.defaultBadge}`}>
              Default
            </Badge>
          ) : null}
          <Badge
            className={`${styles.statusBadge} ${
              selected.status === "active" ? styles.activeBadge : ""
            }`}
            variant={selected.status === "active" ? "success" : "default"}
          >
            {selected.status === "active" ? "Active" : "Archived"}
          </Badge>
        </div>
        {project.access.role === "project_admin" ? (
          <a
            href={`/projects/${encodeURIComponent(project.id)}/settings#project-versions`}
            onClick={openManageVersions}
          >
            Manage versions
          </a>
        ) : null}
      </div>
    </section>
  );
};
