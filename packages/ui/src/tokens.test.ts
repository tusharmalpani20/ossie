import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokenSource = readFileSync("src/tokens.css", "utf8");

describe("semantic Ossie token aliases", () => {
  it("defines compatibility aliases used by the Documentation reader and editor", () => {
    expect(tokenSource).toContain("--ossie-color-link:");
    expect(tokenSource).toContain("--ossie-font-family-sans:");
    expect(tokenSource).toContain("--ossie-font-size-sm:");
    expect(tokenSource).toContain("--ossie-radius-md:");
  });
});
