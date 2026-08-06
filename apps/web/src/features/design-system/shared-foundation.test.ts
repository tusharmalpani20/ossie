import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const orphanedShellDeclarations = [
  "../project/ProjectListPage.module.css",
  "../project/ProjectSettingsPage.module.css",
  "../project/ProjectWorkspacePage.module.css",
  "../project-activity/ProjectActivityTimelinePage.module.css",
  "../project-version/ProjectVersionRouteBoundary.module.css",
];

describe("shared foundation CSS audit", () => {
  it("keeps proven orphaned page and main declarations removed", () => {
    for (const relativePath of orphanedShellDeclarations) {
      const source = readFileSync(
        new URL(relativePath, import.meta.url),
        "utf8",
      );

      expect(source).not.toMatch(/^\.page\s*\{/mu);
      expect(source).not.toMatch(/^\.main\s*\{/mu);
    }
  });
});
