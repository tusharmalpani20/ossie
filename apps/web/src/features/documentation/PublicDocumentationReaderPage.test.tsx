import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicDocumentationReaderPage } from "./PublicDocumentationReaderPage";

describe("PublicDocumentationReaderPage", () => {
  afterEach(() => {
    document.head.querySelectorAll("[data-documentation-metadata]").forEach((node) => node.remove());
  });

  it("renders the exact publication, metadata, navigation, and safe blocks", async () => {
    render(
      <PublicDocumentationReaderPage
        slug="product-docs"
        pagePath="install"
        loadPage={async () => ({
          site: { name: "Product docs", description: "Safe product help" },
          revision: { primary_language: "en-US", home_page_id: "page" },
          pages: [{ id: "page", title: "Install", canonical_path: "install" }],
          navigation: [{ id: "nav", kind: "page", page_id: "page", label: null }],
          openapi_operations: [
            {
              destination_key: "get-widgets",
              method: "get",
              path: "/widgets",
              summary: "List widgets",
            },
          ],
          page: {
            id: "page",
            title: "Install",
            description: "Install safely",
            canonical_path: "install",
            blocks: [
              {
                id: "paragraph",
                kind: "paragraph",
                position: 1,
                expected_version: 1,
                text: "Follow these steps.",
              },
              {
                id: "operation",
                kind: "api_reference",
                position: 2,
                expected_version: 1,
                openapi_source_id: "source",
                operation_key: "get-widgets",
              },
            ],
          },
        })}
        search={async () => ({
          results: [
            {
              page_id: "page",
              title: "Install",
              excerpt: "Install safely",
              canonical_path: "install",
            },
          ],
        })}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Install" })).toBeInTheDocument();
    expect(screen.getByText("Follow these steps.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /List widgets/ })).toHaveAttribute(
      "href",
      "/docs/product-docs/operations/get-widgets",
    );
    expect(document.title).toBe("Install · Product docs");
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      expect.stringContaining("/docs/product-docs/install"),
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "install" },
    });
    fireEvent.submit(screen.getByRole("search"));
    await waitFor(() => expect(screen.getByText("1 result")).toBeInTheDocument());
    expect(screen.getAllByRole("link", { name: "Install" })[0]).toHaveAttribute(
      "href",
      "/docs/product-docs/install",
    );
  });

  it("does not leak publication details from an unavailable link", async () => {
    render(
      <PublicDocumentationReaderPage
        slug="missing"
        loadPage={vi.fn(async () => {
          throw new Error("not found");
        })}
        search={vi.fn()}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Documentation unavailable" })).toBeInTheDocument();
    expect(screen.queryByText("Product docs")).not.toBeInTheDocument();
  });
});
