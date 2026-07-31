import {
  DOCUMENTATION_TRY_IT_DESCRIPTOR_MAX_BYTES,
  DOCUMENTATION_TRY_IT_FIELD_VALUE_MAX_BYTES,
  DOCUMENTATION_TRY_IT_FIELDS_MAX,
  DOCUMENTATION_TRY_IT_HEADER_BYTES_MAX,
  DOCUMENTATION_TRY_IT_HEADERS_MAX,
  DOCUMENTATION_TRY_IT_JSON_DEPTH_MAX,
  DOCUMENTATION_TRY_IT_JSON_NODES_MAX,
  DOCUMENTATION_TRY_IT_REQUEST_BODY_MAX_BYTES,
  DOCUMENTATION_TRY_IT_SOURCE_DESCRIPTORS_MAX_BYTES,
  DOCUMENTATION_TRY_IT_TIMEOUT_MAX_MS,
  DOCUMENTATION_TRY_IT_URL_MAX_BYTES,
} from "@repo/constants";
import type {
  DocumentationTryItParameterDescriptor,
  DocumentationTryItRequestDescriptor,
} from "@repo/types";
import { DocumentationDomainError } from "../errors/documentation-domain-error";
import { is_forbidden_documentation_public_hostname } from "./documentation-origin-policy";

export { DocumentationDomainError };

type JsonRecord = Record<string, unknown>;
type Primitive = string | number | boolean;

const encoder = new TextEncoder();
const byte_length = (value: string) => encoder.encode(value).byteLength;
const fail = (message: string): never => {
  throw new DocumentationDomainError("documentation_try_it_invalid", message);
};

const validate_safe_path = (path: string, label: string): void => {
  const has_control_character = [...path].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\?#]/u.test(path) ||
    has_control_character ||
    /(?:^|\/)(?:\.{1,2}|%2e(?:%2e)?)(?:\/|$)/iu.test(path) ||
    /%2f|%5c/iu.test(path)
  )
    fail(`${label} is not a safe absolute path`);
};

export const normalize_documentation_try_it_target = (
  origin_input: string,
  base_path_input: string | null,
) => {
  let parsed: URL;
  try {
    parsed = new URL(origin_input);
  } catch {
    return fail("Try-It origin must be an exact HTTPS origin");
  }
  const url = parsed;
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    is_forbidden_documentation_public_hostname(url.hostname)
  )
    fail("Try-It origin must be a public exact HTTPS origin");
  const approved_origin = url.origin;
  const raw_base = base_path_input?.trim() || "/";
  validate_safe_path(raw_base, "Try-It base path");
  const base_path =
    raw_base === "/" ? "/" : raw_base.replace(/\/+$/u, "") || "/";
  return { approved_origin, base_path };
};

const is_record = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const destination_key = (method: string, path: string, operation_id?: string) =>
  `${method}-${path}-${operation_id ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");

const sensitive_name = (name: string) =>
  /(?:authorization|cookie|credential|secret|token|password|api[-_ ]?key|session)/iu.test(
    name,
  );

const primitive_type = (
  schema: JsonRecord | undefined,
): DocumentationTryItParameterDescriptor["value_type"] | null => {
  const type = schema?.type;
  return type === "string" ||
    type === "number" ||
    type === "integer" ||
    type === "boolean"
    ? type
    : null;
};

const security_for = (
  document: JsonRecord,
  operation: JsonRecord,
): { bearer: boolean; api_key_header_names: string[] } => {
  const components = is_record(document.components)
    ? document.components
    : undefined;
  const schemes = is_record(components?.securitySchemes)
    ? components.securitySchemes
    : {};
  const requirements = Array.isArray(operation.security)
    ? operation.security
    : Array.isArray(document.security)
      ? document.security
      : [];
  const names = new Set(
    requirements.flatMap((requirement) =>
      is_record(requirement) ? Object.keys(requirement) : [],
    ),
  );
  let bearer = false;
  const api_key_header_names: string[] = [];
  for (const name of names) {
    const scheme = schemes[name];
    if (!is_record(scheme)) continue;
    if (
      scheme.type === "http" &&
      typeof scheme.scheme === "string" &&
      scheme.scheme.toLowerCase() === "bearer"
    )
      bearer = true;
    if (
      scheme.type === "apiKey" &&
      scheme.in === "header" &&
      typeof scheme.name === "string" &&
      /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/u.test(scheme.name) &&
      !/^(?:authorization|cookie|host|content-length)$/iu.test(scheme.name)
    )
      api_key_header_names.push(scheme.name);
  }
  return { bearer, api_key_header_names: [...new Set(api_key_header_names)] };
};

const parameter_descriptor = (
  input: unknown,
): DocumentationTryItParameterDescriptor | null => {
  if (!is_record(input) || !is_record(input.schema)) return null;
  if (
    typeof input.name !== "string" ||
    !["path", "query", "header"].includes(String(input.in))
  )
    return null;
  const location = input.in as "path" | "query" | "header";
  const array = input.schema.type === "array";
  const item_schema =
    array && is_record(input.schema.items) ? input.schema.items : input.schema;
  const value_type = primitive_type(item_schema);
  if (!value_type || (location === "path" && array)) return null;
  const style = input.style ?? (location === "query" ? "form" : "simple");
  if (
    (location === "query" && style !== "form") ||
    (location !== "query" && style !== "simple") ||
    input.allowReserved === true
  )
    return null;
  const sensitive =
    sensitive_name(input.name) ||
    input.schema.format === "password" ||
    input.schema.writeOnly === true;
  if (sensitive && location !== "header") return null;
  const example =
    sensitive || !["string", "number", "boolean"].includes(typeof input.example)
      ? undefined
      : (input.example as Primitive);
  return {
    name: input.name,
    location,
    required:
      location === "path" ? input.required === true : Boolean(input.required),
    value_type,
    is_array: array,
    explode:
      input.explode === undefined
        ? location === "query"
        : input.explode === true,
    sensitive,
    ...(typeof input.description === "string"
      ? { description: input.description.slice(0, 8_192) }
      : {}),
    ...(example === undefined ? {} : { example }),
  };
};

export const derive_documentation_try_it_descriptors = (
  document: unknown,
): DocumentationTryItRequestDescriptor[] => {
  if (!is_record(document)) fail("OpenAPI document is required");
  const root = document as JsonRecord;
  if (!is_record(root.paths)) fail("OpenAPI paths are required");
  const paths = root.paths as JsonRecord;
  const descriptors: DocumentationTryItRequestDescriptor[] = [];
  for (const [path, path_item] of Object.entries(paths)) {
    if (!is_record(path_item)) continue;
    try {
      validate_safe_path(path, "OpenAPI operation path");
    } catch {
      continue;
    }
    for (const method of ["get", "post", "put", "patch", "delete"] as const) {
      const operation = path_item[method];
      if (!is_record(operation)) continue;
      const unsupported_reasons: string[] = [];
      const raw_parameters = [
        ...(Array.isArray(path_item.parameters) ? path_item.parameters : []),
        ...(Array.isArray(operation.parameters) ? operation.parameters : []),
      ];
      const merged = new Map<string, DocumentationTryItParameterDescriptor>();
      for (const raw of raw_parameters) {
        const parsed = parameter_descriptor(raw);
        if (!parsed) {
          unsupported_reasons.push("Unsupported request parameter");
          continue;
        }
        merged.set(`${parsed.location}:${parsed.name}`, parsed);
      }
      const template_names = [...path.matchAll(/\{([^{}]+)\}/gu)].map(
        (match) => match[1] ?? "",
      );
      if (
        new Set(template_names).size !== template_names.length ||
        template_names.some((name) => !merged.get(`path:${name}`)?.required) ||
        [...merged.values()].some(
          (parameter) =>
            parameter.location === "path" &&
            !template_names.includes(parameter.name),
        )
      )
        unsupported_reasons.push("Invalid path template parameters");

      let request_body: DocumentationTryItRequestDescriptor["request_body"] =
        null;
      if (is_record(operation.requestBody)) {
        const content = is_record(operation.requestBody.content)
          ? operation.requestBody.content
          : {};
        const media = Object.keys(content).find(
          (value) =>
            value.toLowerCase() === "application/json" ||
            /^application\/[^;]+\+json$/iu.test(value),
        );
        if (method === "get") {
          unsupported_reasons.push("GET request bodies are unsupported");
        } else if (!media || !is_record(content[media])) {
          unsupported_reasons.push("Only JSON request bodies are supported");
        } else {
          request_body = {
            required: operation.requestBody.required === true,
            media_type: media,
            schema: null,
          };
        }
      }
      const descriptor: DocumentationTryItRequestDescriptor = {
        descriptor_version: 1,
        destination_key: destination_key(
          method,
          path,
          typeof operation.operationId === "string"
            ? operation.operationId
            : undefined,
        ),
        method:
          method.toUpperCase() as DocumentationTryItRequestDescriptor["method"],
        path,
        summary:
          typeof operation.summary === "string"
            ? operation.summary.slice(0, 8_192)
            : null,
        parameters: [...merged.values()],
        request_body,
        security: security_for(root, operation),
        unsupported_reasons: [...new Set(unsupported_reasons)],
      };
      if (
        byte_length(JSON.stringify(descriptor)) >
        DOCUMENTATION_TRY_IT_DESCRIPTOR_MAX_BYTES
      )
        fail("Try-It operation descriptor exceeds its safety ceiling");
      descriptors.push(descriptor);
    }
  }
  if (
    byte_length(JSON.stringify(descriptors)) >
    DOCUMENTATION_TRY_IT_SOURCE_DESCRIPTORS_MAX_BYTES
  )
    fail("Try-It source descriptors exceed their safety ceiling");
  return descriptors;
};

const assert_value_size = (value: Primitive) => {
  if (byte_length(String(value)) > DOCUMENTATION_TRY_IT_FIELD_VALUE_MAX_BYTES)
    fail("Try-It field value exceeds its safety ceiling");
};

export type DocumentationTryItRequestInput = {
  approved_origin: string;
  base_path: string;
  descriptor: DocumentationTryItRequestDescriptor;
  values: Record<string, Primitive | Primitive[] | undefined>;
  bearer_token: string | null;
  api_key: string | null;
  api_key_header_name: string | null;
  json_body: unknown | null;
  timeout_ms: number;
};

export const build_documentation_try_it_request = (
  input: DocumentationTryItRequestInput,
) => {
  if (input.descriptor.unsupported_reasons.length)
    fail("Operation is unsupported");
  if (
    !Number.isInteger(input.timeout_ms) ||
    input.timeout_ms < 1_000 ||
    input.timeout_ms > DOCUMENTATION_TRY_IT_TIMEOUT_MAX_MS
  )
    fail("Try-It timeout is invalid");
  if (Object.keys(input.values).length > DOCUMENTATION_TRY_IT_FIELDS_MAX)
    fail("Too many Try-It request fields");
  const target = normalize_documentation_try_it_target(
    input.approved_origin,
    input.base_path,
  );
  let operation_path = input.descriptor.path;
  const query = new URLSearchParams();
  const headers: Record<string, string> = {};
  for (const parameter of input.descriptor.parameters) {
    const value = input.values[parameter.name];
    if (value === undefined || value === "") {
      if (parameter.required) fail(`${parameter.name} is required`);
      continue;
    }
    const values = Array.isArray(value) ? value : [value];
    values.forEach(assert_value_size);
    if (parameter.location === "path") {
      operation_path = operation_path.replace(
        `{${parameter.name}}`,
        encodeURIComponent(String(values[0])),
      );
    } else if (parameter.location === "query") {
      if (parameter.is_array && !parameter.explode)
        query.set(parameter.name, values.map(String).join(","));
      else
        values.forEach((entry) => query.append(parameter.name, String(entry)));
    } else {
      const header_value = values.map(String).join(",");
      if (
        [...header_value].some((character) =>
          [0, 10, 13].includes(character.charCodeAt(0)),
        )
      )
        fail("Try-It header is invalid");
      headers[parameter.name] = header_value;
    }
  }
  if (/\{[^{}]+\}/u.test(operation_path)) fail("Path parameter is missing");
  if (input.bearer_token)
    headers.Authorization = `Bearer ${input.bearer_token}`;
  if (input.api_key && input.api_key_header_name)
    headers[input.api_key_header_name] = input.api_key;
  if (Object.keys(headers).length > DOCUMENTATION_TRY_IT_HEADERS_MAX)
    fail("Too many Try-It request headers");
  if (
    byte_length(
      Object.entries(headers)
        .map(([name, value]) => `${name}:${value}`)
        .join("\n"),
    ) > DOCUMENTATION_TRY_IT_HEADER_BYTES_MAX
  )
    fail("Try-It request headers exceed their safety ceiling");
  const prefix = target.base_path === "/" ? "" : target.base_path;
  const url = new URL(`${prefix}${operation_path}`, target.approved_origin);
  url.search = query.toString();
  if (byte_length(url.href) > DOCUMENTATION_TRY_IT_URL_MAX_BYTES)
    fail("Try-It URL exceeds its safety ceiling");
  let body: string | undefined;
  if (input.json_body !== null) {
    const request_body = input.descriptor.request_body;
    if (input.descriptor.method === "GET")
      fail("This operation does not accept a JSON body");
    if (!request_body)
      return fail("This operation does not accept a JSON body");
    body = JSON.stringify(input.json_body);
    if (byte_length(body) > DOCUMENTATION_TRY_IT_REQUEST_BODY_MAX_BYTES)
      fail("Try-It JSON body exceeds its safety ceiling");
    headers["Content-Type"] = request_body.media_type;
    validate_json_shape(input.json_body);
  }
  return {
    url: url.href,
    method: input.descriptor.method,
    headers,
    body: body ?? null,
    timeout_ms: input.timeout_ms,
    fetch_options: {
      method: input.descriptor.method,
      headers,
      ...(body === undefined ? {} : { body }),
      credentials: "omit" as const,
      redirect: "error" as const,
      referrerPolicy: "no-referrer" as const,
      cache: "no-store" as const,
    },
  };
};

const validate_json_shape = (root: unknown): void => {
  let nodes = 0;
  const visit = (value: unknown, depth: number): void => {
    nodes += 1;
    if (
      depth > DOCUMENTATION_TRY_IT_JSON_DEPTH_MAX ||
      nodes > DOCUMENTATION_TRY_IT_JSON_NODES_MAX
    )
      fail("Try-It JSON body exceeds its structural safety ceiling");
    if (Array.isArray(value)) value.forEach((entry) => visit(entry, depth + 1));
    else if (is_record(value))
      Object.values(value).forEach((entry) => visit(entry, depth + 1));
    else if (
      value !== null &&
      !["string", "boolean", "number"].includes(typeof value)
    )
      fail("Try-It JSON body contains an unsupported value");
    else if (typeof value === "number" && !Number.isFinite(value))
      fail("Try-It JSON body numbers must be finite");
  };
  visit(root, 0);
};

export const redact_documentation_try_it_text = (
  value: string,
  secrets: readonly string[],
) => {
  let result = value;
  for (const secret of [...new Set(secrets)].filter(Boolean)) {
    if ([...secret].length < 4)
      fail("Response display is blocked for a short sensitive value");
    result = result.split(secret).join("[REDACTED]");
  }
  return result;
};

const shell_quote = (value: string) => `'${value.replaceAll("'", "'\"'\"'")}'`;

export const generate_documentation_try_it_examples = (input: {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  sensitive_header_names: string[];
  timeout_ms: number;
}) => {
  const sensitive = new Set(
    input.sensitive_header_names.map((name) => name.toLowerCase()),
  );
  const safe_headers = Object.fromEntries(
    Object.entries(input.headers).map(([name, value]) => [
      name,
      sensitive.has(name.toLowerCase())
        ? name.toLowerCase() === "authorization"
          ? "Bearer <BEARER_TOKEN>"
          : "<API_KEY>"
        : value,
    ]),
  );
  const curl = [
    "curl",
    "--fail-with-body",
    `--max-time ${Math.ceil(input.timeout_ms / 1_000)}`,
    `-X ${input.method}`,
    ...Object.entries(safe_headers).map(
      ([name, value]) => `-H ${shell_quote(`${name}: ${value}`)}`,
    ),
    ...(input.body === null ? [] : [`--data ${shell_quote(input.body)}`]),
    shell_quote(input.url),
  ].join(" \\\n  ");
  const javascript_options = JSON.stringify(
    {
      method: input.method,
      headers: safe_headers,
      ...(input.body === null ? {} : { body: input.body }),
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      cache: "no-store",
    },
    null,
    2,
  ).replace(/^(\s*)"([A-Za-z][A-Za-z0-9]*)":/gmu, "$1$2:");
  const javascript = [
    "const controller = new AbortController();",
    `const timeout = setTimeout(() => controller.abort(), ${input.timeout_ms});`,
    "try {",
    `  const response = await fetch(${JSON.stringify(input.url)}, ${javascript_options});`,
    "} finally {",
    "  clearTimeout(timeout);",
    "}",
  ].join("\n");
  const python = [
    "import urllib.request",
    "",
    `request = urllib.request.Request(${JSON.stringify(input.url)},`,
    `    method=${JSON.stringify(input.method)},`,
    `    headers=${JSON.stringify(safe_headers)},`,
    ...(input.body === null
      ? []
      : [`    data=${JSON.stringify(input.body)}.encode("utf-8"),`]),
    ")",
    `with urllib.request.urlopen(request, timeout=${Math.ceil(input.timeout_ms / 1_000)}) as response:`,
    "    print(response.read())",
  ].join("\n");
  return { curl, javascript, python };
};
