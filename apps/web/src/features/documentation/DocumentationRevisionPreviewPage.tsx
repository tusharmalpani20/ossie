import { useEffect, useMemo, useState } from "react";
import {
  getDocumentationRevision,
  type DocumentationOpenApiOperation,
  type DocumentationRevisionSnapshot,
} from "../../lib/documentationApi";
import {
  getDocumentationTryItConfiguration,
  reportDocumentationTryItAttempt,
} from "../../lib/documentationTryItApi";
import { LazyDocumentationApiOperationExperience } from "./LazyDocumentationApiOperationExperience";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  revisionNumber: number;
  loadRevision?: typeof getDocumentationRevision;
  loadTryItConfiguration?: typeof getDocumentationTryItConfiguration;
  reportTryItAttempt?: typeof reportDocumentationTryItAttempt;
};

const executableOperations = (revision: DocumentationRevisionSnapshot) =>
  revision.openapi_operations.filter(
    (
      operation,
    ): operation is DocumentationOpenApiOperation & {
      request_descriptor: NonNullable<
        DocumentationOpenApiOperation["request_descriptor"]
      >;
    } =>
      operation.descriptor_version === 1 &&
      operation.request_descriptor?.descriptor_version === 1,
  );

export const DocumentationRevisionPreviewPage = ({
  projectId,
  versionSlug,
  siteId,
  revisionNumber,
  loadRevision = getDocumentationRevision,
  loadTryItConfiguration = getDocumentationTryItConfiguration,
  reportTryItAttempt = reportDocumentationTryItAttempt,
}: Props) => {
  const [revision, setRevision] =
    useState<DocumentationRevisionSnapshot | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    loadRevision(projectId, versionSlug, siteId, revisionNumber)
      .then(({ revision: loaded }) => {
        if (active) setRevision(loaded);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [loadRevision, projectId, revisionNumber, siteId, versionSlug]);

  const operations = useMemo(
    () => (revision ? executableOperations(revision) : []),
    [revision],
  );
  const selected =
    operations.find((operation) => operation.destination_key === selectedKey) ??
    operations[0];

  if (failed)
    return (
      <p role="alert">The immutable Documentation Revision is unavailable.</p>
    );
  if (!revision)
    return <p role="status">Loading immutable Documentation Revision…</p>;

  return (
    <section aria-labelledby="documentation-revision-heading">
      <header>
        <p>Read-only snapshot. Draft changes are not included.</p>
        <h1 id="documentation-revision-heading">
          {revision.site.name} — immutable Revision{" "}
          {revision.revision.revision_number}
        </h1>
      </header>
      {operations.length > 0 ? (
        <>
          <label>
            API operation
            <select
              value={selected?.destination_key ?? ""}
              onChange={(event) => setSelectedKey(event.target.value)}
            >
              {operations.map((operation) => (
                <option
                  key={operation.destination_key}
                  value={operation.destination_key}
                >
                  {operation.method} {operation.path}
                  {operation.summary ? ` — ${operation.summary}` : ""}
                </option>
              ))}
            </select>
          </label>
          {selected?.request_descriptor ? (
            <LazyDocumentationApiOperationExperience
              key={selected.destination_key}
              descriptor={selected.request_descriptor}
              loadConfiguration={() =>
                loadTryItConfiguration(
                  projectId,
                  versionSlug,
                  siteId,
                  selected.destination_key,
                  { source: "revision", revision_number: revisionNumber },
                )
              }
              reportAttempt={(attemptToken, outcome) =>
                reportTryItAttempt(
                  projectId,
                  versionSlug,
                  siteId,
                  selected.destination_key,
                  attemptToken,
                  outcome,
                  { source: "revision", revision_number: revisionNumber },
                )
              }
            />
          ) : null}
        </>
      ) : (
        <p>
          No request-builder-compatible API operations exist in this Revision.
        </p>
      )}
    </section>
  );
};
