import { describe, expect, it } from "vitest";
import type { DocumentationTryItRequestDescriptor } from "@repo/types";
import {
  DOCUMENTATION_REQUEST_EXAMPLE_CONTRACT_VERSION,
  DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS,
  generate_documentation_request_example,
} from "./documentation-request-example-policy";

const descriptor: DocumentationTryItRequestDescriptor = {
  descriptor_version: 1,
  destination_key: "create-pet",
  method: "POST",
  path: "/pets/{petId}",
  summary: "Create a pet",
  parameters: [
    {
      name: "petId",
      location: "path",
      required: true,
      value_type: "string",
      is_array: false,
      explode: false,
      sensitive: false,
      example: "pet/1",
    },
    {
      name: "limit",
      location: "query",
      required: true,
      value_type: "integer",
      is_array: false,
      explode: true,
      sensitive: false,
      example: 10,
    },
    {
      name: "tag",
      location: "query",
      required: false,
      value_type: "string",
      is_array: true,
      explode: true,
      sensitive: false,
      example: "friendly",
    },
    {
      name: "X-Trace",
      location: "header",
      required: true,
      value_type: "string",
      is_array: false,
      explode: false,
      sensitive: false,
      example: "O'Reilly",
    },
  ],
  request_body: {
    required: true,
    media_type: "application/json",
    schema: {
      type: "object",
      nullable: false,
      sensitive: false,
      required: ["name", "password"],
      properties: {
        name: {
          type: "string",
          nullable: false,
          sensitive: false,
        },
        password: {
          type: "string",
          nullable: false,
          sensitive: true,
        },
      },
    },
    example: { name: "Ada", password: "super-secret" },
  },
  security: { bearer: true, api_key_header_names: ["X-Api-Key"] },
  unsupported_reasons: [],
};

const header_parameter = (name: string, example: string) => ({
  name,
  location: "header" as const,
  required: false,
  value_type: "string" as const,
  is_array: false,
  explode: false,
  sensitive: false,
  example,
});

describe("documentation request example policy", () => {
  it("keeps the fixed registry order and generates every inert language", () => {
    expect(DOCUMENTATION_REQUEST_EXAMPLE_CONTRACT_VERSION).toBe(
      "documentation-request-example-v1",
    );
    expect(DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS).toEqual([
      "curl",
      "browser_fetch",
      "node_fetch",
      "python_urllib",
      "go_net_http",
    ]);

    for (const languageId of DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS) {
      const result = generate_documentation_request_example(
        descriptor,
        languageId,
      );
      expect(result).toMatchObject({
        status: "generated",
        contract_version: "documentation-request-example-v1",
        descriptor_version: 1,
        language_id: languageId,
      });
      expect(result.status === "generated" ? result.code : "").toContain(
        "https://api.example.com/pets/pet%2F1?limit=10&tag=friendly",
      );
      expect(JSON.stringify(result)).not.toContain("super-secret");
      expect(JSON.stringify(result)).toContain("SENSITIVE_VALUE");
    }

    const bodyfulGo = generate_documentation_request_example(
      descriptor,
      "go_net_http",
    );
    expect(bodyfulGo).toMatchObject({ status: "generated" });
    if (bodyfulGo.status === "generated") {
      expect(bodyfulGo.code).toContain('"bytes"');
      expect(bodyfulGo.code).toContain("bytes.NewBuffer");
    }
  });

  it("is deterministic and keeps live Try-It values out of the result", () => {
    const first = generate_documentation_request_example(descriptor, "curl");
    const second = generate_documentation_request_example(descriptor, "curl");
    expect(second).toEqual(first);
    expect(JSON.stringify(first)).not.toContain("api.internal.example");
    expect(JSON.stringify(first)).not.toContain("attempt-token");
  });

  it("redacts sensitive names again at the public example boundary", () => {
    const schemaLessDescriptor: DocumentationTryItRequestDescriptor = {
      ...descriptor,
      request_body: {
        required: true,
        media_type: "application/json",
        schema: {
          type: "object",
          nullable: false,
          sensitive: false,
        },
        example: {
          profile: {
            refreshToken: "refresh-secret",
            displayName: "Ada",
            entries: [{ session: "session-secret", label: "safe" }],
          },
          Authorization: "authorization-secret",
        },
      },
    };

    for (const languageId of DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS) {
      const result = generate_documentation_request_example(
        schemaLessDescriptor,
        languageId,
      );
      expect(result.status).toBe("generated");
      expect(JSON.stringify(result)).not.toContain("refresh-secret");
      expect(JSON.stringify(result)).not.toContain("session-secret");
      expect(JSON.stringify(result)).not.toContain("authorization-secret");
      expect(JSON.stringify(result)).toContain("displayName");
      expect(JSON.stringify(result)).toContain("SENSITIVE_VALUE");
    }
  });

  it("omits optional undocumented parameters but keeps required, zero, false, and exploded values", () => {
    const result = generate_documentation_request_example(
      {
        ...descriptor,
        method: "GET",
        path: "/pets/{petId}",
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
            name: "required-filter",
            location: "query",
            required: true,
            value_type: "string",
            is_array: false,
            explode: true,
            sensitive: false,
          },
          {
            name: "optional-filter",
            location: "query",
            required: false,
            value_type: "string",
            is_array: false,
            explode: true,
            sensitive: false,
          },
          {
            name: "zero",
            location: "query",
            required: false,
            value_type: "integer",
            is_array: false,
            explode: true,
            sensitive: false,
            example: 0,
          },
          {
            name: "flags",
            location: "query",
            required: false,
            value_type: "boolean",
            is_array: true,
            explode: true,
            sensitive: false,
            example: false,
          },
          {
            name: "optional-header",
            location: "header",
            required: false,
            value_type: "string",
            is_array: false,
            explode: false,
            sensitive: false,
          },
          {
            name: "X-Enabled",
            location: "header",
            required: false,
            value_type: "boolean",
            is_array: false,
            explode: false,
            sensitive: false,
            example: false,
          },
        ],
        request_body: null,
        security: { bearer: false, api_key_header_names: [] },
      },
      "curl",
    );

    expect(result).toMatchObject({ status: "generated" });
    if (result.status !== "generated") return;
    expect(result.code).toContain("<PATH_PETID>");
    expect(result.code).toContain("<QUERY_REQUIRED_FILTER>");
    expect(result.code).toContain("zero=0");
    expect(result.code).toContain("flags=false");
    expect(result.code).toContain("X-Enabled: false");
    expect(result.code).not.toContain("OPTIONAL_FILTER");
    expect(result.code).not.toContain("OPTIONAL_HEADER");
    expect(result.code).not.toMatch(/\\\n\+/u);

    const bodylessGo = generate_documentation_request_example(
      {
        ...descriptor,
        method: "GET",
        path: "/pets",
        parameters: [],
        request_body: null,
        security: { bearer: false, api_key_header_names: [] },
      },
      "go_net_http",
    );
    expect(bodylessGo).toMatchObject({ status: "generated" });
    if (bodylessGo.status === "generated") {
      expect(bodylessGo.code).not.toContain('"bytes"');
      expect(bodylessGo.code).toContain(
        'http.NewRequest("GET", "https://api.example.com/pets", nil)',
      );
    }

    const noHeaderCurl = generate_documentation_request_example(
      {
        ...descriptor,
        method: "GET",
        path: "/status",
        parameters: [],
        request_body: null,
        security: { bearer: false, api_key_header_names: [] },
      },
      "curl",
    );
    expect(noHeaderCurl).toMatchObject({ status: "generated" });
    if (noHeaderCurl.status === "generated") {
      expect(noHeaderCurl.code).toBe(
        "curl \\\n  --fail-with-body \\\n  --request \\\n  GET \\\n  'https://api.example.com/status'",
      );
      expect(noHeaderCurl.code).not.toContain("--header");
      expect(noHeaderCurl.code).not.toContain("--data-raw");
    }
  });

  it("enforces the header count after adding Content-Type", () => {
    const boundary = generate_documentation_request_example(
      {
        ...descriptor,
        path: "/pets",
        parameters: Array.from({ length: 49 }, (_, index) =>
          header_parameter(`X-Header-${index}`, "value"),
        ),
        security: { bearer: false, api_key_header_names: [] },
      },
      "curl",
    );
    expect(boundary.status).toBe("generated");
    if (boundary.status === "generated") {
      expect(boundary.code).toContain("Content-Type: application/json");
    }

    const overflow = generate_documentation_request_example(
      {
        ...descriptor,
        path: "/pets",
        parameters: Array.from({ length: 50 }, (_, index) =>
          header_parameter(`X-Header-${index}`, "value"),
        ),
        security: { bearer: false, api_key_header_names: [] },
      },
      "curl",
    );
    expect(overflow).toMatchObject({ status: "unsupported" });
  });

  it("enforces the header byte limit after adding Content-Type", () => {
    const boundary = generate_documentation_request_example(
      {
        ...descriptor,
        path: "/pets",
        parameters: [header_parameter("X", "x".repeat(32_736))],
        security: { bearer: false, api_key_header_names: [] },
      },
      "curl",
    );
    expect(boundary.status).toBe("generated");

    const overflow = generate_documentation_request_example(
      {
        ...descriptor,
        path: "/pets",
        parameters: [header_parameter("X", "x".repeat(32_737))],
        security: { bearer: false, api_key_header_names: [] },
      },
      "curl",
    );
    expect(overflow).toMatchObject({ status: "unsupported" });
  });

  it("returns bounded unsupported results instead of inventing required input", () => {
    expect(
      generate_documentation_request_example(
        {
          ...descriptor,
          descriptor_version: 0,
        },
        "curl",
      ),
    ).toMatchObject({ status: "unsupported", descriptor_version: 0 });
    expect(
      generate_documentation_request_example(descriptor, "unknown"),
    ).toMatchObject({ status: "unsupported", language_id: "unknown" });
    expect(
      generate_documentation_request_example(
        { ...descriptor, unsupported_reasons: ["<script>private</script>"] },
        "curl",
      ),
    ).toMatchObject({ status: "unsupported", reasons: [expect.any(String)] });
    expect(
      generate_documentation_request_example(
        {
          ...descriptor,
          request_body: { ...descriptor.request_body!, example: undefined },
        },
        "curl",
      ),
    ).toMatchObject({ status: "unsupported" });
  });
});
