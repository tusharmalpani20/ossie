import { describe, expect, it } from "vitest";
import { build_capture_asset_created_event } from "./capture-asset.audit";
import type { CaptureAsset } from "./capture-asset.service";

const asset: CaptureAsset = {
  id: "01J00000000000000000000001",
  organization_id: "01J00000000000000000000002",
  project_id: "01J00000000000000000000003",
  capture_session_id: "01J00000000000000000000004",
  file: {
    id: "01J00000000000000000000005",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 10,
    original_name: "private.png",
    checksum_sha256: "secret-checksum",
  },
  asset_type: "screenshot",
  status: "active",
  width: 100,
  height: 50,
  device_pixel_ratio: 1,
  page_url: "https://private.example",
  page_title: "Page",
  captured_at: "2026-07-19T00:00:00.000Z",
  created_by_id: "01J00000000000000000000006",
  updated_by_id: "01J00000000000000000000006",
  version: 1,
  created_at: "2026-07-19T00:00:00.000Z",
  updated_at: "2026-07-19T00:00:00.000Z",
};
const base = {
  event_id: "01J00000000000000000000000",
  asset,
  actor_org_user_id: asset.updated_by_id,
  actor_label: "Owner",
  occurred_at: "2026-07-19T00:00:00.000Z",
  source_type: "extension" as const,
};

describe("Capture Asset Audit adapter", () => {
  it("covers File and Capture Asset while redacting private storage/source fields", () => {
    const event = build_capture_asset_created_event({
      ...base,
      action: "capture_asset.uploaded",
    });
    expect(
      event.items.filter(({ field_name }) => field_name === null),
    ).toHaveLength(2);
    expect(event.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity_type: "file",
          field_name: "original_name",
          after: { state: "redacted" },
        }),
        expect.objectContaining({
          entity_type: "capture_asset",
          field_name: "page_url",
          after: { state: "redacted" },
        }),
      ]),
    );
    expect(JSON.stringify(event)).not.toContain("private.example");
    expect(JSON.stringify(event)).not.toContain("secret-checksum");
  });
});
