import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

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
  ["application/json", "json"],
  ["application/yaml", "yaml"],
  ["text/yaml", "yaml"],
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
      | { documentation_site_id: string; capture_session_id?: never }
    ),
  ): Promise<StoredFile> => {
    const extension = file_extension_for_mime_type(file.mime_type);
    const storage_key = [
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
    const hash = createHash("sha256");
    const chunks: Buffer[] = [];
    let size_bytes = 0;

    try {
      for await (const chunk of file.stream) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        hash.update(buffer);
        chunks.push(buffer);
        size_bytes += buffer.length;

        if (
          file.max_size_bytes !== undefined &&
          size_bytes > file.max_size_bytes
        ) {
          throw new FileStorageUploadTooLargeError();
        }
      }

      await mkdir(path.dirname(storage_path), { recursive: true });
      await writeFile(storage_path, Buffer.concat(chunks));

      return {
        storage_provider: "local",
        storage_key,
        size_bytes,
        checksum_sha256: hash.digest("hex"),
      };
    } catch (error) {
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

  return {
    put,
    get,
    delete_best_effort,
    purge_exact,
  };
};
