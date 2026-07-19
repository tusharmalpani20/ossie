export const GUIDE_BLOCK_TYPES = [
  "step",
  "header",
  "paragraph",
  "tip",
  "alert",
  "capture",
  "divider",
  "gif",
] as const;
export type GuideBlockType = (typeof GUIDE_BLOCK_TYPES)[number];

export const GUIDE_CREATABLE_BLOCK_TYPES = [
  "step",
  "header",
  "paragraph",
  "tip",
  "alert",
  "divider",
] as const;
export type GuideCreatableBlockType = (typeof GUIDE_CREATABLE_BLOCK_TYPES)[number];

export const GUIDE_BLOCK_PLACEMENTS = [
  "before",
  "after",
] as const;
export type GuideBlockPlacement = (typeof GUIDE_BLOCK_PLACEMENTS)[number];

export const GUIDE_ANNOTATION_TYPES = [
  "highlight",
] as const;
export type GuideAnnotationType = (typeof GUIDE_ANNOTATION_TYPES)[number];
