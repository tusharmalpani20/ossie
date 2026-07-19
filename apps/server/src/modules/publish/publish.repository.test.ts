import { describe, expect, it, vi } from "vitest";
import {
  build_publish_transactional_repository,
  extract_published_capture_asset_ids,
} from "./publish.repository";

const scope = {
  organization_id: "organization_1",
  project_id: "project_1",
  artifact_type: "guide" as const,
  artifact_id: "guide_1",
  actor_org_user_id: "org_user_1",
};

describe("Publish repository compound mutations", () => {
  it("extracts a stable unique typed Capture Asset projection from a snapshot", () => {
    expect(
      extract_published_capture_asset_ids({
        blocks: [
          {
            type: "step",
            source_asset: { id: "asset_2" },
          },
        ],
        scenes: [{ background_asset: { id: "asset_1" } }],
        guide: { id: "not_a_capture_asset" },
      }),
    ).toEqual(["asset_1", "asset_2"]);
  });
  it("does not revoke Viewer Sessions for an access-only policy update", async () => {
    const query = vi.fn(async (sql: string, values?: unknown[]) => {
      void sql;
      void values;
      return { rows: [] };
    });
    const repository = build_publish_transactional_repository({
      query,
    } as never);

    await repository.update_publish_link_access({
      ...scope,
      visibility: "restricted",
      expires_at: null,
    });

    expect(query.mock.calls[0]?.[0]).not.toContain(
      "UPDATE publish_schema.public_publish_viewer_session",
    );
  });

  it.each([
    [
      "link revocation",
      async (
        repository: ReturnType<typeof build_publish_transactional_repository>,
      ) => repository.revoke_active_publish_link(scope),
    ],
    [
      "password change",
      async (
        repository: ReturnType<typeof build_publish_transactional_repository>,
      ) =>
        repository.update_publish_link_password({
          ...scope,
          password_hash: "hash",
          password_salt: "salt",
        }),
    ],
  ])(
    "revokes Viewer Sessions in the same SQL command as %s",
    async (_name, mutate) => {
      const query = vi.fn(async (sql: string, values?: unknown[]) => {
        void sql;
        void values;
        return { rows: [] };
      });
      const repository = build_publish_transactional_repository({
        query,
      } as never);

      await mutate(repository);

      expect(query).toHaveBeenCalledOnce();
      expect(query.mock.calls[0]?.[0]).toContain(
        "UPDATE publish_schema.public_publish_viewer_session",
      );
    },
  );
});
