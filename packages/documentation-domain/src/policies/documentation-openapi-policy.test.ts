import { describe, expect, it } from "vitest";
import {
  DocumentationDomainError,
  inspect_openapi_document,
} from "./documentation-openapi-policy";

describe("documentation OpenAPI policy", () => {
  it("accepts self-contained 3.x documents and rejects remote references", () => {
    expect(
      inspect_openapi_document({
        openapi: "3.1.0",
        info: { title: "Example", version: "1" },
        paths: { "/pets": { get: { operationId: "listPets" } } },
      }),
    ).toEqual({
      openapi_version: "3.1.0",
      title: "Example",
      operation_count: 1,
      operations: [
        {
          method: "get",
          path: "/pets",
          operation_id: "listPets",
          destination_key: "get-pets-listpets",
        },
      ],
    });

    expect(() =>
      inspect_openapi_document({
        openapi: "3.0.3",
        info: { title: "Bad", version: "1" },
        paths: {},
        components: {
          schemas: { Bad: { $ref: "https://example.test/a.json" } },
        },
      }),
    ).toThrow(DocumentationDomainError);
  });

  it("rejects documents above the accepted operation ceiling", () => {
    const paths = Object.fromEntries(
      Array.from({ length: 20_001 }, (_, index) => [
        `/operation-${index}`,
        { get: {} },
      ]),
    );

    expect(() =>
      inspect_openapi_document({
        openapi: "3.1.0",
        info: { title: "Too large", version: "1" },
        paths,
      }),
    ).toThrow(DocumentationDomainError);
  });
});
