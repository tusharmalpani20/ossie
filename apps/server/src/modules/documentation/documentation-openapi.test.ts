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
});
