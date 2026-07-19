import type {
  GuideBlock,
  GuideDetail,
  GuideScreenshotAnnotation,
  GuideSourceCaptureAsset,
  GuideStep,
  UpdateGuideBlockAnnotationsInput,
} from "./types";

export type StepDraft = {
  title: string;
  body: string;
};

export type BlockContentDraft = {
  title: string;
  body: string;
};

export const sortBlocks = (blocks: GuideBlock[]) => (
  [...blocks].sort((left, right) => left.block_index - right.block_index)
);

export const assetAltText = (asset: GuideSourceCaptureAsset, stepNumber: number) => (
  asset.page_title ?? asset.file.original_name ?? `Step ${stepNumber} screenshot`
);

export const assetDisplayName = (asset: GuideSourceCaptureAsset) => (
  asset.page_title ?? asset.file.original_name ?? "Untitled screenshot"
);

export const formatCapturedAt = (value: string) => {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
};

export const screenshotViewerImageId = (block: GuideBlock, asset: GuideSourceCaptureAsset) => (
  `${block.id}:${asset.id}`
);

export const assetForBlock = (
  block: GuideBlock,
  assetsById: Map<string, GuideSourceCaptureAsset>
) => {
  const source_capture_asset_id = block.step?.display_capture_asset_id ?? null;
  return source_capture_asset_id ? assetsById.get(source_capture_asset_id) : undefined;
};

export const stepDraftsFromBlocks = (blocks: GuideBlock[]) => blocks.reduce<Record<string, StepDraft>>((drafts, block) => {
  if (block.step) {
    drafts[block.step.id] = {
      title: block.step.title,
      body: block.step.body ?? "",
    };
  }

  return drafts;
}, {});

export const blockContentDraftsFromBlocks = (blocks: GuideBlock[]) => blocks.reduce<Record<string, BlockContentDraft>>((drafts, block) => {
  if (block.block_type === "header" || block.block_type === "paragraph" || block.block_type === "tip" || block.block_type === "alert") {
    drafts[block.id] = {
      title: block.title ?? "",
      body: block.body ?? "",
    };
  }

  return drafts;
}, {});

export const updateStepInBlocks = (blocks: GuideBlock[], guideStep: GuideStep) => (
  blocks.map((block) => (
    block.step?.id === guideStep.id
      ? { ...block, step: guideStep }
      : block
  ))
);

export const updateBlockInBlocks = (blocks: GuideBlock[], guideBlock: GuideBlock) => (
  blocks.map((block) => (
    block.id === guideBlock.id
      ? guideBlock
      : block
  ))
);

export const annotationsFromBlock = (block: GuideBlock): GuideScreenshotAnnotation[] => (
  block.step?.annotations.map((annotation) => ({ ...annotation, type: annotation.annotation_type })) ?? []
);

export const defaultHighlightAnnotation = (): UpdateGuideBlockAnnotationsInput["annotations"][number] => ({
  type: "highlight",
  x: 0.65,
  y: 0.12,
  width: 0.18,
  height: 0.08,
});

export const annotationPercent = (value: number) => `${Number((value * 100).toFixed(4))}%`;

export const mergeAssetIntoDetail = (
  detail: GuideDetail,
  asset: GuideSourceCaptureAsset | undefined
): GuideDetail => {
  if (!asset || detail.source_capture_assets.some((candidate) => candidate.id === asset.id)) {
    return detail;
  }

  return {
    ...detail,
    source_capture_assets: [...detail.source_capture_assets, asset],
  };
};

export const defaultBlockInput = (
  blockType: "step" | "header" | "paragraph" | "tip" | "alert" | "divider",
  position?: { placement: "before" | "after"; guide_block_id: string }
) => {
  if (blockType === "step") {
    return {
      block_type: blockType,
      ...(position ? { position } : {}),
      step: {
        title: "New step",
        body: null,
      },
    };
  }

  if (blockType === "header") {
    return {
      block_type: blockType,
      ...(position ? { position } : {}),
      content: {
        title: "New section",
      },
    };
  }

  if (blockType === "paragraph") {
    return {
      block_type: blockType,
      ...(position ? { position } : {}),
      content: {
        body: "Add supporting context.",
      },
    };
  }

  if (blockType === "divider") {
    return {
      block_type: blockType,
      ...(position ? { position } : {}),
    };
  }

  return {
    block_type: blockType,
    ...(position ? { position } : {}),
    content: {
      body: blockType === "tip" ? "Add a helpful tip." : "Add an important note.",
    },
  };
};
