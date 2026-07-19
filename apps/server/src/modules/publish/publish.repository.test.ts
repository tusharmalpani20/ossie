import { describe, expect, it, vi } from "vitest";
import { build_publish_repository } from "./publish.repository";
import { PublishSlugConflictError } from "./publish.service";

describe("relational publish repository", () => {
  it("commits an atomic publication workflow", async () => {
    const query = vi.fn(async (sql: string) => ({
      rows: sql === "BEGIN" || sql === "COMMIT" ? [] : [],
    }));
    const client = { query, release: vi.fn() };
    const repository = build_publish_repository({
      query,
      connect: vi.fn(async () => client),
    });
    await repository.transaction(async () => "done");
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(["BEGIN", "COMMIT"]);
    expect(client.release).toHaveBeenCalledOnce();
  });
  it("rolls back an atomic workflow on failure", async () => {
    const query = vi.fn(async (sql: string) => {
      void sql;
      return { rows: [] };
    });
    const client = { query, release: vi.fn() };
    const repository = build_publish_repository({
      query,
      connect: vi.fn(async () => client),
    });
    await expect(
      repository.transaction(async () => {
        throw new Error("nope");
      }),
    ).rejects.toThrow("nope");
    expect(query.mock.calls.at(-1)?.[0]).toBe("ROLLBACK");
  });
  it("uses a non-aborting insert so random slug collisions can be retried", async () => {
    const query = vi.fn(async (sql: string) => ({
      rows: sql.includes("INSERT INTO publish_schema.publish_link") ? [] : [],
    }));
    const repository = build_publish_repository({
      query,
      connect: vi.fn() as never,
    });
    await expect(
      repository.create_publish_link({
        auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
        project_id: "project_1",
        project_version_id: "pv_1",
        artifact_type: "guide",
        artifact_id: "guide_1",
        name: "Public",
        visibility: "public",
        expires_at: null,
        password: null,
        password_hash: null,
        password_salt: null,
        published_artifact_ids: ["publication_1"],
        default_published_artifact_id: "publication_1",
      }),
    ).rejects.toBeInstanceOf(PublishSlugConflictError);
    expect(
      query.mock.calls.filter(([sql]) =>
        String(sql).includes("INSERT INTO publish_schema.publish_link"),
      ),
    ).toHaveLength(5);
    expect(query.mock.calls[0]?.[0]).toContain("ON CONFLICT (slug) DO NOTHING");
  });
});
