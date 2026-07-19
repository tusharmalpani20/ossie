import {
  UnsupportedScreenshotUploadMimeTypeError,
  UploadTooLargeError as FileDomainUploadTooLargeError,
} from "@repo/file-domain";
import { describe, expect, it } from "vitest";
import {
  InvalidCaptureAssetInputError,
  CaptureAssetLifecycleConflictError,
  UnsupportedCaptureAssetTypeError,
  UnsupportedCaptureAssetUploadTypeError,
  UploadTooLargeError,
  assert_capture_asset_transition,
  assert_project_screenshot_picker_asset_type,
  map_file_domain_upload_policy_error,
  normalize_create_capture_asset,
  normalize_upload_capture_asset,
} from "./capture-asset-policy";

describe("capture asset policy", () => {
  it("allows only active/archive lifecycle transitions", () => {
    expect(assert_capture_asset_transition("active", "archive")).toBe(
      "archived",
    );
    expect(assert_capture_asset_transition("archived", "restore")).toBe(
      "active",
    );
    expect(() =>
      assert_capture_asset_transition("archived", "archive"),
    ).toThrow(CaptureAssetLifecycleConflictError);
    expect(() => assert_capture_asset_transition("active", "restore")).toThrow(
      CaptureAssetLifecycleConflictError,
    );
  });

  it("normalizes screenshot metadata through file-domain metadata policy", () => {
    expect(
      normalize_create_capture_asset({
        asset_type: "screenshot",
        width: 1440,
        height: 900,
        device_pixel_ratio: 2,
        page_url: "  https://example.com  ",
        page_title: "  Example  ",
        captured_at: "  2026-07-07T00:00:00.000Z  ",
        metadata: { source: "manual" },
        file: {
          storage_key: "  org/project/file.png  ",
          mime_type: " image/png ",
          size_bytes: 1024,
          original_name: " screenshot.png ",
          checksum_sha256: " abc123 ",
        },
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
        storage_key: "org/project/file.png",
        mime_type: "image/png",
        size_bytes: 1024,
        original_name: "screenshot.png",
        checksum_sha256: "abc123",
        metadata: undefined,
      },
    });
  });

  it("rejects unsupported asset metadata and picker asset types", () => {
    expect(() =>
      normalize_create_capture_asset({
        asset_type: "html_snapshot",
        file: {
          storage_key: "key",
          mime_type: "image/png",
          size_bytes: 1,
        },
      }),
    ).toThrow(UnsupportedCaptureAssetTypeError);

    expect(() =>
      normalize_create_capture_asset({
        asset_type: "screenshot",
        file: {
          storage_key: "key",
          mime_type: "text/plain",
          size_bytes: 1,
        },
      }),
    ).toThrow(InvalidCaptureAssetInputError);

    expect(assert_project_screenshot_picker_asset_type(undefined)).toBe(
      "screenshot",
    );
    expect(assert_project_screenshot_picker_asset_type("screenshot")).toBe(
      "screenshot",
    );
    expect(
      assert_project_screenshot_picker_asset_type("redacted_screenshot"),
    ).toBe("redacted_screenshot");
    expect(() =>
      assert_project_screenshot_picker_asset_type("html_snapshot"),
    ).toThrow(UnsupportedCaptureAssetTypeError);
  });

  it("normalizes upload metadata and maps file-domain upload policy errors", () => {
    expect(
      normalize_upload_capture_asset({
        width: 1440,
        height: 900,
        device_pixel_ratio: 2,
        page_url: "  https://example.com  ",
        page_title: "  Example  ",
        captured_at: "  2026-07-07T00:00:00.000Z  ",
        metadata: { source: "extension" },
      }),
    ).toEqual({
      width: 1440,
      height: 900,
      device_pixel_ratio: 2,
      page_url: "https://example.com",
      page_title: "Example",
      captured_at: "2026-07-07T00:00:00.000Z",
      metadata: { source: "extension" },
    });

    expect(
      map_file_domain_upload_policy_error(
        new UnsupportedScreenshotUploadMimeTypeError(),
      ),
    ).toBeInstanceOf(UnsupportedCaptureAssetUploadTypeError);
    expect(
      map_file_domain_upload_policy_error(new FileDomainUploadTooLargeError()),
    ).toBeInstanceOf(UploadTooLargeError);
    expect(map_file_domain_upload_policy_error(new Error("other"))).toBeNull();
  });
});
