import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocumentationImportReview } from "./DocumentationImportReview";

describe("DocumentationImportReview", () => {
  it("announces blocking issues without relying on colour", () => {
    render(
      <DocumentationImportReview
        inspection={{
          id: "inspection",
          kind: "site_package",
          status: "ready",
          format_version: 1,
          source_digest: "a".repeat(64),
          content_fingerprint: "b".repeat(64),
          expires_at: "2026-08-01T00:00:00.000Z",
          summary: {
            pages: 2,
            snippets: 1,
            assets: 0,
            openapi_sources: 0,
            external_bindings: 0,
            expanded_bytes: 10,
          },
          proposal: {
            title: null,
            canonical_path: null,
            site_name: "Docs",
            primary_language: "en",
            required_bindings: [],
          },
          issues: [
            {
              severity: "blocking",
              code: "relationship_unresolved",
              location: "site.json",
              message: "A relationship is unresolved.",
            },
          ],
          issue_counts: { blocking: 1, warnings: 0 },
          has_blocking_issues: true,
          issues_truncated: false,
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Blocking issues");
    expect(screen.getByRole("alert")).toHaveFocus();
    expect(screen.getByText(/A relationship is unresolved/)).toBeInTheDocument();
  });
});
