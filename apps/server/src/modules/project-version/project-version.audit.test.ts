import { describe, expect, it } from "vitest";
import { build_project_version_event } from "./project-version.audit";

const version = (overrides: Record<string, unknown> = {}) => ({
  id: "version_1", organization_id: "org_1", project_id: "project_1", name: "Main",
  description: null, slug: "main", release_date: null, position: 1, status: "active" as const,
  is_default: true, version: 1, created_by_id: "actor_1", updated_by_id: "actor_1",
  created_at: "2026-07-19T00:00:00.000Z", updated_at: "2026-07-19T00:00:00.000Z", aliases: [], ...overrides,
});
const common = { event_id: "01K00000000000000000000000", actor_org_user_id: "actor_1",
  actor_label: "Test Actor", request_id: "request_1", occurred_at: "2026-07-19T00:00:00.000Z" };

describe("Project Version audit event", () => {
  it("records the typed Version row and fields for creation", () => {
    const event = build_project_version_event({ ...common, command: "project_version.create", before: null, after: version() });
    expect(event.action).toBe("project_version.created");
    expect(event.root_resource_type).toBe("project_version");
    expect(event.items.some((item) => item.entity_type === "project_version" && item.operation === "create")).toBe(true);
    expect(event.items.find((item) => item.field_name === "slug")?.after).toEqual({ state: "value", value: "main" });
  });

  it("records the permanent alias alongside a canonical slug change", () => {
    const event = build_project_version_event({ ...common, command: "project_version.update",
      before: version(), after: version({ slug: "current", version: 2,
        aliases: [{ id: "alias_1", project_version_id: "version_1", slug: "main",
          created_by_id: "actor_1", created_at: "2026-07-19T00:00:01.000Z" }] }) });
    expect(event.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ entity_type: "project_version_alias", operation: "create" }),
      expect.objectContaining({ entity_type: "project_version_alias", field_name: "slug", after: { state: "value", value: "main" } }),
    ]));
  });
});
