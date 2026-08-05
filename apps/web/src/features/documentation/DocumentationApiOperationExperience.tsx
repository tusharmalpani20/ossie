import { useEffect, useId, useMemo, useRef, useState } from "react";
import type {
  DocumentationTryItConfiguration,
  DocumentationTryItRequestDescriptor,
} from "@repo/types";
import {
  DOCUMENTATION_TRY_IT_SEND_INTERVAL_MS,
  DOCUMENTATION_TRY_IT_SENDS_PER_ORIGIN_MINUTE_MAX,
} from "@repo/constants";
import {
  DocumentationTryItClientError,
  executeDocumentationTryItRequest,
} from "../../lib/documentationTryItClient";
import { generateDocumentationTryItRequestPreviews } from "../../lib/documentationTryItExamples";
import "./documentation-api-operation.css";

type AttemptOutcome =
  | "completed"
  | "browser_network_blocked"
  | "timed_out"
  | "aborted"
  | "response_blocked"
  | "client_validation_blocked";

export type DocumentationApiOperationExperienceProps = {
  descriptor: DocumentationTryItRequestDescriptor;
  loadConfiguration: () => Promise<DocumentationTryItConfiguration>;
  reportAttempt: (
    attemptToken: string,
    outcome: AttemptOutcome,
  ) => Promise<void>;
};
type TryItJsonSchema = {
  sensitive: boolean;
  properties?: Record<string, TryItJsonSchema>;
  items?: TryItJsonSchema;
};
const tryItSchema = (value: unknown) =>
  (value ?? null) as TryItJsonSchema | null;

const inputType = (valueType: string, sensitive: boolean) =>
  sensitive
    ? "password"
    : valueType === "number" || valueType === "integer"
      ? "number"
      : "text";

const listValues = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const sanitizeBodyValue = (
  value: unknown,
  schema: TryItJsonSchema | null | undefined,
): unknown => {
  if (!schema) return value;
  if (schema.sensitive) return "<SENSITIVE_VALUE>";
  if (Array.isArray(value))
    return value.map((item) => sanitizeBodyValue(item, schema.items));
  if (value && typeof value === "object" && schema.properties)
    return Object.fromEntries(
      Object.entries(value).map(([name, item]) => [
        name,
        sanitizeBodyValue(item, schema.properties?.[name]),
      ]),
    );
  return value;
};

const sensitiveBodyValues = (
  value: unknown,
  schema: TryItJsonSchema | null | undefined,
): string[] => {
  if (!schema) return [];
  if (schema.sensitive)
    return typeof value === "string" || typeof value === "number"
      ? [String(value)]
      : [];
  if (Array.isArray(value))
    return value.flatMap((item) => sensitiveBodyValues(item, schema.items));
  if (value && typeof value === "object" && schema.properties)
    return Object.entries(value).flatMap(([name, item]) =>
      sensitiveBodyValues(item, schema.properties?.[name]),
    );
  return [];
};

const parsedBody = (body: string) => {
  if (!body.trim()) return null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
};

const schemaHasSensitiveValue = (
  schema: TryItJsonSchema | null | undefined,
): boolean =>
  Boolean(
    schema?.sensitive ||
    (schema?.items && schemaHasSensitiveValue(schema.items)) ||
    (schema?.properties &&
      Object.values(schema.properties).some(schemaHasSensitiveValue)),
  );

const buildRequest = (input: {
  operation: DocumentationTryItRequestDescriptor;
  approvedOrigin: string;
  basePath: string;
  values: Record<string, string>;
  credentialMode: string;
  credential: string;
  apiKeyHeaderName: string | null;
  body: string;
}) => {
  let path = input.operation.path;
  const query = new URLSearchParams();
  const headers: Record<string, string> = {};
  for (const parameter of input.operation.parameters) {
    const key = `${parameter.location}:${parameter.name}`;
    const value = input.values[key]?.trim() ?? "";
    if (!value) continue;
    const items = parameter.is_array ? listValues(value) : [value];
    if (parameter.location === "path")
      path = path.replace(
        `{${parameter.name}}`,
        encodeURIComponent(items.join(",")),
      );
    else if (parameter.location === "query") {
      if (parameter.is_array && !parameter.explode)
        query.append(parameter.name, items.join(","));
      else items.forEach((item) => query.append(parameter.name, item));
    } else headers[parameter.name] = items.join(",");
  }
  if (input.credentialMode === "bearer" && input.credential)
    headers.Authorization = `Bearer ${input.credential}`;
  if (
    input.credentialMode === "api_key_header" &&
    input.credential &&
    input.apiKeyHeaderName
  )
    headers[input.apiKeyHeaderName] = input.credential;
  const requestBody = input.operation.request_body
    ? input.body.trim() || null
    : null;
  if (requestBody)
    headers["Content-Type"] =
      input.operation.request_body?.media_type ?? "application/json";
  const normalizedBase =
    input.basePath === "/" ? "" : input.basePath.replace(/\/$/u, "");
  const search = query.toString();
  return {
    url: `${input.approvedOrigin}${normalizedBase}${path}${search ? `?${search}` : ""}`,
    method: input.operation.method,
    headers,
    body: requestBody,
  };
};

export const DocumentationApiOperationExperience = ({
  descriptor,
  loadConfiguration,
  reportAttempt,
}: DocumentationApiOperationExperienceProps) => {
  const headingId = useId();
  const errorId = `${headingId}-error`;
  const [configuration, setConfiguration] =
    useState<DocumentationTryItConfiguration | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [credentialMode, setCredentialMode] = useState("none");
  const [credential, setCredential] = useState("");
  const [showCredential, setShowCredential] = useState(false);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof executeDocumentationTryItRequest>
  > | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [mutationAcknowledged, setMutationAcknowledged] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [retryAvailableAt, setRetryAvailableAt] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const reportedTokens = useRef(new Set<string>());
  const abortController = useRef<AbortController | null>(null);
  const sendTimestamps = useRef<number[]>([]);
  const sendButton = useRef<HTMLButtonElement | null>(null);
  const confirmButton = useRef<HTMLButtonElement | null>(null);
  const cancelButton = useRef<HTMLButtonElement | null>(null);
  const errorSummary = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (confirming) confirmButton.current?.focus();
  }, [confirming]);

  useEffect(() => {
    if (error) errorSummary.current?.focus();
  }, [error]);

  useEffect(() => {
    if (!retryAvailableAt && !confirming) return;
    const timer = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [confirming, retryAvailableAt]);

  useEffect(() => {
    abortController.current?.abort();
    setConfiguration(null);
    setValues({});
    setCredentialMode("none");
    setCredential("");
    setShowCredential(false);
    setBody("");
    setResult(null);
    setConfirming(false);
    setError(null);
  }, [descriptor.destination_key]);

  useEffect(
    () => () => {
      abortController.current?.abort();
    },
    [],
  );

  const operation = configuration?.operation ?? descriptor;
  const builtRequest = useMemo(
    () =>
      buildRequest({
        operation,
        approvedOrigin:
          configuration?.approved_origin ?? "https://api.example.invalid",
        basePath: configuration?.base_path ?? "/",
        values,
        credentialMode,
        credential,
        apiKeyHeaderName: configuration?.api_key_header_name ?? null,
        body,
      }),
    [body, configuration, credential, credentialMode, operation, values],
  );

  const parsedRequestBody = parsedBody(body);
  const requestBodySchema = tryItSchema(operation.request_body?.schema);
  const safeExampleBody =
    parsedRequestBody === null
      ? builtRequest.body && schemaHasSensitiveValue(requestBodySchema)
        ? "<SENSITIVE_JSON_BODY>"
        : builtRequest.body
      : JSON.stringify(
          sanitizeBodyValue(parsedRequestBody, requestBodySchema),
          null,
          2,
        );
  const sensitiveHeaders = operation.parameters
    .filter(
      (parameter) => parameter.location === "header" && parameter.sensitive,
    )
    .map((parameter) => parameter.name);
  const examples = generateDocumentationTryItRequestPreviews({
    ...builtRequest,
    body: safeExampleBody,
    sensitive_header_names: [
      "Authorization",
      ...sensitiveHeaders,
      ...(configuration?.api_key_header_name
        ? [configuration.api_key_header_name]
        : []),
    ],
    timeout_ms: configuration?.request_limits.timeout_ms ?? 15_000,
  });

  const report = (attemptToken: string, outcome: AttemptOutcome) => {
    if (reportedTokens.current.has(attemptToken)) return;
    reportedTokens.current.add(attemptToken);
    void reportAttempt(attemptToken, outcome).catch(() => undefined);
  };

  const openBuilder = async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadConfiguration();
      setConfiguration(loaded);
      setCredentialMode("none");
      setCredential("");
    } catch {
      setError(
        "Try It is unavailable for this operation. The read-only reference and placeholder examples remain available.",
      );
    } finally {
      setLoading(false);
    }
  };

  const missingRequiredField =
    operation.parameters.find(
      (parameter) =>
        parameter.required &&
        !(values[`${parameter.location}:${parameter.name}`] ?? "").trim(),
    )?.name ??
    (operation.request_body?.required && !body.trim() ? "request body" : null);

  const openConfirmation = async () => {
    if (!configuration || missingRequiredField) {
      const message = missingRequiredField
        ? `Complete the required ${missingRequiredField} field before sending.`
        : "Open the request builder before sending.";
      setError(message);
      if (configuration)
        report(configuration.attempt_token, "client_validation_blocked");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const refreshed = await loadConfiguration();
      if (refreshed.policy_identity !== configuration.policy_identity) {
        abortController.current?.abort();
        setConfiguration(refreshed);
        setValues({});
        setBody("");
        setCredential("");
        setResult(null);
        setConfirming(false);
        setError(
          "Request authority changed. Review the refreshed policy and enter values again.",
        );
        return;
      }
      setConfiguration(refreshed);
      setMutationAcknowledged(false);
      setConfirming(true);
      setClock(Date.now());
    } catch {
      setConfiguration(null);
      setCredential("");
      setResult(null);
      setError(
        "Try It authority expired or became unavailable. Reopen the request builder to retry.",
      );
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!configuration) return;
    if (Date.parse(configuration.configuration_expires_at) <= Date.now()) {
      setConfirming(false);
      setCredential("");
      setError(
        "Request authority expired while confirmation was open. Review the request again.",
      );
      sendButton.current?.focus();
      return;
    }
    const request = buildRequest({
      operation: configuration.operation,
      approvedOrigin: configuration.approved_origin,
      basePath: configuration.base_path,
      values,
      credentialMode,
      credential,
      apiKeyHeaderName: configuration.api_key_header_name,
      body,
    });
    const now = Date.now();
    const recent = sendTimestamps.current.filter(
      (timestamp) => now - timestamp < 60_000,
    );
    const retryAfter =
      recent.length > 0
        ? DOCUMENTATION_TRY_IT_SEND_INTERVAL_MS - (now - recent.at(-1)!)
        : 0;
    if (
      retryAfter > 0 ||
      recent.length >= DOCUMENTATION_TRY_IT_SENDS_PER_ORIGIN_MINUTE_MAX
    ) {
      const availableAt =
        recent.length >= DOCUMENTATION_TRY_IT_SENDS_PER_ORIGIN_MINUTE_MAX
          ? recent[0]! + 60_000
          : now + retryAfter;
      setRetryAvailableAt(availableAt);
      setConfirming(false);
      setError("The local request limit is active. Wait for the countdown.");
      report(configuration.attempt_token, "client_validation_blocked");
      return;
    }
    sendTimestamps.current = [...recent, now];
    setRetryAvailableAt(now + DOCUMENTATION_TRY_IT_SEND_INTERVAL_MS);
    setConfirming(false);
    setMutationAcknowledged(false);
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const controller = new AbortController();
      abortController.current = controller;
      const response = await executeDocumentationTryItRequest({
        configuration,
        web_origin_set_digest: __OSSIE_DOCUMENTATION_TRY_IT_ORIGIN_SET_DIGEST__,
        request,
        secrets: [
          credential,
          ...operation.parameters
            .filter((parameter) => parameter.sensitive)
            .map(
              (parameter) =>
                values[`${parameter.location}:${parameter.name}`] ?? "",
            ),
          ...sensitiveBodyValues(
            parsedRequestBody,
            tryItSchema(operation.request_body?.schema),
          ),
        ].filter(Boolean),
        timeout_ms: configuration.request_limits.timeout_ms,
        signal: controller.signal,
      });
      setResult(response);
      report(
        configuration.attempt_token,
        response.kind === "blocked" ? "response_blocked" : "completed",
      );
    } catch (caught) {
      const code =
        caught instanceof DocumentationTryItClientError
          ? caught.code
          : "browser_network_blocked";
      setError(
        caught instanceof Error
          ? caught.message
          : "The browser could not complete the target request.",
      );
      report(
        configuration.attempt_token,
        code === "timed_out"
          ? "timed_out"
          : code === "aborted"
            ? "aborted"
            : code === "response_too_large" ||
                code === "response_headers_too_large" ||
                code === "response_unreadable"
              ? "response_blocked"
              : code === "csp_mismatch" ||
                  code === "origin_mismatch" ||
                  code === "client_validation_blocked"
                ? "client_validation_blocked"
                : "browser_network_blocked",
      );
    } finally {
      abortController.current = null;
      setSending(false);
    }
  };

  const retrySeconds = Math.max(
    0,
    Math.ceil((retryAvailableAt - clock) / 1_000),
  );
  const leaseExpired =
    Boolean(configuration) &&
    Date.parse(configuration!.configuration_expires_at) <= clock;
  const copyExample = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} example copied.`);
    } catch {
      setCopyStatus(`${label} example could not be copied.`);
    }
  };

  return (
    <section
      aria-labelledby={headingId}
      className="documentation-api-operation"
    >
      <h2 id={headingId}>Request</h2>
      <p>
        Examples never include a credential value. Try It sends one
        browser-direct request to an administrator-approved HTTPS origin.
      </p>
      {descriptor.unsupported_reasons.length ? (
        <p role="note">
          Try It is read-only for this operation:{" "}
          {descriptor.unsupported_reasons.join("; ")}
        </p>
      ) : null}
      {!configuration ? (
        <button
          type="button"
          disabled={loading || descriptor.unsupported_reasons.length > 0}
          onClick={() => void openBuilder()}
        >
          {loading ? "Loading request builder…" : "Open request builder"}
        </button>
      ) : (
        <>
          <p>
            <strong>{configuration.operation.method}</strong>{" "}
            <code>{configuration.operation.path}</code>
          </p>
          <div className="documentation-api-operation__fields">
            {configuration.operation.parameters.map((parameter) => {
              const key = `${parameter.location}:${parameter.name}`;
              return (
                <label key={key}>
                  {parameter.name} ({parameter.location})
                  <input
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={
                      Boolean(
                        error &&
                        parameter.required &&
                        !(values[key] ?? "").trim(),
                      ) || undefined
                    }
                    autoComplete="off"
                    required={parameter.required}
                    spellCheck={false}
                    type={inputType(parameter.value_type, parameter.sensitive)}
                    value={values[key] ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              );
            })}
            {configuration.allowed_credential_modes.length > 1 ? (
              <label>
                Authorization
                <select
                  value={credentialMode}
                  onChange={(event) => {
                    setCredential("");
                    setCredentialMode(event.target.value);
                  }}
                >
                  {configuration.allowed_credential_modes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode === "none"
                        ? "No credential"
                        : mode === "bearer"
                          ? "Bearer token"
                          : configuration.api_key_header_name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {credentialMode !== "none" ? (
              <>
                <label>
                  Credential (kept only in this panel)
                  <input
                    autoComplete="off"
                    spellCheck={false}
                    type={showCredential ? "text" : "password"}
                    value={credential}
                    onChange={(event) => setCredential(event.target.value)}
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showCredential}
                    onChange={(event) =>
                      setShowCredential(event.target.checked)
                    }
                  />
                  Show credential
                </label>
              </>
            ) : null}
            {configuration.operation.request_body ? (
              <>
                <label>
                  JSON request body
                  <textarea
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={
                      Boolean(
                        error &&
                        configuration.operation.request_body.required &&
                        !body.trim(),
                      ) || undefined
                    }
                    rows={8}
                    spellCheck={false}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                  />
                </label>
                {configuration.operation.request_body.example !== undefined ? (
                  <details>
                    <summary>Request body example (not inserted)</summary>
                    <pre>
                      <code>
                        {JSON.stringify(
                          sanitizeBodyValue(
                            configuration.operation.request_body.example,
                            tryItSchema(
                              configuration.operation.request_body.schema,
                            ),
                          ),
                          null,
                          2,
                        )}
                      </code>
                    </pre>
                  </details>
                ) : null}
              </>
            ) : null}
          </div>
          <p className="documentation-api-operation__target">
            Target: <code>{builtRequest.url}</code>
          </p>
          <div className="documentation-api-operation__actions">
            <button
              ref={sendButton}
              type="button"
              disabled={sending || loading || retrySeconds > 0}
              onClick={() => void openConfirmation()}
            >
              {loading
                ? "Refreshing authority…"
                : sending
                  ? "Sending…"
                  : "Send"}
            </button>
            {sending ? (
              <button
                type="button"
                onClick={() => abortController.current?.abort()}
              >
                Abort request
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setCredential("");
                setShowCredential(false);
                setValues((current) =>
                  Object.fromEntries(
                    Object.entries(current).filter(([key]) => {
                      const [location, ...nameParts] = key.split(":");
                      const name = nameParts.join(":");
                      return !operation.parameters.some(
                        (parameter) =>
                          parameter.location === location &&
                          parameter.name === name &&
                          parameter.sensitive,
                      );
                    }),
                  ),
                );
                if (
                  schemaHasSensitiveValue(
                    tryItSchema(operation.request_body?.schema),
                  )
                )
                  setBody("");
              }}
            >
              Clear credentials
            </button>
            <button type="button" onClick={() => setResult(null)}>
              Clear response
            </button>
            <button
              type="button"
              onClick={() => {
                abortController.current?.abort();
                setConfirming(false);
                setConfiguration(null);
                setCredential("");
                setValues({});
                setBody("");
                setResult(null);
              }}
            >
              Close and clear
            </button>
          </div>
          {retrySeconds > 0 ? (
            <p role="status">
              Local request limit: retry in {retrySeconds}{" "}
              {retrySeconds === 1 ? "second" : "seconds"}.
            </p>
          ) : null}
          {confirming ? (
            <dialog
              aria-labelledby={`${headingId}-confirmation`}
              className="documentation-api-operation__confirmation"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setConfirming(false);
                  setMutationAcknowledged(false);
                  sendButton.current?.focus();
                  return;
                }
                if (event.key !== "Tab") return;
                if (
                  event.shiftKey &&
                  document.activeElement === confirmButton.current
                ) {
                  event.preventDefault();
                  cancelButton.current?.focus();
                } else if (
                  !event.shiftKey &&
                  document.activeElement === cancelButton.current
                ) {
                  event.preventDefault();
                  confirmButton.current?.focus();
                }
              }}
              open
            >
              <h3 id={`${headingId}-confirmation`}>
                Confirm target API request
              </h3>
              <p>
                Send one {configuration.operation.method} request to{" "}
                <code>{builtRequest.url}</code>?
              </p>
              <p>
                The browser sends its own Origin header and may run a CORS
                preflight. Ossie does not proxy or retry this request.
              </p>
              {configuration.operation.method !== "GET" ? (
                <>
                  <p>This request can change real data in the target system.</p>
                  <label>
                    <input
                      type="checkbox"
                      checked={mutationAcknowledged}
                      onChange={(event) =>
                        setMutationAcknowledged(event.target.checked)
                      }
                    />
                    I understand this can change real target data
                  </label>
                </>
              ) : null}
              {leaseExpired ? (
                <p role="alert">
                  Request authority expired. Cancel and review the request
                  again.
                </p>
              ) : null}
              <button
                ref={confirmButton}
                type="button"
                disabled={
                  leaseExpired ||
                  (configuration.operation.method !== "GET" &&
                    !mutationAcknowledged)
                }
                onClick={() => void send()}
              >
                Confirm and send
              </button>
              <button
                ref={cancelButton}
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setMutationAcknowledged(false);
                  sendButton.current?.focus();
                }}
              >
                Cancel
              </button>
            </dialog>
          ) : null}
        </>
      )}
      <details>
        <summary>Current Try-It request preview</summary>
        {!configuration ? (
          <p>
            The placeholder origin <code>api.example.invalid</code> is replaced
            only after an authorized request configuration loads.
          </p>
        ) : null}
        {[
          { heading: "cURL", label: "cURL", example: examples.curl },
          {
            heading: "JavaScript fetch",
            label: "JavaScript fetch",
            example: examples.javascript,
          },
          {
            heading: "Python urllib",
            label: "Python urllib",
            example: examples.python,
          },
        ].map(({ heading, label, example }) => (
          <section key={heading}>
            <h3>{heading}</h3>
            <button
              type="button"
              onClick={() => void copyExample(label, example)}
            >
              Copy {label} example
            </button>
            <pre role="region" tabIndex={0} aria-label={`${heading} example`}>
              <code>{example}</code>
            </pre>
          </section>
        ))}
      </details>
      <p aria-live="polite">{copyStatus}</p>
      {error ? (
        <p id={errorId} ref={errorSummary} role="alert" tabIndex={-1}>
          {error}
        </p>
      ) : null}
      {result ? (
        <section aria-live="polite" aria-labelledby={`${headingId}-response`}>
          <h3 id={`${headingId}-response`}>Response</h3>
          {"status" in result ? (
            <p>
              Status: {result.status}
              {result.statusText ? ` ${result.statusText}` : ""}
            </p>
          ) : null}
          {"headers" in result &&
          result.headers &&
          Object.keys(result.headers).length ? (
            <details>
              <summary>Browser-visible response headers</summary>
              <pre tabIndex={0}>
                <code>{JSON.stringify(result.headers, null, 2)}</code>
              </pre>
            </details>
          ) : null}
          {result.kind === "blocked" ? (
            <p>{result.reason}</p>
          ) : result.kind === "empty" ? (
            <p>The target returned an empty response body.</p>
          ) : (
            <>
              <p>
                Target response data may be sensitive. Review it before copying.
              </p>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(result.text)}
              >
                Copy response text
              </button>
              <pre tabIndex={0}>
                <code>{result.text}</code>
              </pre>
            </>
          )}
        </section>
      ) : null}
    </section>
  );
};
