export const PROJECT_ROLES = ["project_admin", "editor", "viewer"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const PROJECT_MEMBERSHIP_STATUSES = ["active", "revoked"] as const;
export type ProjectMembershipStatus = (typeof PROJECT_MEMBERSHIP_STATUSES)[number];

export const PROJECT_ACCESS_SOURCES = [
  "organization_owner",
  "project_membership",
] as const;
export type ProjectAccessSource = (typeof PROJECT_ACCESS_SOURCES)[number];

export const PROJECT_LIST_PURPOSES = ["capture"] as const;
export type ProjectListPurpose = (typeof PROJECT_LIST_PURPOSES)[number];

export const PROJECT_ACTIVITY_CATEGORIES = [
  "project",
  "capture",
  "content",
  "publication",
] as const;
export type ProjectActivityCategory = (typeof PROJECT_ACTIVITY_CATEGORIES)[number];
