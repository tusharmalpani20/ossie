import { useCallback, useEffect, useState } from "react";
import type { Project } from "./types";
import { ApiClientError, getProject, type ProjectDetailResponse } from "../../lib/api";

export type ProjectAccessState =
  | { status: "loading" }
  | { status: "loaded"; project: Project }
  | { status: "unauthenticated" | "not_found" | "forbidden" | "error" };

export const useProjectAccess = (
  projectId: string,
  loadProject: (id: string) => Promise<ProjectDetailResponse> = getProject,
) => {
  const [state, setState] = useState<ProjectAccessState>({ status: "loading" });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    loadProject(projectId).then((response) => {
      if (active) setState({ status: "loaded", project: response.project });
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiClientError && error.kind === "unauthenticated") setState({ status: "unauthenticated" });
      else if (error instanceof ApiClientError && error.kind === "not_found") setState({ status: "not_found" });
      else if (error instanceof ApiClientError && error.kind === "forbidden") setState({ status: "forbidden" });
      else setState({ status: "error" });
    });
    return () => { active = false; };
  }, [loadProject, projectId, revision]);

  return { state, refresh };
};

export const projectRoleLabel = (project: Pick<Project, "access">) => {
  if (project.access.source === "organization_owner") return "Project admin";
  if (project.access.role === "project_admin") return "Project admin";
  return project.access.role === "editor" ? "Editor" : "Viewer";
};

export const projectIsWritable = (project: Pick<Project, "access" | "status">) => (
  project.status === "active" && project.access.role !== "viewer"
);
