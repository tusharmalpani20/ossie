import { readFileSync } from "node:fs";
import { isAbsolute, posix } from "node:path";

type ViteManifestEntry = {
  file?: unknown;
  css?: unknown;
  imports?: unknown;
  isEntry?: unknown;
};

const assert_asset_base = (value: string | undefined) => {
  const base = value?.trim() || "/";
  if (
    !base.startsWith("/") ||
    !base.endsWith("/") ||
    base.startsWith("//") ||
    base.includes("\\") ||
    posix.normalize(base) !== base
  ) {
    throw new Error(
      "OSSIE_DOCUMENTATION_WEB_ASSET_BASE must be a normalized root-relative directory",
    );
  }
  return base;
};

const relative_asset = (value: unknown) => {
  if (
    typeof value !== "string" ||
    !value ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.includes("://") ||
    posix.normalize(value) !== value ||
    value === ".." ||
    value.startsWith("../")
  ) {
    throw new Error(
      "Documentation manifest entries must be relative Vite assets",
    );
  }
  return value;
};

export const get_documentation_public_assets_config = (
  environment: NodeJS.ProcessEnv = process.env,
) => {
  const production =
    environment.NODE_ENV === "production" ||
    environment.DEV_TYPE === "production";
  if (!production) {
    return Object.freeze({
      scripts: Object.freeze(["/src/main.tsx"]),
      styles: Object.freeze([] as string[]),
      asset_base: "/",
      production: false,
    });
  }
  const path = environment.OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH?.trim();
  if (!path) {
    throw new Error(
      "OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH is required in production",
    );
  }
  if (!isAbsolute(path)) {
    throw new Error(
      "OSSIE_DOCUMENTATION_WEB_MANIFEST_PATH must be an absolute path",
    );
  }
  const asset_base = assert_asset_base(
    environment.OSSIE_DOCUMENTATION_WEB_ASSET_BASE,
  );
  let parsed: Record<string, ViteManifestEntry>;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8")) as Record<
      string,
      ViteManifestEntry
    >;
  } catch {
    throw new Error("Documentation Vite manifest must be readable JSON");
  }
  const entry = parsed["index.html"];
  if (!entry || entry.isEntry !== true) {
    throw new Error("Documentation Vite manifest is missing index.html entry");
  }
  const asset_url = (asset: unknown) => `${asset_base}${relative_asset(asset)}`;
  const styles = Array.isArray(entry.css) ? entry.css.map(asset_url) : [];
  return Object.freeze({
    scripts: Object.freeze([asset_url(entry.file)]),
    styles: Object.freeze(styles),
    asset_base,
    production: true,
  });
};

export type DocumentationPublicAssetsConfig = ReturnType<
  typeof get_documentation_public_assets_config
>;
