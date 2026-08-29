import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve(process.cwd(), "src/index.css"),
  "utf8",
);

describe("extension popup layout", () => {
  it("establishes the popup width independently of Chrome's current viewport", () => {
    expect(stylesheet).toMatch(
      /html,\s*body,\s*#root\s*{[^}]*min-width:\s*360px;/s,
    );
    expect(stylesheet).not.toMatch(/max-width:\s*100vw;/);
  });

  it("centers the brand and gives popup headings strong hierarchy", () => {
    expect(stylesheet).toMatch(
      /\.brand\s*{[^}]*justify-content:\s*center;/s,
    );
    expect(stylesheet).toMatch(/h1\s*{[^}]*font-weight:\s*800;/s);
  });

  it("keeps selector options in the popup scroll flow", () => {
    expect(stylesheet).toMatch(
      /\.popupSelectMenu\s*{[^}]*position:\s*static;/s,
    );
  });
});
