import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

export type FileStorageProviderName = "local";

export type StoredFile = {
  storage_provider: FileStorageProviderName;
  storage_key: string;
  size_bytes: number;
  checksum_sha256: string;
};

export type ReadStoredFile = {
  stream: NodeJS.ReadableStream;
  size_bytes: number;
};

export class FileBytesNotFoundError extends Error {
  constructor() {
    super("File bytes were not found");
  }
}

export class FileStorageWriteFailedError extends Error {
  constructor() {
    super("File storage write failed");
  }
}

export class FileStorageUploadTooLargeError extends Error {
  constructor() {
    super("File storage upload is too large");
  }
}

export class UnsafeStorageKeyError extends Error {
  constructor() {
    super("Storage key is unsafe");
  }
}

const extension_by_mime_type = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["application/json", "json"],
  ["application/yaml", "yaml"],
  ["text/yaml", "yaml"],
  ["text/markdown", "md"],
  ["text/plain", "md"],
  ["application/zip", "zip"],
]);

const file_extension_for_mime_type = (mime_type: string) => {
  const extension = extension_by_mime_type.get(mime_type.toLowerCase());

  if (!extension) {
    throw new FileStorageWriteFailedError();
  }

  return extension;
};

const assert_safe_storage_key = (storage_key: string) => {
  if (
    !storage_key ||
    path.isAbsolute(storage_key) ||
    storage_key.split("/").includes("..")
  ) {
    throw new UnsafeStorageKeyError();
  }
};

const resolve_storage_path = (root: string, storage_key: string) => {
  assert_safe_storage_key(storage_key);
  const resolved_root = path.resolve(root);
  const resolved_path = path.resolve(resolved_root, storage_key);

  if (
    resolved_path !== resolved_root &&
    !resolved_path.startsWith(`${resolved_root}${path.sep}`)
  ) {
    throw new UnsafeStorageKeyError();
  }

  return resolved_path;
};

export const build_local_file_storage_provider = (input: { root: string }) => {
  const root = path.resolve(input.root);

  const put = async (
    file: {
      organization_id: string;
      project_id: string;
      file_id: string;
      mime_type: string;
      stream: NodeJS.ReadableStream;
      max_size_bytes?: number;
    } & (
      | { capture_session_id: string; documentation_site_id?: never }
      | {
          documentation_site_id: string;
          capture_session_id?: never;
          documentation_import_inspection_id?: never;
        }
      | {
          documentation_import_inspection_id: string;
          capture_session_id?: never;
          documentation_site_id?: never;
        }
    ),
  ): Promise<StoredFile> => {
    const extension = file_extension_for_mime_type(file.mime_type);
    const storage_key =
      "documentation_import_inspection_id" in file
        ? [
            "organizations",
            file.organization_id,
            "projects",
            file.project_id,
            "documentation-import-inspections",
            file.documentation_import_inspection_id,
            `source.${extension}`,
          ].join("/")
        : [
            "organizations",
            file.organization_id,
            "projects",
            file.project_id,
            "documentation_site_id" in file
              ? "documentation-sites"
              : "capture-sessions",
            "documentation_site_id" in file
              ? file.documentation_site_id
              : file.capture_session_id,
            `${file.file_id}.${extension}`,
          ].join("/");
    const storage_path = resolve_storage_path(root, storage_key);
    const partial_path = `${storage_path}.${randomUUID()}.part`;
    const hash = createHash("sha256");
    let size_bytes = 0;

    try {
      await mkdir(path.dirname(storage_path), { recursive: true });
      const meter = new Transform({
        transform(chunk: Buffer | string, _encoding, callback) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          hash.update(buffer);
          size_bytes += buffer.length;
          if (
            file.max_size_bytes !== undefined &&
            size_bytes > file.max_size_bytes
          ) {
            callback(new FileStorageUploadTooLargeError());
            return;
          }
          callback(null, buffer);
        },
      });
      await pipeline(
        file.stream,
        meter,
        createWriteStream(partial_path, { flags: "wx", mode: 0o600 }),
      );
      await rename(partial_path, storage_path);

      return {
        storage_provider: "local",
        storage_key,
        size_bytes,
        checksum_sha256: hash.digest("hex"),
      };
    } catch (error) {
      await unlink(partial_path).catch(() => undefined);
      await unlink(storage_path).catch(() => undefined);

      if (error instanceof UnsafeStorageKeyError) {
        throw error;
      }

      if (error instanceof FileStorageUploadTooLargeError) {
        throw error;
      }

      throw new FileStorageWriteFailedError();
    }
  };

  const get = async (file: {
    storage_key: string;
  }): Promise<ReadStoredFile> => {
    const storage_path = resolve_storage_path(root, file.storage_key);

    try {
      const file_stat = await stat(storage_path);

      return {
        stream: createReadStream(storage_path),
        size_bytes: file_stat.size,
      };
    } catch (error) {
      const node_error = error as NodeJS.ErrnoException;

      if (node_error.code === "ENOENT") {
        throw new FileBytesNotFoundError();
      }

      throw error;
    }
  };

  const delete_best_effort = async (file: { storage_key: string }) => {
    const storage_path = resolve_storage_path(root, file.storage_key);
    await unlink(storage_path).catch(() => undefined);
  };

  const purge_exact = async (file: { storage_key: string }) => {
    const storage_path = resolve_storage_path(root, file.storage_key);
    try {
      await unlink(storage_path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  };

  const list_documentation_transients = async (input: {
    older_than: Date;
    limit: number;
  }) => {
    const candidates: Array<{ storage_key: string; modified_at: Date }> = [];
    const visit = async (directory: string): Promise<void> => {
      if (candidates.length >= input.limit) return;
      const entries = await readdir(directory, { withFileTypes: true }).catch(
        () => [],
      );
      for (const entry of entries) {
        if (candidates.length >= input.limit) return;
        const absolute_path = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await visit(absolute_path);
          continue;
        }
        if (!entry.isFile()) continue;
        const storage_key = path
          .relative(root, absolute_path)
          .split(path.sep)
          .join("/");
        if (
          !/^organizations\/[^/]+\/projects\/[^/]+\/documentation-(?:import-inspections|exports)\/[^/]+\/(?:source\.(?:md|zip|json|yaml)|package\.zip)(?:\.[0-9a-f-]+\.part)?$/u.test(
            storage_key,
          )
        )
          continue;
        const file_stat = await stat(absolute_path);
        if (file_stat.mtime < input.older_than)
          candidates.push({ storage_key, modified_at: file_stat.mtime });
      }
    };
    await visit(root);
    return candidates.sort(
      (left, right) =>
        left.modified_at.getTime() - right.modified_at.getTime() ||
        left.storage_key.localeCompare(right.storage_key),
    );
  };

  return {
    put,
    get,
    resolve_internal_path: (file: { storage_key: string }) =>
      resolve_storage_path(root, file.storage_key),
    delete_best_effort,
    purge_exact,
    list_documentation_transients,
  };
};
