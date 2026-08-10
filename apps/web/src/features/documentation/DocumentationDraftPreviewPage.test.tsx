import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationDraftPreviewPage } from "./DocumentationDraftPreviewPage";

describe("DocumentationDraftPreviewPage", () => {
  it("offers retry when the saved draft preview cannot be loaded", async () => {
    const loadPreview = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        preview: {
          site: { id: "site", name: "Product docs", description: null },
          working_draft: { id: "draft", home_page_id: "page", version: 7 },
          pages: [],
          navigation: { version: 1, nodes: [] },
          routing: { version: 1, aliases: [], rules: [] },
          openapi_operations: [],
        },
      });
    render(
      <DocumentationDraftPreviewPage
        projectId="project"
        versionSlug="main"
        siteId="site"
        loadPreview={loadPreview}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Saved draft preview unavailable",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Product docs preview" })).toBeInTheDocument();
  });

  it("labels and renders the complete latest server-saved draft", async () => {
    render(
      <DocumentationDraftPreviewPage
        projectId="project"
        versionSlug="main"
        siteId="site"
        loadPreview={async () => ({
          preview: {
            site: { id: "site", name: "Product docs", description: null },
            working_draft: { id: "draft", home_page_id: "page", version: 7 },
            pages: [
              {
                id: "page",
                title: "Install",
                canonical_path: "install",
                version: 2,
                blocks: [
                  {
                    id: "block",
                    kind: "paragraph",
                    position: 1,
                    expected_version: 1,
                    text: "Saved preview copy",
                  },
                ],
              },
            ],
            navigation: { version: 1, nodes: [] },
            routing: { version: 1, aliases: [], rules: [] },
            openapi_operations: [],
          },
        })}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Product docs preview" })).toBeInTheDocument();
    expect(screen.getByText("Saved preview copy")).toBeInTheDocument();
    expect(screen.getByText(/server-saved draft version 7/i)).toBeInTheDocument();
  });
});
