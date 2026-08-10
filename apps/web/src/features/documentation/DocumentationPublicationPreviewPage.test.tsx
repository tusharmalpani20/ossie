import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationPublicationPreviewPage } from "./DocumentationPublicationPreviewPage";

describe("DocumentationPublicationPreviewPage", () => {
  it("renders the exact Publication identity and its immutable Revision content", async () => {
    const loadPublication = vi.fn().mockResolvedValue({
      publication: {
        id: "publication-4",
        publication_sequence: 4,
        revision_number: 9,
        published_at: "2026-08-01T00:00:00.000Z",
      },
      revision: {
        site: { id: "site", name: "Product docs", description: null },
        revision: {
          id: "revision-9",
          revision_number: 9,
          created_at: "2026-08-01T00:00:00.000Z",
          home_page_id: "page",
          primary_language: "en",
        },
        pages: [
          {
            id: "page",
            title: "Install",
            description: null,
            canonical_path: "install",
            blocks: [
              {
                id: "block",
                kind: "paragraph" as const,
                position: 1,
                expected_version: 1,
                text: "Frozen Publication content",
              },
            ],
          },
        ],
        navigation: { nodes: [] },
        openapi_operations: [],
      },
    });

    render(
      <DocumentationPublicationPreviewPage
        projectId="project"
        versionSlug="main"
        siteId="site"
        publicationSequence={4}
        loadPublication={loadPublication}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Product docs — immutable Publication 4",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Frozen Publication content")).toBeInTheDocument();
    expect(screen.getByText(/immutable Revision 9/)).toBeInTheDocument();
    expect(loadPublication).toHaveBeenCalledWith("project", "main", "site", 4);
  });

  it("keeps an unavailable immutable Publication explicit", async () => {
    const loadPublication = vi
      .fn()
      .mockRejectedValueOnce(new Error("missing"))
      .mockResolvedValueOnce({
        publication: {
          id: "publication-4",
          publication_sequence: 4,
          revision_number: 9,
          published_at: "2026-08-01T00:00:00.000Z",
        },
        revision: {
          site: { id: "site", name: "Product docs", description: null },
          revision: {
            id: "revision-9",
            revision_number: 9,
            created_at: "2026-08-01T00:00:00.000Z",
            home_page_id: "page",
            primary_language: "en",
          },
          pages: [],
          navigation: { nodes: [] },
          openapi_operations: [],
        },
      });
    render(
      <DocumentationPublicationPreviewPage
        projectId="project"
        versionSlug="main"
        siteId="site"
        publicationSequence={4}
        loadPublication={loadPublication}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The immutable Documentation Publication is unavailable.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: /immutable Publication 4/ })).toBeInTheDocument();
  });
});
