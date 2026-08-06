import type { DocumentationTryItRequestDescriptor } from "@repo/types";
import { is_documentation_sensitive_name } from "./documentation-sensitive-name-policy";

export const DOCUMENTATION_REQUEST_EXAMPLE_CONTRACT_VERSION =
  "documentation-request-example-v1" as const;

export const DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS = [
  "curl",
  "browser_fetch",
  "node_fetch",
  "python_urllib",
  "go_net_http",
] as const;

export type DocumentationRequestExampleLanguageId =
  (typeof DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS)[number];

type ExampleContext = {
  url: string;
  method: DocumentationTryItRequestDescriptor["method"];
  headers: Record<string, string>;
  body: string | null;
};

type DocumentationRequestExampleRegistryEntry = {
  id: DocumentationRequestExampleLanguageId;
  display_name: string;
  runtime: string;
  syntax: string;
  file_extension: string;
  generate: (context: ExampleContext) => string;
};

export type DocumentationRequestExampleGeneratedResult = {
  status: "generated";
  contract_version: typeof DOCUMENTATION_REQUEST_EXAMPLE_CONTRACT_VERSION;
  descriptor_version: 1;
  language_id: DocumentationRequestExampleLanguageId;
  display_name: string;
  runtime: string;
  syntax: string;
  file_extension: string;
  code: string;
};

export type DocumentationRequestExampleUnsupportedResult = {
  status: "unsupported";
  contract_version: typeof DOCUMENTATION_REQUEST_EXAMPLE_CONTRACT_VERSION;
  descriptor_version: number | null;
  language_id: string;
  reasons: string[];
};

export type DocumentationRequestExampleResult =
  | DocumentationRequestExampleGeneratedResult
  | DocumentationRequestExampleUnsupportedResult;

const PLACEHOLDER_ORIGIN = "https://api.example.com";
const MAX_OUTPUT_BYTES = 256 * 1024;
const MAX_HEADERS = 50;
const MAX_HEADER_BYTES = 32 * 1024;
const MAX_JSON_DEPTH = 32;
const MAX_JSON_NODES = 10_000;

const is_record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const byte_length = (value: string) =>
  new TextEncoder().encode(value).byteLength;

const has_control_character = (value: string) =>
  [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

const unsupported_reason =
  "This operation cannot produce a safe request example.";
const unsupported_output_reason =
  "The generated example exceeds its safety limits.";

const unsupported = (
  descriptor_version: number | null,
  language_id: string,
  reason = unsupported_reason,
): DocumentationRequestExampleUnsupportedResult => ({
  status: "unsupported",
  contract_version: DOCUMENTATION_REQUEST_EXAMPLE_CONTRACT_VERSION,
  descriptor_version,
  language_id,
  reasons: [reason],
});

const has_own = (value: object, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const is_language_id = (
  value: string,
): value is DocumentationRequestExampleLanguageId =>
  (DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS as readonly string[]).includes(
    value,
  );

const is_placeholder = (value: string) => /^<[A-Z][A-Z0-9_]*>$/u.test(value);

const placeholder_for = (location: "path" | "query" | "header", name: string) =>
  `<${location.toUpperCase()}_${name
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]+/gu, "_")
    .replaceAll(/^_+|_+$/gu, "")}>`;

const encode_component = (value: string) =>
  is_placeholder(value) ? value : encodeURIComponent(value);

const shell_quote = (value: string) => `'${value.replaceAll("'", "'\"'\"'")}'`;

const python_quote = (value: unknown) => JSON.stringify(value);

const safe_header_name = (name: string) =>
  /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/u.test(name) &&
  !/^(?:host|content-length)$/iu.test(name);

const safe_header_value = (value: string) =>
  ![...value].some((character) => {
    const code = character.charCodeAt(0);
    return code === 0 || code === 10 || code === 13;
  });

type JsonSchemaLike = {
  type?: string | null;
  sensitive?: boolean;
  properties?: Record<string, JsonSchemaLike>;
  items?: JsonSchemaLike;
};

type JsonSafe =
  | null
  | string
  | number
  | boolean
  | JsonSafe[]
  | {
      [key: string]: JsonSafe;
    };

const is_json_safe = (value: unknown): value is JsonSafe => {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(is_json_safe);
  if (is_record(value)) return Object.values(value).every(is_json_safe);
  return false;
};

const stable_json = (
  value: unknown,
  depth = 0,
  nodes = { count: 0 },
): string | null => {
  nodes.count += 1;
  if (depth > MAX_JSON_DEPTH || nodes.count > MAX_JSON_NODES) return null;
  if (!is_json_safe(value)) return null;
  if (Array.isArray(value)) {
    const entries = value.map((entry) =>
      stable_json_value(entry, depth + 1, nodes),
    );
    if (entries.some((entry) => entry === undefined)) return null;
    return JSON.stringify(entries);
  }
  if (is_record(value)) {
    const output: Record<string, JsonSafe> = {};
    for (const key of Object.keys(value).sort()) {
      const entry = stable_json_value(value[key] as JsonSafe, depth + 1, nodes);
      if (entry === undefined) return null;
      output[key] = entry;
    }
    return JSON.stringify(output);
  }
  return JSON.stringify(value);
};

const stable_json_value = (
  value: JsonSafe,
  depth: number,
  nodes: { count: number },
): JsonSafe | undefined => {
  nodes.count += 1;
  if (depth > MAX_JSON_DEPTH || nodes.count > MAX_JSON_NODES) return undefined;
  if (Array.isArray(value)) {
    const output = value.map((entry) =>
      stable_json_value(entry, depth + 1, nodes),
    );
    return output.some((entry) => entry === undefined)
      ? undefined
      : (output as JsonSafe[]);
  }
  if (is_record(value)) {
    const output: Record<string, JsonSafe> = {};
    for (const key of Object.keys(value).sort()) {
      const entry = stable_json_value(value[key] as JsonSafe, depth + 1, nodes);
      if (entry === undefined) return undefined;
      output[key] = entry;
    }
    return output;
  }
  return value;
};

const sanitized_body_value = (
  value: unknown,
  schema: JsonSchemaLike | null,
  property_name: string | null = null,
  depth = 0,
  nodes = { count: 0 },
): JsonSafe | undefined => {
  nodes.count += 1;
  if (depth > MAX_JSON_DEPTH || nodes.count > MAX_JSON_NODES) return undefined;
  if (
    schema?.sensitive ||
    (property_name !== null && is_documentation_sensitive_name(property_name))
  )
    return "<SENSITIVE_VALUE>";
  if (Array.isArray(value)) {
    const output = value.map((entry) =>
      sanitized_body_value(
        entry,
        schema?.items ?? null,
        null,
        depth + 1,
        nodes,
      ),
    );
    return output.some((entry) => entry === undefined)
      ? undefined
      : (output as JsonSafe[]);
  }
  if (is_record(value)) {
    const output: Record<string, JsonSafe> = {};
    const properties = schema?.properties ?? {};
    for (const key of Object.keys(value).sort()) {
      const entry = sanitized_body_value(
        value[key],
        properties[key] ?? null,
        key,
        depth + 1,
        nodes,
      );
      if (entry === undefined) return undefined;
      output[key] = entry;
    }
    return output;
  }
  return is_json_safe(value) ? value : undefined;
};

const schema_like = (value: unknown): JsonSchemaLike | null => {
  if (!is_record(value)) return null;
  return {
    ...(typeof value.type === "string" || value.type === null
      ? { type: value.type }
      : {}),
    ...(typeof value.sensitive === "boolean"
      ? { sensitive: value.sensitive }
      : {}),
    ...(is_record(value.properties)
      ? {
          properties: Object.fromEntries(
            Object.entries(value.properties).map(([key, child]) => [
              key,
              schema_like(child) ?? {},
            ]),
          ),
        }
      : {}),
    ...(value.items !== undefined
      ? { items: schema_like(value.items) ?? {} }
      : {}),
  };
};

const body_for = (
  body: DocumentationTryItRequestDescriptor["request_body"],
): { body: string | null; unsupported: boolean } => {
  if (!body) return { body: null, unsupported: false };
  const media_type = body.media_type.toLowerCase();
  if (
    media_type !== "application/json" &&
    !/^application\/[^;]+\+json$/u.test(media_type)
  )
    return { body: null, unsupported: true };
  if (!has_own(body, "example") || body.example === undefined)
    return { body: null, unsupported: body.required };
  const safe_value = sanitized_body_value(
    body.example,
    schema_like(body.schema),
  );
  if (safe_value === undefined) return { body: null, unsupported: true };
  const serialized = stable_json(safe_value);
  return serialized === null
    ? { body: null, unsupported: true }
    : { body: serialized, unsupported: false };
};

const request_context = (
  descriptor: DocumentationTryItRequestDescriptor,
): ExampleContext | null => {
  if (!/^(?:GET|POST|PUT|PATCH|DELETE)$/u.test(descriptor.method)) return null;
  if (
    !descriptor.path.startsWith("/") ||
    descriptor.path.startsWith("//") ||
    /[\\?#]/u.test(descriptor.path) ||
    has_control_character(descriptor.path) ||
    /\{[^{}]*\{[^{}]*\}|\}[^{}]*\}/u.test(descriptor.path)
  )
    return null;

  const template_names = [...descriptor.path.matchAll(/\{([^{}]+)\}/gu)].map(
    (match) => match[1] ?? "",
  );
  if (
    template_names.some((name) => !/^[A-Za-z0-9_.-]+$/u.test(name)) ||
    new Set(template_names).size !== template_names.length
  )
    return null;
  const parameters = descriptor.parameters;
  const seen = new Set<string>();
  const path_parameters = new Map(
    parameters
      .filter((parameter) => parameter.location === "path")
      .map((parameter) => [parameter.name, parameter]),
  );
  if (
    path_parameters.size !==
      parameters.filter((parameter) => parameter.location === "path").length ||
    template_names.some((name) => !path_parameters.has(name)) ||
    [...path_parameters.keys()].some((name) => !template_names.includes(name))
  )
    return null;

  let path = descriptor.path;
  for (const name of template_names) {
    const parameter = path_parameters.get(name);
    if (!parameter) return null;
    const value =
      parameter.sensitive ||
      parameter.example === undefined ||
      parameter.example === null
        ? placeholder_for("path", name)
        : String(parameter.example);
    path = path.replace(`{${name}}`, encode_component(value));
  }

  const query: string[] = [];
  const headers: Record<string, string> = {};
  for (const parameter of parameters) {
    const key = `${parameter.location}:${parameter.name}`;
    if (seen.has(key) || has_control_character(parameter.name)) return null;
    seen.add(key);
    if (parameter.location === "path") continue;
    const has_documented_value =
      parameter.example !== undefined && parameter.example !== null;
    if (!has_documented_value && !parameter.required && !parameter.sensitive)
      continue;
    const value =
      parameter.sensitive || !has_documented_value
        ? placeholder_for(parameter.location, parameter.name)
        : String(parameter.example);
    if (parameter.location === "query") {
      const values = parameter.is_array ? [value] : [value];
      if (!parameter.explode && parameter.is_array)
        query.push(
          `${encodeURIComponent(parameter.name)}=${encode_component(values.join(","))}`,
        );
      else
        query.push(
          ...values.map(
            (entry) =>
              `${encodeURIComponent(parameter.name)}=${encode_component(entry)}`,
          ),
        );
      continue;
    }
    if (!safe_header_name(parameter.name) || !safe_header_value(value))
      return null;
    headers[parameter.name] = value;
  }
  if (descriptor.security.bearer)
    headers.Authorization = "Bearer <BEARER_TOKEN>";
  for (const name of descriptor.security.api_key_header_names) {
    if (!safe_header_name(name)) return null;
    headers[name] = "<API_KEY>";
  }
  if (Object.keys(headers).length > MAX_HEADERS) return null;
  if (
    byte_length(
      Object.entries(headers)
        .map(([name, value]) => `${name}:${value}`)
        .join("\n"),
    ) > MAX_HEADER_BYTES
  )
    return null;

  const body = body_for(descriptor.request_body);
  if (body.unsupported) return null;
  if (body.body !== null)
    headers["Content-Type"] = descriptor.request_body!.media_type;
  const url = `${PLACEHOLDER_ORIGIN}${path}${query.length ? `?${query.join("&")}` : ""}`;
  if (byte_length(url) > 8 * 1024) return null;
  return { url, method: descriptor.method, headers, body: body.body };
};

const curl = ({ url, method, headers, body }: ExampleContext) =>
  [
    "curl",
    "--fail-with-body",
    "--request",
    method,
    ...Object.entries(headers).flatMap(([name, value]) => [
      "--header",
      shell_quote(`${name}: ${value}`),
    ]),
    ...(body === null ? [] : ["--data-raw", shell_quote(body)]),
    shell_quote(url),
  ].join(" \\\n  ");

const fetch_code = ({ url, method, headers, body }: ExampleContext) =>
  [
    `const response = await fetch(${JSON.stringify(url)}, {`,
    `  method: ${JSON.stringify(method)},`,
    `  headers: ${JSON.stringify(headers, null, 2).replaceAll("\n", "\n  ")},`,
    ...(body === null ? [] : [`  body: ${JSON.stringify(body)},`]),
    '  credentials: "omit",',
    '  redirect: "error",',
    '  referrerPolicy: "no-referrer",',
    '  cache: "no-store",',
    "});",
    "console.log(await response.text());",
  ].join("\n");

const python = ({ url, method, headers, body }: ExampleContext) =>
  [
    "import urllib.request",
    "",
    `request = urllib.request.Request(${python_quote(url)},`,
    ...(body === null
      ? []
      : [`    data=${python_quote(body)}.encode("utf-8"),`]),
    `    method=${python_quote(method)},`,
    `    headers=${python_quote(headers)},`,
    ")",
    "with urllib.request.urlopen(request) as response:",
    '    print(response.read().decode("utf-8"))',
  ].join("\n");

const go = ({ url, method, headers, body }: ExampleContext) => {
  const body_line =
    body === null ? "nil" : `bytes.NewBuffer([]byte(${JSON.stringify(body)}))`;
  const imports = [
    ...(body === null ? [] : ['\t"bytes"']),
    '\t"fmt"',
    '\t"io"',
    '\t"net/http"',
  ];
  const header_lines = Object.entries(headers).map(
    ([name, value]) =>
      `\treq.Header.Set(${JSON.stringify(name)}, ${JSON.stringify(value)})`,
  );
  return [
    "package main",
    "",
    "import (",
    ...imports,
    ")",
    "",
    "func main() {",
    `\treq, err := http.NewRequest(${JSON.stringify(method)}, ${JSON.stringify(url)}, ${body_line})`,
    "\tif err != nil { panic(err) }",
    ...header_lines,
    "\tresp, err := http.DefaultClient.Do(req)",
    "\tif err != nil { panic(err) }",
    "\tdefer resp.Body.Close()",
    "\tdata, err := io.ReadAll(resp.Body)",
    "\tif err != nil { panic(err) }",
    "\tfmt.Println(string(data))",
    "}",
  ].join("\n");
};

const REGISTRY: readonly DocumentationRequestExampleRegistryEntry[] = [
  {
    id: "curl",
    display_name: "curl",
    runtime: "POSIX shell",
    syntax: "shell",
    file_extension: ".sh",
    generate: curl,
  },
  {
    id: "browser_fetch",
    display_name: "Browser Fetch",
    runtime: "Browser",
    syntax: "javascript",
    file_extension: ".js",
    generate: fetch_code,
  },
  {
    id: "node_fetch",
    display_name: "Node.js Fetch",
    runtime: "Node.js 18+",
    syntax: "javascript",
    file_extension: ".mjs",
    generate: fetch_code,
  },
  {
    id: "python_urllib",
    display_name: "Python",
    runtime: "Python 3 standard library",
    syntax: "python",
    file_extension: ".py",
    generate: python,
  },
  {
    id: "go_net_http",
    display_name: "Go",
    runtime: "Go standard library",
    syntax: "go",
    file_extension: ".go",
    generate: go,
  },
] as const;

export const documentation_request_example_registry = REGISTRY.map((entry) => ({
  id: entry.id,
  display_name: entry.display_name,
  runtime: entry.runtime,
  syntax: entry.syntax,
  file_extension: entry.file_extension,
}));

export const generate_documentation_request_example = (
  descriptor_input: DocumentationTryItRequestDescriptor | unknown,
  language_id: string,
): DocumentationRequestExampleResult => {
  const descriptor_version = is_record(descriptor_input)
    ? typeof descriptor_input.descriptor_version === "number"
      ? descriptor_input.descriptor_version
      : null
    : null;
  if (!is_language_id(language_id))
    return unsupported(descriptor_version, language_id);
  if (
    !is_record(descriptor_input) ||
    descriptor_input.descriptor_version !== 1 ||
    !Array.isArray(descriptor_input.unsupported_reasons) ||
    descriptor_input.unsupported_reasons.length > 0
  )
    return unsupported(descriptor_version, language_id);
  try {
    const descriptor =
      descriptor_input as unknown as DocumentationTryItRequestDescriptor;
    const context = request_context(descriptor);
    if (!context) return unsupported(1, language_id);
    const entry = REGISTRY.find((candidate) => candidate.id === language_id);
    if (!entry) return unsupported(1, language_id);
    const code = entry.generate(context);
    if (byte_length(code) > MAX_OUTPUT_BYTES)
      return unsupported(1, language_id, unsupported_output_reason);
    return {
      status: "generated",
      contract_version: DOCUMENTATION_REQUEST_EXAMPLE_CONTRACT_VERSION,
      descriptor_version: 1,
      language_id,
      display_name: entry.display_name,
      runtime: entry.runtime,
      syntax: entry.syntax,
      file_extension: entry.file_extension,
      code,
    };
  } catch {
    return unsupported(1, language_id);
  }
};
