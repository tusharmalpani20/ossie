import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const shellStylesheet = readFileSync(
  resolve(process.cwd(), "src/features/portal/PortalAppShell.module.css"),
  "utf8",
);
const topbarStylesheet = readFileSync(
  resolve(process.cwd(), "src/features/portal/PortalTopbar.module.css"),
  "utf8",
);

const ruleFor = (stylesheet: string, selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return stylesheet.match(
    new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`),
  )?.[1];
};

describe("PortalAppShell styles", () => {
  it("keeps scrolling inside the organization content pane", () => {
    const shellRule = ruleFor(shellStylesheet, ".projectLibrary.shell");
    const contentRule = ruleFor(
      shellStylesheet,
      ".projectLibrary .contentFrame",
    );

    expect(shellRule).toContain("height: 100dvh");
    expect(shellRule).toContain("overflow: hidden");
    expect(contentRule).toContain("height: 100%");
    expect(contentRule).toContain("overflow-y: auto");
  });

  it("keeps the organization header above scrolling page content", () => {
    const topbarRule = ruleFor(topbarStylesheet, ".projectLibrary");

    expect(topbarRule).toContain("position: sticky");
    expect(topbarRule).toContain("top: 0");
    expect(topbarRule).toContain("z-index: 40");
  });

  it("anchors the organization navigation below the sticky header", () => {
    const sidebarRule = ruleFor(
      shellStylesheet,
      ".projectLibrary .sidebar",
    );

    expect(sidebarRule).toContain("position: sticky");
    expect(sidebarRule).toContain("align-self: start");
    expect(sidebarRule).toContain("top: 64px");
    expect(sidebarRule).toContain("height: calc(100dvh - 64px)");
    expect(sidebarRule).toContain("overflow-y: auto");
  });
});
