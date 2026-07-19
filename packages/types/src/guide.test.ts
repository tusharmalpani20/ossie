import { describe, expect, it } from "vitest";
import {
  CreateGuideBlockRequestSchema,
  CreateGuideFromCaptureRequestSchema,
  GuideArtifactSchema,
  GuideBlockParamsSchema,
  GuideDetailSchema,
  GuideEditionSchema,
  GuideVersionQuerySchema,
  GuideWorkingDraftSchema,
  GuideWorkingDraftMutationResponseSchema,
  ReorderGuideBlocksRequestSchema,
  UpdateGuideRequestSchema,
  UpdateGuideBlockAnnotationsRequestSchema,
  UploadGuideBlockScreenshotResponseSchema,
} from "./guide";

const artifact = {
  id: "guide_1",
  organization_id: "org_1",
  project_id: "project_1",
  created_by_id: "org_user_1",
  created_at: "2026-07-07T00:00:00.000Z",
};

const edition = {
  id: "guide_edition_1",
  organization_id: "org_1",
  project_id: "project_1",
  guide_id: "guide_1",
  project_version_id: "project_version_1",
  source_capture_session_id: "session_1",
  title: "Guide",
  description: null,
  status: "draft",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const working_draft = {
  id: "guide_working_draft_1",
  organization_id: "org_1",
  project_id: "project_1",
  guide_edition_id: "guide_edition_1",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const annotation = {
  id: "ann_1",
  organization_id: "org_1",
  project_id: "project_1",
  guide_working_draft_id: "guide_working_draft_1",
  guide_step_id: "step_1",
  annotation_type: "highlight",
  annotation_index: 1,
  x: 0.1,
  y: 0.2,
  width: 0.3,
  height: 0.4,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const step = {
  id: "step_1",
  organization_id: "org_1",
  project_id: "project_1",
  guide_working_draft_id: "guide_working_draft_1",
  guide_block_id: "block_1",
  source_capture_session_id: "session_1",
  source_capture_event_id: "event_1",
  source_capture_asset_id: "asset_1",
  selected_capture_asset_id: null,
  screenshot_hidden: false,
  display_capture_asset_id: "asset_1",
  title: "Click Save",
  body: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
  annotations: [annotation],
};

const block = {
  id: "block_1",
  organization_id: "org_1",
  project_id: "project_1",
  guide_working_draft_id: "guide_working_draft_1",
  block_type: "step",
  title: null,
  body: null,
  block_index: 1,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
  step,
};

const source_asset = {
  id: "asset_1",
  capture_session_id: "session_1",
  asset_type: "screenshot",
  width: 1280,
  height: 720,
  device_pixel_ratio: 1,
  page_url: "https://example.test",
  page_title: "Example",
  captured_at: "2026-07-07T00:00:00.000Z",
  file_url: "/api/v1/projects/project_1/capture-sessions/session_1/assets/asset_1/file",
  file: {
    id: "file_1",
    original_name: "screen.png",
    mime_type: "image/png",
    size_bytes: 100,
  },
};

describe("guide shared contracts", () => {
  it("separates immutable identity, edition metadata, and working draft state", () => {
    expect(GuideArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(GuideEditionSchema.parse(edition)).toEqual(edition);
    expect(GuideWorkingDraftSchema.parse(working_draft)).toEqual(working_draft);
    expect(() => GuideArtifactSchema.parse({ ...artifact, title: "wrong owner" })).toThrow();
  });

  it("parses relational guide detail DTOs", () => {
    expect(GuideDetailSchema.parse({
      artifact,
      edition,
      working_draft,
      authored_updated_at: edition.updated_at,
      guide_blocks: [block],
      source_capture_assets: [source_asset],
    })).toMatchObject({
      artifact: { id: "guide_1" },
      edition: { id: "guide_edition_1" },
      working_draft: { id: "guide_working_draft_1", version: 1 },
      guide_blocks: [{
        id: "block_1",
        step: { id: "step_1", annotations: [{ id: "ann_1" }] },
      }],
      source_capture_assets: [{ id: "asset_1" }],
    });
  });

  it("requires explicit scope and concurrency and rejects legacy/unknown input", () => {
    expect(GuideVersionQuerySchema.parse({ project_version_id: " version_1 " }))
      .toEqual({ project_version_id: "version_1" });

    expect(() => CreateGuideFromCaptureRequestSchema.parse({
      title: " Guide ",
      ignored_client_field: true,
    })).toThrow();

    expect(CreateGuideBlockRequestSchema.parse({
      block_type: "header",
      title: "Intro",
      expected_working_draft_version: 1,
    })).toEqual({
      block_type: "header",
      title: "Intro",
      expected_working_draft_version: 1,
    });

    expect(() => CreateGuideBlockRequestSchema.parse({ block_type: "capture" }))
      .toThrow();

    expect(UpdateGuideRequestSchema.parse({
      title: "Updated",
      expected_edition_version: 1,
    })).toEqual({ title: "Updated", expected_edition_version: 1 });
    expect(() => UpdateGuideRequestSchema.parse({
      status: "archived",
      expected_edition_version: 1,
    })).toThrow();
  });

  it("validates params, reorder input, annotations, and upload response composition", () => {
    expect(GuideWorkingDraftMutationResponseSchema.parse({
      working_draft,
    })).toEqual({ working_draft });
    expect(() => GuideWorkingDraftMutationResponseSchema.parse({
      working_draft,
      version: 2,
    })).toThrow();

    expect(GuideBlockParamsSchema.parse({
      project_id: " project_1 ",
      guide_id: " guide_1 ",
      guide_block_id: " block_1 ",
    })).toEqual({
      project_id: "project_1",
      guide_id: "guide_1",
      guide_block_id: "block_1",
    });

    expect(ReorderGuideBlocksRequestSchema.parse({
      block_ids: [" block_1 "],
      expected_working_draft_version: 1,
    })).toEqual({ block_ids: ["block_1"], expected_working_draft_version: 1 });

    expect(() => UpdateGuideBlockAnnotationsRequestSchema.parse({
      annotations: Array.from({ length: 11 }, (_, index) => ({
        id: `ann_${index}`,
        type: "highlight",
        x: 0,
        y: 0,
        width: 0.1,
        height: 0.1,
      })),
      expected_working_draft_version: 1,
    })).toThrow();

    expect(UploadGuideBlockScreenshotResponseSchema.parse({
      guide_block: block,
      working_draft: { ...working_draft, version: 2 },
      capture_asset: {
        ...source_asset,
        organization_id: "org_1",
        project_id: "project_1",
        status: "active",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-07-07T00:00:00.000Z",
        updated_at: "2026-07-07T00:00:00.000Z",
        file: {
          ...source_asset.file,
          storage_provider: "local",
          storage_key: "captures/org/project/session/asset_1.png",
          checksum_sha256: null,
          metadata: null,
        },
      },
    }).capture_asset.file_url).toContain("/assets/asset_1/file");
  });
});
