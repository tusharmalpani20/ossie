import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocumentationDraftPreviewPage } from "./DocumentationDraftPreviewPage";

describe("DocumentationDraftPreviewPage", () => {
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
