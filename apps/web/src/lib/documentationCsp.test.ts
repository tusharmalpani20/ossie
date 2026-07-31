import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildDocumentationConnectSrc,
  parseDocumentationTryItConnectOrigins,
} from "./documentationCsp";

describe("Documentation Try-It CSP", () => {
  it("normalizes exact origins and emits a deterministic connect-src policy", () => {
    const config = parseDocumentationTryItConnectOrigins(
      "https://B.example.com,https://a.example.com:443",
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
    expect(buildDocumentationConnectSrc(config.origins)).toBe(
      "connect-src 'self' https://a.example.com https://b.example.com",
    );
  });

  it("rejects wildcard, HTTP, credentials, and path-bearing values", () => {
    for (const value of [
      "https://*.example.com",
      "http://api.example.com",
      "https://user@example.com",
      "https://api.example.com/v1",
    ]) {
      expect(() => parseDocumentationTryItConnectOrigins(value)).toThrow();
    }
  });
});
