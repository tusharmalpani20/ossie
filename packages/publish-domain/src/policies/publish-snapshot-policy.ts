import type {
  PublishedGuideSnapshot,
  PublishedInteractiveDemoSnapshot,
  PublishedSnapshotAsset,
} from "@repo/types/publish";
import { InteractiveDemoHasNoPublishableScenesError } from "../errors/publish-domain-error";
import type {
  GuidePublishSourceDetail,
  InteractiveDemoPublishSourceDetail,
} from "../types/publish-domain";

type SourceAsset = GuidePublishSourceDetail["source_capture_assets"][number];

const assets_by_id = (assets: SourceAsset[]) => new Map(
  assets.map((asset) => [asset.id, asset])
);

const public_asset_file_url = (input: {
  slug: string;
  capture_asset_id: string;
}) => `/api/v1/public/publish-links/${input.slug}/assets/${input.capture_asset_id}/file`;

const published_snapshot_asset = (input: {
  asset: SourceAsset;
  slug: string;
}): PublishedSnapshotAsset => ({
  id: input.asset.id,
  asset_type: input.asset.asset_type,
  width: input.asset.width,
  height: input.asset.height,
  page_title: input.asset.page_title,
  page_url: input.asset.page_url,
  file: {
    id: input.asset.file.id,
    original_name: input.asset.file.original_name,
    mime_type: input.asset.file.mime_type,
    size_bytes: input.asset.file.size_bytes,
  },
  file_url: public_asset_file_url({
    slug: input.slug,
    capture_asset_id: input.asset.id,
  }),
});

export const build_published_guide_snapshot = (input: {
  guide_detail: GuidePublishSourceDetail;
  version_number: number;
  published_at: string;
  slug: string;
}): PublishedGuideSnapshot => {
  const assets = assets_by_id(input.guide_detail.source_capture_assets);
  const sorted_blocks = [...input.guide_detail.guide_blocks]
    .sort((left, right) => left.block_index - right.block_index);

  return {
    artifact_type: "guide",
    guide: {
      id: input.guide_detail.artifact.id,
      title: input.guide_detail.edition.title,
      description: input.guide_detail.edition.description,
      source_capture_session_id: input.guide_detail.edition.source_capture_session_id,
      published_version: input.version_number,
      published_at: input.published_at,
    },
    blocks: sorted_blocks.map((block) => {
      const source_asset = block.step?.display_capture_asset_id
        ? assets.get(block.step.display_capture_asset_id) ?? null
        : null;
      const annotations = block.step?.annotations.map((annotation) => ({
        id: annotation.id,
        type: annotation.annotation_type,
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
      }));
      const content = block.step
        ? (annotations?.length ? { annotations } : null)
        : block.title !== null || block.body !== null
          ? { title: block.title, body: block.body }
          : null;

      return {
        id: block.id,
        block_type: block.block_type,
        block_index: block.block_index,
        content,
        step: block.step
          ? {
            id: block.step.id,
            title: block.step.title,
            body: block.step.body,
          }
          : null,
        source_asset: source_asset
          ? published_snapshot_asset({
            asset: source_asset,
            slug: input.slug,
          })
          : null,
      };
    }),
  };
};

const background_asset_for_scene = (
  scene: InteractiveDemoPublishSourceDetail["demo_scenes"][number],
  assets: Map<string, SourceAsset>
) => (
  scene.background_capture_asset_id ? assets.get(scene.background_capture_asset_id) ?? null : null
);

export const build_published_interactive_demo_snapshot = (input: {
  demo_detail: InteractiveDemoPublishSourceDetail;
  version_number: number;
  published_at: string;
  slug: string;
}): PublishedInteractiveDemoSnapshot => {
  const assets = assets_by_id(input.demo_detail.source_capture_assets);
  const scene_ids = new Set(input.demo_detail.demo_scenes.map((scene) => scene.id));
  const hotspots_by_scene = input.demo_detail.demo_hotspots.reduce<
    Record<string, InteractiveDemoPublishSourceDetail["demo_hotspots"]>
  >((groups, hotspot) => {
    groups[hotspot.demo_scene_id] = [...(groups[hotspot.demo_scene_id] ?? []), hotspot];
    return groups;
  }, {});
  const scenes = [...input.demo_detail.demo_scenes]
    .sort((left, right) => left.scene_index - right.scene_index)
    .map((scene) => {
      const background_asset = background_asset_for_scene(scene, assets);

      if (!background_asset) {
        return null;
      }

      return {
        id: scene.id,
        scene_index: scene.scene_index,
        title: scene.title,
        description: scene.description,
        background_asset: published_snapshot_asset({
          asset: background_asset,
          slug: input.slug,
        }),
        hotspots: [...(hotspots_by_scene[scene.id] ?? [])]
          .sort((left, right) => left.hotspot_index - right.hotspot_index)
          .map((hotspot) => ({
            id: hotspot.id,
            hotspot_type: hotspot.hotspot_type,
            label: hotspot.label,
            content: hotspot.content,
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            target_scene_id: hotspot.transition?.target_scene_id
              && scene_ids.has(hotspot.transition.target_scene_id)
              ? hotspot.transition.target_scene_id
              : null,
            hotspot_index: hotspot.hotspot_index,
          })),
      };
    })
    .filter((scene): scene is NonNullable<typeof scene> => Boolean(scene));

  if (scenes.length === 0) {
    throw new InteractiveDemoHasNoPublishableScenesError();
  }

  return {
    artifact_type: "interactive_demo",
    schema_version: 1,
    interactive_demo: {
      id: input.demo_detail.artifact.id,
      title: input.demo_detail.edition.title,
      description: input.demo_detail.edition.description,
      source_capture_session_id: input.demo_detail.edition.source_capture_session_id,
      published_version: input.version_number,
      published_at: input.published_at,
    },
    scenes,
  };
};
