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
    expect(await screen.findByText("Conflict — local work is preserved")).toBeInTheDocument();
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
      await screen.findByText("Image added. Save the Page to retain the reference."),
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
              asset_id: "asset",
              alt_text: "Installer dialog",
            }),
          ],
        }),
      ),
    );
  });
});
