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

  it("defines semantic command and feedback roles for shared primitives", () => {
    expect(tokenSource).toContain("--ossie-color-action-primary:");
    expect(tokenSource).toContain("--ossie-color-action-secondary-hover:");
    expect(tokenSource).toContain("--ossie-color-action-destructive-hover:");
    expect(tokenSource).toContain("--ossie-color-success-subtle:");
    expect(tokenSource).toContain("--ossie-color-warning-subtle:");
    expect(tokenSource).toContain("--ossie-color-danger-subtle:");
    expect(tokenSource).toContain("--ossie-shadow-control:");
    expect(tokenSource).toContain("--ossie-control-height:");
    expect(tokenSource).toContain("--ossie-space-8:");
    expect(tokenSource).toContain("--ossie-target-min:");
  });
});
