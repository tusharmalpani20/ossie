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
  "quote",
  "table",
  "code_example",
  "callout",
  "tabs",
  "snippet_reference",
  "guide_publication",
  "interactive_demo_publication",
] as const;
export type DocumentationBlockKind = (typeof DOCUMENTATION_BLOCK_KINDS)[number];

export const DOCUMENTATION_CALLOUT_TONES = [
  "info",
  "success",
  "warning",
  "danger",
] as const;
export const DOCUMENTATION_SNIPPET_STATUSES = ["active", "archived"] as const;
export const DOCUMENTATION_ASSET_STATUSES = ["active", "archived"] as const;
export const DOCUMENTATION_ASSET_SOURCE_KINDS = [
  "documentation_asset",
  "capture_asset",
] as const;
export const DOCUMENTATION_CONTROLLED_MARKDOWN_VERSION = 1;

export const DOCUMENTATION_NAVIGATION_KINDS = ["group", "page"] as const;
export const DOCUMENTATION_ROUTING_OUTCOMES = ["redirect", "gone"] as const;
export const DOCUMENTATION_COMMENT_STATES = ["open", "resolved"] as const;
export const DOCUMENTATION_LIFECYCLE_STATUSES = ["active", "archived"] as const;
export const DOCUMENTATION_EFFECTIVE_STATUSES = [
  "active",
  "read_only",
  "archived",
] as const;
export const DOCUMENTATION_REVISION_TRIGGERS = [
  "manual_checkpoint",
  "publication",
  "carry_forward",
] as const;

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
export const DOCUMENTATION_SNIPPETS_PER_EDITION_MAX = 1_000;
export const DOCUMENTATION_BLOCKS_PER_SNIPPET_MAX = 1_000;
export const DOCUMENTATION_SAVED_TEXT_PER_SNIPPET_MAX_BYTES = 1024 * 1024;
export const DOCUMENTATION_ASSETS_PER_EDITION_MAX = 2_000;
export const DOCUMENTATION_ASSETS_PER_REVISION_MAX = 5_000;
export const DOCUMENTATION_REVISION_TEXT_MAX_BYTES = 128 * 1024 * 1024;
export const DOCUMENTATION_READER_TEXT_MAX_BYTES = 128 * 1024 * 1024;
export const DOCUMENTATION_READER_NODES_MAX = 250_000;
export const DOCUMENTATION_TABLE_ROWS_MAX = 200;
export const DOCUMENTATION_TABLE_COLUMNS_MAX = 20;
export const DOCUMENTATION_TABLE_CELLS_MAX = 4_000;
export const DOCUMENTATION_TABS_MAX = 20;
export const DOCUMENTATION_TAB_LABEL_MAX = 100;
export const DOCUMENTATION_SHORT_LABEL_MAX = 200;
export const DOCUMENTATION_TABLE_CAPTION_MAX = 1_000;
export const DOCUMENTATION_CONTROLLED_MARKDOWN_SCALAR_MAX_BYTES = 256 * 1024;

export const DOCUMENTATION_PACKAGE_FORMAT = "ossie.documentation-site";
export const DOCUMENTATION_PACKAGE_FORMAT_VERSION = 1;
export const DOCUMENTATION_PACKAGE_PROFILES = [
  "roundtrip",
  "markdown-folder",
] as const;
export const DOCUMENTATION_PACKAGE_SOURCE_KINDS = [
  "working_draft",
  "site_revision",
  "site_publication",
] as const;
export const DOCUMENTATION_IMPORT_KINDS = [
  "page_markdown",
  "site_package",
] as const;
export const DOCUMENTATION_IMPORT_STATUSES = [
  "ready",
  "consumed",
  "cancelled",
  "expired",
] as const;
export const DOCUMENTATION_IMPORT_ISSUE_SEVERITIES = [
  "blocking",
  "warning",
] as const;
export const DOCUMENTATION_IMPORT_ISSUE_CODES = [
  "archive_entry_unsafe",
  "archive_limit_exceeded",
  "archive_integrity_mismatch",
  "manifest_invalid",
  "package_version_unsupported",
  "package_profile_invalid",
  "content_unsupported",
  "markdown_invalid",
  "openapi_invalid",
  "media_invalid",
  "identity_duplicate",
  "relationship_unresolved",
] as const;

export const DOCUMENTATION_MARKDOWN_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const DOCUMENTATION_PACKAGE_UPLOAD_MAX_BYTES = 32 * 1024 * 1024;
export const DOCUMENTATION_PACKAGE_EXPANDED_MAX_BYTES = 128 * 1024 * 1024;
export const DOCUMENTATION_PACKAGE_ENTRIES_MAX = 10_000;
export const DOCUMENTATION_PACKAGE_NON_MEDIA_ENTRY_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENTATION_PACKAGE_MANIFEST_MAX_BYTES = 2 * 1024 * 1024;
export const DOCUMENTATION_IMPORT_SAFE_REPORT_MAX_BYTES = 4 * 1024 * 1024;
export const DOCUMENTATION_PACKAGE_PATH_MAX_BYTES = 240;
export const DOCUMENTATION_PACKAGE_PATH_SEGMENTS_MAX = 8;
export const DOCUMENTATION_PACKAGE_PATH_SEGMENT_MAX_BYTES = 80;
export const DOCUMENTATION_PACKAGE_COMPRESSION_RATIO_MAX = 100;
export const DOCUMENTATION_IMPORT_NESTING_MAX = 100;
export const DOCUMENTATION_MARKDOWN_AST_NODES_MAX = 50_000;
export const DOCUMENTATION_IMPORT_ISSUES_MAX = 500;
export const DOCUMENTATION_EXTERNAL_BINDINGS_MAX = 1_000;
export const DOCUMENTATION_READY_IMPORTS_PER_ACTOR_MAX = 10;
export const DOCUMENTATION_IMPORT_PARSERS_PER_PROCESS_MAX = 2;
export const DOCUMENTATION_IMPORT_PARSERS_PER_ACTOR_MAX = 1;
export const DOCUMENTATION_IMPORT_ATTEMPTS_PER_WINDOW_MAX = 20;
export const DOCUMENTATION_IMPORT_ATTEMPT_WINDOW_MS = 10 * 60 * 1_000;
export const DOCUMENTATION_IMPORT_LIFETIME_MS = 60 * 60 * 1_000;

export const DOCUMENTATION_CARRY_FORWARD_MAX_SELECTIONS = 10;
export const DOCUMENTATION_CARRY_FORWARD_PAGES_MAX = 5_000;
export const DOCUMENTATION_CARRY_FORWARD_SNIPPETS_MAX = 5_000;
export const DOCUMENTATION_CARRY_FORWARD_CONTENT_NODES_MAX = 250_000;
export const DOCUMENTATION_CARRY_FORWARD_PROTECTED_REFERENCES_MAX = 10_000;
export const DOCUMENTATION_CARRY_FORWARD_SAVED_TEXT_MAX_BYTES =
  256 * 1024 * 1024;

export const DOCUMENTATION_REVIEW_POLICY_MODES = [
  "optional",
  "approval_required",
] as const;
export const DOCUMENTATION_REVIEW_REQUEST_STATUSES = [
  "open",
  "approved",
  "rejected",
  "canceled",
  "superseded",
] as const;
export const DOCUMENTATION_REVIEW_EFFECTIVE_STATUSES = [
  ...DOCUMENTATION_REVIEW_REQUEST_STATUSES,
  "invalidated",
] as const;
export const DOCUMENTATION_REVIEW_DECISIONS = ["approve", "reject"] as const;
export const DOCUMENTATION_PUBLICATION_REVIEW_OUTCOMES = [
  "not_required",
  "approved",
  "overridden",
] as const;
export const DOCUMENTATION_REVIEW_INBOX_STATUSES = ["unread", "read"] as const;
export const DOCUMENTATION_REVIEW_NOTIFICATION_TYPES = [
  "review_assigned",
  "review_approved",
  "review_rejected",
  "review_canceled",
  "review_superseded",
  "publication_overridden",
] as const;
export const DOCUMENTATION_REVIEWERS_MAX = 10;
export const DOCUMENTATION_REVIEW_MAINTAINERS_MAX = 20;
export const DOCUMENTATION_REVIEW_REASON_MAX = 1_000;
export const DOCUMENTATION_REVIEW_INBOX_PAGE_MAX = 50;
export const DOCUMENTATION_REVIEW_REQUESTS_PER_EDITION_HARD_MAX = 10_000;

export const DOCUMENTATION_TRY_IT_POLICY_STATUSES = [
  "disabled",
  "enabled",
] as const;
export const DOCUMENTATION_TRY_IT_ALLOWED_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;
export const DOCUMENTATION_TRY_IT_CREDENTIAL_MODES = [
  "none",
  "bearer",
  "api_key_header",
] as const;
export const DOCUMENTATION_TRY_IT_ATTEMPT_OUTCOMES = [
  "completed",
  "browser_network_blocked",
  "timed_out",
  "aborted",
  "response_blocked",
  "client_validation_blocked",
] as const;
export const DOCUMENTATION_TRY_IT_SUPPORTED_JSON_MEDIA_TYPES = [
  "application/json",
  "application/*+json",
] as const;
export const DOCUMENTATION_TRY_IT_URL_MAX_BYTES = 8 * 1024;
export const DOCUMENTATION_TRY_IT_FIELDS_MAX = 100;
export const DOCUMENTATION_TRY_IT_FIELD_VALUE_MAX_BYTES = 8 * 1024;
export const DOCUMENTATION_TRY_IT_HEADERS_MAX = 50;
export const DOCUMENTATION_TRY_IT_HEADER_BYTES_MAX = 32 * 1024;
export const DOCUMENTATION_TRY_IT_REQUEST_BODY_MAX_BYTES = 256 * 1024;
export const DOCUMENTATION_TRY_IT_JSON_DEPTH_MAX = 32;
export const DOCUMENTATION_TRY_IT_JSON_NODES_MAX = 10_000;
export const DOCUMENTATION_TRY_IT_SEND_INTERVAL_MS = 1_000;
export const DOCUMENTATION_TRY_IT_SENDS_PER_ORIGIN_MINUTE_MAX = 10;
export const DOCUMENTATION_TRY_IT_TIMEOUT_DEFAULT_MS = 15_000;
export const DOCUMENTATION_TRY_IT_TIMEOUT_MAX_MS = 30_000;
export const DOCUMENTATION_TRY_IT_RESPONSE_BODY_MAX_BYTES = 1024 * 1024;
export const DOCUMENTATION_TRY_IT_RESPONSE_HEADERS_MAX = 100;
export const DOCUMENTATION_TRY_IT_RESPONSE_HEADER_BYTES_MAX = 32 * 1024;
export const DOCUMENTATION_TRY_IT_DESCRIPTOR_MAX_BYTES = 256 * 1024;
export const DOCUMENTATION_TRY_IT_SOURCE_DESCRIPTORS_MAX_BYTES =
  16 * 1024 * 1024;
export const DOCUMENTATION_TRY_IT_EXAMPLE_MAX_BYTES = 64 * 1024;
export const DOCUMENTATION_TRY_IT_OPERATION_ALLOWANCES_MAX = 500;
export const DOCUMENTATION_TRY_IT_ORIGIN_MAX_LENGTH = 2_048;
export const DOCUMENTATION_TRY_IT_BASE_PATH_MAX_LENGTH = 2_048;
export const DOCUMENTATION_TRY_IT_HEADER_NAME_MAX_LENGTH = 256;
export const DOCUMENTATION_TRY_IT_CONFIGURATION_LEASE_MS = 60 * 1_000;
export const DOCUMENTATION_TRY_IT_ATTEMPT_TOKEN_LIFETIME_MS = 5 * 60 * 1_000;
