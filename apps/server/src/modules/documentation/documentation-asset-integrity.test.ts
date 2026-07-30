import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import {
  read_validated_documentation_asset_bytes,
  validate_documentation_asset_bytes,
} from "./documentation-asset-integrity";

const png = await sharp({
  create: {
    width: 2,
    height: 3,
    channels: 4,
    background: "#4f46e5",
  },
})
  .png()
  .toBuffer();

describe("Documentation Asset byte integrity", () => {
  it("accepts exact readable image bytes", async () => {
    await expect(
      validate_documentation_asset_bytes({
        file: {
          storage_provider: "local",
          storage_key: "asset.png",
          mime_type: "image/png",
          size_bytes: png.length,
          checksum_sha256: createHash("sha256").update(png).digest("hex"),
          width: 2,
          height: 3,
        },
        get: vi.fn(async () => ({
          stream: Readable.from(png),
          size_bytes: png.length,
        })),
      }),
    ).resolves.toBe(createHash("sha256").update(png).digest("hex"));
  });

  it("returns the same one-pass validated bytes for package staging", async () => {
    const get = vi.fn(async () => ({
      stream: Readable.from(png),
      size_bytes: png.length,
    }));
    const validated = await read_validated_documentation_asset_bytes({
      file: {
        storage_provider: "local",
        storage_key: "asset.png",
        mime_type: "image/png",
        size_bytes: png.length,
        checksum_sha256: createHash("sha256").update(png).digest("hex"),
        width: 2,
        height: 3,
      },
      get,
    });

    expect(validated.bytes.equals(png)).toBe(true);
    expect(validated.digest).toBe(
      createHash("sha256").update(png).digest("hex"),
    );
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("fails closed for missing or changed protected bytes", async () => {
    const base = {
      storage_provider: "local",
      storage_key: "asset.png",
      mime_type: "image/png",
      size_bytes: png.length,
      checksum_sha256: "not-the-real-digest",
      width: 2,
      height: 3,
    };

    await expect(
      validate_documentation_asset_bytes({
        file: base,
        get: vi.fn(async () => ({
          stream: Readable.from(png),
          size_bytes: png.length,
        })),
      }),
    ).rejects.toMatchObject({
      code: "documentation_asset_source_unavailable",
    });

    await expect(
      validate_documentation_asset_bytes({
        file: base,
        get: vi.fn(async () => {
          throw new Error("missing");
        }),
      }),
    ).rejects.toMatchObject({
      code: "documentation_asset_source_unavailable",
    });
  });
});
