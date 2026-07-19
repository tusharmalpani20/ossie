import { describe, expect, it, vi } from "vitest";
import { build_publish_service, type PublishRepository } from "./publish.service";

describe("publish compatibility Project Version scope", () => {
  it("resolves the scoped Guide Edition before returning artifact-wide status", async () => {
    const find_guide_detail = vi.fn(async () => ({ artifact: { id: "guide_1" }, edition: { project_version_id: "version_1" }, working_draft: { version: 1 }, guide_blocks: [], source_capture_assets: [] }));
    const find_publish_status = vi.fn(async () => null);
    const repository = { project_exists: vi.fn(async () => true), find_guide_detail, find_publish_status } as unknown as PublishRepository;
    const result = await build_publish_service(repository).get_guide_publish_status({ auth: { organization_id: "org_1", actor_org_user_id: "member_1" }, project_id: "project_1", guide_id: "guide_1", project_version_id: "version_1" });
    expect(result).toEqual({ publish_link: null, published_artifact: null });
    expect(find_guide_detail).toHaveBeenCalledWith(expect.objectContaining({ project_version_id: "version_1" }));
  });
});
