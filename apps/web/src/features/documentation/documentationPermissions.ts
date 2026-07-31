import type { ProjectRole } from "@repo/constants";

export const canPublishDocumentation = (role: ProjectRole) =>
  role === "project_admin" || role === "editor";

export const canCarryForwardDocumentation = (role: ProjectRole) =>
  role === "project_admin" || role === "editor";

export const canManageDocumentationEdition = (role: ProjectRole) =>
  role === "project_admin";

export const canRequestDocumentationReview = (role: ProjectRole) =>
  role === "project_admin" || role === "editor";

export const canDecideDocumentationReview = (role: ProjectRole) => {
  void role;
  return true;
};

export const canManageDocumentationReview = (role: ProjectRole) =>
  role === "project_admin";

export const canOverrideDocumentationReview = (role: ProjectRole) =>
  role === "project_admin";
