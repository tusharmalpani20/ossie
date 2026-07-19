import { describe, expect, it } from "vitest";
import { CaptureArtifactVersionNotReadyError } from "@repo/capture-domain";
import {
  build_interactive_demo_service,
  CaptureSessionNotFoundError,
  EmptyDemoSceneOrderError,
  EmptyInteractiveDemoUpdateError,
  EmptyDemoHotspotOrderError,
  EmptyDemoHotspotUpdateError,
  InteractiveDemoNotFoundError,
  InvalidDemoHotspotCoordinatesError,
  InvalidDemoHotspotOrderError,
  InvalidDemoHotspotTargetError,
  InvalidDemoSceneOrderError,
  InvalidDemoSceneReferenceError,
  DemoHotspotNotFoundError,
  NoUsableCaptureEventsError,
  ProjectNotFoundError,
  type DemoScene,
  type DemoHotspot,
  type InteractiveDemo,
  type InteractiveDemoRepository,
} from "./interactive-demo.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const demo: InteractiveDemo = {
  id: "interactive_demo_1",
  organization_id: "organization_1",
  project_id: "project_1",
  source_capture_session_id: null,
  title: "Product Tour",
  description: "Internal walkthrough",
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const scene = (overrides: Partial<DemoScene> = {}): DemoScene => ({
  id: overrides.id ?? "demo_scene_1",
  organization_id: "organization_1",
  project_id: "project_1",
  interactive_demo_id: "interactive_demo_1",
  source_capture_session_id: overrides.source_capture_session_id ?? null,
  source_capture_event_id: overrides.source_capture_event_id ?? null,
  source_capture_asset_id: overrides.source_capture_asset_id ?? null,
  scene_index: overrides.scene_index ?? 1,
  title: overrides.title ?? "Welcome",
  description: overrides.description ?? null,
  background_capture_asset_id: overrides.background_capture_asset_id ?? "capture_asset_1",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: overrides.version ?? 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
});

const hotspot = (overrides: Partial<DemoHotspot> = {}): DemoHotspot => ({
  id: overrides.id ?? "demo_hotspot_1",
  organization_id: "organization_1",
  project_id: "project_1",
  interactive_demo_id: "interactive_demo_1",
  demo_scene_id: overrides.demo_scene_id ?? "demo_scene_1",
  hotspot_type: overrides.hotspot_type ?? "click",
  label: overrides.label ?? "Continue",
  content: overrides.content ?? null,
  x: overrides.x ?? 0.1,
  y: overrides.y ?? 0.2,
  width: overrides.width ?? 0.3,
  height: overrides.height ?? 0.12,
  target_scene_id: Object.hasOwn(overrides, "target_scene_id") ? overrides.target_scene_id ?? null : "demo_scene_2",
  hotspot_index: overrides.hotspot_index ?? 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: overrides.version ?? 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
});

const source_events = [
  {
    id: "event_1",
    event_type: "click" as const,
    event_index: 1,
    capture_asset_id: "asset_1",
    page_title: "Department List",
    target_text: "Add Department",
    target_label: null,
    note: null,
  },
  {
    id: "event_2",
    event_type: "note" as const,
    event_index: 2,
    capture_asset_id: null,
    page_title: null,
    target_text: null,
    target_label: null,
    note: "No screenshot here",
  },
  {
    id: "event_3",
    event_type: "capture" as const,
    event_index: 3,
    capture_asset_id: "asset_2",
    page_title: "New Department",
    target_text: null,
    target_label: null,
    note: null,
  },
];

const build_repository = (overrides: Partial<InteractiveDemoRepository> = {}) => {
  const calls: Record<
    | "project_exists"
    | "create_demo"
    | "list_demos"
    | "find_demo"
    | "update_demo"
    | "delete_demo"
    | "background_asset_exists"
    | "find_capture_session_for_demo"
    | "capture_session_exists_for_demo"
    | "list_capture_events_for_demo"
    | "list_screenshot_capture_asset_ids"
    | "create_demo_from_capture"
    | "create_scene"
    | "list_scenes"
    | "update_scene"
    | "reorder_scenes"
    | "delete_scene"
    | "find_scene"
    | "create_hotspot"
    | "list_hotspots"
    | "update_hotspot"
    | "reorder_hotspots"
    | "delete_hotspot",
    unknown[]
  > = {
    project_exists: [],
    create_demo: [],
    list_demos: [],
    find_demo: [],
    update_demo: [],
    delete_demo: [],
    background_asset_exists: [],
    find_capture_session_for_demo: [],
    capture_session_exists_for_demo: [],
    list_capture_events_for_demo: [],
    list_screenshot_capture_asset_ids: [],
    create_demo_from_capture: [],
    create_scene: [],
    list_scenes: [],
    update_scene: [],
    reorder_scenes: [],
    delete_scene: [],
    find_scene: [],
    create_hotspot: [],
    list_hotspots: [],
    update_hotspot: [],
    reorder_hotspots: [],
    delete_hotspot: [],
  };

  const repository: InteractiveDemoRepository = {
    async project_exists(input) {
      calls.project_exists.push(input);
      return input.project_id !== "missing_project";
    },
    async create_demo(input) {
      calls.create_demo.push(input);
      return demo;
    },
    async list_demos(input) {
      calls.list_demos.push(input);
      return [demo];
    },
    async find_demo(input) {
      calls.find_demo.push(input);
      return input.interactive_demo_id === "missing_demo" ? null : demo;
    },
    async update_demo(input) {
      calls.update_demo.push(input);
      return input.interactive_demo_id === "missing_demo"
        ? null
        : { ...demo, ...input.data, version: 2 };
    },
    async delete_demo(input) {
      calls.delete_demo.push(input);
      return input.interactive_demo_id !== "missing_demo";
    },
    async background_asset_exists(input) {
      calls.background_asset_exists.push(input);
      return input.capture_asset_id !== "missing_asset";
    },
    async find_capture_session_for_demo(input) {
      calls.find_capture_session_for_demo.push(input);
      return input.capture_session_id === "missing_capture_session"
        ? null
        : {
          id: input.capture_session_id,
          name: "Department setup",
          description: "Create departments in ERP",
        };
    },
    async capture_session_exists_for_demo(input) {
      calls.capture_session_exists_for_demo.push(input);
      return input.capture_session_id !== "missing_capture_session";
    },
    async list_capture_events_for_demo(input) {
      calls.list_capture_events_for_demo.push(input);
      return source_events;
    },
    async list_screenshot_capture_asset_ids(input) {
      calls.list_screenshot_capture_asset_ids.push(input);
      return input.capture_asset_ids.filter((id) => id !== "asset_not_screenshot");
    },
    async create_demo_from_capture(input) {
      calls.create_demo_from_capture.push(input);
      return {
        interactive_demo: {
          ...demo,
          source_capture_session_id: input.capture_session_id,
          title: input.data.title,
          description: input.data.description,
        },
        demo_scenes: input.data.scenes.map((item, index) => scene({
          id: `demo_scene_${index + 1}`,
          scene_index: index + 1,
          source_capture_session_id: input.capture_session_id,
          source_capture_event_id: item.source_capture_event_id,
          source_capture_asset_id: item.source_capture_asset_id,
          background_capture_asset_id: item.background_capture_asset_id,
          title: item.title,
          description: item.description,
        })),
      };
    },
    async create_scene(input) {
      calls.create_scene.push(input);
      return scene({
        title: input.data.title,
        description: input.data.description,
        background_capture_asset_id: input.data.background_capture_asset_id,
      });
    },
    async list_scenes(input) {
      calls.list_scenes.push(input);
      return [scene(), scene({ id: "demo_scene_2", scene_index: 2 })];
    },
    async update_scene(input) {
      calls.update_scene.push(input);
      return input.demo_scene_id === "missing_scene"
        ? null
        : scene({ title: input.data.title, description: input.data.description, version: 2 });
    },
    async reorder_scenes(input) {
      calls.reorder_scenes.push(input);
      return input.scene_ids.map((id, index) => scene({ id, scene_index: index + 1 }));
    },
    async delete_scene(input) {
      calls.delete_scene.push(input);
      return input.demo_scene_id !== "missing_scene";
    },
    async find_scene(input) {
      calls.find_scene.push(input);
      return input.demo_scene_id === "missing_scene" ? null : scene({ id: input.demo_scene_id });
    },
    async create_hotspot(input) {
      calls.create_hotspot.push(input);
      return hotspot({
        demo_scene_id: input.demo_scene_id,
        ...input.data,
      });
    },
    async list_hotspots(input) {
      calls.list_hotspots.push(input);
      return [
        hotspot({ id: "demo_hotspot_1", hotspot_index: 1 }),
        hotspot({ id: "demo_hotspot_2", hotspot_index: 2 }),
      ];
    },
    async update_hotspot(input) {
      calls.update_hotspot.push(input);
      return input.demo_hotspot_id === "missing_hotspot"
        ? null
        : hotspot({ id: input.demo_hotspot_id, ...input.data, version: 2 });
    },
    async reorder_hotspots(input) {
      calls.reorder_hotspots.push(input);
      return input.hotspot_ids.map((id, index) => hotspot({ id, hotspot_index: index + 1 }));
    },
    async delete_hotspot(input) {
      calls.delete_hotspot.push(input);
      return input.demo_hotspot_id !== "missing_hotspot";
    },
    ...overrides,
  };

  return { repository, calls };
};

describe("interactive demo service", () => {
  it("creates an interactive demo from ordered screenshot-backed capture events", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.create_interactive_demo_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {},
    })).resolves.toEqual({
      interactive_demo: expect.objectContaining({
        source_capture_session_id: "capture_session_1",
        title: "Department setup",
        description: "Create departments in ERP",
      }),
      demo_scenes: [
        expect.objectContaining({
          scene_index: 1,
          source_capture_event_id: "event_1",
          source_capture_asset_id: "asset_1",
          background_capture_asset_id: "asset_1",
          title: "Click Add Department",
        }),
        expect.objectContaining({
          scene_index: 2,
          source_capture_event_id: "event_3",
          source_capture_asset_id: "asset_2",
          background_capture_asset_id: "asset_2",
          title: "New Department",
        }),
      ],
      redirect_path: "/projects/project_1/interactive-demos/interactive_demo_1",
    });

    expect(calls.create_demo_from_capture).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Department setup",
        description: "Create departments in ERP",
        scenes: [
          {
            scene_index: 1,
            source_capture_event_id: "event_1",
            source_capture_asset_id: "asset_1",
            background_capture_asset_id: "asset_1",
            title: "Click Add Department",
            description: null,
          },
          {
            scene_index: 2,
            source_capture_event_id: "event_3",
            source_capture_asset_id: "asset_2",
            background_capture_asset_id: "asset_2",
            title: "New Department",
            description: null,
          },
        ],
      },
    }]);
  });

  it("rejects missing capture sessions and capture sessions without usable screenshot events", async () => {
    const { repository } = build_repository({
      async list_capture_events_for_demo() {
        return [{
          ...source_events[1]!,
          capture_asset_id: null,
        }];
      },
    });
    const service = build_interactive_demo_service(repository);

    await expect(service.create_interactive_demo_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "missing_capture_session",
      data: { title: "Missing" },
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    await expect(service.create_interactive_demo_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: { title: "No screenshots" },
    })).rejects.toBeInstanceOf(NoUsableCaptureEventsError);
  });

  it("rejects capture sessions outside the current Default Project Version", async () => {
    const { repository } = build_repository({
      async find_capture_session_for_demo() {
        return null;
      },
      async capture_session_exists_for_demo() {
        return true;
      },
    });
    const service = build_interactive_demo_service(repository);

    await expect(service.create_interactive_demo_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: { title: "Demo" },
    })).rejects.toBeInstanceOf(CaptureArtifactVersionNotReadyError);
  });

  it("creates demos scoped to the current project and actor", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.create_interactive_demo({
      auth,
      project_id: "project_1",
      data: {
        title: " Product Tour ",
        description: "",
        source_capture_session_id: null,
      },
    })).resolves.toEqual(demo);

    expect(calls.create_demo).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Product Tour",
        description: null,
        source_capture_session_id: null,
      },
    }]);
    await expect(service.create_interactive_demo({
      auth,
      project_id: "missing_project",
      data: { title: "Missing" },
    })).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("lists gets updates and archives demos through scoped repository calls", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.list_interactive_demos({ auth, project_id: "project_1" })).resolves.toEqual([demo]);
    await expect(service.list_interactive_demos({ auth, project_id: "missing_project" })).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(service.get_interactive_demo({ auth, project_id: "project_1", interactive_demo_id: "interactive_demo_1" })).resolves.toEqual(demo);
    await expect(service.update_interactive_demo({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      data: {
        title: " Updated ",
        description: "",
        status: "archived",
      },
    })).resolves.toMatchObject({ title: "Updated", description: null, status: "archived", version: 2 });
    await expect(service.delete_interactive_demo({ auth, project_id: "project_1", interactive_demo_id: "missing_demo" }))
      .rejects.toBeInstanceOf(InteractiveDemoNotFoundError);
    await expect(service.update_interactive_demo({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      data: {},
    })).rejects.toBeInstanceOf(EmptyInteractiveDemoUpdateError);

    expect(calls.list_demos).toEqual([{ organization_id: "organization_1", project_id: "project_1" }]);
    expect(calls.update_demo).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      actor_org_user_id: "org_user_1",
      data: { title: "Updated", description: null, status: "archived" },
    }]);
  });

  it("creates and updates scenes only when referenced background assets belong to the project", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.create_demo_scene({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      data: {
        title: " Welcome ",
        description: "",
        background_capture_asset_id: "capture_asset_1",
      },
    })).resolves.toMatchObject({
      title: "Welcome",
      description: null,
      background_capture_asset_id: "capture_asset_1",
    });
    await expect(service.update_demo_scene({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      data: {
        background_capture_asset_id: "missing_asset",
      },
    })).rejects.toBeInstanceOf(InvalidDemoSceneReferenceError);

    expect(calls.background_asset_exists).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_asset_id: "capture_asset_1",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_asset_id: "missing_asset",
      },
    ]);
  });

  it("reorders scenes with a non-empty contiguous order", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.reorder_demo_scenes({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      scene_ids: ["demo_scene_2", "demo_scene_1"],
    })).resolves.toEqual([
      expect.objectContaining({ id: "demo_scene_2", scene_index: 1 }),
      expect.objectContaining({ id: "demo_scene_1", scene_index: 2 }),
    ]);
    await expect(service.reorder_demo_scenes({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      scene_ids: [],
    })).rejects.toBeInstanceOf(EmptyDemoSceneOrderError);
    await expect(service.reorder_demo_scenes({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      scene_ids: ["demo_scene_1", "demo_scene_1"],
    })).rejects.toBeInstanceOf(InvalidDemoSceneOrderError);

    expect(calls.reorder_scenes).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      actor_org_user_id: "org_user_1",
      scene_ids: ["demo_scene_2", "demo_scene_1"],
    }]);
  });

  it("creates lists updates reorders and deletes scene hotspots", async () => {
    const { repository, calls } = build_repository();
    const service = build_interactive_demo_service(repository);

    await expect(service.create_demo_hotspot({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      data: {
        hotspot_type: " click ",
        label: " Continue ",
        content: "",
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.12,
        target_scene_id: "demo_scene_2",
      },
    })).resolves.toMatchObject({
      hotspot_type: "click",
      label: "Continue",
      content: null,
      target_scene_id: "demo_scene_2",
    });
    await expect(service.list_demo_hotspots({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
    })).resolves.toHaveLength(2);
    await expect(service.update_demo_hotspot({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      demo_hotspot_id: "demo_hotspot_1",
      data: {
        label: "Next screen",
        target_scene_id: null,
      },
    })).resolves.toMatchObject({
      id: "demo_hotspot_1",
      label: "Next screen",
      target_scene_id: null,
      version: 2,
    });
    await expect(service.reorder_demo_hotspots({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      hotspot_ids: ["demo_hotspot_2", "demo_hotspot_1"],
    })).resolves.toEqual([
      expect.objectContaining({ id: "demo_hotspot_2", hotspot_index: 1 }),
      expect.objectContaining({ id: "demo_hotspot_1", hotspot_index: 2 }),
    ]);
    await expect(service.delete_demo_hotspot({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      demo_hotspot_id: "missing_hotspot",
    })).rejects.toBeInstanceOf(DemoHotspotNotFoundError);

    expect(calls.create_hotspot).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      actor_org_user_id: "org_user_1",
      data: {
        hotspot_type: "click",
        label: "Continue",
        content: null,
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.12,
        target_scene_id: "demo_scene_2",
      },
    }]);
    expect(calls.reorder_hotspots).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      actor_org_user_id: "org_user_1",
      hotspot_ids: ["demo_hotspot_2", "demo_hotspot_1"],
    }]);
  });

  it("validates hotspot coordinates targets updates and order", async () => {
    const { repository } = build_repository({
      async find_scene(input) {
        return input.demo_scene_id === "scene_from_other_demo" ? null : scene({ id: input.demo_scene_id });
      },
      async reorder_hotspots() {
        return [];
      },
    });
    const service = build_interactive_demo_service(repository);

    await expect(service.create_demo_hotspot({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      data: {
        hotspot_type: "info",
        x: -0.1,
        y: 0.2,
        width: 0.3,
        height: 0.1,
      },
    })).rejects.toBeInstanceOf(InvalidDemoHotspotCoordinatesError);
    await expect(service.create_demo_hotspot({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      data: {
        hotspot_type: "click",
        x: 0.1,
        y: 0.2,
        width: 0.3,
        height: 0.1,
        target_scene_id: "scene_from_other_demo",
      },
    })).rejects.toBeInstanceOf(InvalidDemoHotspotTargetError);
    await expect(service.update_demo_hotspot({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      demo_hotspot_id: "demo_hotspot_1",
      data: {},
    })).rejects.toBeInstanceOf(EmptyDemoHotspotUpdateError);
    await expect(service.reorder_demo_hotspots({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      hotspot_ids: [],
    })).rejects.toBeInstanceOf(EmptyDemoHotspotOrderError);
    await expect(service.reorder_demo_hotspots({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      hotspot_ids: ["demo_hotspot_1", "demo_hotspot_1"],
    })).rejects.toBeInstanceOf(InvalidDemoHotspotOrderError);
    await expect(service.reorder_demo_hotspots({
      auth,
      project_id: "project_1",
      interactive_demo_id: "interactive_demo_1",
      demo_scene_id: "demo_scene_1",
      hotspot_ids: ["missing_hotspot"],
    })).rejects.toBeInstanceOf(InvalidDemoHotspotOrderError);
  });
});
