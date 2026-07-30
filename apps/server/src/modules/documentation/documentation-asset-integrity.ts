import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  assert_documentation_image_dimensions,
  assert_documentation_image_format,
  type DocumentationImageMimeType,
} from "./documentation-asset";

type ProtectedAssetFile = {
  storage_provider: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number | string;
  checksum_sha256: string | null;
  width: number | string;
  height: number | string;
};

const unavailable = () =>
  Object.assign(new Error("Documentation Asset bytes are unavailable"), {
    code: "documentation_asset_source_unavailable",
  });

type ProtectedFile = {
  storage_provider: string;
  storage_key: string;
  size_bytes: number | string;
  checksum_sha256: string | null;
};

export const validate_documentation_protected_file_bytes = async (input: {
  file: ProtectedFile;
  get: (input: { storage_key: string }) => Promise<{
    stream: NodeJS.ReadableStream;
    size_bytes: number;
  }>;
}) => {
  try {
    const expectedSize = Number(input.file.size_bytes);
    if (
      input.file.storage_provider !== "local" ||
      !Number.isSafeInteger(expectedSize) ||
      expectedSize < 0 ||
      expectedSize > 10 * 1024 * 1024
    )
      throw unavailable();
    const stored = await input.get({ storage_key: input.file.storage_key });
    if (stored.size_bytes !== expectedSize) throw unavailable();
    const hash = createHash("sha256");
    let size = 0;
    for await (const chunk of stored.stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > 10 * 1024 * 1024) throw unavailable();
      hash.update(buffer);
    }
    const digest = hash.digest("hex");
    if (
      size !== expectedSize ||
      !input.file.checksum_sha256 ||
      digest !== input.file.checksum_sha256
    )
      throw unavailable();
    return digest;
  } catch {
    throw unavailable();
  }
};

export const read_validated_documentation_asset_bytes = async (input: {
  file: ProtectedAssetFile;
  get: (input: { storage_key: string }) => Promise<{
    stream: NodeJS.ReadableStream;
    size_bytes: number;
  }>;
}): Promise<{ bytes: Buffer; digest: string }> => {
  try {
    const expectedSize = Number(input.file.size_bytes);
    const expectedWidth = Number(input.file.width);
    const expectedHeight = Number(input.file.height);
    if (
      input.file.storage_provider !== "local" ||
      !Number.isSafeInteger(expectedSize) ||
      expectedSize > 10 * 1024 * 1024
    )
      throw unavailable();
    const stored = await input.get({ storage_key: input.file.storage_key });
    if (stored.size_bytes !== expectedSize) throw unavailable();
    const chunks: Buffer[] = [];
    const hash = createHash("sha256");
    let size = 0;
    for await (const chunk of stored.stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > 10 * 1024 * 1024) throw unavailable();
      chunks.push(buffer);
      hash.update(buffer);
    }
    const digest = hash.digest("hex");
    if (
      size !== expectedSize ||
      (input.file.checksum_sha256 && digest !== input.file.checksum_sha256)
    )
      throw unavailable();
    const bytes = Buffer.concat(chunks);
    const metadata = await sharp(bytes, {
      limitInputPixels: 40_000_000,
    }).metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width !== expectedWidth ||
      metadata.height !== expectedHeight
    )
      throw unavailable();
    assert_documentation_image_format(
      metadata.format,
      input.file.mime_type as DocumentationImageMimeType,
    );
    assert_documentation_image_dimensions(metadata.width, metadata.height);
    return { bytes, digest };
  } catch {
    throw unavailable();
  }
};

export const validate_documentation_asset_bytes = async (
  input: Parameters<typeof read_validated_documentation_asset_bytes>[0],
) => (await read_validated_documentation_asset_bytes(input)).digest;
