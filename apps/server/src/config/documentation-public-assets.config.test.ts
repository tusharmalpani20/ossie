import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { get_documentation_public_assets_config } from "./documentation-public-assets.config";

const manifest = (value: unknown) => {
  const directory = mkdtempSync(join(tmpdir(), "ossie-doc-assets-"));
  const path = join(directory, "manifest.json");
  writeFileSync(path, JSON.stringify(value));
  return path;
};

describe("Documentation public asset config", () => {
  it("uses the Vite development entry outside production", () => {
    expect(
      get_documentation_public_assets_config({
        NODE_ENV: "development",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      scripts: ["/src/main.tsx"],
      styles: [],
      asset_base: "/",
      production: false,
    });
  });

  it("freezes the production entry and its reviewed CSS", () => {
    const path = manifest({
      "index.html": {
        file: "assets/index-abc123.js",
        isEntry: true,
        css: ["assets/index-abc123.css"],
      },
    });
    expect(
      get_documentation_public_assets_config({
        NODE_ENV: "production",
        OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH: path,
        OSSIE_DOCUMENTATION_WEB_ASSET_BASE: "/",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      scripts: ["/assets/index-abc123.js"],
      styles: ["/assets/index-abc123.css"],
      asset_base: "/",
      production: true,
    });
  });

  it("rejects missing, absolute, and traversal production assets", () => {
    expect(() =>
      get_documentation_public_assets_config({
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv),
    ).toThrow("OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH");
    expect(() =>
      get_documentation_public_assets_config({
        NODE_ENV: "production",
        OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH: "dist/manifest.json",
      } as NodeJS.ProcessEnv),
    ).toThrow("must be an absolute path");
    for (const file of ["https://cdn.example/app.js", "../secret.js"]) {
      expect(() =>
        get_documentation_public_assets_config({
          NODE_ENV: "production",
          OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH: manifest({
            "index.html": { file, isEntry: true },
          }),
        } as NodeJS.ProcessEnv),
      ).toThrow("relative Vite asset");
    }
  });
});
