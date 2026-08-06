import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicDocumentationReaderPage } from "./PublicDocumentationReaderPage";
import {
  DocumentationApiError,
  searchPublicDocumentation,
} from "../../lib/documentationApi";

type SearchResult = Awaited<
  ReturnType<typeof searchPublicDocumentation>
>["results"][number];

describe("PublicDocumentationReaderPage", () => {
  afterEach(() => {
    document.head
      .querySelectorAll("[data-documentation-metadata]")
      .forEach((node) => node.remove());
    vi.restoreAllMocks();
  });

  const loadMinimalSnapshot = async () => ({
    site: { name: "Product docs", description: null },
    revision: { primary_language: "en-US", home_page_id: "page" },
    pages: [{ id: "page", title: "Home", canonical_path: "home" }],
    navigation: [
      { id: "nav", kind: "page" as const, page_id: "page", label: null },
    ],
    openapi_operations: [],
    page: {
      id: "page",
      title: "Home",
      description: null,
      canonical_path: "home",
      blocks: [],
    },
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
          navigation: [
            { id: "nav", kind: "page", page_id: "page", label: null },
          ],
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
              {
                id: "image",
                kind: "image",
                position: 3,
                expected_version: 1,
                asset_id: "asset",
                alt_text: "Installer screenshot",
                caption: "Choose the safe option.",
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

    expect(
      await screen.findByRole("heading", { name: "Install" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Follow these steps.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /List widgets/ })).toHaveAttribute(
      "href",
      "/docs/product-docs/operations/get-widgets",
    );
    expect(
      screen.getByRole("img", { name: "Installer screenshot" }),
    ).toHaveAttribute(
      "src",
      "/api/v1/public/publish-links/product-docs/documentation/assets/asset/file",
    );
    await waitFor(() => expect(document.title).toBe("Install · Product docs"));
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      expect.stringContaining("/docs/product-docs/install"),
    );
    expect(screen.getByRole("searchbox")).toHaveStyle({
      backgroundColor: "rgb(255, 255, 255)",
    });

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "install" },
    });
    fireEvent.submit(screen.getByRole("search"));
    await waitFor(() =>
      expect(screen.getByText("1 result")).toBeInTheDocument(),
    );
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
    expect(
      await screen.findByRole("heading", { name: "Documentation unavailable" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Product docs")).not.toBeInTheDocument();
  });

  it("uses the native operation-route fallback without logging an adapter error", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <PublicDocumentationReaderPage
        slug="product-docs"
        pagePath="operations/get-widgets"
        loadPage={async () => ({
          site: { name: "Product docs", description: null },
          revision: { primary_language: "en-US", home_page_id: "page" },
          pages: [{ id: "page", title: "Install", canonical_path: "install" }],
          navigation: [],
          openapi_operations: [],
          page: {
            id: "operation-page",
            title: "GET /widgets",
            description: null,
            canonical_path: "operations/get-widgets",
            blocks: [],
          },
        })}
        search={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "GET /widgets" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(consoleError).not.toHaveBeenCalled());
    expect(
      screen.queryByTestId("documentation-publication-reader-chrome"),
    ).not.toBeInTheDocument();
  });

  it("unlocks password-protected Documentation through a shared viewer session", async () => {
    const loadPage = vi
      .fn()
      .mockRejectedValueOnce(
        new DocumentationApiError(
          401,
          "publish_link_password_required",
          "Password required",
        ),
      )
      .mockResolvedValue({
        site: { name: "Product docs", description: null },
        revision: { primary_language: "en-US", home_page_id: "page" },
        pages: [{ id: "page", title: "Home", canonical_path: "home" }],
        navigation: [],
        openapi_operations: [],
        page: {
          id: "page",
          title: "Home",
          description: null,
          canonical_path: "home",
          blocks: [],
        },
      });
    const createViewerSession = vi.fn(async () => undefined);
    render(
      <PublicDocumentationReaderPage
        slug="protected-docs"
        loadPage={loadPage}
        search={vi.fn()}
        createViewerSession={createViewerSession}
      />,
    );
    fireEvent.change(await screen.findByLabelText("Publish Link password"), {
      target: { value: "safe local password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "Home" });
    expect(createViewerSession).toHaveBeenCalledWith("protected-docs", {
      password: "safe local password",
    });
  });

  it("shows a truthful search error, clears loading, and supports retry", async () => {
    const search = vi
      .fn()
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce({ results: [] });
    render(
      <PublicDocumentationReaderPage
        slug="product-docs"
        loadPage={loadMinimalSnapshot}
        search={search}
      />,
    );

    const input = await screen.findByRole("searchbox");
    fireEvent.change(input, { target: { value: "home" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Search is unavailable",
    );
    expect(screen.queryByText("Searching…")).not.toBeInTheDocument();

    fireEvent.submit(screen.getByRole("search"));
    expect(await screen.findByText("0 results")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ignores stale overlapping search responses and does not search whitespace", async () => {
    const deferred: Array<{
      query: string;
      resolve: (value: { results: SearchResult[] }) => void;
    }> = [];
    const search = vi.fn(
      (_slug: string, _version: string | undefined, query: string) =>
        new Promise<{ results: SearchResult[] }>((resolve) => {
          deferred.push({ query, resolve });
        }),
    );
    render(
      <PublicDocumentationReaderPage
        slug="product-docs"
        loadPage={loadMinimalSnapshot}
        search={search}
      />,
    );

    const input = await screen.findByRole("searchbox");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(screen.getByRole("search"));
    expect(search).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "first" } });
    fireEvent.submit(screen.getByRole("search"));
    fireEvent.change(input, { target: { value: "second" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(search).toHaveBeenCalledTimes(2);

    deferred[0]!.resolve({
      results: [
        {
          page_id: "first",
          title: "First result",
          excerpt: "stale",
          canonical_path: "first",
        },
      ],
    });
    await waitFor(() =>
      expect(screen.queryByText("First result")).not.toBeInTheDocument(),
    );
    deferred[1]!.resolve({
      results: [
        {
          page_id: "second",
          title: "Second result",
          excerpt: "current",
          canonical_path: "second",
        },
      ],
    });
    expect(await screen.findByText("Second result")).toBeInTheDocument();
  });
});
