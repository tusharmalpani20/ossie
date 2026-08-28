/**
 * @fileoverview Compact Project Version selector and context bar.
 */

import { Badge } from "@repo/ui/badge";
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
  const active = versions.filter(({ status }) => status === "active");
  const archived = versions.filter(({ status }) => status === "archived");
  const open = (slug: string) => {
    const path = `${projectVersionWorkspaceUrl(project.id, slug)}${routeSuffix}`;
    (navigate ?? navigateWithinApp)(path);
  };
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
      <label className={styles.selector}>
        <span className={styles.visuallyHidden}>Project Version</span>
        <select
          aria-label="Project Version"
          value={selected.slug}
          onChange={(event) => open(event.target.value)}
        >
          <optgroup label="Active">
            {active.map((version) => (
              <option key={version.id} value={version.slug}>
                {version.name}
              </option>
            ))}
          </optgroup>
          {archived.length ? (
            <optgroup label="Archived">
              {archived.map((version) => (
                <option key={version.id} value={version.slug}>
                  {version.name}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      </label>
      <div className={styles.statuses} aria-label="Version status">
        {selected.is_default ? (
          <Badge className={styles.defaultBadge}>Default</Badge>
        ) : null}
        <Badge variant={selected.status === "active" ? "success" : "default"}>
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
    </section>
  );
};
