import { DocumentationDomainError } from "../errors/documentation-domain-error";

export { DocumentationDomainError };

const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

const visit = (value: unknown, depth = 0): void => {
  if (depth > 100) {
    throw new DocumentationDomainError(
      "documentation_openapi_invalid",
      "OpenAPI structure is too deep",
    );
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => visit(entry, depth + 1));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (
        key === "$ref" &&
        (typeof entry !== "string" || !entry.startsWith("#/"))
      ) {
        throw new DocumentationDomainError(
          "documentation_openapi_invalid",
          "OpenAPI references must be self-contained",
        );
      }
      visit(entry, depth + 1);
    }
  }
};

const destination = (method: string, path: string, operationId?: string) =>
  `${method}-${path}-${operationId ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");

export const inspect_openapi_document = (input: unknown) => {
  visit(input);
  if (!input || typeof input !== "object") {
    throw new DocumentationDomainError(
      "documentation_openapi_invalid",
      "OpenAPI document must be an object",
    );
  }
  const document = input as Record<string, unknown>;
  if (
    typeof document.openapi !== "string" ||
    !/^3\.(?:0|1)\.\d+$/u.test(document.openapi)
  ) {
    throw new DocumentationDomainError(
      "documentation_openapi_invalid",
      "Only OpenAPI 3.0.x and 3.1.x are supported",
    );
  }
  const info = document.info as Record<string, unknown> | undefined;
  const paths = document.paths as Record<string, unknown> | undefined;
  if (!info || typeof info.title !== "string" || !paths) {
    throw new DocumentationDomainError(
      "documentation_openapi_invalid",
      "OpenAPI info and paths are required",
    );
  }
  const operations = Object.entries(paths).flatMap(([path, pathValue]) => {
    if (!pathValue || typeof pathValue !== "object") return [];
    const record = pathValue as Record<string, unknown>;
    return HTTP_METHODS.flatMap((method) => {
      const value = record[method];
      if (!value || typeof value !== "object") return [];
      const operationId = (value as Record<string, unknown>).operationId;
      return [{
        method,
        path,
        ...(typeof operationId === "string" ? { operation_id: operationId } : {}),
        destination_key: destination(
          method,
          path,
          typeof operationId === "string" ? operationId : undefined,
        ),
      }];
    });
  });
  return {
    openapi_version: document.openapi,
    title: info.title.trim(),
    operation_count: operations.length,
    operations,
  };
};
