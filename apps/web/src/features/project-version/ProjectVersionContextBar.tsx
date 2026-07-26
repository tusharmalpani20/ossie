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
import styles from "./ProjectVersionContextBar.module.css";

export { projectVersionWorkspaceUrl };

/** Renders current Project Version identity and switching controls. */
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
    if (navigate) navigate(path);
    else window.location.assign(path);
  };
  return (
    <section className={styles.bar} aria-label="Project Version context">
      <div
        className={styles.identity}
        title={`${project.name} / ${selected.name}`}
      >
        <span>{project.name}</span>
        <span aria-hidden="true">/</span>
        <strong>{selected.name}</strong>
        {selected.is_default ? <Badge>Default</Badge> : null}
        {selected.status === "archived" ? <Badge>Archived</Badge> : null}
      </div>
      {active.length > 1 || archived.length > 0 ? (
        <label className={styles.selector}>
          <span>Project Version</span>
          <select
            value={selected.slug}
            onChange={(event) => open(event.target.value)}
          >
            <optgroup label="Active">
              {active.map((version) => (
                <option key={version.id} value={version.slug}>
                  {version.name}
                  {version.is_default ? " — Default" : ""}
                </option>
              ))}
            </optgroup>
            {archived.length ? (
              <optgroup label="Archived">
                {archived.map((version) => (
                  <option key={version.id} value={version.slug}>
                    {version.name} — Archived
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>
      ) : (
        <div className={styles.compact}>Main context</div>
      )}
      {project.access.role === "project_admin" ? (
        <a
          href={`/projects/${encodeURIComponent(project.id)}/settings#project-versions`}
        >
          Manage Versions
        </a>
      ) : null}
    </section>
  );
};
