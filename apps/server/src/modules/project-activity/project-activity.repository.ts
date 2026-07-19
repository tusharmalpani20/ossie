import type { ProjectActivityCategory } from "@repo/constants";
import type { ProjectActivityEvent } from "@repo/types/project-activity";

type Queryable = { query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: Row[] }> };
type Definition = { category: ProjectActivityCategory; summary: string };
const definitions = new Map<string, Definition>();
const add = (category: ProjectActivityCategory, actions: readonly string[]) => {
  for (const action of actions) definitions.set(action, {
    category,
    summary: action.split(".").map((part) => part.replaceAll("_", " ")).join(" ").replace(/^./u, (value) => value.toUpperCase()),
  });
};
add("project", ["project.created", "project.updated", "project.deleted"]);
add("capture", ["capture_session.created", "capture_session.updated", "capture_session.completed", "capture_session.deleted", "capture_asset.created", "capture_asset.uploaded", "capture_asset.deleted", "capture_event.created", "capture_event.updated", "capture_event.reordered", "capture_event.deleted"]);
add("content", ["guide.created", "guide.updated", "guide.step.updated", "guide.blocks.reordered", "guide.block.created", "guide.block.updated", "guide.block.screenshot_updated", "guide.block.annotations_updated", "guide.block.screenshot_uploaded", "guide.block.deleted", "interactive_demo.created", "interactive_demo.updated", "interactive_demo.deleted", "interactive_demo.scene.created", "interactive_demo.scene.updated", "interactive_demo.scenes.reordered", "interactive_demo.scene.deleted", "interactive_demo.hotspot.created", "interactive_demo.hotspot.updated", "interactive_demo.hotspots.reordered", "interactive_demo.hotspot.deleted"]);
add("publication", ["guide.published", "interactive_demo.published", "guide.publish_link.revoked", "interactive_demo.publish_link.revoked", "guide.publish_link.access_updated", "interactive_demo.publish_link.access_updated", "guide.publish_link.password_updated", "interactive_demo.publish_link.password_updated"]);
export const PROJECT_ACTIVITY_ACTIONS = [...definitions.keys()];

export type ProjectActivityCursor = { occurred_at: string; id: string };
export const build_project_activity_repository = (db: Queryable) => ({
  async list_events(input: { organization_id: string; project_id: string; cursor: ProjectActivityCursor | null; limit: number }) {
    const result = await db.query<{
      id: string; project_id: string; action: string; actor_type: "org_user" | "system";
      actor_label: string; source_type: ProjectActivityEvent["source_type"]; occurred_at: Date;
    }>(`
      SELECT id, project_id, action, actor_type, actor_label, source_type, occurred_at
      FROM audit_schema.audit_event
      WHERE organization_id = $1 AND project_id = $2 AND action = ANY($3::text[])
        AND ($4::timestamptz IS NULL OR (occurred_at, id) < ($4::timestamptz, $5::text))
      ORDER BY occurred_at DESC, id DESC LIMIT $6
    `, [input.organization_id, input.project_id, PROJECT_ACTIVITY_ACTIONS,
      input.cursor?.occurred_at ?? null, input.cursor?.id ?? null, input.limit + 1]);
    const rows = result.rows.slice(0, input.limit);
    return {
      events: rows.map((row): ProjectActivityEvent => {
        const definition = definitions.get(row.action)!;
        return { id: row.id, project_id: row.project_id, category: definition.category,
          action: row.action, summary: definition.summary, actor_type: row.actor_type,
          actor_label: row.actor_label, source_type: row.source_type,
          occurred_at: row.occurred_at.toISOString(), grouped_event_count: 1 };
      }),
      has_more: result.rows.length > input.limit,
    };
  },
});
