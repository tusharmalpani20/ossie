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
  });

  it("is deterministic and keeps live Try-It values out of the result", () => {
    const first = generate_documentation_request_example(descriptor, "curl");
    const second = generate_documentation_request_example(descriptor, "curl");
    expect(second).toEqual(first);
    expect(JSON.stringify(first)).not.toContain("api.internal.example");
    expect(JSON.stringify(first)).not.toContain("attempt-token");
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
