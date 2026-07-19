import { describe, expect, it, vi } from "vitest";
import { build_guide_service, type GuideDetail, type GuideRepository } from "./guide.service";

const detail: GuideDetail = {
  artifact: { id: "guide_1", organization_id: "org_1", project_id: "project_1", created_by_id: "member_1", created_at: "2026-01-01T00:00:00.000Z" },
  edition: { id: "edition_1", organization_id: "org_1", project_id: "project_1", guide_id: "guide_1", project_version_id: "version_2", source_capture_session_id: "session_1", title: "Guide", description: null, status: "draft", created_by_id: "member_1", updated_by_id: "member_1", version: 1, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
  working_draft: { id: "draft_1", organization_id: "org_1", project_id: "project_1", guide_edition_id: "edition_1", created_by_id: "member_1", updated_by_id: "member_1", version: 1, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
  authored_updated_at: "2026-01-01T00:00:00.000Z", guide_blocks: [], source_capture_assets: [],
};
const auth = { organization_id: "org_1", actor_org_user_id: "member_1" };

describe("guide service Edition scoping", () => {
  it("generates from the Capture Version without a Project Default readiness check", async () => {
    const repository = {
      project_exists: vi.fn(async () => true), capture_session_exists: vi.fn(async () => true),
      list_source_capture_events: vi.fn(async () => []), list_active_capture_asset_ids: vi.fn(async () => []),
      create_guide_from_capture: vi.fn(async () => detail),
    } as unknown as GuideRepository;
    const result = await build_guide_service(repository).create_guide_from_capture({ auth, project_id: "project_1", capture_session_id: "session_1", data: { title: " Guide " } });
    expect(result.edition.project_version_id).toBe("version_2");
    expect(repository.create_guide_from_capture).toHaveBeenCalledOnce();
  });

  it("passes explicit Project Version scope to list reads", async () => {
    const list_guides = vi.fn(async () => [{ artifact: detail.artifact, edition: detail.edition, authored_updated_at: detail.authored_updated_at }]);
    const repository = { project_exists: vi.fn(async () => true), list_guides } as unknown as GuideRepository;
    await build_guide_service(repository).list_guides({ auth, project_id: "project_1", project_version_id: "version_2" });
    expect(list_guides).toHaveBeenCalledWith({ organization_id: "org_1", project_id: "project_1", project_version_id: "version_2" });
  });
});
