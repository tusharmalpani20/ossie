import { mkdtemp, readFile, readdir, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  build_local_file_storage_provider,
  FileBytesNotFoundError,
  FileStorageUploadTooLargeError,
  UnsafeStorageKeyError,
} from "./local-file-storage.provider";

const collect = async (stream: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

describe("local file storage provider", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "ossie-storage-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("stores uploaded bytes under the scoped organization project session key", async () => {
    const provider = build_local_file_storage_provider({ root });
    const bytes = Buffer.from("fake png bytes");

    const stored = await provider.put({
      organization_id: "org_1",
      project_id: "project_1",
      capture_session_id: "session_1",
      file_id: "file_1",
      mime_type: "image/png",
      stream: Readable.from(bytes),
    });

    expect(stored).toEqual({
      storage_provider: "local",
      storage_key:
        "organizations/org_1/projects/project_1/capture-sessions/session_1/file_1.png",
      size_bytes: bytes.length,
      checksum_sha256:
        "86610c40efe63f0a46c58c4b605c164b4ffa3a3ad3f1dcf13e6ba4c59cb3ce16",
    });
    await expect(
      readFile(path.join(root, stored.storage_key)),
    ).resolves.toEqual(bytes);

    const read = await provider.get({ storage_key: stored.storage_key });
    expect(read.size_bytes).toBe(bytes.length);
    await expect(collect(read.stream)).resolves.toEqual(bytes);
  });

  it("rejects unsafe storage keys and maps missing bytes", async () => {
    const provider = build_local_file_storage_provider({ root });

    await expect(
      provider.get({ storage_key: "../secret.png" }),
    ).rejects.toBeInstanceOf(UnsafeStorageKeyError);
    await expect(
      provider.get({ storage_key: "/secret.png" }),
    ).rejects.toBeInstanceOf(UnsafeStorageKeyError);
    await expect(
      provider.get({ storage_key: "missing.png" }),
    ).rejects.toBeInstanceOf(FileBytesNotFoundError);
  });

  it("deletes stored bytes best effort", async () => {
    const provider = build_local_file_storage_provider({ root });
    const stored = await provider.put({
      organization_id: "org_1",
      project_id: "project_1",
      capture_session_id: "session_1",
      file_id: "file_1",
      mime_type: "image/jpeg",
      stream: Readable.from(Buffer.from("jpeg bytes")),
    });

    await provider.delete_best_effort({ storage_key: stored.storage_key });
    await provider.delete_best_effort({ storage_key: stored.storage_key });

    await expect(
      provider.get({ storage_key: stored.storage_key }),
    ).rejects.toBeInstanceOf(FileBytesNotFoundError);
  });

  it("purges exact stored bytes idempotently", async () => {
    const provider = build_local_file_storage_provider({ root });
    const stored = await provider.put({
      organization_id: "org_1",
      project_id: "project_1",
      capture_session_id: "session_1",
      file_id: "file_1",
      mime_type: "image/png",
      stream: Readable.from(Buffer.from("bytes")),
    });
    await provider.purge_exact({ storage_key: stored.storage_key });
    await expect(
      provider.purge_exact({ storage_key: stored.storage_key }),
    ).resolves.toBeUndefined();
  });

  it("rejects oversized uploads without leaving partial bytes", async () => {
    const provider = build_local_file_storage_provider({ root });

    await expect(
      provider.put({
        organization_id: "org_1",
        project_id: "project_1",
        capture_session_id: "session_1",
        file_id: "file_1",
        mime_type: "image/png",
        stream: Readable.from(Buffer.from("fake png bytes")),
        max_size_bytes: 4,
      }),
    ).rejects.toBeInstanceOf(FileStorageUploadTooLargeError);

    await expect(
      provider.get({
        storage_key:
          "organizations/org_1/projects/project_1/capture-sessions/session_1/file_1.png",
      }),
    ).rejects.toBeInstanceOf(FileBytesNotFoundError);
    expect(
      (await readdir(root, { recursive: true })).some((entry) =>
        entry.endsWith(".part"),
      ),
    ).toBe(false);
  });

  it("streams generated Documentation import sources and enumerates only old transient keys", async () => {
    const provider = build_local_file_storage_provider({ root });
    const stored = await provider.put({
      organization_id: "org_1",
      project_id: "project_1",
      documentation_import_inspection_id: "inspection_1",
      file_id: "file_1",
      mime_type: "application/zip",
      stream: Readable.from(Buffer.from("package bytes")),
    });
    expect(stored.storage_key).toBe(
      "organizations/org_1/projects/project_1/documentation-import-inspections/inspection_1/source.zip",
    );
    const storage_path = path.join(root, stored.storage_key);
    expect(provider.resolve_internal_path(stored)).toBe(storage_path);
    expect(() =>
      provider.resolve_internal_path({ storage_key: "../outside.zip" }),
    ).toThrow(UnsafeStorageKeyError);
    await utimes(storage_path, new Date(0), new Date(0));

    await expect(
      provider.list_documentation_transients({
        older_than: new Date(1),
        limit: 10,
      }),
    ).resolves.toEqual([
      {
        storage_key: stored.storage_key,
        modified_at: (await stat(storage_path)).mtime,
      },
    ]);
  });

  it("stages generated Documentation exports under a dedicated transient key", async () => {
    const provider = build_local_file_storage_provider({ root });
    const stored = await provider.put_documentation_export({
      organization_id: "org_1",
      project_id: "project_1",
      documentation_export_id: "export_1",
      stream: Readable.from(Buffer.from("zip bytes")),
      max_size_bytes: 100,
    });

    expect(stored).toMatchObject({
      storage_key:
        "organizations/org_1/projects/project_1/documentation-exports/export_1/package.zip",
      size_bytes: 9,
    });
    const reopened = await provider.get(stored);
    expect(reopened.size_bytes).toBe(9);
    for await (const chunk of reopened.stream)
      expect(Buffer.from(chunk)).not.toHaveLength(0);
    await provider.purge_exact(stored);
    await expect(provider.get(stored)).rejects.toBeInstanceOf(
      FileBytesNotFoundError,
    );
  });
});
