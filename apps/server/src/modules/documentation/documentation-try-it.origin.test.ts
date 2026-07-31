import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  DocumentationTryItOriginError,
  validate_documentation_try_it_origin,
  type DocumentationTryItDnsAnswer,
} from "./documentation-try-it.origin";

describe("Documentation Try-It origin validation", () => {
  it("keeps target transport out of the server-owned Try-It path", () => {
    const sources = [
      "documentation-try-it.origin.ts",
      "documentation-try-it.token.ts",
      "documentation.routes.ts",
    ]
      .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
      .join("\n");
    expect(sources).not.toMatch(/\bfetch\s*\(/u);
    expect(sources).not.toMatch(
      /from\s+["'](?:axios|node:http|node:https|node:net|node:tls)["']/u,
    );
  });
  it("requires an operator-allowed origin whose every DNS answer is public", async () => {
    const resolve = vi.fn(async () => [
      { address: "93.184.216.34", family: 4 as const },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 as const },
    ]);
    await expect(
      validate_documentation_try_it_origin({
        origin: "https://api.example.com",
        allowed_origins: new Set(["https://api.example.com"]),
        resolve,
      }),
    ).resolves.toBe("https://api.example.com");
    expect(resolve).toHaveBeenCalledWith("api.example.com", { all: true });
  });

  it("fails closed for disallowed, mixed, private, or unresolved answers", async () => {
    await expect(
      validate_documentation_try_it_origin({
        origin: "https://api.example.com",
        allowed_origins: new Set(),
        resolve: vi.fn(),
      }),
    ).rejects.toMatchObject({ code: "origin_not_allowed" });
    for (const answers of [
      [{ address: "10.0.0.1", family: 4 as const }],
      [
        { address: "93.184.216.34", family: 4 as const },
        { address: "127.0.0.1", family: 4 as const },
      ],
    ]) {
      await expect(
        validate_documentation_try_it_origin({
          origin: "https://api.example.com",
          allowed_origins: new Set(["https://api.example.com"]),
          resolve: vi.fn(async () => answers),
        }),
      ).rejects.toBeInstanceOf(DocumentationTryItOriginError);
    }
  });

  it("fails closed when uncached all-address DNS validation times out", async () => {
    await expect(
      validate_documentation_try_it_origin({
        origin: "https://api.example.com",
        allowed_origins: new Set(["https://api.example.com"]),
        resolve: vi.fn(
          () => new Promise<DocumentationTryItDnsAnswer[]>(() => undefined),
        ),
        timeout_ms: 5,
      }),
    ).rejects.toMatchObject({ code: "origin_resolution_failed" });
  });
});
