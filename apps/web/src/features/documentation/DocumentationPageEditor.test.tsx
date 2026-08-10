import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationPageEditor } from "./DocumentationPageEditor";

describe("DocumentationPageEditor", () => {
  const editParagraph = async (value: string) => {
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: "Paragraph text" }),
      ).toHaveAttribute("contenteditable", "true"),
    );
    const field = screen.getByRole("textbox", { name: "Paragraph text" });
    field.innerHTML = `<p blockid="block" field="text" data-ossie-prose-node="paragraph">${value}</p>`;
    fireEvent.input(field);
    return field;
  };

  it("offers retry when the Documentation Page cannot be loaded", async () => {
    const loadPage = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        page: {
          id: "page",
          title: "Home",
          canonical_path: "home",
          version: 1,
          blocks: [],
        },
      });
    render(
      <DocumentationPageEditor
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canWrite={false}
        loadPage={loadPage}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Could not load Documentation Page.",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
    expect(loadPage).toHaveBeenCalledTimes(2);
  });

  it("edits relational blocks and reports truthful save state", async () => {
    const savePage = vi
      .fn()
      .mockResolvedValueOnce({
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
              expected_version: 2,
              text: "Updated copy",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        page: {
          id: "page",
          title: "Home",
          canonical_path: "home",
          version: 3,
          blocks: [
            {
              id: "block",
              kind: "paragraph" as const,
              position: 1,
              expected_version: 3,
              text: "Second copy",
            },
          ],
        },
      });
    render(
      <DocumentationPageEditor
        projectId="project"
        versionSlug="main"
        siteId="site"
        pageId="page"
        canWrite
        autosaveDelayMs={10_000}
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
    await editParagraph("Updated copy");
    expect(await screen.findByText("Unsaved changes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Page" }));
    await waitFor(() => expect(savePage).toHaveBeenCalled());
    expect(await screen.findByText("Saved")).toBeInTheDocument();

    await editParagraph("Second copy");
    expect(await screen.findByText("Unsaved changes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Page" }));
    await waitFor(() => expect(savePage).toHaveBeenCalledTimes(2));
    expect(savePage.mock.calls[1]?.[4]).toMatchObject({
      expected_page_version: 2,
      blocks: [
        expect.objectContaining({
          id: "block",
          expected_version: 2,
          text: "Second copy",
        }),
      ],
    });
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
    const text = await editParagraph("Unsaved local copy");
    expect(
      await screen.findByText("Conflict — local work is preserved"),
    ).toBeInTheDocument();
    expect(text).toHaveTextContent("Unsaved local copy");
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
    await waitFor(() =>
      expect(uploadAsset).toHaveBeenCalledWith("project", "main", "site", file),
    );
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
        loadOptions={async () => ({
          preview: {
            site: { id: "site", name: "Docs", description: null },
            working_draft: {
              id: "draft",
              home_page_id: "page",
              version: 1,
            },
            pages: [],
            navigation: { version: 1, nodes: [] },
            routing: { version: 1, aliases: [], rules: [] },
            openapi_operations: [
              {
                id: "operation",
                openapi_source_id: "01K00000000000000000000000",
                destination_key: "list-widgets",
                method: "get",
                path: "/widgets",
                summary: "List widgets",
              },
            ],
          },
        })}
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
    await screen.findByRole("option", {
      name: "GET /widgets · List widgets",
    });
    fireEvent.change(screen.getByLabelText("API operation"), {
      target: { value: "operation" },
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
