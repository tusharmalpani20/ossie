import { describe, expect, it } from "vitest";
import {
  build_documentation_try_it_request,
  derive_documentation_try_it_descriptors,
  generate_documentation_try_it_examples,
  normalize_documentation_try_it_target,
  redact_documentation_try_it_text,
} from "./documentation-try-it-policy";
import { DocumentationDomainError } from "../errors/documentation-domain-error";

describe("documentation Try-It policy", () => {
  it("normalizes an exact public HTTPS target and rejects unsafe origins", () => {
    expect(
      normalize_documentation_try_it_target(
        "https://API.Example.com:443",
        "/v1/",
      ),
    ).toEqual({
      approved_origin: "https://api.example.com",
      base_path: "/v1",
    });
    for (const unsafe of [
      "http://api.example.com",
      "https://localhost",
      "https://127.0.0.1",
      "https://10.0.0.1",
      "https://api.example.com/path",
      "https://user:pass@api.example.com",
    ]) {
      expect(() => normalize_documentation_try_it_target(unsafe, "/")).toThrow(
        DocumentationDomainError,
      );
    }
  });

  it("derives supported request and security metadata without trusting examples", () => {
    const descriptors = derive_documentation_try_it_descriptors({
      openapi: "3.1.0",
      info: { title: "Pets", version: "1" },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer" },
          keyAuth: { type: "apiKey", in: "header", name: "X-Api-Key" },
        },
      },
      security: [{ bearerAuth: [] }],
      paths: {
        "/pets/{petId}": {
          get: {
            operationId: "getPet",
            parameters: [
              {
                name: "petId",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
              {
                name: "limit",
                in: "query",
                schema: { type: "integer", example: 10 },
              },
            ],
          },
        },
      },
    });
    expect(descriptors[0]).toMatchObject({
      method: "GET",
      path: "/pets/{petId}",
      destination_key: "get-pets-petid-getpet",
      security: { bearer: true, api_key_header_names: [] },
      unsupported_reasons: [],
    });
    expect(descriptors[0]?.parameters).toHaveLength(2);
  });

  it("builds an encoded request without allowing path or header injection", () => {
    const request = build_documentation_try_it_request({
      approved_origin: "https://api.example.com",
      base_path: "/v1",
      descriptor: {
        descriptor_version: 1,
        destination_key: "get-pets-petid",
        method: "GET",
        path: "/pets/{petId}",
        summary: null,
        parameters: [
          {
            name: "petId",
            location: "path",
            required: true,
            value_type: "string",
            is_array: false,
            explode: false,
            sensitive: false,
          },
          {
            name: "tag",
            location: "query",
            required: false,
            value_type: "string",
            is_array: true,
            explode: true,
            sensitive: false,
          },
        ],
        request_body: null,
        security: { bearer: true, api_key_header_names: [] },
        unsupported_reasons: [],
      },
      values: { petId: "cat/dog", tag: ["small", "calm"] },
      bearer_token: "top-secret",
      api_key: null,
      api_key_header_name: null,
      json_body: null,
      timeout_ms: 15_000,
    });
    expect(request.url).toBe(
      "https://api.example.com/v1/pets/cat%2Fdog?tag=small&tag=calm",
    );
    expect(request.headers).toEqual({ Authorization: "Bearer top-secret" });
    expect(request.fetch_options).toMatchObject({
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });
  });

  it("redacts exact secrets and emits language-safe placeholder examples", () => {
    expect(
      redact_documentation_try_it_text('token="abcd-secret"', ["abcd-secret"]),
    ).toBe('token="[REDACTED]"');
    expect(() =>
      redact_documentation_try_it_text("reflected xx", ["xx"]),
    ).toThrow(DocumentationDomainError);

    const examples = generate_documentation_try_it_examples({
      url: "https://api.example.com/v1/pets?q=a%27b",
      method: "GET",
      headers: { Authorization: "Bearer actual-secret" },
      body: null,
      sensitive_header_names: ["Authorization"],
      timeout_ms: 15_000,
    });
    expect(examples.curl).toContain("<BEARER_TOKEN>");
    expect(examples.javascript).toContain('credentials: "omit"');
    expect(examples.python).toContain("urllib.request");
    expect(JSON.stringify(examples)).not.toContain("actual-secret");
  });
});
