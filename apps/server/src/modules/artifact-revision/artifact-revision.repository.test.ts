import { describe, expect, it, vi } from "vitest";
import { build_artifact_revision_repository } from "./artifact-revision.repository";

describe("Artifact Revision repository", () => {
  it("returns newest-first exclusive Guide Revision history with a next cursor", async () => {
    const query = vi.fn(async (sql: string, _values?: unknown[]) => {
      if (sql.includes("FROM guide_schema.guide_edition")) {
        return { rows: [{ id: "edition_1" }] };
      }
      if (sql.includes("FROM guide_schema.guide_revision")) {
        return {
          rows: [3, 2].map((revision_number) => ({
            id: `revision_${revision_number}`,
            edition_id: "edition_1",
            revision_number,
            trigger: "manual_checkpoint",
            title: "Guide",
            description: null,
            source_working_draft_version: revision_number,
            created_by_id: "org_user_1",
            created_at: new Date(`2026-07-1${revision_number}T00:00:00.000Z`),
          })),
        };
      }
      return { rows: [] };
    });
    const repository = build_artifact_revision_repository({ query } as any);
    const result = await repository.list_guide_revisions({
      auth: { organization_id: "org_1", actor_org_user_id: "org_user_1" },
      project_id: "project_1",
      project_version_id: "version_1",
      guide_id: "guide_1",
      limit: 1,
      before_revision_number: 4,
    });
    expect(
      result.revisions.map(({ revision_number }) => revision_number),
    ).toEqual([3]);
    expect(result.next_before_revision_number).toBe(3);
    expect(query.mock.calls.at(-1)?.[1]).toEqual(["edition_1", 4, 2]);
  });

  it("resolves an immutable Guide Revision only inside the exact tenant, Project, Artifact, and Edition", async () => {
    const query = vi.fn(async (sql: string, values?: unknown[]) => {
      if (sql.includes("FROM guide_schema.guide_revision revision")) {
        return {
          rows: [
            {
              id: "revision_2",
              edition_id: "edition_1",
              revision_number: 2,
              trigger: "manual_checkpoint",
              title: "Guide",
              description: null,
              source_working_draft_version: 4,
              created_by_id: "org_user_1",
              created_at: new Date("2026-07-19T00:00:00.000Z"),
            },
          ],
        };
      }
      return { rows: [] };
    });
    const repository = build_artifact_revision_repository({ query } as any);
    const result = await repository.get_guide_revision({
      auth: { organization_id: "org_1", actor_org_user_id: "org_user_1" },
      project_id: "project_1",
      project_version_id: "version_1",
      guide_id: "guide_1",
      revision_number: 2,
    });
    expect(result).toEqual({
      revision: expect.objectContaining({
        id: "revision_2",
        revision_number: 2,
      }),
      guide_blocks: [],
      capture_assets: [],
    });
    expect(query.mock.calls[0]?.[1]).toEqual([
      "org_1",
      "project_1",
      "version_1",
      "guide_1",
      2,
    ]);
  });
});
