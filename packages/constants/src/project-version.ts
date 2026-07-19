export const PROJECT_VERSION_STATUSES = ["active", "archived"] as const;
export type ProjectVersionStatus = (typeof PROJECT_VERSION_STATUSES)[number];

export const PROJECT_VERSION_RESOLUTION_KINDS = ["canonical", "alias"] as const;
export type ProjectVersionResolutionKind =
  (typeof PROJECT_VERSION_RESOLUTION_KINDS)[number];
