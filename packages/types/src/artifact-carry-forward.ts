import { ARTIFACT_CARRY_FORWARD_MAX_SELECTIONS } from "@repo/constants";
import { z } from "zod";
import { IdSchema, IsoDateTimeStringSchema, PositiveIntSchema } from "./common";

export const ArtifactCarryForwardTypeSchema = z.enum([
  "guide",
  "interactive_demo",
]);

export const ArtifactCarryForwardSelectionSchema = z
  .object({
    artifact_type: ArtifactCarryForwardTypeSchema,
    artifact_id: IdSchema,
  })
  .strict();

export const ArtifactCarryForwardRequestSchema = z
  .object({
    source_project_version_id: IdSchema,
    target_project_version_id: IdSchema,
    artifacts: z
      .array(ArtifactCarryForwardSelectionSchema)
      .min(1)
      .max(ARTIFACT_CARRY_FORWARD_MAX_SELECTIONS),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.source_project_version_id === value.target_project_version_id) {
      context.addIssue({
        code: "custom",
        message: "Source and target Project Versions must differ",
        path: ["target_project_version_id"],
      });
    }
    const keys = new Set<string>();
    value.artifacts.forEach((artifact, index) => {
      const key = `${artifact.artifact_type}:${artifact.artifact_id}`;
      if (keys.has(key)) {
        context.addIssue({
          code: "custom",
          message: "Artifact selections must be distinct",
          path: ["artifacts", index],
        });
      }
      keys.add(key);
    });
  });

export const IdempotencyKeySchema = z
  .string()
  .min(16)
  .max(200)
  .regex(/^[\x20-\x7e]+$/);

export const ArtifactCarryForwardOperationSchema = z
  .object({
    id: IdSchema,
    source_project_version_id: IdSchema,
    target_project_version_id: IdSchema,
    created_by_id: IdSchema,
    created_at: IsoDateTimeStringSchema,
  })
  .strict();

export const ArtifactCarryForwardResultItemSchema = z
  .object({
    artifact_type: ArtifactCarryForwardTypeSchema,
    artifact_id: IdSchema,
    source_edition_id: IdSchema,
    source_revision_id: IdSchema,
    source_revision_number: PositiveIntSchema,
    target_edition_id: IdSchema,
    target_working_draft_id: IdSchema,
  })
  .strict();

export const ArtifactCarryForwardResponseSchema = z
  .object({
    carry_forward: ArtifactCarryForwardOperationSchema,
    items: z.array(ArtifactCarryForwardResultItemSchema).min(1),
    replayed: z.boolean(),
  })
  .strict();

export type ArtifactCarryForwardSelection = z.infer<
  typeof ArtifactCarryForwardSelectionSchema
>;
export type ArtifactCarryForwardRequest = z.infer<
  typeof ArtifactCarryForwardRequestSchema
>;
export type ArtifactCarryForwardResponse = z.infer<
  typeof ArtifactCarryForwardResponseSchema
>;
