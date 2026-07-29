import { describe, expect, it, vi } from "vitest";
import {
  build_public_published_artifact,
  build_publish_repository,
} from "./publish.repository";
import { PublishSlugConflictError } from "./publish.service";

describe("relational publish repository", () => {
  it.each([
    [
      "guide",
      {
        revision: {
          id: "revision_1",
          edition_id: "edition_1",
          revision_number: 2,
          trigger: "publication",
          title: "Guide",
          description: null,
          source_working_draft_version: 4,
          created_by_id: "member_1",
          created_at: "2026-07-20T00:00:00.000Z",
        },
        guide_blocks: [
          {
            id: "block_1",
            block_type: "step",
            title: null,
            body: null,
            block_index: 1,
            step: {
              id: "step_1",
              source_capture_session_id: "capture_1",
              source_capture_event_id: "event_1",
              source_capture_asset_id: "asset_1",
              selected_capture_asset_id: "asset_1",
              display_capture_asset_id: "asset_1",
              screenshot_hidden: false,
              title: "Open settings",
              body: null,
              annotations: [
                {
                  id: "annotation_1",
                  annotation_type: "highlight",
                  annotation_index: 1,
                  x: 0.1,
                  y: 0.2,
                  width: 0.3,
                  height: 0.4,
                },
              ],
            },
          },
        ],
        capture_assets: [
          {
            id: "asset_1",
            capture_session_id: "capture_1",
            status: "active",
            file_url: "/private",
            mime_type: "image/png",
            width: 1280,
            height: 720,
          },
        ],
      },
    ],
    [
      "interactive_demo",
      {
        revision: {
          id: "revision_2",
          edition_id: "edition_2",
          revision_number: 1,
          trigger: "publication",
          title: "Demo",
          description: null,
          source_working_draft_version: 3,
          created_by_id: "member_1",
          created_at: "2026-07-20T00:00:00.000Z",
        },
        demo_scenes: [
          {
            id: "scene_1",
            source_capture_session_id: "capture_1",
            source_capture_event_id: "event_1",
            source_capture_asset_id: "asset_1",
            background_capture_asset_id: "asset_1",
            scene_index: 1,
            title: "Welcome",
            description: null,
            hotspots: [],
          },
        ],
        capture_assets: [],
      },
    ],
  ] as const)(
    "projects %s public content through an explicit allowlist",
    (artifact_type, detail) => {
      const projected = build_public_published_artifact({
        artifact_type,
        publication_sequence: 3,
        detail: detail as never,
        asset_file_url: (asset_id) => `/public/${asset_id}`,
      });
      const serialized = JSON.stringify(projected);

      expect(projected.revision).toEqual({
        revision_number: detail.revision.revision_number,
        title: detail.revision.title,
        description: null,
        created_at: "2026-07-20T00:00:00.000Z",
      });
      expect(serialized).not.toContain("created_by_id");
      expect(serialized).not.toContain("source_capture");
      expect(serialized).not.toContain("working_draft");
      expect(serialized).not.toContain("/private");
    },
  );

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
