import { PROJECT_ACTIVITY_CATEGORIES } from "@repo/constants";
import { z } from "zod";
import { ComplianceAuditEventSummarySchema } from "./compliance";
import { IdSchema, IsoDateTimeStringSchema } from "./common";

export const ProjectActivityEventSchema = z.object({
  id: IdSchema,
  project_id: IdSchema,
  category: z.enum(PROJECT_ACTIVITY_CATEGORIES),
  action: z.string().min(1).max(120),
  summary: z.string().min(1).max(200),
  actor_type: z.enum(["org_user", "system"]),
  actor_label: z.string().min(1).max(200),
  source_type: ComplianceAuditEventSummarySchema.shape.source_type,
  occurred_at: IsoDateTimeStringSchema,
  grouped_event_count: z.number().int().positive(),
}).strict();
export type ProjectActivityEvent = z.infer<typeof ProjectActivityEventSchema>;

export const ProjectActivityResponseSchema = z.object({
  events: z.array(ProjectActivityEventSchema),
  page: z.object({
    next_cursor: z.string().min(1).nullable(),
    has_more: z.boolean(),
  }).strict(),
}).strict();
export type ProjectActivityResponse = z.infer<typeof ProjectActivityResponseSchema>;
