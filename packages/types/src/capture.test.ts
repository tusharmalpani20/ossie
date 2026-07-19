import { describe, expect, it } from "vitest";
import {
  CaptureAssetParamsSchema,
  CaptureAssetListQuerySchema,
  CaptureAssetLifecycleRequestSchema,
  CaptureAssetProtectionResponseSchema,
  CaptureAssetPurgeResponseSchema,
  CaptureAssetResponseSchema,
  CaptureEventParamsSchema,
  CaptureEventResponseSchema,
  CaptureSessionDetailResponseSchema,
  CompleteCaptureSessionResponseSchema,
  CreateCaptureAssetRequestSchema,
  CreateCaptureEventRequestSchema,
  CreateCaptureSessionRequestSchema,
  CaptureSessionListQuerySchema,
  ProjectCaptureAssetListQuerySchema,
  ProjectCaptureAssetListResponseSchema,
  ProjectCaptureSessionParamsSchema,
  ReassignCaptureSessionProjectVersionRequestSchema,
  ReorderCaptureEventsRequestSchema,
  UpdateCaptureEventRequestSchema,
  UpdateCaptureSessionRequestSchema,
} from "./capture";

const captureSession = {
  id: "capture_session_1",
  organization_id: "org_1",
  project_id: "project_1",
  project_version_id: "version_1",
  project_version: {
    id: "version_1",
    name: "Main",
    slug: "main",
    status: "active",
    position: 1,
  },
  name: "Session",
  description: null,
  status: "capturing",
  source_type: "extension",
  started_at: null,
  completed_at: null,
  canceled_at: null,
  start_url: "https://example.com",
  browser_name: "Chrome",
  browser_version: "126",
  operating_system: "Linux",
  viewport_width: 1440,
  viewport_height: 900,
  device_pixel_ratio: 1,
  user_agent: "agent",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const captureEvent = {
  id: "capture_event_1",
  organization_id: "org_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  capture_asset_id: "capture_asset_1",
  event_type: "click",
  event_index: 1,
  occurred_at: "2026-07-07T00:00:00.000Z",
  page_url: "https://example.com",
  page_title: "Example",
  target_label: null,
  target_selector: null,
  target_role: null,
  target_test_id: null,
  target_text: null,
  client_x: 10,
  client_y: 20,
  viewport_width: 1440,
  viewport_height: 900,
  device_pixel_ratio: 1,
  input_intent: null,
  input_value_redacted: true,
  note: null,
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

const captureAsset = {
  id: "capture_asset_1",
  organization_id: "org_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_1",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 1024,
    original_name: null,
    checksum_sha256: null,
  },
  asset_type: "screenshot",
  status: "active",
  width: 1440,
  height: 900,
  device_pixel_ratio: 1,
  page_url: "https://example.com",
  page_title: "Example",
  captured_at: "2026-07-07T00:00:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
};

describe("capture contracts", () => {
  it("models Capture Asset lifecycle and archived session-list inclusion", () => {
    expect(
      CaptureAssetResponseSchema.parse({ capture_asset: captureAsset }),
    ).toEqual({ capture_asset: captureAsset });
    expect(
      CaptureAssetListQuerySchema.parse({ include_archived: "true" }),
    ).toEqual({ include_archived: true });
    expect(
      ProjectCaptureAssetListQuerySchema.safeParse({
        project_version_id: "version_1",
        include_archived: true,
      }).success,
    ).toBe(false);
  });

  it("validates protected Asset lifecycle, dependency, and purge results", () => {
    expect(
      CaptureAssetLifecycleRequestSchema.parse({ expected_asset_version: 2 }),
    ).toEqual({ expected_asset_version: 2 });
    expect(
      CaptureAssetProtectionResponseSchema.parse({
        capture_asset_id: "capture_asset_1",
        status: "archived",
        purge_operation_status: null,
        can_purge: false,
        total_dependency_count: 1,
        dependencies: [
          {
            dependency_type: "guide_working_draft",
            artifact_id: "guide_1",
            edition_id: "edition_1",
          },
        ],
      }).dependencies,
    ).toHaveLength(1);
    expect(
      CaptureAssetPurgeResponseSchema.parse({
        capture_asset_id: "capture_asset_1",
        purge_operation_id: "purge_1",
        status: "completed",
        attempt_count: 1,
      }).status,
    ).toBe("completed");
  });

  it("matches existing item route param names", () => {
    expect(
      ProjectCaptureSessionParamsSchema.parse({
        project_id: " project_1 ",
        id: " capture_session_1 ",
      }),
    ).toEqual({
      project_id: "project_1",
      id: "capture_session_1",
    });

    expect(
      CaptureEventParamsSchema.parse({
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        id: " capture_event_1 ",
      }),
    ).toEqual({
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      id: "capture_event_1",
    });

    expect(
      CaptureAssetParamsSchema.parse({
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        id: " capture_asset_1 ",
      }),
    ).toEqual({
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      id: "capture_asset_1",
    });
  });

  it("preserves capture session request passthrough and response shapes", () => {
    expect(
      CreateCaptureSessionRequestSchema.parse({
        name: " Session ",
        project_version_id: " version_1 ",
        start_immediately: true,
        source_type: "extension",
        metadata: {
          mode: "automatic",
        },
        ignored_but_allowed: true,
      }),
    ).toEqual({
      name: "Session",
      project_version_id: "version_1",
      start_immediately: true,
      source_type: "extension",
      metadata: {
        mode: "automatic",
      },
      ignored_but_allowed: true,
    });

    expect(
      UpdateCaptureSessionRequestSchema.parse({
        status: "completed",
        ignored_but_allowed: true,
      }),
    ).toEqual({
      status: "completed",
      ignored_but_allowed: true,
    });

    expect(
      CompleteCaptureSessionResponseSchema.parse({
        capture_session: captureSession,
        redirect: {
          path: "/projects/project_1/versions/main/capture-sessions/capture_session_1",
          reason: "capture_session_completed",
        },
      }).redirect.reason,
    ).toBe("capture_session_completed");
  });

  it("requires explicit Project Version collection and reassignment context", () => {
    expect(
      CreateCaptureSessionRequestSchema.safeParse({ name: "Session" }).success,
    ).toBe(false);
    expect(
      CaptureSessionListQuerySchema.parse({
        project_version_id: " version_1 ",
        status: "draft",
      }),
    ).toEqual({ project_version_id: "version_1", status: "draft" });
    expect(
      CaptureSessionListQuerySchema.safeParse({ status: "draft" }).success,
    ).toBe(false);
    expect(
      ProjectCaptureAssetListQuerySchema.parse({
        project_version_id: " version_1 ",
        asset_type: "screenshot",
      }),
    ).toEqual({ project_version_id: "version_1", asset_type: "screenshot" });
    expect(
      ReassignCaptureSessionProjectVersionRequestSchema.parse({
        project_version_id: " version_2 ",
        expected_version: 1,
      }),
    ).toEqual({ project_version_id: "version_2", expected_version: 1 });
    expect(
      ReassignCaptureSessionProjectVersionRequestSchema.safeParse({
        project_version_id: "version_2",
        expected_version: 1,
        extra: true,
      }).success,
    ).toBe(false);
  });

  it("validates capture event create, update, reorder, and response shapes", () => {
    expect(
      CreateCaptureEventRequestSchema.parse({
        event_type: "click",
        event_index: 1,
        capture_asset_id: " capture_asset_1 ",
        input_value_redacted: true,
        raw_extra_is_allowed_until_privacy_check: "x",
      }),
    ).toEqual({
      event_type: "click",
      event_index: 1,
      capture_asset_id: "capture_asset_1",
      input_value_redacted: true,
      raw_extra_is_allowed_until_privacy_check: "x",
    });

    expect(UpdateCaptureEventRequestSchema.safeParse({}).success).toBe(false);
    expect(
      UpdateCaptureEventRequestSchema.safeParse({
        note: "Updated",
        unexpected: true,
      }).success,
    ).toBe(false);
    expect(
      ReorderCaptureEventsRequestSchema.parse({
        event_ids: [" event_1 "],
      }),
    ).toEqual({
      event_ids: ["event_1"],
    });
    expect(
      CaptureEventResponseSchema.parse({ capture_event: captureEvent }),
    ).toEqual({
      capture_event: captureEvent,
    });
  });

  it("validates capture asset response variants and detail responses", () => {
    expect(
      CreateCaptureAssetRequestSchema.parse({
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 2,
        page_url: "https://example.com",
        page_title: "Example",
        captured_at: "2026-07-07T00:00:00.000Z",
        metadata: { source: "manual" },
        file: {
          storage_provider: "local",
          storage_key: " storage/key.png ",
          mime_type: " image/png ",
          size_bytes: 1024,
          original_name: "screenshot.png",
          checksum_sha256: null,
          ignored_file_metadata: true,
        },
        ignored_but_allowed: true,
      }),
    ).toEqual({
      asset_type: "screenshot",
      width: 1440,
      height: 900,
      device_pixel_ratio: 2,
      page_url: "https://example.com",
      page_title: "Example",
      captured_at: "2026-07-07T00:00:00.000Z",
      metadata: { source: "manual" },
      file: {
        storage_provider: "local",
        storage_key: "storage/key.png",
        mime_type: "image/png",
        size_bytes: 1024,
        original_name: "screenshot.png",
        checksum_sha256: null,
        ignored_file_metadata: true,
      },
      ignored_but_allowed: true,
    });

    expect(
      CaptureAssetListQuerySchema.parse({
        asset_type: "screenshot",
      }),
    ).toEqual({
      asset_type: "screenshot",
    });

    expect(
      CaptureAssetResponseSchema.parse({ capture_asset: captureAsset }),
    ).toEqual({
      capture_asset: captureAsset,
    });

    expect(
      ProjectCaptureAssetListResponseSchema.parse({
        capture_assets: [
          {
            ...captureAsset,
            file_url:
              "/api/v1/projects/project_1/capture-assets/capture_asset_1/file",
          },
        ],
      }).capture_assets[0]?.file_url,
    ).toContain("/file");

    expect(
      CaptureSessionDetailResponseSchema.parse({
        capture_session: captureSession,
        capture_events: [captureEvent],
        capture_assets: [
          {
            ...captureAsset,
            file_url:
              "/api/v1/projects/project_1/capture-assets/capture_asset_1/file",
          },
        ],
      }).capture_assets,
    ).toHaveLength(1);
  });
});
