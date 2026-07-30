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
