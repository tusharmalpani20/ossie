import { lstat, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, posix, resolve } from "node:path";
import JSZip from "jszip";

const MAX_EXTENSION_FILES = 1_000;
const MAX_EXTENSION_BYTES = 64 * 1024 * 1024;
const default_extension_dist_root = fileURLToPath(
  new URL("../../../../extension/dist", import.meta.url),
);

type ExtensionFile = {
  path: string;
  bytes: Buffer;
};

export type ExtensionBundle = {
  archive: Buffer;
  filename: string;
  version: string;
};

export class ExtensionBundleUnavailableError extends Error {
  constructor() {
    super("The browser extension download is not available.");
  }
}

const configured_extension_dist_root = () => {
  const configured = process.env.OSSIE_EXTENSION_DIST_ROOT?.trim();
  return configured ? resolve(configured) : default_extension_dist_root;
};

const collect_extension_files = async (
  root: string,
  relative_directory = "",
  files: ExtensionFile[] = [],
  total = { bytes: 0 },
): Promise<ExtensionFile[]> => {
  const directory = join(root, relative_directory);
  const entries = (await readdir(directory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  );

  for (const entry of entries) {
    const relative_path = relative_directory
      ? posix.join(relative_directory, entry.name)
      : entry.name;
    const absolute_path = join(root, ...relative_path.split("/"));
    const stat = await lstat(absolute_path);

    if (stat.isSymbolicLink()) throw new ExtensionBundleUnavailableError();
    if (stat.isDirectory()) {
      await collect_extension_files(root, relative_path, files, total);
      continue;
    }
    if (!stat.isFile()) throw new ExtensionBundleUnavailableError();

    if (files.length >= MAX_EXTENSION_FILES) {
      throw new ExtensionBundleUnavailableError();
    }
    total.bytes += stat.size;
    if (total.bytes > MAX_EXTENSION_BYTES) {
      throw new ExtensionBundleUnavailableError();
    }
    files.push({ path: relative_path, bytes: await readFile(absolute_path) });
  }

  return files;
};

const extension_version = (files: ExtensionFile[]) => {
  const manifest_file = files.find((file) => file.path === "manifest.json");
  if (!manifest_file) throw new ExtensionBundleUnavailableError();

  try {
    const manifest = JSON.parse(manifest_file.bytes.toString("utf8")) as {
      manifest_version?: unknown;
      version?: unknown;
    };
    if (
      manifest.manifest_version !== 3 ||
      typeof manifest.version !== "string" ||
      !/^\d+(?:\.\d+){0,3}$/u.test(manifest.version)
    ) {
      throw new ExtensionBundleUnavailableError();
    }
    return manifest.version;
  } catch (error) {
    if (error instanceof ExtensionBundleUnavailableError) throw error;
    throw new ExtensionBundleUnavailableError();
  }
};

/** Packages the trusted, operator-built Manifest V3 extension output. */
export const build_extension_bundle = async (): Promise<ExtensionBundle> => {
  try {
    const root = configured_extension_dist_root();
    const root_stat = await lstat(root);
    if (root_stat.isSymbolicLink() || !root_stat.isDirectory()) {
      throw new ExtensionBundleUnavailableError();
    }
    const files = await collect_extension_files(root);
    const version = extension_version(files);
    const zip = new JSZip();
    for (const file of files) zip.file(file.path, file.bytes);
    const archive = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
      platform: "UNIX",
    });

    return {
      archive,
      filename: `ossie-extension-v${version}.zip`,
      version,
    };
  } catch (error) {
    if (error instanceof ExtensionBundleUnavailableError) throw error;
    throw new ExtensionBundleUnavailableError();
  }
};
