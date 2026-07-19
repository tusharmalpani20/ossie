import { describe, expect, it } from "vitest";
import {
  docsLinks,
  evidenceItems,
  knownLimitations,
  nextPlatformDirection,
  productCapabilities,
  siteSummary,
} from "./docs-content";

describe("docs content", () => {
  it("describes Ossie as alpha self-hosted knowledge software", () => {
    expect(siteSummary.name).toBe("Ossie");
    expect(siteSummary.status).toContain("alpha");
    expect(siteSummary.positioning.toLowerCase()).toContain("self-hosted");
    expect(siteSummary.positioning).toContain("guides");
    expect(siteSummary.positioning).toContain("interactive demos");
  });

  it("links to the source-of-truth markdown docs", () => {
    expect(siteSummary.readmeHref).toContain(
      "github.com/tusharmalpani20/ossie/",
    );
    expect(siteSummary.selfHostingHref).toContain(
      "github.com/tusharmalpani20/ossie/",
    );
    expect(docsLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Self-hosting quickstart",
          href: expect.stringContaining("/docs/self-hosting.md"),
        }),
        expect.objectContaining({
          label: "Operations guide",
          href: expect.stringContaining("/docs/operations.md"),
        }),
        expect.objectContaining({
          label: "Production readiness checklist",
          href: expect.stringContaining(
            "/docs/production-readiness-checklist.md",
          ),
        }),
        expect.objectContaining({
          label: "Roadmap",
          href: expect.stringContaining("/docs/roadmap.md"),
        }),
        expect.objectContaining({
          label: "Contributor guide",
          href: expect.stringContaining("/docs/contributor-guide.md"),
        }),
      ]),
    );
  });

  it("keeps current alpha limitations and operations leftovers visible", () => {
    expect(knownLimitations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("toolbar-popup manual validation"),
        "Storage inventory and cleanup tooling are still future self-host operations work.",
        "Backup/restore rehearsal, one-command packaging, shared rate limiting, and object storage remain deferred.",
      ]),
    );
  });

  it("separates the shipped foundation from the remaining platform direction", () => {
    expect(nextPlatformDirection.status).toContain("partially implemented");
    expect(nextPlatformDirection.items).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Project Version-scoped Capture Sessions"),
        expect.stringContaining("Product Documentation"),
        expect.stringContaining("Video"),
      ]),
    );
    expect(nextPlatformDirection.docsAppBoundary).toContain(
      "repository documentation",
    );
  });

  it("summarizes current capabilities and safe evidence assets", () => {
    expect(productCapabilities).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Screenshot-first capture"),
        expect.stringContaining("Scribe-style guides"),
        expect.stringContaining("Storylane-style interactive demos"),
      ]),
    );
    expect(evidenceItems.map((item) => item.src)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/alpha-project-workspace.png"),
        expect.stringContaining("/alpha-guide-editor.png"),
        expect.stringContaining("/alpha-demo-editor.png"),
      ]),
    );
  });
});
