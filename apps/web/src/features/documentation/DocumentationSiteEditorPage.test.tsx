import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationSiteEditorPage } from "./DocumentationSiteEditorPage";

describe("DocumentationSiteEditorPage", () => {
  it("gives the workbench an explicit loading state", () => {
    render(
      <DocumentationSiteEditorPage
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite
        canPublish
        loadPreview={() => new Promise(() => undefined)}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Loading Documentation Site" }),
    ).toBeInTheDocument();
  });

  it("explains when the saved Documentation Site cannot be loaded", async () => {
    render(
      <DocumentationSiteEditorPage
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite
        canPublish
        loadPreview={async () => {
          throw new Error("offline");
        }}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Documentation Site unavailable",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Documentation Site could not be loaded.",
    );
  });

  it("separates authoring from administration while keeping the workbench status visible", async () => {
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
            navigation: { version: 1, nodes: [] },
            routing: { version: 1, aliases: [], rules: [] },
            openapi_operations: [],
          },
        })}
      />,
    );

    expect(await screen.findByRole("tab", { name: "Author" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("link", { name: "Install" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Edition lifecycle" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Publish" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Documentation workbench status" }),
    ).toHaveTextContent("Saved draft loaded.");

    fireEvent.click(screen.getByRole("tab", { name: "Publish" }));
    expect(
      await screen.findByRole("heading", { name: "Publish" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Documentation workbench status" }),
    ).toHaveTextContent("Saved draft loaded.");
    fireEvent.click(screen.getByRole("tab", { name: "Author" }));
    expect(screen.getByRole("link", { name: "Install" })).toBeInTheDocument();
  });

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
            navigation: { version: 1, nodes: [] },
            routing: { version: 1, aliases: [], rules: [] },
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
    fireEvent.click(screen.getByRole("tab", { name: "Publish" }));
    fireEvent.click(screen.getByRole("button", { name: "Create revision" }));
    await waitFor(() =>
      expect(createRevision).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        1,
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
            navigation: { version: 1, nodes: [] },
            routing: { version: 1, aliases: [], rules: [] },
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

  it("treats an archived Edition as read-only even for an author", async () => {
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
            edition: {
              id: "edition",
              title: "Product docs",
              description: null,
              primary_language: "en-US",
              status: "archived",
              effective_status: "archived",
              read_only_reason: "This Documentation Site Edition is archived.",
              archived_at: "2026-07-30T00:00:00.000Z",
              version: 2,
            },
            working_draft: { id: "draft", home_page_id: null, version: 1 },
            pages: [],
            navigation: { version: 1, nodes: [] },
            routing: { version: 1, aliases: [], rules: [] },
            openapi_operations: [],
          },
        })}
        createRevision={vi.fn()}
      />,
    );

    expect(
      await screen.findByText("This Documentation Site Edition is archived."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create revision" }),
    ).not.toBeInTheDocument();
  });
});
