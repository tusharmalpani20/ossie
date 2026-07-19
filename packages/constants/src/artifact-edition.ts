export const ARTIFACT_EDITION_STATUSES = ["draft", "archived"] as const;

export type ArtifactEditionStatus = (typeof ARTIFACT_EDITION_STATUSES)[number];
