import { describe, expect, it, vi } from "vitest";
import {
  DocumentationTryItClientError,
  executeDocumentationTryItRequest,
} from "./documentationTryItClient";

const configuration = {
  approved_origin: "https://api.example.com",
  operator_origin_set_digest: "a".repeat(64),
  response_limits: { body_bytes: 1024, headers: 100 },
};

describe("Documentation Try-It browser client", () => {
  it("sends once with ambient credentials, redirects, referrers, and cache disabled", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('{"ok":true}', {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const result = await executeDocumentationTryItRequest({
      configuration,
      web_origin_set_digest: "a".repeat(64),
      request: {
        url: "https://api.example.com/v1/pets",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"name":"Milo"}',
      },
      secrets: [],
      timeout_ms: 15_000,
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.com/v1/pets",
      expect.objectContaining({
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        cache: "no-store",
      }),
    );
    expect(result).toMatchObject({
      kind: "json",
      status: 200,
      text: '{\n  "ok": true\n}',
    });
  });

  it("fails closed on CSP digest mismatch or target-origin substitution", async () => {
    const fetchImpl = vi.fn();
    await expect(
      executeDocumentationTryItRequest({
        configuration,
        web_origin_set_digest: "b".repeat(64),
        request: {
          url: "https://api.example.com/v1/pets",
          method: "GET",
          headers: {},
          body: null,
        },
        secrets: [],
        timeout_ms: 15_000,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: "csp_mismatch" });
    await expect(
      executeDocumentationTryItRequest({
        configuration,
        web_origin_set_digest: "a".repeat(64),
        request: {
          url: "https://evil.example.net/pets",
          method: "GET",
          headers: {},
          body: null,
        },
        secrets: [],
        timeout_ms: 15_000,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: "origin_mismatch" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("redacts reflected secrets before returning render state", async () => {
    const result = await executeDocumentationTryItRequest({
      configuration,
      web_origin_set_digest: "a".repeat(64),
      request: {
        url: "https://api.example.com/reflect",
        method: "GET",
        headers: { Authorization: "Bearer unique-secret" },
        body: null,
      },
      secrets: ["unique-secret"],
      timeout_ms: 15_000,
      fetchImpl: vi.fn(
        async () =>
          new Response('{"token":"unique-secret"}', {
            headers: {
              "content-type": "application/json",
              "x-reflected": "unique-secret",
            },
          }),
      ),
    });
    expect(JSON.stringify(result)).not.toContain("unique-secret");
    expect(JSON.stringify(result)).toContain("[REDACTED]");
  });

  it("blocks active, oversized, no-stream, and short-secret responses", async () => {
    await expect(
      executeDocumentationTryItRequest({
        configuration,
        web_origin_set_digest: "a".repeat(64),
        request: {
          url: "https://api.example.com/html",
          method: "GET",
          headers: {},
          body: null,
        },
        secrets: [],
        timeout_ms: 15_000,
        fetchImpl: vi.fn(
          async () =>
            new Response("<script>alert(1)</script>", {
              headers: { "content-type": "text/html" },
            }),
        ),
      }),
    ).resolves.toMatchObject({ kind: "blocked" });

    await expect(
      executeDocumentationTryItRequest({
        configuration: {
          ...configuration,
          response_limits: { body_bytes: 4, headers: 100 },
        },
        web_origin_set_digest: "a".repeat(64),
        request: {
          url: "https://api.example.com/large",
          method: "GET",
          headers: {},
          body: null,
        },
        secrets: [],
        timeout_ms: 15_000,
        fetchImpl: vi.fn(
          async () =>
            new Response("12345", {
              headers: { "content-type": "text/plain" },
            }),
        ),
      }),
    ).rejects.toBeInstanceOf(DocumentationTryItClientError);

    await expect(
      executeDocumentationTryItRequest({
        configuration,
        web_origin_set_digest: "a".repeat(64),
        request: {
          url: "https://api.example.com/short",
          method: "GET",
          headers: {},
          body: null,
        },
        secrets: ["xx"],
        timeout_ms: 15_000,
        fetchImpl: vi.fn(
          async () =>
            new Response("xx", { headers: { "content-type": "text/plain" } }),
        ),
      }),
    ).resolves.toMatchObject({ kind: "blocked" });
  });
});
