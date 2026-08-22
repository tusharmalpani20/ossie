import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const sourceRoots = [
  "apps/web/src",
  "apps/extension/src",
  "packages/ui/src",
].map((sourceRoot) => join(repositoryRoot, sourceRoot));

async function cssFilesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await cssFilesIn(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".css")) {
      files.push(entryPath);
    }
  }

  return files;
}

const files = (await Promise.all(sourceRoots.map(cssFilesIn))).flat();
const definitions = new Map();
const consumers = [];
const definitionPattern = /(--[a-zA-Z0-9_-]+)\s*:/g;
const consumerPattern = /var\(\s*(--[a-zA-Z0-9_-]+)\b/g;

for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(definitionPattern)) {
    definitions.set(match[1], relative(repositoryRoot, file));
  }
  for (const match of source.matchAll(consumerPattern)) {
    consumers.push({ name: match[1], file: relative(repositoryRoot, file) });
  }
}

const undefinedConsumers = consumers.filter(
  ({ name }) => !definitions.has(name),
);

if (undefinedConsumers.length > 0) {
  for (const { name, file } of undefinedConsumers) {
    console.error(`${file} consumes undefined CSS variable ${name}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${files.length} CSS files; all referenced variables are defined.`,
  );
}
