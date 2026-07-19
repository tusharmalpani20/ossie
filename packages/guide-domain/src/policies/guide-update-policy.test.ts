import { describe, expect, it } from "vitest";
import {
  GuideNotEditableError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
  assert_guide_is_editable,
  normalize_update_guide_input,
  normalize_update_guide_step_input,
} from "./guide-update-policy";

describe("guide update policy", () => {
  it("normalizes Edition metadata updates without accepting lifecycle state", () => {
    expect(normalize_update_guide_input({
      title: ` ${"A".repeat(200)} `,
      description: " ",
    })).toEqual({
      title: "A".repeat(180),
      description: null,
    });

    expect(() => normalize_update_guide_input({})).toThrow(InvalidGuideInputError);
  });

  it("normalizes guide step updates and checks editability", () => {
    expect(normalize_update_guide_step_input({
      title: " Step ",
      body: " ",
      expected_working_draft_version: 1,
    })).toEqual({
      title: "Step",
      body: null,
    });

    expect(() => normalize_update_guide_step_input({
      title: " ", expected_working_draft_version: 1,
    })).toThrow(InvalidGuideStepInputError);
    expect(() => assert_guide_is_editable({ status: "archived" })).toThrow(GuideNotEditableError);
    expect(assert_guide_is_editable({ status: "draft" })).toBeUndefined();
  });
});
