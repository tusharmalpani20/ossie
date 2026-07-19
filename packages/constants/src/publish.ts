export const PUBLISH_ARTIFACT_TYPES = ["guide", "interactive_demo"] as const;
export type PublishArtifactType = (typeof PUBLISH_ARTIFACT_TYPES)[number];

export const PUBLISH_VISIBILITIES = ["public", "restricted"] as const;
export type PublishVisibility = (typeof PUBLISH_VISIBILITIES)[number];

export const PUBLISH_LINK_STATUSES = ["active", "revoked"] as const;
export type PublishLinkStatus = (typeof PUBLISH_LINK_STATUSES)[number];

export const PUBLISH_LINK_ENTRY_MAX = 50;
export const PUBLISH_LINK_NAME_MAX_LENGTH = 120;
