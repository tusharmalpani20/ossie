import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationPortabilityPanel } from "./DocumentationPortabilityPanel";

const api = vi.hoisted(() => ({
  inspectDocumentationImport: vi.fn(),
  applyDocumentationImport: vi.fn(),
  cancelDocumentationImport: vi.fn(),
  listDocumentationArtifactPublications: vi.fn(),
}));

vi.mock("../../lib/documentationApi", () => api);

describe("DocumentationPortabilityPanel", () => {
  it("provides a labelled keyboard-operable package input", () => {
    render(
      <DocumentationPortabilityPanel
        projectId="project"
        versionSlug="main"
        kind="site_package"
        mode="create_site"
        canImport
      />,
    );
    expect(screen.getByLabelText("Ossie Site ZIP")).toHaveAttribute(
      "accept",
      "application/zip,.zip",
    );
    expect(screen.getByRole("button", { name: "Inspect file" })).toBeDisabled();
    expect(
      screen.getByRole("region", { name: "Import Site package" }),
    ).toHaveClass("rounded-[var(--ossie-radius-card)]");
    expect(
      screen.getByRole("group", { name: "Site package file actions" }),
    ).toContainElement(screen.getByRole("button", { name: "Inspect file" }));
  });

  it("does not expose mutation controls to a Viewer", () => {
    const { container } = render(
      <DocumentationPortabilityPanel
        projectId="project"
        versionSlug="main"
        kind="site_package"
        mode="create_site"
        canImport={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("clears the consumed review and reports the applied Site", async () => {
    api.inspectDocumentationImport.mockResolvedValueOnce({
      inspection: {
        id: "inspection",
        status: "ready",
        kind: "page_markdown",
        content_fingerprint: "a".repeat(64),
        expires_at: "2099-01-01T00:00:00.000Z",
        summary: {
          pages: 1,
          snippets: 0,
          assets: 0,
          openapi_sources: 0,
          external_bindings: 0,
          expanded_bytes: 20,
        },
        proposal: {
          package_profile: null,
          claimed_source_kind: null,
          title: "Imported",
          canonical_path: "imported",
          site_name: null,
          site_description: null,
          primary_language: null,
          home_page_handle: null,
          pages: [],
          required_bindings: [],
        },
        issues: [],
        issue_counts: { blocking: 0, warnings: 0 },
        has_blocking_issues: false,
        issues_truncated: false,
      },
    });
    api.applyDocumentationImport.mockResolvedValueOnce({
      application: { target_site_id: "site" },
    });
    const onApplied = vi.fn();
    render(
      <DocumentationPortabilityPanel
        projectId="project"
        versionSlug="main"
        kind="page_markdown"
        mode="page"
        siteId="site"
        draftVersion={2}
        canImport
        onApplied={onApplied}
      />,
    );

    fireEvent.change(screen.getByLabelText("Markdown file"), {
      target: {
        files: [
          new File(["# Imported"], "imported.md", {
            type: "text/markdown",
          }),
        ],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Inspect file" }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Confirm and apply import",
      }),
    );

    await waitFor(() => expect(onApplied).toHaveBeenCalledWith("site"));
    expect(
      screen.queryByRole("region", { name: "Import review" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Import applied.");
  });

  it("requires an exact labelled Publication selection before package Apply", async () => {
    api.inspectDocumentationImport.mockResolvedValueOnce({
      inspection: {
        id: "inspection-binding",
        status: "ready",
        kind: "site_package",
        format_version: 1,
        content_fingerprint: "b".repeat(64),
        expires_at: "2099-01-01T00:00:00.000Z",
        summary: {
          pages: 1,
          snippets: 0,
          assets: 0,
          openapi_sources: 0,
          external_bindings: 1,
          expanded_bytes: 20,
        },
        proposal: {
          package_profile: "roundtrip",
          claimed_source_kind: "working_draft",
          title: null,
          canonical_path: null,
          site_name: "Imported docs",
          site_description: null,
          primary_language: "en-US",
          home_page_handle: "page-0001",
          pages: [],
          required_bindings: [
            {
              handle: "binding-0001",
              kind: "guide_publication",
              display: { title: "Install guide" },
            },
          ],
        },
        issues: [],
        issue_counts: { blocking: 0, warnings: 0 },
        has_blocking_issues: false,
        issues_truncated: false,
      },
    });
    api.listDocumentationArtifactPublications.mockResolvedValueOnce({
      publications: [
        {
          published_artifact_id: "publication",
          title: "Install guide",
          project_version_name: "Summer",
          revision_number: 2,
          publication_sequence: 3,
        },
      ],
    });
    render(
      <DocumentationPortabilityPanel
        projectId="project"
        versionSlug="main"
        kind="site_package"
        mode="create_site"
        canImport
      />,
    );
    fireEvent.change(screen.getByLabelText("Ossie Site ZIP"), {
      target: {
        files: [new File(["zip"], "docs.zip", { type: "application/zip" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Inspect file" }));

    const apply = await screen.findByRole("button", {
      name: "Confirm and apply import",
    });
    expect(apply).toBeDisabled();
    const selector = await screen.findByRole("combobox", {
      name: "Install guide",
    });
    expect(selector).toHaveTextContent("Install guide · Summer · r2 · p3");
    fireEvent.change(selector, { target: { value: "publication" } });
    expect(apply).toBeEnabled();
  });
});
