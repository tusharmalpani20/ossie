import { describe, expect, it, vi } from "vitest";
import { build_documentation_review_repository } from "./documentation-review.repository";

describe("documentation review repository", () => {
  it("blocks candidate preparation when the Project Version is archived", async () => {
    const database = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("project_schema.project_version"))
          return {
            rows: [
              {
                project_version_status: "archived",
                edition_status: "active",
              },
            ],
          };
        if (sql.includes("documentation_review_policy"))
          return {
            rows: [
              {
                id: "policy",
                site_id: "site",
                site_edition_id: "edition",
                mode: "optional",
                required_approvals: 1,
                require_maintainer_approval: false,
                maintainer_org_user_ids: [],
                version: 1,
                updated_at: new Date("2026-07-31T00:00:00.000Z"),
              },
            ],
          };
        return { rows: [] };
      }),
    };
    const repository = build_documentation_review_repository(database as never);

    await expect(
      repository.list_candidates({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        actor_org_user_id: "actor",
        site_id: "site",
      }),
    ).rejects.toMatchObject({ code: "documentation_read_only" });
  });

  it("returns a scope-bound next cursor when candidate results exceed the page", async () => {
    const database = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("project_schema.project_version"))
          return {
            rows: [
              {
                project_version_status: "active",
                edition_status: "active",
              },
            ],
          };
        if (sql.includes("documentation_review_policy"))
          return {
            rows: [
              {
                id: "policy",
                site_id: "site",
                site_edition_id: "edition",
                mode: "optional",
                required_approvals: 1,
                require_maintainer_approval: false,
                maintainer_org_user_ids: [],
                version: 1,
                updated_at: new Date("2026-07-31T00:00:00.000Z"),
              },
            ],
          };
        return {
          rows: [
            {
              org_user_id: "reviewer-a",
              display_name: "Alpha",
              project_role: "viewer",
              is_organization_owner: false,
              sort_value: "alpha",
            },
            {
              org_user_id: "reviewer-b",
              display_name: "Beta",
              project_role: "viewer",
              is_organization_owner: false,
              sort_value: "beta",
            },
          ],
        };
      }),
    };
    const repository = build_documentation_review_repository(database as never);

    const result = await repository.list_candidates({
      organization_id: "org",
      project_id: "project",
      project_version_id: "version",
      actor_org_user_id: "actor",
      site_id: "site",
      limit: 1,
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.next_cursor).toEqual(expect.any(String));
  });

  it("locks the policy before replacing its maintainer set", async () => {
    const queries: string[] = [];
    const client = {
      query: vi.fn(async (sql: string) => {
        queries.push(sql);
        if (sql.includes("project_schema.project_version"))
          return {
            rows: [
              {
                project_version_status: "active",
                edition_status: "active",
              },
            ],
          };
        if (sql.includes("FOR UPDATE"))
          return {
            rows: [
              {
                id: "policy",
                version: 1,
                site_edition_id: "edition",
              },
            ],
          };
        if (sql.includes("RETURNING"))
          return {
            rows: [
              {
                id: "policy",
                version: 2,
                site_id: "site",
                site_edition_id: "edition",
                mode: "optional",
                required_approvals: 1,
                require_maintainer_approval: false,
                updated_at: new Date("2026-07-30T00:00:00Z"),
              },
            ],
          };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const repository = build_documentation_review_repository({
      connect: vi.fn().mockResolvedValue(client),
      query: client.query,
    } as never);
    await repository.update_policy({
      organization_id: "org",
      project_id: "project",
      project_version_id: "version",
      actor_org_user_id: "actor",
      site_id: "site",
      idempotency_key: "key",
      data: {
        expected_policy_version: 1,
        mode: "optional",
        required_approvals: 1,
        require_maintainer_approval: false,
        maintainer_org_user_ids: [],
      },
    });
    expect(queries.some((sql) => sql.includes("FOR UPDATE"))).toBe(true);
    expect(queries.at(0)).toBe("BEGIN");
    expect(queries.at(-1)).toBe("COMMIT");
  });

  it("returns a typed conflict for a stale policy version", async () => {
    const client = {
      query: vi.fn(async (sql: string) =>
        sql.includes("project_schema.project_version")
          ? {
              rows: [
                {
                  project_version_status: "active",
                  edition_status: "active",
                },
              ],
            }
          : {
              rows: sql.includes("FOR UPDATE")
                ? [{ id: "policy", version: 2, site_edition_id: "edition" }]
                : [],
            },
      ),
      release: vi.fn(),
    };
    const repository = build_documentation_review_repository({
      connect: vi.fn().mockResolvedValue(client),
      query: client.query,
    } as never);
    await expect(
      repository.update_policy({
        organization_id: "org",
        project_id: "project",
        project_version_id: "version",
        actor_org_user_id: "actor",
        site_id: "site",
        idempotency_key: "key",
        data: {
          expected_policy_version: 1,
          mode: "optional",
          required_approvals: 1,
          require_maintainer_approval: false,
          maintainer_org_user_ids: [],
        },
      }),
    ).rejects.toMatchObject({ code: "documentation_review_version_conflict" });
  });
});
