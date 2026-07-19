import { Readable } from "node:stream";
import { CaptureArtifactVersionNotReadyError } from "@repo/capture-domain";
import { describe, expect, it } from "vitest";
import {
  build_guide_service,
  CaptureEventNotFoundError,
  CaptureSessionNotFoundError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
  GuideNotEditableError,
  GuideBlockNotFoundError,
  GuideExportFileNotFoundError,
  InvalidGuideBlockContentError,
  InvalidGuideBlockOrderError,
  InvalidGuideBlockScreenshotError,
  GuideStepNotFoundError,
  ProjectNotFoundError,
  type GuideDetail,
  type GuideBlock,
  type GuideRepository,
  type GuideSourceEvent,
} from "./guide.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const read_stream = async (stream: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const source_events: GuideSourceEvent[] = [
  {
    id: "event_2",
    event_type: "click",
    event_index: 2,
    capture_asset_id: "asset_deleted",
    page_url: "https://example.test/departments",
    page_title: "Department",
    target_label: "Add Department",
    target_role: "button",
    target_text: "ignored text",
    note: null,
  },
  {
    id: "event_1",
    event_type: "navigation",
    event_index: 1,
    capture_asset_id: "asset_1",
    page_url: "https://example.test/departments",
    page_title: "Department List",
    target_label: null,
    target_role: null,
    target_text: null,
    note: null,
  },
  {
    id: "event_3",
    event_type: "input",
    event_index: 3,
    capture_asset_id: null,
    page_url: "https://example.test/departments/new",
    page_title: "New Department",
    target_label: "Department Name",
    target_role: "textbox",
    target_text: null,
    note: null,
  },
];

const screenshot_capture_events: GuideSourceEvent[] = [
  {
    id: "event_3",
    event_type: "capture",
    event_index: 3,
    capture_asset_id: null,
    page_url: null,
    page_title: null,
    target_label: null,
    target_role: null,
    target_text: null,
    note: null,
  },
  {
    id: "event_1",
    event_type: "capture",
    event_index: 1,
    capture_asset_id: "asset_1",
    page_url: "https://example.test/departments",
    page_title: "Department List",
    target_label: null,
    target_role: null,
    target_text: null,
    note: null,
  },
  {
    id: "event_2",
    event_type: "capture",
    event_index: 2,
    capture_asset_id: "asset_deleted",
    page_url: "https://example.test/departments/new",
    page_title: null,
    target_label: null,
    target_role: null,
    target_text: null,
    note: null,
  },
];

const guide_detail: GuideDetail = {
  guide: {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: null,
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T00:00:00.000Z",
    updated_at: "2026-06-05T00:00:00.000Z",
  },
  guide_blocks: [],
  source_capture_assets: [],
};

const build_repository = (): GuideRepository & {
  created_inputs: unknown[];
  update_guide_inputs: unknown[];
  update_step_inputs: unknown[];
  create_block_inputs: unknown[];
  update_block_inputs: unknown[];
  update_annotation_inputs: unknown[];
  reorder_inputs: unknown[];
  delete_block_inputs: unknown[];
} => {
  const created_inputs: unknown[] = [];
  const update_guide_inputs: unknown[] = [];
  const update_step_inputs: unknown[] = [];
  const create_block_inputs: unknown[] = [];
  const update_block_inputs: unknown[] = [];
  const update_annotation_inputs: unknown[] = [];
  const reorder_inputs: unknown[] = [];
  const delete_block_inputs: unknown[] = [];

  return {
    created_inputs,
    update_guide_inputs,
    update_step_inputs,
    create_block_inputs,
    update_block_inputs,
    update_annotation_inputs,
    reorder_inputs,
    delete_block_inputs,
    async project_exists(input) {
      return input.project_id === "project_1";
    },
    async capture_session_exists(input) {
      return input.capture_session_id === "capture_session_1";
    },
    async capture_session_is_current_default(input) {
      return input.capture_session_id === "capture_session_1";
    },
    async list_source_capture_events(input) {
      const selected_ids = input.selected_capture_event_ids;
      const events = selected_ids
        ? source_events.filter((event) => selected_ids.includes(event.id))
        : source_events;
      return [...events].sort((a, b) => a.event_index - b.event_index);
    },
    async list_active_capture_asset_ids(input) {
      return input.capture_asset_ids.filter((id) => id === "asset_1");
    },
    async active_screenshot_asset_exists(input) {
      return input.capture_asset_id === "asset_1";
    },
    async create_guide_from_capture(input) {
      created_inputs.push(input);
      return guide_detail;
    },
    async list_guides() {
      return [guide_detail.guide];
    },
    async find_guide_detail() {
      return guide_detail;
    },
    async update_guide(input) {
      update_guide_inputs.push(input);
      return {
        ...guide_detail.guide,
        title: input.data.title ?? guide_detail.guide.title,
        description: input.data.description ?? guide_detail.guide.description,
        status: input.data.status ?? guide_detail.guide.status,
        version: 2,
      };
    },
    async find_guide_step(input) {
      if (input.guide_step_id !== "step_1") {
        return null;
      }

      return {
        id: "step_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        title: "Old title",
        body: null,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
      };
    },
    async update_guide_step(input) {
      update_step_inputs.push(input);
      return {
        id: input.guide_step_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        guide_block_id: "block_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        title: input.data.title ?? "Old title",
        body: input.data.body ?? null,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 2,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
      };
    },
    async list_guide_blocks() {
      return [{
        id: "block_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: "asset_1",
        block_type: "step",
        content: null,
        block_index: 1,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
        step: null,
      }, {
        id: "block_2",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_2",
        source_capture_asset_id: "asset_1",
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: "asset_1",
        block_type: "step",
        content: null,
        block_index: 2,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
        step: null,
      }];
    },
    async reorder_guide_blocks(input) {
      reorder_inputs.push(input);
      return input.block_ids.map((id, index) => ({
        id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: null,
        source_capture_asset_id: null,
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "step",
        content: null,
        block_index: index + 1,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 2,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
        step: null,
      }));
    },
    async create_guide_block(input) {
      create_block_inputs.push(input);
      return [{
        id: "block_1",
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "step",
        content: null,
        block_index: 1,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
        step: {
          id: "step_2",
          organization_id: input.organization_id,
          project_id: input.project_id,
          guide_id: input.guide_id,
          guide_block_id: "block_new",
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          title: input.data.step?.title ?? "New step",
          body: input.data.step?.body ?? null,
          created_by_id: "org_user_1",
          updated_by_id: input.actor_org_user_id,
          version: 1,
          created_at: "2026-06-05T00:00:00.000Z",
          updated_at: "2026-06-05T00:10:00.000Z",
        },
      }];
    },
    async update_guide_block(input) {
      update_block_inputs.push(input);
      return {
        id: input.guide_block_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        source_capture_session_id: null,
        source_capture_event_id: null,
        source_capture_asset_id: null,
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "tip",
        content: input.data.content,
        block_index: 2,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 2,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
        step: null,
      };
    },
    async update_guide_block_screenshot(input) {
      return {
        id: input.guide_block_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        selected_capture_asset_id: input.data.selected_capture_asset_id,
        screenshot_hidden: input.data.screenshot_hidden,
        display_capture_asset_id: input.data.screenshot_hidden
          ? null
          : input.data.selected_capture_asset_id ?? "asset_1",
        block_type: "step",
        content: null,
        block_index: 1,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 2,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
        step: null,
      };
    },
    async update_guide_block_annotations(input) {
      update_annotation_inputs.push(input);
      return {
        id: input.guide_block_id,
        organization_id: input.organization_id,
        project_id: input.project_id,
        guide_id: input.guide_id,
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: "asset_1",
        block_type: "step",
        content: input.data.content,
        block_index: 1,
        created_by_id: "org_user_1",
        updated_by_id: input.actor_org_user_id,
        version: 2,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:10:00.000Z",
        step: null,
      };
    },
    async delete_guide_block(input) {
      delete_block_inputs.push(input);
      return input.guide_block_id === "block_1";
    },
    async find_guide_export_asset_files() {
      return [];
    },
  };
};

describe("guide service", () => {
  it("creates a draft guide from selected capture events in persisted event order", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        title: " Department guide ",
        selected_capture_event_ids: ["event_3", "event_1", "event_2"],
      },
    })).resolves.toEqual(guide_detail);

    expect(repository.created_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Department guide",
        description: null,
        blocks: [
          {
            block_type: "step",
            block_index: 1,
            source_capture_event_id: "event_1",
            source_capture_asset_id: "asset_1",
            step: {
              title: "Navigate to \"Department List\"",
              body: null,
            },
          },
          {
            block_type: "step",
            block_index: 2,
            source_capture_event_id: "event_2",
            source_capture_asset_id: null,
            step: {
              title: "Click \"Add Department\"",
              body: null,
            },
          },
          {
            block_type: "step",
            block_index: 3,
            source_capture_event_id: "event_3",
            source_capture_asset_id: null,
            step: {
              title: "Enter the required value in \"Department Name\"",
              body: null,
            },
          },
        ],
      },
    }]);
  });

  it("validates scope and selected event ids", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "missing_project",
      capture_session_id: "capture_session_1",
      data: { title: "Guide" },
    })).rejects.toBeInstanceOf(ProjectNotFoundError);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "missing_session",
      data: { title: "Guide" },
    })).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: { title: "Guide", selected_capture_event_ids: ["event_1", "event_1"] },
    })).rejects.toBeInstanceOf(InvalidGuideInputError);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: { title: "Guide", selected_capture_event_ids: ["missing_event"] },
    })).rejects.toBeInstanceOf(CaptureEventNotFoundError);
  });

  it("rejects capture sessions outside the current Default Project Version", async () => {
    const repository = build_repository();
    repository.capture_session_is_current_default = async () => false;
    const service = build_guide_service(repository);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: { title: "Guide" },
    })).rejects.toBeInstanceOf(CaptureArtifactVersionNotReadyError);
  });

  it("creates useful guide steps from screenshot-backed capture events", async () => {
    const repository = build_repository();
    repository.list_source_capture_events = async (input) => {
      const selected_ids = input.selected_capture_event_ids;
      const events = selected_ids
        ? screenshot_capture_events.filter((event) => selected_ids.includes(event.id))
        : screenshot_capture_events;
      return [...events].sort((a, b) => a.event_index - b.event_index);
    };
    const service = build_guide_service(repository);

    await expect(service.create_guide_from_capture({
      auth,
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      data: {
        title: " Screenshot guide ",
        selected_capture_event_ids: ["event_3", "event_1", "event_2"],
      },
    })).resolves.toEqual(guide_detail);

    expect(repository.created_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Screenshot guide",
        description: null,
        blocks: [
          {
            block_type: "step",
            block_index: 1,
            source_capture_event_id: "event_1",
            source_capture_asset_id: "asset_1",
            step: {
              title: "Capture \"Department List\"",
              body: "Captured from https://example.test/departments.",
            },
          },
          {
            block_type: "step",
            block_index: 2,
            source_capture_event_id: "event_2",
            source_capture_asset_id: null,
            step: {
              title: "Capture \"https://example.test/departments/new\"",
              body: "Captured from this page.",
            },
          },
          {
            block_type: "step",
            block_index: 3,
            source_capture_event_id: "event_3",
            source_capture_asset_id: null,
            step: {
              title: "Capture this screen",
              body: null,
            },
          },
        ],
      },
    }]);
    expect(JSON.stringify(repository.created_inputs)).not.toContain("input_value");
    expect(JSON.stringify(repository.created_inputs)).not.toContain("typed_value");
  });

  it("lists and gets guides through scoped repository calls", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.list_guides({ auth, project_id: "project_1" })).resolves.toEqual([guide_detail.guide]);
    await expect(service.get_guide_detail({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    })).resolves.toEqual(guide_detail);
  });

  it("updates guide metadata for editable draft guides", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        title: " Updated department guide ",
        description: " Updated body ",
        status: "archived",
      },
    })).resolves.toMatchObject({
      id: "guide_1",
      title: "Updated department guide",
      description: "Updated body",
      status: "archived",
      version: 2,
    });

    expect(repository.update_guide_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Updated department guide",
        description: "Updated body",
        status: "archived",
      },
    }]);
  });

  it("rejects empty guide updates and non-editable archived guides", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {},
    })).rejects.toBeInstanceOf(InvalidGuideInputError);

    repository.find_guide_detail = async () => ({
      ...guide_detail,
      guide: {
        ...guide_detail.guide,
        status: "archived",
      },
    });

    await expect(service.update_guide({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: { title: "Cannot edit" },
    })).rejects.toBeInstanceOf(GuideNotEditableError);
  });

  it("updates guide step title and body for editable draft guides", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide_step({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_step_id: "step_1",
      data: {
        title: " Updated step ",
        body: " Helpful details ",
      },
    })).resolves.toMatchObject({
      id: "step_1",
      title: "Updated step",
      body: "Helpful details",
      version: 2,
    });

    expect(repository.update_step_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      guide_step_id: "step_1",
      actor_org_user_id: "org_user_1",
      data: {
        title: "Updated step",
        body: "Helpful details",
      },
    }]);
  });

  it("rejects invalid or missing guide step updates", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide_step({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_step_id: "step_1",
      data: {},
    })).rejects.toBeInstanceOf(InvalidGuideStepInputError);

    await expect(service.update_guide_step({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_step_id: "missing_step",
      data: { title: "Updated" },
    })).rejects.toBeInstanceOf(GuideStepNotFoundError);
  });

  it("reorders guide blocks when the request contains every active block once", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.reorder_guide_blocks({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      block_ids: ["block_2", "block_1"],
    })).resolves.toMatchObject([
      { id: "block_2", block_index: 1 },
      { id: "block_1", block_index: 2 },
    ]);

    expect(repository.reorder_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      actor_org_user_id: "org_user_1",
      block_ids: ["block_2", "block_1"],
    }]);
  });

  it("rejects invalid guide block reorder requests", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    for (const block_ids of [
      [],
      ["block_1", "block_1"],
      ["block_1"],
    ]) {
      await expect(service.reorder_guide_blocks({
        auth,
        project_id: "project_1",
        guide_id: "guide_1",
        block_ids,
      })).rejects.toBeInstanceOf(InvalidGuideBlockOrderError);
    }

    await expect(service.reorder_guide_blocks({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      block_ids: ["block_1", "missing_block"],
    })).rejects.toBeInstanceOf(GuideBlockNotFoundError);

    repository.list_guide_blocks = async () => [];

    await expect(service.reorder_guide_blocks({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      block_ids: ["block_1"],
    })).rejects.toBeInstanceOf(InvalidGuideBlockOrderError);
  });

  it("creates manual guide blocks with normalized content and insertion position", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "tip",
        position: {
          placement: "after",
          guide_block_id: "block_1",
        },
        content: {
          title: " Helpful hint ",
          body: " Use this when needed. ",
        },
      },
    })).resolves.toHaveLength(1);

    expect(repository.create_block_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      actor_org_user_id: "org_user_1",
      data: {
        block_type: "tip",
        position: {
          placement: "after",
          guide_block_id: "block_1",
        },
        content: {
          title: "Helpful hint",
          body: "Use this when needed.",
        },
      },
    }]);
  });

  it("creates paragraph and divider guide blocks without step records", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "paragraph",
        position: {
          placement: "after",
          guide_block_id: "block_1",
        },
        content: {
          body: " Explain what happens before the next step. ",
        },
      },
    })).resolves.toHaveLength(1);

    await expect(service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "divider",
        position: {
          placement: "before",
          guide_block_id: "block_2",
        },
      },
    })).resolves.toHaveLength(1);

    expect(repository.create_block_inputs).toEqual([
      expect.objectContaining({
        data: {
          block_type: "paragraph",
          position: {
            placement: "after",
            guide_block_id: "block_1",
          },
          content: {
            body: "Explain what happens before the next step.",
          },
        },
      }),
      expect.objectContaining({
        data: {
          block_type: "divider",
          position: {
            placement: "before",
            guide_block_id: "block_2",
          },
          content: null,
        },
      }),
    ]);
  });

  it("creates manual step blocks through the first-class step model", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "step",
        step: {
          title: " New manual step ",
          body: " Step details ",
        },
      },
    });

    expect(repository.create_block_inputs).toEqual([expect.objectContaining({
      data: {
        block_type: "step",
        step: {
          title: "New manual step",
          body: "Step details",
        },
      },
    })]);
  });

  it("updates non-step guide block content", async () => {
    const repository = build_repository();
    repository.list_guide_blocks = async () => [{
      id: "block_3",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: null,
        block_type: "tip",
      content: {
        title: "Old title",
        body: null,
      },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];
    const service = build_guide_service(repository);

    await expect(service.update_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_3",
      data: {
        content: {
          title: " Updated title ",
          body: " Updated body ",
        },
      },
    })).resolves.toMatchObject({
      id: "block_3",
      content: {
        title: "Updated title",
        body: "Updated body",
      },
    });

    expect(repository.update_block_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_3",
      actor_org_user_id: "org_user_1",
      data: {
        content: {
          title: "Updated title",
          body: "Updated body",
        },
      },
    }]);
  });

  it("updates paragraph block body content", async () => {
    const repository = build_repository();
    repository.list_guide_blocks = async () => [{
      id: "block_paragraph",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "paragraph",
      content: {
        body: "Old body",
      },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];
    const service = build_guide_service(repository);

    await expect(service.update_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_paragraph",
      data: {
        content: {
          body: " Updated explanation. ",
        },
      },
    })).resolves.toMatchObject({
      id: "block_paragraph",
      content: {
        body: "Updated explanation.",
      },
    });

    expect(repository.update_block_inputs).toEqual([expect.objectContaining({
      data: {
        content: {
          body: "Updated explanation.",
        },
      },
    })]);
  });

  it("rejects invalid manual guide block content", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "header",
        content: {
          title: " ",
        },
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);

    await expect(service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "paragraph",
        content: {
          body: " ",
        },
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);

    await expect(service.create_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      data: {
        block_type: "divider",
        content: {
          body: "Divider text is not supported.",
        },
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);
  });

  it("rejects invalid guide block content updates and step block content updates", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.update_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      data: {
        content: {
          title: "Should use step endpoint",
        },
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);

    repository.list_guide_blocks = async () => [];

    await expect(service.update_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "missing_block",
      data: {
        content: {
          title: "Missing",
        },
      },
    })).rejects.toBeInstanceOf(GuideBlockNotFoundError);
  });

  it("prepares a guide step screenshot upload using the block or guide source session", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
    })).resolves.toEqual({ capture_session_id: "capture_session_1" });

    repository.list_guide_blocks = async () => [{
      id: "manual_block",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "step",
      content: null,
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "manual_block",
    })).resolves.toEqual({ capture_session_id: "capture_session_1" });
  });

  it("rejects invalid guide step screenshot upload targets", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "missing_block",
    })).rejects.toBeInstanceOf(GuideBlockNotFoundError);

    repository.list_guide_blocks = async () => [{
      id: "tip_block",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "tip",
      content: { body: "Use this carefully." },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "tip_block",
    })).rejects.toBeInstanceOf(InvalidGuideBlockScreenshotError);

    repository.find_guide_detail = async () => ({
      ...guide_detail,
      guide: {
        ...guide_detail.guide,
        source_capture_session_id: null,
      },
    });
    repository.list_guide_blocks = async () => [{
      id: "manual_block",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "step",
      content: null,
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];

    await expect(service.prepare_guide_block_screenshot_upload({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "manual_block",
    })).rejects.toBeInstanceOf(InvalidGuideBlockScreenshotError);
  });

  it("updates step screenshot annotations with backend assigned ids", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository) as ReturnType<typeof build_guide_service> & {
      update_guide_block_annotations: (input: {
        auth: typeof auth;
        project_id: string;
        guide_id: string;
        guide_block_id: string;
        data: {
          annotations: Array<{
            type: "highlight";
            x: number;
            y: number;
            width: number;
            height: number;
          }>;
        };
      }) => Promise<unknown>;
    };

    await expect(service.update_guide_block_annotations({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      data: {
        annotations: [{
          type: "highlight",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
        }],
      },
    })).resolves.toMatchObject({
      id: "block_1",
      content: {
        annotations: [{
          id: expect.stringMatching(/^ann_/),
          type: "highlight",
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.4,
        }],
      },
    });

    expect(repository.update_annotation_inputs).toEqual([expect.objectContaining({
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      actor_org_user_id: "org_user_1",
      data: {
        content: {
          annotations: [{
            id: expect.stringMatching(/^ann_/),
            type: "highlight",
            x: 0.1,
            y: 0.2,
            width: 0.3,
            height: 0.4,
          }],
        },
      },
    })]);
  });

  it("exports guide drafts and archived guides as deterministic markdown", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository, {
      public_base_url: "https://demo.test",
    });
    const blocks: GuideBlock[] = [{
      id: "block_step_2",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_2",
      source_capture_asset_id: "asset_2",
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: "asset_2",
      block_type: "step",
      content: {
        annotations: [{
          id: "ann_1",
          type: "highlight",
          x: 0.64,
          y: 0.12,
          width: 0.18,
          height: 0.08,
        }],
      },
      block_index: 2,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: {
        id: "step_2",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_step_2",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_2",
        source_capture_asset_id: "asset_2",
        title: "Click [Add] Department",
        body: "Use the primary action.\r\nThen confirm.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
      },
    }, {
      id: "block_header_1",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "header",
      content: { title: "Department fields" },
      block_index: 1,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }, {
      id: "block_paragraph_3",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "paragraph",
      content: { body: "Choose the right settings." },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }, {
      id: "block_tip_4",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "tip",
      content: { title: "Parent departments", body: "Use groups for reusable hierarchy." },
      block_index: 4,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }, {
      id: "block_alert_5",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "alert",
      content: { body: "This can change reporting." },
      block_index: 5,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }, {
      id: "block_divider_6",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "divider",
      content: null,
      block_index: 6,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }, {
      id: "block_gif_7",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "gif",
      content: null,
      block_index: 7,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];
    repository.find_guide_detail = async () => ({
      guide: {
        ...guide_detail.guide,
        title: "Department Guide!",
        description: "Set up departments from the list view.",
        status: "archived",
      },
      guide_blocks: blocks,
      source_capture_assets: [{
        id: "asset_2",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 1,
        page_url: "https://example.test/departments",
        page_title: "Department (List)",
        captured_at: "2026-06-05T00:00:00.000Z",
        file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_2/file",
        file: {
          id: "file_2",
          original_name: "departments.png",
          mime_type: "image/png",
          size_bytes: 123456,
        },
      }],
    });

    await expect(service.export_guide_markdown({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    })).resolves.toEqual({
      filename: "department-guide.md",
      markdown: [
        "# Department Guide!",
        "",
        "Set up departments from the list view.",
        "",
        "## Department fields",
        "",
        "## 1. Click \\[Add\\] Department",
        "",
        "Use the primary action.",
        "Then confirm.",
        "",
        "![Department (List)](https://demo.test/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_2/file)",
        "",
        "Highlights:",
        "",
        "- Highlight 1: x 64%, y 12%, width 18%, height 8%",
        "",
        "Choose the right settings.",
        "",
        "> **Tip: Parent departments**",
        "> Use groups for reusable hierarchy.",
        "",
        "> **Alert:** This can change reporting.",
        "",
        "---",
        "",
        "<!-- Unsupported guide block: gif -->",
        "",
      ].join("\n"),
    });
  });

  it("exports guide drafts as HTML ZIP files with visible screenshots", async () => {
    const repository = build_repository();
    const file_reads: Array<{ storage_key: string }> = [];
    const export_file_inputs: unknown[] = [];
    const blocks: GuideBlock[] = [{
      id: "block_step_1",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: "asset_1",
      block_type: "step",
      content: {
        annotations: [{
          id: "ann_1",
          type: "highlight",
          x: 0.2,
          y: 0.15,
          width: 0.25,
          height: 0.1,
        }],
      },
      block_index: 1,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: {
        id: "step_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_step_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        title: "Navigate to Departments",
        body: "Open the list.",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
      },
    }, {
      id: "block_hidden_2",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_2",
      source_capture_asset_id: "asset_hidden",
      selected_capture_asset_id: null,
      screenshot_hidden: true,
      display_capture_asset_id: null,
      block_type: "step",
      content: null,
      block_index: 2,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: {
        id: "step_hidden",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        guide_block_id: "block_hidden_2",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_2",
        source_capture_asset_id: "asset_hidden",
        title: "Hidden screenshot",
        body: null,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
      },
    }];
    repository.find_guide_detail = async () => ({
      guide: {
        ...guide_detail.guide,
        title: "Department Guide!",
        description: "Set up departments.",
      },
      guide_blocks: blocks,
      source_capture_assets: [{
        id: "asset_1",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 1,
        page_url: "https://example.test/departments",
        page_title: "Department List",
        captured_at: "2026-06-05T00:00:00.000Z",
        file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
        file: {
          id: "file_1",
          original_name: "departments.png",
          mime_type: "image/png",
          size_bytes: 123456,
        },
      }, {
        id: "asset_hidden",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 1,
        page_url: null,
        page_title: "Hidden",
        captured_at: "2026-06-05T00:00:00.000Z",
        file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_hidden/file",
        file: {
          id: "file_hidden",
          original_name: "hidden.png",
          mime_type: "image/png",
          size_bytes: 123456,
        },
      }],
    });
    repository.find_guide_export_asset_files = async (input) => {
      export_file_inputs.push(input);
      return [{
        capture_asset_id: "asset_1",
        storage_provider: "local",
        storage_key: "private/storage/departments.png",
        mime_type: "image/png",
        original_name: "departments.png",
        size_bytes: 11,
      }];
    };
    const service = build_guide_service(repository, {
      file_storage: {
        get: async (input) => {
          file_reads.push(input);
          return {
            stream: Readable.from(Buffer.from("image-bytes")),
            size_bytes: 11,
          };
        },
      },
    });

    const result = await service.export_guide_html_zip({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    });
    const JSZip = (await import("jszip")).default;
    const archive = await JSZip.loadAsync(await read_stream(result.stream));
    const html = await archive.file("index.html")?.async("string");

    expect(result.filename).toBe("department-guide-html-export.zip");
    expect(result.mime_type).toBe("application/zip");
    expect(export_file_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      capture_asset_ids: ["asset_1"],
    }]);
    expect(file_reads).toEqual([{ storage_key: "private/storage/departments.png" }]);
    await expect(archive.file("assets/1-asset_1.png")?.async("string"))
      .resolves.toBe("image-bytes");
    expect(html).toContain("Department Guide!");
    expect(html).toContain("assets/1-asset_1.png");
    expect(html).toContain("left: 20%; top: 15%; width: 25%; height: 10%;");
    expect(html).not.toContain("private/storage");
    expect(html).not.toContain("asset_hidden");
  });

  it("maps missing HTML export screenshot bytes to a guide export file error", async () => {
    const repository = build_repository();
    repository.find_guide_detail = async () => ({
      ...guide_detail,
      guide_blocks: [{
        id: "block_step_1",
        organization_id: "organization_1",
        project_id: "project_1",
        guide_id: "guide_1",
        source_capture_session_id: "capture_session_1",
        source_capture_event_id: "event_1",
        source_capture_asset_id: "asset_1",
        selected_capture_asset_id: null,
        screenshot_hidden: false,
        display_capture_asset_id: "asset_1",
        block_type: "step",
        content: null,
        block_index: 1,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T00:00:00.000Z",
        updated_at: "2026-06-05T00:00:00.000Z",
        step: {
          id: "step_1",
          organization_id: "organization_1",
          project_id: "project_1",
          guide_id: "guide_1",
          guide_block_id: "block_step_1",
          source_capture_session_id: "capture_session_1",
          source_capture_event_id: "event_1",
          source_capture_asset_id: "asset_1",
          title: "Navigate to Departments",
          body: null,
          created_by_id: "org_user_1",
          updated_by_id: "org_user_1",
          version: 1,
          created_at: "2026-06-05T00:00:00.000Z",
          updated_at: "2026-06-05T00:00:00.000Z",
        },
      }],
      source_capture_assets: [{
        id: "asset_1",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 1,
        page_url: null,
        page_title: "Department List",
        captured_at: "2026-06-05T00:00:00.000Z",
        file_url: "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/asset_1/file",
        file: {
          id: "file_1",
          original_name: "departments.png",
          mime_type: "image/png",
          size_bytes: 123456,
        },
      }],
    });
    repository.find_guide_export_asset_files = async () => [{
      capture_asset_id: "asset_1",
      storage_provider: "local",
      storage_key: "private/storage/missing.png",
      mime_type: "image/png",
      original_name: "missing.png",
      size_bytes: 11,
    }];
    const service = build_guide_service(repository, {
      file_storage: {
        get: async () => {
          throw new Error("missing bytes");
        },
      },
    });

    await expect(service.export_guide_html_zip({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
    })).rejects.toBeInstanceOf(GuideExportFileNotFoundError);
  });

  it("rejects invalid guide screenshot annotations", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository) as ReturnType<typeof build_guide_service> & {
      update_guide_block_annotations: (input: {
        auth: typeof auth;
        project_id: string;
        guide_id: string;
        guide_block_id: string;
        data: {
          annotations: Array<{
            id?: string;
            type: "highlight";
            x: number;
            y: number;
            width: number;
            height: number;
          }>;
        };
      }) => Promise<unknown>;
    };

    await expect(service.update_guide_block_annotations({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      data: {
        annotations: [{
          type: "highlight",
          x: 0.9,
          y: 0.2,
          width: 0.2,
          height: 0.2,
        }],
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);

    await expect(service.update_guide_block_annotations({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      data: {
        annotations: [{
          id: "unknown_annotation",
          type: "highlight",
          x: 0.1,
          y: 0.2,
          width: 0.2,
          height: 0.2,
        }],
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);

    repository.list_guide_blocks = async () => [{
      id: "block_1",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: "capture_session_1",
      source_capture_event_id: "event_1",
      source_capture_asset_id: "asset_1",
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: "asset_1",
      block_type: "step",
      content: {
        annotations: [{
          id: "ann_existing",
          type: "highlight",
          x: 0.1,
          y: 0.2,
          width: 0.2,
          height: 0.2,
        }],
      },
      block_index: 1,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];

    await expect(service.update_guide_block_annotations({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      data: {
        annotations: [{
          id: "ann_existing",
          type: "highlight",
          x: 0.1,
          y: 0.2,
          width: 0.2,
          height: 0.2,
        }, {
          id: "ann_existing",
          type: "highlight",
          x: 0.4,
          y: 0.4,
          width: 0.2,
          height: 0.2,
        }],
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);

    repository.list_guide_blocks = async () => [{
      id: "tip_block",
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      source_capture_session_id: null,
      source_capture_event_id: null,
      source_capture_asset_id: null,
      selected_capture_asset_id: null,
      screenshot_hidden: false,
      display_capture_asset_id: null,
      block_type: "tip",
      content: { body: "Use this carefully." },
      block_index: 3,
      created_by_id: "org_user_1",
      updated_by_id: "org_user_1",
      version: 1,
      created_at: "2026-06-05T00:00:00.000Z",
      updated_at: "2026-06-05T00:00:00.000Z",
      step: null,
    }];

    await expect(service.update_guide_block_annotations({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "tip_block",
      data: {
        annotations: [{
          type: "highlight",
          x: 0.1,
          y: 0.2,
          width: 0.2,
          height: 0.2,
        }],
      },
    })).rejects.toBeInstanceOf(InvalidGuideBlockContentError);
  });

  it("soft deletes a guide block for editable draft guides", async () => {
    const repository = build_repository();
    const service = build_guide_service(repository);

    await expect(service.delete_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
    })).resolves.toBeUndefined();

    expect(repository.delete_block_inputs).toEqual([{
      organization_id: "organization_1",
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
      actor_org_user_id: "org_user_1",
    }]);

    await expect(service.delete_guide_block({
      auth,
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "missing_block",
    })).rejects.toBeInstanceOf(GuideBlockNotFoundError);
  });
});
