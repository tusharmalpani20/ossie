import { describe, expect, it } from "vitest";
import type { DemoHotspot } from "@repo/types/demo";
import { hotspotDraftFromHotspot } from "./interactiveDemoEditorHelpers";

const now = "2026-07-19T10:00:00.000Z";
const hotspot: DemoHotspot = { id: "hotspot_1", organization_id: "org_1", project_id: "project_1", interactive_demo_working_draft_id: "draft_1", demo_scene_id: "scene_1", hotspot_type: "next", label: null, content: null, x: 0.1, y: 0.1, width: 0.2, height: 0.2, transition: { id: "transition_1", organization_id: "org_1", project_id: "project_1", interactive_demo_working_draft_id: "draft_1", demo_hotspot_id: "hotspot_1", target_scene_id: "scene_2", created_by_id: "user_1", updated_by_id: "user_1", version: 1, created_at: now, updated_at: now }, hotspot_index: 1, created_by_id: "user_1", updated_by_id: "user_1", version: 1, created_at: now, updated_at: now };

describe("interactive Demo editor helpers", () => {
  it("reads target Scene from the relational Transition", () => expect(hotspotDraftFromHotspot(hotspot).target_scene_id).toBe("scene_2"));
});
