import { describe, expect, it } from "vitest";
import {
  EmptyCaptureSessionUpdateError,
  InvalidCaptureSessionCompletionError,
  InvalidCaptureSessionInputError,
  assert_no_client_lifecycle_timestamp_input,
  assert_non_empty_capture_session_update,
  build_capture_session_asset_file_url,
  build_capture_session_completion_redirect,
  is_valid_capture_session_completion_body,
  normalize_create_capture_session,
  normalize_update_capture_session,
} from "./capture-session-policy";

const capture_session = {
  id: "capture_session_1",
  project_id: "project_1",
  project_version: { slug: "release-2" },
};

const capture_asset = {
  id: "capture_asset_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
};

describe("capture session policy", () => {
  it("normalizes create input strings without owning scope or lifecycle", () => {
    expect(
      normalize_create_capture_session({
        name: "  Session  ",
        project_version_id: "version_2",
        start_immediately: true,
        description: "  Description  ",
        source_type: "extension",
        start_url: "  https://example.com  ",
        browser_name: "  Chrome  ",
        browser_version: "  126  ",
        operating_system: "  Linux  ",
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 2,
        user_agent: "  Agent  ",
        metadata: { mode: "automatic" },
      }),
    ).toEqual({
      name: "Session",
      project_version_id: "version_2",
      start_immediately: true,
      description: "Description",
      source_type: "extension",
      start_url: "https://example.com",
      browser_name: "Chrome",
      browser_version: "126",
      operating_system: "Linux",
      viewport_width: 1440,
      viewport_height: 900,
      device_pixel_ratio: 2,
      user_agent: "Agent",
      metadata: { mode: "automatic" },
    });

    expect(
      normalize_create_capture_session({
        name: "Session",
        project_version_id: "version_1",
        description: "  ",
        start_url: null,
        browser_name: undefined,
      }),
    ).toEqual({
      name: "Session",
      project_version_id: "version_1",
      start_immediately: undefined,
      description: null,
      source_type: undefined,
      start_url: null,
      browser_name: undefined,
      browser_version: undefined,
      operating_system: undefined,
      viewport_width: undefined,
      viewport_height: undefined,
      device_pixel_ratio: undefined,
      user_agent: undefined,
      metadata: undefined,
    });
  });

  it("normalizes update input and rejects empty effective updates", () => {
    const normalized = normalize_update_capture_session({
      name: "  Updated  ",
      description: "  ",
      start_url: "  https://example.com/updated  ",
      browser_name: null,
      metadata: { source: "test" },
    });

    expect(normalized).toEqual({
      name: "Updated",
      description: null,
      start_url: "https://example.com/updated",
      browser_name: null,
      metadata: { source: "test" },
    });
    expect(() =>
      assert_non_empty_capture_session_update(normalized),
    ).not.toThrow();
    expect(() => assert_non_empty_capture_session_update({})).toThrow(
      EmptyCaptureSessionUpdateError,
    );
  });

  it("rejects client-managed lifecycle timestamps", () => {
    expect(() =>
      assert_no_client_lifecycle_timestamp_input({
        started_at: "2026-07-07T00:00:00.000Z",
      }),
    ).toThrow(InvalidCaptureSessionInputError);

    expect(() =>
      assert_no_client_lifecycle_timestamp_input({
        name: "Allowed",
      }),
    ).not.toThrow();
  });

  it("validates completion bodies and builds response helpers", () => {
    expect(is_valid_capture_session_completion_body(undefined)).toBe(true);
    expect(is_valid_capture_session_completion_body({})).toBe(true);
    expect(
      is_valid_capture_session_completion_body({ status: "completed" }),
    ).toBe(false);
    expect(() => {
      if (!is_valid_capture_session_completion_body({ status: "completed" })) {
        throw new InvalidCaptureSessionCompletionError();
      }
    }).toThrow(InvalidCaptureSessionCompletionError);

    expect(build_capture_session_completion_redirect(capture_session)).toEqual({
      path: "/projects/project_1/versions/release-2/capture-sessions/capture_session_1",
      reason: "capture_session_completed",
    });
    expect(build_capture_session_asset_file_url(capture_asset)).toBe(
      "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/file",
    );
  });
});
