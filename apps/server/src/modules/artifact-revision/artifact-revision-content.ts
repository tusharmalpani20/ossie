import { createHash } from "node:crypto";

type NullableText = string | null | undefined;
type AnnotationInput = {
  id?: string;
  version?: number;
  annotation_type: string;
  annotation_index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
type GuideStepInput = {
  id?: string;
  version?: number;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  selected_capture_asset_id: string | null;
  screenshot_hidden: boolean;
  title: string;
  body: NullableText;
  annotations: readonly AnnotationInput[];
};
type GuideBlockInput = {
  id?: string;
  version?: number;
  block_type: string;
  title: NullableText;
  body: NullableText;
  block_index: number;
  step: GuideStepInput | null;
};
type GuideContentInput = {
  title: string;
  description: NullableText;
  blocks: readonly GuideBlockInput[];
};

type DemoTransitionInput = { target_scene_id: string };
type DemoHotspotInput = {
  id?: string;
  version?: number;
  hotspot_type: string;
  label: NullableText;
  content: NullableText;
  x: number;
  y: number;
  width: number;
  height: number;
  hotspot_index: number;
  transition: DemoTransitionInput | null;
};
type DemoSceneInput = {
  id: string;
  version?: number;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  background_capture_asset_id: string | null;
  scene_index: number;
  title: NullableText;
  description: NullableText;
  hotspots: readonly DemoHotspotInput[];
};
type DemoContentInput = {
  title: string;
  description: NullableText;
  scenes: readonly DemoSceneInput[];
};

const nullable_text = (value: NullableText) => value ?? null;
const decimal = (value: number) => Number(value);

const assert_dense_order = (values: readonly number[], label: string) => {
  if (values.some((value, index) => value !== index + 1)) {
    throw new Error(`${label} order must be dense and start at one`);
  }
};

export const canonicalize_guide_revision_content = (
  input: GuideContentInput,
) => {
  const blocks = [...input.blocks].sort(
    (left, right) => left.block_index - right.block_index,
  );
  assert_dense_order(
    blocks.map((block) => block.block_index),
    "Guide block",
  );
  return {
    artifact_type: "guide" as const,
    title: input.title,
    description: nullable_text(input.description),
    blocks: blocks.map((block) => {
      if ((block.block_type === "step") !== Boolean(block.step)) {
        throw new Error("Guide step content does not match its block type");
      }
      const annotations = block.step
        ? [...block.step.annotations].sort(
            (left, right) => left.annotation_index - right.annotation_index,
          )
        : [];
      assert_dense_order(
        annotations.map((annotation) => annotation.annotation_index),
        "Guide annotation",
      );
      return {
        block_type: block.block_type,
        title: nullable_text(block.title),
        body: nullable_text(block.body),
        block_index: block.block_index,
        step: block.step
          ? {
              source_capture_session_id: block.step.source_capture_session_id,
              source_capture_event_id: block.step.source_capture_event_id,
              source_capture_asset_id: block.step.source_capture_asset_id,
              selected_capture_asset_id: block.step.selected_capture_asset_id,
              screenshot_hidden: block.step.screenshot_hidden,
              title: block.step.title,
              body: nullable_text(block.step.body),
              annotations: annotations.map((annotation) => ({
                annotation_type: annotation.annotation_type,
                annotation_index: annotation.annotation_index,
                x: decimal(annotation.x),
                y: decimal(annotation.y),
                width: decimal(annotation.width),
                height: decimal(annotation.height),
              })),
            }
          : null,
      };
    }),
  };
};

export const canonicalize_demo_revision_content = (input: DemoContentInput) => {
  const scenes = [...input.scenes].sort(
    (left, right) => left.scene_index - right.scene_index,
  );
  assert_dense_order(
    scenes.map((scene) => scene.scene_index),
    "Demo scene",
  );
  const scene_positions = new Map(
    scenes.map((scene) => [scene.id, scene.scene_index]),
  );
  return {
    artifact_type: "interactive_demo" as const,
    title: input.title,
    description: nullable_text(input.description),
    scenes: scenes.map((scene) => {
      const hotspots = [...scene.hotspots].sort(
        (left, right) => left.hotspot_index - right.hotspot_index,
      );
      assert_dense_order(
        hotspots.map((hotspot) => hotspot.hotspot_index),
        "Demo hotspot",
      );
      return {
        source_capture_session_id: scene.source_capture_session_id,
        source_capture_event_id: scene.source_capture_event_id,
        source_capture_asset_id: scene.source_capture_asset_id,
        background_capture_asset_id: scene.background_capture_asset_id,
        scene_index: scene.scene_index,
        title: nullable_text(scene.title),
        description: nullable_text(scene.description),
        hotspots: hotspots.map((hotspot) => {
          const target_scene_index = hotspot.transition
            ? scene_positions.get(hotspot.transition.target_scene_id)
            : null;
          if (hotspot.transition && target_scene_index === undefined) {
            throw new Error("Demo transition target must belong to the graph");
          }
          return {
            hotspot_type: hotspot.hotspot_type,
            label: nullable_text(hotspot.label),
            content: nullable_text(hotspot.content),
            x: decimal(hotspot.x),
            y: decimal(hotspot.y),
            width: decimal(hotspot.width),
            height: decimal(hotspot.height),
            hotspot_index: hotspot.hotspot_index,
            target_scene_index,
          };
        }),
      };
    }),
  };
};

export const hash_revision_content = (content: unknown) =>
  createHash("sha256").update(JSON.stringify(content)).digest("hex");
