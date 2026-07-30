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
} from "../../lib/documentationApi";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canWrite: boolean;
  inspect?: typeof inspectDocumentationOpenApi;
  apply?: typeof applyDocumentationOpenApi;
  loadSource?: typeof getDocumentationOpenApiSource;
};

export const DocumentationOpenApiPanel = ({
  projectId,
  versionSlug,
  siteId,
  canWrite,
  inspect = inspectDocumentationOpenApi,
  apply = applyDocumentationOpenApi,
  loadSource = getDocumentationOpenApiSource,
}: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] =
    useState<DocumentationOpenApiInspection | null>(null);
  const [operations, setOperations] = useState<
    DocumentationOpenApiOperation[]
  >([]);
  const [status, setStatus] = useState("");
  const [sourceVersion, setSourceVersion] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    loadSource(projectId, versionSlug, siteId)
      .then((result) => {
        if (!active || !result) return;
        setSourceVersion(result.source.version);
        setOperations(result.operations);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [loadSource, projectId, siteId, versionSlug]);

  const inspectFile = async () => {
    if (!file) return;
    setStatus("Inspecting OpenAPI without fetching external references…");
    try {
      const result = await inspect(projectId, versionSlug, siteId, file);
      setInspection(result.inspection);
      setStatus("Inspection ready. Review the safe summary before applying.");
    } catch {
      setStatus("OpenAPI inspection failed. The active source was not changed.");
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
          {inspection.warnings.map((warning) => <p key={warning}>{warning}</p>)}
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
            {operations.map((operation) => (
              <li key={operation.destination_key}>
                {operation.method.toUpperCase()} {operation.path}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p role="status">{status}</p>
    </section>
  );
};
