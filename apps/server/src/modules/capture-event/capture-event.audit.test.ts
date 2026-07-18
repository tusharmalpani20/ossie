import { describe, expect, it } from "vitest";
import {
  build_capture_event_created_event,
  build_capture_events_reordered_event,
} from "./capture-event.audit";
import type { CaptureEvent } from "./capture-event.service";

const event = (id: string, index: number): CaptureEvent => ({
  id,
  organization_id: "01J00000000000000000000002",
  project_id: "01J00000000000000000000003",
  capture_session_id: "01J00000000000000000000004",
  capture_asset_id: null,
  event_type: "click",
  event_index: index,
  occurred_at: "2026-07-19T00:00:00.000Z",
  page_url: "https://private.example",
  page_title: "Page",
  target_label: "Secret label",
  target_selector: "#private",
  target_role: "button",
  target_test_id: "secret-id",
  target_text: "Secret text",
  client_x: 1,
  client_y: 2,
  viewport_width: 100,
  viewport_height: 50,
  device_pixel_ratio: 1,
  input_intent: null,
  input_value_redacted: true,
  note: "private note",
  created_by_id: "01J00000000000000000000005",
  updated_by_id: "01J00000000000000000000005",
  version: 1,
  created_at: "2026-07-19T00:00:00.000Z",
  updated_at: "2026-07-19T00:00:00.000Z",
});
const base = {
  event_id: "01J00000000000000000000000",
  actor_org_user_id: "01J00000000000000000000005",
  actor_label: "Owner",
  occurred_at: "2026-07-19T00:00:00.000Z",
  source_type: "web" as const,
};

describe("Capture Event Audit adapter", () => {
  it("redacts private capture content", () => {
    const audit = build_capture_event_created_event({
      ...base,
      capture_event: event("01J00000000000000000000001", 1),
      metadata_present: false,
    });
    expect(audit.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "page_url",
          after: { state: "redacted" },
        }),
        expect.objectContaining({
          field_name: "target_text",
          after: { state: "redacted" },
        }),
      ]),
    );
    expect(JSON.stringify(audit)).not.toContain("private.example");
  });

  it("emits only logical final index changes for reorder", () => {
    const first = event("01J00000000000000000000001", 1);
    const second = event("01J00000000000000000000006", 2);
    const audit = build_capture_events_reordered_event({
      ...base,
      before: [first, second],
      after: [
        { ...second, event_index: 1, version: 2 },
        { ...first, event_index: 2, version: 2 },
      ],
    });
    expect(audit.items).toHaveLength(2);
    expect(
      audit.items.every(({ field_name }) => field_name === "event_index"),
    ).toBe(true);
    expect(JSON.stringify(audit)).not.toContain("100000");
  });
});
