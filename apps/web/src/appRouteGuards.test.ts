/**
 * @fileoverview Tests for app-level route guard helpers.
 */

import { describe, expect, it } from "vitest";
import { shouldRenderDesignSystemReview } from "./appRouteGuards";

describe("app route guards", () => {
  it("gates the design system review route to development mode", () => {
    expect(
      shouldRenderDesignSystemReview({ type: "design_system_review" }, true),
    ).toBe(true);
    expect(
      shouldRenderDesignSystemReview({ type: "design_system_review" }, false),
    ).toBe(false);
    expect(shouldRenderDesignSystemReview({ type: "project_list" }, true)).toBe(
      false,
    );
  });
});
