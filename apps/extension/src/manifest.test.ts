import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type ExtensionManifest = {
  description?: string;
  action?: {
    default_icon?: Record<string, string>;
  };
  content_scripts?: Array<{
    matches?: string[];
  }>;
  host_permissions?: string[];
  icons?: Record<string, string>;
  permissions?: string[];
};

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/manifest.json"), "utf8")
) as ExtensionManifest;

describe("extension manifest", () => {
  it("describes the extension purpose in Chrome", () => {
    expect(manifest.description).toBe(
      "Capture browser workflows and turn them into governed guides and interactive demos in Ossie."
    );
  });

  it("uses the selected Ossie icon set", () => {
    expect(manifest.icons).toEqual({
      "16": "icons/ossie-16.png",
      "32": "icons/ossie-32.png",
      "48": "icons/ossie-48.png",
      "128": "icons/ossie-128.png",
    });
    expect(manifest.action?.default_icon).toEqual(manifest.icons);
  });

  it("declares the persistent host permission required by background screenshot capture", () => {
    expect(manifest.host_permissions).toEqual(["<all_urls>"]);
    expect([...(manifest.permissions ?? [])].sort()).toEqual(["activeTab", "storage", "tabs"]);
  });

  it("keeps automatic content script injection scoped to supported web pages", () => {
    expect(manifest.content_scripts?.[0]?.matches).toEqual(["http://*/*", "https://*/*"]);
  });
});
