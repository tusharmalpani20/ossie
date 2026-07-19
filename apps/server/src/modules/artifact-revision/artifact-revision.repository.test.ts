import { describe, expect, it, vi } from "vitest";
import {
  build_artifact_revision_repository,
  create_or_reuse_guide_revision_for_publication,
} from "./artifact-revision.repository";

describe("Artifact Revision repository", () => {
  it("creates a publication-triggered Revision from exact current Row Versions", async () => {
    const now = new Date("2026-07-20T00:00:00.000Z");
    const query = vi.fn(async (sql: string, _values?: unknown[]) => {
      if (sql.includes("FOR UPDATE OF edition,draft"))
        return {
          rows: [
            {
              edition_id: "edition_1",
              edition_version: 4,
              edition_status: "draft",
              working_draft_id: "draft_1",
              working_draft_version: 7,
              project_status: "active",
              project_version_status: "active",
              title: "Guide",
              description: null,
            },
          ],
        };
      if (sql.includes("FROM guide_schema.guide g JOIN"))
        return {
          rows: [
            {
              id: "guide_1",
              organization_id: "org_1",
              project_id: "project_1",
              artifact_created_by_id: "member_1",
              artifact_created_at: now,
              edition_id: "edition_1",
              guide_id: "guide_1",
              project_version_id: "version_1",
              source_capture_session_id: null,
              title: "Guide",
              description: null,
              status: "draft",
              edition_created_by_id: "member_1",
              edition_updated_by_id: "member_1",
              edition_version: 4,
              edition_created_at: now,
              edition_updated_at: now,
              draft_id: "draft_1",
              draft_created_by_id: "member_1",
              draft_updated_by_id: "member_1",
              draft_version: 7,
              draft_created_at: now,
              draft_updated_at: now,
            },
          ],
        };
      if (
        sql.includes("FROM guide_schema.guide_revision") &&
        sql.includes("content_sha256")
      )
        return { rows: [] };
      if (sql.includes("FROM guide_schema.guide_block"))
        return {
          rows: [
            {
              id: "block_1",
              organization_id: "org_1",
              project_id: "project_1",
              guide_working_draft_id: "draft_1",
              block_type: "paragraph",
              title: null,
              body: "Publishable",
              block_index: 1,
              created_by_id: "member_1",
              updated_by_id: "member_1",
              version: 1,
              created_at: now,
              updated_at: now,
            },
          ],
        };
      if (sql.includes("INSERT INTO guide_schema.guide_revision"))
        return {
          rows: [
            {
              id: "revision_1",
              edition_id: "edition_1",
              revision_number: 1,
              trigger: "publication",
              title: "Guide",
              description: null,
              source_working_draft_version: 7,
              created_by_id: "member_1",
              created_at: now,
            },
          ],
        };
      return { rows: [] };
    });

    const result = await create_or_reuse_guide_revision_for_publication(
      { query } as any,
      {
        auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
        project_id: "project_1",
        project_version_id: "version_1",
        guide_id: "guide_1",
        expected_edition_version: 4,
        expected_working_draft_version: 7,
      },
    );

    expect(result.revision).toMatchObject({
      trigger: "publication",
      revision_number: 1,
    });
    expect(
      query.mock.calls.find(([sql]) =>
        sql.includes("INSERT INTO guide_schema.guide_revision"),
      )?.[1],
    ).toContain("publication");
  });

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
