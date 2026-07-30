import {
  DOCUMENTATION_BLOCKS_PER_PAGE_MAX,
  DOCUMENTATION_CANONICAL_PATH_MAX_BYTES,
  DOCUMENTATION_CANONICAL_PATH_SEGMENT_MAX_BYTES,
  DOCUMENTATION_CANONICAL_PATH_SEGMENTS_MAX,
  DOCUMENTATION_DESCRIPTION_MAX,
  DOCUMENTATION_KEYWORD_MAX,
  DOCUMENTATION_KEYWORDS_PER_PAGE_MAX,
  DOCUMENTATION_PAGE_TITLE_MAX,
  DOCUMENTATION_SEARCH_RESULTS_MAX,
  DOCUMENTATION_SAVED_TEXT_PER_PAGE_MAX_BYTES,
  DOCUMENTATION_ASSET_STATUSES,
  DOCUMENTATION_BLOCKS_PER_SNIPPET_MAX,
  DOCUMENTATION_CALLOUT_TONES,
  DOCUMENTATION_CONTROLLED_MARKDOWN_SCALAR_MAX_BYTES,
  DOCUMENTATION_SAVED_TEXT_PER_SNIPPET_MAX_BYTES,
  DOCUMENTATION_SHORT_LABEL_MAX,
  DOCUMENTATION_SNIPPET_STATUSES,
  DOCUMENTATION_TABLE_CAPTION_MAX,
  DOCUMENTATION_TABLE_COLUMNS_MAX,
  DOCUMENTATION_TABLE_ROWS_MAX,
  DOCUMENTATION_TAB_LABEL_MAX,
  DOCUMENTATION_TABS_MAX,
  DOCUMENTATION_EXTERNAL_BINDINGS_MAX,
  DOCUMENTATION_IMPORT_ISSUE_CODES,
  DOCUMENTATION_IMPORT_ISSUES_MAX,
  DOCUMENTATION_IMPORT_ISSUE_SEVERITIES,
  DOCUMENTATION_PACKAGE_ENTRIES_MAX,
  DOCUMENTATION_PACKAGE_FORMAT,
  DOCUMENTATION_PACKAGE_FORMAT_VERSION,
  DOCUMENTATION_PACKAGE_PROFILES,
  DOCUMENTATION_PACKAGE_SOURCE_KINDS,
  DOCUMENTATION_CARRY_FORWARD_MAX_SELECTIONS,
  DOCUMENTATION_LIFECYCLE_STATUSES,
  DOCUMENTATION_EFFECTIVE_STATUSES,
  DOCUMENTATION_REVISION_TRIGGERS,
  DOCUMENTATION_REVIEW_POLICY_MODES,
  DOCUMENTATION_REVIEW_REQUEST_STATUSES,
  DOCUMENTATION_REVIEW_EFFECTIVE_STATUSES,
  DOCUMENTATION_REVIEW_DECISIONS,
  DOCUMENTATION_PUBLICATION_REVIEW_OUTCOMES,
  DOCUMENTATION_REVIEW_INBOX_STATUSES,
  DOCUMENTATION_REVIEW_NOTIFICATION_TYPES,
  DOCUMENTATION_REVIEWERS_MAX,
  DOCUMENTATION_REVIEW_MAINTAINERS_MAX,
  DOCUMENTATION_REVIEW_REASON_MAX,
} from "@repo/constants";
import { z } from "zod";
import { IdSchema, IsoDateTimeStringSchema, PositiveIntSchema } from "./common";

const TitleSchema = z.string().trim().min(1).max(DOCUMENTATION_PAGE_TITLE_MAX);
const DescriptionSchema = z
  .string()
  .trim()
  .max(DOCUMENTATION_DESCRIPTION_MAX)
  .nullable();
const CanonicalPathSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/u)
  .refine(
    (value) =>
      new TextEncoder().encode(value).byteLength <=
        DOCUMENTATION_CANONICAL_PATH_MAX_BYTES &&
      value.split("/").length <= DOCUMENTATION_CANONICAL_PATH_SEGMENTS_MAX &&
      value
        .split("/")
        .every(
          (segment) =>
            new TextEncoder().encode(segment).byteLength <=
            DOCUMENTATION_CANONICAL_PATH_SEGMENT_MAX_BYTES,
        ),
    { message: "Canonical path exceeds its accepted safety ceiling" },
  );
const ExpectedChildVersionSchema = PositiveIntSchema.nullable();

const PositionedBlockBase = {
  id: IdSchema,
  position: PositiveIntSchema,
  expected_version: ExpectedChildVersionSchema,
} as const;

const ControlledMarkdownSchema = z
  .string()
  .refine(
    (value) =>
      new TextEncoder().encode(value).byteLength <=
        DOCUMENTATION_CONTROLLED_MARKDOWN_SCALAR_MAX_BYTES &&
      !/<\/?[a-z][^>]*>|!\[[^\]]*\]\(|\[[^\]]+\]\(|(^|\n)\s{0,3}#{1,6}\s|(^|\n)\s*(?:import|export)\s/iu.test(
        value,
      ),
    { message: "Text is outside the controlled Markdown subset" },
  );

export const DocumentationAssetSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("documentation_asset"), id: IdSchema }).strict(),
  z.object({ kind: z.literal("capture_asset"), id: IdSchema }).strict(),
]);

const ParagraphBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("paragraph"),
    text: ControlledMarkdownSchema,
  })
  .strict();
const HeadingBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    text: ControlledMarkdownSchema.min(1),
  })
  .strict();
const ListBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.enum(["ordered_list", "unordered_list"]),
    items: z
      .array(
        z
          .object({
            id: IdSchema,
            text: ControlledMarkdownSchema.min(1),
            position: PositiveIntSchema,
            expected_version: ExpectedChildVersionSchema,
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict();
const CodeBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("code"),
    code: z.string().max(1_048_576),
    language: z.string().trim().max(40).nullable(),
  })
  .strict();
const LinkBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("link"),
    label: z.string().trim().min(1),
    url: z.string().url().optional(),
    page_id: IdSchema.optional(),
    target_block_id: IdSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Boolean(value.url) !== Boolean(value.page_id), {
    message: "Link must target exactly one URL or Page",
  })
  .refine((value) => !value.target_block_id || Boolean(value.page_id), {
    message: "A target block requires a target Page",
  });
const ImageBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("image"),
    source: DocumentationAssetSourceSchema.optional(),
    asset_id: IdSchema.optional(),
    alt_text: z.string().trim().min(1).max(1_000),
    caption: z.string().trim().max(1_000).nullable(),
  })
  .strict()
  .refine((value) => Boolean(value.source) !== Boolean(value.asset_id), {
    message: "Image must target exactly one typed Asset source",
  });
const DividerBlockSchema = z
  .object({ ...PositionedBlockBase, kind: z.literal("divider") })
  .strict();
const ApiReferenceBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("api_reference"),
    openapi_source_id: IdSchema,
    operation_key: z.string().trim().min(1).nullable(),
  })
  .strict();
const QuoteBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("quote"),
    text: ControlledMarkdownSchema.min(1),
    attribution: z
      .string()
      .trim()
      .max(DOCUMENTATION_SHORT_LABEL_MAX)
      .nullable(),
  })
  .strict();
const DocumentationTableCellSchema = z
  .object({
    id: IdSchema,
    column_position: PositiveIntSchema,
    expected_version: ExpectedChildVersionSchema,
    is_header: z.boolean(),
    text: ControlledMarkdownSchema,
  })
  .strict();
const DocumentationTableRowSchema = z
  .object({
    id: IdSchema,
    position: PositiveIntSchema,
    expected_version: ExpectedChildVersionSchema,
    cells: z
      .array(DocumentationTableCellSchema)
      .min(1)
      .max(DOCUMENTATION_TABLE_COLUMNS_MAX),
  })
  .strict();
const TableBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("table"),
    caption: z.string().trim().max(DOCUMENTATION_TABLE_CAPTION_MAX).nullable(),
    rows: z
      .array(DocumentationTableRowSchema)
      .min(1)
      .max(DOCUMENTATION_TABLE_ROWS_MAX),
  })
  .strict()
  .superRefine((value, context) => {
    const width = value.rows[0]?.cells.length ?? 0;
    if (
      value.rows.some((row) => row.cells.length !== width) ||
      value.rows.some((row, rowIndex) =>
        row.cells.some((cell) => cell.is_header && rowIndex !== 0),
      )
    )
      context.addIssue({
        code: "custom",
        message: "Table must be rectangular and headers must be in row one",
      });
  });
const CodeExampleBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("code_example"),
    code: z.string().max(1_048_576),
    language: z
      .string()
      .trim()
      .max(40)
      .regex(/^[a-z0-9_+#.-]*$/u)
      .nullable(),
    title: z.string().trim().max(DOCUMENTATION_SHORT_LABEL_MAX).nullable(),
  })
  .strict();
const CalloutBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("callout"),
    tone: z.enum(DOCUMENTATION_CALLOUT_TONES),
    title: z.string().trim().max(DOCUMENTATION_SHORT_LABEL_MAX).nullable(),
    text: ControlledMarkdownSchema,
  })
  .strict();
const DocumentationTabItemSchema = z
  .object({
    id: IdSchema,
    position: PositiveIntSchema,
    expected_version: ExpectedChildVersionSchema,
    label: z.string().trim().min(1).max(DOCUMENTATION_TAB_LABEL_MAX),
    body: ControlledMarkdownSchema,
  })
  .strict();
const TabsBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("tabs"),
    items: z
      .array(DocumentationTabItemSchema)
      .min(2)
      .max(DOCUMENTATION_TABS_MAX),
  })
  .strict()
  .refine(
    (value) =>
      new Set(value.items.map((item) => item.label.trim().toLocaleLowerCase()))
        .size === value.items.length,
    { message: "Tab labels must be unique" },
  );
const SnippetReferenceBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("snippet_reference"),
    snippet_id: IdSchema,
  })
  .strict();
const GuidePublicationBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("guide_publication"),
    published_artifact_id: IdSchema,
  })
  .strict();
const DemoPublicationBlockSchema = z
  .object({
    ...PositionedBlockBase,
    kind: z.literal("interactive_demo_publication"),
    published_artifact_id: IdSchema,
  })
  .strict();

const DocumentationBlockSchemas = [
  ParagraphBlockSchema,
  HeadingBlockSchema,
  ListBlockSchema,
  CodeBlockSchema,
  LinkBlockSchema,
  ImageBlockSchema,
  DividerBlockSchema,
  ApiReferenceBlockSchema,
  QuoteBlockSchema,
  TableBlockSchema,
  CodeExampleBlockSchema,
  CalloutBlockSchema,
  TabsBlockSchema,
  SnippetReferenceBlockSchema,
  GuidePublicationBlockSchema,
  DemoPublicationBlockSchema,
] as const;

export const DocumentationBlockSchema = z.discriminatedUnion(
  "kind",
  DocumentationBlockSchemas,
);

export const DocumentationSnippetBlockSchema = z.discriminatedUnion("kind", [
  ParagraphBlockSchema,
  HeadingBlockSchema,
  ListBlockSchema,
  CodeBlockSchema,
  LinkBlockSchema,
  ImageBlockSchema,
  DividerBlockSchema,
  ApiReferenceBlockSchema,
  QuoteBlockSchema,
  TableBlockSchema,
  CodeExampleBlockSchema,
  CalloutBlockSchema,
  TabsBlockSchema,
  GuidePublicationBlockSchema,
  DemoPublicationBlockSchema,
]);

export const DocumentationCreateSiteRequestSchema = z
  .object({
    name: TitleSchema,
    description: DescriptionSchema.default(null),
    primary_language: z.string().trim().min(2).max(35),
    initial_home_page: z
      .object({ title: TitleSchema, path: CanonicalPathSchema })
      .strict()
      .optional(),
  })
  .strict();

export const DocumentationPageContentRequestSchema = z
  .object({
    expected_page_version: PositiveIntSchema,
    blocks: z
      .array(DocumentationBlockSchema)
      .max(DOCUMENTATION_BLOCKS_PER_PAGE_MAX),
  })
  .strict()
  .refine(
    ({ blocks }) => {
      const text = blocks
        .flatMap((block) => {
          const record = block as Record<string, unknown>;
          const values = [
            record.text,
            record.code,
            record.label,
            record.url,
            record.alt_text,
            record.caption,
            record.operation_key,
          ];
          if (Array.isArray(record.items))
            values.push(
              ...(record.items as Array<{ text?: string }>).map(
                (item) => item.text,
              ),
            );
          return values.filter(
            (value): value is string => typeof value === "string",
          );
        })
        .join("");
      return (
        new TextEncoder().encode(text).byteLength <=
        DOCUMENTATION_SAVED_TEXT_PER_PAGE_MAX_BYTES
      );
    },
    { message: "Saved Page text exceeds its accepted safety ceiling" },
  );

const boundedSavedText = (blocks: Array<Record<string, unknown>>) =>
  new TextEncoder().encode(
    blocks
      .flatMap((block) => [
        block.text,
        block.code,
        block.label,
        block.alt_text,
        block.caption,
        block.title,
        block.attribution,
        ...(Array.isArray(block.items)
          ? block.items.flatMap((item) =>
              typeof item === "object" && item
                ? [
                    (item as Record<string, unknown>).text,
                    (item as Record<string, unknown>).label,
                    (item as Record<string, unknown>).body,
                  ]
                : [],
            )
          : []),
      ])
      .filter((value): value is string => typeof value === "string")
      .join(""),
  ).byteLength;

export const DocumentationCreateSnippetRequestSchema = z
  .object({ name: z.string().trim().min(1).max(200) })
  .strict();
export const DocumentationUpdateSnippetRequestSchema = z
  .object({
    expected_version: PositiveIntSchema,
    name: z.string().trim().min(1).max(200),
  })
  .strict();
export const DocumentationSnippetContentRequestSchema = z
  .object({
    expected_snippet_version: PositiveIntSchema,
    blocks: z
      .array(DocumentationSnippetBlockSchema)
      .max(DOCUMENTATION_BLOCKS_PER_SNIPPET_MAX),
  })
  .strict()
  .refine(
    ({ blocks }) =>
      boundedSavedText(blocks as Array<Record<string, unknown>>) <=
      DOCUMENTATION_SAVED_TEXT_PER_SNIPPET_MAX_BYTES,
    { message: "Saved Snippet text exceeds its accepted safety ceiling" },
  );
export const DocumentationSnippetLifecycleRequestSchema = z
  .object({
    expected_version: PositiveIntSchema,
    transition: z.enum(["archive", "restore"]),
  })
  .strict();
export const DocumentationAssetUpdateRequestSchema = z
  .object({
    expected_version: PositiveIntSchema,
    name: z.string().trim().min(1).max(200),
  })
  .strict();
export const DocumentationAssetLifecycleRequestSchema = z
  .object({
    expected_version: PositiveIntSchema,
    transition: z.enum(["archive", "restore"]),
  })
  .strict();

export const DocumentationSnippetSummarySchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1).max(200),
    status: z.enum(DOCUMENTATION_SNIPPET_STATUSES),
    version: PositiveIntSchema,
    updated_at: IsoDateTimeStringSchema,
  })
  .strict();
export const DocumentationSnippetDetailSchema =
  DocumentationSnippetSummarySchema.extend({
    blocks: z.array(DocumentationSnippetBlockSchema),
  }).strict();
export const DocumentationAssetListItemSchema = z
  .object({
    source: DocumentationAssetSourceSchema,
    name: z.string().min(1).max(200),
    status: z.enum(DOCUMENTATION_ASSET_STATUSES),
    version: PositiveIntSchema,
    mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
    width: PositiveIntSchema,
    height: PositiveIntSchema,
    source_project_version: z
      .object({
        id: IdSchema,
        name: z.string().min(1),
        slug: z.string().min(1),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const DocumentationCreatePageRequestSchema = z
  .object({
    title: TitleSchema,
    description: DescriptionSchema.default(null),
    canonical_path: CanonicalPathSchema,
  })
  .strict();

export const DocumentationPageUpdateRequestSchema = z
  .object({
    expected_version: PositiveIntSchema,
    title: TitleSchema.optional(),
    description: DescriptionSchema.optional(),
    canonical_path: CanonicalPathSchema.optional(),
    keywords: z
      .array(z.string().trim().min(1).max(DOCUMENTATION_KEYWORD_MAX))
      .max(DOCUMENTATION_KEYWORDS_PER_PAGE_MAX)
      .optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).some((key) => key !== "expected_version"),
    { message: "At least one Page field must change" },
  );

export const DocumentationNavigationNodeSchema = z
  .object({
    id: IdSchema,
    parent_id: IdSchema.nullable(),
    kind: z.enum(["group", "page"]),
    label: z.string().trim().min(1).max(200).nullable(),
    page_id: IdSchema.nullable(),
    position: PositiveIntSchema,
    expected_version: ExpectedChildVersionSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const valid =
      (value.kind === "group" &&
        value.label !== null &&
        value.page_id === null) ||
      (value.kind === "page" && value.label === null && value.page_id !== null);
    if (!valid)
      context.addIssue({
        code: "custom",
        message: "Navigation node kind does not match its fields",
      });
  });

export const DocumentationNavigationUpdateRequestSchema = z
  .object({
    expected_version: PositiveIntSchema,
    nodes: z.array(DocumentationNavigationNodeSchema).max(2_000),
  })
  .strict();

export const DocumentationRoutingRuleSchema = z
  .object({
    id: IdSchema,
    source_path: CanonicalPathSchema,
    outcome: z.enum(["redirect", "gone"]),
    target_page_id: IdSchema.nullable(),
    expected_version: ExpectedChildVersionSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      (value.outcome === "redirect" && value.target_page_id === null) ||
      (value.outcome === "gone" && value.target_page_id !== null)
    )
      context.addIssue({
        code: "custom",
        message: "Routing outcome does not match its target",
      });
  });

export const DocumentationRoutingUpdateRequestSchema = z
  .object({
    expected_version: PositiveIntSchema,
    rules: z.array(DocumentationRoutingRuleSchema).max(2_000),
  })
  .strict();

const PlainCommentBodySchema = z
  .string()
  .trim()
  .min(1)
  .max(10_000)
  .refine((value) => !/[<>]/u.test(value), {
    message: "Comment must be plain text",
  });

export const DocumentationCommentThreadCreateRequestSchema = z
  .object({
    body: PlainCommentBodySchema,
    block_anchor_id: IdSchema.nullable(),
    mentioned_project_membership_ids: z.array(IdSchema).max(50),
  })
  .strict();

export const DocumentationCommentReplyCreateRequestSchema = z
  .object({
    body: PlainCommentBodySchema,
    mentioned_project_membership_ids: z.array(IdSchema).max(50),
  })
  .strict();

export const DocumentationCommentTransitionRequestSchema = z
  .object({
    expected_version: PositiveIntSchema,
    transition: z.enum(["resolve", "reopen"]),
  })
  .strict();

export const DocumentationCreateRevisionRequestSchema = z
  .object({
    expected_edition_version: PositiveIntSchema,
    expected_draft_version: PositiveIntSchema,
  })
  .strict();

const DocumentationCreateLinkSelectionSchema = z
  .object({
    mode: z.literal("create"),
    name: z.string().trim().min(1).max(120),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    visibility: z.enum(["public", "restricted"]),
    expires_at: IsoDateTimeStringSchema.nullable().default(null),
    password: z.string().nullable().default(null),
  })
  .strict();
const DocumentationExistingLinkSelectionSchema = z
  .object({
    mode: z.literal("existing"),
    link_id: IdSchema,
    entry_id: IdSchema,
    expected_entry_version: PositiveIntSchema,
  })
  .strict();

export const PlainReviewReasonSchema = z
  .string()
  .transform((value) => value.replace(/\r\n?/gu, "\n").normalize("NFC").trim())
  .refine((value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value), {
    message: "Reason contains a disallowed control character",
  })
  .refine(
    (value) => Array.from(value).length <= DOCUMENTATION_REVIEW_REASON_MAX,
    { message: "Reason exceeds the accepted limit" },
  );

export const DocumentationPublicationReviewOverrideSchema = z
  .object({
    expected_policy_version: PositiveIntSchema,
    reason: PlainReviewReasonSchema.refine(
      (value) => Array.from(value).length >= 20,
      { message: "Override reason must contain at least 20 characters" },
    ),
  })
  .strict();

export const DocumentationCreatePublicationRequestSchema = z
  .object({
    revision_id: IdSchema,
    link: z.discriminatedUnion("mode", [
      DocumentationCreateLinkSelectionSchema,
      DocumentationExistingLinkSelectionSchema,
    ]),
    review_override: DocumentationPublicationReviewOverrideSchema.nullable().default(
      null,
    ),
  })
  .strict();

export const DocumentationRollbackPublicationRequestSchema = z
  .object({
    site_publication_id: IdSchema,
    expected_entry_version: PositiveIntSchema,
    review_override: DocumentationPublicationReviewOverrideSchema.nullable().default(
      null,
    ),
  })
  .strict();

const DocumentationReviewPolicyModeSchema = z.enum(
  DOCUMENTATION_REVIEW_POLICY_MODES,
);
const DocumentationReviewDecisionValueSchema = z.enum(
  DOCUMENTATION_REVIEW_DECISIONS,
);
const unique_ids = (ids: string[]) => new Set(ids).size === ids.length;

export const DocumentationReviewPolicySchema = z
  .object({
    id: IdSchema,
    site_id: IdSchema,
    site_edition_id: IdSchema,
    mode: DocumentationReviewPolicyModeSchema,
    required_approvals: z.number().int().min(1).max(DOCUMENTATION_REVIEWERS_MAX),
    require_maintainer_approval: z.boolean(),
    maintainer_org_user_ids: z
      .array(IdSchema)
      .max(DOCUMENTATION_REVIEW_MAINTAINERS_MAX),
    version: PositiveIntSchema,
    updated_at: IsoDateTimeStringSchema,
  })
  .strict();

export const DocumentationReviewPolicyUpdateRequestSchema = z
  .object({
    expected_policy_version: PositiveIntSchema,
    mode: DocumentationReviewPolicyModeSchema,
    required_approvals: z.number().int().min(1).max(DOCUMENTATION_REVIEWERS_MAX),
    require_maintainer_approval: z.boolean(),
    maintainer_org_user_ids: z
      .array(IdSchema)
      .max(DOCUMENTATION_REVIEW_MAINTAINERS_MAX),
  })
  .strict()
  .refine((value) => unique_ids(value.maintainer_org_user_ids), {
    message: "Maintainers must be unique",
  })
  .refine(
    (value) =>
      !value.require_maintainer_approval ||
      (value.maintainer_org_user_ids.length > 0 &&
        value.required_approvals <= value.maintainer_org_user_ids.length),
    { message: "Maintainer requirement cannot be satisfied" },
  );

export const DocumentationReviewCandidateSchema = z
  .object({
    org_user_id: IdSchema,
    display_name: z.string().min(1),
    project_role: z.enum(["project_admin", "editor", "viewer"]),
    is_organization_owner: z.boolean(),
    is_maintainer: z.boolean(),
  })
  .strict();

export const DocumentationReviewRequestCreateRequestSchema = z
  .object({
    site_revision_id: IdSchema,
    expected_policy_version: PositiveIntSchema,
    reviewer_org_user_ids: z.array(IdSchema).min(1).max(DOCUMENTATION_REVIEWERS_MAX),
  })
  .strict()
  .refine((value) => unique_ids(value.reviewer_org_user_ids), {
    message: "Reviewers must be unique",
  });

export const DocumentationReviewDecisionRequestSchema = z.discriminatedUnion(
  "decision",
  [
    z
      .object({
        expected_review_request_version: PositiveIntSchema,
        decision: z.literal("approve"),
        reason: PlainReviewReasonSchema.transform((value) =>
          value.length === 0 ? null : value,
        ).nullable(),
      })
      .strict(),
    z
      .object({
        expected_review_request_version: PositiveIntSchema,
        decision: z.literal("reject"),
        reason: PlainReviewReasonSchema.refine((value) => value.length > 0),
      })
      .strict(),
  ],
);

export const DocumentationReviewCancelRequestSchema = z
  .object({
    expected_review_request_version: PositiveIntSchema,
    reason: PlainReviewReasonSchema.refine((value) => value.length > 0),
  })
  .strict();

export const DocumentationReviewNotificationReadRequestSchema = z
  .object({ expected_version: PositiveIntSchema })
  .strict();

export const DocumentationReviewRequestStatusSchema = z.enum(
  DOCUMENTATION_REVIEW_REQUEST_STATUSES,
);
export const DocumentationReviewEffectiveStatusSchema = z.enum(
  DOCUMENTATION_REVIEW_EFFECTIVE_STATUSES,
);
export const DocumentationPublicationReviewOutcomeSchema = z.enum(
  DOCUMENTATION_PUBLICATION_REVIEW_OUTCOMES,
);
export const DocumentationReviewInboxStatusSchema = z.enum(
  DOCUMENTATION_REVIEW_INBOX_STATUSES,
);
export const DocumentationReviewNotificationTypeSchema = z.enum(
  DOCUMENTATION_REVIEW_NOTIFICATION_TYPES,
);
export { DocumentationReviewDecisionValueSchema };

export const DocumentationReviewDecisionSchema = z
  .object({
    id: IdSchema,
    decision: DocumentationReviewDecisionValueSchema,
    reason: z.string().nullable(),
    decided_by_id: IdSchema,
    created_at: IsoDateTimeStringSchema,
  })
  .strict();
export const DocumentationReviewAssignmentSchema = z
  .object({
    id: IdSchema,
    reviewer_org_user_id: IdSchema,
    reviewer_display_name: z.string().min(1),
    current_project_role: z
      .enum(["project_admin", "editor", "viewer"])
      .nullable(),
    current_access_status: z.enum(["active", "revoked", "disabled"]),
    is_maintainer_at_assignment: z.boolean(),
    is_current_maintainer: z.boolean(),
    decision: DocumentationReviewDecisionSchema.nullable(),
  })
  .strict();
export const DocumentationReviewRequestSchema = z
  .object({
    id: IdSchema,
    site_id: IdSchema,
    site_edition_id: IdSchema,
    site_revision_id: IdSchema,
    revision_number: PositiveIntSchema,
    request_number: PositiveIntSchema,
    status: DocumentationReviewRequestStatusSchema,
    effective_status: DocumentationReviewEffectiveStatusSchema,
    required_approvals: PositiveIntSchema.max(DOCUMENTATION_REVIEWERS_MAX),
    require_maintainer_approval: z.boolean(),
    valid_approval_count: z.number().int().min(0),
    valid_maintainer_approval_count: z.number().int().min(0),
    created_by_id: IdSchema,
    created_by_display_name: z.string().min(1),
    version: PositiveIntSchema,
    created_at: IsoDateTimeStringSchema,
    closed_at: IsoDateTimeStringSchema.nullable(),
    superseded_by_revision_id: IdSchema.nullable(),
    superseded_at: IsoDateTimeStringSchema.nullable(),
  })
  .strict();
export const DocumentationReviewGatePreviewSchema = z
  .object({
    site_revision_id: IdSchema,
    policy_mode: DocumentationReviewPolicyModeSchema,
    policy_version: PositiveIntSchema,
    outcome: z.enum([
      "not_required",
      "approval_missing",
      "approval_pending",
      "approved",
      "invalidated",
    ]),
    governing_review_request_id: IdSchema.nullable(),
    required_approvals: PositiveIntSchema,
    valid_approval_count: z.number().int().min(0),
    require_maintainer_approval: z.boolean(),
    valid_maintainer_approval_count: z.number().int().min(0),
    override_available_to_actor: z.boolean(),
  })
  .strict();
export const DocumentationReviewNotificationSchema = z
  .object({
    id: IdSchema,
    project_id: IdSchema,
    project_version_id: IdSchema,
    site_id: IdSchema,
    site_revision_id: IdSchema,
    review_request_id: IdSchema,
    type: DocumentationReviewNotificationTypeSchema,
    status: DocumentationReviewInboxStatusSchema,
    version: PositiveIntSchema,
    created_at: IsoDateTimeStringSchema,
    read_at: IsoDateTimeStringSchema.nullable(),
  })
  .strict();
export const DocumentationPublicationReviewEvidenceSummarySchema = z
  .object({
    id: IdSchema,
    site_revision_id: IdSchema,
    site_publication_id: IdSchema,
    publish_link_id: IdSchema,
    publish_link_entry_id: IdSchema,
    operation: z.enum(["publication", "rollback"]),
    policy_mode: DocumentationReviewPolicyModeSchema,
    policy_version: PositiveIntSchema,
    required_approvals: PositiveIntSchema,
    require_maintainer_approval: z.boolean(),
    valid_approval_count: z.number().int().min(0),
    valid_maintainer_approval_count: z.number().int().min(0),
    outcome: DocumentationPublicationReviewOutcomeSchema,
    review_request_id: IdSchema.nullable(),
    created_by_id: IdSchema,
    created_at: IsoDateTimeStringSchema,
  })
  .strict();
export const DocumentationPublicationReviewEvidenceDetailSchema = z
  .object({
    evidence: DocumentationPublicationReviewEvidenceSummarySchema,
    override_reason: z.string().nullable(),
  })
  .strict();

export const DocumentationApplyOpenApiRequestSchema = z
  .object({
    inspection_id: IdSchema,
    expected_source_version: PositiveIntSchema.nullable(),
  })
  .strict();

export const DocumentationPageSummarySchema = z
  .object({
    id: IdSchema,
    title: TitleSchema,
    description: DescriptionSchema,
    canonical_path: CanonicalPathSchema,
    version: PositiveIntSchema,
    updated_at: IsoDateTimeStringSchema,
  })
  .strict();

export const DocumentationConflictResponseSchema = z
  .object({
    code: z.literal("documentation_row_version_conflict"),
    latest_page: DocumentationPageSummarySchema,
    draft_state_token: z.string().min(1),
  })
  .strict();

export const DocumentationPublicSearchResponseSchema = z
  .object({
    results: z
      .array(
        z
          .object({
            page_id: IdSchema,
            title: TitleSchema,
            excerpt: z.string(),
            canonical_path: CanonicalPathSchema,
          })
          .strict(),
      )
      .max(DOCUMENTATION_SEARCH_RESULTS_MAX),
  })
  .strict();

export type DocumentationBlock = z.infer<typeof DocumentationBlockSchema>;
export type DocumentationCreateSiteRequest = z.infer<
  typeof DocumentationCreateSiteRequestSchema
>;

const DocumentationPackageHandleSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]{0,63}$/u);
const DocumentationPackagePathSchema = z
  .string()
  .min(1)
  .max(240)
  .refine(
    (value) =>
      !value.startsWith("/") &&
      !value.includes("\\") &&
      !value.split("/").some((segment) => !segment || segment === ".."),
    { message: "Package path is unsafe" },
  );
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u);
const NonNegativeIntSchema = z.number().int().nonnegative();

export const DocumentationPackageManifestEntryV1Schema = z
  .object({
    path: DocumentationPackagePathSchema,
    role: z.enum([
      "readme",
      "site",
      "page_typed",
      "page_markdown",
      "snippet",
      "asset",
      "openapi",
    ]),
    mime_type: z.string().trim().min(1).max(200),
    size_bytes: NonNegativeIntSchema,
    sha256: Sha256Schema,
  })
  .strict();

export const DocumentationPackageManifestV1Schema = z
  .object({
    format: z.literal(DOCUMENTATION_PACKAGE_FORMAT),
    format_version: z.literal(DOCUMENTATION_PACKAGE_FORMAT_VERSION),
    profile: z.enum(DOCUMENTATION_PACKAGE_PROFILES),
    source: z
      .object({
        kind: z.enum(DOCUMENTATION_PACKAGE_SOURCE_KINDS),
        project_version_label: z.string().min(1).max(200),
        revision_number: PositiveIntSchema.nullable(),
        publication_sequence: PositiveIntSchema.nullable(),
      })
      .strict(),
    content_fingerprint: Sha256Schema,
    site_path: z.literal("site.json"),
    readme_path: z.literal("README.md"),
    entries: z
      .array(DocumentationPackageManifestEntryV1Schema)
      .max(DOCUMENTATION_PACKAGE_ENTRIES_MAX),
  })
  .strict();

const PortablePositionedBase = {
  handle: DocumentationPackageHandleSchema,
  position: PositiveIntSchema,
} as const;
const PortableListItemSchema = z
  .object({
    handle: DocumentationPackageHandleSchema,
    position: PositiveIntSchema,
    text: ControlledMarkdownSchema.min(1),
  })
  .strict();
const PortableTableCellSchema = z
  .object({
    handle: DocumentationPackageHandleSchema,
    position: PositiveIntSchema,
    is_header: z.boolean(),
    text: ControlledMarkdownSchema,
  })
  .strict();
const PortableTableRowSchema = z
  .object({
    handle: DocumentationPackageHandleSchema,
    position: PositiveIntSchema,
    cells: z.array(PortableTableCellSchema).min(1).max(20),
  })
  .strict();
const PortableTabSchema = z
  .object({
    handle: DocumentationPackageHandleSchema,
    position: PositiveIntSchema,
    label: z.string().trim().min(1).max(DOCUMENTATION_TAB_LABEL_MAX),
    body: ControlledMarkdownSchema,
  })
  .strict();

const portableBlockSchemas = [
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("paragraph"),
      text: ControlledMarkdownSchema,
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("heading"),
      level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
      text: ControlledMarkdownSchema.min(1),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("ordered_list"),
      items: z.array(PortableListItemSchema).min(1).max(500),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("unordered_list"),
      items: z.array(PortableListItemSchema).min(1).max(500),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("code"),
      code: z.string().max(1_048_576),
      language: z.string().trim().max(40).nullable(),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("link"),
      label: z.string().trim().min(1),
      url: z.string().url().optional(),
      page_handle: DocumentationPackageHandleSchema.optional(),
      target_block_handle:
        DocumentationPackageHandleSchema.nullable().optional(),
    })
    .strict()
    .refine((value) => Boolean(value.url) !== Boolean(value.page_handle), {
      message: "Portable link must target exactly one URL or Page",
    })
    .refine(
      (value) => !value.target_block_handle || Boolean(value.page_handle),
      { message: "A target block requires a target Page" },
    ),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("image"),
      asset_handle: DocumentationPackageHandleSchema,
      alt_text: z.string().trim().min(1).max(1_000),
      caption: z.string().trim().max(1_000).nullable(),
    })
    .strict(),
  z.object({ ...PortablePositionedBase, kind: z.literal("divider") }).strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("api_reference"),
      operation_destination_key: z.string().trim().min(1).nullable(),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("quote"),
      text: ControlledMarkdownSchema.min(1),
      attribution: z
        .string()
        .trim()
        .max(DOCUMENTATION_SHORT_LABEL_MAX)
        .nullable(),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("table"),
      caption: z
        .string()
        .trim()
        .max(DOCUMENTATION_TABLE_CAPTION_MAX)
        .nullable(),
      rows: z
        .array(PortableTableRowSchema)
        .min(1)
        .max(DOCUMENTATION_TABLE_ROWS_MAX),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("code_example"),
      code: z.string().max(1_048_576),
      language: z.string().trim().max(40).nullable(),
      title: z.string().trim().max(DOCUMENTATION_SHORT_LABEL_MAX).nullable(),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("callout"),
      tone: z.enum(DOCUMENTATION_CALLOUT_TONES),
      title: z.string().trim().max(DOCUMENTATION_SHORT_LABEL_MAX).nullable(),
      text: ControlledMarkdownSchema.min(1),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("tabs"),
      items: z.array(PortableTabSchema).min(1).max(DOCUMENTATION_TABS_MAX),
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("snippet_reference"),
      snippet_handle: DocumentationPackageHandleSchema,
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("guide_publication"),
      external_binding_handle: DocumentationPackageHandleSchema,
    })
    .strict(),
  z
    .object({
      ...PortablePositionedBase,
      kind: z.literal("interactive_demo_publication"),
      external_binding_handle: DocumentationPackageHandleSchema,
    })
    .strict(),
] as const;

export const DocumentationPortableBlockV1Schema = z.discriminatedUnion(
  "kind",
  portableBlockSchemas,
);
export const DocumentationPortableSnippetBlockV1Schema =
  DocumentationPortableBlockV1Schema.refine(
    (block) => block.kind !== "snippet_reference",
    { message: "Portable Snippets cannot reference Snippets" },
  );

export const DocumentationPortablePageV1Schema = z
  .object({
    schema_version: z.literal(1),
    handle: DocumentationPackageHandleSchema,
    title: TitleSchema,
    description: DescriptionSchema,
    canonical_path: CanonicalPathSchema,
    keywords: z.array(z.string().trim().min(1).max(DOCUMENTATION_KEYWORD_MAX)),
    blocks: z.array(DocumentationPortableBlockV1Schema),
  })
  .strict();

export const DocumentationPortableSnippetV1Schema = z
  .object({
    schema_version: z.literal(1),
    handle: DocumentationPackageHandleSchema,
    name: z.string().trim().min(1).max(200),
    status: z.enum(DOCUMENTATION_SNIPPET_STATUSES),
    blocks: z.array(DocumentationPortableSnippetBlockV1Schema),
  })
  .strict();

const PortableExternalBindingSchema = z
  .object({
    handle: DocumentationPackageHandleSchema,
    kind: z.enum(["guide_publication", "interactive_demo_publication"]),
    display: z
      .object({
        title: z.string().trim().min(1).max(200),
        description: DescriptionSchema,
        project_version_label: z.string().trim().min(1).max(200),
        revision_number: PositiveIntSchema,
        publication_sequence: PositiveIntSchema,
      })
      .strict(),
  })
  .strict();

export const DocumentationPortableSiteV1Schema = z
  .object({
    schema_version: z.literal(1),
    site: z
      .object({
        name: z.string().trim().min(1).max(200),
        description: DescriptionSchema,
        primary_language: z.string().trim().min(2).max(35),
      })
      .strict(),
    home_page_handle: DocumentationPackageHandleSchema.nullable(),
    pages: z.array(
      z
        .object({
          handle: DocumentationPackageHandleSchema,
          title: TitleSchema,
          description: DescriptionSchema,
          canonical_path: CanonicalPathSchema,
          keywords: z.array(
            z.string().trim().min(1).max(DOCUMENTATION_KEYWORD_MAX),
          ),
          typed_path: DocumentationPackagePathSchema.nullable(),
          markdown_path: DocumentationPackagePathSchema,
        })
        .strict(),
    ),
    snippets: z.array(
      z
        .object({
          handle: DocumentationPackageHandleSchema,
          path: DocumentationPackagePathSchema,
        })
        .strict(),
    ),
    assets: z.array(
      z
        .object({
          handle: DocumentationPackageHandleSchema,
          path: DocumentationPackagePathSchema,
          name: z.string().trim().min(1).max(200),
          status: z.enum(DOCUMENTATION_ASSET_STATUSES),
          mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
          size_bytes: PositiveIntSchema,
          width: PositiveIntSchema,
          height: PositiveIntSchema,
          sha256: Sha256Schema,
        })
        .strict(),
    ),
    navigation: z.array(
      z
        .object({
          handle: DocumentationPackageHandleSchema,
          parent_handle: DocumentationPackageHandleSchema.nullable(),
          kind: z.enum(["group", "page"]),
          label: z.string().trim().min(1).max(200).nullable(),
          page_handle: DocumentationPackageHandleSchema.nullable(),
          position: PositiveIntSchema,
        })
        .strict(),
    ),
    aliases: z.array(
      z
        .object({
          page_handle: DocumentationPackageHandleSchema,
          former_path: CanonicalPathSchema,
        })
        .strict(),
    ),
    routes: z.array(
      z
        .object({
          source_path: CanonicalPathSchema,
          outcome: z.enum(["redirect", "gone"]),
          target_page_handle: DocumentationPackageHandleSchema.nullable(),
        })
        .strict(),
    ),
    openapi: z
      .object({
        path: DocumentationPackagePathSchema,
        original_format: z.enum(["json", "yaml"]),
        sha256: Sha256Schema,
      })
      .strict()
      .nullable(),
    external_bindings: z
      .array(PortableExternalBindingSchema)
      .max(DOCUMENTATION_EXTERNAL_BINDINGS_MAX),
  })
  .strict();

export const DocumentationImportIssueSchema = z
  .object({
    severity: z.enum(DOCUMENTATION_IMPORT_ISSUE_SEVERITIES),
    code: z.enum(DOCUMENTATION_IMPORT_ISSUE_CODES),
    location: DocumentationPackagePathSchema.nullable(),
    line: PositiveIntSchema.nullable(),
    column: PositiveIntSchema.nullable(),
    message: z.string().min(1).max(500),
  })
  .strict();

export const DocumentationImportCountsSchema = z
  .object({
    pages: NonNegativeIntSchema,
    snippets: NonNegativeIntSchema,
    assets: NonNegativeIntSchema,
    openapi_sources: z.union([z.literal(0), z.literal(1)]),
    external_bindings: NonNegativeIntSchema,
    navigation_nodes: NonNegativeIntSchema,
    aliases: NonNegativeIntSchema,
    routes: NonNegativeIntSchema,
    blocks: NonNegativeIntSchema,
  })
  .strict();

const RequiredBindingSchema = PortableExternalBindingSchema;
const ImportInspectionSchema = z
  .object({
    id: IdSchema,
    kind: z.enum(["page_markdown", "site_package"]),
    status: z.literal("ready"),
    format_version: z.literal(1).nullable(),
    source_digest: Sha256Schema,
    content_fingerprint: Sha256Schema,
    expires_at: IsoDateTimeStringSchema,
    summary: z
      .object({
        pages: NonNegativeIntSchema,
        snippets: NonNegativeIntSchema,
        assets: NonNegativeIntSchema,
        openapi_sources: z.union([z.literal(0), z.literal(1)]),
        external_bindings: NonNegativeIntSchema,
        expanded_bytes: NonNegativeIntSchema,
      })
      .strict(),
    proposal: z
      .object({
        package_profile: z.enum(DOCUMENTATION_PACKAGE_PROFILES).nullable(),
        claimed_source_kind: z
          .enum(DOCUMENTATION_PACKAGE_SOURCE_KINDS)
          .nullable(),
        title: TitleSchema.nullable(),
        canonical_path: CanonicalPathSchema.nullable(),
        site_name: z.string().trim().min(1).max(200).nullable(),
        site_description: DescriptionSchema,
        primary_language: z.string().trim().min(2).max(35).nullable(),
        home_page_handle: DocumentationPackageHandleSchema.nullable(),
        pages: z.array(
          z
            .object({
              handle: DocumentationPackageHandleSchema,
              title: TitleSchema,
              canonical_path: CanonicalPathSchema,
            })
            .strict(),
        ),
        required_bindings: z
          .array(RequiredBindingSchema)
          .max(DOCUMENTATION_EXTERNAL_BINDINGS_MAX),
      })
      .strict(),
    issues: z
      .array(DocumentationImportIssueSchema)
      .max(DOCUMENTATION_IMPORT_ISSUES_MAX),
    issue_counts: z
      .object({
        blocking: NonNegativeIntSchema,
        warnings: NonNegativeIntSchema,
      })
      .strict(),
    has_blocking_issues: z.boolean(),
    issues_truncated: z.boolean(),
  })
  .strict();

export const DocumentationImportInspectionResponseSchema = z
  .object({ inspection: ImportInspectionSchema })
  .strict();

export const DocumentationImportApplyRequestSchema = z
  .object({
    content_fingerprint: Sha256Schema,
    target: z.discriminatedUnion("mode", [
      z
        .object({
          mode: z.literal("page"),
          site_id: IdSchema,
          expected_draft_version: PositiveIntSchema,
          title: TitleSchema,
          canonical_path: CanonicalPathSchema,
          set_as_home: z.boolean(),
        })
        .strict(),
      z
        .object({
          mode: z.literal("create_site"),
          name: z.string().trim().min(1).max(200).nullable(),
        })
        .strict(),
      z
        .object({
          mode: z.literal("empty_site"),
          site_id: IdSchema,
          expected_site_version: PositiveIntSchema,
          expected_draft_version: PositiveIntSchema,
          apply_primary_language: z.boolean(),
        })
        .strict(),
    ]),
    external_bindings: z
      .array(
        z
          .object({
            handle: DocumentationPackageHandleSchema,
            published_artifact_id: IdSchema,
          })
          .strict(),
      )
      .max(DOCUMENTATION_EXTERNAL_BINDINGS_MAX),
    confirm: z.literal(true),
  })
  .strict();

export const DocumentationLifecycleStatusSchema = z.enum(
  DOCUMENTATION_LIFECYCLE_STATUSES,
);
export const DocumentationEffectiveStatusSchema = z.enum(
  DOCUMENTATION_EFFECTIVE_STATUSES,
);
export const DocumentationRevisionTriggerSchema = z.enum(
  DOCUMENTATION_REVISION_TRIGGERS,
);

export const DocumentationEditionUpdateRequestSchema = z
  .object({
    expected_edition_version: PositiveIntSchema,
    title: TitleSchema,
    description: DescriptionSchema,
    primary_language: z.string().trim().min(2).max(35),
  })
  .strict();

export const DocumentationEditionLifecycleRequestSchema = z
  .object({
    expected_edition_version: PositiveIntSchema,
    transition: z.enum(["archive", "restore"]),
  })
  .strict();

const DocumentationPageRetirementSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("none") }).strict(),
  z
    .object({
      mode: z.literal("redirect"),
      target_page_id: IdSchema,
    })
    .strict(),
  z.object({ mode: z.literal("gone") }).strict(),
]);

export const DocumentationPageLifecycleRequestSchema = z.discriminatedUnion(
  "transition",
  [
    z
      .object({
        transition: z.literal("archive"),
        expected_page_version: PositiveIntSchema,
        expected_draft_version: PositiveIntSchema,
        expected_navigation_version: PositiveIntSchema,
        expected_routing_version: PositiveIntSchema,
        retirement: DocumentationPageRetirementSchema,
        replacement_home_page_id: IdSchema.nullable(),
      })
      .strict(),
    z
      .object({
        transition: z.literal("restore"),
        expected_page_version: PositiveIntSchema,
        expected_draft_version: PositiveIntSchema,
      })
      .strict(),
  ],
);

export const DocumentationOpenApiLifecycleRequestSchema = z
  .object({
    expected_source_version: PositiveIntSchema,
    transition: z.enum(["archive", "restore"]),
  })
  .strict();

export const DocumentationStatusFilterSchema = z.enum([
  "active",
  "archived",
  "all",
]);

const DocumentationCarryForwardSelectionSchema = z
  .object({
    site_id: IdSchema,
    expected_source_edition_version: PositiveIntSchema,
    expected_source_draft_version: PositiveIntSchema,
  })
  .strict();

export const DocumentationCarryForwardRequestSchema = z
  .object({
    source_project_version_id: IdSchema,
    target_project_version_id: IdSchema,
    selections: z
      .array(DocumentationCarryForwardSelectionSchema)
      .min(1)
      .max(DOCUMENTATION_CARRY_FORWARD_MAX_SELECTIONS),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.source_project_version_id === value.target_project_version_id) {
      context.addIssue({
        code: "custom",
        path: ["target_project_version_id"],
        message: "Source and target Project Versions must differ",
      });
    }
    const siteIds = value.selections.map((selection) => selection.site_id);
    if (new Set(siteIds).size !== siteIds.length) {
      context.addIssue({
        code: "custom",
        path: ["selections"],
        message: "Each Documentation Site may be selected only once",
      });
    }
  });

const DocumentationCarryForwardItemSchema = z
  .object({
    site_id: IdSchema,
    source_edition_id: IdSchema,
    source_revision_id: IdSchema,
    source_revision_number: PositiveIntSchema,
    source_revision_reused: z.boolean(),
    target_edition_id: IdSchema,
    target_working_draft_id: IdSchema,
  })
  .strict();

export const DocumentationCarryForwardResponseSchema = z
  .object({
    carry_forward: z
      .object({
        id: IdSchema,
        source_project_version_id: IdSchema,
        target_project_version_id: IdSchema,
        created_by_id: IdSchema,
        created_at: IsoDateTimeStringSchema,
      })
      .strict(),
    items: z
      .array(DocumentationCarryForwardItemSchema)
      .min(1)
      .max(DOCUMENTATION_CARRY_FORWARD_MAX_SELECTIONS),
    replayed: z.boolean(),
  })
  .strict();

export const DocumentationCarryForwardOptionsResponseSchema = z
  .object({
    source_project_version: z
      .object({
        id: IdSchema,
        slug: z.string().trim().min(1).max(160),
        name: TitleSchema,
        status: DocumentationLifecycleStatusSchema,
      })
      .strict(),
    target_project_version_id: IdSchema,
    sites: z.array(
      z
        .object({
          site_id: IdSchema,
          source_edition_id: IdSchema,
          title: TitleSchema,
          description: DescriptionSchema,
          primary_language: z.string().min(2).max(35),
          status: DocumentationLifecycleStatusSchema,
          effective_status: DocumentationEffectiveStatusSchema,
          read_only_reason: z.string().max(500).nullable(),
          source_edition_version: PositiveIntSchema,
          source_working_draft_id: IdSchema,
          source_draft_version: PositiveIntSchema,
          latest_revision: z
            .object({
              id: IdSchema,
              revision_number: PositiveIntSchema,
              creation_trigger: DocumentationRevisionTriggerSchema,
              created_at: IsoDateTimeStringSchema,
            })
            .strict()
            .nullable(),
          target_has_edition: z.boolean(),
          blocker_code: z
            .literal("documentation_carry_forward_target_exists")
            .nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export type DocumentationPortableBlockV1 = z.infer<
  typeof DocumentationPortableBlockV1Schema
>;
export type DocumentationPortablePageV1 = z.infer<
  typeof DocumentationPortablePageV1Schema
>;
export type DocumentationPortableSnippetV1 = z.infer<
  typeof DocumentationPortableSnippetV1Schema
>;
export type DocumentationPortableSiteV1 = z.infer<
  typeof DocumentationPortableSiteV1Schema
>;
export type DocumentationPackageManifestV1 = z.infer<
  typeof DocumentationPackageManifestV1Schema
>;
