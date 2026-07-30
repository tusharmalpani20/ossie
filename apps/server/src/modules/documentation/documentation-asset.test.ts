import { describe, expect, it } from "vitest";
import {
  assert_documentation_image_dimensions,
  assert_documentation_image_format,
} from "./documentation-asset";

describe("Documentation image format policy", () => {
  it("requires decoded bytes to match the declared supported MIME type", () => {
    expect(() =>
      assert_documentation_image_format("png", "image/png"),
    ).not.toThrow();
    expect(() =>
      assert_documentation_image_format("jpeg", "image/png"),
    ).toThrow(/does not match/u);
    expect(() =>
      assert_documentation_image_format("gif", "image/gif" as never),
    ).toThrow(/unsupported/u);
  });

  it("rejects decoded dimensions above the per-axis safety ceiling", () => {
    expect(() =>
      assert_documentation_image_dimensions(16_384, 1),
    ).not.toThrow();
    expect(() => assert_documentation_image_dimensions(16_385, 1)).toThrow(
      /dimensions/u,
    );
  });
});
