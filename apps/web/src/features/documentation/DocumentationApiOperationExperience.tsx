import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DocumentationTryItConfiguration,
  DocumentationTryItRequestDescriptor,
} from "@repo/types";
import {
  getPublicDocumentationTryItConfiguration,
  reportPublicDocumentationTryItAttempt,
} from "../../lib/documentationTryItApi";
import {
  DocumentationTryItClientError,
  executeDocumentationTryItRequest,
} from "../../lib/documentationTryItClient";
import { generateDocumentationTryItExamples } from "../../lib/documentationTryItExamples";
import "./documentation-api-operation.css";

type Props = {
  slug: string;
  versionSlug?: string;
  descriptor: DocumentationTryItRequestDescriptor;
  loadConfiguration?: typeof getPublicDocumentationTryItConfiguration;
  reportAttempt?: typeof reportPublicDocumentationTryItAttempt;
};

const inputType = (valueType: string) =>
  valueType === "number" || valueType === "integer" ? "number" : "text";

export const DocumentationApiOperationExperience = ({
  slug,
  versionSlug,
  descriptor,
  loadConfiguration = getPublicDocumentationTryItConfiguration,
  reportAttempt = reportPublicDocumentationTryItAttempt,
}: Props) => {
  const [configuration, setConfiguration] =
    useState<DocumentationTryItConfiguration | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [credentialMode, setCredentialMode] = useState("none");
  const [credential, setCredential] = useState("");
  const [body, setBody] = useState(
    descriptor.request_body?.example === undefined
      ? ""
      : JSON.stringify(descriptor.request_body.example, null, 2),
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof executeDocumentationTryItRequest>
  > | null>(null);
  const [confirmedMutation, setConfirmedMutation] = useState(false);
  const reportedTokens = useRef(new Set<string>());

  useEffect(
    () => () => {
      setCredential("");
      setValues({});
      setBody("");
    },
    [],
  );

  const builtRequest = useMemo(() => {
    if (!configuration) return null;
    let path = configuration.operation.path;
    const query = new URLSearchParams();
    const headers: Record<string, string> = {};
    for (const parameter of configuration.operation.parameters) {
      const key = `${parameter.location}:${parameter.name}`;
      const value = values[key]?.trim() ?? "";
      if (!value) continue;
      if (parameter.location === "path")
        path = path.replace(`{${parameter.name}}`, encodeURIComponent(value));
      else if (parameter.location === "query")
        query.append(parameter.name, value);
      else headers[parameter.name] = value;
    }
    if (credentialMode === "bearer" && credential)
      headers.Authorization = `Bearer ${credential}`;
    if (
      credentialMode === "api_key_header" &&
      credential &&
      configuration.api_key_header_name
    )
      headers[configuration.api_key_header_name] = credential;
    const requestBody = configuration.operation.request_body
      ? body.trim() || null
      : null;
    if (requestBody)
      headers["Content-Type"] =
        configuration.operation.request_body?.media_type ?? "application/json";
    const normalizedBase =
      configuration.base_path === "/"
        ? ""
        : configuration.base_path.replace(/\/$/u, "");
    const search = query.toString();
    return {
      url: `${configuration.approved_origin}${normalizedBase}${path}${search ? `?${search}` : ""}`,
      method: configuration.operation.method,
      headers,
      body: requestBody,
    };
  }, [body, configuration, credential, credentialMode, values]);

  const report = (outcome: Parameters<typeof reportAttempt>[3]) => {
    if (
      !configuration ||
      reportedTokens.current.has(configuration.attempt_token)
    )
      return;
    reportedTokens.current.add(configuration.attempt_token);
    void reportAttempt(
      slug,
      descriptor.destination_key,
      configuration.attempt_token,
      outcome,
      versionSlug,
    ).catch(() => undefined);
  };

  const openBuilder = async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadConfiguration(
        slug,
        descriptor.destination_key,
        versionSlug,
      );
      setConfiguration(loaded);
      setCredentialMode("none");
      setCredential("");
    } catch {
      setError(
        "Try It is unavailable for this published operation. Examples remain available.",
      );
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!configuration || !builtRequest) return;
    if (configuration.operation.method !== "GET" && !confirmedMutation) {
      setConfirmedMutation(true);
      setError("Review the request, then press Send again to confirm it.");
      report("client_validation_blocked");
      return;
    }
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const response = await executeDocumentationTryItRequest({
        configuration,
        web_origin_set_digest: __OSSIE_DOCUMENTATION_TRY_IT_ORIGIN_SET_DIGEST__,
        request: builtRequest,
        secrets: credential ? [credential] : [],
        timeout_ms: configuration.request_limits.timeout_ms,
      });
      setResult(response);
      report(response.kind === "blocked" ? "response_blocked" : "completed");
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
        code === "timed_out"
          ? "timed_out"
          : code === "aborted"
            ? "aborted"
            : code === "response_too_large" ||
                code === "response_headers_too_large" ||
                code === "response_unreadable"
              ? "response_blocked"
              : code === "csp_mismatch" || code === "origin_mismatch"
                ? "client_validation_blocked"
                : "browser_network_blocked",
      );
    } finally {
      setSending(false);
    }
  };

  const examples = builtRequest
    ? generateDocumentationTryItExamples({
        ...builtRequest,
        headers: builtRequest.headers,
        sensitive_header_names: [
          "Authorization",
          ...(configuration?.api_key_header_name
            ? [configuration.api_key_header_name]
            : []),
        ],
        timeout_ms: configuration?.request_limits.timeout_ms ?? 15_000,
      })
    : null;

  return (
    <section
      aria-labelledby="documentation-api-operation-heading"
      className="documentation-api-operation"
    >
      <h2 id="documentation-api-operation-heading">Request</h2>
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
                    required={parameter.required}
                    type={inputType(parameter.value_type)}
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
              <label>
                Credential (kept only in this panel)
                <input
                  autoComplete="off"
                  spellCheck={false}
                  type="password"
                  value={credential}
                  onChange={(event) => setCredential(event.target.value)}
                />
              </label>
            ) : null}
            {configuration.operation.request_body ? (
              <label>
                JSON request body
                <textarea
                  rows={8}
                  spellCheck={false}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </label>
            ) : null}
          </div>
          {builtRequest ? (
            <p className="documentation-api-operation__target">
              Target: <code>{builtRequest.url}</code>
            </p>
          ) : null}
          <button type="button" disabled={sending} onClick={() => void send()}>
            {sending ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfiguration(null);
              setCredential("");
              setResult(null);
            }}
          >
            Close and clear
          </button>
          {examples ? (
            <details>
              <summary>Generated examples</summary>
              {Object.entries(examples).map(([language, example]) => (
                <section key={language}>
                  <h3>{language}</h3>
                  <pre>
                    <code>{example}</code>
                  </pre>
                </section>
              ))}
            </details>
          ) : null}
        </>
      )}
      {error ? <p role="alert">{error}</p> : null}
      {result ? (
        <section aria-live="polite">
          <h2>Response</h2>
          {result.kind === "blocked" ? (
            <p>{result.reason}</p>
          ) : (
            <>
              <p>Status: {result.status}</p>
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
