import { describe, expect, it } from "vitest";
import {
  build_capture_session_created_event,
  build_capture_session_deleted_event,
  build_capture_session_updated_event,
} from "./capture-session.audit";
import type { CaptureSession } from "./capture-session.service";

const session: CaptureSession = {
  id: "01J00000000000000000000001",
  organization_id: "01J00000000000000000000002",
  project_id: "01J00000000000000000000003",
  name: "Capture",
  description: null,
  status: "draft",
  source_type: "extension",
  started_at: null,
  completed_at: null,
  canceled_at: null,
  start_url: "https://private.example/start",
  browser_name: "Browser",
  browser_version: "1",
  operating_system: "OS",
  viewport_width: 1280,
  viewport_height: 720,
  device_pixel_ratio: 1,
  user_agent: "private-agent",
  created_by_id: "01J00000000000000000000004",
  updated_by_id: "01J00000000000000000000004",
  version: 1,
  created_at: "2026-07-19T00:00:00.000Z",
  updated_at: "2026-07-19T00:00:00.000Z",
};
const base = {
  event_id: "01J00000000000000000000000",
  actor_org_user_id: session.updated_by_id,
  actor_label: "Owner",
  occurred_at: "2026-07-19T00:00:00.000Z",
};

describe("Capture Session Audit adapter", () => {
  it("redacts environment/private URL fields on creation", () => {
    const event = build_capture_session_created_event({
      ...base,
      session,
      metadata_present: true,
    });
    expect(event.source_type).toBe("extension");
    expect(event.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "start_url",
          after: { state: "redacted" },
        }),
        expect.objectContaining({
          field_name: "user_agent",
          after: { state: "redacted" },
        }),
        expect.objectContaining({
          field_name: "metadata",
          after: { state: "redacted" },
        }),
      ]),
    );
    expect(JSON.stringify(event)).not.toContain("private.example");
  });

  it("records only changed fields and soft deletion", () => {
    const updated = build_capture_session_updated_event({
      ...base,
      before: session,
      after: { ...session, name: "Changed", version: 2 },
      action: "capture_session.updated",
      metadata_changed: false,
    });
    expect(updated.items).toEqual([
      expect.objectContaining({ field_name: "name", operation: "update" }),
    ]);
    expect(
      build_capture_session_deleted_event({
        ...base,
        before: session,
        after: { ...session, version: 2 },
      }).items,
    ).toEqual([expect.objectContaining({ operation: "delete" })]);
  });
});
