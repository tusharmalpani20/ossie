import { createHash } from "node:crypto";
import { open as openFile } from "node:fs/promises";
import {
  DOCUMENTATION_PACKAGE_COMPRESSION_RATIO_MAX,
  DOCUMENTATION_PACKAGE_ENTRIES_MAX,
  DOCUMENTATION_PACKAGE_EXPANDED_MAX_BYTES,
  DOCUMENTATION_PACKAGE_NON_MEDIA_ENTRY_MAX_BYTES,
  DOCUMENTATION_PACKAGE_PATH_MAX_BYTES,
  DOCUMENTATION_PACKAGE_PATH_SEGMENT_MAX_BYTES,
  DOCUMENTATION_PACKAGE_PATH_SEGMENTS_MAX,
} from "@repo/constants";
import { openPromise, type Entry } from "yauzl";

export class DocumentationArchiveError extends Error {
  readonly code = "documentation_import_invalid";

  constructor(message: string) {
    super(message);
    this.name = "DocumentationArchiveError";
  }
}

type InspectedEntry = {
  path: string;
  size_bytes: number;
  compressed_size_bytes: number;
  sha256: string;
};

const assert_classic_single_disk_zip = async (filePath: string) => {
  const handle = await openFile(filePath, "r");
  try {
    const fileStat = await handle.stat();
    const length = Math.min(fileStat.size, 65_557);
    const tail = Buffer.alloc(length);
    await handle.read(tail, 0, length, fileStat.size - length);
    if (
      tail.includes(Buffer.from([0x50, 0x4b, 0x06, 0x06])) ||
      tail.includes(Buffer.from([0x50, 0x4b, 0x06, 0x07]))
    )
      throw new DocumentationArchiveError("ZIP64 archives are unsupported");
    const eocdOffset = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (eocdOffset < 0)
      throw new DocumentationArchiveError("ZIP end record is missing");
    if (
      tail.readUInt16LE(eocdOffset + 4) !== 0 ||
      tail.readUInt16LE(eocdOffset + 6) !== 0
    )
      throw new DocumentationArchiveError("Multi-disk ZIP is unsupported");
  } finally {
    await handle.close();
  }
};

const assert_safe_path = (entryPath: string) => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(entryPath);
  } catch {
    throw new DocumentationArchiveError("Archive entry path is malformed");
  }
  const segments = entryPath.split("/").filter(Boolean);
  if (
    !entryPath ||
    entryPath.startsWith("/") ||
    entryPath.startsWith("\\\\") ||
    /^[a-z]:/iu.test(entryPath) ||
    entryPath.includes("\\") ||
    entryPath.includes("\0") ||
    /[\u0001-\u001F\u007F\u202A-\u202E\u2066-\u2069]/u.test(entryPath) ||
    entryPath.normalize("NFC") !== entryPath ||
    segments.some((segment) => segment === "." || segment === "..") ||
    decoded.includes("\\") ||
    decoded.split("/").some((segment) => segment === "." || segment === "..") ||
    Buffer.byteLength(entryPath, "utf8") > DOCUMENTATION_PACKAGE_PATH_MAX_BYTES ||
    segments.length > DOCUMENTATION_PACKAGE_PATH_SEGMENTS_MAX ||
    segments.some(
      (segment) =>
        Buffer.byteLength(segment, "utf8") >
        DOCUMENTATION_PACKAGE_PATH_SEGMENT_MAX_BYTES,
    )
  )
    throw new DocumentationArchiveError("Archive entry path is unsafe");
};

const assert_regular_entry = (entry: Entry) => {
  if (entry.isEncrypted())
    throw new DocumentationArchiveError("Encrypted archive entries are unsupported");
  if (![0, 8].includes(entry.compressionMethod))
    throw new DocumentationArchiveError(
      "Archive compression method is unsupported",
    );
  const madeByUnix = entry.versionMadeBy >> 8 === 3;
  if (madeByUnix) {
    const mode = entry.externalFileAttributes >>> 16;
    const fileType = mode & 0o170000;
    const isDirectory = entry.fileName.endsWith("/");
    if (
      (!isDirectory && fileType !== 0 && fileType !== 0o100000) ||
      (isDirectory && fileType !== 0 && fileType !== 0o040000) ||
      (!isDirectory && (mode & 0o111) !== 0)
    )
      throw new DocumentationArchiveError(
        "Archive entry type or mode is unsupported",
      );
  }
};

const collect_stream = async (
  stream: NodeJS.ReadableStream,
  expectedSize: number,
) => {
  const chunks: Buffer[] = [];
  let observed = 0;
  const hash = createHash("sha256");
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    observed += buffer.length;
    if (observed > expectedSize)
      throw new DocumentationArchiveError("Archive entry size changed");
    hash.update(buffer);
    chunks.push(buffer);
  }
  if (observed !== expectedSize)
    throw new DocumentationArchiveError("Archive entry size is inconsistent");
  return { bytes: Buffer.concat(chunks), sha256: hash.digest("hex") };
};

export const inspect_documentation_archive = async (input: {
  file_path: string;
  on_entry: (entry: {
    path: string;
    bytes: Buffer;
    sha256: string;
  }) => Promise<void>;
}) => {
  await assert_classic_single_disk_zip(input.file_path);
  const zip = await openPromise(input.file_path, {
    lazyEntries: true,
    decodeStrings: true,
    validateEntrySizes: true,
    strictFileNames: true,
  });
  const paths = new Set<string>();
  const normalizedPaths = new Set<string>();
  const ranges: Array<{ start: number; end: number }> = [];
  const entries: InspectedEntry[] = [];
  let expandedBytes = 0;
  try {
    if (zip.comment)
      throw new DocumentationArchiveError("Archive comments are unsupported");
    if (zip.entryCount > DOCUMENTATION_PACKAGE_ENTRIES_MAX)
      throw new DocumentationArchiveError("Archive entry limit exceeded");
    for await (const entry of zip.eachEntry()) {
      assert_safe_path(entry.fileName);
      assert_regular_entry(entry);
      if (entry.fileName.endsWith("/")) continue;
      if (entry.fileName.toLowerCase().endsWith(".zip"))
        throw new DocumentationArchiveError("Nested archives are unsupported");
      const normalizedKey = entry.fileName.normalize("NFC").toLowerCase();
      if (paths.has(entry.fileName) || normalizedPaths.has(normalizedKey))
        throw new DocumentationArchiveError(
          "Archive entry paths collide or are duplicated",
        );
      paths.add(entry.fileName);
      normalizedPaths.add(normalizedKey);
      if (
        entry.uncompressedSize >
        DOCUMENTATION_PACKAGE_NON_MEDIA_ENTRY_MAX_BYTES
      )
        throw new DocumentationArchiveError("Archive entry limit exceeded");
      if (
        entry.uncompressedSize > 0 &&
        (entry.compressedSize === 0 ||
          entry.uncompressedSize / entry.compressedSize >
            DOCUMENTATION_PACKAGE_COMPRESSION_RATIO_MAX)
      )
        throw new DocumentationArchiveError(
          "Archive compression ratio exceeds the limit",
        );
      expandedBytes += entry.uncompressedSize;
      if (expandedBytes > DOCUMENTATION_PACKAGE_EXPANDED_MAX_BYTES)
        throw new DocumentationArchiveError(
          "Archive expanded-byte limit exceeded",
        );
      const localHeader = await zip.readLocalFileHeaderPromise(entry);
      if (
        localHeader.compressionMethod !== entry.compressionMethod ||
        localHeader.generalPurposeBitFlag !== entry.generalPurposeBitFlag ||
        !localHeader.fileName.equals(entry.fileNameRaw)
      )
        throw new DocumentationArchiveError(
          "Archive local and central headers disagree",
        );
      const range = {
        start: entry.relativeOffsetOfLocalHeader,
        end: localHeader.fileDataStart + entry.compressedSize,
      };
      if (
        ranges.some(
          (other) => range.start < other.end && other.start < range.end,
        )
      )
        throw new DocumentationArchiveError("Archive entry ranges overlap");
      ranges.push(range);
      const stream = await zip.openReadStreamPromise(entry);
      const observed = await collect_stream(stream, entry.uncompressedSize);
      await input.on_entry({
        path: entry.fileName,
        bytes: observed.bytes,
        sha256: observed.sha256,
      });
      entries.push({
        path: entry.fileName,
        size_bytes: entry.uncompressedSize,
        compressed_size_bytes: entry.compressedSize,
        sha256: observed.sha256,
      });
    }
  } catch (error) {
    if (error instanceof DocumentationArchiveError) throw error;
    throw new DocumentationArchiveError(
      error instanceof Error ? error.message : "Archive inspection failed",
    );
  } finally {
    zip.close();
  }
  return {
    entry_count: entries.length,
    expanded_bytes: expandedBytes,
    entries,
  };
};
