import { describe, expect, it } from "vitest";
import {
  DocumentationOpenApiError,
  parse_documentation_openapi,
} from "./documentation-openapi";

describe("Documentation OpenAPI parser", () => {
  it("parses bounded self-contained YAML without aliases", () => {
    expect(
      parse_documentation_openapi(
        Buffer.from(`
openapi: 3.1.0
info:
  title: Pets
  version: "1"
paths:
  /pets:
    get:
      operationId: listPets
`),
        "application/yaml",
      ),
    ).toMatchObject({
      summary: { openapi_version: "3.1.0", operation_count: 1 },
    });
  });

  it("rejects YAML aliases and remote references", () => {
    expect(() =>
      parse_documentation_openapi(
        Buffer.from(`
openapi: 3.1.0
info: &info
  title: Pets
  version: "1"
paths: {}
copy: *info
`),
        "application/yaml",
      ),
    ).toThrow(DocumentationOpenApiError);

    expect(() =>
      parse_documentation_openapi(
        Buffer.from(
          JSON.stringify({
            openapi: "3.0.3",
            info: { title: "Pets", version: "1" },
            paths: {},
            components: {
              schemas: { Pet: { $ref: "https://example.test/pet.json" } },
            },
          }),
        ),
        "application/json",
      ),
    ).toThrow(DocumentationOpenApiError);
  });

  it("rejects duplicate JSON keys at any depth before object construction", () => {
    expect(() =>
      parse_documentation_openapi(
        Buffer.from(
          '{"openapi":"3.1.0","info":{"title":"Pets","title":"Changed","version":"1"},"paths":{}}',
        ),
        "application/json",
      ),
    ).toThrow(/duplicate JSON key/iu);
  });

  it("derives a bounded versioned request descriptor during inspection", () => {
    const parsed = parse_documentation_openapi(
      Buffer.from(
        JSON.stringify({
          openapi: "3.1.0",
          info: { title: "Pets", version: "1" },
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
                ],
              },
            },
          },
        }),
      ),
      "application/json",
    );
    expect(parsed.summary.operations[0]).toMatchObject({
      descriptor_version: 1,
      request_descriptor: {
        method: "GET",
        path: "/pets/{petId}",
        unsupported_reasons: [],
      },
    });
    expect(parsed.summary.operations[0]?.descriptor_digest).toMatch(
      /^[a-f0-9]{64}$/u,
    );
  });
});
