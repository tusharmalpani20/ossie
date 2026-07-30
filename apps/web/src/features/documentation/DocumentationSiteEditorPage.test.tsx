import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationSiteEditorPage } from "./DocumentationSiteEditorPage";

describe("DocumentationSiteEditorPage", () => {
  it("loads the saved draft, exposes page navigation, and checkpoints it", async () => {
    const createRevision = vi.fn(async () => ({
      revision: { id: "revision-1", revision_number: 1 },
    }));
    render(
      <DocumentationSiteEditorPage
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite
        canPublish
        loadPreview={async () => ({
          preview: {
            site: { id: "site", name: "Product docs", description: null },
            working_draft: { id: "draft", home_page_id: "page", version: 3 },
            pages: [
              {
                id: "page",
                title: "Install",
                canonical_path: "install",
                version: 2,
                blocks: [],
              },
            ],
            openapi_operations: [],
          },
        })}
        createRevision={createRevision}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Product docs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Install" })).toHaveAttribute(
      "href",
      "/projects/project/versions/main/documentation/site/pages/page",
    );
    fireEvent.click(screen.getByRole("button", { name: "Create revision" }));
    await waitFor(() =>
      expect(createRevision).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        3,
      ),
    );
    expect(await screen.findByText("Revision 1 is ready.")).toBeInTheDocument();
  });

  it("keeps publishing controls away from a Viewer", async () => {
    render(
      <DocumentationSiteEditorPage
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite={false}
        canPublish={false}
        loadPreview={async () => ({
          preview: {
            site: { id: "site", name: "Product docs", description: null },
            working_draft: { id: "draft", home_page_id: null, version: 1 },
            pages: [],
            openapi_operations: [],
          },
        })}
        createRevision={vi.fn()}
      />,
    );
    expect(await screen.findByText("No Pages yet.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create revision" }),
    ).not.toBeInTheDocument();
  });
});
