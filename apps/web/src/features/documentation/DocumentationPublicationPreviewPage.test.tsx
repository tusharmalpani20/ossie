import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocumentationPublicationPreviewPage } from "./DocumentationPublicationPreviewPage";

const revision = {
  site: { id: "site", name: "Product docs", description: null },
  revision: {
    id: "revision",
    revision_number: 4,
    created_at: "2026-08-01T00:00:00.000Z",
  },
  pages: [
    {
      id: "page",
      title: "Install",
      canonical_path: "install",
      blocks: [
        {
          id: "block",
          kind: "paragraph" as const,
          position: 1,
          expected_version: 1,
          text: "Immutable Publication content",
        },
      ],
    },
  ],
  openapi_operations: [],
};

describe("DocumentationPublicationPreviewPage", () => {
  it("renders the exact Publication selection as read-only content", async () => {
    render(
      <DocumentationPublicationPreviewPage
        projectId="project"
        versionSlug="main"
        siteId="site"
        publicationSequence={2}
        loadPublications={async () => ({
          publications: [
            {
              id: "publication",
              publication_sequence: 2,
              revision_number: 4,
              published_at: "2026-08-02T00:00:00.000Z",
            },
          ],
        })}
        loadRevision={async () => ({ revision })}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Product docs — immutable Publication 2",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Immutable Publication content"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Revision 4/)).toBeInTheDocument();
  });
});
