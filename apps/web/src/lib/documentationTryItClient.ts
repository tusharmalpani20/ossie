export class DocumentationTryItClientError extends Error {
  constructor(
    readonly code:
      | "csp_mismatch"
      | "origin_mismatch"
      | "response_too_large"
      | "response_headers_too_large"
      | "response_unreadable"
      | "timed_out"
      | "aborted"
      | "client_validation_blocked"
      | "browser_network_blocked",
    message: string,
  ) {
    super(message);
    this.name = "DocumentationTryItClientError";
  }
}

type ClientInput = {
  configuration: {
    approved_origin: string;
    operator_origin_set_digest: string;
    request_limits?: {
      url_bytes: number;
      body_bytes: number;
      timeout_ms: number;
    };
    response_limits: { body_bytes: number; headers: number };
  };
  web_origin_set_digest: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | null;
  };
  secrets: string[];
  timeout_ms: number;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
};

const ACTIVE_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "application/javascript",
  "text/javascript",
];
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const FORBIDDEN_HEADERS = new Set([
  "cookie",
  "host",
  "origin",
  "referer",
  "content-length",
  "connection",
  "transfer-encoding",
  "proxy-authorization",
]);
const bytes = (value: string) => new TextEncoder().encode(value).byteLength;
const validationError = (message: string) =>
  new DocumentationTryItClientError("client_validation_blocked", message);

const redact = (value: string, secrets: readonly string[]) =>
  secrets.reduce(
    (current, secret) =>
      secret.length >= 4 ? current.replaceAll(secret, "[REDACTED]") : current,
    value,
  );

const boundedBody = async (response: Response, limit: number) => {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit)
    throw new DocumentationTryItClientError(
      "response_too_large",
      "The target response exceeded the safe display limit.",
    );
  if (!response.body)
    throw new DocumentationTryItClientError(
      "response_unreadable",
      "The target response could not be read safely.",
    );
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new DocumentationTryItClientError(
          "response_too_large",
          "The target response exceeded the safe display limit.",
        );
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(body);
};

export const executeDocumentationTryItRequest = async (input: ClientInput) => {
  if (
    input.configuration.operator_origin_set_digest !==
    input.web_origin_set_digest
  )
    throw new DocumentationTryItClientError(
      "csp_mismatch",
      "Try It is unavailable because the web and server policies differ.",
    );
  if (new URL(input.request.url).origin !== input.configuration.approved_origin)
    throw new DocumentationTryItClientError(
      "origin_mismatch",
      "The request target did not match the approved origin.",
    );
  const requestLimits = input.configuration.request_limits ?? {
    url_bytes: 8 * 1024,
    body_bytes: 256 * 1024,
    timeout_ms: input.timeout_ms,
  };
  if (!ALLOWED_METHODS.has(input.request.method))
    throw validationError("The request method is not supported.");
  if (bytes(input.request.url) > requestLimits.url_bytes)
    throw validationError("The request URL exceeds the safe limit.");
  if (
    input.request.body !== null &&
    bytes(input.request.body) > requestLimits.body_bytes
  )
    throw validationError("The request body exceeds the safe limit.");
  const requestHeaders = Object.entries(input.request.headers);
  if (
    requestHeaders.length > 50 ||
    requestHeaders.some(([name]) =>
      FORBIDDEN_HEADERS.has(name.toLowerCase()),
    ) ||
    requestHeaders.reduce(
      (total, [name, value]) => total + bytes(name) + bytes(value),
      0,
    ) >
      32 * 1024
  )
    throw validationError("The request headers exceed the safe policy.");
  const requestContentType = requestHeaders
    .find(([name]) => name.toLowerCase() === "content-type")?.[1]
    .split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (
    input.request.body !== null &&
    (requestContentType === "application/json" ||
      requestContentType?.endsWith("+json"))
  ) {
    try {
      JSON.parse(input.request.body);
    } catch {
      throw validationError("The JSON request body is invalid.");
    }
  }
  if (input.secrets.some((secret) => secret.length > 0 && secret.length < 4))
    return {
      kind: "blocked" as const,
      reason: "A credential is too short to redact safely.",
    };

  const controller = new AbortController();
  const onAbort = () => controller.abort(input.signal?.reason);
  input.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => controller.abort("timeout"), input.timeout_ms);
  let response: Response;
  try {
    response = await (input.fetchImpl ?? fetch)(input.request.url, {
      method: input.request.method,
      headers: input.request.headers,
      body: input.request.body,
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted)
      throw new DocumentationTryItClientError(
        input.signal?.aborted ? "aborted" : "timed_out",
        input.signal?.aborted
          ? "The request was cancelled."
          : "The target request timed out.",
      );
    throw new DocumentationTryItClientError(
      "browser_network_blocked",
      "The browser could not reach the target. Check CORS, CSP, DNS, and TLS.",
    );
  } finally {
    clearTimeout(timer);
    input.signal?.removeEventListener("abort", onAbort);
  }

  const headers = [...response.headers.entries()];
  if (headers.length > input.configuration.response_limits.headers)
    throw new DocumentationTryItClientError(
      "response_headers_too_large",
      "The target returned too many headers to display safely.",
    );
  const contentType = (response.headers.get("content-type") ?? "text/plain")
    .split(";", 1)[0]!
    .trim()
    .toLowerCase();
  if (ACTIVE_CONTENT_TYPES.includes(contentType))
    return {
      kind: "blocked" as const,
      status: response.status,
      reason: "Active response content is not rendered.",
    };
  const rawText = await boundedBody(
    response,
    input.configuration.response_limits.body_bytes,
  );
  const safeText = redact(rawText, input.secrets);
  const safeHeaders = Object.fromEntries(
    headers.map(([name, value]) => [name, redact(value, input.secrets)]),
  );
  if (contentType === "application/json" || contentType.endsWith("+json")) {
    try {
      const parsed = JSON.parse(safeText);
      return {
        kind: "json" as const,
        status: response.status,
        headers: safeHeaders,
        text: JSON.stringify(parsed, null, 2),
      };
    } catch {
      // Invalid JSON remains inert text.
    }
  }
  return {
    kind: "text" as const,
    status: response.status,
    headers: safeHeaders,
    text: safeText,
  };
};
