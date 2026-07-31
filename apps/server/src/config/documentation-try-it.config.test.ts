import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  get_documentation_try_it_origin_config,
  parse_documentation_try_it_origins,
} from "./documentation-try-it.config";

describe("Documentation Try-It deployment configuration", () => {
  it("normalizes, sorts, deduplicates, and digests exact origins", () => {
    const config = parse_documentation_try_it_origins(
      "https://b.example.com, https://A.example.com:443,https://b.example.com",
    );
    expect(config.origins).toEqual([
      "https://a.example.com",
      "https://b.example.com",
    ]);
    expect(config.digest).toBe(
      createHash("sha256")
        .update("https://a.example.com\nhttps://b.example.com")
        .digest("hex"),
    );
  });

  it("accepts an empty ceiling and rejects malformed entries", () => {
    expect(parse_documentation_try_it_origins("").origins).toEqual([]);
    for (const input of [
      "http://api.example.com",
      "https://api.example.com/path",
      "https://*.example.com",
      "https://localhost",
    ]) {
      expect(() => parse_documentation_try_it_origins(input)).toThrow();
    }
  });

  it("reads only the documented server environment variable", () => {
    expect(
      get_documentation_try_it_origin_config({
        OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS: "https://api.example.com",
      }).origins,
    ).toEqual(["https://api.example.com"]);
  });
});
