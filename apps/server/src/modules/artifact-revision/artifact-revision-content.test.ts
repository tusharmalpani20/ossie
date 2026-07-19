import { describe, expect, it } from "vitest";
import {
  canonicalize_demo_revision_content,
  canonicalize_guide_revision_content,
  hash_revision_content,
} from "./artifact-revision-content";

describe("Artifact Revision canonical content", () => {
  it("ignores mutable identities and Row Versions while detecting authored changes", () => {
    const first = {
      title: "Guide",
      description: null,
      blocks: [
        {
          id: "block_1",
          version: 4,
          block_type: "step",
          title: null,
          body: null,
          block_index: 1,
          step: {
            id: "step_1",
            version: 8,
            source_capture_session_id: "session_1",
            source_capture_event_id: "event_1",
            source_capture_asset_id: "asset_1",
            selected_capture_asset_id: null,
            screenshot_hidden: false,
            title: "Open settings",
            body: null,
            annotations: [
              {
                id: "annotation_1",
                version: 2,
                annotation_type: "highlight",
                annotation_index: 1,
                x: 0.1,
                y: 0.2,
                width: 0.3,
                height: 0.4,
              },
            ],
          },
        },
      ],
    } as const;
    const copied = structuredClone(first) as any;
    copied.blocks[0].id = "block_2";
    copied.blocks[0].version = 1;
    copied.blocks[0].step.id = "step_2";
    copied.blocks[0].step.version = 1;
    copied.blocks[0].step.annotations[0].id = "annotation_2";

    expect(
      hash_revision_content(canonicalize_guide_revision_content(first)),
    ).toBe(hash_revision_content(canonicalize_guide_revision_content(copied)));
    copied.blocks[0].step.title = "Open account settings";
    expect(
      hash_revision_content(canonicalize_guide_revision_content(first)),
    ).not.toBe(
      hash_revision_content(canonicalize_guide_revision_content(copied)),
    );
  });

  it("canonicalizes Demo transitions by scene position instead of mutable IDs", () => {
    const content = {
      title: "Demo",
      description: "Flow",
      scenes: [
        {
          id: "scene_a",
          scene_index: 1,
          title: "A",
          description: null,
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          background_capture_asset_id: "asset_1",
          hotspots: [
            {
              id: "hotspot_a",
              hotspot_index: 1,
              hotspot_type: "click",
              label: null,
              content: null,
              x: 0.1,
              y: 0.1,
              width: 0.2,
              height: 0.2,
              transition: { target_scene_id: "scene_b" },
            },
          ],
        },
        {
          id: "scene_b",
          scene_index: 2,
          title: "B",
          description: null,
          source_capture_session_id: null,
          source_capture_event_id: null,
          source_capture_asset_id: null,
          background_capture_asset_id: "asset_2",
          hotspots: [],
        },
      ],
    } as const;
    const copied = structuredClone(content) as any;
    copied.scenes[0].id = "scene_c";
    copied.scenes[1].id = "scene_d";
    copied.scenes[0].hotspots[0].id = "hotspot_c";
    copied.scenes[0].hotspots[0].transition.target_scene_id = "scene_d";

    expect(canonicalize_demo_revision_content(content)).toEqual(
      canonicalize_demo_revision_content(copied),
    );
  });

  it("rejects gapped ordering and cross-graph Demo transition targets", () => {
    expect(() =>
      canonicalize_guide_revision_content({
        title: "Guide",
        description: null,
        blocks: [
          {
            id: "block_1",
            block_type: "paragraph",
            title: null,
            body: "Body",
            block_index: 2,
            step: null,
          },
        ],
      }),
    ).toThrow(/order/i);
    expect(() =>
      canonicalize_demo_revision_content({
        title: "Demo",
        description: null,
        scenes: [
          {
            id: "scene_1",
            scene_index: 1,
            title: null,
            description: null,
            source_capture_session_id: null,
            source_capture_event_id: null,
            source_capture_asset_id: null,
            background_capture_asset_id: null,
            hotspots: [
              {
                id: "hotspot_1",
                hotspot_index: 1,
                hotspot_type: "click",
                label: null,
                content: null,
                x: 0.1,
                y: 0.1,
                width: 0.2,
                height: 0.2,
                transition: { target_scene_id: "missing" },
              },
            ],
          },
        ],
      }),
    ).toThrow(/target/i);
  });
});
