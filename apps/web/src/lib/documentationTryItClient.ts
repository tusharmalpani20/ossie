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
const isJsonContentType = (value: string) =>
  value === "application/json" || value.endsWith("+json");
const isTextContentType = (value: string) => value.startsWith("text/");
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
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new DocumentationTryItClientError(
      "response_unreadable",
      "The target response was not valid UTF-8 text.",
    );
  }
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
  const hasShortSensitiveValue = input.secrets.some(
    (secret) => secret.length > 0 && [...secret].length < 4,
  );

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
  if (
    headers.length > input.configuration.response_limits.headers ||
    headers.reduce(
      (total, [name, value]) => total + bytes(name) + bytes(value),
      0,
    ) >
      32 * 1024
  )
    throw new DocumentationTryItClientError(
      "response_headers_too_large",
      "The target returned too many response headers to display safely.",
    );
  const safeHeaders = Object.fromEntries(
    headers.map(([name, value]) => [name, redact(value, input.secrets)]),
  );
  const safeStatusText = redact(response.statusText, input.secrets);
  const declaredLength = response.headers.get("content-length");
  if (
    response.status === 204 ||
    response.status === 205 ||
    declaredLength === "0"
  )
    return {
      kind: "empty" as const,
      status: response.status,
      statusText: safeStatusText,
      headers: safeHeaders,
    };
  const contentType = (response.headers.get("content-type") ?? "text/plain")
    .split(";", 1)[0]!
    .trim()
    .toLowerCase();
  if (ACTIVE_CONTENT_TYPES.includes(contentType))
    return {
      kind: "blocked" as const,
      status: response.status,
      statusText: safeStatusText,
      headers: safeHeaders,
      reason: "Active response content is not rendered.",
    };
  if (!isJsonContentType(contentType) && !isTextContentType(contentType))
    return {
      kind: "blocked" as const,
      status: response.status,
      statusText: safeStatusText,
      headers: safeHeaders,
      reason: "This response media type is not safe to display.",
    };
  if (hasShortSensitiveValue) {
    await response.body?.cancel().catch(() => undefined);
    return {
      kind: "blocked" as const,
      status: response.status,
      statusText: safeStatusText,
      reason: "A sensitive value is too short to redact safely.",
    };
  }
  let rawText: string;
  try {
    rawText = await boundedBody(
      response,
      input.configuration.response_limits.body_bytes,
    );
  } catch (error) {
    if (
      error instanceof DocumentationTryItClientError &&
      error.code === "response_unreadable"
    )
      return {
        kind: "blocked" as const,
        status: response.status,
        statusText: safeStatusText,
        headers: safeHeaders,
        reason: error.message,
      };
    throw error;
  }
  const safeText = redact(rawText, input.secrets);
  if (isJsonContentType(contentType)) {
    try {
      const parsed = JSON.parse(safeText);
      return {
        kind: "json" as const,
        status: response.status,
        statusText: safeStatusText,
        headers: safeHeaders,
        text: JSON.stringify(parsed, null, 2),
      };
    } catch {
      return {
        kind: "blocked" as const,
        status: response.status,
        statusText: response.statusText,
        headers: safeHeaders,
        reason: "The target declared JSON but returned malformed content.",
      };
    }
  }
  return {
    kind: "text" as const,
    status: response.status,
    statusText: safeStatusText,
    headers: safeHeaders,
    text: safeText,
  };
};
