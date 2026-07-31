import type {
  DocumentationLimitStateSchema,
  DocumentationProjectionRebuildRequestSchema,
} from "@repo/types";
import type { z } from "zod";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

type LimitState = z.infer<typeof DocumentationLimitStateSchema>["state"];
type QuotaDimension = z.infer<
  typeof DocumentationLimitStateSchema
>["dimension"];
type RepresentationKey =
  | "html"
  | "json-root"
  | "json-page"
  | "operation"
  | "search"
  | "sitemap"
  | "robots";

export const calculate_documentation_limit_state = (
  usage: number,
  limit: number | null,
): LimitState => {
  if (limit === null || usage < limit) return "within_limit";
  if (usage === limit) return "at_limit";
  return "over_limit";
};

export const assert_documentation_quota_increase = (input: {
  dimension: QuotaDimension;
  usage: number;
  limit: number | null;
  delta: number;
}) => {
  if (
    input.delta > 0 &&
    input.limit !== null &&
    input.usage + input.delta > input.limit
  ) {
    throw new DocumentationDomainError(
      "documentation_organization_quota_exceeded",
      `Documentation ${input.dimension} quota does not allow this growth`,
    );
  }
};

export const build_documentation_etag = (
  output_digest: string,
  representation: RepresentationKey,
) => `"documentation-${output_digest}-${representation}"`;

export const truncate_documentation_metadata = (
  value: string,
  max_scalars: number,
) => {
  const scalars = Array.from(value);
  if (scalars.length <= max_scalars) return value;
  if (max_scalars <= 0) return "";
  return `${scalars.slice(0, Math.max(0, max_scalars - 1)).join("")}…`;
};

export type DocumentationProjectionRebuildRequest = z.infer<
  typeof DocumentationProjectionRebuildRequestSchema
>;
