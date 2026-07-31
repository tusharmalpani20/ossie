import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Label } from "@repo/ui/label";
import {
  applyDocumentationOpenApi,
  getDocumentationOpenApiSource,
  inspectDocumentationOpenApi,
  type DocumentationOpenApiInspection,
  type DocumentationOpenApiOperation,
  documentationOpenApiExportUrl,
  transitionDocumentationOpenApi,
} from "../../lib/documentationApi";
import {
  getDocumentationTryItConfiguration,
  getDocumentationTryItPolicy,
  putDocumentationTryItPolicy,
  reportDocumentationTryItAttempt,
} from "../../lib/documentationTryItApi";
import { LazyDocumentationApiOperationExperience } from "./LazyDocumentationApiOperationExperience";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canWrite: boolean;
  canManageTryIt?: boolean;
  inspect?: typeof inspectDocumentationOpenApi;
  apply?: typeof applyDocumentationOpenApi;
  loadSource?: typeof getDocumentationOpenApiSource;
  loadTryItConfiguration?: (
    operationKey: string,
  ) => ReturnType<typeof getDocumentationTryItConfiguration>;
  reportTryItAttempt?: (
    operationKey: string,
    attemptToken: string,
    outcome:
      | "completed"
      | "browser_network_blocked"
      | "timed_out"
      | "aborted"
      | "response_blocked"
      | "client_validation_blocked",
  ) => Promise<void>;
};

export const DocumentationOpenApiPanel = ({
  projectId,
  versionSlug,
  siteId,
  canWrite,
  canManageTryIt = false,
  inspect = inspectDocumentationOpenApi,
  apply = applyDocumentationOpenApi,
  loadSource = getDocumentationOpenApiSource,
  loadTryItConfiguration = (operationKey) =>
    getDocumentationTryItConfiguration(
      projectId,
      versionSlug,
      siteId,
      operationKey,
    ),
  reportTryItAttempt = (operationKey, attemptToken, outcome) =>
    reportDocumentationTryItAttempt(
      projectId,
      versionSlug,
      siteId,
      operationKey,
      attemptToken,
      outcome,
    ),
}: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] =
    useState<DocumentationOpenApiInspection | null>(null);
  const [operations, setOperations] = useState<DocumentationOpenApiOperation[]>(
    [],
  );
  const [status, setStatus] = useState("");
  const [sourceVersion, setSourceVersion] = useState<number | null>(null);
  const [sourceStatus, setSourceStatus] = useState<"active" | "archived">(
    "active",
  );
  const [serverCandidates, setServerCandidates] = useState<string[]>([]);
  const [tryItVersion, setTryItVersion] = useState<number | null>(null);
  const [tryItEnabled, setTryItEnabled] = useState(false);
  const [approvedOrigin, setApprovedOrigin] = useState("");
  const [basePath, setBasePath] = useState("/");
  const [allowBearer, setAllowBearer] = useState(false);
  const [apiKeyHeaderName, setApiKeyHeaderName] = useState("");
  const [allowedOperations, setAllowedOperations] = useState<string[]>([]);
  const [operationFilter, setOperationFilter] = useState("");
  const [operationPage, setOperationPage] = useState(0);
  const [selectedRequestOperationKey, setSelectedRequestOperationKey] =
    useState("");

  useEffect(() => {
    let active = true;
    loadSource(projectId, versionSlug, siteId)
      .then((result) => {
        if (!active || !result) return;
        setSourceVersion(result.source.version);
        setSourceStatus(result.source.status ?? "active");
        setServerCandidates(result.source.server_candidates ?? []);
        setOperations(result.operations);
        setSelectedRequestOperationKey(
          (current) => current || result.operations[0]?.destination_key || "",
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [loadSource, projectId, siteId, versionSlug]);

  useEffect(() => {
    let active = true;
    getDocumentationTryItPolicy(projectId, versionSlug, siteId)
      .then(({ policy }) => {
        if (!active || !policy) return;
        setTryItVersion(policy.version);
        setTryItEnabled(policy.status === "enabled");
        setApprovedOrigin(policy.approved_origin ?? "");
        setBasePath(policy.base_path ?? "/");
        setAllowBearer(policy.allow_bearer);
        setApiKeyHeaderName(policy.api_key_header_name ?? "");
        setAllowedOperations(policy.operation_destination_keys);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [projectId, siteId, versionSlug]);

  const inspectFile = async () => {
    if (!file) return;
    setStatus("Inspecting OpenAPI without fetching external references…");
    try {
      const result = await inspect(projectId, versionSlug, siteId, file);
      setInspection(result.inspection);
      setStatus("Inspection ready. Review the safe summary before applying.");
    } catch {
      setStatus(
        "OpenAPI inspection failed. The active source was not changed.",
      );
    }
  };

  const applySource = async () => {
    if (!inspection) return;
    setStatus("Applying inspected source…");
    try {
      const result = await apply(
        projectId,
        versionSlug,
        siteId,
        inspection.id,
        sourceVersion,
      );
      setSourceVersion(result.source.version);
      setOperations(result.operations);
      setStatus("OpenAPI source applied.");
    } catch {
      setStatus("OpenAPI source could not be applied.");
    }
  };

  const saveTryItPolicy = async () => {
    if (
      tryItEnabled &&
      !window.confirm(
        `Approve ${approvedOrigin.trim()} for ${allowedOperations.length} selected ${allowedOperations.length === 1 ? "operation" : "operations"}?`,
      )
    )
      return;
    setStatus("Saving browser-direct request policy…");
    try {
      const enabled = tryItEnabled;
      const response = (await putDocumentationTryItPolicy(
        projectId,
        versionSlug,
        siteId,
        enabled
          ? {
              expected_policy_version: tryItVersion,
              status: "enabled",
              approved_origin: approvedOrigin,
              base_path: basePath,
              allow_bearer: allowBearer,
              api_key_header_name: apiKeyHeaderName.trim() || null,
              operation_destination_keys: allowedOperations,
            }
          : {
              expected_policy_version: tryItVersion,
              status: "disabled",
              approved_origin: null,
              base_path: null,
              allow_bearer: false,
              api_key_header_name: null,
              operation_destination_keys: [],
            },
      )) as { policy?: { version?: number } };
      if (response.policy?.version) setTryItVersion(response.policy.version);
      setStatus(
        enabled
          ? "Try It policy saved. Create a new revision to freeze it."
          : "Try It policy disabled.",
      );
    } catch {
      setStatus(
        "Try It policy was not saved. Reload to check permissions, source state, and operator origin policy.",
      );
    }
  };
  const normalizedOperationFilter = operationFilter.trim().toLowerCase();
  const filteredOperations = operations.filter((operation) =>
    `${operation.method} ${operation.path} ${operation.summary ?? ""}`
      .toLowerCase()
      .includes(normalizedOperationFilter),
  );
  const operationPageCount = Math.max(
    1,
    Math.ceil(filteredOperations.length / 100),
  );
  const visibleOperations = filteredOperations.slice(
    operationPage * 100,
    operationPage * 100 + 100,
  );
  const executableOperations = visibleOperations.filter(
    (
      operation,
    ): operation is DocumentationOpenApiOperation & {
      descriptor_version: 1;
      request_descriptor: NonNullable<
        DocumentationOpenApiOperation["request_descriptor"]
      >;
    } =>
      operation.descriptor_version === 1 &&
      Boolean(operation.request_descriptor),
  );
  const selectedRequestOperation =
    executableOperations.find(
      (operation) => operation.destination_key === selectedRequestOperationKey,
    ) ?? executableOperations[0];

  return (
    <section aria-labelledby="documentation-openapi-heading">
      <h2 id="documentation-openapi-heading">OpenAPI reference</h2>
      <p>
        JSON or YAML, at most 10 MiB. External references are rejected and no
        request execution is enabled.
      </p>
      {canWrite ? (
        <>
          <Label htmlFor="documentation-openapi-file">
            OpenAPI JSON or YAML
          </Label>
          <input
            id="documentation-openapi-file"
            type="file"
            accept="application/json,application/yaml,.json,.yaml,.yml"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button disabled={!file} onClick={() => void inspectFile()}>
            Inspect OpenAPI
          </Button>
        </>
      ) : null}
      {inspection ? (
        <div>
          <p>
            {inspection.title}: OpenAPI {inspection.openapi_version},{" "}
            {inspection.operation_count}{" "}
            {inspection.operation_count === 1 ? "operation" : "operations"}.
          </p>
          {inspection.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
          {canWrite ? (
            <Button onClick={() => void applySource()}>Apply source</Button>
          ) : null}
        </div>
      ) : null}
      {operations.length ? (
        <>
          {sourceVersion ? (
            <a
              href={documentationOpenApiExportUrl(
                projectId,
                versionSlug,
                siteId,
                sourceVersion,
              )}
              download
            >
              Export exact OpenAPI source
            </a>
          ) : null}
          <ul>
            {visibleOperations.map((operation) => (
              <li key={operation.destination_key}>
                {operation.method.toUpperCase()} {operation.path}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {sourceVersion && canWrite ? (
        <Button
          disabled={Boolean(status.match(/Archiving|Restoring/u))}
          onClick={() => {
            const next = sourceStatus === "active" ? "archive" : "restore";
            setStatus(
              `${next === "archive" ? "Archiving" : "Restoring"} OpenAPI source…`,
            );
            void transitionDocumentationOpenApi(
              projectId,
              versionSlug,
              siteId,
              sourceVersion,
              next,
            )
              .then(({ source }) => {
                setSourceVersion(source.version);
                setSourceStatus(source.status);
                setStatus(
                  `OpenAPI source ${next === "archive" ? "archived" : "restored"}.`,
                );
              })
              .catch(() =>
                setStatus(
                  "OpenAPI lifecycle changed elsewhere. Reload and retry.",
                ),
              );
          }}
        >
          {sourceStatus === "active"
            ? "Archive OpenAPI source"
            : "Restore OpenAPI source"}
        </Button>
      ) : null}
      {sourceVersion ? (
        <section aria-labelledby="documentation-try-it-policy-heading">
          <h3 id="documentation-try-it-policy-heading">
            Browser-direct Try It
          </h3>
          <p>
            Administrators approve one exact HTTPS origin and the operations
            readers may call. The Ossie server never proxies target requests.
          </p>
          {serverCandidates.length ? (
            <>
              <p>Imported server suggestions are display-only:</p>
              <ul>
                {serverCandidates.map((candidate) => (
                  <li key={candidate}>
                    {candidate} (imported suggestion — not approved)
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {canManageTryIt ? (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={tryItEnabled}
                  onChange={(event) => setTryItEnabled(event.target.checked)}
                />
                Enable for the next revision
              </label>
              {tryItEnabled ? (
                <>
                  <Label htmlFor="documentation-try-it-origin">
                    Approved exact HTTPS origin
                  </Label>
                  <input
                    id="documentation-try-it-origin"
                    type="url"
                    placeholder="https://api.example.com"
                    value={approvedOrigin}
                    onChange={(event) => setApprovedOrigin(event.target.value)}
                  />
                  <Label htmlFor="documentation-try-it-base-path">
                    Base path
                  </Label>
                  <input
                    id="documentation-try-it-base-path"
                    value={basePath}
                    onChange={(event) => setBasePath(event.target.value)}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={allowBearer}
                      onChange={(event) => setAllowBearer(event.target.checked)}
                    />
                    Allow bearer credentials
                  </label>
                  <Label htmlFor="documentation-try-it-api-key">
                    Allowed API-key header (optional)
                  </Label>
                  <input
                    id="documentation-try-it-api-key"
                    value={apiKeyHeaderName}
                    onChange={(event) =>
                      setApiKeyHeaderName(event.target.value)
                    }
                  />
                  <fieldset>
                    <legend>Allowed operations</legend>
                    <Label htmlFor="documentation-try-it-operation-filter">
                      Filter allowed operations
                    </Label>
                    <input
                      id="documentation-try-it-operation-filter"
                      type="search"
                      value={operationFilter}
                      onChange={(event) => {
                        setOperationFilter(event.target.value);
                        setOperationPage(0);
                      }}
                    />
                    <p role="status">
                      Showing {visibleOperations.length} of{" "}
                      {filteredOperations.length} matching operations.
                    </p>
                    {visibleOperations.map((operation) => (
                      <label key={operation.destination_key}>
                        <input
                          type="checkbox"
                          checked={allowedOperations.includes(
                            operation.destination_key,
                          )}
                          onChange={(event) =>
                            setAllowedOperations((current) =>
                              event.target.checked
                                ? [...current, operation.destination_key]
                                : current.filter(
                                    (key) => key !== operation.destination_key,
                                  ),
                            )
                          }
                        />
                        {operation.method.toUpperCase()} {operation.path}
                      </label>
                    ))}
                    {operationPageCount > 1 ? (
                      <div>
                        <Button
                          disabled={operationPage === 0}
                          onClick={() =>
                            setOperationPage((current) =>
                              Math.max(0, current - 1),
                            )
                          }
                        >
                          Previous operations
                        </Button>
                        <span>
                          Page {operationPage + 1} of {operationPageCount}
                        </span>
                        <Button
                          disabled={operationPage + 1 >= operationPageCount}
                          onClick={() =>
                            setOperationPage((current) =>
                              Math.min(operationPageCount - 1, current + 1),
                            )
                          }
                        >
                          Next operations
                        </Button>
                      </div>
                    ) : null}
                  </fieldset>
                </>
              ) : null}
              <Button onClick={() => void saveTryItPolicy()}>
                Save Try It policy
              </Button>
            </>
          ) : (
            <p>Only a Project Admin can change this security policy.</p>
          )}
        </section>
      ) : null}
      {executableOperations.length ? (
        <section aria-labelledby="documentation-draft-operation-heading">
          <h3 id="documentation-draft-operation-heading">Draft API request</h3>
          <Label htmlFor="documentation-draft-request-operation">
            Exact operation
          </Label>
          <select
            id="documentation-draft-request-operation"
            value={selectedRequestOperation?.destination_key}
            onChange={(event) =>
              setSelectedRequestOperationKey(event.target.value)
            }
          >
            {executableOperations.map((operation) => (
              <option
                key={operation.destination_key}
                value={operation.destination_key}
              >
                {operation.method.toUpperCase()} {operation.path}
              </option>
            ))}
          </select>
          {selectedRequestOperation ? (
            <article
              key={`request-${selectedRequestOperation.destination_key}`}
            >
              <h3>
                {selectedRequestOperation.method.toUpperCase()}{" "}
                {selectedRequestOperation.path}
              </h3>
              <p>
                This request uses the current server-saved OpenAPI source. It is
                not a frozen Revision.
              </p>
              <LazyDocumentationApiOperationExperience
                descriptor={selectedRequestOperation.request_descriptor}
                loadConfiguration={() =>
                  loadTryItConfiguration(
                    selectedRequestOperation.destination_key,
                  )
                }
                reportAttempt={(attemptToken, outcome) =>
                  reportTryItAttempt(
                    selectedRequestOperation.destination_key,
                    attemptToken,
                    outcome,
                  )
                }
              />
            </article>
          ) : null}
        </section>
      ) : null}
      <p role="status">{status}</p>
    </section>
  );
};
