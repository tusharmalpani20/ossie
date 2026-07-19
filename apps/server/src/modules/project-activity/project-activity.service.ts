import type { ProjectActivityEvent } from "@repo/types/project-activity";
import type { ProjectActivityCursor } from "./project-activity.repository";

export class InvalidProjectActivityCursorError extends Error { constructor() { super("Project Activity cursor is invalid"); } }
const pattern = /^[A-Za-z0-9_-]+$/u;
const decode = (value: string, project_id: string): ProjectActivityCursor => {
  if (value.length > 2048 || !pattern.test(value)) throw new InvalidProjectActivityCursorError();
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
    if (parsed.version !== 1 || parsed.project_id !== project_id || typeof parsed.id !== "string" ||
      typeof parsed.occurred_at !== "string" || Number.isNaN(new Date(parsed.occurred_at).valueOf()) ||
      new Date(parsed.occurred_at).toISOString() !== parsed.occurred_at) throw new InvalidProjectActivityCursorError();
    return { id: parsed.id, occurred_at: parsed.occurred_at };
  } catch (error) {
    if (error instanceof InvalidProjectActivityCursorError) throw error;
    throw new InvalidProjectActivityCursorError();
  }
};
const encode = (cursor: ProjectActivityCursor, project_id: string) =>
  Buffer.from(JSON.stringify({ version: 1, project_id, ...cursor })).toString("base64url");

export const build_project_activity_service = (
  repository: { list_events(input: { organization_id: string; project_id: string; cursor: ProjectActivityCursor | null; limit: number }): Promise<{ events: ProjectActivityEvent[]; has_more: boolean }> },
  access: { authorize(input: { auth: { organization_id: string; actor_org_user_id: string }; project_id: string; capability: "project.activity.read" }): Promise<unknown> },
) => ({
  async list(input: { auth: { organization_id: string; actor_org_user_id: string }; project_id: string; query: { limit?: number; cursor?: string } }) {
    await access.authorize({ auth: input.auth, project_id: input.project_id, capability: "project.activity.read" });
    const limit = input.query.limit ?? 25;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new InvalidProjectActivityCursorError();
    const cursor = input.query.cursor ? decode(input.query.cursor, input.project_id) : null;
    const result = await repository.list_events({ organization_id: input.auth.organization_id,
      project_id: input.project_id, cursor, limit });
    const last = result.events.at(-1);
    return { events: result.events, page: { has_more: result.has_more,
      next_cursor: result.has_more && last ? encode({ id: last.id, occurred_at: last.occurred_at }, input.project_id) : null } };
  },
});
