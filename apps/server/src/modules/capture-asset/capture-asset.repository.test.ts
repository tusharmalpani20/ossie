import { describe, expect, it, vi } from "vitest";
import { build_capture_asset_transactional_repository } from "./capture-asset.repository";

const input = {
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: "capture_asset_1",
  actor_org_user_id: "org_user_1",
  expected_asset_version: 2,
};

describe("Capture Asset purge repository", () => {
  it("replays a completed purge before filtering the Asset tombstone", async () => {
    const query = vi.fn().mockResolvedValueOnce({
      rows: [{ id: "operation_1", status: "completed", attempt_count: 2 }],
    });
    const repository = build_capture_asset_transactional_repository({ query });

    await expect(repository.begin_capture_asset_purge(input)).resolves.toEqual({
      operation: {
        capture_asset_id: "capture_asset_1",
        purge_operation_id: "operation_1",
        status: "completed",
        attempt_count: 2,
      },
      storage_key: "",
      completed: true,
    });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[0]).toContain("operation.status='completed'");
  });

  it("serializes completion on the Asset and operation and treats completion as replay", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ file_id: "file_1" }] })
      .mockResolvedValueOnce({
        rows: [{ id: "operation_1", status: "completed", attempt_count: 2 }],
      });
    const repository = build_capture_asset_transactional_repository({ query });

    await expect(
      repository.complete_capture_asset_purge({
        organization_id: input.organization_id,
        project_id: input.project_id,
        capture_asset_id: input.capture_asset_id,
        operation_id: "operation_1",
        actor_org_user_id: input.actor_org_user_id,
      }),
    ).resolves.toEqual({
      capture_asset_id: "capture_asset_1",
      purge_operation_id: "operation_1",
      status: "completed",
      attempt_count: 2,
    });
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0]?.[0]).toContain(
      "FOR UPDATE OF asset,file_record",
    );
    expect(query.mock.calls[1]?.[0]).toContain("FOR UPDATE");
  });
});
