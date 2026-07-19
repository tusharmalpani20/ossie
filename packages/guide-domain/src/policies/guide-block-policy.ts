import type {
  GuideBlock,
  GuideBlockType,
  UpdateGuideBlockAnnotationsInput,
  UpdateGuideBlockInput,
  UpdateGuideBlockScreenshotInput,
} from "@repo/types/guide";
import {
  GuideBlockNotFoundError,
  InvalidGuideBlockContentError,
  InvalidGuideBlockOrderError,
  InvalidGuideBlockScreenshotError,
} from "../errors/guide-domain-error";
import type {
  GuideAnnotationIdFactory,
  NormalizedCreateGuideBlockInput,
  NormalizedUpdateGuideBlockAnnotationsInput,
  NormalizedUpdateGuideBlockInput,
  NormalizedUpdateGuideBlockScreenshotInput,
} from "../types/guide-domain";
import { cap_guide_title, compact_optional_string } from "./guide-generation-policy";

export {
  GuideBlockNotFoundError,
  InvalidGuideBlockContentError,
  InvalidGuideBlockOrderError,
  InvalidGuideBlockScreenshotError,
};

export const normalize_guide_block_ids = (block_ids: string[]) => {
  const normalized = block_ids.map((id) => id.trim()).filter(Boolean);

  if (normalized.length === 0) {
    throw new InvalidGuideBlockOrderError();
  }

  if (new Set(normalized).size !== normalized.length) {
    throw new InvalidGuideBlockOrderError();
  }

  return normalized;
};

export const assert_guide_block_order_covers_active_blocks = (
  block_ids: string[],
  active_blocks: Array<Pick<GuideBlock, "id">>
) => {
  if (active_blocks.length === 0) {
    throw new InvalidGuideBlockOrderError();
  }

  const active_ids = new Set(active_blocks.map((block) => block.id));

  if (block_ids.some((id) => !active_ids.has(id))) {
    throw new GuideBlockNotFoundError();
  }

  const every_active_block_included = active_ids.size === block_ids.length
    && block_ids.every((id) => active_ids.has(id));

  if (!every_active_block_included) {
    throw new InvalidGuideBlockOrderError();
  }
};

type CreateGuideBlockPolicyInput = {
  block_type: GuideBlockType;
  position?: {
    placement: "before" | "after";
    guide_block_id: string;
  } | null;
  step?: {
    title?: string;
    body?: string | null;
  } | null;
  title?: string | null;
  body?: string | null;
};

const normalize_position = (position: CreateGuideBlockPolicyInput["position"]) => {
  if (!position) {
    return undefined;
  }

  const guide_block_id = compact_optional_string(position.guide_block_id);

  if (!guide_block_id || !["before", "after"].includes(position.placement)) {
    throw new InvalidGuideBlockContentError();
  }

  return {
    placement: position.placement,
    guide_block_id,
  };
};

export const normalize_block_content = (
  block_type: "header" | "paragraph" | "tip" | "alert" | "divider",
  input: { title?: string | null; body?: string | null }
) => {
  const title = compact_optional_string(input.title);
  const body = compact_optional_string(input.body);

  if (block_type === "header") {
    if (!title) {
      throw new InvalidGuideBlockContentError();
    }

    return { title, body: null };
  }

  if (block_type === "paragraph") {
    if (title || !body) {
      throw new InvalidGuideBlockContentError();
    }

    return { title: null, body };
  }

  if (block_type === "divider") {
    if (title || body) {
      throw new InvalidGuideBlockContentError();
    }

    return null;
  }

  if (!title && !body) {
    throw new InvalidGuideBlockContentError();
  }

  return { title, body };
};

const normalize_editable_block_content = (
  block_type: "header" | "paragraph" | "tip" | "alert",
  input: { title?: string | null; body?: string | null }
) => {
  const normalized = normalize_block_content(block_type, input);

  if (!normalized) {
    throw new InvalidGuideBlockContentError();
  }

  return normalized;
};

export const normalize_create_guide_block_input = (
  input: CreateGuideBlockPolicyInput
): NormalizedCreateGuideBlockInput => {
  const position = normalize_position(input.position);

  if (input.block_type === "step") {
    const title = compact_optional_string(input.step?.title);

    if (!title) {
      throw new InvalidGuideBlockContentError();
    }

    return {
      block_type: "step",
      ...(position ? { position } : {}),
      step: {
        title: cap_guide_title(title),
        body: compact_optional_string(input.step?.body),
      },
    };
  }

  if (
    input.block_type === "header"
    || input.block_type === "paragraph"
    || input.block_type === "tip"
    || input.block_type === "alert"
    || input.block_type === "divider"
  ) {
    return {
      block_type: input.block_type,
      ...(position ? { position } : {}),
      ...normalize_block_content(input.block_type, input),
    };
  }

  throw new InvalidGuideBlockContentError();
};

export const normalize_update_guide_block_input = (
  block_type: GuideBlock["block_type"],
  input: UpdateGuideBlockInput
): NormalizedUpdateGuideBlockInput => {
  if (
    block_type !== "header"
    && block_type !== "paragraph"
    && block_type !== "tip"
    && block_type !== "alert"
  ) {
    throw new InvalidGuideBlockContentError();
  }

  return {
    ...normalize_editable_block_content(block_type, input),
  };
};

export const normalize_update_guide_block_screenshot_input = (
  input: UpdateGuideBlockScreenshotInput
): NormalizedUpdateGuideBlockScreenshotInput => {
  const capture_asset_id = compact_optional_string(input.capture_asset_id);

  if (!capture_asset_id) {
    return {
      selected_capture_asset_id: null,
      screenshot_hidden: true,
    };
  }

  return {
    selected_capture_asset_id: capture_asset_id,
    screenshot_hidden: false,
  };
};

export const assert_guide_block_can_select_screenshot = (
  block: Pick<GuideBlock, "block_type">
) => {
  if (block.block_type !== "step") {
    throw new InvalidGuideBlockScreenshotError();
  }
};

export const normalize_update_guide_block_annotations_input = (
  block: GuideBlock,
  input: UpdateGuideBlockAnnotationsInput,
  create_annotation_id: GuideAnnotationIdFactory
): NormalizedUpdateGuideBlockAnnotationsInput => {
  if (
    block.block_type !== "step"
    || !block.step?.display_capture_asset_id
    || block.step.screenshot_hidden
  ) {
    throw new InvalidGuideBlockContentError();
  }

  if (!Array.isArray(input.annotations) || input.annotations.length > 10) {
    throw new InvalidGuideBlockContentError();
  }

  const existing_ids = new Set((block.step.annotations ?? []).map((annotation) => annotation.id));
  const seen_input_ids = new Set<string>();
  const annotations = input.annotations.map((annotation, index) => {
    const x = Number(annotation.x);
    const y = Number(annotation.y);
    const width = Number(annotation.width);
    const height = Number(annotation.height);

    if (
      annotation.type !== "highlight"
      || !Number.isFinite(x)
      || !Number.isFinite(y)
      || !Number.isFinite(width)
      || !Number.isFinite(height)
      || x < 0
      || y < 0
      || width <= 0
      || height <= 0
      || x + width > 1
      || y + height > 1
    ) {
      throw new InvalidGuideBlockContentError();
    }

    const id = compact_optional_string(annotation.id);

    if (id && !existing_ids.has(id)) {
      throw new InvalidGuideBlockContentError();
    }

    if (id && seen_input_ids.has(id)) {
      throw new InvalidGuideBlockContentError();
    }

    if (id) {
      seen_input_ids.add(id);
    }

    return {
      id: id ?? create_annotation_id(),
      annotation_type: "highlight" as const,
      annotation_index: index + 1,
      x,
      y,
      width,
      height,
    };
  });

  return {
    annotations,
  };
};
