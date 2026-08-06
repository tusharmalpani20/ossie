/**
 * @fileoverview Responsive contract for the shared portal navigation.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const shellStyles = readFileSync(
  resolve("src/features/portal/PortalAppShell.module.css"),
  "utf8",
);

const narrowStyles = shellStyles.slice(shellStyles.indexOf("@media (max-width: 860px)"));

describe("PortalAppShell narrow navigation contract", () => {
  it("wraps every portal destination inside the viewport instead of creating a clipped rail", () => {
    expect(narrowStyles).toContain(
      "grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr));",
    );
    expect(narrowStyles).toContain("width: auto;");
    expect(narrowStyles).toContain("min-width: 0;");
    expect(narrowStyles).toContain("overflow-wrap: anywhere;");
    expect(narrowStyles).not.toContain("width: max-content;");
    expect(narrowStyles).not.toContain("overflow-x: auto;");
  });
});
