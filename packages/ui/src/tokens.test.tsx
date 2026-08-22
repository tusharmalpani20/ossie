/**
 * @fileoverview Tests for shared Ossie design token exports.
 */

import { describe, expect, it } from "vitest";
import {
  motionTokens,
  radiusTokens,
  semanticColorTokens,
  typographyTokens,
} from "./tokens";

describe("design tokens", () => {
  it("exports semantic color roles for operational UI states", () => {
    expect(Object.keys(semanticColorTokens)).toEqual(
      expect.arrayContaining([
        "background",
        "surface",
        "surfaceElevated",
        "border",
        "text",
        "textMuted",
        "accent",
        "success",
        "warning",
        "danger",
        "focus",
        "overlay",
        "selected",
        "disabled",
        "code",
      ]),
    );
  });

  it("uses the accepted restrained purple direction", () => {
    expect(semanticColorTokens.brandInk).toBe("#23164c");
    expect(semanticColorTokens.accent).toBe("#6d46d9");
    expect(semanticColorTokens.accentHover).toBe("#5c36c4");
    expect(semanticColorTokens.focus).toBe("#7548eb");
  });

  it("keeps shared radii restrained for workbench surfaces", () => {
    expect(radiusTokens.card).toBe("8px");
    expect(radiusTokens.control).toBe("6px");
    expect(radiusTokens.card).not.toMatch(/[1-9]\d+px/u);
  });

  it("defines product typography and reduced-motion-safe timing", () => {
    expect(typographyTokens.body.family).toContain("system-ui");
    expect(typographyTokens.heading.letterSpacing).toBe("normal");
    expect(motionTokens.fast.durationMs).toBeLessThanOrEqual(180);
    expect(motionTokens.reduced.durationMs).toBe(0);
  });
});
