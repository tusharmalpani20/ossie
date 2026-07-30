import type { DocumentationImportInspection } from "../../lib/documentationApi";

type Props = {
  inspection: DocumentationImportInspection;
};

export const DocumentationImportReview = ({ inspection }: Props) => (
  <section aria-labelledby="documentation-import-review-heading">
    <h3 id="documentation-import-review-heading">Import review</h3>
    <p>
      {inspection.summary.pages} Pages, {inspection.summary.snippets} Snippets,{" "}
      {inspection.summary.assets} Assets, and{" "}
      {inspection.summary.openapi_sources} OpenAPI sources.
    </p>
    {inspection.issue_counts.blocking ? (
      <div role="alert" tabIndex={-1}>
        <h4>Blocking issues</h4>
        <p>
          Correct the source file and inspect it again before applying this
          import.
        </p>
      </div>
    ) : null}
    {inspection.issues.length ? (
      <ul>
        {inspection.issues.map((issue, index) => (
          <li key={`${issue.code}-${issue.location ?? "package"}-${index}`}>
            <strong>{issue.severity === "blocking" ? "Blocking" : "Warning"}:</strong>{" "}
            {issue.message}
            {issue.location ? ` (${issue.location})` : ""}
          </li>
        ))}
      </ul>
    ) : (
      <p>No source-content issues were found.</p>
    )}
    {inspection.issues_truncated ? (
      <p>
        Only part of the issue list is shown. Apply remains governed by the
        complete server-side result.
      </p>
    ) : null}
  </section>
);
