import { describe, expect, it, vi } from "vitest";
import {
  InteractiveDemoEditionConflictError,
  InteractiveDemoNotEditableError,
  build_interactive_demo_service,
  type InteractiveDemoRepository,
} from "./interactive-demo.service";

const detail = {
  artifact: { id: "demo_1" },
  edition: {
    id: "edition_1",
    title: "Demo",
    description: null,
    status: "draft",
    version: 3,
  },
  working_draft: { id: "draft_1", version: 7 },
  authored_updated_at: "2026-01-01T00:00:00.000Z",
};

describe("interactive demo Edition scoping", () => {
  it("passes explicit Project Version scope to list reads", async () => {
    const list_demos = vi.fn(async () => []);
    const repository = {
      project_exists: vi.fn(async () => true),
      list_demos,
    } as unknown as InteractiveDemoRepository;
    await build_interactive_demo_service(repository).list_interactive_demos({
      auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
      project_id: "project_1",
      project_version_id: "version_2",
    });
    expect(list_demos).toHaveBeenCalledWith({
      organization_id: "org_1",
      project_id: "project_1",
      project_version_id: "version_2",
    });
  });

  it("does not require the Capture Version to be Project Default", async () => {
    const repository = {
      project_exists: vi.fn(async () => true),
      find_capture_session_for_demo: vi.fn(async () => ({
        id: "session_1",
        name: "Capture",
        description: null,
      })),
      list_capture_events_for_demo: vi.fn(async () => [
        {
          id: "event_1",
          event_type: "click",
          event_index: 1,
          capture_asset_id: "asset_1",
          page_title: "Page",
          target_label: "Open",
          target_text: null,
          note: null,
        },
      ]),
      list_screenshot_capture_asset_ids: vi.fn(async () => ["asset_1"]),
      create_demo_from_capture: vi.fn(async () => ({
        artifact: {
          id: "demo_1",
          organization_id: "org_1",
          project_id: "project_1",
          created_by_id: "member_1",
          created_at: "2026-01-01T00:00:00.000Z",
        },
        edition: { project_version_id: "version_2" },
        working_draft: {},
        demo_scenes: [],
      })),
    } as unknown as InteractiveDemoRepository;
    const result = await build_interactive_demo_service(
      repository,
    ).create_interactive_demo_from_capture({
      auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
      project_id: "project_1",
      capture_session_id: "session_1",
      data: {},
    });
    expect(result.edition.project_version_id).toBe("version_2");
  });

  it("rejects metadata writes to an archived Edition before persistence", async () => {
    const update_demo = vi.fn();
    const repository = {
      find_demo: vi.fn(async () => ({
        ...detail,
        edition: { ...detail.edition, status: "archived" },
      })),
      update_demo,
    } as unknown as InteractiveDemoRepository;

    await expect(
      build_interactive_demo_service(repository).update_interactive_demo({
        auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
        project_id: "project_1",
        interactive_demo_id: "demo_1",
        project_version_id: "version_2",
        data: { title: "Changed", expected_edition_version: 3 },
      }),
    ).rejects.toBeInstanceOf(InteractiveDemoNotEditableError);
    expect(update_demo).not.toHaveBeenCalled();
  });

  it("returns an unchanged Edition without writing or advancing its Row Version", async () => {
    const update_demo = vi.fn();
    const repository = {
      find_demo: vi.fn(async () => detail),
      update_demo,
    } as unknown as InteractiveDemoRepository;

    await expect(
      build_interactive_demo_service(repository).update_interactive_demo({
        auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
        project_id: "project_1",
        interactive_demo_id: "demo_1",
        project_version_id: "version_2",
        data: { title: "Demo", expected_edition_version: 3 },
      }),
    ).resolves.toBe(detail.edition);
    expect(update_demo).not.toHaveBeenCalled();
  });

  it("checks Edition concurrency before accepting an unchanged request", async () => {
    const repository = {
      find_demo: vi.fn(async () => detail),
      update_demo: vi.fn(),
    } as unknown as InteractiveDemoRepository;

    await expect(
      build_interactive_demo_service(repository).update_interactive_demo({
        auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
        project_id: "project_1",
        interactive_demo_id: "demo_1",
        project_version_id: "version_2",
        data: { title: "Demo", expected_edition_version: 2 },
      }),
    ).rejects.toBeInstanceOf(InteractiveDemoEditionConflictError);
  });

  it("does not write semantically unchanged Scene content", async () => {
    const scene = {
      id: "scene_1",
      title: "Start",
      description: null,
      background_capture_asset_id: null,
    };
    const update_scene = vi.fn();
    const repository = {
      find_demo: vi.fn(async () => detail),
      find_scene: vi.fn(async () => scene),
      update_scene,
    } as unknown as InteractiveDemoRepository;

    await expect(
      build_interactive_demo_service(repository).update_demo_scene({
        auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
        project_id: "project_1",
        interactive_demo_id: "demo_1",
        project_version_id: "version_2",
        demo_scene_id: "scene_1",
        data: { title: "Start", expected_working_draft_version: 7 },
      }),
    ).resolves.toEqual({
      demo_scene: scene,
      working_draft: detail.working_draft,
    });
    expect(update_scene).not.toHaveBeenCalled();
  });

  it("does not rewrite an unchanged Hotspot or Transition", async () => {
    const hotspot = {
      id: "hotspot_1",
      hotspot_type: "click",
      label: "Continue",
      content: null,
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
      transition: { id: "transition_1", target_scene_id: "scene_2" },
    };
    const update_hotspot = vi.fn();
    const repository = {
      find_demo: vi.fn(async () => detail),
      find_scene: vi.fn(async () => ({ id: "scene_1" })),
      list_hotspots: vi.fn(async () => ({
        demo_hotspots: [hotspot],
        working_draft: detail.working_draft,
      })),
      update_hotspot,
    } as unknown as InteractiveDemoRepository;

    await expect(
      build_interactive_demo_service(repository).update_demo_hotspot({
        auth: { organization_id: "org_1", actor_org_user_id: "member_1" },
        project_id: "project_1",
        interactive_demo_id: "demo_1",
        project_version_id: "version_2",
        demo_scene_id: "scene_1",
        demo_hotspot_id: "hotspot_1",
        data: {
          label: "Continue",
          transition: { target_scene_id: "scene_2" },
          expected_working_draft_version: 7,
        },
      }),
    ).resolves.toEqual({
      demo_hotspot: hotspot,
      working_draft: detail.working_draft,
    });
    expect(update_hotspot).not.toHaveBeenCalled();
  });
});
