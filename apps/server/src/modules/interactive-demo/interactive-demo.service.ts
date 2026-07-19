import type {
  CaptureEventType,
  DemoHotspotType,
  InteractiveDemoStatus,
} from "@repo/constants";
import { CaptureArtifactVersionNotReadyError } from "@repo/capture-domain";
import {
  CaptureSessionNotFoundError,
  DemoHotspotNotFoundError,
  DemoSceneNotFoundError,
  EmptyDemoHotspotOrderError,
  EmptyDemoHotspotUpdateError,
  EmptyDemoSceneOrderError,
  EmptyDemoSceneUpdateError,
  EmptyInteractiveDemoUpdateError,
  InteractiveDemoNotFoundError,
  InvalidDemoHotspotCoordinatesError,
  InvalidDemoHotspotOrderError,
  InvalidDemoHotspotTargetError,
  InvalidDemoSceneOrderError,
  InvalidDemoSceneReferenceError,
  NoUsableCaptureEventsError,
  ProjectNotFoundError,
  assert_background_asset_exists,
  assert_demo_hotspot_order_result,
  assert_demo_scene_order_result,
  assert_hotspot_target_scene_exists,
  assert_valid_hotspot_box,
  build_demo_from_capture_source,
  demo_redirect_path,
  normalize_create_demo_from_capture_source,
  normalize_create_demo_input,
  normalize_create_hotspot_input,
  normalize_create_scene_input,
  normalize_demo_hotspot_ids,
  normalize_demo_scene_ids,
  normalize_update_demo_input,
  normalize_update_hotspot_input,
  normalize_update_scene_input,
  type InteractiveDemoSourceCaptureSession,
  type InteractiveDemoSourceEvent,
  type InteractiveDemoSourceEventType,
  type NormalizedCreateDemoHotspotInput,
  type NormalizedCreateDemoSceneInput,
  type NormalizedCreateInteractiveDemoFromCaptureInput,
  type NormalizedCreateInteractiveDemoInput,
  type NormalizedUpdateDemoHotspotInput,
  type NormalizedUpdateDemoSceneInput,
  type NormalizedUpdateInteractiveDemoInput,
} from "@repo/demo-domain";
import type {
  CreateDemoHotspotInput,
  CreateDemoSceneInput,
  CreateInteractiveDemoFromCaptureInput,
  CreateInteractiveDemoInput,
  DemoHotspot,
  DemoScene,
  InteractiveDemo,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
} from "@repo/types/demo";

export type {
  CreateDemoHotspotInput,
  CreateDemoSceneInput,
  CreateInteractiveDemoFromCaptureInput,
  CreateInteractiveDemoInput,
  DemoHotspot,
  DemoHotspotType,
  DemoScene,
  InteractiveDemo,
  InteractiveDemoSourceCaptureSession,
  InteractiveDemoSourceEvent,
  InteractiveDemoSourceEventType,
  InteractiveDemoStatus,
  NormalizedCreateDemoHotspotInput,
  NormalizedCreateDemoSceneInput,
  NormalizedCreateInteractiveDemoFromCaptureInput,
  NormalizedCreateInteractiveDemoInput,
  NormalizedUpdateDemoHotspotInput,
  NormalizedUpdateDemoSceneInput,
  NormalizedUpdateInteractiveDemoInput,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
};

export {
  CaptureSessionNotFoundError,
  DemoHotspotNotFoundError,
  DemoSceneNotFoundError,
  EmptyDemoHotspotOrderError,
  EmptyDemoHotspotUpdateError,
  EmptyDemoSceneOrderError,
  EmptyDemoSceneUpdateError,
  EmptyInteractiveDemoUpdateError,
  InteractiveDemoNotFoundError,
  InvalidDemoHotspotCoordinatesError,
  InvalidDemoHotspotOrderError,
  InvalidDemoHotspotTargetError,
  InvalidDemoSceneOrderError,
  InvalidDemoSceneReferenceError,
  NoUsableCaptureEventsError,
  ProjectNotFoundError,
};

export type InteractiveDemoAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type { CaptureEventType };

export type InteractiveDemoRepository = {
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  create_demo: (input: {
    organization_id: string;
    project_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateInteractiveDemoInput;
  }) => Promise<InteractiveDemo>;
  list_demos: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<InteractiveDemo[]>;
  find_demo: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
  }) => Promise<InteractiveDemo | null>;
  update_demo: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateInteractiveDemoInput;
  }) => Promise<InteractiveDemo | null>;
  delete_demo: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
  background_asset_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_asset_id: string;
  }) => Promise<boolean>;
  find_capture_session_for_demo: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<InteractiveDemoSourceCaptureSession | null>;
  capture_session_exists_for_demo: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<boolean>;
  list_capture_events_for_demo: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<InteractiveDemoSourceEvent[]>;
  list_screenshot_capture_asset_ids: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_ids: string[];
  }) => Promise<string[]>;
  create_demo_from_capture: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateInteractiveDemoFromCaptureInput;
  }) => Promise<{
    interactive_demo: InteractiveDemo;
    demo_scenes: DemoScene[];
  }>;
  create_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateDemoSceneInput;
  }) => Promise<DemoScene>;
  list_scenes: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
  }) => Promise<DemoScene[]>;
  update_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateDemoSceneInput;
  }) => Promise<DemoScene | null>;
  reorder_scenes: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    actor_org_user_id: string;
    scene_ids: string[];
  }) => Promise<DemoScene[]>;
  delete_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
  find_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
  }) => Promise<DemoScene | null>;
  create_hotspot: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateDemoHotspotInput;
  }) => Promise<DemoHotspot>;
  list_hotspots: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
  }) => Promise<DemoHotspot[]>;
  update_hotspot: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    demo_hotspot_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateDemoHotspotInput;
  }) => Promise<DemoHotspot | null>;
  reorder_hotspots: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
    hotspot_ids: string[];
  }) => Promise<DemoHotspot[]>;
  delete_hotspot: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    demo_hotspot_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
};

const ensure_project = async (
  repository: InteractiveDemoRepository,
  input: {
    organization_id: string;
    project_id: string;
  }
) => {
  const exists = await repository.project_exists(input);

  if (!exists) {
    throw new ProjectNotFoundError();
  }
};

const ensure_background_asset = async (
  repository: InteractiveDemoRepository,
  input: {
    organization_id: string;
    project_id: string;
    capture_asset_id: string | null | undefined;
  }
) => {
  if (!input.capture_asset_id) {
    return;
  }

  const exists = await repository.background_asset_exists({
    organization_id: input.organization_id,
    project_id: input.project_id,
    capture_asset_id: input.capture_asset_id,
  });

  assert_background_asset_exists(input.capture_asset_id, exists);
};

const ensure_scene = async (
  repository: InteractiveDemoRepository,
  input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
  }
) => {
  const scene = await repository.find_scene(input);

  if (!scene) {
    throw new DemoSceneNotFoundError();
  }

  return scene;
};

const ensure_target_scene = async (
  repository: InteractiveDemoRepository,
  input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    target_scene_id: string | null | undefined;
  }
) => {
  if (!input.target_scene_id) {
    return;
  }

  const target_scene = await repository.find_scene({
    organization_id: input.organization_id,
    project_id: input.project_id,
    interactive_demo_id: input.interactive_demo_id,
    demo_scene_id: input.target_scene_id,
  });

  assert_hotspot_target_scene_exists(input.target_scene_id, Boolean(target_scene));
};

export const build_interactive_demo_service = (repository: InteractiveDemoRepository) => {
  const create_interactive_demo_from_capture = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    capture_session_id: string;
    data: CreateInteractiveDemoFromCaptureInput;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_project(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    const capture_session = await repository.find_capture_session_for_demo(scope);
    if (!capture_session) {
      if (await repository.capture_session_exists_for_demo(scope)) {
        throw new CaptureArtifactVersionNotReadyError();
      }
      throw new CaptureSessionNotFoundError();
    }
    const normalized = normalize_create_demo_from_capture_source(capture_session);

    const source_events = await repository.list_capture_events_for_demo(scope);
    const capture_asset_ids = [
      ...new Set(source_events.map((event) => event.capture_asset_id).filter((id): id is string => Boolean(id))),
    ];
    const screenshot_capture_asset_ids = new Set(
      await repository.list_screenshot_capture_asset_ids({
        ...scope,
        capture_asset_ids,
      })
    );
    const scenes = build_demo_from_capture_source({
      source_events,
      screenshot_capture_asset_ids,
    });

    const result = await repository.create_demo_from_capture({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      data: {
        ...normalized,
        scenes,
      },
    });

    return {
      ...result,
      redirect_path: demo_redirect_path(input.project_id, result.interactive_demo.id),
    };
  };

  const create_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    data: CreateInteractiveDemoInput;
  }) => {
    await ensure_project(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    return repository.create_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data: normalize_create_demo_input(input.data),
    });
  };

  const list_interactive_demos = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
  }) => {
    await ensure_project(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    return repository.list_demos({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });
  };

  const get_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }) => {
    const demo = await repository.find_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
    });

    if (!demo) {
      throw new InteractiveDemoNotFoundError();
    }

    return demo;
  };

  const update_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    data: UpdateInteractiveDemoInput;
  }) => {
    const data = normalize_update_demo_input(input.data);

    const demo = await repository.update_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });

    if (!demo) {
      throw new InteractiveDemoNotFoundError();
    }

    return demo;
  };

  const delete_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }) => {
    const deleted = await repository.delete_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new InteractiveDemoNotFoundError();
    }
  };

  const create_demo_scene = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    data: CreateDemoSceneInput;
  }) => {
    await get_interactive_demo(input);
    const data = normalize_create_scene_input(input.data);
    await ensure_background_asset(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_asset_id: data.background_capture_asset_id,
    });

    return repository.create_scene({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const list_demo_scenes = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }) => {
    await get_interactive_demo(input);
    return repository.list_scenes({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
    });
  };

  const update_demo_scene = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    data: UpdateDemoSceneInput;
  }) => {
    await get_interactive_demo(input);
    const data = normalize_update_scene_input(input.data);

    await ensure_background_asset(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_asset_id: data.background_capture_asset_id,
    });

    const scene = await repository.update_scene({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });

    if (!scene) {
      throw new DemoSceneNotFoundError();
    }

    return scene;
  };

  const reorder_demo_scenes = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    scene_ids: string[];
  }) => {
    await get_interactive_demo(input);
    const scene_ids = normalize_demo_scene_ids(input.scene_ids);

    const scenes = await repository.reorder_scenes({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      scene_ids,
    });

    assert_demo_scene_order_result(scene_ids, scenes);

    return scenes;
  };

  const delete_demo_scene = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
  }) => {
    await get_interactive_demo(input);
    const deleted = await repository.delete_scene({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new DemoSceneNotFoundError();
    }
  };

  const create_demo_hotspot = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    data: CreateDemoHotspotInput;
  }) => {
    await get_interactive_demo(input);
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
    });
    const data = normalize_create_hotspot_input(input.data);
    assert_valid_hotspot_box(data);
    await ensure_target_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      target_scene_id: data.target_scene_id,
    });

    return repository.create_hotspot({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const list_demo_hotspots = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
  }) => {
    await get_interactive_demo(input);
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
    });

    return repository.list_hotspots({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
    });
  };

  const update_demo_hotspot = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    demo_hotspot_id: string;
    data: UpdateDemoHotspotInput;
  }) => {
    await get_interactive_demo(input);
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
    });
    const data = normalize_update_hotspot_input(input.data);

    assert_valid_hotspot_box(data);
    await ensure_target_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      target_scene_id: data.target_scene_id,
    });

    const hotspot = await repository.update_hotspot({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
      demo_hotspot_id: input.demo_hotspot_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });

    if (!hotspot) {
      throw new DemoHotspotNotFoundError();
    }

    return hotspot;
  };

  const reorder_demo_hotspots = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    hotspot_ids: string[];
  }) => {
    await get_interactive_demo(input);
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
    });
    const hotspot_ids = normalize_demo_hotspot_ids(input.hotspot_ids);

    const hotspots = await repository.reorder_hotspots({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      hotspot_ids,
    });

    assert_demo_hotspot_order_result(hotspot_ids, hotspots);

    return hotspots;
  };

  const delete_demo_hotspot = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    demo_hotspot_id: string;
  }) => {
    await get_interactive_demo(input);
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
    });
    const deleted = await repository.delete_hotspot({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
      demo_hotspot_id: input.demo_hotspot_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new DemoHotspotNotFoundError();
    }
  };

  return {
    create_interactive_demo_from_capture,
    create_interactive_demo,
    list_interactive_demos,
    get_interactive_demo,
    update_interactive_demo,
    delete_interactive_demo,
    create_demo_scene,
    list_demo_scenes,
    update_demo_scene,
    reorder_demo_scenes,
    delete_demo_scene,
    create_demo_hotspot,
    list_demo_hotspots,
    update_demo_hotspot,
    reorder_demo_hotspots,
    delete_demo_hotspot,
  };
};
