import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { afterEach, describe, expect, it } from "vitest";
import {
  DocumentationArchiveError,
  inspect_documentation_archive,
} from "./documentation-archive";

const roots: string[] = [];

const write_zip = async (
  entries: Array<{ path: string; body: string; unixPermissions?: number }>,
) => {
  const root = await mkdtemp(path.join(tmpdir(), "ossie-archive-"));
  roots.push(root);
  const filePath = path.join(root, "package.zip");
  const zip = new JSZip();
  for (const entry of entries)
    zip.file(entry.path, entry.body, {
      unixPermissions: entry.unixPermissions,
    });
  await writeFile(
    filePath,
    await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      platform: "UNIX",
    }),
  );
  return filePath;
};

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("Documentation archive inspection", () => {
  it("streams regular entries with observed hashes and sizes", async () => {
    const filePath = await write_zip([
      { path: "README.md", body: "Read me\n" },
      { path: "site.json", body: "{}\n" },
    ]);
    const observed: string[] = [];
    const result = await inspect_documentation_archive({
      file_path: filePath,
      on_entry: async (entry) => {
        observed.push(`${entry.path}:${entry.bytes.toString("utf8")}`);
      },
    });
    expect(observed).toEqual(["README.md:Read me\n", "site.json:{}\n"]);
    expect(result).toMatchObject({
      entry_count: 2,
      expanded_bytes: 11,
    });
    expect(result.entries[0]).toMatchObject({
      path: "README.md",
      size_bytes: 8,
      sha256:
        "9c914a702dd9ed97a60f7840606b5014b12954bc539ea3c175a428c44f2bebb2",
    });
  });

  it("rejects traversal, case collisions, executable entries, and archive bombs", async () => {
    const unsafeArchives = [
      await write_zip([{ path: "../evil.txt", body: "bad" }]),
      await write_zip([
        { path: "README.md", body: "one" },
        { path: "readme.md", body: "two" },
      ]),
      await write_zip([
        { path: "run.sh", body: "echo bad", unixPermissions: 0o100755 },
      ]),
      await write_zip([{ path: "bomb.txt", body: "A".repeat(20_000) }]),
    ];
    for (const filePath of unsafeArchives)
      await expect(
        inspect_documentation_archive({
          file_path: filePath,
          on_entry: async () => undefined,
        }),
      ).rejects.toBeInstanceOf(DocumentationArchiveError);
  });
});
