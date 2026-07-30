import type { ProjectRole } from "@repo/constants";

export const canPublishDocumentation = (role: ProjectRole) =>
  role === "project_admin" || role === "editor";

export const canCarryForwardDocumentation = (role: ProjectRole) =>
  role === "project_admin" || role === "editor";

export const canManageDocumentationEdition = (role: ProjectRole) =>
  role === "project_admin";
