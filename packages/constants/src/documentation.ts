export const DOCUMENTATION_BLOCK_KINDS = [
  "paragraph",
  "heading",
  "ordered_list",
  "unordered_list",
  "code",
  "link",
  "image",
  "divider",
  "api_reference",
] as const;
export type DocumentationBlockKind = (typeof DOCUMENTATION_BLOCK_KINDS)[number];

export const DOCUMENTATION_NAVIGATION_KINDS = ["group", "page"] as const;
export const DOCUMENTATION_ROUTING_OUTCOMES = ["redirect", "gone"] as const;
export const DOCUMENTATION_COMMENT_STATES = ["open", "resolved"] as const;

export const DOCUMENTATION_PAGE_TITLE_MAX = 200;
export const DOCUMENTATION_DESCRIPTION_MAX = 1_000;
export const DOCUMENTATION_CANONICAL_PATH_MAX_BYTES = 240;
export const DOCUMENTATION_CANONICAL_PATH_SEGMENTS_MAX = 8;
export const DOCUMENTATION_CANONICAL_PATH_SEGMENT_MAX_BYTES = 80;
export const DOCUMENTATION_KEYWORDS_PER_PAGE_MAX = 20;
export const DOCUMENTATION_KEYWORD_MAX = 80;
export const DOCUMENTATION_NAVIGATION_DEPTH_MAX = 16;
export const DOCUMENTATION_OPENAPI_OPERATIONS_MAX = 20_000;
export const DOCUMENTATION_COMMENT_THREADS_PER_PAGE_MAX = 1_000;
export const DOCUMENTATION_COMMENT_REPLIES_PER_THREAD_MAX = 500;
export const DOCUMENTATION_BLOCKS_PER_PAGE_MAX = 2_000;
export const DOCUMENTATION_SAVED_TEXT_PER_PAGE_MAX_BYTES = 4 * 1024 * 1024;
export const DOCUMENTATION_PAGES_PER_EDITION_MAX = 1_000;
export const DOCUMENTATION_SEARCH_QUERY_MAX = 200;
export const DOCUMENTATION_SEARCH_RESULTS_MAX = 50;
