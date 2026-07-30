import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationPageEditor } from "./DocumentationPageEditor";

describe("DocumentationPageEditor", () => {
  it("edits relational blocks and reports truthful save state", async () => {
    const savePage = vi.fn(async () => ({
      page: {
        id: "page",
        title: "Home",
        canonical_path: "home",
        version: 2,
        blocks: [
          {
            id: "block",
            kind: "paragraph" as const,
            position: 1,
            expected_version: 1,
            text: "Updated copy",
          },
        ],
      },
    }));
    render(
      <DocumentationPageEditor
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canWrite
        loadPage={async () => ({
          page: {
            id: "page",
            title: "Home",
            canonical_path: "home",
            version: 1,
            blocks: [
              {
                id: "block",
                kind: "paragraph",
                position: 1,
                expected_version: 1,
                text: "Initial copy",
              },
            ],
          },
        })}
        savePage={savePage}
      />,
    );
    const text = await screen.findByLabelText("Paragraph text");
    fireEvent.change(text, { target: { value: "Updated copy" } });
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Page" }));
    await waitFor(() => expect(savePage).toHaveBeenCalled());
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("renders Viewer state without mutation controls", async () => {
    render(
      <DocumentationPageEditor
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canWrite={false}
        loadPage={async () => ({
          page: {
            id: "page",
            title: "Home",
            canonical_path: "home",
            version: 1,
            blocks: [
              {
                id: "block",
                kind: "paragraph",
                position: 1,
                expected_version: 1,
                text: "Saved Viewer copy",
              },
            ],
          },
        })}
        savePage={vi.fn()}
      />,
    );
    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save Page" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Saved Viewer copy")).toBeInTheDocument();
  });

  it("autosaves and preserves local work when the server reports a conflict", async () => {
    const savePage = vi.fn(async () => {
      throw new Error("conflict");
    });
    render(
      <DocumentationPageEditor
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canWrite
        autosaveDelayMs={10}
        loadPage={async () => ({
          page: {
            id: "page",
            title: "Home",
            canonical_path: "home",
            version: 1,
            blocks: [
              {
                id: "block",
                kind: "paragraph",
                position: 1,
                expected_version: 1,
                text: "Initial copy",
              },
            ],
          },
        })}
        savePage={savePage}
      />,
    );
    const text = await screen.findByLabelText("Paragraph text");
    fireEvent.change(text, { target: { value: "Unsaved local copy" } });
    expect(
      await screen.findByText("Conflict — local work is preserved"),
    ).toBeInTheDocument();
    expect(text).toHaveValue("Unsaved local copy");
  });

  it("uploads a protected image with required alternative text and attaches it", async () => {
    const uploadAsset = vi.fn(async () => ({
      asset: {
        id: "asset",
        mime_type: "image/png",
        width: 1,
        height: 1,
      },
    }));
    const savePage = vi.fn(async (_project, _version, _site, _page, input) => ({
      page: {
        id: "page",
        title: "Home",
        canonical_path: "home",
        version: 2,
        blocks: input.blocks,
      },
    }));
    render(
      <DocumentationPageEditor
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canWrite
        loadPage={async () => ({
          page: {
            id: "page",
            title: "Home",
            canonical_path: "home",
            version: 1,
            blocks: [],
          },
        })}
        savePage={savePage}
        uploadAsset={uploadAsset}
      />,
    );
    const file = new File(["png"], "pixel.png", { type: "image/png" });
    fireEvent.change(await screen.findByLabelText("Documentation image"), {
      target: { files: [file] },
    });
    fireEvent.change(screen.getByLabelText("Image alternative text"), {
      target: { value: "Installer dialog" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Upload and add image" }),
    );
    await waitFor(() => expect(uploadAsset).toHaveBeenCalled());
    expect(
      await screen.findByText(
        "Image added. Save the Page to retain the reference.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Page" }));
    await waitFor(() =>
      expect(savePage).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        "page",
        expect.objectContaining({
          blocks: [
            expect.objectContaining({
              kind: "image",
              source: { kind: "documentation_asset", id: "asset" },
              alt_text: "Installer dialog",
            }),
          ],
        }),
      ),
    );
  });

  it("authors every non-image first-slice safe block through typed controls", async () => {
    const savePage = vi.fn(async (_project, _version, _site, _page, input) => ({
      page: {
        id: "page",
        title: "Home",
        canonical_path: "home",
        version: 2,
        blocks: input.blocks,
      },
    }));
    render(
      <DocumentationPageEditor
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canWrite
        autosaveDelayMs={60_000}
        loadPage={async () => ({
          page: {
            id: "page",
            title: "Home",
            canonical_path: "home",
            version: 1,
            blocks: [],
          },
        })}
        savePage={savePage}
      />,
    );
    const kind = await screen.findByLabelText("New block type");
    const addTextBlock = (blockKind: string, text: string, button: string) => {
      fireEvent.change(kind, { target: { value: blockKind } });
      fireEvent.change(
        document.getElementById("new-documentation-block-primary")!,
        { target: { value: text } },
      );
      fireEvent.click(screen.getByRole("button", { name: button }));
    };
    addTextBlock("paragraph", "Introduction", "Add paragraph block");
    addTextBlock("heading", "Install", "Add heading block");
    addTextBlock("ordered_list", "One\nTwo", "Add ordered list block");
    addTextBlock("unordered_list", "Alpha\nBeta", "Add unordered list block");
    fireEvent.change(kind, { target: { value: "code" } });
    fireEvent.change(screen.getByLabelText("Code"), {
      target: { value: "pnpm install" },
    });
    fireEvent.change(screen.getByLabelText("Code language"), {
      target: { value: "bash" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add code block" }));
    fireEvent.change(kind, { target: { value: "link" } });
    fireEvent.change(screen.getByLabelText("Link label"), {
      target: { value: "Ossie" },
    });
    fireEvent.change(screen.getByLabelText("Link URL"), {
      target: { value: "https://example.test/docs" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add link block" }));
    fireEvent.change(kind, { target: { value: "divider" } });
    fireEvent.click(screen.getByRole("button", { name: "Add divider block" }));
    fireEvent.change(kind, { target: { value: "api_reference" } });
    fireEvent.change(screen.getByLabelText("OpenAPI Source ID"), {
      target: { value: "01K00000000000000000000000" },
    });
    fireEvent.change(screen.getByLabelText("Operation key (optional)"), {
      target: { value: "list-widgets" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add api reference block" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Page" }));

    await waitFor(() => expect(savePage).toHaveBeenCalled());
    expect(
      savePage.mock.calls
        .at(-1)?.[4]
        .blocks.map((block: { kind: string }) => block.kind),
    ).toEqual([
      "paragraph",
      "heading",
      "ordered_list",
      "unordered_list",
      "code",
      "link",
      "divider",
      "api_reference",
    ]);
  });

  it("changes the canonical path with an explicit permanent-alias warning", async () => {
    const updatePage = vi.fn(async () => ({
      page: {
        id: "page",
        title: "Install",
        canonical_path: "install-guide",
        version: 2,
        blocks: [],
      },
    }));
    render(
      <DocumentationPageEditor
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canWrite
        loadPage={async () => ({
          page: {
            id: "page",
            title: "Install",
            canonical_path: "install",
            version: 1,
            blocks: [],
          },
        })}
        savePage={vi.fn()}
        updatePage={updatePage}
      />,
    );
    fireEvent.change(await screen.findByLabelText("Canonical path"), {
      target: { value: "install-guide" },
    });
    expect(
      screen.getByText("The former path will become a permanent alias."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Page details" }));
    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        "page",
        {
          expected_version: 1,
          title: "Install",
          canonical_path: "install-guide",
        },
      ),
    );
    expect(
      await screen.findByText("Page moved. install is now a permanent alias."),
    ).toBeInTheDocument();
  });
});
