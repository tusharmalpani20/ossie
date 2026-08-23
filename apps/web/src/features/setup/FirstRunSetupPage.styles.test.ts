import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve(process.cwd(), "src/features/setup/FirstRunSetupPage.module.css"),
  "utf8",
);

const ruleFor = (selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return stylesheet.match(
    new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`),
  )?.[1];
};

describe("FirstRunSetupPage styles", () => {
  it("gives the setup brand panel the approved layered purple treatment", () => {
    const brandRegionRule = ruleFor(".brandRegion");
    const textureRule = ruleFor(".brandRegion::after");

    expect(brandRegionRule).toContain("linear-gradient");
    expect(brandRegionRule).toContain("radial-gradient");
    expect(brandRegionRule).toContain("overflow: hidden");
    expect(textureRule).toContain("radial-gradient");
    expect(textureRule).toContain("mask-image");
  });

  it("uses the stronger reference typography and step proportions", () => {
    expect(ruleFor(".brandMessage h2")).toContain("font-size: 34px");
    expect(ruleFor(".brandMessage h2")).toContain("font-weight: 700");
    expect(ruleFor(".brandMessage p")).toContain("font-size: 16px");
    expect(ruleFor(".stepNumber")).toContain("width: 34px");
    expect(ruleFor(".stepNumber")).toContain("height: 34px");
  });

  it("separates form sections with whitespace instead of a legend divider", () => {
    expect(ruleFor(".group")).toContain("gap: var(--ossie-space-4)");
    expect(ruleFor(".groupTitle")).toContain(
      "margin-bottom: var(--ossie-space-4)",
    );
    expect(ruleFor(".group + .group")).toContain(
      "padding-top: var(--ossie-space-2)",
    );
    expect(ruleFor(".group + .group")).not.toContain("border-top");
  });

  it("keeps readable inline padding on every setup input", () => {
    expect(ruleFor(".field :global(input)")).toContain(
      "padding: 0 var(--ossie-space-3)",
    );
  });

  it("contains the password toggle divider inside the input boundary", () => {
    const passwordToggleRule = ruleFor(".passwordToggle");

    expect(passwordToggleRule).toContain("inset-block: 1px");
    expect(passwordToggleRule).toContain("min-height: 0");
  });
});
