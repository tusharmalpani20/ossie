import { describe, expect, it, vi } from "vitest";
import { build_project_version_repository } from "./project-version.repository";

const row = {
  id: "version_1", organization_id: "org_1", project_id: "project_1",
  name: "Main", description: null, slug: "main", release_date: null,
  position: 1, status: "active" as const, is_default: true, version: 1,
  created_by_id: "actor_1", updated_by_id: "actor_1",
  created_at: new Date("2026-07-19T00:00:00.000Z"),
  updated_at: new Date("2026-07-19T00:00:00.000Z"), aliases: [],
};

describe("Project Version repository", () => {
  it("scopes detail lookups by Organization, Project, and immutable Version id", async () => {
    const query = vi.fn(async () => ({ rows: [row] }));
    const found = await build_project_version_repository({ query: query as never }).find_version({
      organization_id: "org_1", project_id: "project_1", project_version_id: "version_1",
    });
    expect(query).toHaveBeenCalledWith(expect.stringContaining("version.organization_id = $1 AND version.project_id = $2 AND version.id = $3"),
      ["org_1", "project_1", "version_1"]);
    expect(found?.created_at).toBe("2026-07-19T00:00:00.000Z");
  });

  it("resolves aliases case-insensitively while returning the canonical Version", async () => {
    const query = vi.fn(async () => ({ rows: [{ ...row, resolution: "alias" as const }] }));
    const resolved = await build_project_version_repository({ query: query as never }).resolve_version({
      organization_id: "org_1", project_id: "project_1", slug: "OLD-MAIN",
    });
    expect((query.mock.calls as unknown[][])[0]?.[0]).toContain("lower(matched_alias.slug) = lower($3)");
    expect(resolved).toEqual(expect.objectContaining({ resolution: "alias", project_version: expect.objectContaining({ slug: "main" }) }));
  });
});
