import { describe, expect, it, vi } from "vitest";
import { build_interactive_demo_service, type InteractiveDemoRepository } from "./interactive-demo.service";

describe("interactive demo Edition scoping", () => {
  it("passes explicit Project Version scope to list reads", async () => {
    const list_demos = vi.fn(async () => []);
    const repository = { project_exists: vi.fn(async () => true), list_demos } as unknown as InteractiveDemoRepository;
    await build_interactive_demo_service(repository).list_interactive_demos({ auth: { organization_id: "org_1", actor_org_user_id: "member_1" }, project_id: "project_1", project_version_id: "version_2" });
    expect(list_demos).toHaveBeenCalledWith({ organization_id: "org_1", project_id: "project_1", project_version_id: "version_2" });
  });

  it("does not require the Capture Version to be Project Default", async () => {
    const repository = {
      project_exists: vi.fn(async () => true),
      find_capture_session_for_demo: vi.fn(async () => ({ id: "session_1", name: "Capture", description: null })),
      list_capture_events_for_demo: vi.fn(async () => [{ id: "event_1", event_type: "click", event_index: 1, capture_asset_id: "asset_1", page_title: "Page", target_label: "Open", target_text: null, note: null }]), list_screenshot_capture_asset_ids: vi.fn(async () => ["asset_1"]),
      create_demo_from_capture: vi.fn(async () => ({ artifact: { id: "demo_1", organization_id: "org_1", project_id: "project_1", created_by_id: "member_1", created_at: "2026-01-01T00:00:00.000Z" }, edition: { project_version_id: "version_2" }, working_draft: {}, demo_scenes: [] })),
    } as unknown as InteractiveDemoRepository;
    const result = await build_interactive_demo_service(repository).create_interactive_demo_from_capture({ auth: { organization_id: "org_1", actor_org_user_id: "member_1" }, project_id: "project_1", capture_session_id: "session_1", data: {} });
    expect(result.edition.project_version_id).toBe("version_2");
  });
});
