export const ARTIFACT_REVISION_TRIGGERS = [
  "manual_checkpoint",
  "publication",
  "carry_forward",
] as const;

export type ArtifactRevisionTrigger =
  (typeof ARTIFACT_REVISION_TRIGGERS)[number];

export const ARTIFACT_CARRY_FORWARD_MAX_SELECTIONS = 50;
