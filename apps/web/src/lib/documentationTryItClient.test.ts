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

  it("accepts an empty response without attempting an unbounded body read", async () => {
    await expect(
      executeDocumentationTryItRequest({
        configuration,
        web_origin_set_digest: "a".repeat(64),
        request: {
          url: "https://api.example.com/no-content",
          method: "GET",
          headers: {},
          body: null,
        },
        secrets: [],
        timeout_ms: 15_000,
        fetchImpl: vi.fn(
          async () =>
            new Response(null, {
              status: 204,
              headers: { "x-request-id": "safe-id" },
            }),
        ),
      }),
    ).resolves.toMatchObject({
      kind: "empty",
      status: 204,
      headers: { "x-request-id": "safe-id" },
    });
  });

  it("blocks binary, unknown, malformed JSON, and invalid UTF-8 response bodies", async () => {
    const cases = [
      new Response(new Uint8Array([0, 1, 2]), {
        headers: { "content-type": "application/octet-stream" },
      }),
      new Response("opaque", {
        headers: { "content-type": "application/x-unknown" },
      }),
      new Response("{broken", {
        headers: { "content-type": "application/json" },
      }),
      new Response(new Uint8Array([0xc3, 0x28]), {
        headers: { "content-type": "text/plain" },
      }),
    ];
    for (const response of cases) {
      await expect(
        executeDocumentationTryItRequest({
          configuration,
          web_origin_set_digest: "a".repeat(64),
          request: {
            url: "https://api.example.com/unsafe",
            method: "GET",
            headers: {},
            body: null,
          },
          secrets: [],
          timeout_ms: 15_000,
          fetchImpl: vi.fn(async () => response),
        }),
      ).resolves.toMatchObject({ kind: "blocked" });
    }
  });

  it("blocks response header text above the safe aggregate limit", async () => {
    await expect(
      executeDocumentationTryItRequest({
        configuration,
        web_origin_set_digest: "a".repeat(64),
        request: {
          url: "https://api.example.com/headers",
          method: "GET",
          headers: {},
          body: null,
        },
        secrets: [],
        timeout_ms: 15_000,
        fetchImpl: vi.fn(
          async () =>
            new Response("ok", {
              headers: {
                "content-type": "text/plain",
                "x-large": "x".repeat(33 * 1024),
              },
            }),
        ),
      }),
    ).rejects.toMatchObject({ code: "response_headers_too_large" });
  });

  it("refuses oversized URLs/bodies and malformed JSON before target fetch", async () => {
    const fetchImpl = vi.fn();
    const boundedConfiguration = {
      ...configuration,
      request_limits: { url_bytes: 40, body_bytes: 8, timeout_ms: 15_000 },
    };
    const invalidRequests: Array<{
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string | null;
    }> = [
      {
        url: `https://api.example.com/${"x".repeat(40)}`,
        method: "GET",
        headers: {},
        body: null,
      },
      {
        url: "https://api.example.com/x",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"long":true}',
      },
      {
        url: "https://api.example.com/x",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{broken",
      },
    ];
    for (const request of invalidRequests) {
      await expect(
        executeDocumentationTryItRequest({
          configuration: boundedConfiguration,
          web_origin_set_digest: "a".repeat(64),
          request,
          secrets: [],
          timeout_ms: 15_000,
          fetchImpl,
        }),
      ).rejects.toMatchObject({ code: "client_validation_blocked" });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
