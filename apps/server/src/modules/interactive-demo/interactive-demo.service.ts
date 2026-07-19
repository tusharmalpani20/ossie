import type { CaptureEventType, DemoHotspotType } from "@repo/constants";
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
  InteractiveDemoNotEditableError,
  InteractiveDemoEditionConflictError,
  InteractiveDemoWorkingDraftConflictError,
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
  InteractiveDemoArtifact,
  InteractiveDemoEdition,
  InteractiveDemoWorkingDraft,
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
  InteractiveDemoArtifact,
  InteractiveDemoEdition,
  InteractiveDemoWorkingDraft,
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
  InteractiveDemoNotEditableError,
  InteractiveDemoEditionConflictError,
  InteractiveDemoWorkingDraftConflictError,
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

export type InteractiveDemoSummary = {
  artifact: InteractiveDemoArtifact;
  edition: InteractiveDemoEdition;
  authored_updated_at: string;
};
export type InteractiveDemoDetail = InteractiveDemoSummary & {
  working_draft: InteractiveDemoWorkingDraft;
};

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
  }) => Promise<InteractiveDemoDetail>;
  list_demos: (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
  }) => Promise<InteractiveDemoSummary[]>;
  find_demo: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
  }) => Promise<InteractiveDemoDetail | null>;
  update_demo: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateInteractiveDemoInput;
    expected_edition_version: number;
  }) => Promise<InteractiveDemoEdition | null>;
  update_demo_status: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    status: "draft" | "archived";
    expected_edition_version: number;
  }) => Promise<InteractiveDemoEdition>;
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
    artifact: InteractiveDemoArtifact;
    edition: InteractiveDemoEdition;
    working_draft: InteractiveDemoWorkingDraft;
    demo_scenes: DemoScene[];
  }>;
  create_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateDemoSceneInput;
    expected_working_draft_version: number;
  }) => Promise<{
    demo_scene: DemoScene;
    working_draft: InteractiveDemoWorkingDraft;
  }>;
  list_scenes: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
  }) => Promise<{
    demo_scenes: DemoScene[];
    working_draft: InteractiveDemoWorkingDraft;
  }>;
  update_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateDemoSceneInput;
    expected_working_draft_version: number;
  }) => Promise<{
    demo_scene: DemoScene;
    working_draft: InteractiveDemoWorkingDraft;
  } | null>;
  reorder_scenes: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    scene_ids: string[];
    expected_working_draft_version: number;
  }) => Promise<{
    demo_scenes: DemoScene[];
    working_draft: InteractiveDemoWorkingDraft;
  }>;
  delete_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
    expected_working_draft_version: number;
  }) => Promise<{
    deleted: boolean;
    working_draft: InteractiveDemoWorkingDraft | null;
  }>;
  find_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
  }) => Promise<DemoScene | null>;
  create_hotspot: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateDemoHotspotInput;
    expected_working_draft_version: number;
  }) => Promise<{
    demo_hotspot: DemoHotspot;
    working_draft: InteractiveDemoWorkingDraft;
  }>;
  list_hotspots: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
  }) => Promise<{
    demo_hotspots: DemoHotspot[];
    working_draft: InteractiveDemoWorkingDraft;
  }>;
  update_hotspot: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    demo_hotspot_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateDemoHotspotInput;
    expected_working_draft_version: number;
  }) => Promise<{
    demo_hotspot: DemoHotspot;
    working_draft: InteractiveDemoWorkingDraft;
  } | null>;
  reorder_hotspots: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
    hotspot_ids: string[];
    expected_working_draft_version: number;
  }) => Promise<{
    demo_hotspots: DemoHotspot[];
    working_draft: InteractiveDemoWorkingDraft;
  }>;
  delete_hotspot: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    demo_hotspot_id: string;
    actor_org_user_id: string;
    expected_working_draft_version: number;
  }) => Promise<{
    deleted: boolean;
    working_draft: InteractiveDemoWorkingDraft | null;
  }>;
};

const ensure_project = async (
  repository: InteractiveDemoRepository,
  input: {
    organization_id: string;
    project_id: string;
  },
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
  },
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
    project_version_id: string;
    demo_scene_id: string;
  },
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
    project_version_id: string;
    target_scene_id: string | null | undefined;
  },
) => {
  if (!input.target_scene_id) {
    return;
  }

  const target_scene = await repository.find_scene({
    organization_id: input.organization_id,
    project_id: input.project_id,
    interactive_demo_id: input.interactive_demo_id,
    project_version_id: input.project_version_id,
    demo_scene_id: input.target_scene_id,
  });

  assert_hotspot_target_scene_exists(
    input.target_scene_id,
    Boolean(target_scene),
  );
};

export const build_interactive_demo_service = (
  repository: InteractiveDemoRepository,
) => {
  const values_differ = (
    current: Record<string, unknown>,
    next: Record<string, unknown>,
  ) => Object.entries(next).some(([key, value]) => current[key] !== value);

  const transition_differs = (
    current: DemoHotspot["transition"],
    next: NormalizedUpdateDemoHotspotInput["transition"],
  ) => next !== undefined && current?.target_scene_id !== next?.target_scene_id;

  const assert_edition_version = (actual: number, expected: number) => {
    if (actual !== expected) throw new InteractiveDemoEditionConflictError();
  };

  const assert_working_draft_version = (actual: number, expected: number) => {
    if (actual !== expected)
      throw new InteractiveDemoWorkingDraftConflictError();
  };

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

    const capture_session =
      await repository.find_capture_session_for_demo(scope);
    if (!capture_session) {
      throw new CaptureSessionNotFoundError();
    }
    const normalized =
      normalize_create_demo_from_capture_source(capture_session);

    const source_events = await repository.list_capture_events_for_demo(scope);
    const capture_asset_ids = [
      ...new Set(
        source_events
          .map((event) => event.capture_asset_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const screenshot_capture_asset_ids = new Set(
      await repository.list_screenshot_capture_asset_ids({
        ...scope,
        capture_asset_ids,
      }),
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
      redirect_path: demo_redirect_path(
        input.project_id,
        result.edition.project_version_id,
        result.artifact.id,
      ),
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
    project_version_id: string;
  }) => {
    await ensure_project(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    return repository.list_demos({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      project_version_id: input.project_version_id,
    });
  };

  const get_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
  }) => {
    const demo = await repository.find_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
    });

    if (!demo) {
      throw new InteractiveDemoNotFoundError();
    }

    return demo;
  };

  const require_editable_interactive_demo = async (
    input: Parameters<typeof get_interactive_demo>[0],
  ) => {
    const demo = await get_interactive_demo(input);
    if (demo.edition.status === "archived") {
      throw new InteractiveDemoNotEditableError();
    }
    return demo;
  };

  const update_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    data: UpdateInteractiveDemoInput;
  }) => {
    const data = normalize_update_demo_input(input.data);
    const current = await require_editable_interactive_demo(input);
    assert_edition_version(
      current.edition.version,
      input.data.expected_edition_version,
    );

    if (!values_differ(current.edition, data)) {
      return current.edition;
    }

    const demo = await repository.update_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_edition_version: input.data.expected_edition_version,
    });

    if (!demo) {
      throw new InteractiveDemoNotFoundError();
    }

    return demo;
  };

  const update_interactive_demo_status = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    status: "draft" | "archived";
    expected_edition_version: number;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };
    const detail = await repository.find_demo({
      ...scope,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
    });
    if (!detail) throw new InteractiveDemoNotFoundError();
    if (detail.edition.status === input.status) {
      if (detail.edition.version !== input.expected_edition_version)
        throw new InteractiveDemoEditionConflictError();
      return detail.edition;
    }
    return repository.update_demo_status({
      ...scope,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      status: input.status,
      expected_edition_version: input.expected_edition_version,
    });
  };

  const create_demo_scene = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    data: CreateDemoSceneInput;
  }) => {
    await require_editable_interactive_demo(input);
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
      project_version_id: input.project_version_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_working_draft_version:
        input.data.expected_working_draft_version!,
    });
  };

  const list_demo_scenes = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
  }) => {
    await get_interactive_demo(input);
    return repository.list_scenes({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
    });
  };

  const update_demo_scene = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    data: UpdateDemoSceneInput;
  }) => {
    const current = await require_editable_interactive_demo(input);
    assert_working_draft_version(
      current.working_draft.version,
      input.data.expected_working_draft_version,
    );
    const data = normalize_update_scene_input(input.data);
    const current_scene = await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
    });

    if (!values_differ(current_scene, data)) {
      return {
        demo_scene: current_scene,
        working_draft: current.working_draft,
      };
    }

    await ensure_background_asset(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_asset_id: data.background_capture_asset_id,
    });

    const scene = await repository.update_scene({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_working_draft_version: input.data.expected_working_draft_version,
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
    project_version_id: string;
    scene_ids: string[];
    expected_working_draft_version: number;
  }) => {
    const current = await require_editable_interactive_demo(input);
    assert_working_draft_version(
      current.working_draft.version,
      input.expected_working_draft_version,
    );
    const scene_ids = normalize_demo_scene_ids(input.scene_ids);
    const existing = await repository.list_scenes({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
    });
    assert_demo_scene_order_result(scene_ids, existing.demo_scenes);
    if (
      existing.demo_scenes.every(
        (scene, index) => scene.id === scene_ids[index],
      )
    ) {
      return existing;
    }

    const scenes = await repository.reorder_scenes({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      scene_ids,
      expected_working_draft_version: input.expected_working_draft_version,
    });

    assert_demo_scene_order_result(scene_ids, scenes.demo_scenes);

    return scenes;
  };

  const delete_demo_scene = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    expected_working_draft_version: number;
  }) => {
    await require_editable_interactive_demo(input);
    const deleted = await repository.delete_scene({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      expected_working_draft_version: input.expected_working_draft_version,
    });

    if (!deleted.deleted) {
      throw new DemoSceneNotFoundError();
    }
    return deleted.working_draft!;
  };

  const create_demo_hotspot = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    data: CreateDemoHotspotInput;
  }) => {
    await require_editable_interactive_demo(input);
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
    });
    const data = normalize_create_hotspot_input(input.data);
    assert_valid_hotspot_box(data);
    await ensure_target_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      target_scene_id: data.transition?.target_scene_id,
    });

    return repository.create_hotspot({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_working_draft_version:
        input.data.expected_working_draft_version!,
    });
  };

  const list_demo_hotspots = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
  }) => {
    await get_interactive_demo(input);
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
    });

    return repository.list_hotspots({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
    });
  };

  const update_demo_hotspot = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    demo_hotspot_id: string;
    data: UpdateDemoHotspotInput;
  }) => {
    const current = await require_editable_interactive_demo(input);
    assert_working_draft_version(
      current.working_draft.version,
      input.data.expected_working_draft_version!,
    );
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
    });
    const data = normalize_update_hotspot_input(input.data);

    assert_valid_hotspot_box(data);
    await ensure_target_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      target_scene_id: data.transition?.target_scene_id,
    });

    const existing = await repository.list_hotspots({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
    });
    const current_hotspot = existing.demo_hotspots.find(
      (hotspot) => hotspot.id === input.demo_hotspot_id,
    );
    if (!current_hotspot) throw new DemoHotspotNotFoundError();
    const { transition: next_transition, ...next_fields } = data;
    if (
      !values_differ(current_hotspot, next_fields) &&
      !transition_differs(current_hotspot.transition, next_transition)
    ) {
      return {
        demo_hotspot: current_hotspot,
        working_draft: current.working_draft,
      };
    }

    const hotspot = await repository.update_hotspot({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
      demo_hotspot_id: input.demo_hotspot_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_working_draft_version:
        input.data.expected_working_draft_version!,
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
    project_version_id: string;
    demo_scene_id: string;
    hotspot_ids: string[];
    expected_working_draft_version: number;
  }) => {
    const current = await require_editable_interactive_demo(input);
    assert_working_draft_version(
      current.working_draft.version,
      input.expected_working_draft_version,
    );
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
    });
    const hotspot_ids = normalize_demo_hotspot_ids(input.hotspot_ids);
    const existing = await repository.list_hotspots({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
    });
    assert_demo_hotspot_order_result(hotspot_ids, existing.demo_hotspots);
    if (
      existing.demo_hotspots.every(
        (hotspot, index) => hotspot.id === hotspot_ids[index],
      )
    ) {
      return existing;
    }

    const hotspots = await repository.reorder_hotspots({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      hotspot_ids,
      expected_working_draft_version: input.expected_working_draft_version,
    });

    assert_demo_hotspot_order_result(hotspot_ids, hotspots.demo_hotspots);

    return hotspots;
  };

  const delete_demo_hotspot = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    project_version_id: string;
    demo_scene_id: string;
    demo_hotspot_id: string;
    expected_working_draft_version: number;
  }) => {
    await require_editable_interactive_demo(input);
    await ensure_scene(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
    });
    const deleted = await repository.delete_hotspot({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      project_version_id: input.project_version_id,
      demo_scene_id: input.demo_scene_id,
      demo_hotspot_id: input.demo_hotspot_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      expected_working_draft_version: input.expected_working_draft_version,
    });

    if (!deleted.deleted) {
      throw new DemoHotspotNotFoundError();
    }
    return deleted.working_draft!;
  };

  return {
    create_interactive_demo_from_capture,
    create_interactive_demo,
    list_interactive_demos,
    get_interactive_demo,
    update_interactive_demo,
    update_interactive_demo_status,
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
