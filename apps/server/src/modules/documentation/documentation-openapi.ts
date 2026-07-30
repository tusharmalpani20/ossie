import { inspect_openapi_document } from "@repo/documentation-domain";
import { isAlias, parseDocument, visit } from "yaml";
import { parse_duplicate_safe_json } from "./documentation-json";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_NODES = 250_000;
const MAX_DEPTH = 100;
const MAX_SCALAR_LENGTH = 1024 * 1024;

export class DocumentationOpenApiError extends Error {
  readonly code = "documentation_openapi_invalid";

  constructor(message: string) {
    super(message);
    this.name = "DocumentationOpenApiError";
  }
}

const assert_bounded_structure = (
  value: unknown,
  depth = 0,
  state = { nodes: 0 },
): void => {
  state.nodes += 1;
  if (state.nodes > MAX_NODES || depth > MAX_DEPTH) {
    throw new DocumentationOpenApiError("OpenAPI structure exceeds safe limits");
  }
  if (typeof value === "string" && value.length > MAX_SCALAR_LENGTH) {
    throw new DocumentationOpenApiError("OpenAPI scalar exceeds safe limits");
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => assert_bounded_structure(entry, depth + 1, state));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((entry) =>
      assert_bounded_structure(entry, depth + 1, state),
    );
  }
};

export const parse_documentation_openapi = (
  bytes: Buffer,
  mime_type: "application/json" | "application/yaml",
) => {
  if (bytes.byteLength > MAX_BYTES) {
    throw new DocumentationOpenApiError("OpenAPI upload exceeds 10 MiB");
  }

  let value: unknown;
  try {
    if (mime_type === "application/json") {
      value = parse_duplicate_safe_json(bytes);
    } else {
      const document = parseDocument(bytes.toString("utf8"), {
        prettyErrors: false,
        strict: true,
        uniqueKeys: true,
      });
      let containsAlias = false;
      visit(document, (_key, node) => {
        if (isAlias(node)) containsAlias = true;
      });
      if (containsAlias || document.errors.length > 0) {
        throw new DocumentationOpenApiError(
          "YAML aliases and invalid YAML are not accepted",
        );
      }
      value = document.toJS({ maxAliasCount: 0 });
    }
    assert_bounded_structure(value);
    return {
      document: value,
      summary: inspect_openapi_document(value),
    };
  } catch (error) {
    if (error instanceof DocumentationOpenApiError) throw error;
    throw new DocumentationOpenApiError(
      error instanceof Error ? error.message : "OpenAPI document is invalid",
    );
  }
};
