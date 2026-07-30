import {
  DOCUMENTATION_BLOCKS_PER_PAGE_MAX,
  DOCUMENTATION_DESCRIPTION_MAX,
  DOCUMENTATION_PAGE_TITLE_MAX,
  DOCUMENTATION_SEARCH_RESULTS_MAX,
} from "@repo/constants";
import { z } from "zod";
import {
  IdSchema,
  IsoDateTimeStringSchema,
  PositiveIntSchema,
} from "./common";

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
  .max(240)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/u);
const ExpectedChildVersionSchema = PositiveIntSchema.nullable();

const PositionedBlockBase = {
  id: IdSchema,
  position: PositiveIntSchema,
  expected_version: ExpectedChildVersionSchema,
} as const;

export const DocumentationBlockSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...PositionedBlockBase,
      kind: z.literal("paragraph"),
      text: z.string(),
    })
    .strict(),
  z
    .object({
      ...PositionedBlockBase,
      kind: z.literal("heading"),
      level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
      text: z.string().min(1),
    })
    .strict(),
  z
    .object({
      ...PositionedBlockBase,
      kind: z.enum(["ordered_list", "unordered_list"]),
      items: z
        .array(
          z
            .object({
              id: IdSchema,
              text: z.string().min(1),
              position: PositiveIntSchema,
              expected_version: ExpectedChildVersionSchema,
            })
            .strict(),
        )
        .min(1)
        .max(500),
    })
    .strict(),
  z
    .object({
      ...PositionedBlockBase,
      kind: z.literal("code"),
      code: z.string().max(1_048_576),
      language: z.string().trim().max(40).nullable(),
    })
    .strict(),
  z
    .object({
      ...PositionedBlockBase,
      kind: z.literal("link"),
      label: z.string().trim().min(1),
      url: z.string().url().optional(),
      page_id: IdSchema.optional(),
    })
    .strict()
    .refine((value) => Boolean(value.url) !== Boolean(value.page_id), {
      message: "Link must target exactly one URL or Page",
    }),
  z
    .object({
      ...PositionedBlockBase,
      kind: z.literal("image"),
      asset_id: IdSchema,
      alt_text: z.string().trim().min(1).max(1_000),
      caption: z.string().trim().max(1_000).nullable(),
    })
    .strict(),
  z.object({ ...PositionedBlockBase, kind: z.literal("divider") }).strict(),
  z
    .object({
      ...PositionedBlockBase,
      kind: z.literal("api_reference"),
      openapi_source_id: IdSchema,
      operation_key: z.string().trim().min(1).nullable(),
    })
    .strict(),
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
    keywords: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  })
  .strict()
  .refine(
    ({ expected_version: _expected_version, ...changes }) =>
      Object.keys(changes).length > 0,
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
      (value.kind === "group" && value.label !== null && value.page_id === null) ||
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
