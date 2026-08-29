import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve(process.cwd(), "src/index.css"),
  "utf8",
);

describe("global styles", () => {
  it("does not override component spacing after Tailwind utilities", () => {
    const universalRule = stylesheet.match(/\*\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(universalRule).not.toContain("padding:");
    expect(universalRule).not.toContain("margin:");
  });
});
