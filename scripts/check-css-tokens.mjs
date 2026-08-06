import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const cssRoots = ["apps/web", "apps/extension", "packages/ui"];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return walk(path);
      return entry.isFile() && /\.css$/u.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
};

const files = (
  await Promise.all(cssRoots.map((root) => walk(join(repositoryRoot, root))))
).flat();
const source = (
  await Promise.all(files.map(async (file) => readFile(file, "utf8")))
).join("\n");
const definitions = new Set(
  [...source.matchAll(/(--[a-z0-9_-]+)\s*:/giu)].map((match) => match[1]),
);
const consumers = new Set(
  [...source.matchAll(/var\(\s*(--[a-z0-9_-]+)/giu)].map(
    (match) => match[1],
  ),
);
const ignoredPrefixes = ["--default-", "--tw-"];
const undefinedNames = [...consumers]
  .filter(
    (name) =>
      !definitions.has(name) &&
      !ignoredPrefixes.some((prefix) => name.startsWith(prefix)),
  )
  .sort();

if (undefinedNames.length > 0) {
  console.error("Undefined CSS custom properties:");
  for (const name of undefinedNames) console.error(`- ${name}`);
  process.exitCode = 1;
} else {
  console.log(
    `CSS token check passed: ${definitions.size} definitions, ${consumers.size} consumers.`,
  );
}

if (process.env.OSSIE_CSS_TOKEN_DEBUG === "1") {
  for (const file of files) console.log(relative(repositoryRoot, file));
}
