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
  .object({ expected_draft_version: PositiveIntSchema })
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

export const DocumentationCreatePublicationRequestSchema = z
  .object({
    revision_id: IdSchema,
    link: z.discriminatedUnion("mode", [
      DocumentationCreateLinkSelectionSchema,
      DocumentationExistingLinkSelectionSchema,
    ]),
  })
  .strict();

export const DocumentationRollbackPublicationRequestSchema = z
  .object({
    site_publication_id: IdSchema,
    expected_entry_version: PositiveIntSchema,
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
