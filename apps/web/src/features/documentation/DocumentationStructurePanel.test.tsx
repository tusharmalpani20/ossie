import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentationStructurePanel } from "./DocumentationStructurePanel";

const preview = {
  site: { id: "site", name: "Docs", description: null },
  working_draft: { id: "draft", home_page_id: "page-1", version: 2 },
  pages: [
    {
      id: "page-1",
      title: "Home",
      canonical_path: "home",
      version: 1,
      blocks: [],
    },
  ],
  navigation: { version: 1, nodes: [] },
  routing: { version: 1, aliases: [], rules: [] },
  openapi_operations: [],
};

describe("DocumentationStructurePanel", () => {
  it("creates a Page and saves accessible navigation and gone routing", async () => {
    const createPage = vi.fn(async () => ({
      page: {
        id: "page-2",
        title: "Install",
        canonical_path: "install",
        version: 1,
        blocks: [],
      },
    }));
    const replaceNavigation = vi.fn(async (_project, _version, _site, input) => ({
      navigation: { id: "nav", version: 2, nodes: input.nodes },
    }));
    const replaceRouting = vi.fn(async (_project, _version, _site, input) => ({
      routing: { id: "routing", version: 2, rules: input.rules, aliases: [] },
    }));
    render(
      <DocumentationStructurePanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite
        preview={preview}
        createPage={createPage}
        replaceNavigation={replaceNavigation}
        replaceRouting={replaceRouting}
      />,
    );

    fireEvent.change(screen.getByLabelText("Page title"), {
      target: { value: "Install" },
    });
    fireEvent.change(screen.getByLabelText("Page path"), {
      target: { value: "install" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Page" }));
    await waitFor(() => expect(createPage).toHaveBeenCalled());

    fireEvent.click(
      screen.getByRole("button", { name: "Save Page navigation" }),
    );
    await waitFor(() =>
      expect(replaceNavigation).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        expect.objectContaining({ expected_version: 1 }),
      ),
    );

    fireEvent.change(screen.getByLabelText("Retired path"), {
      target: { value: "old-install" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Mark path gone" }));
    await waitFor(() =>
      expect(replaceRouting).toHaveBeenCalledWith(
        "project",
        "main",
        "site",
        expect.objectContaining({
          expected_version: 1,
          rules: [
            expect.objectContaining({
              source_path: "old-install",
              outcome: "gone",
            }),
          ],
        }),
      ),
    );
  });

  it("does not expose structure mutation controls to a Viewer", () => {
    render(
      <DocumentationStructurePanel
        projectId="project"
        versionSlug="main"
        siteId="site"
        canWrite={false}
        preview={preview}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Create Page" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Structure is read-only.")).toBeInTheDocument();
  });
});
