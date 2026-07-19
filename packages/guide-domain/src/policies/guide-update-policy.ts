import type { GuideEdition, UpdateGuideStepInput } from "@repo/types/guide";
import {
  GuideNotEditableError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
} from "../errors/guide-domain-error";
import type {
  NormalizedUpdateGuideInput,
  NormalizedUpdateGuideStepInput,
} from "../types/guide-domain";
import { cap_guide_title, compact_optional_string } from "./guide-generation-policy";

export {
  GuideNotEditableError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
};

const has_keys = (value: Record<string, unknown>) => Object.keys(value).length > 0;

export const normalize_update_guide_input = (
  input: {
    title?: string;
    description?: string | null;
  }
): NormalizedUpdateGuideInput => {
  const normalized: NormalizedUpdateGuideInput = {};

  if (input.title !== undefined) {
    const title = compact_optional_string(input.title);

    if (!title) {
      throw new InvalidGuideInputError();
    }

    normalized.title = cap_guide_title(title);
  }

  if (input.description !== undefined) {
    normalized.description = compact_optional_string(input.description);
  }

  if (!has_keys(normalized)) {
    throw new InvalidGuideInputError();
  }

  return normalized;
};

export const normalize_update_guide_step_input = (
  input: UpdateGuideStepInput
): NormalizedUpdateGuideStepInput => {
  const normalized: NormalizedUpdateGuideStepInput = {};

  if (input.title !== undefined) {
    const title = compact_optional_string(input.title);

    if (!title) {
      throw new InvalidGuideStepInputError();
    }

    normalized.title = cap_guide_title(title);
  }

  if (input.body !== undefined) {
    normalized.body = compact_optional_string(input.body);
  }

  if (!has_keys(normalized)) {
    throw new InvalidGuideStepInputError();
  }

  return normalized;
};

export const assert_guide_is_editable = (
  guide: Pick<GuideEdition, "status">
) => {
  if (guide.status !== "draft") {
    throw new GuideNotEditableError();
  }
};

export const assert_guide_status_change_is_effective = (
  input: {
    next_status?: GuideEdition["status"];
    current_status: GuideEdition["status"];
  }
) => {
  if (input.next_status === input.current_status) {
    throw new InvalidGuideInputError();
  }
};
