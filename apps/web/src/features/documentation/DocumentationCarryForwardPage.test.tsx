import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationApiError } from "../../lib/documentationApi";
import { DocumentationCarryForwardPage } from "./DocumentationCarryForwardPage";

const versions = [
  { id: "source", name: "Version A", slug: "v1", status: "active" },
  { id: "target", name: "Version B", slug: "v2", status: "active" },
] as never;

describe("DocumentationCarryForwardPage", () => {
  it("submits selected exact source versions only after independent-copy confirmation", async () => {
    const carry = vi.fn(async () => ({
      operation: {
        id: "operation",
        source_project_version_id: "source",
        target_project_version_id: "target",
        selection_count: 1,
        idempotent_replay: false,
        items: [
          {
            position: 1,
            site_id: "site",
            source_edition_id: "edition-a",
            source_revision_id: "revision",
            source_revision_number: 3,
            source_revision_reused: true,
            target_edition_id: "edition-b",
            target_draft_id: "draft-b",
          },
        ],
      },
    }));
    render(
      <DocumentationCarryForwardPage
        projectId="project"
        target={versions[1]}
        versions={versions}
        canCarry
        loadOptions={async () => ({
          source_project_version_id: "source",
          target_project_version_id: "target",
          sites: [
            {
              site_id: "site",
              source_edition_id: "edition-a",
              title: "Product docs",
              description: null,
              primary_language: "en-US",
              status: "active",
              effective_status: "active",
              read_only_reason: null,
              source_edition_version: 2,
              source_draft_version: 5,
              latest_revision_number: 3,
              latest_revision_created_at: "2026-07-30T00:00:00.000Z",
              target_has_edition: false,
            },
          ],
        })}
        carry={carry}
      />,
    );
    fireEvent.change(screen.getByLabelText("Source Project Version"), {
      target: { value: "source" },
    });
    expect(await screen.findByText("Product docs")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Product docs/u));
    expect(screen.getByRole("status")).toHaveTextContent("1 Site selected");
    expect(screen.getByRole("button", { name: "Carry Forward Sites" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/independent mutable copies/u));
    fireEvent.click(screen.getByRole("button", { name: "Carry Forward Sites" }));
    await waitFor(() =>
      expect(carry).toHaveBeenCalledWith(
        "project",
        "v2",
        expect.objectContaining({
          selections: [
            {
              site_id: "site",
              expected_source_edition_version: 2,
              expected_source_draft_version: 5,
            },
          ],
        }),
        expect.any(String),
      ),
    );
    expect(await screen.findByText(/Revision 3 \(reused\)/u)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Product docs" })).toHaveAttribute(
      "href",
      "/projects/project/versions/v2/documentation/site",
    );
  });

  it("keeps selection and focuses a recoverable conflict", async () => {
    render(
      <DocumentationCarryForwardPage
        projectId="project"
        target={versions[1]}
        versions={versions}
        canCarry
        loadOptions={async () => ({
          source_project_version_id: "source",
          target_project_version_id: "target",
          sites: [
            {
              site_id: "site",
              source_edition_id: "edition-a",
              title: "Product docs",
              description: null,
              primary_language: "en-US",
              status: "active",
              effective_status: "active",
              read_only_reason: null,
              source_edition_version: 2,
              source_draft_version: 5,
              latest_revision_number: null,
              latest_revision_created_at: null,
              target_has_edition: false,
            },
          ],
        })}
        carry={async () => {
          throw new DocumentationApiError(
            409,
            "documentation_row_version_conflict",
            "Documentation changed; reload and retry",
          );
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Source Project Version"), {
      target: { value: "source" },
    });
    await screen.findByText("Product docs");
    fireEvent.click(screen.getByLabelText(/Product docs/u));
    fireEvent.click(screen.getByLabelText(/independent mutable copies/u));
    fireEvent.click(screen.getByRole("button", { name: "Carry Forward Sites" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveFocus();
    expect(screen.getByLabelText(/Product docs/u)).toBeChecked();
  });
});
