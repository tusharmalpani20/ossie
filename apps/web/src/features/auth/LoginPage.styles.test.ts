import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve(process.cwd(), "src/features/auth/LoginPage.module.css"),
  "utf8",
);

const ruleFor = (selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return stylesheet.match(
    new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`),
  )?.[1];
};

describe("LoginPage styles", () => {
  it("uses a split entry layout with a vertically centered sign-in form", () => {
    expect(ruleFor(".page")).toContain("grid-template-columns");
    expect(ruleFor(".content")).toContain("align-items: center");
  });

  it("keeps comfortable inline padding on sign-in inputs", () => {
    expect(ruleFor(".field :global(input)")).toContain(
      "padding: 0 var(--ossie-space-3)",
    );
  });
});
