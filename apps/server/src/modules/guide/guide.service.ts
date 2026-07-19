import type {
  CaptureAssetType,
  CaptureEventType,
  GuideBlockType,
  GuideCreatableBlockType,
  ArtifactEditionStatus,
} from "@repo/constants";
import {
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  GuideBlockNotFoundError,
  GuideEditionConflictError,
  GuideExportFileNotFoundError,
  GuideNotFoundError,
  GuideStepNotFoundError,
  InvalidGuideBlockScreenshotError,
  ProjectNotFoundError,
  UnsupportedGuideExportStorageProviderError,
  assert_guide_block_can_select_screenshot,
  assert_guide_block_order_covers_active_blocks,
  assert_guide_is_editable,
  build_guide_from_capture_source,
  compact_optional_string,
  guide_html_zip_filename,
  guide_markdown_filename,
  normalize_create_guide_block_input,
  normalize_create_guide_from_capture_input,
  normalize_guide_block_ids,
  normalize_update_guide_block_annotations_input,
  normalize_update_guide_block_input,
  normalize_update_guide_block_screenshot_input,
  normalize_update_guide_input,
  normalize_update_guide_step_input,
  render_guide_html_export,
  render_guide_markdown,
} from "@repo/guide-domain";
import { ulid } from "ulid";
import { build_guide_zip_export } from "./guide-zip-export";

export {
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  GuideBlockNotFoundError,
  GuideExportFileNotFoundError,
  GuideNotEditableError,
  GuideNotFoundError,
  GuideStepNotFoundError,
  InvalidGuideBlockContentError,
  InvalidGuideBlockOrderError,
  InvalidGuideBlockScreenshotError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
  ProjectNotFoundError,
  UnsupportedGuideExportStorageProviderError,
} from "@repo/guide-domain";

export type {
  GuideBlockType,
  GuideCreatableBlockType,
  ArtifactEditionStatus,
};

export type GuideAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type GuideSourceEventType = CaptureEventType;

export type Guide = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_id: string;
  project_version_id: string;
  source_capture_session_id: string | null;
  title: string;
  description: string | null;
  status: ArtifactEditionStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type GuideStep = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_working_draft_id: string;
  guide_block_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  selected_capture_asset_id: string | null;
  screenshot_hidden: boolean;
  display_capture_asset_id: string | null;
  title: string;
  body: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  annotations: GuideAnnotation[];
};

export type GuideAnnotation = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_working_draft_id: string;
  guide_step_id: string;
  annotation_type: "highlight";
  annotation_index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type GuideBlock = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_working_draft_id: string;
  block_type: GuideBlockType;
  title: string | null;
  body: string | null;
  block_index: number;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  step: GuideStep | null;
};

export type GuideBlockContent = {
  title?: string | null;
  body?: string | null;
  annotations?: GuideScreenshotAnnotation[] | null;
};

export type GuideScreenshotAnnotation = {
  id: string;
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GuideSourceCaptureAsset = {
  id: string;
  capture_session_id: string;
  asset_type: CaptureAssetType;
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: string;
  file_url: string;
  file: {
    id: string;
    original_name: string | null;
    mime_type: string;
    size_bytes: number;
  };
};

export type GuideDetail = {
  artifact: GuideArtifact;
  edition: Guide;
  working_draft: GuideWorkingDraft;
  authored_updated_at: string;
  guide_blocks: GuideBlock[];
  source_capture_assets: GuideSourceCaptureAsset[];
};

export type GuideArtifact = {
  id: string;
  organization_id: string;
  project_id: string;
  created_by_id: string;
  created_at: string;
};

export type GuideWorkingDraft = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_edition_id: string;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type GuideSummary = Pick<GuideDetail, "artifact" | "edition" | "authored_updated_at">;

export type GuideMarkdownExport = {
  filename: string;
  markdown: string;
};

export type GuideHtmlZipExport = {
  filename: string;
  mime_type: "application/zip";
  stream: NodeJS.ReadableStream;
  size_bytes: number;
};

export type GuideExportAssetFile = {
  capture_asset_id: string;
  storage_provider: "local" | "external";
  storage_key: string;
  mime_type: string;
  original_name: string | null;
  size_bytes: number;
};

export type GuideSourceEvent = {
  id: string;
  event_type: GuideSourceEventType;
  event_index: number;
  capture_asset_id: string | null;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_role: string | null;
  target_text: string | null;
  note: string | null;
};

export type CreateGuideFromCaptureInput = {
  title: string;
  description?: string | null;
  selected_capture_event_ids?: string[];
};

export type UpdateGuideInput = {
  title?: string;
  description?: string | null;
  expected_edition_version: number;
};

export type UpdateGuideStepInput = {
  title?: string;
  body?: string | null;
  expected_working_draft_version: number;
};

export type CreateGuideBlockInput = {
  block_type: GuideBlockType;
  position?: {
    placement: "before" | "after";
    guide_block_id: string;
  } | null;
  step?: {
    title?: string;
    body?: string | null;
  } | null;
  title?: string | null;
  body?: string | null;
  expected_working_draft_version: number;
};

export type UpdateGuideBlockInput = {
  title?: string | null;
  body?: string | null;
  expected_working_draft_version: number;
};

export type UpdateGuideBlockScreenshotInput = {
  capture_asset_id: string | null;
  expected_working_draft_version: number;
};

export type UpdateGuideBlockAnnotationsInput = {
  annotations: Array<{
    id?: string;
    type: "highlight";
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  expected_working_draft_version: number;
};

export type PrepareGuideBlockScreenshotUploadResult = {
  capture_session_id: string;
};

export type NormalizedUpdateGuideInput = {
  title?: string;
  description?: string | null;
};

export type NormalizedUpdateGuideStepInput = {
  title?: string;
  body?: string | null;
};

export type NormalizedCreateGuideBlockInput = {
  block_type: "step" | "header" | "paragraph" | "tip" | "alert" | "divider";
  position?: {
    placement: "before" | "after";
    guide_block_id: string;
  };
  step?: {
    title: string;
    body: string | null;
  };
  title?: string | null;
  body?: string | null;
};

export type NormalizedUpdateGuideBlockInput = {
  title: string | null;
  body: string | null;
};

export type NormalizedUpdateGuideBlockScreenshotInput = {
  selected_capture_asset_id: string | null;
  screenshot_hidden: boolean;
};

export type NormalizedUpdateGuideBlockAnnotationsInput = {
  annotations: Array<{
    id: string;
    annotation_type: "highlight";
    annotation_index: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

export type NormalizedCreateGuideFromCaptureInput = {
  title: string;
  description: string | null;
  blocks: Array<{
    block_type: GuideBlockType;
    block_index: number;
    source_capture_event_id: string;
    source_capture_asset_id: string | null;
    step: {
      title: string;
      body: string | null;
    };
  }>;
};

export type GuideRepository = {
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  capture_session_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<boolean>;
  list_source_capture_events: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    selected_capture_event_ids?: string[];
  }) => Promise<GuideSourceEvent[]>;
  list_active_capture_asset_ids: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_ids: string[];
  }) => Promise<string[]>;
  active_screenshot_asset_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_asset_id: string;
  }) => Promise<boolean>;
  create_guide_from_capture: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateGuideFromCaptureInput;
  }) => Promise<GuideDetail>;
  list_guides: (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
  }) => Promise<GuideSummary[]>;
  find_guide_detail: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
  }) => Promise<GuideDetail | null>;
  update_guide: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideInput;
    expected_edition_version: number;
  }) => Promise<Guide>;
  update_guide_status: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    status: "draft" | "archived";
    expected_edition_version: number;
  }) => Promise<Guide>;
  find_guide_step: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_step_id: string;
  }) => Promise<GuideStep | null>;
  update_guide_step: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_step_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideStepInput;
    expected_working_draft_version: number;
  }) => Promise<{ guide_step: GuideStep; working_draft: GuideWorkingDraft }>;
  list_guide_blocks: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
  }) => Promise<GuideBlock[]>;
  reorder_guide_blocks: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    block_ids: string[];
    expected_working_draft_version: number;
  }) => Promise<{ guide_blocks: GuideBlock[]; working_draft: GuideWorkingDraft }>;
  create_guide_block: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateGuideBlockInput;
    expected_working_draft_version: number;
  }) => Promise<{ guide_blocks: GuideBlock[]; working_draft: GuideWorkingDraft }>;
  update_guide_block: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_block_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideBlockInput;
    expected_working_draft_version: number;
  }) => Promise<{ guide_block: GuideBlock; working_draft: GuideWorkingDraft }>;
  update_guide_block_screenshot: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_block_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideBlockScreenshotInput;
    expected_working_draft_version: number;
  }) => Promise<{ guide_block: GuideBlock; working_draft: GuideWorkingDraft }>;
  update_guide_block_annotations: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_block_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideBlockAnnotationsInput;
    expected_working_draft_version: number;
  }) => Promise<{ guide_block: GuideBlock; working_draft: GuideWorkingDraft }>;
  delete_guide_block: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_block_id: string;
    actor_org_user_id: string;
    expected_working_draft_version: number;
  }) => Promise<{ deleted: boolean; working_draft: GuideWorkingDraft | null }>;
  find_guide_export_asset_files: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    capture_asset_ids: string[];
  }) => Promise<GuideExportAssetFile[]>;
};

export type GuideFileStorage = {
  get: (input: { storage_key: string }) => Promise<{
    stream: NodeJS.ReadableStream;
    size_bytes: number;
  }>;
};

const annotation_id = () => ulid();

export const build_guide_service = (
  repository: GuideRepository,
  options: {
    public_base_url?: string;
    file_storage?: GuideFileStorage;
  } = {}
) => {
  const public_base_url = compact_optional_string(options.public_base_url) ?? undefined;

  const ensure_project_exists = async (input: {
    organization_id: string;
    project_id: string;
  }) => {
    if (!await repository.project_exists(input)) {
      throw new ProjectNotFoundError();
    }
  };

  const ensure_capture_session_exists = async (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => {
    if (!await repository.capture_session_exists(input)) {
      throw new CaptureSessionNotFoundError();
    }
  };

  const create_guide_from_capture = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    capture_session_id: string;
    data: CreateGuideFromCaptureInput;
  }) => {
    const normalized = normalize_create_guide_from_capture_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_project_exists(scope);
    await ensure_capture_session_exists(scope);

    const source_events = await repository.list_source_capture_events({
      ...scope,
      selected_capture_event_ids: normalized.selected_capture_event_ids,
    });

    if (
      normalized.selected_capture_event_ids
      && source_events.length !== normalized.selected_capture_event_ids.length
    ) {
      throw new CaptureEventNotFoundError();
    }

    const capture_asset_ids = [
      ...new Set(source_events.map((event) => event.capture_asset_id).filter((id): id is string => Boolean(id))),
    ];
    const active_capture_asset_ids = new Set(
      await repository.list_active_capture_asset_ids({
        ...scope,
        capture_asset_ids,
      })
    );

    const data = build_guide_from_capture_source({
      title: normalized.title,
      description: normalized.description,
      source_events,
      active_capture_asset_ids,
    });

    return repository.create_guide_from_capture({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const list_guides = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    project_version_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };
    await ensure_project_exists(scope);

    return repository.list_guides({ ...scope, project_version_id: input.project_version_id });
  };

  const get_guide_detail = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };
    await ensure_project_exists(scope);

    const guide_detail = await repository.find_guide_detail({
      ...scope,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    });

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    return guide_detail;
  };

  const export_guide_markdown = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
  }): Promise<GuideMarkdownExport> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };
    await ensure_project_exists(scope);

    const guide_detail = await repository.find_guide_detail({
      ...scope,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    });

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    return {
      filename: guide_markdown_filename(guide_detail.edition),
      markdown: render_guide_markdown(guide_detail, public_base_url),
    };
  };

  const export_guide_html_zip = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
  }): Promise<GuideHtmlZipExport> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });

    const guide_detail = await repository.find_guide_detail({
      ...scope,
      project_version_id: input.project_version_id,
    });

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    if (!options.file_storage) {
      throw new GuideExportFileNotFoundError();
    }

    const rendered = render_guide_html_export(guide_detail);
    const capture_asset_ids = rendered.image_references.map((reference) => reference.capture_asset_id);
    const export_asset_files = capture_asset_ids.length > 0
      ? await repository.find_guide_export_asset_files({
        ...scope,
        project_version_id: input.project_version_id,
        capture_asset_ids,
      })
      : [];
    const export_files_by_asset_id = new Map(
      export_asset_files.map((file) => [file.capture_asset_id, file])
    );
    const images = await Promise.all(rendered.image_references.map(async (reference) => {
      const file = export_files_by_asset_id.get(reference.capture_asset_id);

      if (!file) {
        throw new GuideExportFileNotFoundError();
      }

      if (file.storage_provider !== "local") {
        throw new UnsupportedGuideExportStorageProviderError();
      }

      const stored_file = await options.file_storage!.get({
        storage_key: file.storage_key,
      }).catch(() => {
        throw new GuideExportFileNotFoundError();
      });

      return {
        path: reference.asset_path,
        stream: stored_file.stream,
      };
    }));
    const zip_export = await build_guide_zip_export({
      html: rendered.html,
      images,
    });

    return {
      filename: guide_html_zip_filename(guide_detail.edition),
      ...zip_export,
    };
  };

  const update_guide = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    data: UpdateGuideInput;
  }) => {
    const data = normalize_update_guide_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };
    await ensure_project_exists(scope);

    const guide_detail = await repository.find_guide_detail({
      ...scope,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    });

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    assert_guide_is_editable(guide_detail.edition);

    return repository.update_guide({
      ...scope,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_edition_version: input.data.expected_edition_version,
    });
  };

  const update_guide_status = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    status: "draft" | "archived";
    expected_edition_version: number;
  }) => {
    const scope = { organization_id: input.auth.organization_id, project_id: input.project_id };
    await ensure_project_exists(scope);
    const detail = await repository.find_guide_detail({ ...scope, guide_id: input.guide_id, project_version_id: input.project_version_id });
    if (!detail) throw new GuideNotFoundError();
    if (detail.edition.status === input.status) {
      if (detail.edition.version !== input.expected_edition_version) throw new GuideEditionConflictError();
      return detail.edition;
    }
    return repository.update_guide_status({
      ...scope,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      status: input.status,
      expected_edition_version: input.expected_edition_version,
    });
  };

  const ensure_editable_guide = async (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    project_version_id: string;
  }) => {
    const guide_detail = await repository.find_guide_detail(input);

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    assert_guide_is_editable(guide_detail.edition);

    return guide_detail;
  };

  const update_guide_step = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_step_id: string;
    data: UpdateGuideStepInput;
  }) => {
    const data = normalize_update_guide_step_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const guide_step = await repository.find_guide_step({
      ...scope,
      guide_step_id: input.guide_step_id,
      project_version_id: input.project_version_id,
    });

    if (!guide_step) {
      throw new GuideStepNotFoundError();
    }

    return repository.update_guide_step({
      ...scope,
      guide_step_id: input.guide_step_id,
      project_version_id: input.project_version_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_working_draft_version: input.data.expected_working_draft_version,
    });
  };

  const reorder_guide_blocks = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    block_ids: string[];
    expected_working_draft_version: number;
  }) => {
    const block_ids = normalize_guide_block_ids(input.block_ids);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const active_blocks = await repository.list_guide_blocks(scope);

    assert_guide_block_order_covers_active_blocks(block_ids, active_blocks);

    return repository.reorder_guide_blocks({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      block_ids,
      expected_working_draft_version: input.expected_working_draft_version,
    });
  };

  const create_guide_block = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    data: CreateGuideBlockInput;
  }) => {
    const data = normalize_create_guide_block_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    if (data.position) {
      const active_blocks = await repository.list_guide_blocks(scope);
      const target_exists = active_blocks.some((block) => block.id === data.position?.guide_block_id);

      if (!target_exists) {
        throw new GuideBlockNotFoundError();
      }
    }

    return repository.create_guide_block({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_working_draft_version: input.data.expected_working_draft_version,
    });
  };

  const update_guide_block = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_block_id: string;
    data: UpdateGuideBlockInput;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const block = (await repository.list_guide_blocks(scope))
      .find((candidate) => candidate.id === input.guide_block_id);

    if (!block) {
      throw new GuideBlockNotFoundError();
    }

    const data = normalize_update_guide_block_input(block.block_type, input.data);

    return repository.update_guide_block({
      ...scope,
      guide_block_id: input.guide_block_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_working_draft_version: input.data.expected_working_draft_version,
    });
  };

  const update_guide_block_screenshot = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_block_id: string;
    data: UpdateGuideBlockScreenshotInput;
  }) => {
    const data = normalize_update_guide_block_screenshot_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const block = (await repository.list_guide_blocks(scope))
      .find((candidate) => candidate.id === input.guide_block_id);

    if (!block) {
      throw new GuideBlockNotFoundError();
    }

    assert_guide_block_can_select_screenshot(block);

    if (
      data.selected_capture_asset_id
      && !await repository.active_screenshot_asset_exists({
        organization_id: scope.organization_id,
        project_id: scope.project_id,
        capture_asset_id: data.selected_capture_asset_id,
      })
    ) {
      throw new InvalidGuideBlockScreenshotError();
    }

    return repository.update_guide_block_screenshot({
      ...scope,
      guide_block_id: input.guide_block_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_working_draft_version: input.data.expected_working_draft_version,
    });
  };

  const update_guide_block_annotations = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_block_id: string;
    data: UpdateGuideBlockAnnotationsInput;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const block = (await repository.list_guide_blocks(scope))
      .find((candidate) => candidate.id === input.guide_block_id);

    if (!block) {
      throw new GuideBlockNotFoundError();
    }

    const data = normalize_update_guide_block_annotations_input(block, input.data, annotation_id);

    return repository.update_guide_block_annotations({
      ...scope,
      guide_block_id: input.guide_block_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
      expected_working_draft_version: input.data.expected_working_draft_version,
    });
  };

  const prepare_guide_block_screenshot_upload = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_block_id: string;
    expected_working_draft_version: number;
  }): Promise<PrepareGuideBlockScreenshotUploadResult> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    const guide = await ensure_editable_guide(scope);

    const block = (await repository.list_guide_blocks(scope))
      .find((candidate) => candidate.id === input.guide_block_id);

    if (!block) {
      throw new GuideBlockNotFoundError();
    }

    if (block.block_type !== "step") {
      throw new InvalidGuideBlockScreenshotError();
    }

    const capture_session_id = compact_optional_string(
      block.step?.source_capture_session_id ?? guide.edition.source_capture_session_id
    );

    if (!capture_session_id) {
      throw new InvalidGuideBlockScreenshotError();
    }

    await ensure_capture_session_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
      capture_session_id,
    });

    return { capture_session_id };
  };

  const delete_guide_block = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    project_version_id: string;
    guide_block_id: string;
    expected_working_draft_version: number;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
      project_version_id: input.project_version_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const deleted = await repository.delete_guide_block({
      ...scope,
      guide_block_id: input.guide_block_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      expected_working_draft_version: input.expected_working_draft_version,
    });

    if (!deleted.deleted) {
      throw new GuideBlockNotFoundError();
    }
    return deleted.working_draft;
  };

  return {
    create_guide_from_capture,
    list_guides,
    get_guide_detail,
    export_guide_markdown,
    export_guide_html_zip,
    update_guide,
    update_guide_status,
    update_guide_step,
    reorder_guide_blocks,
    create_guide_block,
    update_guide_block,
    update_guide_block_screenshot,
    update_guide_block_annotations,
    prepare_guide_block_screenshot_upload,
    delete_guide_block,
  };
};
